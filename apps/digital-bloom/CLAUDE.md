# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Digital Bloom is an interactive physics-based generative art playground built with TypeScript, Vite, and Rust/WebAssembly. The project features 7 creative physics modes (vine, gravity, bounce, burst, lightning, constellation, vortex) with real-time audio synthesis using Tone.js.

## Architecture

### Hybrid TypeScript + Rust/WASM Stack

- **Frontend (TypeScript)**: Canvas rendering, UI interactions, audio synthesis
  - Entry point: `src/main.ts`
  - Audio: Tone.js (PolySynth with pentatonic scales)
  - UI: Tailwind CSS (CDN-based)

- **Physics Engine (Rust/WASM)**: Particle systems, vine growth algorithms, lightning generation
  - WASM module: `crates/digital-bloom-wasm/src/lib.rs`
  - Compiled via wasm-pack and exposed through `DigitalBloom` class
  - Key exported structures: `Vine`, `Particle`, `Lightning` (serialized via serde)

### Data Flow

1. User interaction (touch/mouse) → TypeScript event handlers in `src/main.ts`
2. Coordinates + physics mode → WASM methods (`create_vine`, `create_particles_*`, `create_lightning`)
3. WASM updates internal state, exports serialized data structures
4. TypeScript animation loop reads WASM state and renders to canvas
5. Audio synthesis triggered based on Y-coordinate and physics mode

## Development Commands

### Build & Development

```bash
# Install dependencies
bun install

# Development server with hot reload (localhost:5173)
bun run dev

# Production build (outputs to dist/)
bun run build

# Preview production build
bun run preview
```

### WASM Development

The Rust WASM module is automatically compiled by `vite-plugin-wasm-pack` during dev/build. No separate wasm-pack commands needed.

**Configuration**: `rsw.toml` defines the WASM crate path (`crates/digital-bloom-wasm`)

**Manual WASM rebuild** (if needed):
```bash
wasm-pack build crates/digital-bloom-wasm --target web
```

## Key Technical Details

### Physics Modes Implementation

Each mode has a dedicated WASM method:
- `create_vine(x, y, brush_size)`: Organic growth with L-system-inspired branching
- `create_particles_gravity(x, y, count, size)`: Downward acceleration
- `create_particles_bounce(x, y, count, size)`: Wall collision physics
- `create_particles_burst(x, y, count, size)`: Radial explosion
- `create_particles_constellation(x, y, count, size)`: Star-like connections
- `create_lightning(x, y, width, height)`: Fractal branching with glow effects
- `create_particles_vortex(x, y, count, size)`: Orbital spiral motion

### Canvas Rendering

- Device pixel ratio scaling for high-DPI displays
- Trail effect via `rgba(10, 10, 10, 0.12)` overlay
- Separate draw functions: `drawVine()`, `drawParticle()`, `drawLightning()`
- Alpha transparency animated via `life` property from WASM particles

### Audio Synthesis

- Pentatonic scale (C3-A4) mapped to screen Y-coordinate
- AMSynth with harmonicity 1.5, ambient envelope settings
- Zen mode: automatic note triggering via Tone.Loop (quarter notes)
- Haptic feedback via `navigator.vibrate()` for mobile devices

### MediaSession Integration

**Purpose**: Replaces "localhost" with custom metadata in iOS media controls (Lock Screen, Control Center, and AirPods display).

**Implementation**: `src/mediaSession.ts`

**Key Features**:
- Custom metadata: Title, artist, album, artwork
- Platform detection: Uses Capacitor plugin on iOS, falls back to Web MediaSession API on web
- Playback state management: Automatically updates playing/paused state
- Lock screen controls support

**Integration with Audio System**:
- Initialized when audio context starts (in `main.ts`)
- Auto-updates playback state when Tone.js synth starts/stops
- Metadata is customizable via the `updateMetadata()` method

**Customization**:
```typescript
import { mediaSession } from './mediaSession';

// Update metadata
mediaSession.updateMetadata({
  title: 'Custom Title',
  artist: 'Custom Artist',
  album: 'Custom Album',
  artwork: [{ src: '/path/to/artwork.png', sizes: '512x512' }]
});

// Update playback state
mediaSession.setPlaybackState('playing');
```

**Dependencies**: `@jofr/capacitor-media-session` (iOS native plugin)

## Code Style Notes

- TypeScript interfaces match Rust struct serialization format
- WASM state accessed directly via properties (no getters): `digitalBloom.vines`, `digitalBloom.particles`, `digitalBloom.lightnings`
- Event handlers prevent default to avoid scrolling during drawing
- Configuration centralized in `CONFIG` object (colors, touch thresholds, performance limits)

## PWA Features

PWA manifest and service worker initialization handled in `src/pwa/manifest.ts` (initialized in `run()` function).