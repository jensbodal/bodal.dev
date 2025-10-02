import init, { DigitalBloom } from 'digital-bloom-wasm';
import * as Tone from 'tone';
import { initPWA } from './pwa/manifest';

// --- TYPE DEFINITIONS ---
type PhysicsMode = 'vine' | 'gravity' | 'bounce' | 'burst' | 'lightning' | 'constellation' | 'vortex';

interface Point {
    x: number;
    y: number;
}

// --- CONFIGURATION ---
const CONFIG = {
    colors: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96'],
    touch: { minDrawDistance: 8 },
    performance: { maxVinesPerInteraction: 2 },
};

// --- STATE ---
let brushSize = 4;
let zenMode = false;
let isPlayingSound = false;
let isDrawing = false;
let currentMode: PhysicsMode = 'vine';
let selectedColorIndex = 0;
let lastPos: Point = { x: 0, y: 0 };
let digitalBloom: DigitalBloom;
let masterVolume = 0.7; // Volume control (0.0 - 1.0)
let isMuted = true; // Start muted
let audioInitialized = false;

// --- AUDIO SETUP ---
let ambientDrone: Tone.PolySynth | null = null;
let bellSynth: Tone.Synth | null = null;
let padSynth: Tone.Synth | null = null;
let ambientLoop: Tone.Loop | null = null;
let reverb: Tone.Reverb | null = null;
let masterGain: Tone.Gain | null = null;

const bellNotes = ["C3", "D3", "E3", "G3", "A3", "C4", "E4"]; // Pentatonic scale

async function setupAudio() {
    if (audioInitialized) {
        console.log('[Audio] Already initialized, skipping');
        return;
    }

    try {
        console.log('[Audio] Starting initialization...');
        console.log('[Audio] Tone.context.state:', Tone.context.state);

        // iOS 16.4+: Set web audio session type to 'playback' for silent mode support
        // This is required for WKWebView which has its own separate audio session
        if ('audioSession' in navigator) {
            try {
                (navigator as any).audioSession.type = 'playback';
                console.log('[Audio] Set navigator.audioSession.type to "playback" for iOS silent mode');
            } catch (e) {
                console.log('[Audio] Could not set audioSession.type:', e);
            }
        } else {
            console.log('[Audio] navigator.audioSession not available (pre-iOS 16.4 or not iOS)');
        }

        // Create master gain for overall volume control (increased for iOS)
        masterGain = new Tone.Gain(1.5).toDestination();
        console.log('[Audio] Master gain created');

        // Create reverb for ambient space
        reverb = new Tone.Reverb({
            decay: 6,
            preDelay: 0.05
        }).connect(masterGain);
        console.log('[Audio] Reverb created, generating...');

        // Wait for reverb to be ready
        await reverb.generate();
        console.log('[Audio] Reverb generated successfully');

        // iOS: Add small delay to ensure reverb is fully ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Ambient drone layer (continuous background)
        ambientDrone = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 3,
            modulationIndex: 10,
            envelope: { attack: 4, decay: 2, sustain: 0.8, release: 8 },
            modulation: { type: 'sine' },
            modulationEnvelope: { attack: 2, decay: 0, sustain: 1, release: 4 }
        }).connect(reverb);
        ambientDrone.volume.value = -8; // Increased from -12

        // Pad layer for depth
        padSynth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 3, decay: 1, sustain: 0.7, release: 6 }
        }).connect(reverb);
        padSynth.volume.value = -10; // Increased from -14

        // Singing bowl / bell tone using FMSynth for smooth, resonant sound
        bellSynth = new Tone.Synth({
            oscillator: {
                type: 'fmsine',
                modulationType: 'sine',
                modulationIndex: 2,
                harmonicity: 2.5
            },
            envelope: {
                attack: 0.02,
                decay: 1.2,
                sustain: 0.15,
                release: 3.5
            }
        }).connect(reverb);
        bellSynth.volume.value = -3; // Increased from -6

        console.log('[Audio] All synths created');

        // Ambient loop - plays drone and pad notes slowly
        ambientLoop = new Tone.Loop(time => {
            if (ambientDrone && isPlayingSound) {
                // Play subtle drone chord progression
                const droneNotes = [["C2", "G2", "C3"], ["D2", "A2", "D3"], ["G2", "D3", "G3"]];
                const chordIndex = Math.floor(Math.random() * droneNotes.length);
                ambientDrone.triggerAttackRelease(droneNotes[chordIndex], "2n", time);
            }
            if (padSynth && isPlayingSound && Math.random() > 0.7) {
                // Occasionally add pad notes
                const padNotes = ["C4", "E4", "G4", "A4"];
                const note = padNotes[Math.floor(Math.random() * padNotes.length)];
                padSynth.triggerAttackRelease(note, "4n", time);
            }
        }, "2n").start(0); // Slower interval for ambient feel

        audioInitialized = true;
        console.log('[Audio] Initialization complete');

        // Show success feedback
        showAudioFeedback('🔊 Audio ready', 2000);
    } catch (error) {
        console.error('[Audio] Initialization failed:', error);
        audioInitialized = false;
        showAudioFeedback('⚠️ Audio failed - check console', 3000);
        throw error;
    }
}

