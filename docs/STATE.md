# Project State

## Current Phase
- Branche par défaut : `v2`; développement de l'interface Arena Brawl et de l'export vidéo.

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
- Le panneau de sélection d'armes doit utiliser les six nouveaux assets (hache, arc, marteau, sceptre, lance, épée) ; les armes sont récupérables et visibles sur les boules.
- Export MP4 via capture du canvas puis conversion FFmpeg WASM ; test navigateur réel requis.

## Open Issues
- La syntaxe JavaScript et les comportements de base ont été testés directement. Les performances et le ressenti en navigateur restent à confirmer.
