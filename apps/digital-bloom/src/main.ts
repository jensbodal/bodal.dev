import init, { DigitalBloom } from 'digital-bloom-wasm';
import * as Tone from 'tone';
import { initPWA } from './pwa/manifest';
import { mediaSession } from './mediaSession';

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
const masterVolume = 0.7; // Fixed volume level
let isMuted = true; // Start muted
let audioInitialized = false;
let settingsVisible = false; // Settings panel starts collapsed

// Audio throttling to prevent rapid-fire retriggering
let lastChimeTime = 0;
const MIN_CHIME_INTERVAL_MS = 50; // Minimum 50ms between chimes (20 chimes/sec max)

// --- AUDIO SETUP ---
let ambientDrone: Tone.PolySynth | null = null;
let bellSynth: Tone.PolySynth | null = null;
let padSynth: Tone.Synth | null = null;
let ambientLoop: Tone.Loop | null = null;
let reverb: Tone.Reverb | null = null;
let masterGain: Tone.Gain | null = null;

const bellNotes = ["C3", "D3", "E3", "G3", "A3", "C4", "E4"]; // Pentatonic scale

async function setupAudio() {
    if (audioInitialized) {
        return;
    }

    try {
        // iOS 16.4+: Set web audio session type to 'playback' for silent mode support
        // This is required for WKWebView which has its own separate audio session
        if ('audioSession' in navigator) {
            try {
                (navigator as any).audioSession.type = 'playback';
            } catch (e) {
                // Silent fail - not critical
            }
        }

        // Create master gain for overall volume control
        masterGain = new Tone.Gain(1.2).toDestination();

        // Add limiter to prevent clipping from multiple simultaneous voices
        const limiter = new Tone.Limiter(-1).connect(masterGain);

        // Create reverb for ambient space
        reverb = new Tone.Reverb({
            decay: 6,
            preDelay: 0.05
        }).connect(limiter);

        // Wait for reverb to be ready
        await reverb.generate();

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

        // Singing bowl / bell tone using PolySynth for smooth overlapping notes
        bellSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: 'fmsine',
                modulationType: 'sine',
                modulationIndex: 2,
                harmonicity: 2.5
            },
            envelope: {
                attack: 0.08,  // Increased from 0.02 to prevent clicks
                decay: 1.2,
                sustain: 0.15,
                release: 3.5
            }
        }).connect(reverb);
        bellSynth.maxPolyphony = 64;  // Allow up to 64 overlapping notes (with 3.5s release at 20 notes/sec)
        bellSynth.volume.value = -6; // Reduced from -3 to account for multiple voices

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

        // Initialize media session for iOS controls
        try {
            await mediaSession.initialize();
        } catch (error) {
            console.error('[Audio] MediaSession initialization failed:', error);
            // Don't block audio if media session fails
        }

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
        return;
    }

    // iOS: Ensure context is running before playing
    if (Tone.context.state !== 'running') {
        return;
    }

    // Throttle audio triggers to prevent rapid-fire retriggering
    const now = performance.now();
    if (now - lastChimeTime < MIN_CHIME_INTERVAL_MS) {
        return;
    }
    lastChimeTime = now;

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
const zenButton = document.getElementById('zenButton')!;
const clearButton = document.getElementById('clearButton')!;
const increaseBrushBtn = document.getElementById('increaseBrush')!;
const decreaseBrushBtn = document.getElementById('decreaseBrush')!;
const brushSizeEl = document.getElementById('brushSize')!;
const physicsIndicator = document.getElementById('physicsIndicator')!;
const modeButtons = document.querySelectorAll('.mode-button');
const settingsCog = document.getElementById('settingsCog')!;
const bottomBar = document.getElementById('bottomBar')!;
const muteButton = document.getElementById('muteButton')!;

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

    // Show settings cog after intro
    settingsCog.classList.remove('opacity-0');
    settingsCog.style.opacity = '0.8';
});

