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

// --- AUDIO SETUP ---
let synth: Tone.PolySynth | null = null;
let loop: Tone.Loop | null = null;

const scales = {
    pentatonic: ["C3", "D3", "E3", "G3", "A3", "C4", "D4", "E4", "G4", "A4"]
};

function setupAudio() {
    synth = new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 1.5,
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.2, release: 1 },
        modulationEnvelope: { attack: 0.5, decay: 0.01, sustain: 1, release: 0.5 }
    }).toDestination();
    synth.volume.value = -18;

    loop = new Tone.Loop(time => {
        if (zenMode && synth) {
            const note = scales.pentatonic[Math.floor(Math.random() * scales.pentatonic.length)];
            synth.triggerAttackRelease(note, "8n", time);
        }
    }, "4n").start(0);
}

function playNote(y: number) {
    if (!synth) return;
    const noteIndex = Math.min(
        scales.pentatonic.length - 1,
        Math.floor((1 - (y / window.innerHeight)) * scales.pentatonic.length)
    );
    const note = scales.pentatonic[noteIndex];
    synth.triggerAttackRelease(note, "16n", Tone.now());
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
    if (Tone.context.state !== 'running') {
        await Tone.start();
        setupAudio();
    }
    isPlayingSound = !isPlayingSound;
    const btnSpan = soundButton.querySelector('span');
    if (isPlayingSound) {
        Tone.Transport.start();
        if (btnSpan) btnSpan.textContent = '❚❚';
        soundButton.classList.add('active');
    } else {
        Tone.Transport.pause();
        if (btnSpan) btnSpan.textContent = '▶';
        soundButton.classList.remove('active');
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
    if (isPlayingSound && currentMode !== 'vortex' && currentMode !== 'lightning') playNote(y);

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
    ctx.fillStyle = 'rgba(10, 10, 10, 0.12)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    if (zenMode && Math.random() < 0.015) {
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
    // Initialize PWA features
    initPWA();

    // Initialize WASM module with explicit path
    // The WASM file is in the assets folder relative to the base path
    await init('/digital-bloom/assets/digital_bloom_wasm_bg.wasm');
    digitalBloom = new DigitalBloom();
    resizeCanvas();
    animate();
}

run();