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
                    lifetime: window.AbilitySettings ? window.AbilitySettings.getParam('clone', 'cloneLifetime', 5) : 5,
                    hpRatio: (window.AbilitySettings ? window.AbilitySettings.getParam('clone', 'hpRatio', 30) : 30) / 100,
                    inheritSpeed: 0.85,
                    opacity: (window.AbilitySettings ? window.AbilitySettings.getParam('clone', 'opacity', 55) : 55) / 100
                });
            }
        }
    };


    // ═══════ CANON À PLASMA ═══════
    window.AbilityBehaviors.plasmaCannon = {
        attach(ball) {
            ball.weapon = 'plasmaCannon';
        },
        update(ball, world, slot, dt) {
            const d = slot.data || (slot.data = { cooldown: 0.65, charge: 0, charging: false, targetId: null });
            d.cooldown -= dt;
            const range = window.AbilitySettings ? window.AbilitySettings.getParam('plasmaCannon', 'targetRange', 560) : 560;
            const target = findNearestEnemy(ball, world, range);
            d.targetId = target ? target.id : null;

            // Le canon annonce d'abord son tir. L'obus ne part qu'après la charge visible.
            if (d.charging) {
                d.charge -= dt;
                if (d.charge > 0) return;
                d.charging = false;
                if (!target) return;
                const dx = target.x - ball.x, dy = target.y - ball.y;
                const len = Math.hypot(dx, dy) || 1;
                const ux = dx / len, uy = dy / len;
                const projectileSpeed = window.AbilitySettings ? window.AbilitySettings.getParam('plasmaCannon', 'projectileSpeed', 390) : 390;
                world.projectiles.push({
                    x: ball.x + ux * (ball.radius + 8),
                    y: ball.y + uy * (ball.radius + 8),
                    vx: ux * projectileSpeed, vy: uy * projectileSpeed,
                    radius: 7, life: 2.2, bounces: 0,
                    ownerId: ball.id, color: '#fb923c',
                    damage: window.AbilitySettings ? window.AbilitySettings.getParam('plasmaCannon', 'damage', 17) : 17,
                    splashRadius: window.AbilitySettings ? window.AbilitySettings.getParam('plasmaCannon', 'blastRadius', 58) : 58,
                    type: 'plasma', trail: [], render: renderPlasmaShell
                });
                d.cooldown = window.AbilitySettings ? window.AbilitySettings.getParam('plasmaCannon', 'fireRate', 1.55) : 1.55;
                world.spawnParticle(ball.x + ux * (ball.radius + 9), ball.y + uy * (ball.radius + 9), {
                    color: '#fed7aa', count: 12, speed: 210, life: 0.35, spread: 0.6, angle: Math.atan2(uy, ux), size: 2.8
                });
                world.playSound('shoot', { pitch: 0.72 });
                return;
            }

            if (!target || d.cooldown > 0) return;
            d.charging = true;
            d.charge = 0.32;
            d.aimX = target.x;
            d.aimY = target.y;
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d) return;
            const target = world.balls.find(b => b.id === d.targetId && b.alive);
            const angle = target ? Math.atan2(target.y - ball.y, target.x - ball.x) : Math.atan2(ball.vy, ball.vx);
            const pulse = d.charging ? 1 - d.charge / 0.32 : 0.3 + 0.15 * Math.sin((world.time || 0) * 5 + ball.id);
            ctx.save();
            ctx.translate(ball.x, ball.y);
            ctx.rotate(angle);
            ctx.shadowColor = '#fb923c';
            ctx.shadowBlur = 12 + pulse * 14;
            ctx.fillStyle = '#292524';
            ctx.strokeStyle = '#fed7aa';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, ball.radius * 0.56, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fb923c';
            ctx.fillRect(ball.radius * 0.12, -4, ball.radius + 11, 8);
            ctx.fillStyle = '#fff7ed';
            ctx.fillRect(ball.radius + 5, -2, 8, 4);
            if (d.charging) {
                ctx.globalAlpha = 0.75 + pulse * 0.25;
                ctx.strokeStyle = '#fdba74';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(ball.radius + 18, 0, 7 + pulse * 4, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
            if (target && d.charging) {
                ctx.save();
                ctx.globalAlpha = 0.25 + pulse * 0.55;
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = '#fb923c';
                ctx.lineWidth = 1.5 + pulse;
                ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(target.x, target.y); ctx.stroke();
                ctx.restore();
            }
        },
        detach(ball) {
            if (ball.weapon === 'plasmaCannon') delete ball.weapon;
        }
    };

    // ═══════ BOBINE TESLA ═══════
    window.AbilityBehaviors.teslaCoil = {
        attach(ball) {
            ball.weapon = 'teslaCoil';
        },
        update(ball, world, slot, dt) {
            const d = slot.data || (slot.data = { cooldown: 0.7, charge: 0, charging: false, targetId: null, zaps: [] });
            d.cooldown -= dt;
            d.zaps = d.zaps.filter(z => (z.life -= dt) > 0);
            const range = window.AbilitySettings ? window.AbilitySettings.getParam('teslaCoil', 'range', 260) : 260;
            const target = findNearestEnemy(ball, world, range);
            d.targetId = target ? target.id : null;

            if (d.charging) {
                d.charge -= dt;
                if (d.charge > 0) return;
                d.charging = false;
                if (!target) return;
                const damage = window.AbilitySettings ? window.AbilitySettings.getParam('teslaCoil', 'damage', 14) : 14;
                const chainRange = window.AbilitySettings ? window.AbilitySettings.getParam('teslaCoil', 'chainRange', 110) : 110;
                const chainDamage = window.AbilitySettings ? window.AbilitySettings.getParam('teslaCoil', 'chainDamage', 8) : 8;
                world.damage(target, ball, damage, 'tesla');
                d.zaps.push({ x1: ball.x, y1: ball.y, x2: target.x, y2: target.y, life: 0.2, maxLife: 0.2 });
                world.spawnParticle(target.x, target.y, { color: '#cffafe', count: 20, speed: 240, life: 0.42, spread: Math.PI * 2, size: 2.6 });
                world.addShockwave(target.x, target.y, { radius: 34, color: '#67e8f9', life: 0.25 });

                let chained = null, best = chainRange * chainRange;
                for (const other of world.balls) {
                    if (!other.alive || other === ball || other === target || other.team === ball.team) continue;
                    const dx = other.x - target.x, dy = other.y - target.y, dist2 = dx * dx + dy * dy;
                    if (dist2 < best) { best = dist2; chained = other; }
                }
                if (chained) {
                    world.damage(chained, ball, chainDamage, 'tesla');
                    d.zaps.push({ x1: target.x, y1: target.y, x2: chained.x, y2: chained.y, life: 0.2, maxLife: 0.2 });
                    world.spawnParticle(chained.x, chained.y, { color: '#67e8f9', count: 14, speed: 200, life: 0.38, spread: Math.PI * 2, size: 2.3 });
                }
                d.cooldown = window.AbilitySettings ? window.AbilitySettings.getParam('teslaCoil', 'cooldown', 2.4) : 2.4;
                world.playSound('chain', { pitch: 1.35 });
                return;
            }
            if (target && d.cooldown <= 0) {
                d.charging = true;
                d.charge = window.AbilitySettings ? window.AbilitySettings.getParam('teslaCoil', 'chargeTime', 0.5) : 0.5;
            }
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d) return;
            const t = world.time || 0;
            const pulse = d.charging ? 1 - d.charge / (window.AbilitySettings ? window.AbilitySettings.getParam('teslaCoil', 'chargeTime', 0.5) : 0.5) : 0.35 + 0.2 * Math.sin(t * 5);
            ctx.save();
            ctx.translate(ball.x, ball.y);
            ctx.rotate(t * 1.8 + ball.id);
            ctx.shadowColor = '#67e8f9';
            ctx.shadowBlur = 12 + pulse * 20;
            ctx.strokeStyle = '#cffafe';
            ctx.fillStyle = '#155e75';
            ctx.lineWidth = 2;
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, ball.radius + 5 + i * 4, i * Math.PI + t, i * Math.PI + t + Math.PI * 0.7);
                ctx.stroke();
            }
            ctx.fillRect(ball.radius - 1, -4, 8, 8);
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.45 + pulse * 0.55;
            ctx.beginPath(); ctx.arc(ball.radius + 8, 0, 2 + pulse * 3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            for (const z of d.zaps) {
                ctx.save();
                ctx.globalAlpha = z.life / z.maxLife;
                ctx.strokeStyle = '#67e8f9';
                ctx.lineWidth = 5;
                ctx.shadowColor = '#22d3ee';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                for (let i = 0; i <= 7; i++) {
                    const t = i / 7;
                    const bend = (i === 0 || i === 7) ? 0 : Math.sin(i * 12.989 + (world.time || 0) * 60) * 11;
                    const x = z.x1 + (z.x2 - z.x1) * t;
                    const y = z.y1 + (z.y2 - z.y1) * t + bend;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.6;
                ctx.stroke();
                ctx.restore();
            }
        },
        detach(ball) {
            if (ball.weapon === 'teslaCoil') delete ball.weapon;
        }
    };

    // ═══════ ARMES PORTÉES (assets PNG) ═══════
    window.BallYstikWeaponRenderer = window.BallYstikWeaponRenderer || {};
    window.BallYstikWeaponRenderer.drawHeld = function (ctx, image, ball, length = 64, offset = 0.35) {
        if (!ctx || !image || !image.complete || !image.naturalWidth || !image.naturalHeight) return false;
        const ratio = image.naturalWidth / image.naturalHeight;
        const width = image.naturalHeight > image.naturalWidth ? length * ratio : length;
        const height = image.naturalHeight > image.naturalWidth ? length : length / ratio;
        ctx.save();
        ctx.translate((ball.radius || 0) * offset, 0);
        if (image.naturalHeight > image.naturalWidth) ctx.rotate(-Math.PI / 2);
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
        ctx.restore();
        return true;
    };

    window.BallYstikWeaponImages = window.BallYstikWeaponImages || {};
    const weaponFiles = {
        axe: 'ballystik-axe.png',
        bow: 'ballystik-bow_1.png',
        hammer: 'ballystik-hammer.png',
        scepter: 'ballystik-scepter.png',
        spear: 'ballystik-spear.png',
        sword: 'ballystik-sword.png'
    };
    Object.entries(weaponFiles).forEach(([id, file]) => {
        if (window.BallYstikWeaponImages[id]) return;
        const image = new Image();
        image.src = '/assets/weapons/' + file;
        window.BallYstikWeaponImages[id] = image;
    });

    const weaponBehavior = {
        attach(ball, world, slot) {
            const id = slot.meta.id;
            ball.weapon = id;
            slot.data = { hitCooldowns: Object.create(null), swing: 0, swingCooldown: 0, angle: 0, hitIds: [] };
            const meta = slot.meta;
            world.spawnParticle(ball.x, ball.y, { color: meta.glow || '#fde68a', count: 22, speed: 210, life: 0.6, spread: Math.PI * 2, size: 3 });
            world.addShockwave(ball.x, ball.y, { radius: 52, color: meta.glow || '#fde68a', life: 0.42 });
            world.playSound('pickup', { pitch: 1.2 });
        },
        update(ball, world, slot, dt) {
            const d = slot.data;
            if (!d) return;
            const weaponId = slot.meta.id;
            const meta = slot.meta;
            d.swingCooldown = Math.max(0, d.swingCooldown - dt);
            d.swing = Math.max(0, d.swing - dt);
            for (const id of Object.keys(d.hitCooldowns)) {
                d.hitCooldowns[id] -= dt;
                if (d.hitCooldowns[id] <= 0) delete d.hitCooldowns[id];
            }
            let target = null, best = Infinity;
            for (const other of world.balls) {
                if (!other.alive || other === ball || other.team === ball.team) continue;
                const dist = Math.hypot(other.x - ball.x, other.y - ball.y);
                if (dist < best) { best = dist; target = other; }
            }
            const movementAngle = Math.hypot(ball.vx || 0, ball.vy || 0) > 8
                ? Math.atan2(ball.vy, ball.vx)
                : (target ? Math.atan2(target.y - ball.y, target.x - ball.x) : 0);
            d.angle = target && best < ball.radius * 3.2
                ? Math.atan2(target.y - ball.y, target.x - ball.x)
                : movementAngle;
            const reach = ball.radius + (weaponId === 'spear' ? 38 : weaponId === 'hammer' ? 25 : 29);
            const hitRange = ball.radius + reach + (target ? target.radius : 0);
            if (target && best <= hitRange && d.swingCooldown <= 0 && !d.hitCooldowns[target.id]) {
                const dx = target.x - ball.x, dy = target.y - ball.y;
                const angleToTarget = Math.atan2(dy, dx);
                const diff = Math.atan2(Math.sin(angleToTarget - d.angle), Math.cos(angleToTarget - d.angle));
                if (Math.abs(diff) < 1.3) {
                    const defaults = { axe: 22, bow: 15, hammer: 26, scepter: 20, spear: 19, sword: 18 };
                    const damage = window.AbilitySettings ? window.AbilitySettings.getParam(weaponId, 'damage', defaults[weaponId] || 18) : (defaults[weaponId] || 18);
                    const cooldown = window.AbilitySettings ? window.AbilitySettings.getParam(weaponId, 'hitCooldown', weaponId === 'hammer' ? 0.9 : 0.72) : (weaponId === 'hammer' ? 0.9 : 0.72);
                    world.damage(target, ball, damage, weaponId);
                    const len = Math.hypot(dx, dy) || 1;
                    const push = weaponId === 'hammer' ? 250 : weaponId === 'spear' ? 210 : 180;
                    target.vx += (dx / len) * push;
                    target.vy += (dy / len) * push;
                    if (world.ArenaBattle && world.ArenaBattle._keepBaseSpeed) world.ArenaBattle._keepBaseSpeed(target);
                    d.hitCooldowns[target.id] = cooldown;
                    d.swingCooldown = weaponId === 'hammer' ? 0.42 : 0.32;
                    d.swing = 0.24;
                    d.angle = angleToTarget;
                    world.spawnParticle(target.x, target.y, { color: meta.glow || '#fde68a', count: 16, speed: 220, life: 0.38, spread: Math.PI * 2, size: 2.8 });
                    world.addHitFlash(target.x, target.y);
                    world.addShockwave(target.x, target.y, { radius: 26, color: meta.glow || '#fde68a', life: 0.22 });
                    world.playSound('hit', { pitch: weaponId === 'hammer' ? 0.85 : 1.15 });
                }
            }
        },
        render(ctx, ball, world, slot) {
            const d = slot.data;
            if (!d) return;
            const weaponId = slot.meta.id;
            const image = window.BallYstikWeaponImages && window.BallYstikWeaponImages[weaponId];
            const swingProgress = d.swing > 0 ? 1 - d.swing / 0.24 : 0;
            const swingAngle = d.swing > 0 ? Math.sin(swingProgress * Math.PI) * 1.05 - 0.5 : 0;
            ctx.save();
            ctx.translate(ball.x, ball.y);
            ctx.rotate(d.angle + swingAngle);
            ctx.shadowColor = slot.meta.glow || '#fde68a';
            ctx.shadowBlur = d.swing > 0 ? 20 : 9;
            if (image && image.complete && image.naturalWidth > 0) {
                const length = weaponId === 'spear' ? 96 : weaponId === 'hammer' ? 86 : 82;
                window.BallYstikWeaponRenderer.drawHeld(ctx, image, ball, length, 0.35);
            } else {
                ctx.strokeStyle = slot.meta.color || '#fde68a';
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(ball.radius * 0.25, 0);
                ctx.lineTo(ball.radius + 28, 0);
                ctx.stroke();
            }
            if (d.swing > 0) {
                ctx.globalAlpha = 0.65 * (d.swing / 0.24);
                ctx.strokeStyle = slot.meta.glow || '#fde68a';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, ball.radius + 24, -0.8, 0.8);
                ctx.stroke();
            }
            ctx.restore();
        },
        detach(ball, world, slot) {
            if (ball.weapon === slot.meta.id) delete ball.weapon;
        }
    };
    Object.keys(weaponFiles).forEach(id => { window.AbilityBehaviors[id] = weaponBehavior; });

    function renderPlasmaShell(ctx, p) {
        ctx.save();
        ctx.shadowColor = '#fb923c';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#fb923c';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff7ed';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 0.52, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

})();