/**
 * MODE ARENA BRAWL — Battle royale de boules dans une arène fermée.
 * Compatible TikTok 9:16. Déterministe (utilise world.prng).
 *
 * API publique (utilisée par simulation.js / app.js) :
 *   ArenaBattle.init(world)
 *   ArenaBattle.update(dt, world)
 *   ArenaBattle.render(ctx, world)
 *   ArenaBattle.reset(world)
 *   ArenaBattle.getOptions()
 *   ArenaBattle.applyOptions(opts)
 */
(function () {
    'use strict';

    const DEFAULTS = {
        ballCount: 4,
        maxHp: 100,
        contactDamageMult: 1,
        pickupInterval: 999999,
        maxSlots: 0,
        matchMode: 'timed', // fixed for the simplified MVP
        matchTime: 60,
        shrinkEnabled: false,
        shrinkStart: 30,
        shrinkRate: 6,
        shrinkMax: 0.16,
        obstacles: 0,
        arenaMap: 'neon'
    };

    class ArenaBattleMode {
        constructor() {
            this.options = Object.assign({}, DEFAULTS);
            this.matchTime = 60;
            this.elapsedTime = 0;
            this.finished = false;
            this.finishedByTimer = false;
            this.hud = null;
            this.pickupSystem = null;
            this.projectiles = [];
            this.particles = [];
            this.shockwaves = [];
            this.damageNumbers = null;
            this.floatingPlus = [];
            this.winner = null;
            this._nextBallId = 1;
            this._killFeedHooked = false;
        }

        applyOptions(opts) {
            Object.assign(this.options, opts || {});
            // MVP simplifié : aucun pickup/capacité, arène fixe sans obstacle et manche de 60 s.
            Object.assign(this.options, { pickupInterval: 999999, maxSlots: 0, matchMode: 'timed', matchTime: 60, shrinkEnabled: false, obstacles: 0, arenaMap: 'neon' });
            if (this._world && this._world.arena) {
                const arena = this._world.arena;
                const nextMap = this.options.arenaMap || 'neon';
                const mapChanged = arena.mapStyle !== nextMap;
                arena.shrinkEnabled = !!this.options.shrinkEnabled;
                arena.shrinkStart = Number(this.options.shrinkStart);
                arena.shrinkRate = Number(this.options.shrinkRate);
                arena.shrinkMax = Number(this.options.shrinkMax);
                arena.mapStyle = nextMap;
                if (mapChanged) arena._buildObstacles(this.options.obstacles);
            }
            if (this.elapsedTime <= 0 && Number.isFinite(Number(this.options.matchTime))) {
                this.matchTime = Number(this.options.matchTime);
            }
        }
        getOptions() { return Object.assign({}, this.options); }

        // Appelé par les boutons « Spawn » du panneau des capacités.
        spawnPickup(id) {
            const world = this._world;
            if (!world || !this.pickupSystem || !window.AbilityRegistry) return false;
            return false; // Les apparitions d'armes/capacités sont désactivées dans le MVP.
            const meta = window.AbilityRegistry.get(id);
            if (!meta) return false;
            return this.pickupSystem.spawnAbility(meta, world);
        }

        // ═══════════════════════════════════════════════════════════
        // INIT / RESET
        // ═══════════════════════════════════════════════════════════
        init(world) {
            this._world = world;
            this.matchTime = this.options.matchTime;
            this.elapsedTime = 0;
            this.finished = false;
            this.finishedByTimer = false;
            this.winner = null;
            this.projectiles.length = 0;
            // Les capacités ajoutent leurs tirs via world.projectiles : partager le même tableau que le moteur.
            world.projectiles = this.projectiles;
            this.particles.length = 0;
            this.shockwaves.length = 0;
            this.floatingPlus.length = 0;
            this._nextBallId = 1;

            // Arène
            if (!world.arena || world.arena.canvas !== world.canvas) {
                world.arena = new window.Arena(world.canvas, {
                    padding: 16,
                    cornerRadius: 44,
                    obstacles: this.options.obstacles,
                    mapStyle: this.options.arenaMap || 'neon',
                    shrink: this.options.shrinkEnabled,
                    shrinkStart: this.options.shrinkStart,
                    shrinkRate: this.options.shrinkRate,
                    shrinkMax: this.options.shrinkMax
                });
            } else {
                world.arena.shrinkEnabled = this.options.shrinkEnabled;
                world.arena.shrinkStart = this.options.shrinkStart;
                world.arena.shrinkRate = this.options.shrinkRate;
                world.arena.shrinkMax = this.options.shrinkMax;
                world.arena.mapStyle = this.options.arenaMap || 'neon';
                world.arena.shrinkOffset = 0;
                world.arena.elapsed = 0;
                world.arena._buildObstacles(this.options.obstacles);
                world.arena._recompute();
            }

            // Systèmes
            this.damageNumbers = new window.DamageNumberSystem();
            this.hud = new window.ArenaHUD();
            this.pickupSystem = new window.PickupSystem(world.prng);
            this.pickupSystem.setConfig({ spawnInterval: this.options.pickupInterval });

            // Boules
            world.balls.length = 0;
            this._spawnBalls(world);

            // Hooks
            this._hookWorld(world);
        }

        _spawnBalls(world) {
            const colors = [
                '#ff2a85', '#00f2fe', '#fbbf24', '#a855f7',
                '#34d399', '#f97316', '#60a5fa', '#f472b6'
            ];
            const n = this.options.ballCount;
            const arena = world.arena;
            // Disposition en cercle
            const cx = arena.x + arena.w / 2;
            const cy = arena.y + arena.h / 2;
            const ringR = Math.min(arena.w, arena.h) * 0.35;

            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2 - Math.PI / 2;
                const x = cx + Math.cos(a) * ringR;
                const y = cy + Math.sin(a) * ringR;

                const ball = this._createBall(world, x, y, colors[i % colors.length]);
                ball.team = i; // 1 équipe = 1 boule (FFA)
                world.balls.push(ball);
            }
        }

        _createBall(world, x, y, color, opts = {}) {
            // Utilise la classe Ball du projet si elle existe
            let ball;
            if (window.Ball) {
                ball = new window.Ball(x, y, opts.radius || 14, color);
            } else {
                // Fallback minimal
                ball = {
                    x, y,
                    vx: (world.prng.next() - 0.5) * 240,
                    vy: (world.prng.next() - 0.5) * 240,
                    radius: opts.radius || 14,
                    color,
                    trail: [],
                    alive: true
                };
            }
            ball.id = this._nextBallId++;
            ball.color = color;
            ball.alive = true;
            ball.speedMultiplier = 1;
            ball.team = opts.team ?? ball.id;
            ball.health = new window.Health(opts.maxHp ?? this.options.maxHp);
            ball.status = new window.StatusEffects(ball);
            ball.abilitySlots = []; // { meta, data, timeLeft, maxTime, cooldownBase }
            ball.isPlayer = opts.isPlayer ?? false;
            // Toutes les boules partagent la même vitesse de déplacement de base.
            ball.baseMoveSpeed = 180;
            const initialSpeed = Math.hypot(ball.vx || 0, ball.vy || 0);
            const initialAngle = initialSpeed > 0 ? Math.atan2(ball.vy, ball.vx) : ((ball.id * 2.399963229728653) % (Math.PI * 2));
            ball.vx = Math.cos(initialAngle) * ball.baseMoveSpeed;
            ball.vy = Math.sin(initialAngle) * ball.baseMoveSpeed;

            // Marqueur capacité
            ball._lastContactTimers = {};

            return ball;
        }

        // ═══════════════════════════════════════════════════════════
        // HOOKS WORLD
        // ═══════════════════════════════════════════════════════════
        _hookWorld(world) {
            const self = this;

            world.damage = function (target, attacker, amount, source, opts) {
                if (!target || !target.alive || !target.health) return 0;
                if (target.health.invuln > 0 && !(opts && opts.ignoreInvuln)) return 0;

                // Applique les modificateurs défensifs (bouclier, épines, etc.)
                let finalAmount = amount;
                for (const slot of target.abilitySlots) {
                    const beh = window.AbilityBehaviors[slot.meta.id];
                    if (beh && beh.onTakeDamage) {
                        finalAmount = beh.onTakeDamage(target, attacker, finalAmount, world, slot) ?? finalAmount;
                    }
                }

                const dealt = target.health.damage(finalAmount, opts);
                if (dealt <= 0) return 0;

                // Feedback
                if (source !== 'firetrail' && source !== 'blackhole' && !(opts && opts.silent)) {
                    const dmgColor = source === 'laser' ? '#ff2a85'
                        : source === 'mine' ? '#ff8a3d'
                        : source === 'chain' ? '#a855f7'
                        : source === 'dash' ? '#fbbf24'
                        : source === 'thorns' ? '#ef4444'
                        : '#ffffff';
                    const crit = dealt >= 15;
                    self.damageNumbers.spawn(
                        target.x, target.y - target.radius - 10,
                        Math.round(dealt),
                        dmgColor,
                        { crit, size: crit ? 22 : 16 }
                    );
                }

                if (target.health.dead) {
                    self._killBall(target, attacker, world, source);
                }
                return dealt;
            };

            world.spawnParticle = function (x, y, opts) {
                const count = opts.count ?? 6;
                const speed = opts.speed ?? 200;
                const life = opts.life ?? 0.6;
                const spread = opts.spread ?? Math.PI / 3;
                const color = opts.color || '#ffffff';
                const baseAngle = opts.angle ?? 0;
                for (let i = 0; i < count; i++) {
                    const a = baseAngle + (Math.random() - 0.5) * spread * 2;
                    const s = speed * (0.4 + Math.random() * 0.6);
                    self.particles.push({
                        x, y,
                        vx: Math.cos(a) * s,
                        vy: Math.sin(a) * s,
                        life, maxLife: life,
                        color,
                        size: opts.size ?? 2.5
                    });
                }
            };

            world.addShockwave = function (x, y, opts) {
                self.shockwaves.push({
                    x, y,
                    radius: 0,
                    maxRadius: opts.radius ?? 80,
                    color: opts.color ?? '#ffffff',
                    life: opts.life ?? 0.4,
                    maxLife: opts.life ?? 0.4
                });
            };

            world.addHitFlash = function (x, y) {
                world.arena.addHitFlash(x, y, 0.35);
            };

            world.addDamageNumber = function (x, y, text, color, opts) {
                self.damageNumbers.spawn(x, y, text, color, opts);
            };

            world.addFloatingPlus = function (x, y) {
                self.floatingPlus.push({ x, y, life: 0.9, maxLife: 0.9 });
            };

            world.playSound = function (name, opts) {
                if (window.Audio && window.Audio.playFx) {
                    try { window.Audio.playFx(name, opts); } catch (e) {}
                }
            };

            world.pickAbilityMeta = function () {
                // Filtre : pas plus de maxStacks par capacité déjà posée
                return window.AbilityRegistry.pickRandom(world.prng, (meta) => {
                    const count = world.balls.reduce((s, b) =>
                        s + b.abilitySlots.filter(sl => sl.meta.id === meta.id).length, 0);
                    return count < 4;
                });
            };

            world.grantAbility = function (ball, meta) {
                // Empile ou remplace le plus ancien
                const existing = ball.abilitySlots.find(sl => sl.meta.id === meta.id);
                if (existing) {
                    existing.timeLeft = meta.duration > 0 ? meta.duration : existing.timeLeft;
                    existing.maxTime = existing.timeLeft;
                    return;
                }
                if (ball.abilitySlots.length >= self.options.maxSlots) {
                    // Retire le plus ancien
                    const old = ball.abilitySlots.shift();
                    const beh = window.AbilityBehaviors[old.meta.id];
                    if (beh && beh.detach) beh.detach(ball, world, old);
                }
                const slot = {
                    meta,
                    data: null,
                    timeLeft: meta.duration > 0 ? (window.AbilitySettings ? window.AbilitySettings.getDuration(meta.id, meta.duration) : meta.duration) : Infinity,
                    maxTime: meta.duration > 0 ? (window.AbilitySettings ? window.AbilitySettings.getDuration(meta.id, meta.duration) : meta.duration) : Infinity
                };
                ball.abilitySlots.push(slot);
                const beh = window.AbilityBehaviors[meta.id];
                if (beh && beh.attach) beh.attach(ball, world, slot);
            };

            world.removeAbilitySlot = function (ball, slot) {
                const i = ball.abilitySlots.indexOf(slot);
                if (i >= 0) {
                    const beh = window.AbilityBehaviors[slot.meta.id];
                    if (beh && beh.detach) beh.detach(ball, world, slot);
                    ball.abilitySlots.splice(i, 1);
                }
            };

            world.spawnCloneFor = function (origin, opts) {
                const angle = Math.random() * Math.PI * 2;
                const dist = origin.radius * 3;
                const clone = self._createBall(
                    world,
                    origin.x + Math.cos(angle) * dist,
                    origin.y + Math.sin(angle) * dist,
                    origin.color,
                    {
                        radius: origin.radius,
                        maxHp: Math.max(15, origin.health.max * (opts.hpRatio ?? 0.3)),
                        team: origin.team
                    }
                );
                clone.isClone = true;
                clone.cloneLifetime = opts.lifetime ?? 5;
                clone.alpha = opts.opacity ?? 0.55;
                clone.vx = (Math.random() - 0.5) * 300;
                clone.vy = (Math.random() - 0.5) * 300;
                clone.abilitySlots = [];
                world.balls.push(clone);
                return clone.id;
            };
        }

        _killBall(ball, killer, world, source) {
            if (!ball.alive) return;
            ball.alive = false;

            // Explosion de KO en trois temps : éclats colorés, flash blanc, double onde.
            world.spawnParticle(ball.x, ball.y, {
                color: ball.color, count: 42, speed: 420, life: 1.05, spread: Math.PI * 2, size: 3.2
            });
            world.spawnParticle(ball.x, ball.y, {
                color: '#ffffff', count: 18, speed: 230, life: 0.42, spread: Math.PI * 2, size: 2.1
            });
            world.addShockwave(ball.x, ball.y, {
                radius: ball.radius * 8, color: ball.color, life: 0.62
            });
            world.addShockwave(ball.x, ball.y, {
                radius: ball.radius * 4.5, color: '#ffffff', life: 0.24
            });

            // Applique les capacités de mort
            for (const slot of ball.abilitySlots) {
                const beh = window.AbilityBehaviors[slot.meta.id];
                if (beh && beh.onDeath) beh.onDeath(ball, world, slot);
            }

            // Kill feed
            if (this.hud && killer && killer !== ball) {
                this.hud.killFeed.push(
                    `#${killer.id}`,
                    `#${ball.id}`,
                    source || 'contact'
                );
            }

            // Vérifie fin de match (lastStanding)
            if (this.options.matchMode === 'lastStanding') {
                const alive = world.balls.filter(b => b.alive && !b.isClone);
                if (alive.length <= 1) {
                    this.winner = alive[0] || null;
                    this.finished = true;
                }
            }
        }

        // ═══════════════════════════════════════════════════════════
        // UPDATE
        // ═══════════════════════════════════════════════════════════
        _updateMapMechanics(dt, world) {
            const arena = world.arena;
            const style = arena.mapStyle || 'neon';
            const cx = arena.x + arena.w / 2;
            const cy = arena.y + arena.h / 2;

            if (style === 'reactor') {
                const cycle = arena.time % 4.2;
                if (cycle >= 1.25 && cycle <= 2.35) {
                    const progress = (cycle - 1.25) / 1.1;
                    const ring = Math.min(arena.w, arena.h) * 0.47 * progress;
                    for (const ball of world.balls) {
                        if (!ball.alive) continue;
                        const dist = Math.hypot(ball.x - cx, ball.y - cy);
                        if (Math.abs(dist - ring) < ball.radius + 11 && ball._reactorCycle !== Math.floor(arena.time / 4.2)) {
                            ball._reactorCycle = Math.floor(arena.time / 4.2);
                            world.damage(ball, null, 14, 'reactor');
                            const nx = (ball.x - cx) / (dist || 1), ny = (ball.y - cy) / (dist || 1);
                            ball.vx += nx * 115; ball.vy += ny * 115;
                            this._keepBaseSpeed(ball);
                            world.spawnParticle(ball.x, ball.y, { color: '#fb923c', count: 18, speed: 230, life: 0.55, spread: Math.PI * 2, size: 2.8 });
                            world.addShockwave(ball.x, ball.y, { radius: 46, color: '#ff2a85', life: 0.32 });
                            world.playSound('hit', { pitch: 0.72 });
                        }
                    }
                }
            } else if (style === 'crossfire') {
                const cycle = arena.time % 4.0;
                const laneY = arena.y + arena.h * (0.18 + 0.64 * Math.min(cycle / 2.8, 1));
                if (cycle >= 2.8 && cycle <= 3.45) {
                    for (const ball of world.balls) {
                        if (!ball.alive || Math.abs(ball.y - laneY) > ball.radius + 13) continue;
                        if (ball._crossfireCycle === Math.floor(arena.time / 4.0)) continue;
                        ball._crossfireCycle = Math.floor(arena.time / 4.0);
                        world.damage(ball, null, 11, 'crossfire');
                        ball.vy += ball.y < cy ? -135 : 135;
                        this._keepBaseSpeed(ball);
                        world.spawnParticle(ball.x, laneY, { color: '#fbbf24', count: 15, speed: 210, life: 0.45, spread: Math.PI * 2, size: 2.5 });
                        world.addShockwave(ball.x, laneY, { radius: 34, color: '#ff2a85', life: 0.28 });
                    }
                }
            } else if (style === 'void') {
                const wells = [
                    { x: arena.x + arena.w * 0.28, y: arena.y + arena.h * 0.32, power: 115 },
                    { x: arena.x + arena.w * 0.72, y: arena.y + arena.h * 0.68, power: 115 }
                ];
                for (const ball of world.balls) {
                    if (!ball.alive) continue;
                    for (const well of wells) {
                        const dx = well.x - ball.x, dy = well.y - ball.y;
                        const dist2 = dx * dx + dy * dy;
                        if (dist2 < 180 * 180 && dist2 > 1) {
                            const dist = Math.sqrt(dist2);
                            const force = well.power * (1 - dist / 180);
                            ball.vx += dx / dist * force * dt;
                            ball.vy += dy / dist * force * dt;
                        }
                    }
                }
            }
        }

        _keepBaseSpeed(ball) {
            const target = ball.baseMoveSpeed || 180;
            const speed = Math.hypot(ball.vx || 0, ball.vy || 0);
            if (speed < 0.001) {
                const angle = ((ball.id || 1) * 2.399963229728653) % (Math.PI * 2);
                ball.vx = Math.cos(angle) * target;
                ball.vy = Math.sin(angle) * target;
                return;
            }
            const scale = target / speed;
            ball.vx *= scale;
            ball.vy *= scale;
        }

        update(dt, world) {
            // Une manche chronométrée est figée dès que le gagnant est déterminé.
            if (this.finished && (this.options.matchMode === 'timed' || this.finishedByTimer)) return;

            if (this.finished && this.options.matchMode === 'lastStanding') {
                // Ralenti dramatique après fin
                dt *= 0.25;
            }

            this.elapsedTime += dt;
            world.time = this.elapsedTime;
            // Synchronise le temps consommé par le HUD dessiné sur le canvas.
            world.elapsedTime = this.elapsedTime;
            world.matchTime = this.options.matchTime;

            // La carte a ses propres mécaniques lisibles : télégraphe puis danger réel.
            world.arena.update(dt);
            this._updateMapMechanics(dt, world);

            // Pickups
            // Les pickups sont désactivés dans le MVP simplifié.

            // Boules
            for (const ball of world.balls) {
                if (!ball.alive) continue;

                // Clone expiration
                if (ball.isClone) {
                    ball.cloneLifetime -= dt;
                    if (ball.cloneLifetime <= 0) {
                        this._killBall(ball, null, world, 'expire');
                        continue;
                    }
                }

                // Statuts
                ball.status.update(dt, world);

                // Multiplicateur de vitesse (dash, freeze)
                const statusMult = ball.status.getSpeedMultiplier();
                const speedMult = (ball.speedMultiplier ?? 1) * statusMult;

                // Update physique (intégration basique, la sim principale peut override)
                if (!ball.status.isStunned()) {
                    ball.x += ball.vx * dt * speedMult;
                    ball.y += ball.vy * dt * speedMult;
                }

                // Gravité (très légère, contrairement au mode classic)
                // Mouvement libre en 2D : aucune gravité, les boules se déplacent dans tout le terrain.

                // Collisions murs
                const hit = world.arena.resolveBall(ball);
                if (hit) {
                    // Capacités réactives
                    for (const slot of ball.abilitySlots) {
                        const beh = window.AbilityBehaviors[slot.meta.id];
                        if (beh && beh.onWallCollision) beh.onWallCollision(ball, world, slot, hit);
                    }
                }

                // Collisions balle ↔ balle (contact damage + capacités)
                for (const other of world.balls) {
                    if (other === ball || !other.alive) continue;
                    if (other.id < ball.id) continue; // évite double traitement
                    const dx = other.x - ball.x;
                    const dy = other.y - ball.y;
                    const minD = ball.radius + other.radius;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < minD * minD && d2 > 0) {
                        const d = Math.sqrt(d2);
                        const nx = dx / d;
                        const ny = dy / d;
                        const overlap = minD - d;
                        // Séparation
                        ball.x -= nx * overlap * 0.5;
                        ball.y -= ny * overlap * 0.5;
                        other.x += nx * overlap * 0.5;
                        other.y += ny * overlap * 0.5;
                        // Rebond
                        // Rebond élastique : le contact change la direction, pas la vitesse.
                        const relV = (ball.vx - other.vx) * nx + (ball.vy - other.vy) * ny;
                        if (relV <= 0) continue;
                        ball.vx -= relV * nx;
                        ball.vy -= relV * ny;
                        other.vx += relV * nx;
                        other.vy += relV * ny;
                        this._keepBaseSpeed(ball);
                        this._keepBaseSpeed(other);

                        // Contact damage
                        if (ball.team !== other.team) {
                            const baseDmg = 3 * this.options.contactDamageMult;
                            const cdBall = ball._lastContactTimers || {};
                            const cdOther = other._lastContactTimers || {};
                            if ((cdBall[other.id] || 0) <= 0) {
                                world.damage(other, ball, baseDmg, 'contact');
                                cdBall[other.id] = 0.5;
                                cdOther[ball.id] = 0.5;
                                ball._lastContactTimers = cdBall;
                                other._lastContactTimers = cdOther;
                            }
                        }

                        // Capacités : collisions
                        for (const slot of ball.abilitySlots) {
                            const beh = window.AbilityBehaviors[slot.meta.id];
                            if (beh && beh.onBallCollision) beh.onBallCollision(ball, other, world, slot);
                        }
                        for (const slot of other.abilitySlots) {
                            const beh = window.AbilityBehaviors[slot.meta.id];
                            if (beh && beh.onBallCollision) beh.onBallCollision(other, ball, world, slot);
                        }
                    }
                }

                // Cooldowns contact
                if (ball._lastContactTimers) {
                    for (const k in ball._lastContactTimers) {
                        ball._lastContactTimers[k] -= dt;
                    }
                }

                // Capacités
                for (let i = ball.abilitySlots.length - 1; i >= 0; i--) {
                    const slot = ball.abilitySlots[i];
                    if (slot.timeLeft !== Infinity) {
                        slot.timeLeft -= dt;
                        if (slot.timeLeft <= 0) {
                            const beh = window.AbilityBehaviors[slot.meta.id];
                            if (beh && beh.detach) beh.detach(ball, world, slot);
                            ball.abilitySlots.splice(i, 1);
                            continue;
                        }
                    }
                    const beh = window.AbilityBehaviors[slot.meta.id];
                    if (beh && beh.update) beh.update(ball, world, slot, dt);
                }

                // Les effets de collision/capacité ne doivent pas faire dériver la vitesse de base.
                if (!ball.status.isStunned()) this._keepBaseSpeed(ball);

                // Health update
                ball.health.update(dt);

                // Danger zone (shrink)
                if (world.arena.isInsideDangerZone(ball)) {
                    ball.health.damage(3 * dt, { ignoreInvuln: true });
                    if (ball.health.dead) this._killBall(ball, null, world, 'zone');
                }
            }

            // Projectiles
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const p = this.projectiles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt;
                // Trail
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 6) p.trail.shift();

                // Collisions murs
                const beforeX = p.x, beforeY = p.y;
                const bounds = world.arena.getBounds();
                if (p.x < bounds.left + p.radius || p.x > bounds.right - p.radius) {
                    if (p.bounces > 0) {
                        p.vx = -p.vx;
                        p.bounces--;
                        p.x = beforeX;
                    } else {
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }
                if (p.y < bounds.top + p.radius || p.y > bounds.bottom - p.radius) {
                    if (p.bounces > 0) {
                        p.vy = -p.vy;
                        p.bounces--;
                        p.y = beforeY;
                    } else {
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }

                // Collision directe ou explosion à impact (les armes explosives ont une vraie zone de dégâts).
                let impact = false;
                for (const ball of world.balls) {
                    if (!ball.alive || ball.id === p.ownerId) continue;
                    const dx = ball.x - p.x;
                    const dy = ball.y - p.y;
                    if (dx * dx + dy * dy < (ball.radius + p.radius) ** 2) {
                        impact = true;
                        break;
                    }
                }
                if (impact) {
                    const owner = world.balls.find(b => b.id === p.ownerId);
                    if (p.splashRadius) {
                        world.spawnParticle(p.x, p.y, { color: p.color, count: 34, speed: 310, life: 0.72, spread: Math.PI * 2, size: 3 });
                        world.spawnParticle(p.x, p.y, { color: '#fff7ed', count: 12, speed: 190, life: 0.3, spread: Math.PI * 2, size: 2.4 });
                        world.addShockwave(p.x, p.y, { radius: p.splashRadius, color: p.color, life: 0.38 });
                        for (const victim of world.balls) {
                            if (!victim.alive || victim.id === p.ownerId) continue;
                            const dx = victim.x - p.x, dy = victim.y - p.y;
                            const distance = Math.hypot(dx, dy);
                            if (distance <= p.splashRadius + victim.radius) {
                                const falloff = Math.max(0.35, 1 - distance / (p.splashRadius + victim.radius));
                                world.damage(victim, owner, p.damage * falloff, 'plasma');
                                const push = 155 * falloff;
                                const len = distance || 1;
                                victim.vx += (dx / len) * push;
                                victim.vy += (dy / len) * push;
                                this._keepBaseSpeed(victim);
                            }
                        }
                    } else {
                        const victim = world.balls.find(ball => ball.alive && ball.id !== p.ownerId &&
                            (ball.x - p.x) ** 2 + (ball.y - p.y) ** 2 < (ball.radius + p.radius) ** 2);
                        if (victim) world.damage(victim, owner, p.damage, p.type || 'arrow');
                        world.spawnParticle(p.x, p.y, { color: p.color, count: 8, speed: 180, life: 0.4, spread: Math.PI * 2 });
                    }
                    this.projectiles.splice(i, 1);
                    continue;
                }

                if (p.life <= 0) this.projectiles.splice(i, 1);
            }

            // Particules
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.life -= dt;
                if (p.life <= 0) { this.particles.splice(i, 1); continue; }
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.94;
                p.vy *= 0.94;
            }

            // Shockwaves
            for (let i = this.shockwaves.length - 1; i >= 0; i--) {
                const s = this.shockwaves[i];
                s.life -= dt;
                if (s.life <= 0) { this.shockwaves.splice(i, 1); continue; }
                const t = 1 - s.life / s.maxLife;
                s.radius = s.maxRadius * t;
            }

            // Floating plus
            for (let i = this.floatingPlus.length - 1; i >= 0; i--) {
                const fp = this.floatingPlus[i];
                fp.life -= dt;
                fp.y -= 30 * dt;
                if (fp.life <= 0) this.floatingPlus.splice(i, 1);
            }

            // Damage numbers
            this.damageNumbers.update(dt);

            // HUD
            this.hud.update(dt, world);

            // Fin d'une manche chronométrée : le survivant avec le plus de PV restants gagne,
            // même si plusieurs boules sont encore en vie à zéro sur le chronomètre.
            if (!this.finished && this.elapsedTime >= this.matchTime) {
                this.finished = true;
                this.finishedByTimer = true;
                const alive = world.balls.filter(b => b.alive && !b.isClone);
                const candidates = alive.length ? alive : world.balls.filter(b => !b.isClone);

                // Classement déterministe : PV restants, puis pourcentage de vie, puis ID le plus bas.
                candidates.sort((a, b) => {
                    const hpA = Number(a.health?.current) || 0;
                    const hpB = Number(b.health?.current) || 0;
                    if (hpB !== hpA) return hpB - hpA;

                    const ratioA = a.health?.max ? hpA / a.health.max : 0;
                    const ratioB = b.health?.max ? hpB / b.health.max : 0;
                    if (ratioB !== ratioA) return ratioB - ratioA;

                    return (a.id || 0) - (b.id || 0);
                });

                this.winner = candidates[0] || null;
            }
        }

        // ═══════════════════════════════════════════════════════════
        // RENDER
        // ═══════════════════════════════════════════════════════════
        render(ctx, world) {
            // Fond
            ctx.fillStyle = '#080a10';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // Arène
            world.arena.render(ctx);

            // Pickups (sous les balles)
            // Aucun pickup à dessiner dans le MVP simplifié.

            // Boules
            for (const ball of world.balls) {
                if (!ball.alive) continue;
                this._renderBall(ctx, ball, world);
            }

            // Projectiles
            for (const p of this.projectiles) {
                if (p.render) p.render(ctx, p);
            }

            // Capacités custom (piques, mines, laser, etc.)
            for (const ball of world.balls) {
                if (!ball.alive) continue;
                for (const slot of ball.abilitySlots) {
                    const beh = window.AbilityBehaviors[slot.meta.id];
                    if (beh && beh.render) beh.render(ctx, ball, world, slot);
                }
            }

            // Particules
            for (const p of this.particles) {
                const t = p.life / p.maxLife;
                ctx.save();
                ctx.globalAlpha = t;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Shockwaves
            for (const s of this.shockwaves) {
                const t = s.life / s.maxLife;
                ctx.save();
                ctx.globalAlpha = t;
                ctx.strokeStyle = s.color;
                ctx.lineWidth = 3 * t;
                ctx.shadowColor = s.color;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // Damage numbers
            this.damageNumbers.render(ctx);

            // "+" de régén
            for (const fp of this.floatingPlus) {
                const t = fp.life / fp.maxLife;
                ctx.save();
                ctx.globalAlpha = t;
                ctx.fillStyle = '#34d399';
                ctx.font = 'bold 14px Outfit, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('+', fp.x, fp.y);
                ctx.restore();
            }

            // HUD
            this.hud.render(ctx, world);

            // Résultat de manche : boule gagnante agrandie et label lumineux.
            if (this.finished) this._renderWinner(ctx, world);
        }

        _renderWinner(ctx, world) {
            const winner = this.winner;
            const w = ctx.canvas.width;
            const h = ctx.canvas.height;
            const pulse = 0.5 + 0.5 * Math.sin((world.time || this.elapsedTime) * 4.5);

            ctx.save();
            ctx.fillStyle = 'rgba(3, 5, 14, 0.76)';
            ctx.fillRect(0, 0, w, h);

            const centerX = w / 2;
            const centerY = h * 0.43;
            if (winner) {
                const radius = Math.max(28, Math.min(w, h) * 0.075);
                ctx.save();
                ctx.shadowColor = winner.color || '#fbbf24';
                ctx.shadowBlur = 26 + pulse * 24;
                const ballGradient = ctx.createRadialGradient(
                    centerX - radius * 1.75, centerY - radius * 0.35, radius * 0.08,
                    centerX - radius * 1.45, centerY, radius
                );
                ballGradient.addColorStop(0, '#ffffff');
                ballGradient.addColorStop(0.28, winner.color || '#fbbf24');
                ballGradient.addColorStop(1, winner.color || '#fbbf24');
                ctx.fillStyle = ballGradient;
                ctx.beginPath();
                ctx.arc(centerX - radius * 1.45, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(255,255,255,' + (0.65 + pulse * 0.35) + ')';
                ctx.stroke();
                ctx.restore();

                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.font = '900 ' + Math.max(30, Math.min(w * 0.105, 58)) + 'px Outfit, system-ui, sans-serif';
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 18 + pulse * 20;
                ctx.fillStyle = '#fff5c2';
                ctx.fillText('WINNER', centerX + radius * 0.1, centerY - 4);

                ctx.shadowBlur = 0;
                ctx.font = '700 ' + Math.max(13, Math.min(w * 0.035, 19)) + 'px Outfit, system-ui, sans-serif';
                ctx.fillStyle = winner.color || '#fbbf24';
                ctx.fillText('BOULE #' + winner.id, centerX + radius * 0.1, centerY + radius * 0.8);
            } else {
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '900 ' + Math.max(28, Math.min(w * 0.09, 48)) + 'px Outfit, system-ui, sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('MANCHE TERMINÉE', centerX, centerY);
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 18 + pulse * 14;
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 ' + Math.max(16, Math.min(w * 0.05, 26)) + 'px Outfit, system-ui, sans-serif';
            ctx.fillText('BALLYSTIK CHAMPION', centerX, centerY + Math.min(h * 0.12, 82));
            ctx.shadowBlur = 0;
            ctx.font = '500 ' + Math.max(12, Math.min(w * 0.032, 16)) + 'px Outfit, system-ui, sans-serif';
            ctx.fillStyle = 'rgba(226,232,240,0.88)';
            ctx.fillText('Relance une manche pour tenter ta chance', centerX, centerY + Math.min(h * 0.17, 118));
            ctx.restore();
        }

        _renderBall(ctx, ball, world) {
            const alpha = ball.isClone ? (ball.alpha ?? 0.55) : 1;

            // Signal d'état lisible : l'anneau rouge n'apparaît qu'en danger critique.
            const hpRatio = ball.health && ball.health.max > 0 ? ball.health.current / ball.health.max : 1;
            if (hpRatio <= 0.3) {
                const t = world.time || 0;
                ctx.save();
                ctx.globalAlpha = alpha * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 13 + ball.id)));
                ctx.strokeStyle = '#ff334f';
                ctx.lineWidth = 2.2;
                ctx.shadowColor = '#ff1f46';
                ctx.shadowBlur = 13;
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius + 5 + 2 * Math.sin(t * 9), 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // Trail
            if (!ball.isClone && ball.trail) {
                ball.trail.push({ x: ball.x, y: ball.y });
                if (ball.trail.length > 8) ball.trail.shift();
                for (let i = 0; i < ball.trail.length; i++) {
                    const t = ball.trail[i];
                    const a = i / ball.trail.length;
                    ctx.save();
                    ctx.globalAlpha = a * 0.3 * alpha;
                    ctx.fillStyle = ball.color;
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, ball.radius * a * 0.7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Corps
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = ball.color;
            ctx.shadowBlur = 22;
            const grd = ctx.createRadialGradient(
                ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
                ball.x, ball.y, ball.radius
            );
            grd.addColorStop(0, '#ffffff');
            grd.addColorStop(0.3, ball.color);
            grd.addColorStop(1, ball.color);
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();

            // Reflet spéculaire net pour un rendu plus proche d'une sphère 3D.
            ctx.globalAlpha = alpha * 0.88;
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.ellipse(
                ball.x - ball.radius * 0.31,
                ball.y - ball.radius * 0.38,
                Math.max(2, ball.radius * 0.24),
                Math.max(1.5, ball.radius * 0.13),
                -0.58, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = alpha * 0.22;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius - 1, -Math.PI * 0.88, -Math.PI * 0.18);
            ctx.stroke();
            ctx.restore();

            // Statuts (burn, freeze, poison, stun)
            ball.status.render(ctx);

            // Barre de vie au-dessus
            if (!ball.isClone) {
                const barW = ball.radius * 3;
                ball.health.render(ctx, ball.x, ball.y - ball.radius - 12, barW, 5, ball.color);
            }

            // Slots d'icônes sous la boule
            this._renderAbilitySlots(ctx, ball);
        }

        _renderAbilitySlots(ctx, ball) {
            if (!ball.abilitySlots || !ball.abilitySlots.length) return;
            const slotSize = 14;
            const gap = 3;
            const total = ball.abilitySlots.length * slotSize + (ball.abilitySlots.length - 1) * gap;
            let x = ball.x - total / 2 + slotSize / 2;
            const y = ball.y + ball.radius + 14;

            for (const slot of ball.abilitySlots) {
                const meta = slot.meta;

                // Fond circulaire
                ctx.save();
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.beginPath();
                ctx.arc(x, y, slotSize / 2, 0, Math.PI * 2);
                ctx.fill();

                // Bord coloré
                ctx.strokeStyle = meta.color;
                ctx.lineWidth = 1.2;
                ctx.stroke();

                // Icône (unicode)
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(meta.icon, x, y + 0.5);

                // Anneau de timer
                if (slot.timeLeft !== Infinity && slot.maxTime !== Infinity) {
                    const t = slot.timeLeft / slot.maxTime;
                    ctx.strokeStyle = meta.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(x, y, slotSize / 2 + 1.5, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();

                x += slotSize + gap;
            }
        }

        reset(world) {
            this.init(world);
        }
    }

    window.ArenaBattleMode = ArenaBattleMode;
    window.ArenaBattle = new ArenaBattleMode();
})();