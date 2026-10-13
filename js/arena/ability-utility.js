/**
 * ABILITIES — Comportements UTILITAIRES.
 */
(function () {
    'use strict';

    window.AbilityBehaviors = window.AbilityBehaviors || {};

    function findNearestEnemy(ball, world, maxDist = Infinity) {
        let best = null, bestD = maxDist * maxDist;
        for (const other of world.balls) {
            if (other === ball || !other.alive || other.team === ball.team) continue;
            const dx = other.x - ball.x;
            const dy = other.y - ball.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD) { bestD = d2; best = other; }
        }
        return best;
    }

    // ═══════ DASH / CHARGE ═══════
    window.AbilityBehaviors.dash = {
        attach(ball, world, slot) {
            slot.data = {
                cooldown: 5,
                timer: 2.5,
                dashTime: 0.4,
                dashMult: 3,
                contactDamage: 15,
                active: false,
                hitTimers: {}
            };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;

            for (const k in d.hitTimers) {
                d.hitTimers[k] -= dt;
                if (d.hitTimers[k] <= 0) delete d.hitTimers[k];
            }

            if (d.active) {
                d.dashTime -= dt;
                // Motion blur : afterimages
                if (Math.random() < 0.7) {
                    world.spawnParticle(ball.x, ball.y, {
                        color: '#fbbf24', count: 1, speed: 20, life: 0.3
                    });
                }
                if (d.dashTime <= 0) {
                    d.active = false;
                    // Multiplicateur de vitesse revient à la normale
                    ball.speedMultiplier = 1;
                    // Nuage d'atterrissage
                    world.spawnParticle(ball.x, ball.y, {
                        color: '#fde68a', count: 8, speed: 120, life: 0.5, spread: Math.PI * 2
                    });
                }
            } else {
                d.timer -= dt;
                if (d.timer <= 0) {
                    d.timer = d.cooldown;
                    d.active = true;
                    d.dashTime = 0.4;
                    ball.speedMultiplier = d.dashMult;
                    world.playSound('dash', { pitch: 1.1 });
                }
            }

            // Dégâts de contact pendant le dash
            if (d.active) {
                for (const other of world.balls) {
                    if (other === ball || !other.alive || other.team === ball.team) continue;
                    const dx = other.x - ball.x;
                    const dy = other.y - ball.y;
                    const minD = ball.radius + other.radius + 4;
                    if (dx * dx + dy * dy < minD * minD && !d.hitTimers[other.id]) {
                        world.damage(other, ball, d.contactDamage, 'dash');
                        d.hitTimers[other.id] = 0.5;
                        const d2 = Math.hypot(dx, dy) || 1;
                        other.vx += (dx / d2) * 280;
                        other.vy += (dy / d2) * 280;
                        world.playSound('hit-heavy', { pitch: 0.85 });
                    }
                }
            }
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d || !d.active) return;
            // Halo jaune vif
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 30;
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    };

    // ═══════ AIMANT ═══════
    window.AbilityBehaviors.magnet = {
        attach(ball, world, slot) {
            slot.data = { range: 120, force: 220 };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;

            // Attire les autres boules
            for (const other of world.balls) {
                if (other === ball || !other.alive || other.team === ball.team) continue;
                const dx = ball.x - other.x;
                const dy = ball.y - other.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0 && dist < d.range) {
                    const f = (1 - dist / d.range) * d.force;
                    other.vx += (dx / dist) * f * dt;
                    other.vy += (dy / dist) * f * dt;
                }
            }

            // Attire les pickups
            if (world.pickups) {
                for (const p of world.pickups) {
                    if (p.taken) continue;
                    const dx = ball.x - p.x;
                    const dy = ball.y - p.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 0 && dist < d.range * 1.5) {
                        const f = (1 - dist / (d.range * 1.5)) * d.force * 2;
                        p.vx = (p.vx || 0) + (dx / dist) * f * dt;
                        p.vy = (p.vy || 0) + (dy / dist) * f * dt;
                    }
                }
            }
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d) return;
            const t = performance.now() * 0.002;

            // Anneau pulsant
            ctx.save();
            ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 3);
            ctx.strokeStyle = '#f472b6';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#fbcfe8';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, d.range * 0.6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Lignes de champ vers les cibles
            for (const other of world.balls) {
                if (other === ball || !other.alive || other.team === ball.team) continue;
                const dx = other.x - ball.x;
                const dy = other.y - ball.y;
                const dist = Math.hypot(dx, dy);
                if (dist > d.range || dist < 1) continue;
                const ux = dx / dist;
                const uy = dy / dist;
                const segs = 5;
                ctx.save();
                ctx.globalAlpha = (1 - dist / d.range) * 0.5;
                ctx.strokeStyle = '#fbcfe8';
                ctx.lineWidth = 1;
                for (let s = 0; s < segs; s++) {
                    const t0 = s / segs + (t * 0.3 % (1 / segs));
                    const t1 = t0 + 1 / (segs * 2);
                    const x0 = ball.x + ux * dist * t0;
                    const y0 = ball.y + uy * dist * t0;
                    const x1 = ball.x + ux * dist * t1;
                    const y1 = ball.y + uy * dist * t1;
                    ctx.beginPath();
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x1, y1);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
    };

    // ═══════ TROU NOIR ═══════
    window.AbilityBehaviors.blackhole = {
        attach(ball, world, slot) {
            slot.data = {
                spawned: false,
                active: false,
                x: 0, y: 0,
                radius: 60,
                effectRadius: 300,
                duration: 2,
                timeLeft: 0,
                dps: 5,
                pull: 500,
                chargeTime: 1.2,
                chargeLeft: 0
            };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;

            if (!d.spawned) {
                // Pose au centre de l'arène à la 1ère frame
                d.spawned = true;
                d.x = ball.x;
                d.y = ball.y;
                d.chargeLeft = d.chargeTime;
                d.active = true;
                world.playSound('blackhole-spawn', { pitch: 0.7 });
            }

            if (!d.active) return;

            // Phase de charge : la singularité grossit
            if (d.chargeLeft > 0) {
                d.chargeLeft -= dt;
                d.radius = 5 + (1 - d.chargeLeft / d.chargeTime) * 30;
                return;
            }

            // Phase active
            d.timeLeft -= dt;

            // Pull
            for (const other of world.balls) {
                if (!other.alive || other.team === ball.team) continue;
                const dx = d.x - other.x;
                const dy = d.y - other.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 1 && dist < d.effectRadius) {
                    const f = (1 - dist / d.effectRadius) * d.pull;
                    other.vx += (dx / dist) * f * dt;
                    other.vy += (dy / dist) * f * dt;
                }
                // Dégâts au contact
                if (dist < d.radius + other.radius) {
                    world.damage(other, ball, d.dps * dt, 'blackhole', { silent: true });
                }
            }

            if (d.timeLeft <= 0) {
                // Implosion finale
                world.spawnParticle(d.x, d.y, {
                    color: '#a78bfa', count: 30, speed: 400, life: 0.7, spread: Math.PI * 2
                });
                world.addShockwave(d.x, d.y, { radius: 200, color: '#a78bfa', life: 0.6 });
                // Dégâts d'explosion
                for (const other of world.balls) {
                    if (!other.alive || other.team === ball.team) continue;
                    const dist = Math.hypot(other.x - d.x, other.y - d.y);
                    if (dist < 200) {
                        const dmg = 40 * (1 - dist / 200);
                        world.damage(other, ball, dmg, 'blackhole');
                    }
                }
                world.playSound('blackhole-boom', { pitch: 0.6 });
                d.active = false;
                // Retire le slot
                if (world.removeAbilitySlot) world.removeAbilitySlot(ball, slot);
            }
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d || !d.active) return;

            const t = performance.now() * 0.003;

            // Halo externe distordu
            ctx.save();
            const grd = ctx.createRadialGradient(d.x, d.y, d.radius, d.x, d.y, d.effectRadius);
            grd.addColorStop(0, 'rgba(80, 40, 140, 0.5)');
            grd.addColorStop(0.5, 'rgba(120, 60, 200, 0.15)');
            grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.effectRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Disque d'accrétion
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(t);
            ctx.globalAlpha = 0.9;
            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = i === 0 ? '#c084fc' : i === 1 ? '#a78bfa' : '#7c3aed';
                ctx.lineWidth = 3 - i;
                ctx.shadowColor = '#a78bfa';
                ctx.shadowBlur = 20 - i * 5;
                ctx.beginPath();
                ctx.arc(0, 0, d.radius + 4 + i * 3, 0, Math.PI * 1.6);
                ctx.stroke();
            }
            ctx.restore();

            // Sphère noire
            ctx.save();
            ctx.fillStyle = '#000';
            ctx.shadowColor = '#a78bfa';
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    };

    // ═══════ BOMBE POSTHUME ═══════
    window.AbilityBehaviors.deathbomb = {
        attach(ball, world, slot) {
            slot.data = { primed: true, damage: 50, blastRadius: 150, knockback: 400, delay: 0, warning: true };
        },
        update(ball, world, slot, dt) {
            // Rendu clignotant seulement
        },
        onDeath(ball, world, slot) {
            const d = slot.data;
            if (!d || !d.primed) return;
            d.primed = false;

            const blastR = d.blastRadius ?? 150;
            for (const other of world.balls) {
                if (!other.alive || other.team === ball.team) continue;
                const dist = Math.hypot(other.x - ball.x, other.y - ball.y);
                if (dist < blastR) {
                    const dmg = (d.damage ?? 50) * (1 - dist / blastR);
                    world.damage(other, ball, dmg, 'deathbomb');
                    const dx = other.x - ball.x;
                    const dy = other.y - ball.y;
                    const dd = Math.hypot(dx, dy) || 1;
                    other.vx += (dx / dd) * (d.knockback ?? 400) * (1 - dist / blastR);
                    other.vy += (dy / dd) * 400 * (1 - dist / blastR);
                }
            }
            world.spawnParticle(ball.x, ball.y, {
                color: '#fca5a5', count: 40, speed: 500, life: 1, spread: Math.PI * 2
            });
            world.spawnParticle(ball.x, ball.y, {
                color: '#ff2a85', count: 25, speed: 320, life: 0.8, spread: Math.PI * 2
            });
            world.addShockwave(ball.x, ball.y, { radius: blastR, color: '#dc2626', life: 0.6 });
            world.playSound('explosion', { pitch: 0.6 });
        },
        render(ctx, ball, world, slot) {
            if (!ball.alive) return;
            // Clignotement rouge
            const t = performance.now() * 0.006;
            const blink = (slot.data && slot.data.warning === false) ? 0 : ((Math.sin(t) > 0.3) ? 1 : 0);
            ctx.save();
            ctx.globalAlpha = 0.35 * blink;
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#fca5a5';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius + 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    };

})();