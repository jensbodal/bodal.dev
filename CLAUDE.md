# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Personal website and blog with an embedded interactive app, built with Next.js 15 (App Router) and deployed to GitHub Pages. The repository contains two main components:
1. **Main Site**: Static blog/portfolio with MDX support
2. **Digital Bloom**: Embedded physics-based generative art app with Rust/WASM backend

## Technology Stack

- **Next.js 15**: App Router with static export
- **Bun**: Package manager (ALWAYS use `bun` instead of npm)
- **TypeScript**: Type-safe development
- **MDX**: Rich blog content with React components
- **Tailwind CSS**: Utility-first styling
- **Tone.js**: Audio synthesis for Digital Bloom
- **Rust/WASM**: Physics engine for Digital Bloom (via wasm-pack)

## Development Commands

### Main Site

```bash
# Install dependencies
bun install

# Development server (localhost:3000)
bun run dev

# Production build (outputs to out/)
bun run build

# Type checking
bun run typecheck

# Linting
bun run lint

# Preview production build
bun run start
```

### Digital Bloom App

```bash
# Development server
bun run digital-bloom:dev

# Build and deploy to public/digital-bloom/
bun run build:digital-bloom

# iOS build workflow (must run after any iOS app changes)
bun run digital-bloom:ios:build

# Open iOS project in Xcode
bun run digital-bloom:ios:open

# Run iOS integration tests
bun run digital-bloom:ios:test

# Deploy to connected iOS device (automated workflow)
# This builds, syncs, compiles, installs, and launches on device
cd apps/digital-bloom
bun run ios:deploy
```

**IMPORTANT**:
- Always use `bun run ios:deploy` to deploy to iOS devices - this automated script handles the full build pipeline
- The script detects connected devices automatically (defaults to 'zojak-16m')
- Always run `bun run build` at the root level after working on the iOS app to ensure the web build is updated

## Architecture

### Main Site Structure

- **app/**: Next.js App Router pages
  - `layout.tsx`: Root layout with navigation
  - `page.tsx`: Homepage
  - `about/`, `blog/`, `contact/`, `projects/`: Page routes
  - `components/`: Shared React components
  - `digital-bloom/`: Route that serves embedded app

- **content/blog/**: Markdown/MDX blog posts with frontmatter
  - Frontmatter fields: `title`, `date`, `excerpt`
  - Processed by `lib/blog.ts` utilities

- **lib/blog.ts**: Blog post utilities
  - `getAllPosts()`: Fetches all posts sorted by date
  - `getPostBySlug(slug)`: Fetches single post content

- **public/**: Static assets
  - `CNAME`: GitHub Pages custom domain configuration
  - `digital-bloom/`: Compiled Digital Bloom app (generated on build)

### Digital Bloom Architecture

Located in `apps/digital-bloom/`:

- **Frontend (TypeScript)**: Canvas rendering, UI, audio synthesis
  - Entry: `src/main.ts`
  - Audio: Tone.js with pentatonic scale mapping
  - Physics modes: vine, gravity, bounce, burst, lightning, constellation, vortex

- **Backend (Rust/WASM)**: Particle physics engine
  - Source: `crates/digital-bloom-wasm/src/lib.rs`
  - Compiled via vite-plugin-wasm-pack during build
  - Exports: `DigitalBloom` class with physics methods

- **iOS App**: Capacitor-based native wrapper
  - Config: `capacitor.config.ts`
  - App ID: `com.breakevenllc.digitalbloom`
  - Workspace: `ios/App/App.xcworkspace`

### Build Pipeline

1. **Digital Bloom Build**: Compiles WASM, builds Vite app → `apps/digital-bloom/dist/`
2. **Deploy to Public**: Copies dist to `public/digital-bloom/`
3. **Next.js Build**: Static export with embedded Digital Bloom → `out/`
4. **GitHub Pages**: CI deploys `out/` directory

## Configuration

### Next.js Config (next.config.mjs)

- Static export with `output: 'export'`
- Unoptimized images for GitHub Pages
- MDX support for `.mdx` and `.md` files
- Security headers: CSP, X-Frame-Options, etc.

### Digital Bloom Configs

- **rsw.toml**: WASM crate path for Rust compilation
- **vite.config.js**: Vite build with wasm-pack plugin
- **capacitor.config.ts**: iOS app configuration

## Deployment

### Automatic Deployment

GitHub Actions workflow (`.github/workflows/pages.yml`) triggers on push to `main`:
1. Sets up Rust toolchain and wasm32 target
2. Installs wasm-pack and compiles WASM
3. Runs `bun run build` (includes Digital Bloom build)
4. Deploys `out/` directory to GitHub Pages

### Manual Testing

```bash
# Test the full build locally
bun run build
bun run start  # Serves from out/

# Test Digital Bloom separately
bun run digital-bloom:dev
```

## Content Management

### Writing Blog Posts

1. Create `content/blog/post-name.md` or `.mdx`
2. Add frontmatter:
   ```markdown
   ---
   title: Post Title
   date: 2024-08-02
   excerpt: Brief description
   ---

   Content here...
   ```
3. Post automatically appears at `/blog/post-name`

### Adding Projects

Edit `app/projects/page.tsx` to add project entries.

## Code Style

- Use ES6+ imports (no barrel files, no wildcard imports)
- TypeScript strict mode enabled
- Prefer functional components in React
- Use Tailwind CSS classes over custom CSS when possible

## Testing

### Digital Bloom Tests

```bash
cd apps/digital-bloom

# Run tests with Vitest
bun run test

# Run tests with UI
bun run test:ui

# Run tests once (CI mode)
bun run test:run
```

### iOS Integration Tests

```bash
bun run digital-bloom:ios:test
```

## Common Tasks

### Updating Digital Bloom Version

```bash
cd apps/digital-bloom

# Patch version (1.0.0 → 1.0.1)
bun run version:patch

# Minor version (1.0.0 → 1.1.0)
bun run version:minor

# Major version (1.0.0 → 2.0.0)
bun run version:major

# Sync version to iOS native config
bun run sync:version
```

### iOS Development

```bash
cd apps/digital-bloom

# Deploy to connected iOS device (RECOMMENDED)
# Builds web assets, syncs Capacitor, compiles Xcode, installs and launches on device
bun run ios:deploy

# Alternative: Full iOS build pipeline (build only, no deploy)
bun run ios:build  # Generates icons, builds app, syncs Capacitor

# Open in Xcode
bun run ios:open

# Run on iOS simulator/device (via Capacitor CLI)
bun run cap:run:ios
```

**Development Workflow**:
1. Make changes to Digital Bloom app
2. Run `bun run ios:deploy` to build and deploy to device
3. The script automatically:
   - Builds web assets with Vite
   - Syncs with Capacitor
   - Compiles iOS app with Xcode
   - Installs app to connected device
   - Launches app on device

### Regenerating iOS Icons

```bash
cd apps/digital-bloom
bun run ios:icons  # Requires public/icon.png source
```

## Important Notes

- **Package Management**: Always use `bun`, never `npm` or `yarn`
- **iOS Build**: Always run the full build after iOS app changes
- **Static Export**: Site uses `output: 'export'` for GitHub Pages compatibility
- **WASM Build**: Automatic during dev/build via vite-plugin-wasm-pack
- **Image Optimization**: Disabled for static export (`unoptimized: true`)
- **Trailing Slashes**: Disabled for cleaner URLs (`trailingSlash: false`)

## Security

- CSP headers configured in `next.config.mjs`
- Frame options prevent clickjacking
- Referrer policy set to `strict-origin-when-cross-origin`
- No sensitive data should be committed (use environment variables)
