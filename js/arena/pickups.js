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
            this.spawnTimer = 1.0;
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
                const progress = Math.max(0, Math.min(1, 1 - this.spawnTimer / 1.0));
                const pulse = 0.65 + Math.sin(t * 9) * 0.2;
                const beamHeight = 260 + progress * 100;
                const beamWidth = 18 + Math.sin(t * 12) * 5;
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const beam = ctx.createLinearGradient(this.x, this.y - beamHeight, this.x, this.y + 24);
                beam.addColorStop(0, 'rgba(255,255,255,0)');
                beam.addColorStop(0.48, meta.glow || meta.color);
                beam.addColorStop(0.82, '#ffffff');
                beam.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.globalAlpha = pulse * (1 - progress * 0.45);
                ctx.fillStyle = beam;
                ctx.shadowColor = meta.glow || meta.color;
                ctx.shadowBlur = 34;
                ctx.fillRect(this.x - beamWidth / 2, this.y - beamHeight, beamWidth, beamHeight + 28);
                for (let ring = 0; ring < 3; ring++) {
                    const phase = (progress * 1.7 + ring / 3) % 1;
                    const ringRadius = 12 + phase * 108;
                    ctx.globalAlpha = (1 - phase) * 0.95;
                    ctx.strokeStyle = ring === 0 ? '#ffffff' : (meta.glow || meta.color);
                    ctx.lineWidth = ring === 0 ? 3 : 2;
                    ctx.beginPath();
                    ctx.ellipse(this.x, this.y + 5, ringRadius, ringRadius * 0.32, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.translate(this.x, this.y);
                ctx.rotate(-t * 2.4);
                ctx.globalAlpha = (1 - progress) * 0.9;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                for (let ray = 0; ray < 12; ray++) {
                    ctx.rotate(Math.PI / 6);
                    ctx.beginPath();
                    ctx.moveTo(22, 0);
                    ctx.lineTo(42 + Math.sin(t * 5 + ray) * 10, 0);
                    ctx.stroke();
                }
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

            // Pour l'épée, le pickup EST l'image de l'arme : aucun orbe ni icône générique.
            if (meta.category === 'weapons') {
                const weaponImage = window.BallYstikWeaponImages && window.BallYstikWeaponImages[meta.id];
                ctx.save();
                ctx.translate(this.x, this.y);
                const spawnProgress = this.state === 'spawning' ? Math.max(0, Math.min(1, 1 - this.spawnTimer / 1.0)) : 1;
                const appear = this.state === 'spawning' ? Math.max(0.2, spawnProgress) : 1;
                const weaponScale = this.state === 'spawning' ? 0.45 + 0.55 * spawnProgress : 1;
                ctx.scale(weaponScale, weaponScale);
                ctx.globalAlpha = appear;
                ctx.rotate(-Math.PI / 4);
                ctx.shadowColor = meta.glow || '#fde68a';
                ctx.shadowBlur = 22;
                if (weaponImage && weaponImage.complete && weaponImage.naturalWidth > 0) {
                    // Plus grande que l'ancienne icône, pour que l'épée soit clairement identifiable au sol.
                    const size = r * 5.2;
                    ctx.drawImage(weaponImage, -size / 2, -size / 2, size, size);
                } else {
                    // Fallback si l'image de cette arme ne se charge pas.
                    ctx.fillStyle = meta.color || '#fde68a';
                    ctx.font = 'bold 34px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(meta.icon || '⚔', 0, 0);
                }
                ctx.restore();
                // Conserver l'anneau de rareté éventuel, sans dessiner le corps d'un orbe.
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
                return;
            }

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

            // Orbe lisible + icône de la compétence au centre.
            // Les armes gardent leur rendu dédié basé sur leur image.
            ctx.save();
            const spawnProgress = this.state === 'spawning'
                ? Math.max(0, Math.min(1, 1 - this.spawnTimer / 1.0))
                : 1;
            const appear = this.state === 'spawning' ? 0.35 + 0.65 * spawnProgress : 1;
            ctx.globalAlpha = appear;
            ctx.shadowColor = meta.glow || meta.color || '#67e8f9';
            ctx.shadowBlur = 16;

            const orb = ctx.createRadialGradient(
                this.x - r * 0.3, this.y - r * 0.35, 1,
                this.x, this.y, r * 1.15
            );
            orb.addColorStop(0, '#ffffff');
            orb.addColorStop(0.22, meta.glow || meta.color || '#67e8f9');
            orb.addColorStop(1, '#111827');
            ctx.fillStyle = orb;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 0.92, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = appear * 0.9;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 0.92, 0, Math.PI * 2);
            ctx.stroke();

            const icon = meta.icon || '?';
            ctx.globalAlpha = appear;
            ctx.font = 'bold 19px "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(10, 15, 28, 0.9)';
            ctx.strokeText(icon, this.x, this.y + 0.5);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#0b1020';
            ctx.shadowBlur = 5;
            ctx.fillText(icon, this.x, this.y + 0.5);
            ctx.restore();
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
            // Intervalle à 0 = désactivation explicite des nouveaux spawns.
            if (Number(this.spawnInterval) > 0) {
                this.spawnTimer -= dt;
                if (this.spawnTimer <= 0) {
                    this.spawnTimer = this.spawnInterval;
                    this._trySpawn(world);
                }
            } else {
                this.spawnTimer = 0;
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

        spawnAbility(meta, world) {
            if (!meta || !world || !world.arena) return false;
            const a = world.arena;
            let best = null, bestMinDist = -Infinity;
            for (let attempt = 0; attempt < 18; attempt++) {
                const x = a.x + 36 + this.prng.next() * Math.max(1, a.w - 72);
                const y = a.y + 36 + this.prng.next() * Math.max(1, a.h - 72);
                if (typeof a.isPointInside === 'function' && !a.isPointInside(x, y, 18)) continue;
                let minD = Infinity;
                for (const b of world.balls) {
                    if (!b.alive) continue;
                    minD = Math.min(minD, Math.hypot(b.x - x, b.y - y));
                }
                for (const o of (a.obstacles || [])) minD = Math.min(minD, Math.hypot(o.x - x, o.y - y) - o.r);
                if (minD > bestMinDist) { bestMinDist = minD; best = { x, y }; }
            }
            if (!best) return false;
            const pickup = new Pickup(best.x, best.y, meta, this.prng);
            pickup.spawnTimer = 1.0;
            pickup.radius = meta.category === 'weapons' ? 19 : 16;
            this.items.push(pickup);
            world.spawnParticle(best.x, best.y, { color: '#ffffff', count: 18, speed: 260, life: 0.9, spread: Math.PI * 2, size: 3.2 });
            world.spawnParticle(best.x, best.y, { color: meta.glow || meta.color || '#67e8f9', count: 42, speed: 220, life: 1.15, spread: Math.PI * 2, size: 3.5 });
            world.addShockwave(best.x, best.y, { radius: 110, color: '#ffffff', life: 0.7 });
            world.addShockwave(best.x, best.y, { radius: 76, color: meta.glow || meta.color || '#67e8f9', life: 0.95 });
            world.playSound('pickup-spawn', { pitch: meta.category === 'weapons' ? 1.15 : 0.9 });
            return true;
        }

        _trySpawn(world) {
            if (!world.arena) return;
            const a = world.arena;
            // Essaie 8 positions, garde la plus éloignée des boules
            let best = null, bestMinDist = 0;
            for (let attempt = 0; attempt < 8; attempt++) {
                const x = a.x + 40 + this.prng.next() * (a.w - 80);
                const y = a.y + 40 + this.prng.next() * (a.h - 80);
                if (typeof a.isPointInside === 'function' && !a.isPointInside(x, y, 18)) continue;

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