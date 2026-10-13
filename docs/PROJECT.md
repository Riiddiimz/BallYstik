# Project Memory: Bouncing-Ball Physics Simulator (BALLTOK)

## Stack & Target Architecture
- Stack: Next.js (App Router) + TypeScript + Tailwind CSS (dark mode only).
- Physics: Custom Canvas 2D engine (fixed 120Hz substeps, 0% tunneling, no Matter.js).
- Audio: Web Audio API synth + pentatonic/custom scales (zero audio pops).
- Export: MediaRecorder API (1080x1920 fixed internal resolution, 9:16 portrait).
- Hosting: Vercel (client-side only, zero backend, zero DB).

## Folder Tree
- `index.html`: Entry point with dual-sidebar layout and 9:16 portrait hero canvas.
- `config.js`: Root configuration with comments (min, max, bounds) editable by user.
- `css/style.css`: Core design system, neon glow, custom scrollbars, strict accordion hiding.
- `js/prng.js`: Mulberry32 deterministic PRNG for exact seed reproducibility.
- `js/audio.js`: Polyphonic Web Audio synth with safe volume ADSR ramps.
- `js/effects.js`: Particle explosions and shockwave rings.
- `js/ball.js`: Ball entity with glowing trail and 3D specular highlight.
- `js/modes/classic.js`: Classic Escape mode (concentric rings, normalized spike collisions).
- `js/seedSearcher.js`: Headless duration searcher (~2000 seeds/sec for target video time).
- `js/simulation.js`: Master simulation loop with 8 sub-steps and active mode delegate.
- `js/app.js`: UI event bindings, dual-sidebar drawers, scroll-lock, and seed controls.
- `docs/`: Project memory and mode specifications.
- `.agents/agents/`: Specialized subagent definitions.

## Core Conventions & Key Decisions
1. **Deterministic by Default**: All randomness uses `sim.prng` so any seed reproduces identical frames.
2. **Sub-stepping Physics**: 8 substeps per frame prevent tunneling through walls and spikes at high speeds.
3. **Dual Sidebar Layout**: Left = Mode & Ball/Physics + Seed searcher; Right = Audio & VFX.
4. **Zero-Jump UI**: Checkboxes use inline-relative wrappers + `lockScroll` preventing scroll jumps.
5. **Display None Accordions**: Collapsed menus use `display: none !important` to ensure zero leaked text.
6. **No Sound/Shake on Victory**: End screen is clean and visual only.

## Key Commands
- Dev Server: `python -m http.server 3000` (or `npm run dev` once in Next.js).
- Build: `npm run build` (Next.js phase).
- Typecheck: `npx tsc --noEmit` (Next.js phase).