function showAudioFeedback(message: string, duration: number) {
    const audioFeedback = document.getElementById('audioFeedback');
    if (!audioFeedback) return;
    audioFeedback.textContent = message;
    audioFeedback.style.opacity = '1';
    setTimeout(() => {
        audioFeedback.style.opacity = '0';
    }, duration);
}

function playChime(y: number) {
    if (!bellSynth) {
        console.log('[Audio] Bell synth not initialized');
        return;
    }

    // iOS: Ensure context is running before playing
    if (Tone.context.state !== 'running') {
        console.log('[Audio] Context not running, skipping chime');
        return;
    }

    const noteIndex = Math.min(
        bellNotes.length - 1,
        Math.floor((1 - (y / window.innerHeight)) * bellNotes.length)
    );
    const note = bellNotes[noteIndex];

    try {
        bellSynth.triggerAttackRelease(note, "1.5n", Tone.now()); // iOS: Use explicit timing
    } catch (error) {
        console.error('[Audio] Error playing chime:', error);
    }
}

function vibrate(ms: number = 20) {
    if ('vibrate' in navigator) {
        navigator.vibrate(ms);
    }
}

// --- UI ELEMENTS ---
const canvas = document.getElementById('artCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const startButton = document.getElementById('startButton')!;
const introOverlay = document.getElementById('introOverlay')!;
const soundButton = document.getElementById('soundButton')!;
const zenButton = document.getElementById('zenButton')!;
const clearButton = document.getElementById('clearButton')!;
const increaseBrushBtn = document.getElementById('increaseBrush')!;
const decreaseBrushBtn = document.getElementById('decreaseBrush')!;
const brushSizeEl = document.getElementById('brushSize')!;
const physicsIndicator = document.getElementById('physicsIndicator')!;
const modeButtons = document.querySelectorAll('.mode-button');
const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
const volumeIcon = document.getElementById('volumeIcon')!;

function showPhysicsIndicator(icon: string) {
    physicsIndicator.innerHTML = icon.startsWith('<svg') ? icon : `<span>${icon}</span>`;
    physicsIndicator.style.animation = 'none';
    setTimeout(() => {
        physicsIndicator.style.animation = 'physics-pop 1s ease-out';
    }, 10);
}

modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        vibrate();
        currentMode = (button as HTMLElement).dataset.mode as PhysicsMode;
        modeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const svg = button.querySelector('svg');
        if (svg) showPhysicsIndicator(svg.outerHTML);
    });
});

startButton.addEventListener('click', () => {
    introOverlay.style.opacity = '0';
    setTimeout(() => introOverlay.style.display = 'none', 500);
});

