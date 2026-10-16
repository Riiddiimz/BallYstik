# Project Lessons Learned

- [physics] Ball tunneling through walls at high speeds -> 1 integration step per frame skipped colliders -> Implemented 8 substeps per frame loop.
- [physics] Ball spawning outside innermost ring on small screens -> Fixed initial spawn offset (center.y - 50) exceeded inner radius -> Computed spawn offset dynamically from inner ring radius.
- [physics] Ball passing through spikes near -PI/PI boundary -> Raw angle subtraction without modulo 2*PI caused out-of-bound indices -> Normalized relative angle modulo 2*PI and used exact point-to-segment distance.
- [audio] Web Audio DOMException crash on exponential ramp -> exponentialRampToValueAtTime threw when starting from 0 -> Clamped initial gain value with Math.max(vol, 0.001).
- [audio] Browser autoplay audio warning on page load -> AudioContext created unconditionally in constructor -> Initialized AudioContext lazily on first user pointerdown/keydown gesture.
- [ui] Sidebar jumped to top when clicking checkboxes -> Tailwind sr-only used position:absolute without relative parent, causing scroll-into-view -> Wrapped toggles in relative inline-flex and added lockScroll helper.
- [ui] Accordions showed clipped text when closed -> Tailwind pt/pb classes and margins overflowed max-height:0 -> Added .accordion-content:not(.open) { display: none !important; }.
- [combat] Picked-up weapon was only a static carrier aura -> Store an orbit angle on the carrier, render the weapon at that moving offset, and apply melee hits when it passes close to the nearest opponent.
- [render] Animation loop can appear frozen when a canvas API throws -> Guard the frame loop, surface the runtime error in the status area, and keep a `roundRect` fallback for browser compatibility.
- [render] Blurry canvas rendering on high-DPI / Retina displays -> Canvas resolution matched CSS pixels instead of physical pixels -> Scaled width/height by Math.min(window.devicePixelRatio, 2) and ctx.scale.
- [perf] Seed search freezing UI during thousands of simulations -> Fixed batch size (60 seeds) took >50ms per frame -> Enforced 8ms performance.now() budget per rAF to guarantee constant 60 FPS without UI freezes.
- [modes] Calling activeMode.handleCollision crashed animation loop when mode lacked default collision method -> Guarded call with optional check (this.activeMode.handleCollision).
- [vfx] Les événements visuels consommaient le PRNG du combat et pouvaient changer les pickups/trajectoires d'une seed -> Utiliser un générateur local réservé aux animations.


## Règle d’animation des armes (2026-10-16)
Ne pas faire orbiter l’arme autour de la boule en continu. Elle doit être dessinée près de la boule comme un objet porté, puis pivoter vers l’adversaire le plus proche uniquement quand il s’approche. Conserver un délai entre les coups pour éviter les dégâts à chaque frame.
