# Project State

## Current Phase
- Baseline engine: Modular Canvas 2D + deterministic seed system + Classic Escape mode operational.
- MVP combat work is isolated on `feature/mvp-combat`; `main` remains untouched. The current test build is wired into the existing `index.html` shell.

## Done
- Existing engine and UI retained unchanged for this MVP branch.
- Added standalone `mvp.html` with a 9:16 Canvas combat view, four colored fighters, health display toggle, sound toggle, weapon pickup events, shrinking danger zone, automatic charge-based ultimates, end-of-match damage ranking, and client-side video recording.
- Canvas is rendered at 1080×1920 backing resolution; recording uses `captureStream(30)` and `MediaRecorder`, with browser-supported format selection.
- Corrected backing-store scaling, added animated ultimate shockwave rings, and ensured final recorder chunks are collected before download.
- No third-party game engine or new dependency added.

## Recently Changed
- Added a right-side weapon test menu for all eight images in `assets/weapons`; each Spawn button drops the selected image into the arena. Timed sword spawns remain enabled.
- Added animation-loop error reporting, prevented the regular RAF loop from double-stepping the game during MP4 capture, and added a rounded-rectangle rendering fallback.
- Picked-up weapons now stay visible and orbit their carrier; they can hit the nearest opponent when the orbit enters melee range.

## In Progress / Next
- Validate `mvp.html` in a real browser, especially collision feel, shrinking-zone damage, weapon pickups, ultimate triggering, and the 60-second capture/download flow.
- Verify whether the target browser exports WebM or MP4; MP4 support is browser-dependent.
- Keep all MVP work on `feature/mvp-combat` until user-approved validation and review.

## Open Issues
- Real browser execution and a full 60-second recording have not yet been tested from this environment.
- If the tab is backgrounded or the browser throttles animation frames, real-time recording duration may vary; keep the tab visible during capture.