soundButton.addEventListener('click', async () => {
    vibrate();

    try {
        // iOS 16.4+: Set audio session type FIRST for silent mode support
        if ('audioSession' in navigator) {
            try {
                (navigator as any).audioSession.type = 'playback';
                console.log('[Audio] Set navigator.audioSession.type to "playback" for iOS silent mode');
            } catch (e) {
                console.log('[Audio] Could not set audioSession.type:', e);
            }
        }

        // iOS: Ensure audio context is started
        if (Tone.context.state !== 'running') {
            console.log('[Audio] Starting Tone.js context...');
            await Tone.start();
            console.log('[Audio] Tone.js context started, state:', Tone.context.state);
        }

        // iOS: Explicitly resume if suspended
        if (Tone.context.state === 'suspended') {
            console.log('[Audio] Context suspended, resuming...');
            await Tone.context.resume();
        }

        // Initialize audio if not already done
        if (!audioInitialized) {
            console.log('[Audio] Setting up audio...');
            await setupAudio();
            console.log('[Audio] Setup complete');
        }

        const btnSpan = soundButton.querySelector('span');

        // Check current state: if currently playing, then pause and mute
        // If currently paused, then play and unmute
        if (isPlayingSound) {
            // Currently playing → pause and mute
            console.log('[Audio] Muting and pausing transport...');
            isPlayingSound = false;
            isMuted = true;
            updateVolume();
            updateVolumeIcon();

            Tone.Transport.pause();
            if (btnSpan) btnSpan.textContent = '▶';
            soundButton.classList.remove('active');
            soundButton.setAttribute('title', 'Ambient Sound Off');
        } else {
            // Currently paused → play and unmute
            console.log('[Audio] Unmuting and starting transport...');
            isPlayingSound = true;
            isMuted = false;
            updateVolume();
            updateVolumeIcon();

            // Play test tone FIRST (must be synchronous with user gesture on iOS)
            if (bellSynth) {
                console.log('[Audio] Playing test bell tone...');
                bellSynth.triggerAttackRelease("C4", "0.3n", Tone.now());
                console.log('[Audio] Test tone triggered');
            }

            // Then start transport with explicit timing
            Tone.Transport.start('+0.1');
            console.log('[Audio] Transport started at', Tone.Transport.state);

            if (btnSpan) btnSpan.textContent = '❚❚';
            soundButton.classList.add('active');
            soundButton.setAttribute('title', 'Ambient Sound On');
        }
    } catch (error) {
        console.error('[Audio] Error in sound button handler:', error);
        alert('Audio initialization failed. Check console for details.');
    }
});

zenButton.addEventListener('click', () => {
    vibrate();
    zenMode = !zenMode;
    zenButton.classList.toggle('active');
});

clearButton.addEventListener('click', () => {
    vibrate(50);
    digitalBloom.clear();
});

function updateBrushSize(delta: number) {
    brushSize = Math.max(1, Math.min(10, brushSize + delta));
    brushSizeEl.textContent = brushSize.toString();
}

increaseBrushBtn.addEventListener('click', () => {
    vibrate();
    updateBrushSize(1);
});

decreaseBrushBtn.addEventListener('click', () => {
    vibrate();
    updateBrushSize(-1);
});

volumeSlider.addEventListener('input', (e) => {
    const newValue = parseFloat((e.target as HTMLInputElement).value);
    if (newValue > 0 && isMuted) {
        isMuted = false;
    }
    masterVolume = newValue;
    updateVolume();
    updateVolumeIcon();
});

volumeIcon.addEventListener('click', () => {
    vibrate();
    isMuted = !isMuted;
    updateVolume();
    updateVolumeIcon();
});

function updateVolume() {
    const effectiveVolume = isMuted ? 0 : masterVolume;

    if (ambientDrone) ambientDrone.volume.value = -8 + (effectiveVolume * 12);
    if (padSynth) padSynth.volume.value = -10 + (effectiveVolume * 12);
    if (bellSynth) bellSynth.volume.value = -3 + (effectiveVolume * 6);
    if (masterGain) masterGain.gain.value = isMuted ? 0 : (1.0 + (masterVolume * 0.5));

    console.log('[Audio] Volume updated:', { masterVolume, effectiveVolume, isMuted, gain: masterGain?.gain.value });
}

