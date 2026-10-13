/* ==========================================================================
   SeedSearcher - Recherche Déterministe de Durée de Simulation
   Simule en mémoire ultra-rapide des milliers de seeds pour trouver
   celle qui correspond exactement à la durée cible choisie (ex: 15s, 30s, 60s).
   ========================================================================== */

class SeedSearcher {
    constructor(simulation) {
        this.sim = simulation;
        this.prng = new PRNG(1);
        this.isSearching = false;
        this.searchTaskId = null;

        // Search parameters
        this.targetDuration = 65; // seconds
        this.tolerance = 0.45; // seconds
        this.testedCount = 0;
        this.bestSeed = null;
        this.bestDuration = null;
        this.bestDiff = Infinity;
        this.currentSeedCandidate = 1;

        // Callback hooks
        this.onProgress = null;
        this.onFound = null;
    }

    // Deterministic Classic evaluator mirroring Simulation.update + ClassicMode.handleCollision.
    // Return the elapsed simulation time at the same victory condition as the live game.
    evaluateSeed(seed, maxDuration = 120, settings = null) {
        const mode = this.sim.activeMode;
        if (mode.evaluateSeed) return mode.evaluateSeed(seed, maxDuration, this.prng, settings);
        if (mode.id && mode.id !== 'classic') return null;

        this.prng.setSeed(seed);
        const count = settings?.ringCount ?? mode.ringCount ?? 6;
        const maxRadius = Math.max(30, this.sim.boundaryRadius - 6);
        const innerRadius = Math.max(22, Math.min(65, this.sim.boundaryRadius * 0.24));
        const spacing = count > 1 ? (maxRadius - innerRadius) / (count - 1) : 0;
        const gapSize = settings?.gapSize ?? mode.gapSize;
        const rotationMultiplier = settings?.rotationMultiplier ?? mode.rotationMultiplier;
        const rotationDirection = settings?.rotationDirection ?? mode.rotationDirection;
        const gravity = settings?.gravity ?? this.sim.gravity;
        const bounciness = settings?.bounciness ?? this.sim.bounciness;
        const speedBoost = settings?.speedBoost ?? this.sim.speedBoost;
        const maxSpeed = this.sim.maxSpeed;
        const ballRadius = this.sim.ballRadius;

        const rings = [];
        // Mirror ClassicMode.setupRings(): ring gaps consume seeded PRNG values
        // before the ball's vx, vy and hue are initialized.
        for (let i = 0; i < count; i++) {
            const sign = rotationDirection === 'alternate'
                ? (i % 2 === 0 ? 1 : -1)
                : rotationDirection === 'counter' ? -1 : 1;
            let initialAngle;
            const initialGapMode = settings?.initialGapMode ?? mode.initialGapMode ?? 'random';
            const gapOffset = settings?.gapOffset ?? mode.gapOffset ?? 0;
            if (initialGapMode === 'random') {
                initialAngle = this.prng.random() * Math.PI * 2;
            } else if (initialGapMode === 'offset') {
                initialAngle = i * gapOffset * Math.PI / 180;
            } else if (initialGapMode === 'alternate') {
                initialAngle = (i % 2) * Math.PI;
            } else {
                initialAngle = this.prng.random() * Math.PI * 2;
            }
            rings.push({
                radius: Math.min(maxRadius, innerRadius + i * spacing),
                gapAngle: initialAngle,
                gapSize,
                rotationSpeed: sign * (0.22 + i * 0.04),
                active: true
            });
        }

        const spawnOffset = rings.length ? rings[0].radius * 0.35 : 10;
        // Live Simulation.initMode consumes three PRNG values: vx, vy, then hue.
        let ball = {
            x: this.sim.center.x,
            y: this.sim.center.y - spawnOffset,
            vx: (this.prng.random() - 0.5) * 6,
            vy: (this.prng.random() - 0.5) * 4,
            radius: ballRadius
        };
        this.prng.random(); // hue draw, irrelevant to physics but part of the live initialization sequence

        const maxFrames = Math.floor(maxDuration * 60);
        const substeps = 8;
        const subDt = 1 / substeps;
        const victoryRadius = this.sim.boundaryRadius + ball.radius * 2;

        for (let frame = 0; frame < maxFrames; frame++) {
            // Same update order: rotate rings, then run 8 physics substeps.
            for (const ring of rings) {
                if (ring.active) {
                    ring.gapAngle = (ring.gapAngle + ring.rotationSpeed * rotationMultiplier) % (Math.PI * 2);
                }
            }

            for (let step = 0; step < substeps; step++) {
                ball.vy += gravity * subDt;
                ball.x += ball.vx * subDt;
                ball.y += ball.vy * subDt;

                const speed = Math.hypot(ball.vx, ball.vy);
                if (speed > maxSpeed) {
                    ball.vx = ball.vx / speed * maxSpeed;
                    ball.vy = ball.vy / speed * maxSpeed;
                }

                const dx = ball.x - this.sim.center.x;
                const dy = ball.y - this.sim.center.y;
                const dist = Math.hypot(dx, dy);
                const ringIndex = rings.findIndex(r => r.active);

                // ClassicMode only wins after the ball travels beyond the outer boundary
                // once every ring has been cleared (not at the moment the last ring clears).
                if (ringIndex === -1) {
                    if (dist > victoryRadius) return (frame + 1) / 60;
                    continue;
                }

                const ring = rings[ringIndex];
                const radialVelocity = (ball.vx * dx + ball.vy * dy) / Math.max(dist, 0.001);
                if (dist - (ring.radius - ball.radius) >= 0 && radialVelocity > 0) {
                    const angle = Math.atan2(dy, dx);
                    const relAngle = Math.atan2(
                        Math.sin(angle - ring.gapAngle),
                        Math.cos(angle - ring.gapAngle)
                    );

                    if (Math.abs(relAngle) <= ring.gapSize / 2) {
                        ring.active = false;
                        // Live ClassicMode triggers victory immediately when the last
                        // ring clears, without waiting for the ball to cross the boundary.
                        if (rings.every(r => !r.active)) return (frame + 1) / 60;
                    } else {
                        const nx = dx / Math.max(dist, 0.001);
                        const ny = dy / Math.max(dist, 0.001);
                        ball.x = this.sim.center.x + nx * (ring.radius - ball.radius);
                        ball.y = this.sim.center.y + ny * (ring.radius - ball.radius);
                        const dot = ball.vx * nx + ball.vy * ny;
                        if (dot > 0) {
                            const bounceMultiplier = bounciness * speedBoost;
                            ball.vx = (ball.vx - 2 * dot * nx) * bounceMultiplier;
                            ball.vy = (ball.vy - 2 * dot * ny) * bounceMultiplier;
                        }
                    }
                }
            }
        }
        return maxDuration;
    }

