/**
 * STATUS EFFECTS — Brûlure, Gel, Poison, Étourdissement.
 */
(function () {
    'use strict';

    const DEFS = {
        burn:   { duration: 3, stackable: true,  tickRate: 1.0, dmgPerTick: 3, color: '#ff6b35', icon: '🔥' },
        freeze: { duration: 2, stackable: false, slowFactor: 0.5,        color: '#66d9ff', icon: '❄' },
        poison: { duration: 5, stackable: true,  tickRate: 1.0, dmgPerTick: 2, color: '#a855f7', icon: '☠' },
        stun:   { duration: 0.8, stackable: false,                        color: '#fbbf24', icon: '💫' }
    };

    class StatusEffects {
        constructor(ball) {
            this.ball = ball;
            this.active = {};
        }

        has(type) { return !!this.active[type]; }

        apply(type, duration = null, source = null) {
            const def = DEFS[type];
            if (!def) return;
            const dur = duration ?? def.duration;
            if (this.active[type]) {
                if (def.stackable) {
                    this.active[type].stacks = Math.min(5, this.active[type].stacks + 1);
                    this.active[type].timeLeft = Math.max(this.active[type].timeLeft, dur);
                } else {
                    this.active[type].timeLeft = Math.max(this.active[type].timeLeft, dur);
                }
                this.active[type].source = source || this.active[type].source;
            } else {
                this.active[type] = {
                    timeLeft: dur,
                    maxTime: dur,
                    stacks: 1,
                    tickAcc: 0,
                    source
                };
            }
        }

        remove(type) { delete this.active[type]; }

        getSpeedMultiplier() {
            if (this.active.freeze) return DEFS.freeze.slowFactor;
            return 1;
        }

        isStunned() { return !!this.active.stun; }

        update(dt, world) {
            for (const type in this.active) {
                const s = this.active[type];
                s.timeLeft -= dt;
                if (s.timeLeft <= 0) {
                    delete this.active[type];
                    continue;
                }

                const def = DEFS[type];
                if (def.tickRate && def.dmgPerTick) {
                    s.tickAcc += dt;
                    while (s.tickAcc >= def.tickRate) {
                        s.tickAcc -= def.tickRate;
                        const dmg = def.dmgPerTick * s.stacks;
                        if (world && world.damage) {
                            world.damage(this.ball, s.source, dmg, type, { silent: true });
                        }
                        if (world && world.spawnParticle) {
                            world.spawnParticle(this.ball.x, this.ball.y, {
                                color: def.color, count: 2, speed: 40, life: 0.4
                            });
                        }
                    }
                }
            }
        }

        render(ctx) {
            const b = this.ball;
            const r = b.radius;

            if (this.active.burn) {
                const t = performance.now() * 0.006;
                for (let i = 0; i < 5; i++) {
                    const a = t + i * 1.3;
                    const px = b.x + Math.cos(a) * r * 0.7;
                    const py = b.y + Math.sin(a) * r * 0.7 - Math.abs(Math.sin(a * 2)) * 4;
                    const size = 3 + Math.sin(a * 3) * 1.5;
                    ctx.save();
                    ctx.globalAlpha = 0.75;
                    ctx.fillStyle = '#ff6b35';
                    ctx.shadowColor = '#ffd166';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            if (this.active.freeze) {
                ctx.save();
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = '#66d9ff';
                ctx.beginPath();
                ctx.arc(b.x, b.y, r + 1, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                ctx.save();
                ctx.strokeStyle = 'rgba(200,240,255,0.85)';
                ctx.lineWidth = 1.2;
                for (let i = 0; i < 4; i++) {
                    const a = i * Math.PI / 2 + performance.now() * 0.001;
                    const px = b.x + Math.cos(a) * r * 0.9;
                    const py = b.y + Math.sin(a) * r * 0.9;
                    ctx.beginPath();
                    ctx.moveTo(px - 3, py);
                    ctx.lineTo(px + 3, py);
                    ctx.moveTo(px, py - 3);
                    ctx.lineTo(px, py + 3);
                    ctx.stroke();
                }
                ctx.restore();
            }

            if (this.active.poison) {
                const t = performance.now() * 0.003;
                for (let i = 0; i < 3; i++) {
                    const a = t + i * 2.1;
                    const px = b.x + Math.sin(a) * r * 0.6;
                    const py = b.y - r - 3 - ((t * 20 + i * 10) % 20);
                    ctx.save();
                    ctx.globalAlpha = 0.6;
                    ctx.fillStyle = '#a855f7';
                    ctx.beginPath();
                    ctx.arc(px, py, 2 + Math.sin(a) * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            if (this.active.stun) {
                const t = performance.now() * 0.005;
                for (let i = 0; i < 3; i++) {
                    const a = t + i * (Math.PI * 2 / 3);
                    const px = b.x + Math.cos(a) * (r + 8);
                    const py = b.y - r - 4 + Math.sin(a) * 3;
                    ctx.save();
                    ctx.fillStyle = '#fbbf24';
                    ctx.shadowColor = '#fbbf24';
                    ctx.shadowBlur = 8;
                    ctx.font = '12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('★', px, py);
                    ctx.restore();
                }
            }
        }

        clear() { this.active = {}; }
    }

    window.StatusEffects = StatusEffects;
    window.STATUS_DEFS = DEFS;
})();