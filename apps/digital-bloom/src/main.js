import init, { DigitalBloom } from 'digital-bloom-wasm';
import * as Tone from 'tone';

const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');

// --- CONFIGURATION ---
const CONFIG = {
    touch: { minDrawDistance: 8 },
    performance: { maxVinesPerInteraction: 2 },
};

let brushSize = 4;
let zenMode = false;
let isPlayingSound = false;
let isDrawing = false;
let lastPos = { x: 0, y: 0 };

let digitalBloom;

// --- AUDIO SETUP (Condensed for brevity) ---
let synth, loop;
function setupAudio() { synth = new Tone.PolySynth(Tone.AMSynth, { harmonicity: 1.5, envelope: { attack: 0.05, decay: 0.1, sustain: 0.2, release: 1 }, modulationEnvelope: { attack: 0.5, decay: 0.01, sustain: 1, release: 0.5 } }).toDestination(); synth.volume.value = -12; const notes = ["C3", "E3", "G3", "A3", "C4", "D4", "E4", "G4", "A4"]; loop = new Tone.Loop(time => { const note = notes[Math.floor(Math.random() * notes.length)]; synth.triggerAttackRelease(note, "8n", time); }, "4n").start(0); }

// --- UI & EVENT LISTENERS ---
const startButton = document.getElementById('startButton');
const introOverlay = document.getElementById('introOverlay');
const soundButton = document.getElementById('soundButton');
const zenButton = document.getElementById('zenButton');
const clearButton = document.getElementById('clearButton');
const increaseBrushBtn = document.getElementById('increaseBrush');
const decreaseBrushBtn = document.getElementById('decreaseBrush');
const brushSizeEl = document.getElementById('brushSize');

startButton.addEventListener('click', () => {
    introOverlay.style.opacity = '0';
    setTimeout(() => introOverlay.style.display = 'none', 500);
});
soundButton.addEventListener('click', async () => { if (Tone.context.state !== 'running') { await Tone.start(); setupAudio(); } isPlayingSound = !isPlayingSound; if (isPlayingSound) { Tone.Transport.start(); soundButton.textContent = '❚❚'; soundButton.classList.add('active'); } else { Tone.Transport.pause(); soundButton.textContent = '▶'; soundButton.classList.remove('active'); } });
zenButton.addEventListener('click', () => { zenMode = !zenMode; zenButton.classList.toggle('active'); });
clearButton.addEventListener('click', () => { digitalBloom.clear(); });
function updateBrushSize(delta) { brushSize = Math.max(1, Math.min(10, brushSize + delta)); brushSizeEl.textContent = brushSize; }
increaseBrushBtn.addEventListener('click', () => updateBrushSize(1));
decreaseBrushBtn.addEventListener('click', () => updateBrushSize(-1));

// --- CANVAS & DRAWING LOGIC (Condensed for brevity) ---
function resizeCanvas() { const dpr = window.devicePixelRatio || 1; const width = window.innerWidth; const height = window.innerHeight; canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; ctx.scale(dpr, dpr); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
function getEventCoords(e) { if (e.touches && e.touches.length > 0) { return { x: e.touches[0].clientX, y: e.touches[0].clientY }; } return { x: e.clientX, y: e.clientY }; }
function handleDrawStart(e) { e.preventDefault(); isDrawing = true; lastPos = getEventCoords(e); digitalBloom.create_vine(lastPos.x, lastPos.y, brushSize); }
function handleDrawMove(e) { if (!isDrawing) return; e.preventDefault(); const pos = getEventCoords(e); const dx = pos.x - lastPos.x; const dy = pos.y - lastPos.y; const dist = Math.sqrt(dx * dx + dy * dy); if (dist > CONFIG.touch.minDrawDistance) { for (let i = 0; i < CONFIG.performance.maxVinesPerInteraction; i++) { digitalBloom.create_vine(pos.x, pos.y, brushSize); } lastPos = pos; } }
function handleDrawEnd(e) { e.preventDefault(); isDrawing = false; }
canvas.addEventListener('mousedown', handleDrawStart); canvas.addEventListener('mousemove', handleDrawMove); canvas.addEventListener('mouseup', handleDrawEnd); canvas.addEventListener('mouseleave', handleDrawEnd);
canvas.addEventListener('touchstart', handleDrawStart); canvas.addEventListener('touchmove', handleDrawMove); canvas.addEventListener('touchend', handleDrawEnd); canvas.addEventListener('touchcancel', handleDrawEnd);
window.addEventListener('resize', resizeCanvas);

// --- ANIMATION LOOP ---
function drawVine(vine) {
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

function animate() {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.12)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    if (zenMode && Math.random() < 0.02) {
        digitalBloom.create_vine(Math.random() * window.innerWidth, Math.random() * window.innerHeight, brushSize);
    }

    digitalBloom.update(window.innerWidth, window.innerHeight);

    const vines = digitalBloom.vines;
    const grownVines = digitalBloom.grown_vines;

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
    await init();
    digitalBloom = new DigitalBloom();
    resizeCanvas();
    animate();
}

run();