    startSearch(targetDuration, onProgress, onFound, options = {}) {
        this.stopSearch();
        const m = this.sim.activeMode;
        if (m.setTargetDuration) m.setTargetDuration(targetDuration);
        if (m.id && m.id !== 'classic' && !m.evaluateSeed) {
            if (onProgress) onProgress({ unsupported: true, message: 'La recherche de durée exacte n’a pas encore de simulateur dédié pour ce mode.' });
            return;
        }
        this.autoOptimize = (!!options.autoOptimize || m.id === 'accumulation') && (!m.id || m.id === 'classic' || typeof m.searchParameterSets === 'function');
        this.searchSettings = [];
        if (this.autoOptimize) {
            if (typeof m.searchParameterSets === 'function') {
                this.searchSettings = m.searchParameterSets(targetDuration) || [];
            } else {
                const ringCounts = [4, 5, 6, 7, 8, 9];
                const rotations = [0.06, 0.09, 0.12, 0.16, 0.22, 0.28];
                const gaps = [0.22, 0.28, 0.34, 0.40, 0.46, 0.52].map(v => Math.PI * v);
                const gravity = [0.12, 0.18, 0.24, 0.30];
                for (const rings of ringCounts) for (const rotation of rotations) {
                    const gap = gaps[(rings + Math.round(rotation * 100)) % gaps.length];
                    this.searchSettings.push({ ringCount: rings, rotationMultiplier: rotation, gapSize: gap, rotationDirection: m.rotationDirection || 'alternate', gravity: gravity[(rings + Math.round(rotation * 100)) % gravity.length] });
                }
            }
        }
        this.tolerance = m.searchTolerance ?? 0.45;

        this.targetDuration = targetDuration;
        this.onProgress = onProgress;
        this.onFound = onFound;
        this.isSearching = true;
        this.testedCount = 0;
        this.bestSeed = null;
        this.bestDuration = null;
        this.bestDiff = Infinity;
        this.currentSeedCandidate = Math.floor(Math.random() * 900000) + 100000;

        const maxDurationLimit = Math.max(120, targetDuration + 15);

        const frameTimeBudgetMs = 8; // Max 8ms per frame to keep 60 FPS silky smooth

        const searchStep = () => {
            if (!this.isSearching) return;

            const frameStart = performance.now();

            while (this.isSearching && (performance.now() - frameStart) < frameTimeBudgetMs) {
                this.currentSeedCandidate++;
                this.testedCount++;

                const settings = this.autoOptimize && this.searchSettings.length
                    ? this.searchSettings[this.testedCount % this.searchSettings.length]
                    : null;
                const duration = this.evaluateSeed(this.currentSeedCandidate, maxDurationLimit, settings);
                if (duration === null || !Number.isFinite(duration)) {
                    this.isSearching = false;
                    if (this.onProgress) this.onProgress({ unsupported: true, message: 'Ce mode ne possède pas encore de simulateur de recherche de seed.' });
                    return;
                }
                const diff = Math.abs(duration - this.targetDuration);

                if (diff < this.bestDiff) {
                    this.bestDiff = diff;
                    this.bestSeed = this.currentSeedCandidate;
                    this.bestDuration = duration;
                    this.bestSettings = settings ? { ...settings } : null;
                }

                // Match found within tolerance threshold!
                if (diff <= this.tolerance) {
                    this.isSearching = false;
                    if (this.onFound) {
                        this.onFound({
                            seed: this.currentSeedCandidate,
                            duration: duration,
                            settings: settings ? { ...settings } : null,
                            optimized: this.autoOptimize,
                            testedCount: this.testedCount
                        });
                    }
                    return;
                }
            }

            if (this.onProgress) {
                this.onProgress({
                    testedCount: this.testedCount,
                    bestSeed: this.bestSeed,
                    bestDuration: this.bestDuration,
                    bestDiff: this.bestDiff,
                    settings: this.bestSettings || null,
                    optimized: this.autoOptimize
                });
            }

            // Continue searching asynchronously without freezing the UI
            this.searchTaskId = requestAnimationFrame(searchStep);
        };

        this.searchTaskId = requestAnimationFrame(searchStep);
    }

    stopSearch() {
        this.isSearching = false;
        if (this.searchTaskId) {
            cancelAnimationFrame(this.searchTaskId);
            this.searchTaskId = null;
        }
    }
}

window.SeedSearcher = SeedSearcher;