function updateVolumeIcon() {
    const iconSvg = volumeIcon.querySelector('svg');
    if (!iconSvg) return;

    if (isMuted || masterVolume === 0) {
        iconSvg.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6m0-6l6 6"/>';
        iconSvg.classList.add('text-red-400');
        iconSvg.classList.remove('text-cyan-400');
    } else if (masterVolume < 0.33) {
        iconSvg.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5zm11.07 8a4.5 4.5 0 0 0 0-2"/>';
        iconSvg.classList.remove('text-red-400');
        iconSvg.classList.add('text-cyan-400');
    } else if (masterVolume < 0.66) {
        iconSvg.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5zm11.07 8a4.5 4.5 0 0 0 0-2m-2.12-2.12a7 7 0 0 1 0 6.24"/>';
        iconSvg.classList.remove('text-red-400');
        iconSvg.classList.add('text-cyan-400');
    } else {
        iconSvg.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5zm11.07 8a4.5 4.5 0 0 0 0-2m-2.12-2.12a7 7 0 0 1 0 6.24m-2.12-2.12a3.5 3.5 0 0 1 0-2"/>';
        iconSvg.classList.remove('text-red-400');
        iconSvg.classList.add('text-cyan-400');
    }
}

// --- CANVAS & DRAWING LOGIC ---
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

function getEventCoords(e: MouseEvent | TouchEvent): Point {
    if ('touches' in e && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    const mouseEvent = e as MouseEvent;
    return { x: mouseEvent.clientX, y: mouseEvent.clientY };
}

function handleDrawStart(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    isDrawing = true;
    lastPos = getEventCoords(e);
    handleDraw(lastPos.x, lastPos.y);
}

function handleDraw(x: number, y: number) {
    if (currentMode !== 'vortex' && currentMode !== 'lightning') playChime(y);

    switch(currentMode) {
        case 'vine':
            digitalBloom.create_vine(x, y, brushSize);
            break;
        case 'gravity':
            digitalBloom.create_particles_gravity(x, y, 5, brushSize);
            break;
        case 'bounce':
            digitalBloom.create_particles_bounce(x, y, 3, brushSize);
            break;
        case 'burst':
            digitalBloom.create_particles_burst(x, y, 12, brushSize);
            break;
        case 'constellation':
            digitalBloom.create_particles_constellation(x, y, 5, brushSize);
            break;
        case 'lightning':
            digitalBloom.create_lightning(x, y, window.innerWidth, window.innerHeight);
            break;
        case 'vortex':
            digitalBloom.create_particles_vortex(x, y, 8, brushSize);
            break;
    }
}

function handleDrawMove(e: MouseEvent | TouchEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getEventCoords(e);
    const dx = pos.x - lastPos.x;
    const dy = pos.y - lastPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > CONFIG.touch.minDrawDistance) {
        const iterations = currentMode === 'vine' ? CONFIG.performance.maxVinesPerInteraction : 1;
        for (let i = 0; i < iterations; i++) {
            handleDraw(pos.x, pos.y);
        }
        lastPos = pos;
    }
}

function handleDrawEnd(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    isDrawing = false;
}

canvas.addEventListener('mousedown', handleDrawStart);
canvas.addEventListener('mousemove', handleDrawMove);
canvas.addEventListener('mouseup', handleDrawEnd);
canvas.addEventListener('mouseleave', handleDrawEnd);
canvas.addEventListener('touchstart', handleDrawStart);
canvas.addEventListener('touchmove', handleDrawMove);
canvas.addEventListener('touchend', handleDrawEnd);
canvas.addEventListener('touchcancel', handleDrawEnd);
window.addEventListener('resize', resizeCanvas);

// --- ANIMATION LOOP ---
interface Vine {
    points: Point[];
    color: string;
    line_width: number;
}

interface Particle {
    x: number;
    y: number;
    color: string;
    size: number;
    life: number;
}

interface Lightning {
    segments: Point[];
    branches: Point[][];
    color: string;
    line_width: number;
    life: number;
}

function drawVine(vine: Vine) {
    if (vine.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(vine.points[0].x, vine.points[0].y);
    for (let i = 1; i < vine.points.length; i++) {
        ctx.lineTo(vine.points[i].x, vine.points[i].y);
    }
    ctx.strokeStyle = vine.color;
    ctx.lineWidth = vine.line_width;
    ctx.stroke();
}

function drawParticle(particle: Particle) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    const alpha = Math.floor(particle.life * 255).toString(16).padStart(2, '0');
    ctx.fillStyle = particle.color + alpha;
    ctx.fill();
}

