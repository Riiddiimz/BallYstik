/**
 * Mode Duel à Distance (Ranged Duel)
 * Deux combattants s'affrontent de part et d'autre d'un champ de force central.
 * Les tirs et projectiles traversent la barrière mais les boules restent confinées dans leur camp.
 */
(function (window) {
    'use strict';

    const RangedDuelMode = {
        id: 'rangedDuel',
        name: 'Duel à Distance',
        description: '2 combattants séparés par une barrière énergétique infranchissable. Ramassez des munitions et canardez l\'adversaire !',
        victoryCondition: 'Élimination de l\'adversaire',

        // État interne du duel
        state: {
            leftBall: null,
            rightBall: null,
            dividerX: 0,
            orbs: [],
            orbSpawnTimer: 0,
            leftShootCooldown: 0.6,
            rightShootCooldown: 0.6,
            pulseTime: 0
        },

        customBallSpawn(world, battle) {
            const arena = world.arena;
            const cx = arena.x + arena.w / 2;
            const cy = arena.y + arena.h / 2;
            const radius = 16;

            this.state.dividerX = cx;
            this.state.orbs = [];
            this.state.orbSpawnTimer = 1.0;
            this.state.leftShootCooldown = 0.8;
            this.state.rightShootCooldown = 0.8;

            // Combattant Gauche (Cyan)
            const b1 = battle._createBall(world, cx - arena.w * 0.28, cy, '#00f2fe', {
                radius,
                team: 1,
                maxHp: 120
            });
            b1.vx = -60;
            b1.vy = (world.prng.next() - 0.5) * 160;
            b1.side = 'left';
            b1.ammoType = 'fast';

            // Combattant Droit (Magenta)
            const b2 = battle._createBall(world, cx + arena.w * 0.28, cy, '#ff2a85', {
                radius,
                team: 2,
                maxHp: 120
            });
            b2.vx = 60;
            b2.vy = (world.prng.next() - 0.5) * 160;
            b2.side = 'right';
            b2.ammoType = 'fast';

            world.balls.push(b1, b2);
            this.state.leftBall = b1;
            this.state.rightBall = b2;
        },

        init(world, battle) {
            this.state.orbs = [];
            this.state.pulseTime = 0;
            // Pré-spawner 2 orbes de chaque côté
            this._spawnOrb(world, 'left');
            this._spawnOrb(world, 'right');
        },

        _spawnOrb(world, side) {
            const arena = world.arena;
            const cx = arena.x + arena.w / 2;
            const prng = world.prng || { next: () => Math.random() };
            const types = ['fast', 'heavy', 'bounce'];
            const type = types[Math.floor(prng.next() * types.length)];

            let ox = 0;
            if (side === 'left') {
                ox = arena.x + arena.w * (0.12 + prng.next() * 0.30);
            } else {
                ox = cx + arena.w * (0.08 + prng.next() * 0.30);
            }
            const oy = arena.y + arena.h * (0.15 + prng.next() * 0.70);

            const colors = {
                fast: '#38bdf8',
                heavy: '#f97316',
                bounce: '#a855f7'
            };

            this.state.orbs.push({
                x: ox,
                y: oy,
                side,
                type,
                color: colors[type],
                radius: 11,
                alive: true,
                pulse: prng.next() * Math.PI * 2
            });
        },

        update(dt, world, battle) {
            const arena = world.arena;
            const cx = arena.x + arena.w / 2;
            this.state.dividerX = cx;
            this.state.pulseTime += dt;

            const b1 = this.state.leftBall;
            const b2 = this.state.rightBall;

            // 1. Confinement strict par le champ de force central
            if (b1 && b1.alive) {
                if (b1.x + b1.radius >= cx - 2) {
                    b1.x = cx - 2 - b1.radius;
                    b1.vx = -Math.abs(b1.vx) * 0.95;
                    world.spawnParticle?.(cx, b1.y, { color: '#00f2fe', count: 6, speed: 120, life: 0.3, size: 2.2 });
                }
            }
            if (b2 && b2.alive) {
                if (b2.x - b2.radius <= cx + 2) {
                    b2.x = cx + 2 + b2.radius;
                    b2.vx = Math.abs(b2.vx) * 0.95;
                    world.spawnParticle?.(cx, b2.y, { color: '#ff2a85', count: 6, speed: 120, life: 0.3, size: 2.2 });
                }
            }

            // 2. Gestion et ramassage des orbes de munitions
            this.state.orbSpawnTimer -= dt;
            if (this.state.orbSpawnTimer <= 0) {
                this.state.orbSpawnTimer = 3.5;
                if (this.state.orbs.filter(o => o.side === 'left').length < 3) this._spawnOrb(world, 'left');
                if (this.state.orbs.filter(o => o.side === 'right').length < 3) this._spawnOrb(world, 'right');
            }

            for (const orb of this.state.orbs) {
                if (!orb.alive) continue;
                orb.pulse += dt * 4;

                const candidate = orb.side === 'left' ? b1 : b2;
                if (candidate && candidate.alive) {
                    const dist = Math.hypot(candidate.x - orb.x, candidate.y - orb.y);
                    if (dist < candidate.radius + orb.radius) {
                        orb.alive = false;
                        candidate.ammoType = orb.type;
                        candidate.ammoCount = (candidate.ammoCount || 0) + 3;
                        world.spawnParticle?.(orb.x, orb.y, { color: orb.color, count: 14, speed: 180, life: 0.45, size: 2.6 });
                        world.addShockwave?.(orb.x, orb.y, { radius: 30, color: orb.color, life: 0.22 });
                        world.playSound?.('pickup', { pitch: 1.2 });
                        // Tir immédiat de riposte !
                        this._fireProjectile(candidate, orb.side === 'left' ? b2 : b1, world, battle);
                    }
                }
            }
            this.state.orbs = this.state.orbs.filter(o => o.alive);

            // 3. IA de déplacement & Esquive
            this._runAI(b1, b2, 'left', dt, world, battle);
            this._runAI(b2, b1, 'right', dt, world, battle);

            // 4. Cadence de tir automatique
            this.state.leftShootCooldown -= dt;
            if (this.state.leftShootCooldown <= 0 && b1 && b1.alive && b2 && b2.alive) {
                this.state.leftShootCooldown = 1.3 + (world.prng ? world.prng.next() : Math.random()) * 0.5;
                this._fireProjectile(b1, b2, world, battle);
            }

            this.state.rightShootCooldown -= dt;
            if (this.state.rightShootCooldown <= 0 && b2 && b2.alive && b1 && b1.alive) {
                this.state.rightShootCooldown = 1.3 + (world.prng ? world.prng.next() : Math.random()) * 0.5;
                this._fireProjectile(b2, b1, world, battle);
            }
        },

        _runAI(ball, target, side, dt, world, battle) {
            if (!ball || !ball.alive) return;

            // Esquive intelligente des tirs ennemis arrivant
            const incoming = battle.projectiles.filter(p => {
                if (!p || !p.owner || p.owner === ball) return false;
                const dx = ball.x - p.x;
                const approaching = (side === 'left' && p.vx < 0 && dx < 0) || (side === 'right' && p.vx > 0 && dx > 0);
                return approaching && Math.abs(ball.y - p.y) < 55 && Math.abs(dx) < 260;
            });

            if (incoming.length > 0) {
                const threat = incoming[0];
                const escapeY = threat.y < ball.y ? 180 : -180;
                ball.vy += escapeY * dt * 2.8;
            } else {
                // Recherche d'orbes de son côté
                const myOrbs = this.state.orbs.filter(o => o.side === side && o.alive);
                if (myOrbs.length > 0) {
                    const nearest = myOrbs.reduce((best, curr) => {
                        const d = Math.hypot(curr.x - ball.x, curr.y - ball.y);
                        return d < best.dist ? { orb: curr, dist: d } : best;
                    }, { orb: null, dist: 99999 }).orb;

                    if (nearest) {
                        const dx = nearest.x - ball.x, dy = nearest.y - ball.y;
                        const dist = Math.hypot(dx, dy) || 1;
                        ball.vx += (dx / dist) * 110 * dt;
                        ball.vy += (dy / dist) * 110 * dt;
                    }
                } else if (target && target.alive) {
                    // Alignement partiel avec la cible pour tirer
                    const dy = target.y - ball.y;
                    ball.vy += Math.sign(dy) * 70 * dt;
                }
            }

            // Maintien d'une vitesse de croisière dynamique
            const speed = Math.hypot(ball.vx, ball.vy);
            if (speed < 110) {
                const angle = Math.atan2(ball.vy, ball.vx);
                ball.vx = Math.cos(angle) * 130;
                ball.vy = Math.sin(angle) * 130;
            } else if (speed > 280) {
                ball.vx = (ball.vx / speed) * 280;
                ball.vy = (ball.vy / speed) * 280;
            }
        },

        _fireProjectile(shooter, target, world, battle) {
            if (!shooter || !shooter.alive || !target) return;

            const ammo = shooter.ammoType || 'fast';
            const dx = target.x - shooter.x;
            const dy = (target.y + (target.vy || 0) * 0.18) - shooter.y; // anticipation
            const len = Math.hypot(dx, dy) || 1;

            let speed = 480;
            let damage = 14;
            let radius = 7;
            let color = shooter.color;
            let maxBounces = 0;

            if (ammo === 'heavy') {
                speed = 340;
                damage = 28;
                radius = 11;
                color = '#f97316';
            } else if (ammo === 'bounce') {
                speed = 430;
                damage = 16;
                radius = 8;
                color = '#a855f7';
                maxBounces = 2;
            }

            if (shooter.ammoCount && shooter.ammoCount > 0) {
                shooter.ammoCount--;
                if (shooter.ammoCount <= 0) shooter.ammoType = 'fast';
            }

            const proj = {
                x: shooter.x + (dx / len) * (shooter.radius + radius + 3),
                y: shooter.y + (dy / len) * (shooter.radius + radius + 3),
                vx: (dx / len) * speed,
                vy: (dy / len) * speed,
                radius,
                owner: shooter,
                target,
                damage,
                color,
                ammoType: ammo,
                bouncesLeft: maxBounces,
                alive: true,
                life: 3.5,

                update(dt) {
                    this.life -= dt;
                    if (this.life <= 0) { this.alive = false; return; }

                    this.x += this.vx * dt;
                    this.y += this.vy * dt;

                    // Rebond sur les bordures extérieures
                    const arena = world.arena;
                    if (this.bouncesLeft > 0) {
                        if (this.y - this.radius < arena.y) {
                            this.y = arena.y + this.radius;
                            this.vy = Math.abs(this.vy);
                            this.bouncesLeft--;
                        } else if (this.y + this.radius > arena.y + arena.h) {
                            this.y = arena.y + arena.h - this.radius;
                            this.vy = -Math.abs(this.vy);
                            this.bouncesLeft--;
                        }
                    }

                    // Collision avec la cible adverse
                    const enemy = this.owner === battle.leftBall ? battle.rightBall : battle.leftBall;
                    const ballsToCheck = world.balls.filter(b => b.alive && b.team !== this.owner.team);
                    for (const b of ballsToCheck) {
                        const hitDist = Math.hypot(b.x - this.x, b.y - this.y);
                        if (hitDist < b.radius + this.radius) {
                            this.alive = false;
                            world.damage?.(b, this.owner, this.damage, 'ranged');
                            world.spawnParticle?.(this.x, this.y, { color: this.color, count: 18, speed: 220, life: 0.45, size: 2.8 });
                            world.addShockwave?.(this.x, this.y, { radius: 36, color: this.color, life: 0.25 });
                            world.playSound?.('hit', { pitch: this.ammoType === 'heavy' ? 0.65 : 1.1 });
                            break;
                        }
                    }
                },

                render(ctx) {
                    ctx.save();
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 16;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.8;
                    ctx.stroke();
                    ctx.restore();
                }
            };

            battle.projectiles.push(proj);
            world.spawnParticle?.(shooter.x, shooter.y, { color, count: 8, speed: 140, life: 0.25, size: 2.2 });
            world.playSound?.('whoosh', { pitch: ammo === 'heavy' ? 0.8 : 1.3 });
        },

        renderBackground(ctx, world, battle) {
            // Rendu de la zone séparée (grilles cyan/magenta légères)
            const arena = world.arena;
            const cx = this.state.dividerX || (arena.x + arena.w / 2);

            ctx.save();
            // Dégradé d'ambiance camp gauche (Cyan)
            const gradLeft = ctx.createLinearGradient(arena.x, 0, cx, 0);
            gradLeft.addColorStop(0, 'rgba(0, 242, 254, 0.08)');
            gradLeft.addColorStop(1, 'rgba(0, 242, 254, 0.01)');
            ctx.fillStyle = gradLeft;
            ctx.fillRect(arena.x, arena.y, cx - arena.x, arena.h);

            // Dégradé d'ambiance camp droit (Rose)
            const gradRight = ctx.createLinearGradient(cx, 0, arena.x + arena.w, 0);
            gradRight.addColorStop(0, 'rgba(255, 42, 133, 0.01)');
            gradRight.addColorStop(1, 'rgba(255, 42, 133, 0.08)');
            ctx.fillStyle = gradRight;
            ctx.fillRect(cx, arena.y, arena.x + arena.w - cx, arena.h);

            ctx.restore();
        },

        render(ctx, world, battle) {
            const arena = world.arena;
            const cx = this.state.dividerX || (arena.x + arena.w / 2);
            const pulse = 0.5 + 0.5 * Math.sin(this.state.pulseTime * 4.5);

            ctx.save();

            // 1. Rendu du Champ de force central
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = pulse > 0.5 ? '#67e8f9' : '#f472b6';
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 20 + pulse * 14;

            ctx.setLineDash([12, 8]);
            ctx.lineDashOffset = -this.state.pulseTime * 40;
            ctx.beginPath();
            ctx.moveTo(cx, arena.y);
            ctx.lineTo(cx, arena.y + arena.h);
            ctx.stroke();
            ctx.setLineDash([]);

            // Pôles émetteurs en haut et en bas du diviseur
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(cx, arena.y + 8, 5, 0, Math.PI * 2);
            ctx.arc(cx, arena.y + arena.h - 8, 5, 0, Math.PI * 2);
            ctx.fill();

            // 2. Rendu des orbes de munitions
            for (const orb of this.state.orbs) {
                if (!orb.alive) continue;
                const orbPulse = 0.5 + 0.5 * Math.sin(orb.pulse);
                ctx.save();
                ctx.fillStyle = orb.color;
                ctx.shadowColor = orb.color;
                ctx.shadowBlur = 16 + orbPulse * 12;
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.radius + orbPulse * 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Anneau d'énergie orbitant
                ctx.strokeStyle = orb.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(orb.x, orb.y, orb.radius * 1.6, orb.radius * 0.7, orb.pulse * 0.8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            ctx.restore();
        },

        checkVictory(world, battle) {
            const living = world.balls.filter(b => b.alive && !b.isClone);
            if (living.length === 1) {
                const finalSlowMoRemaining = (window.ArenaBattleBridge?.deathSlowMoUntil || 0) - performance.now();
                if (finalSlowMoRemaining > 0) return null;

                return {
                    finished: true,
                    winner: living[0],
                    reason: `Victoire au Duel de la Boule #${living[0].id} !`
                };
            }
            if (living.length === 0 && world.balls.length > 0) {
                return {
                    finished: true,
                    winner: null,
                    reason: 'Double KO — Égalité parfaite'
                };
            }
            return null;
        },

        onTimeout(world, battle) {
            const living = world.balls.filter(b => !b.isClone).sort((a, b) => {
                const aliveA = a.alive ? 1 : 0;
                const aliveB = b.alive ? 1 : 0;
                if (aliveB !== aliveA) return aliveB - aliveA;
                const hpA = a.health ? Number(a.health.current) || 0 : 0;
                const hpB = b.health ? Number(b.health.current) || 0 : 0;
                return hpB - hpA;
            });
            return {
                finished: true,
                winner: living[0] || null,
                reason: 'Temps écoulé — Plus grand nombre de PV restants'
            };
        }
    };

    if (window.GameModes) {
        window.GameModes.register(RangedDuelMode);
    }

    window.RangedDuelMode = RangedDuelMode;

})(typeof window !== 'undefined' ? window : this);
