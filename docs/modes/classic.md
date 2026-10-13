# Mode: Classic Escape (classic)

## Description
A single ball bounces inside concentric rotating rings, each having an opening (gap). The ball escapes through gaps one by one until reaching freedom.

## Parameters
- `ringCount`: Number of concentric rings (2 - 10, default: 6).
- `rotationMultiplier`: Base rotation speed multiplier (0.02 - 0.60, default: 0.12).
- `rotationDirection`: 'alternate' (adjacent rings rotate in opposite directions), 'clockwise', or 'counter'.
- `gapSize`: Angular size of the gap arc in radians (PI * 0.25 to PI * 0.85, default: PI * 0.45).
- `paletteName`: HSL color scheme ('neon', 'cyberpunk', 'ocean', 'sunset', 'candy', 'fire', 'rainbow').
- `multiColor`: Boolean (distinct hue per ring or uniform palette primary).
- `spikesEnabled`: Boolean (toggle obstacle spikes on rings).
- `spikeCount`: Number of spikes per active ring (3 - 20, default: 8).

## Ball Physics Defaults
- `radius`: 13px
- `gravity`: 0.24
- `bounciness`: 1.02x
- `speedBoost`: 1.01x
- `maxSpeed`: 32px/frame

## Edge Cases & Rules
- Collision is resolved only with the current innermost active ring.
- If ball enters within `gapSize / 2` of `gapAngle`, ring is cleared (`active = false`).
- Victory triggers when all rings are inactive; overlay displays duration and seed without sound or screen shake.
- Initial spawn must always be positioned at `center.x, center.y - innerRadius * 0.35` to guarantee safe interior start.
