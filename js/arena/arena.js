/**
 * ARENA — Zone de combat fermée pour le mode Arena Brawl
 * Adapté TikTok : format 9:16 vertical, coins arrondis néon, option shrink
 */
(function () {
    'use strict';

    const PALETTE = {
        floor:     'rgba(9, 12, 24, 0.94)',
        grid:      'rgba(90, 130, 210, 0.07)',
        wall:      'rgba(140, 220, 255, 0.6)',
        wallGlow:  'rgba(0, 242, 254, 0.4)',
        wallCore:  'rgba(255, 255, 255, 0.65)',
        obstacle:  'rgba(18, 14, 40, 0.95)',
        obstacleEdge: 'rgba(160, 120, 255, 0.8)',
        danger:    'rgba(255, 42, 133, 0.65)'
    };

    // Paramètres propres à Vortex Spirale, repris de la carte autonome.
    const VORTEX = {
        radiusFactor: 0.46, attraction: 220, maxSpeed: 460, minSpeed: 90,
        tangentialBias: 30, centerSoftRadius: 60, obstacleRadius: 22,
        wallBounce: 0.7, wallPushBack: 30, spinSign: 1
    };

    class Arena {
        constructor(canvas, options = {}) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            this.padding      = options.padding      ?? 16;
            this.cornerRadius = options.cornerRadius ?? 44;
            this.mapStyle = options.mapStyle || 'neon';
            this.arenaMargins = {
                top: Number(options.arenaTop ?? 0.16),
                bottom: Number(options.arenaBottom ?? 0.10),
                left: Number(options.arenaLeft ?? 0),
                right: Number(options.arenaRight ?? 0.14)
            };
            this.vortexTestGL = null;
            this.vortexTestCanvas = null;
            this.vortexTestProgram = null;
            this.vortexTestUniforms = null;
            this._vortexTestShaderAttempted = false;

            this.time        = 0;
            this.elapsed     = 0;
            this.wallPulse   = 0;
            this.hitFlashes  = [];

            this.shrinkEnabled = !!options.shrink;
            this.shrinkStart   = options.shrinkStart ?? 30;
            this.shrinkRate    = options.shrinkRate  ?? 6;
            this.shrinkMax     = options.shrinkMax   ?? 0.16;
            this.shrinkOffset  = 0;
            this.shrinkMoving = false;
            this.shrinkWarning = 0;
            this.shrinkCycleLength = 2.4;
            this.shrinkWarningLength = 1.6;

            this.obstacles = [];
            this.suckParticles = [];
            this.spinAngle = 0;
            this.vortexRadius = 0;
            this.vortexCx = 0;
            this.vortexCy = 0;
            this.prng = options.prng || null;
            this._recompute();
            this._buildObstacles(options.obstacles ?? 1, options.obstaclePositions);
            if (this._isVortexMap()) {
                // Particules déterministes pour conserver une configuration reproductible.
                for (let i = 0; i < 40; i++) this.suckParticles.push(this._newSuckParticle(i, true));
            }
        }

        _isVortexMap(style = this.mapStyle) {
            return style === 'vortex';
        }

        _recompute() {
            const c = this.canvas;
            if (window.BallYstikSourceMaps?.isSourceMap(this.mapStyle)) {
                this.shrinkEnabled=false;this.shrinkOffset=0;this.frameX=this.x=0;this.frameY=this.y=c.height*.16;this.frameW=this.w=c.width*.86;this.frameH=this.h=c.height*.74;return;
            }
            if (this._isVortexMap()) {
                // La carte Spirale respecte les mêmes marges configurées que l'arène :
                // haut 16 %, bas 10 %, gauche 0 %, droite 14 % par défaut.
                // Le cercle est inscrit dans cette zone pour ne jamais dépasser les murs.
                this.shrinkEnabled = false;
                this.shrinkOffset = 0;
                const top = Math.min(0.9, Math.max(0, this.arenaMargins.top)) * c.height;
                const bottom = Math.min(0.9, Math.max(0, this.arenaMargins.bottom)) * c.height;
                const left = Math.min(0.9, Math.max(0, this.arenaMargins.left)) * c.width;
                const right = Math.min(0.9, Math.max(0, this.arenaMargins.right)) * c.width;
                this.frameX = left;
                this.frameY = top;
                this.frameW = Math.max(60, c.width - left - right);
                this.frameH = Math.max(60, c.height - top - bottom);
                this.vortexCx = this.frameX + this.frameW / 2;
                this.vortexCy = this.frameY + this.frameH / 2;
                // Petite marge de sécurité pour le contour lumineux et les collisions.
                this.vortexRadius = Math.max(1, Math.min(this.frameW, this.frameH) * VORTEX.radiusFactor);
                this.x = this.vortexCx - this.vortexRadius;
                this.y = this.vortexCy - this.vortexRadius;
                this.w = this.vortexRadius * 2;
                this.h = this.vortexRadius * 2;
                return;
            }
            // Le canvas/vidéo garde toujours son format 9:16.
            // Chaque bord de l'arène peut être positionné indépendamment.
            const top = Math.min(0.9, Math.max(0, this.arenaMargins.top)) * c.height;
            const bottom = Math.min(0.9, Math.max(0, this.arenaMargins.bottom)) * c.height;
            const left = Math.min(0.9, Math.max(0, this.arenaMargins.left)) * c.width;
            const right = Math.min(0.9, Math.max(0, this.arenaMargins.right)) * c.width;
            const baseX = left;
            const baseY = top;
            const baseW = Math.max(60, c.width - left - right);
            const baseH = Math.max(60, c.height - top - bottom);
            this.frameX = baseX;
            this.frameY = baseY;
            this.frameW = baseW;
            this.frameH = baseH;

            // Le rétrécissement pousse ensuite chaque mur vers l'intérieur.
            const inset = this.padding + this.shrinkOffset;
            this.x = baseX + inset;
            this.y = baseY + inset;
            this.w = Math.max(60, baseW - inset * 2);
            this.h = Math.max(60, baseH - inset * 2);
        }

        _newSuckParticle(index, initial = false) {
            const seed = ((index + 1) * 0.618033988749895) % 1;
            return {
                angle: seed * Math.PI * 2,
                radius: this.vortexRadius * (0.6 + ((index * 37) % 41) / 100),
                speed: 40 + ((index * 29) % 81),
                life: initial ? ((index * 17) % 20) / 10 : 0,
                maxLife: 2.5 + ((index * 13) % 20) / 10,
                size: 1 + ((index * 7) % 18) / 10,
                hue: index % 2 === 0 ? '#a855f7' : '#e9d5ff'
            };
        }

        _buildObstacles(count, customPositions = null) {
            this.obstacles = [];
            if (window.BallYstikSourceMaps?.isSourceMap(this.mapStyle)) return;
            if (this._isVortexMap()) {
                // Le curseur contrôle le nombre TOTAL d'obstacles, cœur central inclus.
                // 0 désactive donc aussi le cœur central.
                const requested = Math.max(0, Math.min(10, Math.floor(Number(count) || 0)));
                if (requested === 0) return;

                const r = VORTEX.obstacleRadius;
                const spiralArms = 3;
                const pointsPerArm = 3;
                const innerRadius = 0.20;
                const outerRadius = 0.82;
                const spiralPoints = [];
                for (let arm = 0; arm < spiralArms; arm++) {
                    for (let i = 0; i < pointsPerArm; i++) {
                        const progress = (i + 0.35) / pointsPerArm;
                        const radiusFactor = innerRadius + (outerRadius - innerRadius) * progress;
                        const angle = (arm / spiralArms) * Math.PI * 2
                            + progress * Math.PI * 1.65 + Math.PI * 0.12;
                        const x = this.vortexCx + Math.cos(angle) * this.vortexRadius * radiusFactor;
                        const y = this.vortexCy + Math.sin(angle) * this.vortexRadius * radiusFactor;
                        // Keep every bumper fully inside the circular arena.
                        if (Math.hypot(x - this.vortexCx, y - this.vortexCy) + r < this.vortexRadius * 0.91) {
                            spiralPoints.push({
                                x, y, r: r * (i === 1 ? 1.05 : 0.92),
                                hitPulse: 0, baseAngle: angle, orbitRadius: 0, rotateSpeed: 0
                            });
                        }
                    }
                }

                // Le cœur est compté comme un obstacle et apparaît dès que le curseur est > 0.
                this.obstacles.push({
                    x: this.vortexCx, y: this.vortexCy, r: r * 0.62,
                    hitPulse: 0, baseAngle: 0, orbitRadius: 0, rotateSpeed: 0
                });
                this.obstacles.push(...spiralPoints.slice(0, requested - 1));
                return;
            }
            if (['neon_grid', 'volcan', 'nexus', 'cyber_core'].includes(this.mapStyle)) {
                const fx = this.frameX, fy = this.frameY, fw = this.frameW, fh = this.frameH;
                const layouts = {
                    neon_grid: [{x:.28,y:.34,r:24},{x:.72,y:.50,r:27},{x:.32,y:.70,r:24}],
                    volcan: [{x:.30,y:.30,r:27},{x:.68,y:.52,r:24},{x:.34,y:.74,r:27}],
                    nexus: [{x:.30,y:.36,r:23},{x:.70,y:.64,r:23},{x:.50,y:.50,r:27}],
                    cyber_core: [{x:.50,y:.50,r:36},{x:.26,y:.30,r:18},{x:.74,y:.70,r:18},{x:.26,y:.70,r:18},{x:.74,y:.30,r:18}]
                };
                const list = layouts[this.mapStyle] || [];
                const maxItems = list.length;
                list.slice(0, Math.max(0, Math.min(maxItems, Math.floor(Number(count) || maxItems))))
                    .forEach(p => this.obstacles.push({x:fx+fw*p.x,y:fy+fh*p.y,r:p.r}));
                return;
            }
            if (this.mapStyle === 'sanctuaire') {
                const fx = this.frameX, fy = this.frameY, fw = this.frameW, fh = this.frameH;
                const layout = [
                    {x:0.50,y:0.36,r:27},{x:0.50,y:0.64,r:27},
                    {x:0.35,y:0.50,r:22},{x:0.65,y:0.50,r:22},
                    {x:0.28,y:0.28,r:17},{x:0.72,y:0.72,r:17},
                    {x:0.72,y:0.28,r:17},{x:0.28,y:0.72,r:17}
                ];
                const requested = Math.max(0, Math.min(8, Math.floor(Number(count) || 0)));
                layout.slice(0, requested).forEach(p => this.obstacles.push({x:fx+fw*p.x,y:fy+fh*p.y,r:p.r}));
                return;
            }
            if (Array.isArray(customPositions)) {
                customPositions.slice(0, Math.max(0, Math.min(10, Number(count) || 0))).forEach(pos => {
                    if (!pos || !Number.isFinite(Number(pos.x)) || !Number.isFinite(Number(pos.y))) return;
                    this.obstacles.push({ x: Number(pos.x) <= 1 ? Number(pos.x) * this.canvas.width : Number(pos.x), y: Number(pos.y) <= 1 ? Number(pos.y) * this.canvas.height : Number(pos.y), r: 24 });
                });
                return;
            }
            if (count <= 0) return;
            const cx = this.canvas.width / 2;
            const cy = this.canvas.height / 2;
            const r = 24;
            const gap = 110;
            const map = this.mapStyle || 'neon';

            if (map === 'reactor') {
                // Le cœur reste libre pour rendre lisible l'onde radiale.
                if (count === 1) this.obstacles.push({ x: cx + 92, y: cy, r: r + 5 });
                else if (count === 2) {
                    this.obstacles.push({ x: cx - 100, y: cy - 70, r });
                    this.obstacles.push({ x: cx + 100, y: cy + 70, r });
                } else {
                    this.obstacles.push({ x: cx - 105, y: cy - 125, r });
                    this.obstacles.push({ x: cx + 105, y: cy, r: r + 4 });
                    this.obstacles.push({ x: cx - 105, y: cy + 125, r });
                }
            } else if (map === 'crossfire') {
                // Obstacles décalés pour créer des abris partiels sous le faisceau.
                if (count === 1) this.obstacles.push({ x: cx, y: cy - gap, r: r + 5 });
                else if (count === 2) {
                    this.obstacles.push({ x: cx - 85, y: cy, r });
                    this.obstacles.push({ x: cx + 85, y: cy, r });
                } else {
                    this.obstacles.push({ x: cx - 90, y: cy - gap, r });
                    this.obstacles.push({ x: cx + 90, y: cy, r: r + 4 });
                    this.obstacles.push({ x: cx - 90, y: cy + gap, r });
                }
            } else {
                // Sur la carte Défaut, centre l'obstacle au milieu des murs réels
                // de l'arène, même si les marges haut/bas/gauche/droite sont asymétriques.
                if (count === 1) this.obstacles.push({
                    x: this.frameX + this.frameW / 2,
                    y: this.frameY + this.frameH / 2,
                    r: r + 6
                });
                else if (count === 2) {
                    this.obstacles.push({ x: cx, y: cy - gap, r });
                    this.obstacles.push({ x: cx, y: cy + gap, r });
                } else {
                    this.obstacles.push({ x: cx, y: cy - gap, r });
                    this.obstacles.push({ x: cx, y: cy, r: r + 4 });
                    this.obstacles.push({ x: cx, y: cy + gap, r });
                }
            }
            const nextRnd = () => (this.prng ? this.prng.next() : Math.random());
            while (this.obstacles.length < Math.min(10, count)) {
                const candidate = {
                    x: this.padding + 34 + nextRnd() * Math.max(1, this.canvas.width - 2 * (this.padding + 34)),
                    y: this.padding + 34 + nextRnd() * Math.max(1, this.canvas.height - 2 * (this.padding + 34)),
                    r
                };
                if (this.obstacles.every(o => Math.hypot(o.x - candidate.x, o.y - candidate.y) > 66)) this.obstacles.push(candidate);
                else if (this.obstacles.length >= 3 && this.obstacles.length < 10 && nextRnd() < 0.04) this.obstacles.push(candidate);
            }
        }

        update(dt) {
            this.time    += dt;
            this.elapsed += dt;
            this.wallPulse = Math.max(0, this.wallPulse - dt * 3.2);
            for (const obstacle of this.obstacles) obstacle.hitPulse = Math.max(0, (obstacle.hitPulse || 0) - dt * 3.8);

            if (this._isVortexMap()) {
                this.spinAngle += dt * 0.5 * VORTEX.spinSign;
                for (const obstacle of this.obstacles) {
                    if (obstacle.rotateSpeed) {
                        obstacle.baseAngle += obstacle.rotateSpeed * dt;
                        obstacle.x = this.vortexCx + Math.cos(obstacle.baseAngle) * obstacle.orbitRadius;
                        obstacle.y = this.vortexCy + Math.sin(obstacle.baseAngle) * obstacle.orbitRadius;
                    }
                }
                for (let i = 0; i < this.suckParticles.length; i++) {
                    const p = this.suckParticles[i];
                    p.life += dt;
                    p.radius -= p.speed * dt;
                    p.angle += (1.2 + p.speed * 0.005) * VORTEX.spinSign * dt;
                    if (p.radius <= 8 || p.life > p.maxLife) this.suckParticles[i] = this._newSuckParticle(i, false);
                }
                this.shrinkEnabled = false;
                this.shrinkOffset = 0;
                this.shrinkMoving = false;
                this.shrinkWarning = 0;
            } else {
                this.shrinkMoving = false;
            this.shrinkWarning = 0;
            if (this.shrinkEnabled && this.elapsed > this.shrinkStart) {
                // La réduction maximale dépend des dimensions de base choisies,
                // et non de la taille totale du canvas vidéo.
                const maxPx = Math.min(this.frameW, this.frameH) * this.shrinkMax;
                if (this.shrinkOffset < maxPx) {
                    const cycle = (this.elapsed - this.shrinkStart) % this.shrinkCycleLength;
                    if (cycle < this.shrinkWarningLength) {
                        // Avertissement clignotant qui monte progressivement vers le rouge.
                        const progress = cycle / this.shrinkWarningLength;
                        this.shrinkWarning = progress * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.time * 13)));
                    } else {
                        this.shrinkMoving = true;
                        this.shrinkOffset = Math.min(maxPx, this.shrinkOffset + this.shrinkRate * dt * this.shrinkCycleLength / (this.shrinkCycleLength - this.shrinkWarningLength));
                        this._recompute();
                    }
                }
            }

            }
            for (let i = this.hitFlashes.length - 1; i >= 0; i--) {
                const f = this.hitFlashes[i];
                f.life -= dt;
                if (f.life <= 0) this.hitFlashes.splice(i, 1);
            }
        }

        getBounds() {
            return { left: this.x, right: this.x + this.w, top: this.y, bottom: this.y + this.h };
        }

        // Contrat commun des maps : le moteur de pouvoirs n'a pas à connaître leur nom.
        // Une map de forme spéciale peut surcharger ces méthodes pour définir son espace jouable.
        isPointInside(x, y, padding = 0) {
            if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
            if (window.BallYstikSourceMaps?.isSourceMap(this.mapStyle)) return window.BallYstikSourceMaps.isPointInside(this.mapStyle,x,y,this.canvas,this.time,padding);
            if (this._isVortexMap()) {
                const limit = Math.max(0, this.vortexRadius - padding);
                return Math.hypot(x - this.vortexCx, y - this.vortexCy) <= limit;
            }
            return x >= this.x + padding && x <= this.x + this.w - padding
                && y >= this.y + padding && y <= this.y + this.h - padding;
        }

        constrainPoint(x, y, padding = 0) {
            if (window.BallYstikSourceMaps?.isSourceMap(this.mapStyle)) return window.BallYstikSourceMaps.constrainPoint(this.mapStyle,x,y,this.canvas,this.time,padding);
            if (!Number.isFinite(x) || !Number.isFinite(y)) {
                return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
            }
            if (this._isVortexMap()) {
                const dx = x - this.vortexCx, dy = y - this.vortexCy;
                const dist = Math.hypot(dx, dy);
                const limit = Math.max(0, this.vortexRadius - padding);
                if (dist > limit && dist > 0) {
                    return { x: this.vortexCx + dx / dist * limit, y: this.vortexCy + dy / dist * limit };
                }
                return { x, y };
            }
            return {
                x: Math.max(this.x + padding, Math.min(this.x + this.w - padding, x)),
                y: Math.max(this.y + padding, Math.min(this.y + this.h - padding, y))
            };
        }

        isInsideDangerZone(ball) {
            if (window.BallYstikSourceMaps?.isSourceMap(this.mapStyle)) return false;
            if (this._isVortexMap() || !this.shrinkEnabled) return false;
            // La zone dangereuse reste à l'intérieur des murs de l'arène configurée.
            const maxInset = Math.min(this.w, this.h) * this.shrinkMax;
            const safeLeft = this.x + maxInset;
            const safeTop = this.y + maxInset;
            const safeRight = this.x + this.w - maxInset;
            const safeBottom = this.y + this.h - maxInset;
            return ball.x < safeLeft || ball.x > safeRight
                || ball.y < safeTop || ball.y > safeBottom;
        }

        addHitFlash(x, y, life = 0.35) {
            this.hitFlashes.push({ x, y, life, maxLife: life });
        }

        resolveBall(ball, dt = 1 / 60) {
            if (window.BallYstikSourceMaps?.isSourceMap(this.mapStyle)) {
                const hit=window.BallYstikSourceMaps.resolveBall(this.mapStyle,ball,this.canvas,this.time,dt,this);
                if(hit||window.BallYstikSourceMaps.getGeometry(this.mapStyle,this.canvas.width,this.canvas.height,Math.min(window.devicePixelRatio||1,2),this.time))return hit;
            }
            if (this._isVortexMap()) return this._resolveVortexBall(ball, dt);
            const r = Math.max(0, Number(ball.radius) || 0);
            const left = this.x, right = this.x + this.w;
            const top = this.y, bottom = this.y + this.h;
            const corner = Math.min(this.cornerRadius, this.w / 2, this.h / 2);
            // Le centre de la boule doit rester à l'extérieur de ce cercle réduit.
            const arcRadius = Math.max(0, corner - r);
            const minX = left + r, maxX = right - r;
            const minY = top + r, maxY = bottom - r;
            let hit = null;
            let cornerHit = false;

            // Chaque coin ne collisionne que dans son quadrant extérieur.
            // La collision est déclenchée quand le centre de la boule pénètre
            // dans le cercle réduit (et non quand il s'en éloigne).
            if (arcRadius > 0) {
                const corners = [
                    { cx: left + corner,  cy: top + corner,    sx: -1, sy: -1 },
                    { cx: right - corner, cy: top + corner,    sx:  1, sy: -1 },
                    { cx: left + corner,  cy: bottom - corner, sx: -1, sy:  1 },
                    { cx: right - corner, cy: bottom - corner, sx:  1, sy:  1 }
                ];

                for (const c of corners) {
                    const dx = ball.x - c.cx;
                    const dy = ball.y - c.cy;
                    if (dx * c.sx < 0 || dy * c.sy < 0) continue;

                    const d = Math.hypot(dx, dy);

                    // Dans le quadrant extérieur, la zone autorisée est À L'INTÉRIEUR
                    // du cercle réduit. Si le centre est au-delà de l'arc, on le ramène
                    // sur celui-ci. L'ancienne condition inversée bloquait les boules
                    // alors qu'elles étaient encore dans la zone jouable.
                    if (d <= arcRadius) continue;

                    const nx = d > 1e-8 ? dx / d : c.sx * Math.SQRT1_2;
                    const ny = d > 1e-8 ? dy / d : c.sy * Math.SQRT1_2;
                    ball.x = c.cx + nx * arcRadius;
                    ball.y = c.cy + ny * arcRadius;

                    // La normale pointe vers l'extérieur de l'arène :
                    // un produit scalaire positif signifie que la boule va dans le mur.
                    const dot = ball.vx * nx + ball.vy * ny;
                    if (dot > 0) {
                        ball.vx -= 2 * dot * nx;
                        ball.vy -= 2 * dot * ny;
                    }

                    hit = { nx, ny, x: c.cx + nx * corner, y: c.cy + ny * corner };
                    cornerHit = true;
                    break;
                }
            }

            // Côtés droits, seulement entre les points de tangence des arrondis.
            if (!cornerHit) {
                const inVerticalStraight = ball.y >= top + corner && ball.y <= bottom - corner;
                const inHorizontalStraight = ball.x >= left + corner && ball.x <= right - corner;

                if (inVerticalStraight && ball.x < minX) {
                    ball.x = minX;
                    if (ball.vx < 0) ball.vx = Math.abs(ball.vx);
                    hit = { nx: 1, ny: 0, x: left, y: ball.y };
                } else if (inVerticalStraight && ball.x > maxX) {
                    ball.x = maxX;
                    if (ball.vx > 0) ball.vx = -Math.abs(ball.vx);
                    hit = { nx: -1, ny: 0, x: right, y: ball.y };
                }

                if (inHorizontalStraight && ball.y < minY) {
                    ball.y = minY;
                    if (ball.vy < 0) ball.vy = Math.abs(ball.vy);
                    hit = { nx: 0, ny: 1, x: ball.x, y: top };
                } else if (inHorizontalStraight && ball.y > maxY) {
                    ball.y = maxY;
                    if (ball.vy > 0) ball.vy = -Math.abs(ball.vy);
                    hit = { nx: 0, ny: -1, x: ball.x, y: bottom };
                }
            }

            // Sécurité pour les changements de taille de l'arène et les dépassements.
            // Ne s'applique pas aux coins déjà résolus par l'arc de cercle.
            if (!cornerHit && (ball.x < minX || ball.x > maxX || ball.y < minY || ball.y > maxY)) {
                const oldX = ball.x, oldY = ball.y;
                ball.x = Math.max(minX, Math.min(maxX, ball.x));
                ball.y = Math.max(minY, Math.min(maxY, ball.y));
                if (!hit) {
                    if (ball.x !== oldX) hit = { nx: oldX < minX ? 1 : -1, ny: 0, x: oldX < minX ? left : right, y: ball.y };
                    else hit = { nx: 0, ny: oldY < minY ? 1 : -1, x: ball.x, y: oldY < minY ? top : bottom };
                }
                if (ball.x === minX && ball.vx < 0) ball.vx = Math.abs(ball.vx);
                if (ball.x === maxX && ball.vx > 0) ball.vx = -Math.abs(ball.vx);
                if (ball.y === minY && ball.vy < 0) ball.vy = Math.abs(ball.vy);
                if (ball.y === maxY && ball.vy > 0) ball.vy = -Math.abs(ball.vy);
            }

            // Obstacles circulaires.
            for (const o of this.obstacles) {
                const dx = ball.x - o.x, dy = ball.y - o.y;
                const minD = o.r + r, d = Math.hypot(dx, dy);
                if (d < minD && d > 0) {
                    const nx = dx / d, ny = dy / d;
                    const overlap = minD - d;
                    ball.x += nx * overlap;
                    ball.y += ny * overlap;
                    const dot = ball.vx * nx + ball.vy * ny;
                    if (dot < 0) {
                        // Rebond amorti : l'obstacle change la direction, pas la vitesse.
                        // La vitesse de base est réappliquée par ArenaBattle après la collision,
                        // ce qui évite les catapultages et garde les boules dans le champ.
                        const restitution = 0.90; // léger supplément de rebond, sans accélération brutale
                        ball.vx -= (1 + restitution) * dot * nx;
                        ball.vy -= (1 + restitution) * dot * ny;
                        o.hitPulse = 0.55;
                        hit = { nx, ny, x: o.x + nx * o.r, y: o.y + ny * o.r, obstacle: true };
                    }
                }
            }

            // Filet final anti-fuite après les collisions d'obstacles.
            ball.x = Math.max(minX, Math.min(maxX, ball.x));
            ball.y = Math.max(minY, Math.min(maxY, ball.y));

            if (hit) {
                this.wallPulse = 1;
                this.hitFlashes.push({ x: hit.x, y: hit.y, life: 0.35, maxLife: 0.35 });
            }
            return hit;
        }


        _resolveVortexBall(ball, dt) {
            const r = Math.max(0, Number(ball.radius) || 0);
            const dx = ball.x - this.vortexCx, dy = ball.y - this.vortexCy;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = dx / dist, ny = dy / dist;
            const limit = Math.max(1, this.vortexRadius - r);
            let hit = null;

            // Mur circulaire avec rebond amorti.
            if (dist >= limit) {
                ball.x = this.vortexCx + nx * limit;
                ball.y = this.vortexCy + ny * limit;
                const radial = ball.vx * nx + ball.vy * ny;
                const tx = ball.vx - radial * nx, ty = ball.vy - radial * ny;
                if (radial > 0) {
                    ball.vx = tx - radial * VORTEX.wallBounce * nx;
                    ball.vy = ty - radial * VORTEX.wallBounce * ny;
                } else {
                    ball.vx = tx + radial * nx;
                    ball.vy = ty + radial * ny;
                }
                ball.vx -= nx * VORTEX.wallPushBack * dt;
                ball.vy -= ny * VORTEX.wallPushBack * dt;
                hit = { nx: -nx, ny: -ny, x: this.vortexCx + nx * this.vortexRadius, y: this.vortexCy + ny * this.vortexRadius };
            }

            // Les obstacles orbitaux restent propres à cette carte.
            for (const o of this.obstacles) {
                const ox = ball.x - o.x, oy = ball.y - o.y;
                const od = Math.hypot(ox, oy) || 1, minD = o.r + r;
                if (od >= minD) continue;
                const onx = ox / od, ony = oy / od;
                const overlap = minD - od;
                ball.x += onx * overlap;
                ball.y += ony * overlap;
                const obstacleVx = -Math.sin(o.baseAngle || 0) * (o.rotateSpeed || 0) * (o.orbitRadius || 0);
                const obstacleVy = Math.cos(o.baseAngle || 0) * (o.rotateSpeed || 0) * (o.orbitRadius || 0);
                const relNormal = (ball.vx - obstacleVx) * onx + (ball.vy - obstacleVy) * ony;
                if (relNormal < 0) {
                    // Les obstacles orbitaux transmettent une impulsion amortie,
                    // sans catapulter la boule hors de la petite arène.
                    const restitution = 0.82; // rebond orbital un peu plus marqué, toujours amorti
                    ball.vx -= (1 + restitution) * relNormal * onx;
                    ball.vy -= (1 + restitution) * relNormal * ony;
                }
                o.hitPulse = 1;
                hit = { nx: onx, ny: ony, x: o.x + onx * o.r, y: o.y + ony * o.r, obstacle: true };
            }
            if (hit) {
                this.wallPulse = 1;
                this.hitFlashes.push({ x: hit.x, y: hit.y, life: 0.35, maxLife: 0.35 });
            }
            return hit;
        }

        _renderVortex(ctx) {
            const cx = this.vortexCx, cy = this.vortexCy, R = this.vortexRadius, t = this.time;
            ctx.fillStyle = '#080611';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
            bg.addColorStop(0, '#2a0e4d'); bg.addColorStop(0.5, '#1a0832'); bg.addColorStop(1, '#0c0518');
            ctx.fillStyle = bg;
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

            ctx.save();
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
            for (let arm = 0; arm < 6; arm++) {
                const base = arm / 6 * Math.PI * 2 + this.spinAngle * 0.6;
                ctx.beginPath();
                for (let i = 0; i <= 40; i++) {
                    const p = i / 40, rr = p * R * 0.98, a = base + p * Math.PI * 1.8 * VORTEX.spinSign;
                    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = 'rgba(168, 85, 247, ' + (0.10 + 0.05 * Math.sin(t + arm)) + ')';
                ctx.lineWidth = 8; ctx.stroke();
            }
            for (let ring = 1; ring <= 5; ring++) {
                const rr = ring / 5 * R * 0.95;
                ctx.save(); ctx.translate(cx, cy);
                ctx.rotate(this.spinAngle * (ring % 2 === 0 ? 0.3 : -0.3));
                ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(192, 132, 252, ' + (0.06 + 0.04 * ring / 5) + ')';
                ctx.lineWidth = 1; ctx.setLineDash([6, 12]); ctx.stroke(); ctx.setLineDash([]);
                ctx.restore();
            }
            const pulse = 0.85 + 0.15 * Math.sin(t * 2.4);
            const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.35);
            core.addColorStop(0, 'rgba(233, 213, 255, ' + (0.95 * pulse) + ')');
            core.addColorStop(0.25, 'rgba(168, 85, 247, ' + (0.65 * pulse) + ')');
            core.addColorStop(0.6, 'rgba(88, 28, 135, ' + (0.25 * pulse) + ')');
            core.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = core; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.beginPath(); ctx.arc(cx, cy, 6 + 2 * Math.sin(t * 4), 0, Math.PI * 2);
            ctx.fillStyle = '#f3e8ff'; ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 30; ctx.fill(); ctx.shadowBlur = 0;

            for (const p of this.suckParticles) {
                const fade = Math.min(p.life / 0.6, 1) * (1 - Math.min(p.life / p.maxLife, 1));
                if (fade <= 0.05) continue;
                ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = p.hue; ctx.shadowColor = p.hue; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.arc(cx + Math.cos(p.angle) * p.radius, cy + Math.sin(p.angle) * p.radius, p.size, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
            ctx.restore();

            const borderPulse = 0.85 + 0.15 * Math.sin(t * 1.6);
            ctx.save(); ctx.strokeStyle = 'rgba(192, 132, 252, ' + (0.6 * borderPulse) + ')'; ctx.lineWidth = 3;
            ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 26 * borderPulse;
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx, cy, R - 1, 0, Math.PI * 2); ctx.stroke(); ctx.restore();

            for (const o of this.obstacles) {
                const pulse = o.hitPulse || 0, beat = 0.5 + 0.5 * Math.sin(t * 3 + (o.baseAngle || 0) * 3);
                ctx.save(); ctx.globalAlpha = 0.55 + pulse * 0.45;
                ctx.shadowColor = pulse > 0 ? '#f3e8ff' : '#a855f7'; ctx.shadowBlur = 18 + pulse * 22 + beat * 5;
                ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 3 + pulse * 5 + beat * 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = pulse > 0 ? '#f3e8ff' : 'rgba(168,85,247,0.6)'; ctx.lineWidth = 2 + pulse * 2.5; ctx.stroke();
                ctx.globalAlpha = 1;
                const grad = ctx.createRadialGradient(o.x - o.r * 0.4, o.y - o.r * 0.4, 1, o.x, o.y, o.r);
                grad.addColorStop(0, pulse > 0 ? '#f3e8ff' : '#4c1d95'); grad.addColorStop(0.7, '#2a0e4d'); grad.addColorStop(1, '#1a0832');
                ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = pulse > 0 ? '#ffffff' : '#c084fc'; ctx.lineWidth = 1.8 + pulse * 2; ctx.stroke();
                ctx.fillStyle = pulse > 0 ? '#fff7ae' : '#a855f7'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8 + pulse * 20 + beat * 3;
                ctx.beginPath(); ctx.arc(o.x, o.y, 3 + beat * 1.5 + pulse * 4, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
            for (const f of this.hitFlashes) {
                const fade = f.life / f.maxLife;
                ctx.save(); ctx.globalAlpha = fade; ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 24;
                ctx.beginPath(); ctx.arc(f.x, f.y, 6 + (1 - fade) * 14, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(233,213,255,0.85)'; ctx.fill(); ctx.restore();
            }
        }

        render(ctx) {
            if (window.BallYstikSourceMaps?.isSourceMap(this.mapStyle)) {
                if(window.BallYstikSourceMaps.render(this.mapStyle,ctx,this.canvas.width,this.canvas.height,Math.min(window.devicePixelRatio||1,2),this.time))return;
            }
            if (this._isVortexMap()) {
                this._renderVortex(ctx);
                return;
            }
            const { x, y, w, h, cornerRadius } = this;
            const frameX = this.frameX ?? x;
            const frameY = this.frameY ?? y;
            const frameW = this.frameW ?? w;
            const frameH = this.frameH ?? h;

            // Le fond, la grille et les éléments de la map restent immobiles.
            ctx.save();
            this._roundRectPath(ctx, frameX, frameY, frameW, frameH, cornerRadius);
            ctx.fillStyle = PALETTE.floor;
            ctx.fill();

            ctx.clip();
            ctx.strokeStyle = PALETTE.grid;
            ctx.lineWidth = 1;
            const grid = 40;
            for (let gx = frameX; gx < frameX + frameW; gx += grid) {
                ctx.beginPath(); ctx.moveTo(gx, frameY); ctx.lineTo(gx, frameY + frameH); ctx.stroke();
            }
            for (let gy = frameY; gy < frameY + frameH; gy += grid) {
                ctx.beginPath(); ctx.moveTo(frameX, gy); ctx.lineTo(frameX + frameW, gy); ctx.stroke();
            }
            ctx.restore();

            // Décor et signaux de danger propres à chaque carte.
            ctx.save();
            this._roundRectPath(ctx, frameX, frameY, frameW, frameH, cornerRadius);
            ctx.clip();
            if (this.mapStyle === 'reactor') {
                const phase = this.time % 4.2;
                const cx = frameX + frameW / 2, cy = frameY + frameH / 2;
                const radius = phase < 1.25 ? 22 + phase * 9 : Math.min(frameW, frameH) * 0.47 * Math.max(0, Math.min(1, (phase - 1.25) / 1.1));
                ctx.globalAlpha = phase < 1.25 ? 0.25 + phase * 0.34 : phase < 2.35 ? 0.9 : 0.2;
                ctx.strokeStyle = phase < 1.25 ? '#fb923c' : '#ff2a85';
                ctx.lineWidth = phase < 1.25 ? 2 + phase : 4;
                ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 20;
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.time * 5);
                ctx.fillStyle = '#fb923c';
                ctx.beginPath(); ctx.arc(cx, cy, 9 + 4 * Math.sin(this.time * 6), 0, Math.PI * 2); ctx.fill();
            } else if (this.mapStyle === 'crossfire') {
                const phase = this.time % 4.0;
                const laneY = frameY + frameH * (0.18 + 0.64 * Math.min(phase / 2.8, 1));
                const firing = phase >= 2.8 && phase <= 3.45;
                ctx.globalAlpha = firing ? 0.95 : phase < 2.8 ? 0.18 + phase * 0.15 : Math.max(0, 0.5 * (4.0 - phase));
                ctx.strokeStyle = firing ? '#ff2a85' : '#fbbf24';
                ctx.lineWidth = firing ? 9 : 2;
                ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = firing ? 28 : 8;
                ctx.setLineDash(phase < 2.8 ? [10, 10] : []);
                ctx.beginPath(); ctx.moveTo(x, laneY); ctx.lineTo(x + w, laneY); ctx.stroke();
                ctx.setLineDash([]);
            } else if (this.mapStyle === 'neon_grid') {
                const pulse = 0.5 + 0.5 * Math.sin(this.time * 3.2);
                const glow = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
                glow.addColorStop(0, 'rgba(0,242,254,0.08)'); glow.addColorStop(0.5, 'rgba(24,36,86,0.02)'); glow.addColorStop(1, 'rgba(255,45,214,0.10)');
                ctx.fillStyle = glow; ctx.fillRect(frameX, frameY, frameW, frameH);
                // Perspective floor grid with luminous intersections.
                ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#126b91'; ctx.lineWidth = 1;
                for (let i = 0; i <= 12; i++) {
                    const yy = frameY + frameH * i / 12;
                    ctx.globalAlpha = 0.12 + i / 12 * 0.24;
                    ctx.beginPath(); ctx.moveTo(frameX, yy); ctx.lineTo(frameX + frameW, yy); ctx.stroke();
                }
                for (let i = 0; i <= 8; i++) {
                    const xx = frameX + frameW * i / 8;
                    ctx.globalAlpha = 0.16;
                    ctx.beginPath(); ctx.moveTo(frameX + frameW * 0.5, frameY + frameH * 0.48); ctx.lineTo(xx, frameY + frameH); ctx.stroke();
                }
                ctx.restore();
                // Circuit rails, corner brackets and animated scanline.
                ctx.save(); ctx.globalAlpha = 0.45 + pulse * 0.25; ctx.strokeStyle = '#ff3df2'; ctx.lineWidth = 2;
                ctx.shadowColor = '#ff3df2'; ctx.shadowBlur = 15;
                for (let side = 0; side < 2; side++) {
                    const xx = frameX + frameW * (side ? 0.94 : 0.06);
                    ctx.beginPath(); ctx.moveTo(xx, frameY + frameH * 0.13); ctx.lineTo(xx, frameY + frameH * 0.26);
                    ctx.lineTo(xx + (side ? -1 : 1) * frameW * 0.055, frameY + frameH * 0.30);
                    ctx.lineTo(xx + (side ? -1 : 1) * frameW * 0.055, frameY + frameH * 0.42); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(xx, frameY + frameH * 0.60); ctx.lineTo(xx, frameY + frameH * 0.75);
                    ctx.lineTo(xx + (side ? -1 : 1) * frameW * 0.04, frameY + frameH * 0.79); ctx.stroke();
                }
                const scanY = frameY + frameH * (0.18 + 0.64 * (0.5 + 0.5 * Math.sin(this.time * 0.7)));
                const scan = ctx.createLinearGradient(frameX, scanY - 18, frameX, scanY + 18);
                scan.addColorStop(0, 'rgba(255,61,242,0)'); scan.addColorStop(0.5, 'rgba(255,61,242,0.18)'); scan.addColorStop(1, 'rgba(255,61,242,0)');
                ctx.fillStyle = scan; ctx.fillRect(frameX, scanY - 18, frameW, 36);
                ctx.strokeStyle = '#00f2fe'; ctx.globalAlpha = 0.9; ctx.lineWidth = 2; ctx.shadowColor = '#00f2fe'; ctx.shadowBlur = 15;
                this._roundRectPath(ctx, frameX + 5, frameY + 5, frameW - 10, frameH - 10, Math.max(8, cornerRadius - 8)); ctx.stroke();
                // Small luminous data ticks along the inner frame.
                for (let i = 0; i < 12; i++) {
                    const yy = frameY + frameH * (0.12 + i * 0.069);
                    ctx.globalAlpha = i % 3 === 0 ? 0.8 : 0.32;
                    ctx.beginPath(); ctx.moveTo(frameX + 8, yy); ctx.lineTo(frameX + (i % 3 === 0 ? 23 : 14), yy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(frameX + frameW - 8, yy); ctx.lineTo(frameX + frameW - (i % 3 === 0 ? 23 : 14), yy); ctx.stroke();
                }
                ctx.restore();
            } else if (this.mapStyle === 'volcan') {
                const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.5);
                const x = frameX + frameW * (0.5 + 0.13 * Math.sin(this.time * 0.35));
                const fissure = [[0.48,0.10],[0.57,0.19],[0.43,0.28],[0.54,0.38],[0.40,0.49],[0.51,0.59],[0.44,0.71],[0.55,0.82],[0.49,0.93]];
                // Basalt plates, beveled edges and scattered magma seams.
                ctx.save();
                for (let i = 0; i < 18; i++) {
                    const side = i % 2 ? 1 : -1, yy = frameY + frameH * (0.08 + (i % 9) * 0.105);
                    const xx = frameX + frameW * (i % 2 ? 0.82 : 0.18);
                    ctx.globalAlpha = 0.2 + (i % 3) * 0.05;
                    ctx.fillStyle = i % 2 ? '#311a25' : '#241622';
                    ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + side * frameW * 0.10, yy + frameH * 0.025);
                    ctx.lineTo(xx + side * frameW * 0.07, yy + frameH * 0.07); ctx.lineTo(xx - side * frameW * 0.02, yy + frameH * 0.055); ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 1; ctx.stroke();
                }
                // A broad molten crack with hot core and dark crust.
                ctx.beginPath();
                fissure.forEach(([px,py],i)=>{const xx=frameX+frameW*px + (x-(frameX+frameW*.5))*0.25, yy=frameY+frameH*py;if(!i)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);});
                ctx.lineJoin = 'round'; ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 18; ctx.shadowBlur = 0; ctx.stroke();
                ctx.globalAlpha = 0.6 + pulse * 0.25; ctx.strokeStyle = '#f97316'; ctx.lineWidth = 9; ctx.shadowColor = '#f97316'; ctx.shadowBlur = 22; ctx.stroke();
                ctx.globalAlpha = 0.65 + pulse * 0.3; ctx.strokeStyle = '#fff1a6'; ctx.lineWidth = 2.5; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 14; ctx.stroke();
                // Side vents glow like furnace grates.
                for (let side = 0; side < 2; side++) {
                    const vx = frameX + frameW * (side ? 0.87 : 0.13);
                    for (let j = 0; j < 4; j++) {
                        const vy = frameY + frameH * (0.22 + j * 0.19);
                        ctx.globalAlpha = 0.35 + pulse * 0.35; ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2; ctx.shadowBlur = 10;
                        ctx.beginPath(); ctx.moveTo(vx - 7, vy - 9); ctx.lineTo(vx + 7, vy - 9); ctx.lineTo(vx + 4, vy + 9); ctx.lineTo(vx - 4, vy + 9); ctx.closePath(); ctx.stroke();
                    }
                }
                // Floating sparks are decorative only; they do not affect physics.
                for (let i = 0; i < 22; i++) {
                    const seed = i * 12.9898;
                    const px = frameX + frameW * (0.12 + ((Math.sin(seed) + 1) * 0.5) * 0.76);
                    const py = frameY + frameH * (0.08 + ((Math.sin(seed * 2.1 + this.time * (0.35 + (i % 4) * 0.08)) + 1) * 0.5) * 0.84);
                    ctx.globalAlpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(this.time * 4 + i));
                    ctx.fillStyle = i % 4 === 0 ? '#fff1a6' : '#fb923c'; ctx.shadowColor = '#f97316'; ctx.shadowBlur = 8;
                    ctx.beginPath(); ctx.arc(px, py, i % 5 === 0 ? 2.2 : 1.2, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();
            } else if (this.mapStyle === 'nexus') {
                // Dim starfield and orbital traces add depth without filling the play space.
                ctx.save();
                for (let i = 0; i < 46; i++) {
                    const seed = i * 78.233;
                    const px = frameX + frameW * (0.05 + ((Math.sin(seed) + 1) * 0.5) * 0.90);
                    const py = frameY + frameH * (0.04 + ((Math.sin(seed * 1.71) + 1) * 0.5) * 0.92);
                    const twinkle = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(this.time * 1.8 + seed));
                    ctx.globalAlpha = twinkle; ctx.fillStyle = i % 3 === 0 ? '#c4b5fd' : '#67e8f9';
                    ctx.beginPath(); ctx.arc(px, py, i % 9 === 0 ? 1.8 : 0.8, 0, Math.PI * 2); ctx.fill();
                }
                // Fine orbital ellipses frame the arena diagonally.
                ctx.globalAlpha = 0.25; ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5; ctx.shadowColor = '#8b5cf6'; ctx.shadowBlur = 12;
                ctx.beginPath(); ctx.ellipse(frameX + frameW * 0.5, frameY + frameH * 0.5, frameW * 0.43, frameH * 0.17, -0.72, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.ellipse(frameX + frameW * 0.5, frameY + frameH * 0.5, frameW * 0.43, frameH * 0.17, 0.72, 0, Math.PI * 2); ctx.stroke();
                for (let i = 0; i < 2; i++) {
                    const px = frameX + frameW * (i === 0 ? 0.25 : 0.75);
                    const py = frameY + frameH * (i === 0 ? 0.24 : 0.78);
                    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.8 + i);
                    const color = i === 0 ? '#00f2fe' : '#c084fc';
                    ctx.save(); ctx.translate(px, py); ctx.rotate(this.time * (i ? -0.4 : 0.4));
                    ctx.globalAlpha = 0.42 + pulse * 0.38; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 20;
                    for (let ring = 0; ring < 4; ring++) {
                        ctx.beginPath(); ctx.ellipse(0, 0, 13 + ring * 8 + pulse * 3, 20 + ring * 10 + pulse * 4, 0, 0, Math.PI * 2); ctx.lineWidth = ring === 0 ? 2.5 : 1.2; ctx.stroke();
                    }
                    ctx.globalAlpha = 0.9; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 3 + pulse * 2, 0, Math.PI * 2); ctx.fill();
                    for (let n = 0; n < 4; n++) {
                        const a = n * Math.PI / 2 + this.time * (i ? -0.7 : 0.7), rr = 31 + pulse * 4;
                        ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 1.8, 0, Math.PI * 2); ctx.fill();
                    }
                    ctx.restore();
                }
                // A faint central star, deliberately behind the moving balls.
                const cx = frameX + frameW / 2, cy = frameY + frameH / 2;
                const core = ctx.createRadialGradient(cx, cy, 2, cx, cy, frameW * 0.32);
                core.addColorStop(0, 'rgba(0,242,254,0.11)'); core.addColorStop(0.5, 'rgba(139,92,246,0.06)'); core.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = core; ctx.fillRect(frameX, frameY, frameW, frameH);
                ctx.restore();
            } else if (this.mapStyle === 'sanctuaire') {
                const cx = frameX + frameW / 2, cy = frameY + frameH / 2;
                const pulse = 0.82 + 0.18 * Math.sin(this.time * 2.2);
                // Pavés sombres, gravures et fissures d'énergie : tout est clippé à l'arène.
                ctx.fillStyle = 'rgba(20, 24, 52, 0.36)';
                const tile = Math.max(18, Math.min(30, frameW / 12));
                for (let yy = frameY + 8; yy < frameY + frameH; yy += tile) {
                    for (let xx = frameX + 8; xx < frameX + frameW; xx += tile) {
                        ctx.strokeStyle = 'rgba(115, 133, 190, 0.12)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(xx, yy, tile - 2, tile - 2);
                    }
                }
                // Courants d'énergie bleue et violette.
                for (let k = 0; k < 4; k++) {
                    const yy = frameY + frameH * (0.18 + k * 0.21);
                    ctx.beginPath();
                    for (let i = 0; i <= 24; i++) {
                        const p = i / 24, xx = frameX + p * frameW;
                        const py = yy + Math.sin(p * Math.PI * 3 + k * 1.7 + this.time * 0.18) * frameH * 0.025;
                        if (!i) ctx.moveTo(xx, py); else ctx.lineTo(xx, py);
                    }
                    ctx.strokeStyle = k % 2 ? 'rgba(168,85,247,0.38)' : 'rgba(0,190,255,0.34)';
                    ctx.lineWidth = 5; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0;
                }
                // Sigil central doré.
                ctx.save(); ctx.translate(cx, cy);
                ctx.strokeStyle = 'rgba(255,190,70,' + (0.7 * pulse) + ')'; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 18;
                [0.08,0.13,0.18].forEach((f,i) => { ctx.beginPath(); ctx.arc(0,0,Math.min(frameW,frameH)*f,0,Math.PI*2); ctx.lineWidth=i===1?3:1.5; ctx.stroke(); });
                ctx.rotate(this.time * 0.12);
                ctx.beginPath(); for(let i=0;i<8;i++){const a=i*Math.PI/4,r=Math.min(frameW,frameH)*(i%2?0.09:0.16);if(!i)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);} ctx.closePath();ctx.stroke();
                ctx.fillStyle = '#ffd166'; ctx.shadowBlur = 22; ctx.beginPath();ctx.arc(0,0,4+2*pulse,0,Math.PI*2);ctx.fill();ctx.restore();
                // Portails visuels aux quatre coins internes.
                const portals = [[0.17,0.18,'#a855f7'],[0.83,0.18,'#a855f7'],[0.17,0.82,'#00d9ff'],[0.83,0.82,'#00d9ff']];
                portals.forEach(([px,py,color],i) => {
                    const x=frameX+frameW*px,y=frameY+frameH*py,rot=this.time*(i%2?-.45:.45);
                    ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=18;
                    for(let n=0;n<3;n++){ctx.beginPath();ctx.ellipse(0,0,9+n*5,13+n*5,0,0,Math.PI*2);ctx.globalAlpha=.72-n*.14;ctx.lineWidth=2;ctx.stroke();}
                    ctx.globalAlpha=1;ctx.fillStyle='rgba(5,10,30,.8)';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.restore();
                });
                // Zones de pics : chevrons bleus clairement visibles, en dehors du centre.
                const spikeZones=[[.25,.34],[.75,.66]];
                spikeZones.forEach(([px,py],zone)=>{
                    const active=Math.sin(this.time*2.4+zone*Math.PI)>.35;
                    ctx.save();ctx.translate(frameX+frameW*px,frameY+frameH*py);
                    ctx.globalAlpha=active?.95:.34;ctx.fillStyle=active?'#67e8f9':'#164e63';ctx.strokeStyle='#a5f3fc';ctx.shadowColor='#22d3ee';ctx.shadowBlur=active?16:4;
                    for(let n=0;n<4;n++){const ox=(n-1.5)*8;ctx.beginPath();ctx.moveTo(ox,-11);ctx.lineTo(ox+5,7);ctx.lineTo(ox-5,7);ctx.closePath();ctx.fill();ctx.stroke();}
                    ctx.restore();
                });
            } else if (this.mapStyle === 'cyber_core') {
                const cx = frameX + frameW / 2, cy = frameY + frameH / 2;
                const rot = this.time * 0.8;
                const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
                ctx.save();
                ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
                ctx.lineWidth = 1.2;
                for (let r = 50; r <= 220; r += 45) {
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const a = rot * 0.2 + (i * Math.PI / 3);
                        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
                        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
                ctx.strokeStyle = '#00f2fe';
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#00f2fe';
                ctx.shadowBlur = 20;
                ctx.globalAlpha = 0.6 + pulse * 0.4;
                for (let i = 0; i < 4; i++) {
                    const a = rot + (i * Math.PI / 2);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + Math.cos(a) * 85, cy + Math.sin(a) * 85);
                    ctx.stroke();
                }
                ctx.strokeStyle = '#ff007f';
                ctx.shadowColor = '#ff007f';
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(cx, cy, 38 + pulse * 6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();

            ctx.save();
            this._roundRectPath(ctx, x, y, w, h, cornerRadius);
            const pulse = 1 + this.wallPulse * 0.6;
            const dangerMix = this.shrinkMoving ? 1 : this.shrinkWarning;
            const wallColor = dangerMix > 0 ? `rgba(${Math.round(140 + 115 * dangerMix)}, ${Math.round(220 - 178 * dangerMix)}, ${Math.round(255 - 122 * dangerMix)}, 0.85)` : PALETTE.wall;
            const glowColor = dangerMix > 0 ? `rgba(255, 42, 42, ${0.25 + 0.55 * dangerMix})` : PALETTE.wallGlow;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur  = (22 + 12 * dangerMix) * pulse;
            ctx.strokeStyle = wallColor;
            ctx.lineWidth   = (2.4 + 1.2 * dangerMix) * pulse;
            ctx.stroke();
            ctx.shadowBlur  = 0;
            ctx.strokeStyle = PALETTE.wallCore;
            ctx.lineWidth   = 1;
            ctx.stroke();
            ctx.restore();

            for (const o of this.obstacles) {
                const pulse = o.hitPulse || 0;
                const beat = 0.5 + 0.5 * Math.sin(this.time * 5 + o.x * 0.03);
                const style = this.mapStyle;
                const color = style === 'volcan' ? '#fb923c' : style === 'nexus' ? '#67e8f9' : '#00f2fe';
                ctx.save();
                // Impact halo remains tied to the actual circular collision hitbox.
                ctx.globalAlpha = 0.48 + pulse * 0.52;
                ctx.shadowColor = pulse > 0 ? '#fff7ae' : color;
                ctx.shadowBlur = 14 + pulse * 30 + beat * 6;
                ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 4 + pulse * 7 + beat * 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = pulse > 0 ? '#fff7ae' : color; ctx.lineWidth = 2 + pulse * 2.5; ctx.stroke();
                ctx.globalAlpha = 1;
                if (style === 'volcan') {
                    // Faceted basalt boulder with molten cracks; hitbox remains circular.
                    const grad = ctx.createRadialGradient(o.x - o.r * .32, o.y - o.r * .4, 1, o.x, o.y, o.r * 1.2);
                    grad.addColorStop(0, '#7c4533'); grad.addColorStop(.55, '#3b252b'); grad.addColorStop(1, '#160f1b');
                    ctx.fillStyle = grad; ctx.beginPath();
                    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 9; const rr = o.r * (i % 2 ? .84 : 1); const px = o.x + Math.cos(a) * rr, py = o.y + Math.sin(a) * rr; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
                    ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#a33b20'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.strokeStyle = '#fb923c'; ctx.shadowColor = '#f97316'; ctx.shadowBlur = 10;
                    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(o.x - o.r * .55, o.y - o.r * .08); ctx.lineTo(o.x - o.r * .12, o.y + o.r * .12); ctx.lineTo(o.x + o.r * .02, o.y - o.r * .30); ctx.lineTo(o.x + o.r * .42, o.y - o.r * .46); ctx.stroke();
                    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(o.x - o.r * .08, o.y + o.r * .12); ctx.lineTo(o.x + o.r * .28, o.y + o.r * .5); ctx.stroke();
                } else if (style === 'nexus') {
                    // Crystalline portal anchor: layered hexagonal facets.
                    const grad = ctx.createRadialGradient(o.x - o.r * .35, o.y - o.r * .4, 1, o.x, o.y, o.r * 1.2);
                    grad.addColorStop(0, '#dbeafe'); grad.addColorStop(.22, '#2563eb'); grad.addColorStop(.65, '#312e81'); grad.addColorStop(1, '#0b1028');
                    ctx.fillStyle = grad; ctx.beginPath();
                    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; const px = o.x + Math.cos(a) * o.r * .94, py = o.y + Math.sin(a) * o.r * .94; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
                    ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#a5f3fc'; ctx.lineWidth = 1.8; ctx.stroke();
                    ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(o.x, o.y - o.r * .72); ctx.lineTo(o.x + o.r * .48, o.y); ctx.lineTo(o.x, o.y + o.r * .72); ctx.lineTo(o.x - o.r * .48, o.y); ctx.closePath(); ctx.stroke();
                    ctx.fillStyle = '#e0f2fe'; ctx.shadowColor = '#67e8f9'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(o.x, o.y, 4 + beat * 2 + pulse * 4, 0, Math.PI * 2); ctx.fill();
                } else {
                    // Neon Grid bumper: beveled octagonal shell, inner rings and bright core.
                    const grad = ctx.createRadialGradient(o.x - o.r * .35, o.y - o.r * .4, 1, o.x, o.y, o.r * 1.15);
                    grad.addColorStop(0, '#27566b'); grad.addColorStop(.45, '#14263c'); grad.addColorStop(1, '#080d20');
                    ctx.fillStyle = grad; ctx.beginPath();
                    for (let i = 0; i < 8; i++) { const a = -Math.PI / 8 + i * Math.PI / 4; const px = o.x + Math.cos(a) * o.r * .92, py = o.y + Math.sin(a) * o.r * .92; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
                    ctx.closePath(); ctx.fill(); ctx.strokeStyle = pulse > 0 ? '#ffffff' : '#00f2fe'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.strokeStyle = '#ff3df2'; ctx.globalAlpha = .7; ctx.lineWidth = 1.4;
                    ctx.beginPath(); ctx.arc(o.x, o.y, o.r * .57, 0, Math.PI * 2); ctx.stroke();
                    ctx.globalAlpha = 1; ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(o.x, o.y, o.r * .34, 0, Math.PI * 2); ctx.stroke();
                    ctx.fillStyle = pulse > 0 ? '#fff7ae' : '#e0fcff'; ctx.shadowColor = '#00f2fe'; ctx.shadowBlur = 12 + pulse * 18;
                    ctx.beginPath(); ctx.arc(o.x, o.y, 3.5 + beat * 2 + pulse * 4, 0, Math.PI * 2); ctx.fill();
                }
                if (pulse > 0) {
                    ctx.globalAlpha = pulse; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(o.x, o.y, o.r + (1 - pulse) * 28, 0, Math.PI * 2); ctx.stroke();
                }
                ctx.restore();
            }

            for (const f of this.hitFlashes) {
                const t = f.life / f.maxLife;
                ctx.save();
                ctx.globalAlpha = t;
                ctx.shadowColor = 'rgba(0, 242, 254, 0.9)';
                ctx.shadowBlur = 24;
                ctx.beginPath();
                ctx.arc(f.x, f.y, 6 + (1 - t) * 14, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(180, 240, 255, 0.85)';
                ctx.fill();
                ctx.restore();
            }

            if (this.shrinkEnabled && this.shrinkOffset > 0.5 && (this.shrinkMoving || this.shrinkWarning > 0)) {
                ctx.save();
                ctx.globalAlpha = this.shrinkMoving ? 0.95 : 0.2 + this.shrinkWarning * 0.7;
                ctx.strokeStyle = this.shrinkMoving ? '#ff2929' : `rgba(255, 42, 42, ${0.2 + this.shrinkWarning * 0.8})`;
                ctx.shadowColor = '#ff2929';
                ctx.shadowBlur = this.shrinkMoving ? 20 : 6 + this.shrinkWarning * 12;
                ctx.lineWidth = this.shrinkMoving ? 3.5 : 2;
                ctx.setLineDash([6, 6]);
                this._roundRectPath(ctx, x, y, w, h, cornerRadius);
                ctx.stroke();
                ctx.restore();
            }
        }

        _roundRectPath(ctx, x, y, w, h, r) {
            r = Math.min(r, w / 2, h / 2);
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }
    }

    window.Arena = Arena;
})();