/* ==========================================================================
   Escape Mode - Concentric Rotating Rings & Spikes
   ========================================================================== */

class ClassicMode {
    constructor(sim) {
        this.sim = sim;
        this.id = 'classic';
        this.name = 'Escape';

        // Rings Configuration
        this.rings = [];
        this.ringCount = 6;
        this.clearedCount = 0;
        this.rotationMultiplier = 0.12;
        this.rotationDirection = 'alternate'; // 'alternate' | 'clockwise' | 'counter'
        this.initialGapMode = 'random'; // 'random' | 'offset' | 'alternate'
        this.gapOffset = 0; // degrees between consecutive rings in offset mode
        this.gapSize = Math.PI * 0.45;
        this.paletteName = 'neon';
        this.multiColor = true;

        // Spikes Configuration
        this.spikesEnabled = false;
        this.spikeCount = 8;
        this.spikeLength = 16;
        this.spikeWidth = 0.12;

        // Palettes HSL Hues
        this.palettes = {
            neon: [320, 190, 275, 155, 225, 45],
            cyberpunk: [325, 185, 290, 175, 340, 195],
            ocean: [185, 205, 225, 245, 265, 285],
            sunset: [350, 15, 30, 45, 15, 330],
            candy: [325, 345, 285, 250, 195, 220],
            fire: [0, 15, 28, 42, 55, 10],
            rainbow: [0, 60, 120, 180, 240, 300]
        };
    }

    getRingHue(index) {
        const palette = this.palettes[this.paletteName] || this.palettes.neon;
        return this.multiColor ? palette[index % palette.length] : palette[0];
    }

    updateRingColors() {
        this.rings.forEach((ring, i) => {
            ring.hue = this.getRingHue(i);
        });
    }

    setupRings(resetState = true) {
        const count = this.ringCount;
        if (resetState || this.rings.length !== count) {
            this.rings = [];
            this.clearedCount = 0;

            for (let i = 0; i < count; i++) {
                let speedSign = 1;
                if (this.rotationDirection === 'alternate') {
                    speedSign = (i % 2 === 0 ? 1 : -1);
                } else if (this.rotationDirection === 'counter') {
                    speedSign = -1;
                }

                let initialAngle;
                if (this.initialGapMode === 'random') {
                    // Use the simulation's seeded PRNG to preserve reproducibility.
                    initialAngle = this.sim.prng.random() * Math.PI * 2;
                } else if (this.initialGapMode === 'offset') {
                    initialAngle = i * this.gapOffset * Math.PI / 180;
                } else if (this.initialGapMode === 'alternate') {
                    initialAngle = (i % 2) * Math.PI;
                } else {
                    initialAngle = this.sim.prng.random() * Math.PI * 2;
                }

                this.rings.push({
                    radius: 0,
                    gapAngle: initialAngle,
                    gapSize: this.gapSize,
                    rotationSpeed: speedSign * (0.22 + i * 0.04),
                    hue: this.getRingHue(i),
                    active: true
                });
            }
        }
        this.updateGeometry();
    }

    updateGeometry() {
        if (!this.rings.length) return;
        const count = this.rings.length;
        const maxRadius = Math.max(30, this.sim.boundaryRadius - 6);
        const innerRadius = Math.max(22, Math.min(65, this.sim.boundaryRadius * 0.24));
        const spacing = count > 1 ? (maxRadius - innerRadius) / (count - 1) : 0;

        this.rings.forEach((ring, i) => {
            ring.radius = Math.min(maxRadius, innerRadius + i * spacing);
            ring.gapSize = this.gapSize;
            ring.hue = this.getRingHue(i);
        });
    }

    update(dtScale) {
        // Rotate active rings
        for (const ring of this.rings) {
            if (ring.active) {
                ring.gapAngle = (ring.gapAngle + ring.rotationSpeed * this.rotationMultiplier * dtScale) % (Math.PI * 2);
            }
        }
    }

