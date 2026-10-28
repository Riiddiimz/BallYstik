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
        pickupInterval: 5,
        maxSlots: 3,
        matchMode: 'lastStanding',
        matchTime: 60,
        shrinkEnabled: false,
        shrinkStart: 30,
        shrinkRate: 6,
        shrinkMax: 0.16,
        arenaTop: 0.16,
        arenaBottom: 0.10,
        arenaLeft: 0,
        arenaRight: 0.14,
        obstacles: 1,
        vortexObstacles: 10,
        arenaMap: 'neon'
    };

    const isVortexMap = map => map === 'vortex';
    const isSourceMap = map => /^source_(neon|refonte)_\d+$/.test(map);
    const obstacleCountForMap = (map, options) => {
        if (map === 'sanctuaire') return 8;
        if (map === 'cyber_core') return 5;
        if (['neon_grid', 'volcan', 'nexus', 'reactor', 'crossfire'].includes(map)) return 3;
        if (isVortexMap(map)) return options.vortexObstacles;
        return options.obstacles;
    };

    class ArenaBattleMode {
        constructor() {
            this.options = Object.assign({}, DEFAULTS);
            this.matchTime = 60;
            this.elapsedTime = 0;
            this.finished = false;
            this.winnerDisplayActive = false;
            this.winnerDisplayElapsed = 0;
            this.hud = null;
            this.pickupSystem = null;
            this.projectiles = [];
            this.particles = [];
            this.shockwaves = [];
            this.damageNumbers = null;
            this.floatingPlus = [];
            this.winner = null;
            this.activeMode = null;
            this._nextBallId = 1;
            this._killFeedHooked = false;
        }

        applyOptions(opts) {
            Object.assign(this.options, opts || {});
            const modeId = this.options.matchMode || 'lastStanding';
            this.activeMode = (window.GameModes && window.GameModes.get(modeId)) || (window.LastStandingMode || null);
            if (this._world && this._world.arena) {
                const arena = this._world.arena;
                const nextMap = this.options.arenaMap || 'neon';
                const mapChanged = arena.mapStyle !== nextMap;
                arena.shrinkEnabled = !isSourceMap(nextMap) && this.options.shrinkEnabled !== false;
                arena.shrinkStart = Number(this.options.shrinkStart);
                arena.shrinkRate = Number(this.options.shrinkRate);
                arena.shrinkMax = Number(this.options.shrinkMax);
                arena.arenaMargins = {
                    top: Number(this.options.arenaTop),
                    bottom: Number(this.options.arenaBottom),
                    left: Number(this.options.arenaLeft),
                    right: Number(this.options.arenaRight)
                };
                arena.mapStyle = nextMap;
                if (mapChanged || opts?.arenaTop != null || opts?.arenaBottom != null || opts?.arenaLeft != null || opts?.arenaRight != null) arena._recompute();
                const obstacleCount = obstacleCountForMap(nextMap, this.options);
                if (mapChanged || opts?.obstacles != null || opts?.vortexObstacles != null || opts?.obstaclePositions != null) arena._buildObstacles(obstacleCount, isVortexMap(nextMap) ? null : this.options.obstaclePositions);
                if (isVortexMap(nextMap) && !arena.suckParticles.length) {
                    for (let i = 0; i < 40; i++) arena.suckParticles.push(arena._newSuckParticle(i, true));
                }
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
            const meta = window.AbilityRegistry.get(id);
            if (!meta || !window.AbilityRegistry.isNewPower(id)) return false;

            // Même règle pour le spawn manuel et le tirage automatique :
            // un seul exemplaire de chaque pouvoir au sol ou actif par combat.
            const alreadyOnGround = this.pickupSystem.items.some(p =>
                p.state !== 'taken' && p.meta && p.meta.id === id);
            const alreadyActive = world.balls.some(ball =>
                ball.abilitySlots.some(slot => slot.meta && slot.meta.id === id));
            if (alreadyOnGround || alreadyActive) return false;

            return this.pickupSystem.spawnAbility(meta, world);
        }

        // ═══════════════════════════════════════════════════════════
        // INIT / RESET
        // ═══════════════════════════════════════════════════════════
        init(world) {
            // Les effets des pouvoirs sont globaux au module : les vider avant de créer le nouveau match.
            if (window.AbilityBehaviors && typeof window.AbilityBehaviors.resetAll === 'function') {
                window.AbilityBehaviors.resetAll();
            }
            this._world = world;
            this.elapsedTime = 0;
            this.finished = false;
            this.winnerDisplayActive = false;
            this.winnerDisplayElapsed = 0;
            this.winner = null;
            this.projectiles.length = 0;
            // Les capacités ajoutent leurs tirs via world.projectiles : partager le même tableau que le moteur.
            world.projectiles = this.projectiles;
            this.particles.length = 0;
            this.shockwaves.length = 0;
            this.floatingPlus.length = 0;
            this._nextBallId = 1;
            const modeId = this.options.matchMode || 'lastStanding';
            this.activeMode = (window.GameModes && window.GameModes.get(modeId)) || (window.LastStandingMode || null);

            // Arène
            if (!world.arena || world.arena.canvas !== world.canvas) {
                world.arena = new window.Arena(world.canvas, {
                    prng: world.prng,
                    padding: 16,
                    cornerRadius: 44,
                    obstacles: obstacleCountForMap(this.options.arenaMap || 'neon', this.options),
                    obstaclePositions: isVortexMap(this.options.arenaMap || 'neon') ? null : this.options.obstaclePositions,
                    mapStyle: this.options.arenaMap || 'neon',
                    shrink: !isSourceMap(this.options.arenaMap || 'neon') && this.options.shrinkEnabled !== false,
                    shrinkStart: this.options.shrinkStart,
                    shrinkRate: this.options.shrinkRate,
                    shrinkMax: this.options.shrinkMax,
                    arenaTop: this.options.arenaTop,
                    arenaBottom: this.options.arenaBottom,
                    arenaLeft: this.options.arenaLeft,
                    arenaRight: this.options.arenaRight
                });
            } else {
                world.arena.prng = world.prng;
                world.arena.mapStyle = this.options.arenaMap || 'neon';
                world.arena.shrinkEnabled = !isSourceMap(this.options.arenaMap || 'neon') && this.options.shrinkEnabled !== false;
                world.arena.shrinkStart = this.options.shrinkStart;
                world.arena.shrinkRate = this.options.shrinkRate;
                world.arena.shrinkMax = this.options.shrinkMax;
                world.arena.arenaMargins = {
                    top: Number(this.options.arenaTop),
                    bottom: Number(this.options.arenaBottom),
                    left: Number(this.options.arenaLeft),
                    right: Number(this.options.arenaRight)
                };
                world.arena.shrinkOffset = 0;
                world.arena.elapsed = 0;
                world.arena._recompute();
                world.arena._buildObstacles(obstacleCountForMap(world.arena.mapStyle, this.options),
                    isVortexMap(world.arena.mapStyle) ? null : this.options.obstaclePositions);
                if (isVortexMap(world.arena.mapStyle) && !world.arena.suckParticles.length) {
                    for (let i = 0; i < 40; i++) world.arena.suckParticles.push(world.arena._newSuckParticle(i, true));
                }
            }

            // Systèmes
            this.damageNumbers = new window.DamageNumberSystem();
            this.hud = new window.ArenaHUD();
            this.pickupSystem = new window.PickupSystem(world.prng);
            this.pickupSystem.setConfig({ spawnInterval: this.options.pickupInterval });

            // Boules
            world.balls.length = 0;
            if (this.activeMode && typeof this.activeMode.customBallSpawn === 'function') {
                this.activeMode.customBallSpawn(world, this);
            } else {
                this._spawnBalls(world);
            }
            if (this.activeMode && typeof this.activeMode.init === 'function') {
                this.activeMode.init(world, this);
            }

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

                const point = arena.constrainPoint(x, y, 14);
                const ball = this._createBall(world, point.x, point.y, colors[i % colors.length]);
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
            // Le réglage Vitesse agit sur le déplacement des boules, jamais sur le chrono.
            const configuredSpeed = Number(this.options.gameSpeed);
            const speedRatio = Number.isFinite(configuredSpeed) && configuredSpeed > 0 ? configuredSpeed / 1.5 : 1;
            ball.baseMoveSpeed = 180 * speedRatio;
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

                // Les explosions de mort peuvent déclencher d'autres morts en chaîne.
                // Limiter la profondeur évite qu'une cascade d'effets épuise la pile JS.
                world._damageDepth = world._damageDepth || 0;
                if (world._damageDepth >= 24) return 0;
                world._damageDepth++;

                try {
                    // Applique les modificateurs défensifs (bouclier, épines, etc.).
                    // Les dégâts sont doublés à partir de 50 secondes.
                    let finalAmount = self.elapsedTime >= 50 ? amount * 2 : amount;
                    for (const slot of target.abilitySlots) {
                        const beh = window.AbilityBehaviors[slot.meta.id];
                        // Un reflet ne doit jamais relancer une réflexion d'épines.
                        if (opts && opts.noThornsReflect && slot.meta.id === 'thorns') continue;
                        if (opts && opts.noPowerReflect && (slot.meta.id === 'revenge_mirror' || slot.meta.id === 'prism_reflector')) continue;
                        if (beh && beh.onTakeDamage) {
                            finalAmount = beh.onTakeDamage(target, attacker, finalAmount, world, slot) ?? finalAmount;
                        }
                    }

                    const dealt = target.health.damage(finalAmount, opts);
                    if (dealt <= 0) return 0;
                    if (source !== 'contact' && !(opts && opts.silent) && window.audioSynth) {
                        window.audioSynth.playFx('hit', { volume: Math.min(0.28, 0.12 + dealt / 120) });
                    }
                    // Les leurres de Multiplication disparaissent au premier impact reçu.
                    if (target.isPowerDecoy && target.health) { target.health.current = 0; target.health.dead = true; }

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
                } finally {
                    world._damageDepth--;
                }
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
                try {
                    if (window.audioSynth && window.audioSynth.playFx) {
                        const supported = new Set(['hit', 'power', 'collision', 'wall', 'obstacle', 'ko']);
                        const mapped = supported.has(name) ? name : 'hit';
                        window.audioSynth.playFx(mapped, opts || {});
                    }
                } catch (e) {}
            };

            world.pickAbilityMeta = function () {
                // Tirage automatique : uniquement les nouveaux pouvoirs et jamais
                // deux exemplaires du même pouvoir déjà au sol ou actif dans ce combat.
                return window.AbilityRegistry.pickRandom(world.prng, (meta) => {
                    if (!window.AbilityRegistry.isNewPower(meta.id)) return false;
                    const active = world.balls.some(b =>
                        b.abilitySlots.some(slot => slot.meta && slot.meta.id === meta.id));
                    if (active) return false;
                    const waiting = self.pickupSystem && self.pickupSystem.items.some(p =>
                        p.meta && p.meta.id === meta.id);
                    return !waiting;
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
                const angle = world.prng.next() * Math.PI * 2;
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
                clone.vx = (world.prng.next() - 0.5) * 300;
                clone.vy = (world.prng.next() - 0.5) * 300;
                clone.abilitySlots = [];
                world.balls.push(clone);
                return clone.id;
            };
        }

        _killBall(ball, killer, world, source) {
            if (!ball.alive) return;
            ball.alive = false;
            if (window.audioSynth && typeof window.audioSynth.playFx === 'function') {
                const survivors = world.balls.filter(other => other.alive && !other.isClone).length;
                window.audioSynth.playFx('ko', { volume: survivors <= 1 ? 0.42 : 0.25, powerId: 'ko-' + ball.id });
            }

            // Vrai ralenti après chaque KO, plus long lors de l'élimination finale.
            // Le contrôleur ralentit l'accumulation du temps de jeu sans changer le dt physique.
            const realSurvivors = world.balls.filter(other => other.alive && !other.isClone);
            const isFinalElimination = realSurvivors.length === 1;
            if (window.ArenaBattleBridge) {
                const duration = isFinalElimination ? 1800 : 420;
                window.ArenaBattleBridge.deathSlowMoUntil = Math.max(
                    window.ArenaBattleBridge.deathSlowMoUntil || 0,
                    performance.now() + duration
                );
            }

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

            // La victoire est vérifiée à chaque update : si cette élimination laisse
            // une seule boule réelle en vie, elle gagne immédiatement, quel que soit le chrono.
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
            }
        }

        _clampVortexSpeed(ball) {
            const speed = Math.hypot(ball.vx || 0, ball.vy || 0);
            if (speed < 0.001) {
                const angle = ((ball.id || 1) * 2.399963229728653) % (Math.PI * 2);
                ball.vx = Math.cos(angle) * 180;
                ball.vy = Math.sin(angle) * 180;
                return;
            }
            const target = Math.max(90, Math.min(460, speed));
            ball.vx = ball.vx / speed * target;
            ball.vy = ball.vy / speed * target;
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
            // Après 60 secondes, figer le combat et garder le gagnant à l'écran 2 secondes.
            if (this.winnerDisplayActive) {
                this.winnerDisplayElapsed += dt;
                if (this.winnerDisplayElapsed >= 2) {
                    this.winnerDisplayElapsed = 2;
                    this.winnerDisplayActive = false;
                    this.finished = true;
                }
                return;
            }
            if (this.finished) return;

            // En jeu réel, l'horloge du match suit le temps mural, indépendamment
            // de la vitesse de déplacement et du ralenti physique. La recherche de seed
            // conserve le temps déterministe basé sur dt.
            if (world.realClockMode && Number.isFinite(world.realElapsedTime)) {
                this.elapsedTime = world.realElapsedTime;
            } else {
                this.elapsedTime += dt;
            }
            const duration = Number(this.matchTime) || 65;
            if (Number.isFinite(duration) && duration > 0 && this.elapsedTime >= duration) {
                this.elapsedTime = duration;
                world.time = this.elapsedTime;
                world.matchTime = duration;
                world.elapsedTime = this.elapsedTime;

                // Clôture de la manche : déléguer au mode ou classement PV par défaut
                if (this.activeMode && typeof this.activeMode.onTimeout === 'function') {
                    const timeoutRes = this.activeMode.onTimeout(world, this);
                    if (timeoutRes && timeoutRes.finished) {
                        this.winner = timeoutRes.winner || null;
                        this.winnerDisplayActive = true;
                        this.winnerDisplayElapsed = 0;
                        this.finished = false;
                        return;
                    }
                }
                const contenders = world.balls
                    .filter(ball => !ball.isClone)
                    .sort((a, b) => {
                        const aliveA = a.alive ? 1 : 0;
                        const aliveB = b.alive ? 1 : 0;
                        if (aliveB !== aliveA) return aliveB - aliveA;
                        const hpA = a.health ? Number(a.health.current) || 0 : 0;
                        const hpB = b.health ? Number(b.health.current) || 0 : 0;
                        if (hpB !== hpA) return hpB - hpA;
                        return (a.id || 0) - (b.id || 0);
                    });
                this.winner = contenders[0] || null;
                this.winnerDisplayActive = true;
                this.winnerDisplayElapsed = 0;
                this.finished = false;
                return;
            }

            world.time = this.elapsedTime;
            world.matchTime = Number.isFinite(duration) ? duration : this.options.matchTime;
            // Synchronise le temps consommé par le HUD dessiné sur le canvas.
            world.elapsedTime = this.elapsedTime;

            // La carte a ses propres mécaniques lisibles : télégraphe puis danger réel.
            world.arena.update(dt);
            this._updateMapMechanics(dt, world);

            // Mise à jour spécifique au mode de jeu actif
            if (this.activeMode && typeof this.activeMode.update === 'function') {
                this.activeMode.update(dt, world, this);
            }

            // Pickups : conserve leur système, mais évite qu'un spawn reste hors du cercle Vortex.
            this.pickupSystem.update(dt, world);
            // Contrainte de position fournie par la map active : fonctionne aussi pour
            // les futures maps non rectangulaires sans ajouter de condition ici.
            if (world.arena && typeof world.arena.constrainPoint === 'function') {
                for (const pickup of this.pickupSystem.items) {
                    const point = world.arena.constrainPoint(pickup.x, pickup.y, pickup.radius || 16);
                    if (point.x !== pickup.x || point.y !== pickup.y) {
                        pickup.x = point.x;
                        pickup.y = point.y;
                        pickup.baseY = point.y;
                    }
                }
            }

            // Aimantation très légère des pouvoirs : aide à ramasser sans téléguider les boules.
            // La correction de direction est plafonnée et n'augmente pas la vitesse.
            const activePickups = this.pickupSystem.items || [];
            for (const ball of world.balls) {
                if (!ball.alive || ball.status?.isStunned?.()) continue;
                let nearest = null, nearestDist = 92;
                for (const pickup of activePickups) {
                    const dx = pickup.x - ball.x, dy = pickup.y - ball.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 1 && dist < nearestDist) { nearest = { dx, dy, dist }; nearestDist = dist; }
                }
                if (nearest) {
                    const speed = Math.hypot(ball.vx || 0, ball.vy || 0) || 1;
                    const nx = nearest.dx / nearest.dist, ny = nearest.dy / nearest.dist;
                    // Petit mélange directionnel de 4 à 10 % selon la proximité.
                    const steer = 0.04 + 0.06 * (1 - nearest.dist / 92);
                    const vx = (ball.vx / speed) * (1 - steer) + nx * steer;
                    const vy = (ball.vy / speed) * (1 - steer) + ny * steer;
                    const len = Math.hypot(vx, vy) || 1;
                    ball.vx = vx / len * speed;
                    ball.vy = vy / len * speed;
                }
            }

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

                // La propulsion d'un obstacle est temporaire : après 0,75 s,
                // la boule retrouve sa vitesse de déplacement habituelle.
                if (ball._obstacleBoostTimer > 0) {
                    ball._obstacleBoostTimer = Math.max(0, ball._obstacleBoostTimer - dt);
                    if (ball._obstacleBoostTimer === 0) {
                        const targetSpeed = Number(ball.baseMoveSpeed) || 180;
                        const currentSpeed = Math.hypot(ball.vx || 0, ball.vy || 0);
                        if (currentSpeed > 0.001) {
                            ball.vx = ball.vx / currentSpeed * targetSpeed;
                            ball.vy = ball.vy / currentSpeed * targetSpeed;
                        }
                    }
                }

                // Statuts
                ball.status.update(dt, world);

                // Multiplicateur de vitesse (dash, freeze)
                const statusMult = ball.status.getSpeedMultiplier();
                if (ball._powerSlowTimer > 0) ball._powerSlowTimer = Math.max(0, ball._powerSlowTimer - dt);
                const powerSlowMult = ball._powerSlowTimer > 0 ? 0.4 : 1;
                if (ball._powerPoisonTimer > 0) {
                    ball._powerPoisonTimer = Math.max(0, ball._powerPoisonTimer - dt);
                    ball._powerPoisonTick = (ball._powerPoisonTick || 0) - dt;
                    if (ball._powerPoisonTick <= 0 && ball.alive) { ball._powerPoisonTick = 0.45; world.damage(ball, null, 1.5, "toxic-mist"); }
                }
                const speedMult = (ball.speedMultiplier ?? 1) * statusMult * powerSlowMult;

                // Physique Vortex uniquement : attraction centrale et dérive tangentielle horaire.
                if (isVortexMap(world.arena.mapStyle) && !ball.status.isStunned()) {
                    const arena = world.arena;
                    const dx = ball.x - arena.vortexCx, dy = ball.y - arena.vortexCy;
                    const dist = Math.hypot(dx, dy) || 1;
                    const nx = dx / dist, ny = dy / dist;
                    let pull = 220;
                    if (dist < 60) pull *= dist / 60;
                    ball.vx -= nx * pull * dt;
                    ball.vy -= ny * pull * dt;
                    ball.vx -= ny * 30 * dt;
                    ball.vy += nx * 30 * dt;
                    this._clampVortexSpeed(ball);
                }

                // Update physique (intégration basique, la sim principale peut override)
                if (!ball.status.isStunned()) {
                    ball.x += ball.vx * dt * speedMult;
                    ball.y += ball.vy * dt * speedMult;
                }

                // Collision avec les limites propres à la carte active.
                const hit = world.arena.resolveBall(ball, dt);
                if (hit) {
                    // Son distinct pour les rebords et les obstacles, avec cooldown anti-saturation.
                    if (window.audioSynth && self.elapsedTime >= (ball._nextSurfaceSoundAt || 0)) {
                        const impactType = hit.obstacle ? 'obstacle' : 'wall';
                        const impactSpeed = Math.hypot(ball.vx || 0, ball.vy || 0);
                        window.audioSynth.playFx(impactType, {
                            volume: Math.min(0.24, 0.075 + impactSpeed / 2200),
                            powerId: 'ball-' + ball.id + '-' + impactType + '-' + Math.floor(self.elapsedTime * 8)
                        });
                        ball._nextSurfaceSoundAt = self.elapsedTime + (impactType === 'obstacle' ? 0.13 : 0.16);
                    }
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
                        if (isVortexMap(world.arena.mapStyle)) {
                            this._clampVortexSpeed(ball);
                            this._clampVortexSpeed(other);
                        } else {
                            this._keepBaseSpeed(ball);
                            this._keepBaseSpeed(other);
                        }

                        // Collision boule-boule : son plus fort si l'impact est rapide.
                        if (window.audioSynth && self.elapsedTime >= (ball._nextBounceSoundAt || 0)) {
                            const impactSpeed = Math.hypot(ball.vx - other.vx, ball.vy - other.vy);
                            window.audioSynth.playFx('collision', {
                                volume: Math.min(0.22, 0.07 + impactSpeed / 2600),
                                powerId: 'balls-' + ball.id + '-' + other.id
                            });
                            ball._nextBounceSoundAt = self.elapsedTime + 0.10;
                        }

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
                if (!ball.status.isStunned() && !(ball._obstacleBoostTimer > 0)) {
                    if (isVortexMap(world.arena.mapStyle)) this._clampVortexSpeed(ball);
                    else if (!isSourceMap(world.arena.mapStyle)) this._keepBaseSpeed(ball);
                }

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
                if (p.trail.length > 18) p.trail.shift();

                // Collisions murs
                const beforeX = p.x, beforeY = p.y;
                const bounds = world.arena.getBounds();
                if (isVortexMap(world.arena.mapStyle)) {
                    const dx = p.x - world.arena.vortexCx, dy = p.y - world.arena.vortexCy;
                    const dist = Math.hypot(dx, dy) || 1;
                    const limit = world.arena.vortexRadius - (p.radius || 0);
                    if (dist > limit) {
                        if (p.bounces > 0) {
                            const nx = dx / dist, ny = dy / dist;
                            const dot = p.vx * nx + p.vy * ny;
                            if (dot > 0) { p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; }
                            p.x = world.arena.vortexCx + nx * limit;
                            p.y = world.arena.vortexCy + ny * limit;
                            p.bounces--;
                        } else {
                            this.projectiles.splice(i, 1);
                            continue;
                        }
                    }
                } else {
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
                }

                // Les obstacles bloquent les projectiles, sauf si le projectile possède encore un rebond.
                // Cela rend le décor tactique sans créer de dégâts cachés à travers les obstacles.
                let blockedByObstacle = false;
                for (const obstacle of (world.arena.obstacles || [])) {
                    const dx = p.x - obstacle.x, dy = p.y - obstacle.y;
                    const minDist = (obstacle.r || 0) + (p.radius || 0);
                    const dist = Math.hypot(dx, dy);
                    if (dist >= minDist || dist < 0.001) continue;
                    const nx = dx / dist, ny = dy / dist;
                    if (p.bounces > 0) {
                        const dot = p.vx * nx + p.vy * ny;
                        if (dot < 0) { p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; }
                        p.x = obstacle.x + nx * minDist;
                        p.y = obstacle.y + ny * minDist;
                        p.bounces--;
                    } else {
                        world.spawnParticle(p.x, p.y, { color: p.color || '#7dd3fc', count: 6, speed: 90, life: 0.22, spread: Math.PI * 2, size: 2 });
                        this.projectiles.splice(i, 1);
                        blockedByObstacle = true;
                    }
                    break;
                }
                if (blockedByObstacle) continue;

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
                                if (isVortexMap(world.arena.mapStyle)) this._clampVortexSpeed(victim);
                                else this._keepBaseSpeed(victim);
                            }
                        }
                        // La bombe à fragmentation libère des éclats rectilignes après l’explosion.
                        if (p.shrapnel) {
                            // État visuel persistant côté pouvoir : l'explosion doit être lisible, pas seulement des particules.
                            if (owner && owner.abilitySlots) {
                                const bombSlot = owner.abilitySlots.find(slot => slot.meta && slot.meta.id === 'bomb_shrapnel');
                                if (bombSlot && bombSlot.data) bombSlot.data.blastFlash = { x: p.x, y: p.y, life: 0.48, maxLife: 0.48 };
                            }
                            for (let shard = 0; shard < 8; shard++) {
                                const angle = shard * Math.PI * 2 / 8;
                                const fragment = {
                                    x: p.x, y: p.y,
                                    vx: Math.cos(angle) * 420, vy: Math.sin(angle) * 420,
                                    radius: 3, life: 0.62, bounces: 0,
                                    ownerId: p.ownerId, color: '#7dd3fc', damage: 4,
                                    type: 'shrapnel-fragment', trail: []
                                };
                                fragment.render = function (ctx, q) {
                                    ctx.save();
                                    ctx.strokeStyle = q.color; ctx.shadowColor = q.color; ctx.shadowBlur = 12;
                                    ctx.lineWidth = 3; ctx.beginPath();
                                    ctx.moveTo(q.x - q.vx * 0.025, q.y - q.vy * 0.025);
                                    ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore();
                                };
                                this.projectiles.push(fragment);
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

            // Vérification de la condition de victoire selon le mode
            let victoryResult = null;
            if (this.activeMode && typeof this.activeMode.checkVictory === 'function') {
                victoryResult = this.activeMode.checkVictory(world, this);
            } else {
                const survivors = world.balls.filter(ball => ball.alive && !ball.isClone);
                if (survivors.length === 1) {
                    const finalSlowMoRemaining = (window.ArenaBattleBridge?.deathSlowMoUntil || 0) - performance.now();
                    if (finalSlowMoRemaining <= 0) {
                        victoryResult = { finished: true, winner: survivors[0], reason: 'Dernière survivante' };
                    }
                }
            }

            if (victoryResult && victoryResult.finished) {
                this.winner = victoryResult.winner;
                console.info('[BallYstik][WINNER]', {
                    time: Number(this.elapsedTime.toFixed(2)),
                    reason: victoryResult.reason,
                    winnerId: this.winner?.id
                });
                this.winnerDisplayActive = true;
                this.winnerDisplayElapsed = 0;
                this.finished = false;
                return;
            }

            // HUD
            this.hud.update(dt, world);

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

            // Rendu de fond propre au mode actif (ex: grille de territoire)
            if (this.activeMode && typeof this.activeMode.renderBackground === 'function') {
                this.activeMode.renderBackground(ctx, world, this);
            }

            // Pickups (sous les balles)
            this.pickupSystem.render(ctx);

            // Boules
            for (const ball of world.balls) {
                if (!ball.alive) continue;
                // Les clones restent des effets de combat, pas des survivants : ne pas les
                // afficher pendant l'écran Winner pour éviter l'impression de deux gagnants.
                if (this.winnerDisplayActive && ball.isClone) continue;
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

            // Rendu d'avant-plan propre au mode actif (ex: murs séparateurs, viseurs)
            if (this.activeMode && typeof this.activeMode.render === 'function') {
                this.activeMode.render(ctx, world, this);
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

            // Bannière affichée pendant la phase de dégâts doublés (50 s jusqu'à la fin du combat).
            if (this.elapsedTime >= 50 && !this.finished && !this.winnerDisplayActive) {
                const arenaTop = world.arena && Number.isFinite(world.arena.frameY)
                    ? world.arena.frameY
                    : ctx.canvas.height * 0.16;
                const centerX = ctx.canvas.width / 2;
                const bannerY = Math.max(42, arenaTop - 34);
                const pulse = 0.88 + 0.12 * Math.sin(this.elapsedTime * 8);
                ctx.save();
                ctx.globalAlpha = pulse;
                ctx.font = '900 30px Outfit, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const textWidth = ctx.measureText('DAMAGE ×2').width;
                const bannerWidth = textWidth + 42;
                ctx.fillStyle = 'rgba(35, 10, 8, 0.92)';
                ctx.strokeStyle = '#ff4d4d';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ff3030';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.roundRect(centerX - bannerWidth / 2, bannerY - 23, bannerWidth, 46, 12);
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#fff';
                ctx.fillText('DAMAGE ×2', centerX, bannerY);
                ctx.restore();
            }

            // Flash de KO dessiné au-dessus de l'arène et des effets, pour qu'il soit réellement visible.
            const slowMoRemaining = (window.ArenaBattleBridge?.deathSlowMoUntil || 0) - performance.now();
            if (slowMoRemaining > 0 && !this.winnerDisplayActive && !this.finished) {
                const finalSlowMo = slowMoRemaining > 500;
                const alpha = Math.min(0.34, (slowMoRemaining / (finalSlowMo ? 1800 : 420)) * (finalSlowMo ? 0.30 : 0.16));
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            }

            // Résultat de manche : boule gagnante agrandie et label lumineux.
            if (this.finished || this.winnerDisplayActive) this._renderWinner(ctx, world);
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

            // Aucun effet visuel n'est ajouté aux boules lors d'un rebond sur un obstacle.
            // La propulsion temporaire reste gérée par _obstacleBoostTimer dans la physique.

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