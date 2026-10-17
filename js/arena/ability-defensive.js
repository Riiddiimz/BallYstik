/**
 * ABILITIES — Comportements DÉFENSIFS.
 */
(function () {
    'use strict';

    window.AbilityBehaviors = window.AbilityBehaviors || {};

    // ═══════ BOUCLIER ═══════
    window.AbilityBehaviors.shield = {
        attach(ball, world, slot) {
            slot.data = {
                hp: 40,
                maxHp: 40,
                regenDelay: 0,
                regenDelaySetting: 3,
                regenRate: 5,
                hitFlash: 0,
                cracks: 0
            };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;

            if (d.regenDelay > 0) {
                d.regenDelay -= dt;
            } else if (d.hp < d.maxHp) {
                d.hp = Math.min(d.maxHp, d.hp + d.regenRate * dt);
            }
            if (d.hitFlash > 0) d.hitFlash = Math.max(0, d.hitFlash - dt * 4);

            // Met à jour l'état des craquelures
            const ratio = d.hp / d.maxHp;
            d.cracks = ratio > 0.66 ? 0 : ratio > 0.33 ? 1 : 2;
        },
        onTakeDamage(ball, attacker, amount, world, slot) {
            const d = slot.data;
            if (!d || d.hp <= 0) return amount;

            const absorbed = Math.min(d.hp, amount);
            d.hp -= absorbed;
            d.regenDelay = d.regenDelaySetting;
            d.hitFlash = 1;

            world.spawnParticle(ball.x, ball.y, {
                color: '#93c5fd', count: 6, speed: 160, life: 0.4, spread: Math.PI * 2
            });
            world.addHitFlash(ball.x, ball.y);
            world.playSound('shield-hit', { pitch: 1 });

            if (d.hp <= 0) {
                // Rupture
                world.spawnParticle(ball.x, ball.y, {
                    color: '#93c5fd', count: 18, speed: 300, life: 0.7, spread: Math.PI * 2
                });
                world.addShockwave(ball.x, ball.y, { radius: ball.radius * 3, color: '#93c5fd', life: 0.4 });
                world.playSound('shield-break', { pitch: 0.9 });
                d.hp = 0;
            }

            return amount - absorbed;
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d || d.hp <= 0) return;

            const ratio = d.hp / d.maxHp;
            const r = ball.radius + 6;

            // Dôme hexagonal translucide
            ctx.save();
            ctx.globalAlpha = 0.15 + 0.25 * ratio;
            ctx.strokeStyle = '#93c5fd';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#60a5fa';
            ctx.shadowBlur = 14;

            // 6 côtés
            ctx.beginPath();
            for (let i = 0; i <= 6; i++) {
                const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                const px = ball.x + Math.cos(a) * r;
                const py = ball.y + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Remplissage léger
            ctx.globalAlpha = 0.08 * ratio;
            ctx.fillStyle = '#93c5fd';
            ctx.fill();
            ctx.restore();

            // Craquelures selon l'état
            if (d.cracks > 0) {
                ctx.save();
                ctx.globalAlpha = 0.7;
                ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                ctx.lineWidth = 1.2;
                const seedBase = ball.id * 977;
                for (let i = 0; i < d.cracks * 3; i++) {
                    const a1 = ((seedBase + i * 133) % 360) * Math.PI / 180;
                    const a2 = a1 + 0.3;
                    const r1 = r * 0.3;
                    const r2 = r * 0.95;
                    ctx.beginPath();
                    ctx.moveTo(ball.x + Math.cos(a1) * r1, ball.y + Math.sin(a1) * r1);
                    ctx.lineTo(ball.x + Math.cos(a2) * r2, ball.y + Math.sin(a2) * r2);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Flash d'impact
            if (d.hitFlash > 0) {
                ctx.save();
                ctx.globalAlpha = d.hitFlash * 0.7;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }
    };

    // ═══════ ÉPINES ═══════
    window.AbilityBehaviors.thorns = {
        attach(ball, world, slot) {
            slot.data = { reflectRatio: 0.4, spikeStretch: 0, angle: 0, count: 10 };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;
            d.angle += dt * 0.8;
            if (d.spikeStretch > 0) d.spikeStretch = Math.max(0, d.spikeStretch - dt * 3);
        },
        onTakeDamage(ball, attacker, amount, world, slot) {
            const d = slot.data;
            if (!d || !attacker || !attacker.alive) return amount;

            const reflect = amount * d.reflectRatio;
            if (reflect > 0) {
                world.damage(attacker, ball, reflect, 'thorns', { ignoreInvuln: true, noThornsReflect: true });
                d.spikeStretch = 1;
                // Ligne de riposte vers l'attaquant
                world.spawnParticle(attacker.x, attacker.y, {
                    color: '#ef4444', count: 3, speed: 120, life: 0.35
                });
                world.playSound('thorns', { pitch: 1.2 });
            }
            return amount;
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d) return;
            const baseR = ball.radius;
            const stretch = 1 + d.spikeStretch * 0.8;

            ctx.save();
            for (let i = 0; i < d.count; i++) {
                const a = d.angle + (i / d.count) * Math.PI * 2;
                const len = baseR * 0.55 * stretch;
                const x1 = ball.x + Math.cos(a) * baseR;
                const y1 = ball.y + Math.sin(a) * baseR;
                const x2 = ball.x + Math.cos(a) * (baseR + len);
                const y2 = ball.y + Math.sin(a) * (baseR + len);

                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2 * stretch;
                ctx.shadowColor = '#fca5a5';
                ctx.shadowBlur = 8 + d.spikeStretch * 12;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // Pointe lumineuse
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(x2, y2, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    };

    // ═══════ RÉGÉNÉRATION ═══════
    window.AbilityBehaviors.regen = {
        attach(ball, world, slot) {
            slot.data = { healRate: 4, plusTimer: 0, plusEvery: 0.8 };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;
            if (ball.health) ball.health.heal(d.healRate * dt);

            d.plusTimer -= dt;
            if (d.plusTimer <= 0) {
                d.plusTimer = d.plusEvery;
                // "+" flottant
                world.addFloatingPlus?.(ball.x + (Math.random() - 0.5) * 20,
                                       ball.y - ball.radius - 4);
            }
        },
        render(ctx, ball, world, slot) {
            // Aura verte douce
            const t = performance.now() * 0.003;
            ctx.save();
            ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t);
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 24;
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius + 4 + Math.sin(t) * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    };

    // ═══════ TÉLÉPORTATION ═══════
    window.AbilityBehaviors.teleport = {
        attach(ball, world, slot) {
            slot.data = {
                cooldown: 4,
                timer: 3,
                distance: 100,
                invulnTime: 0.3,
                afterimages: []
            };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;

            d.timer -= dt;

            // Update des afterimages
            for (let i = d.afterimages.length - 1; i >= 0; i--) {
                d.afterimages[i].life -= dt;
                if (d.afterimages[i].life <= 0) d.afterimages.splice(i, 1);
            }

            if (d.timer <= 0) {
                d.timer = d.cooldown;
                const v = Math.hypot(ball.vx, ball.vy) || 1;
                const ux = ball.vx / v;
                const uy = ball.vy / v;

                // Afterimage départ
                d.afterimages.push({ x: ball.x, y: ball.y, life: 0.35, maxLife: 0.35 });

                // Déplacement
                const newX = ball.x + ux * d.distance;
                const newY = ball.y + uy * d.distance;

                // Particules implosion
                world.spawnParticle(ball.x, ball.y, {
                    color: '#c084fc', count: 10, speed: -60, life: 0.4
                });

                // Repositionne (l'arène corrigera si hors-limites)
                ball.x = newX;
                ball.y = newY;
                world.arena.resolveBall(ball);

                // Invulnérabilité
                if (ball.health) ball.health.invuln = d.invulnTime;

                // Afterimage arrivée
                d.afterimages.push({ x: ball.x, y: ball.y, life: 0.35, maxLife: 0.35 });

                // Particules explosion
                world.spawnParticle(ball.x, ball.y, {
                    color: '#e9d5ff', count: 14, speed: 220, life: 0.5, spread: Math.PI * 2
                });
                world.addShockwave(ball.x, ball.y, { radius: 40, color: '#c084fc', life: 0.3 });
                world.playSound('teleport', { pitch: 1 + Math.random() * 0.2 });
            }
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d) return;

            for (const ai of d.afterimages) {
                const t = ai.life / ai.maxLife;
                ctx.save();
                ctx.globalAlpha = t * 0.5;
                ctx.fillStyle = '#c084fc';
                ctx.shadowColor = '#e9d5ff';
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(ai.x, ai.y, ball.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    };

})();