    handleCollision(ball) {
        const dx = ball.x - this.sim.center.x;
        const dy = ball.y - this.sim.center.y;
        const dist = Math.hypot(dx, dy);

        // Find current innermost active ring
        const ringIndex = this.rings.findIndex(r => r.active);
        if (ringIndex === -1) {
            // All rings cleared!
            if (dist > this.sim.boundaryRadius + ball.radius * 2) {
                this.sim.triggerVictory();
            }
            return;
        }

        const ring = this.rings[ringIndex];
        const radialVelocity = (ball.vx * dx + ball.vy * dy) / Math.max(dist, 0.001);

        // Distance to ring inner boundary
        const distDiff = dist - (ring.radius - ball.radius);

        if (distDiff >= 0 && radialVelocity > 0) {
            // Check if ball center is within the gap opening
            const ballAngle = Math.atan2(dy, dx);
            let relAngle = (ballAngle - ring.gapAngle) % (Math.PI * 2);
            relAngle = Math.atan2(Math.sin(relAngle), Math.cos(relAngle));

            if (Math.abs(relAngle) <= ring.gapSize / 2) {
                // Ball escapes through the gap
                ring.active = false;
                this.clearedCount++;
                this.sim.totalBounces++;

                // Sound
                if (window.audioSynth) {
                    window.audioSynth.playBounceSound(radialVelocity * radialVelocity * 1.5, ringIndex * 2);
                }

                // Spark burst at the gap
                const gapX = this.sim.center.x + Math.cos(ring.gapAngle) * ring.radius;
                const gapY = this.sim.center.y + Math.sin(ring.gapAngle) * ring.radius;
                this.sim.addEffects(gapX, gapY, `hsl(${ring.hue}, 100%, 65%)`);

                // Check victory condition
                if (this.rings.every(r => !r.active)) {
                    this.sim.triggerVictory();
                }
                return;
            }

            // Normal bounce off solid ring wall
            const nx = dx / Math.max(dist, 0.001);
            const ny = dy / Math.max(dist, 0.001);

            // Clamp strictly inside ring
            ball.x = this.sim.center.x + nx * (ring.radius - ball.radius);
            ball.y = this.sim.center.y + ny * (ring.radius - ball.radius);

            const dot = ball.vx * nx + ball.vy * ny;
            if (dot > 0) {
                const bounceMult = this.sim.bounciness * this.sim.speedBoost;
                ball.vx = (ball.vx - 2 * dot * nx) * bounceMult;
                ball.vy = (ball.vy - 2 * dot * ny) * bounceMult;

                this.sim.totalBounces++;
                const velSq = ball.vx * ball.vx + ball.vy * ball.vy;
                if (window.audioSynth) {
                    window.audioSynth.playBounceSound(velSq, ringIndex);
                }
                this.sim.addEffects(ball.x, ball.y, `hsl(${ring.hue}, 100%, 65%)`);
            }
        }
    }

