/**
 * PICKUPS — Orbes de capacité qui spawn au sol.
 */
(function () {
    'use strict';

    class Pickup {
        constructor(x, y, abilityMeta, prng) {
            this.x = x;
            this.y = y;
            this.baseY = y;
            this.vx = 0;
            this.vy = 0;
            this.meta = abilityMeta;
            this.age = 0;
            this.state = 'spawning'; // spawning | idle | sucked | taken
            this.spawnTimer = 0.5;
            this.life = 22;
            this.taken = false;
            this.seed = (prng && prng.next ? prng.next() : Math.random()) * 1000;
            this.radius = 16;
        }

        update(dt, world) {
            this.age += dt;
            this.life -= dt;
            if (this.life <= 0 && this.state === 'idle') {
                this.state = 'taken'; // disparaît silencieusement
                return;
            }

            if (this.state === 'spawning') {
                this.spawnTimer -= dt;
                if (this.spawnTimer <= 0) this.state = 'idle';
            } else if (this.state === 'idle') {
                // Flottement
                this.baseY = this.baseY + this.vy * dt;
                this.vy *= 0.9;
                this.x += this.vx * dt;
                this.vx *= 0.9;
                this.baseY = Math.max(world.arena.y + 30, Math.min(world.arena.y + world.arena.h - 30, this.baseY));
                this.y = this.baseY + Math.sin(this.age * 2 + this.seed) * 6;
            } else if (this.state === 'sucked') {
                // Aspiré vers la boule
                const dx = this.suckedBy.x - this.x;
                const dy = this.suckedBy.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist < this.suckedBy.radius + 5) {
                    this.state = 'taken';
                    world.grantAbility(this.suckedBy, this.meta);
                    world.playSound('pickup', { pitch: 1 + Math.random() * 0.3 });
                    world.spawnParticle(this.x, this.y, {
                        color: this.meta.color, count: 14, speed: 200, life: 0.5, spread: Math.PI * 2
                    });
                    world.addShockwave(this.x, this.y, { radius: 40, color: this.meta.color, life: 0.3 });
                } else {
                    const speed = 500;
                    this.x += (dx / dist) * speed * dt;
                    this.y += (dy / dist) * speed * dt;
                }
            }
        }

        trySuck(ball) {
            if (this.state === 'idle') {
                this.state = 'sucked';
                this.suckedBy = ball;
            }
        }

        render(ctx) {
            if (this.state === 'taken') return;

            const t = performance.now() * 0.003;
            const r = this.radius;
            const meta = this.meta;

            // Colonne de lumière pendant le spawn
            if (this.state === 'spawning') {
                const sp = 1 - this.spawnTimer / 0.5;
                ctx.save();
                ctx.globalAlpha = (1 - sp) * 0.7;
                ctx.fillStyle = meta.color;
                ctx.fillRect(this.x - 8, this.y - 200, 16, 200);
                ctx.restore();
            }

            // Halo externe
            ctx.save();
            ctx.globalAlpha = 0.5 + 0.25 * Math.sin(t * 2 + this.seed);
            const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 2.2);
            grd.addColorStop(0, meta.glow);
            grd.addColorStop(0.5, meta.color + '80');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Anneau en rotation
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(t + this.seed);
            ctx.globalAlpha = 0.85;
            ctx.strokeStyle = meta.color;
            ctx.lineWidth = 1.6;
            ctx.shadowColor = meta.glow;
            ctx.shadowBlur = 12;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Corps central
            ctx.save();
            ctx.shadowColor = meta.glow;
            ctx.shadowBlur = 16;
            ctx.fillStyle = meta.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fill();
            // Noyau blanc
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Icône
            ctx.save();
            ctx.fillStyle = '#000';
            ctx.font = `bold ${r * 0.9}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(meta.icon, this.x, this.y + 1);
            ctx.restore();

            // Rareté : contour doré pour epic
            if (meta.rarity === 'epic') {
                ctx.save();
                ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 4);
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(this.x, this.y, r + 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    class PickupSystem {
        constructor(prng) {
            this.prng = prng;
            this.items = [];
            this.spawnTimer = 3;
            this.spawnInterval = 5;
        }

        setConfig(cfg) {
            if (cfg.spawnInterval != null) this.spawnInterval = cfg.spawnInterval;
        }

        update(dt, world) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.spawnTimer = this.spawnInterval;
                this._trySpawn(world);
            }

            for (let i = this.items.length - 1; i >= 0; i--) {
                const p = this.items[i];
                p.update(dt, world);
                if (p.state === 'taken') {
                    this.items.splice(i, 1);
                    continue;
                }

                // Check ramassage par les boules
                if (p.state === 'idle') {
                    for (const b of world.balls) {
                        if (!b.alive) continue;
                        const dx = b.x - p.x;
                        const dy = b.y - p.y;
                        if (dx * dx + dy * dy < (b.radius + p.radius) ** 2) {
                            p.trySuck(b);
                            break;
                        }
                    }
                }
            }
        }

        _trySpawn(world) {
            if (!world.arena) return;
            const a = world.arena;
            // Essaie 8 positions, garde la plus éloignée des boules
            let best = null, bestMinDist = 0;
            for (let attempt = 0; attempt < 8; attempt++) {
                const x = a.x + 40 + this.prng.next() * (a.w - 80);
                const y = a.y + 40 + this.prng.next() * (a.h - 80);

                let minD = Infinity;
                for (const b of world.balls) {
                    if (!b.alive) continue;
                    const d = Math.hypot(b.x - x, b.y - y);
                    if (d < minD) minD = d;
                }
                // Évite aussi les obstacles
                for (const o of a.obstacles) {
                    const d = Math.hypot(o.x - x, o.y - y) - o.r;
                    if (d < minD) minD = d;
                }
                if (minD > bestMinDist) {
                    bestMinDist = minD;
                    best = { x, y };
                }
            }
            if (!best) return;

            const meta = world.pickAbilityMeta
                ? world.pickAbilityMeta()
                : window.AbilityRegistry.pickRandom(this.prng);
            if (!meta) return;

            this.items.push(new Pickup(best.x, best.y, meta, this.prng));
            world.playSound('pickup-spawn', { pitch: 0.9 });
        }

        render(ctx) {
            for (const p of this.items) p.render(ctx);
        }

        clear() { this.items.length = 0; }
    }

    window.Pickup = Pickup;
    window.PickupSystem = PickupSystem;
})();