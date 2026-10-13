# Project State

## Current Phase
- Bootstrap completed: memory system, task triage rules, and specialized subagents active.
- Baseline engine: Modular Canvas 2D + deterministic seed system + Classic Escape mode operational.

## Done
- Audited and fixed initial HTML file (anti-tunneling sub-steps, safe ball spawn, spike angle normalization).
- Modularized codebase into `css/style.css`, `js/audio.js`, `js/effects.js`, `js/ball.js`, `js/modes/classic.js`, `js/simulation.js`, `js/app.js`.
- Implemented dual-sidebar ergonomics (Left: Mode & Physics, Right: Audio & VFX).
- Added Mulberry32 deterministic PRNG (`js/prng.js`) and fast duration Seed Searcher (`js/seedSearcher.js`).
- Created root `config.js` with documented bounds (min, max, descriptions) editable by user.
- Fixed accordion text leakage with `display: none !important;` when collapsed.
- Removed in-app mode defaults menu per user request.
- Integrated Spiral Vault mode (UI, presets, physics substeps, sound, headless seed searcher, auto-loop and slowmo).

## In Progress / Next
- Progressive migration to Next.js (App Router) + TypeScript + Tailwind when requested.

## Open Issues
- None. All physics, audio, UI stability, and determinism tests pass.