    handleSpikeCollision(ball) {
        if (!this.spikesEnabled) return;

        const ring = this.rings.find(r => r.active);
        if (!ring) return;

        const availableArc = Math.PI * 2 - ring.gapSize;
        const spikeStep = availableArc / this.spikeCount;
        const firstSpikeAngle = ring.gapAngle + ring.gapSize / 2 + spikeStep / 2;
        const spikeTipRadius = Math.max(1, ring.radius - this.spikeLength);
        const baseRadius = ring.radius;

        const closestOnSegment = (px, py, ax, ay, bx, by) => {
            const abx = bx - ax;
            const aby = by - ay;
            const lenSq = abx * abx + aby * aby;
            const t = lenSq > 0 ? Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq)) : 0;
            return { x: ax + abx * t, y: ay + aby * t };
        };

        for (let s = 0; s < this.spikeCount; s++) {
            const spikeAngle = firstSpikeAngle + s * spikeStep;
            const halfWidth = this.spikeWidth;

            const ux = Math.cos(spikeAngle);
            const uy = Math.sin(spikeAngle);

            const leftX = this.sim.center.x + Math.cos(spikeAngle - halfWidth) * baseRadius;
            const leftY = this.sim.center.y + Math.sin(spikeAngle - halfWidth) * baseRadius;
            const tipX = this.sim.center.x + ux * spikeTipRadius;
            const tipY = this.sim.center.y + uy * spikeTipRadius;
            const rightX = this.sim.center.x + Math.cos(spikeAngle + halfWidth) * baseRadius;
            const rightY = this.sim.center.y + Math.sin(spikeAngle + halfWidth) * baseRadius;

            const p1 = closestOnSegment(ball.x, ball.y, leftX, leftY, tipX, tipY);
            const p2 = closestOnSegment(ball.x, ball.y, tipX, tipY, rightX, rightY);

            const d1Sq = (ball.x - p1.x) ** 2 + (ball.y - p1.y) ** 2;
            const d2Sq = (ball.x - p2.x) ** 2 + (ball.y - p2.y) ** 2;

            const best = d1Sq < d2Sq ? p1 : p2;
            const bestDist = Math.sqrt(Math.min(d1Sq, d2Sq));

            if (bestDist < ball.radius) {
                let nx = ball.x - best.x;
                let ny = ball.y - best.y;
                const len = Math.hypot(nx, ny) || 1;
                nx /= len;
                ny /= len;

                const dot = ball.vx * nx + ball.vy * ny;
                if (dot < 0) {
                    const pen = ball.radius - bestDist;
                    ball.x += nx * pen;
                    ball.y += ny * pen;

                    ball.vx = (ball.vx - 2 * dot * nx) * this.sim.bounciness;
                    ball.vy = (ball.vy - 2 * dot * ny) * this.sim.bounciness;

                    this.sim.totalBounces++;
                    if (window.audioSynth) {
                        window.audioSynth.playBounceSound(ball.vx * ball.vx + ball.vy * ball.vy, 4);
                    }
                    this.sim.addEffects(ball.x, ball.y, '#ff0055');
                    return;
                }
            }
        }
    }

    render(ctx) {
        ctx.save();

        this.rings.forEach(ring => {
            if (!ring.active) return;
            const gap = ring.gapSize / 2;
            const start = ring.gapAngle + gap;
            const end = ring.gapAngle + Math.PI * 2 - gap;
            const color = `hsl(${ring.hue}, 100%, 65%)`;

            // Glowing Outer Ring Arc
            ctx.beginPath();
            ctx.arc(this.sim.center.x, this.sim.center.y, ring.radius, start, end);
            ctx.strokeStyle = color;
            const styleGlow = this.sim.visualStyle === 'minimal' ? 0 : this.sim.visualStyle === 'soft' ? 0.45 : 1;
            ctx.lineWidth = this.sim.visualStyle === 'minimal' ? 3.5 : this.sim.visualStyle === 'soft' ? 5 : 7;
            ctx.lineCap = 'round';
            ctx.shadowColor = color;
            ctx.shadowBlur = this.sim.glowIntensity * 14 * styleGlow;
            ctx.stroke();

            // Inner crisp white neon accent
            ctx.beginPath();
            ctx.arc(this.sim.center.x, this.sim.center.y, ring.radius, start, end);
            ctx.strokeStyle = this.sim.visualStyle === 'minimal' ? color : '#ffffff';
            ctx.lineWidth = this.sim.visualStyle === 'minimal' ? 1.2 : 1.8;
            ctx.shadowBlur = 0;
            ctx.stroke();

            // Spikes
            if (this.spikesEnabled) {
                const availableArc = Math.PI * 2 - ring.gapSize;
                const spikeStep = availableArc / this.spikeCount;
                const firstSpikeAngle = ring.gapAngle + ring.gapSize / 2 + spikeStep / 2;
                const spikeTipRadius = Math.max(1, ring.radius - this.spikeLength);

                for (let s = 0; s < this.spikeCount; s++) {
                    const spikeAngle = firstSpikeAngle + s * spikeStep;
                    const halfWidth = this.spikeWidth;
                    const baseRadius = ring.radius;
                    const leftAngle = spikeAngle - halfWidth;
                    const rightAngle = spikeAngle + halfWidth;

                    ctx.beginPath();
                    ctx.moveTo(
                        this.sim.center.x + Math.cos(leftAngle) * baseRadius,
                        this.sim.center.y + Math.sin(leftAngle) * baseRadius
                    );
                    ctx.lineTo(
                        this.sim.center.x + Math.cos(spikeAngle) * spikeTipRadius,
                        this.sim.center.y + Math.sin(spikeAngle) * spikeTipRadius
                    );
                    ctx.lineTo(
                        this.sim.center.x + Math.cos(rightAngle) * baseRadius,
                        this.sim.center.y + Math.sin(rightAngle) * baseRadius
                    );
                    ctx.closePath();
                    ctx.fillStyle = '#ff2a85';
                    ctx.shadowColor = '#ff2a85';
                    ctx.shadowBlur = 10;
                    ctx.fill();
                }
            }
        });

        ctx.restore();
    }
}