function drawLightning(lightning: Lightning) {
    if (lightning.segments.length < 2) return;

    const alpha = Math.floor(lightning.life * 255).toString(16).padStart(2, '0');

    // Draw main bolt
    ctx.beginPath();
    ctx.moveTo(lightning.segments[0].x, lightning.segments[0].y);
    for (let i = 1; i < lightning.segments.length; i++) {
        ctx.lineTo(lightning.segments[i].x, lightning.segments[i].y);
    }
    ctx.strokeStyle = lightning.color + alpha;
    ctx.lineWidth = lightning.line_width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw glow effect
    ctx.shadowBlur = 10 * lightning.life;
    ctx.shadowColor = lightning.color;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw branches
    for (const branch of lightning.branches) {
        if (branch.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(branch[0].x, branch[0].y);
        for (let i = 1; i < branch.length; i++) {
            ctx.lineTo(branch[i].x, branch[i].y);
        }
        ctx.strokeStyle = lightning.color + alpha;
        ctx.lineWidth = lightning.line_width * 0.6;
        ctx.stroke();
    }
}

function animate() {
    ctx.fillStyle = 'rgba(26, 26, 36, 0.08)'; // Softer, slower fade for dreamy trails
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    if (zenMode && Math.random() < 0.008) { // Slower, more meditative spawn rate
        handleDraw(
            Math.random() * window.innerWidth,
            Math.random() * window.innerHeight
        );
    }

    digitalBloom.update(window.innerWidth, window.innerHeight);

    const vines = digitalBloom.vines as Vine[];
    const grownVines = digitalBloom.grown_vines as Vine[];
    const particles = digitalBloom.particles as Particle[];
    const lightnings = digitalBloom.lightnings as Lightning[];

    // Draw lightning
    if (lightnings && Array.isArray(lightnings)) {
        for (const lightning of lightnings) {
            drawLightning(lightning);
        }
    }

    // Draw particles
    if (particles && Array.isArray(particles)) {
        for (const particle of particles) {
            drawParticle(particle);
        }
    }

    // Draw vines
    for (const vine of vines) {
        drawVine(vine);
    }

    for (const vine of grownVines) {
        drawVine(vine);
    }

    requestAnimationFrame(animate);
}

// --- INITIALIZATION ---
async function run() {
    try {
        console.log('Initializing Digital Bloom...');

        // Initialize PWA features
        initPWA();

        // Initialize WASM module
        // The WASM file will be resolved automatically by the bundler
        console.log('Loading WASM module...');
        await init();
        console.log('WASM loaded successfully');

        digitalBloom = new DigitalBloom();
        console.log('DigitalBloom instance created');

        resizeCanvas();
        animate();
        console.log('Animation started');

        // Initialize audio on startup (muted)
        try {
            await setupAudio();
            updateVolume(); // Apply muted state
            updateVolumeIcon(); // Update icon to show muted
            console.log('Audio initialized (muted)');
        } catch (error) {
            console.error('Audio initialization failed:', error);
            // Don't block app if audio fails
        }
    } catch (error) {
        console.error('Initialization failed:', error);

        // Show error on screen for iOS debugging
        const errorMessage = error instanceof Error
            ? (error.stack || error.message || error.toString())
            : (error !== null && error !== undefined ? String(error) : 'Unknown error occurred');

        document.body.innerHTML = `
            <div style="padding: 20px; color: white; font-family: monospace; background: #1a1a24;">
                <h2 style="color: #ff6b6b;">Initialization Error</h2>
                <pre style="background: #2a2a34; padding: 10px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap;">${errorMessage}</pre>
            </div>
        `;
    }
}

// Global error handler for iOS debugging
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    document.body.innerHTML = `
        <div style="padding: 20px; color: white; font-family: monospace; background: #1a1a24;">
            <h2 style="color: #ff6b6b;">Runtime Error</h2>
            <pre style="background: #2a2a34; padding: 10px; border-radius: 5px; overflow-x: auto;">${e.error?.stack || e.message}</pre>
        </div>
    `;
});

run();