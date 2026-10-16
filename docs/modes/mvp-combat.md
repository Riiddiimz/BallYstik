# Mode: MVP Combat (standalone)

## Goal
Generate one continuous 60-second vertical fight that can be recorded as a raw 1080×1920 video. This is an isolated prototype page, not a replacement for the existing main app.

## Entry point and stack
- Current test entry point: `index.html` on `feature/mvp-combat` (existing UI shell retained); standalone prototype remains at `mvp.html`.
- Vanilla HTML/CSS/JavaScript + Canvas 2D
- Logical coordinates: 540×960; canvas backing store: 1080×1920
- Recording: `HTMLCanvasElement.captureStream(30)` + `MediaRecorder`
- No new dependency and no server-side processing.

## Match rules
- Four autonomous balls: Rouge, Bleu, Vert, Jaune; each starts at 100 HP.
- Balls bounce off the rounded-rectangle arena walls and collide with one another.
- Contact deals damage and builds the damage dealer's ultimate meter.
- A blade pickup appears around seconds 15, 35 and 50. A holder receives a damage bonus and golden glow.
- Each ball automatically fires a radial shockwave ultimate at 100% charge; it damages and knocks back nearby opponents.
- The arena begins shrinking at second 30; the inner danger boundary damages balls that cross it.
- The match runs for 60 seconds. Winner is the ball with the most damage inflicted, including if its HP reaches zero before the end.
- Result overlay lists damage totals. It is DOM UI, not part of the recorded canvas footage.

## Test tools
- The right sidebar lists all eight PNGs in `assets/weapons`; each Spawn button places the selected image in the arena immediately. Multiple ground weapons can coexist; a ball picks one up on contact. Clear removes all ground weapons.

## Controls
- `Nouveau combat`: reset match state and begin a new simulation.
- `Enregistrer`: reset and record the full match from its start.
- Settings toggle HP display and optional synthesized sounds.
- Recording downloads as WebM or MP4 only when the browser reports support for that format.

## Validation checklist
- [ ] Load page in a real browser and confirm all four balls render in the arena.
- [ ] Confirm collisions, HP loss, and charge-based ultimate shockwaves.
- [ ] Confirm weapon appears near 15, 35 and 50 seconds and changes holder damage.
- [ ] Confirm arena shrinks after 30 seconds and danger boundary causes damage.
- [ ] Confirm timer reaches zero, freezes, and winner ranking appears.
- [ ] Record the full match and verify downloadable 1080×1920 video duration, playback, and absence of result overlay in the recording.

## Known limitations before browser QA
- Browser execution and a full 60-second recording have not yet been verified in this environment.
- MP4 export depends on browser MediaRecorder support; WebM is the expected default on Chrome/Edge.
- Keep the browser tab visible during recording to reduce background throttling.
