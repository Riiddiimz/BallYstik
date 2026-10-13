/**
 * ABILITIES — Comportements OFFENSIFS.
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

    // ═══════ PICOSPHÈRE ═══════
    window.AbilityBehaviors.pikes = {
        attach(ball, world, slot) {
            slot.data = {
                angle: world.time * 2.6,
                count: 4,
                radius: ball.radius * 2.2,
                speed: 2.6,
                damage: 6,
                hitCooldown: 0.4,
                hitTimers: {}
            };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;
            d.angle += dt * d.speed;
            for (const k in d.hitTimers) {
                d.hitTimers[k] -= dt;
                if (d.hitTimers[k] <= 0) delete d.hitTimers[k];
            }
            for (let i = 0; i < d.count; i++) {
                const a = d.angle + (i / d.count) * Math.PI * 2;
                const px = ball.x + Math.cos(a) * d.radius;
                const py = ball.y + Math.sin(a) * d.radius;
                for (const other of world.balls) {
                    if (other === ball || !other.alive || other.team === ball.team) continue;
                    const dx = other.x - px;
                    const dy = other.y - py;
                    if (dx * dx + dy * dy < (other.radius + 6) * (other.radius + 6)) {
                        if (!d.hitTimers[other.id]) {
                            world.damage(other, ball, d.damage, 'pikes');
                            d.hitTimers[other.id] = d.hitCooldown;
                            world.spawnParticle(px, py, { color: '#ffb347', count: 5, speed: 140, life: 0.4 });
                            world.playSound('hit-sharp', { pitch: 1 + Math.random() * 0.2 });
                        }
                    }
                }
            }
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d) return;
            for (let i = 0; i < d.count; i++) {
                const a = d.angle + (i / d.count) * Math.PI * 2;
                for (let t = 0; t < 5; t++) {
                    const ta = a - t * 0.09;
                    const tx = ball.x + Math.cos(ta) * d.radius;
                    const ty = ball.y + Math.sin(ta) * d.radius;
                    ctx.save();
                    ctx.globalAlpha = (1 - t / 5) * 0.4;
                    ctx.fillStyle = '#ff8a3d';
                    ctx.beginPath();
                    ctx.arc(tx, ty, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                const px = ball.x + Math.cos(a) * d.radius;
                const py = ball.y + Math.sin(a) * d.radius;
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(a + Math.PI / 2);
                ctx.shadowColor = '#ffd166';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.moveTo(0, -8);
                ctx.lineTo(4, 5);
                ctx.lineTo(-4, 5);
                ctx.closePath();
                ctx.fillStyle = '#ff8a3d';
                ctx.fill();
                ctx.strokeStyle = '#ffe0a3';
                ctx.lineWidth = 1.3;
                ctx.stroke();
                ctx.restore();
            }
        }
    };

    // ═══════ FLÈCHE ═══════
    window.AbilityBehaviors.arrow = {
        attach(ball, world, slot) {
            slot.data = { cooldown: 0.4, fireRate: 1.2, telegraph: 0, target: null, projectileSpeed: 480, damage: d.damage ?? 12, bounces: d.bounces ?? 1, range: 400, autoTarget: true };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;
            d.cooldown -= dt;
            if (d.telegraph > 0) d.telegraph -= dt;

            const target = findNearestEnemy(ball, world, d.range || 400);
            if (!target) return;

            if (d.cooldown < 0.2 && d.cooldown > 0) {
                d.target = target;
                d.telegraph = 0.2;
            }

            if (d.cooldown <= 0) {
                const dx = target.x - ball.x;
                const dy = target.y - ball.y;
                const len = Math.hypot(dx, dy) || 1;
                const speed = d.projectileSpeed || 480;
                world.projectiles.push({
                    x: ball.x + (dx / len) * ball.radius,
                    y: ball.y + (dy / len) * ball.radius,
                    vx: (dx / len) * speed,
                    vy: (dy / len) * speed,
                    radius: 5,
                    life: 3,
                    bounces: 1,
                    ownerId: ball.id,
                    color: '#00f2fe',
                    damage: 12,
                    trail: [],
                    render: renderArrowProjectile
                });
                d.cooldown = d.fireRate;
                ball.vx -= (dx / len) * 25;
                ball.vy -= (dy / len) * 25;
                world.playSound('shoot', { pitch: 1.2 });
            }
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d || d.telegraph <= 0 || !d.target) return;
            const target = d.target;
            const dx = target.x - ball.x;
            const dy = target.y - ball.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len, uy = dy / len;
            ctx.save();
            ctx.globalAlpha = 0.25 * (d.telegraph / 0.2);
            ctx.strokeStyle = '#00f2fe';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(ball.x, ball.y);
            ctx.lineTo(ball.x + ux * (d.range || 400), ball.y + uy * (d.range || 400));
            ctx.stroke();
            ctx.restore();
        }
    };

    function renderArrowProjectile(ctx, p) {
        for (let i = 0; i < p.trail.length; i++) {
            const t = p.trail[i];
            const a = i / p.trail.length;
            ctx.save();
            ctx.globalAlpha = a * 0.5;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, p.radius * a * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        const ang = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(ang);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.radius * 1.6, 0);
        ctx.lineTo(-p.radius, p.radius * 0.7);
        ctx.lineTo(-p.radius * 0.4, 0);
        ctx.lineTo(-p.radius, -p.radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }

    // ═══════ MINE ═══════
    window.AbilityBehaviors.mine = {
        attach(ball, world, slot) {
            slot.data = { cooldown: 0.5, interval: 3, mines: [], maxMines: 3, armingDelay: 0.8, damage: 25, blastRadius: 70, detectionRadius: 26, knockback: 320, lifetime: 20 };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;
            d.cooldown -= dt;

            if (d.cooldown <= 0 && d.mines.length < d.maxMines) {
                d.cooldown = d.interval;
                const v = Math.hypot(ball.vx, ball.vy) || 1;
                const ux = -ball.vx / v, uy = -ball.vy / v;
                const mx = ball.x + ux * ball.radius * 1.5;
                const my = ball.y + uy * ball.radius * 1.5;
                d.mines.push({
                    x: mx, y: my,
                    armTimer: d.armingDelay,
                    armed: false,
                    life: d.lifetime,
                    blink: 0,
                    radius: 8,
                    triggerR: d.detectionRadius,
                    blastR: d.blastRadius,
                });
                world.playSound('mine-drop', { pitch: 0.9 });
            }

            for (let i = d.mines.length - 1; i >= 0; i--) {
                const m = d.mines[i];
                m.life -= dt;
                m.blink += dt;
                if (m.armTimer > 0) {
                    m.armTimer -= dt;
                    if (m.armTimer <= 0) m.armed = true;
                }
                if (m.life <= 0) { d.mines.splice(i, 1); continue; }

                if (m.armed) {
                    let triggered = false;
                    for (const other of world.balls) {
                        if (!other.alive || other.team === ball.team) continue;
                        const dx = other.x - m.x;
                        const dy = other.y - m.y;
                        if (dx * dx + dy * dy < (m.triggerR + other.radius) ** 2) {
                            triggered = true;
                            break;
                        }
                    }
                    if (triggered) {
                        for (const other of world.balls) {
                            if (!other.alive || other.team === ball.team) continue;
                            const dx = other.x - m.x;
                            const dy = other.y - m.y;
                            const d2 = dx * dx + dy * dy;
                            const dist = Math.sqrt(d2) || 1;
                            if (dist < m.blastR + other.radius) {
                                const falloff = 1 - Math.max(0, (dist - other.radius) / m.blastR);
                                const dmg = d.damage * falloff;
                                world.damage(other, ball, dmg, 'mine');
                                const kb = d.knockback * falloff;
                                other.vx += (dx / dist) * kb;
                                other.vy += (dy / dist) * kb;
                            }
                        }
                        world.spawnParticle(m.x, m.y, { color: '#ff8a3d', count: 20, speed: 260, life: 0.7, spread: Math.PI * 2 });
                        world.spawnParticle(m.x, m.y, { color: '#ffd166', count: 12, speed: 380, life: 0.5, spread: Math.PI * 2 });
                        world.addShockwave(m.x, m.y, { radius: m.blastR, color: '#ff8a3d', life: 0.35 });
                        world.playSound('explosion', { pitch: 0.85 });
                        d.mines.splice(i, 1);
                    }
                }
            }
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d) return;
            for (const m of d.mines) {
                ctx.save();
                ctx.fillStyle = 'rgba(20,10,10,0.95)';
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = m.armed ? '#ff4d4d' : '#7a5a5a';
                ctx.lineWidth = 1.4;
                ctx.stroke();

                const blinkSpeed = m.armed ? 8 : 2;
                const led = (Math.sin(m.blink * blinkSpeed) > 0) ? 1 : 0.2;
                ctx.globalAlpha = led;
                ctx.fillStyle = m.armed ? '#ff2a85' : '#ff8080';
                ctx.shadowColor = m.armed ? '#ff2a85' : '#ff8080';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(m.x, m.y, 2.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    };

    // ═══════ LASER ═══════
    window.AbilityBehaviors.laser = {
        attach(ball, world, slot) {
            slot.data = {
                state: 'idle',
                timer: 0,
                chargeTime: 0.5,
                fireTime: 1.5,
                cooldown: 1.5,
                targetAngle: 0,
                dps: 15,
                tickAcc: 0
            };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;

            const target = findNearestEnemy(ball, world, 500);
            const desiredAngle = target ? Math.atan2(target.y - ball.y, target.x - ball.x) : d.targetAngle;
            let da = desiredAngle - d.targetAngle;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;
            d.targetAngle += da * Math.min(1, dt * 5);

            if (d.state === 'idle') {
                d.timer -= dt;
                if (d.timer <= 0) { d.state = 'charging'; d.timer = d.chargeTime; }
            } else if (d.state === 'charging') {
                ball.vx *= 0.9;
                ball.vy *= 0.9;
                d.timer -= dt;
                if (d.timer <= 0) {
                    d.state = 'firing';
                    d.timer = d.fireTime;
                    d.tickAcc = 0;
                    world.playSound('laser-fire');
                }
            } else if (d.state === 'firing') {
                ball.vx *= 0.94;
                ball.vy *= 0.94;
                d.timer -= dt;
                d.tickAcc += dt;

                const tickRate = 0.1;
                while (d.tickAcc >= tickRate) {
                    d.tickAcc -= tickRate;
                    applyLaserDamage(ball, world, slot);
                }

                if (d.timer <= 0) { d.state = 'idle'; d.timer = d.cooldown; }
            }
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d || d.state === 'idle') return;

            const maxLen = 700;
            const ex = ball.x + Math.cos(d.targetAngle) * maxLen;
            const ey = ball.y + Math.sin(d.targetAngle) * maxLen;

            if (d.state === 'charging') {
                const t = 1 - d.timer / d.chargeTime;
                ctx.save();
                ctx.globalAlpha = 0.4 + t * 0.6;
                ctx.fillStyle = '#ff2a85';
                ctx.shadowColor = '#ff2a85';
                ctx.shadowBlur = 20 * t;
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, 3 + t * 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.globalAlpha = 0.3 * t;
                ctx.strokeStyle = '#ff2a85';
                ctx.lineWidth = 1;
                ctx.setLineDash([6, 6]);
                ctx.beginPath();
                ctx.moveTo(ball.x, ball.y);
                ctx.lineTo(ex, ey);
                ctx.stroke();
                ctx.restore();
            } else if (d.state === 'firing') {
                ctx.save();
                ctx.lineCap = 'round';
                ctx.globalAlpha = 0.35;
                ctx.strokeStyle = '#ff2a85';
                ctx.lineWidth = 14;
                ctx.shadowColor = '#ff2a85';
                ctx.shadowBlur = 26;
                ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ex, ey); ctx.stroke();
                ctx.globalAlpha = 0.8;
                ctx.lineWidth = 6;
                ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ex, ey); ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#ffffff';
                ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ex, ey); ctx.stroke();
                ctx.restore();
            }
        }
    };

    function applyLaserDamage(ball, world, slot) {
        const d = slot.data;
        const maxLen = 700;
        const dx = Math.cos(d.targetAngle);
        const dy = Math.sin(d.targetAngle);

        let closest = null, closestT = maxLen;
        for (const other of world.balls) {
            if (other === ball || !other.alive || other.team === ball.team) continue;
            const rx = other.x - ball.x;
            const ry = other.y - ball.y;
            const t = rx * dx + ry * dy;
            if (t <= 0 || t > maxLen) continue;
            const px = dx * t, py = dy * t;
            const distSq = (rx - px) ** 2 + (ry - py) ** 2;
            if (distSq < (other.radius + 6) ** 2 && t < closestT) {
                closestT = t;
                closest = other;
            }
        }
        if (closest) {
            world.damage(closest, ball, d.dps * 0.1, 'laser');
            world.spawnParticle(closest.x, closest.y, { color: '#ff2a85', count: 3, speed: 180, life: 0.4 });
            world.addHitFlash(closest.x, closest.y);
        }
    }

    // ═══════ ÉCLAIR EN CHAÎNE ═══════
    window.AbilityBehaviors.chain = {
        attach(ball, world, slot) {
            slot.data = { cooldown: 1.0, interval: 2.5, bolt: null, boltTimer: 0, targets: 3, damage: 10, falloff: 30, range: 150 };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;

            if (d.boltTimer > 0) d.boltTimer -= dt;
            d.cooldown -= dt;
            if (d.cooldown > 0) return;

            const inRange = world.balls.filter(o =>
                o !== ball && o.alive && o.team !== ball.team &&
                Math.hypot(o.x - ball.x, o.y - ball.y) < d.range
            );
            if (inRange.length < 1) return;

            inRange.sort((a, b) =>
                Math.hypot(a.x - ball.x, a.y - ball.y) -
                Math.hypot(b.x - ball.x, b.y - ball.y)
            );
            const chainTargets = [ball, ...inRange.slice(0, d.targets)];
            d.bolt = chainTargets.map(b => ({ x: b.x, y: b.y, id: b.id }));
            d.boltTimer = 0.25;

            let dmg = d.damage;
            for (let i = 1; i < chainTargets.length; i++) {
                const t = chainTargets[i];
                world.damage(t, ball, dmg, 'chain');
                world.addHitFlash(t.x, t.y);
                world.spawnParticle(t.x, t.y, { color: '#a855f7', count: 4, speed: 160, life: 0.4 });
                dmg *= (1 - d.falloff / 100);
            }
            world.playSound('chain', { pitch: 1.1 });
            d.cooldown = d.interval;
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d || !d.bolt || d.boltTimer <= 0) return;

            for (let i = 0; i < d.bolt.length - 1; i++) {
                const a = d.bolt[i];
                const b = d.bolt[i + 1];
                const segs = 6;
                ctx.save();
                ctx.lineCap = 'round';
                ctx.globalAlpha = 0.7;
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 5;
                ctx.shadowColor = '#c084fc';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                for (let s = 1; s < segs; s++) {
                    const t = s / segs;
                    const mx = a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 12;
                    const my = a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 12;
                    ctx.lineTo(mx, my);
                }
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.6;
                ctx.shadowBlur = 0;
                ctx.stroke();
                ctx.restore();
            }

            for (const n of d.bolt) {
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#c084fc';
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    };

    // ═══════ TRAÎNÉE DE FEU ═══════
    window.AbilityBehaviors.firetrail = {
        attach(ball, world, slot) {
            slot.data = { blobs: [], dropTimer: 0, dropInterval: 0.08, blobLife: 3, dps: 5, blobSize: 0.9 };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;

            d.dropTimer -= dt;
            if (d.dropTimer <= 0) {
                d.dropTimer = d.dropInterval;
                d.blobs.push({
                    x: ball.x, y: ball.y,
                    r: ball.radius * d.blobSize,
                    life: d.blobLife,
                    maxLife: d.blobLife,
                    seed: Math.random()
                });
            }

            for (let i = d.blobs.length - 1; i >= 0; i--) {
                const b = d.blobs[i];
                b.life -= dt;
                if (b.life <= 0) { d.blobs.splice(i, 1); continue; }

                for (const other of world.balls) {
                    if (!other.alive || other.team === ball.team) continue;
                    const dx = other.x - b.x;
                    const dy = other.y - b.y;
                    if (dx * dx + dy * dy < (b.r + other.radius) ** 2) {
                        world.damage(other, ball, d.dps * dt, 'firetrail', { silent: true });
                        if (Math.random() < 0.2) {
                            world.spawnParticle(other.x, other.y, { color: '#ff6b35', count: 1, speed: 60, life: 0.5 });
                        }
                    }
                }
            }
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d) return;
            for (const b of d.blobs) {
                const t = b.life / b.maxLife;
                const wobble = Math.sin(performance.now() * 0.008 + b.seed * 10) * 0.15 + 1;
                const r = b.r * t * wobble;
                if (r <= 0.5) continue;
                ctx.save();
                ctx.globalAlpha = 0.4 * t;
                const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
                grd.addColorStop(0, 'rgba(255,200,80,0.9)');
                grd.addColorStop(0.5, 'rgba(255,110,50,0.7)');
                grd.addColorStop(1, 'rgba(255,60,20,0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.shadowColor = '#ff6b35';
            ctx.shadowBlur = 24;
            ctx.strokeStyle = '#ff8a3d';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius + 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    };

    // ═══════ SCINTILLE (clone) ═══════
    window.AbilityBehaviors.clone = {
        attach(ball, world, slot) {
            slot.data = { spawned: false, cloneId: null };
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d || d.spawned) return;
            d.spawned = true;
            if (world.spawnCloneFor) {
                d.cloneId = world.spawnCloneFor(ball, {
                    lifetime: 5,
                    hpRatio: 0.3,
                    inheritSpeed: 0.85,
                    opacity: 0.55
                });
            }
        }
    };

})();