settingsCog.addEventListener('click', () => {
    vibrate();
    settingsVisible = !settingsVisible;
    settingsCog.classList.toggle('active');
    bottomBar.classList.toggle('collapsed', !settingsVisible);

    // Hide settings cog when bottom bar is visible
    if (settingsVisible) {
        settingsCog.classList.add('hide-cog');
    } else {
        settingsCog.classList.remove('hide-cog');
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

muteButton.addEventListener('click', async () => {
    vibrate();

    try {
        // iOS 16.4+: Set audio session type FIRST for silent mode support
        if ('audioSession' in navigator) {
            try {
                (navigator as any).audioSession.type = 'playback';
            } catch (e) {
                // Silent fail - not critical
            }
        }

        // iOS: Ensure audio context is started
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        // iOS: Explicitly resume if suspended
        if (Tone.context.state === 'suspended') {
            await Tone.context.resume();
        }

        // Initialize audio if not already done
        if (!audioInitialized) {
            await setupAudio();
        }

        // Toggle sound on/off
        if (isPlayingSound) {
            // Currently playing → stop and mute
            isPlayingSound = false;
            isMuted = true;
            updateVolume();
            updateMuteButton();

            Tone.Transport.pause();
            muteButton.classList.remove('active');
            muteButton.setAttribute('title', 'Sound Off');

            // Update media session state
            await mediaSession.pausePlayback();
        } else {
            // Currently off → start and unmute
            isPlayingSound = true;
            isMuted = false;
            updateVolume();
            updateMuteButton();

            // Play test tone FIRST (must be synchronous with user gesture on iOS)
            if (bellSynth) {
                bellSynth.triggerAttackRelease("C4", "0.3n", Tone.now());
            }

            // Then start transport with explicit timing
            Tone.Transport.start('+0.1');

            muteButton.classList.add('active');
            muteButton.setAttribute('title', 'Sound On');

            // Update media session state
            await mediaSession.startPlayback();
        }
    } catch (error) {
        console.error('[Audio] Error in mute button handler:', error);
        alert('Audio initialization failed. Check console for details.');
    }
});

function updateVolume() {
    const effectiveVolume = isMuted ? 0 : masterVolume;

    if (ambientDrone) ambientDrone.volume.value = -8 + (effectiveVolume * 12);
    if (padSynth) padSynth.volume.value = -10 + (effectiveVolume * 12);
    if (bellSynth) bellSynth.volume.value = -3 + (effectiveVolume * 6);
    if (masterGain) masterGain.gain.value = isMuted ? 0 : (1.0 + (masterVolume * 0.5));
}

function updateMuteButton() {
    const iconSvg = muteButton.querySelector('svg');
    if (!iconSvg) return;

    if (isMuted) {
        // Muted: Show speaker with X
        iconSvg.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6m0-6l6 6"/>';
        muteButton.classList.add('muted');
    } else {
        // Unmuted: Show speaker with waves
        iconSvg.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5zm11.07 8a4.5 4.5 0 0 0 0-2m-2.12-2.12a7 7 0 0 1 0 6.24m-2.12-2.12a3.5 3.5 0 0 1 0-2"/>';
        muteButton.classList.remove('muted');
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
    // Only prevent default if the event target is the canvas itself
    // This prevents interference with toolbar buttons and other UI elements
    if (e.target === canvas) {
        e.preventDefault();
    }

    // Close settings if open
    if (settingsVisible) {
        settingsVisible = false;
        settingsCog.classList.remove('active');
        settingsCog.classList.remove('hide-cog');
        bottomBar.classList.add('collapsed');
        return; // Don't start drawing, just close settings
    }

    isDrawing = true;
    lastPos = getEventCoords(e);
    handleDraw(lastPos.x, lastPos.y);
}

function handleDraw(x: number, y: number) {
    if (currentMode !== 'lightning') playChime(y);

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

    // Only prevent default if the event target is the canvas itself
    if (e.target === canvas) {
        e.preventDefault();
    }

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
    // Only prevent default if the event target is the canvas itself
    if (e.target === canvas) {
        e.preventDefault();
    }
    isDrawing = false;
}

canvas.addEventListener('mousedown', handleDrawStart);
canvas.addEventListener('mousemove', handleDrawMove);
canvas.addEventListener('mouseup', handleDrawEnd);
canvas.addEventListener('mouseleave', handleDrawEnd);
// Use {passive: false} for touch events to allow preventDefault() on iOS
canvas.addEventListener('touchstart', handleDrawStart, { passive: false });
canvas.addEventListener('touchmove', handleDrawMove, { passive: false });
canvas.addEventListener('touchend', handleDrawEnd, { passive: false });
canvas.addEventListener('touchcancel', handleDrawEnd, { passive: false });

// Handle resize with debouncing
let resizeTimeout: number | undefined;

window.addEventListener('resize', () => {
    // Clear previous timeout to debounce rapid resize events
    if (resizeTimeout !== undefined) {
        clearTimeout(resizeTimeout);
    }

    resizeTimeout = window.setTimeout(() => {
        resizeCanvas();
    }, 100); // 100ms debounce
});

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

// --- MEDIA SESSION EVENT HANDLERS ---
// Listen for media session play/pause events from lock screen controls
window.addEventListener('mediasession:play', async () => {
    console.log('[MediaSession] Play event received from lock screen');
    if (!isPlayingSound && audioInitialized) {
        // Simulate mute button click to start playback
        muteButton.click();
    }
});

window.addEventListener('mediasession:pause', async () => {
    console.log('[MediaSession] Pause event received from lock screen');
    if (isPlayingSound) {
        // Simulate mute button click to pause playback
        muteButton.click();
    }
});

// --- INITIALIZATION ---
async function run() {
    try {
        // Initialize PWA features
        initPWA();

        // Initialize WASM module
        // Use fetch to load WASM explicitly for iOS/Capacitor compatibility
        const wasmPath = './assets/digital_bloom_wasm_bg.wasm';
        const wasmResponse = await fetch(wasmPath);
        if (!wasmResponse.ok) {
            throw new Error(`Failed to fetch WASM: ${wasmResponse.status} ${wasmResponse.statusText}`);
        }
        const wasmBuffer = await wasmResponse.arrayBuffer();
        await init(wasmBuffer);

        digitalBloom = new DigitalBloom();

        resizeCanvas();
        animate();

        // Initialize audio on startup (muted)
        try {
            await setupAudio();
            updateVolume(); // Apply muted state
            updateMuteButton(); // Update icon to show muted
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
