# Project Memory: Bouncing-Ball Physics Simulator (BALLTOK)

## Stack & Target Architecture
- Stack: Next.js (App Router) + TypeScript + Tailwind CSS (dark mode only).
- Physics: Custom Canvas 2D engine (fixed 120Hz substeps, 0% tunneling, no Matter.js).
- Audio: Web Audio API synth + pentatonic/custom scales (zero audio pops).
- Export: MediaRecorder API (1080x1920 fixed internal resolution, 9:16 portrait).
- Hosting: Vercel (client-side only, zero backend, zero DB).

## Standalone MVP Combat Prototype\n- Entry page: `mvp.html` (kept separate from the existing `index.html` application).\n- Vanilla HTML/CSS/JS and Canvas 2D; no PixiJS or other new dependency.\n- Logical simulation dimensions 540×960 rendered on a 1080×1920 canvas backing store; recording via `canvas.captureStream(30)` and `MediaRecorder`.\n- Four autonomous balls with contact damage, HP bars, pickup blade at 15/35/50 seconds, charge-based shockwave ultimates, arena shrink from 30 seconds, and damage-based winner overlay.\n- Export format is selected from formats supported by the current browser; WebM is expected in Chrome/Edge, while MP4 is not guaranteed.\n- Status: implementation committed on `feature/mvp-combat`; browser validation and full-duration recording still pending.\n\n## Folder Tree
- `index.html`: Entry point with dual-sidebar layout and 9:16 portrait hero canvas.
- `config.js`: Root configuration with comments (min, max, bounds) editable by user.
- `css/style.css`: Core design system, neon glow, custom scrollbars, strict accordion hiding.
- `js/prng.js`: Mulberry32 deterministic PRNG for exact seed reproducibility.
- `js/audio.js`: Polyphonic Web Audio synth with safe volume ADSR ramps.
- `js/arena/arena.js`: rounded arena geometry, four map styles with distinct obstacle layouts and telegraphed map hazards.
- `js/arena/arena-battle.js`: Arena Brawl simulation, Reactor radial pulse, Crossfire laser lane, Void gravity wells, projectile collision and explosive area damage.
- `js/arena/ability-offensive.js`: includes two pickup weapons: Plasma Cannon (visible turret, telegraphed charge, explosive shells and splash damage) and Tesla Coil (visible coil, charge, primary zap and chain lightning).
- `js/arena/ability-settings.js`: tunable plasma-cannon parameters integrated into the ability settings UI.
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
