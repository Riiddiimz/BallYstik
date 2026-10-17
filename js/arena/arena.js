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
            this._recompute();
            this._buildObstacles(options.obstacles ?? 1, options.obstaclePositions);
            if (this._isVortexMap()) {
                // Particules déterministes pour conserver une configuration reproductible.
                for (let i = 0; i < 40; i++) this.suckParticles.push(this._newSuckParticle(i, true));
            }
        }

        _isVortexMap(style = this.mapStyle) {
            return style === 'vortex' || style === 'vortex_test';
        }

        _recompute() {
            const c = this.canvas;
            if (this._isVortexMap()) {
                // Le cercle reste centré et ne subit jamais le shrink rectangulaire.
                this.shrinkEnabled = false;
                this.shrinkOffset = 0;
                this.vortexCx = c.width / 2;
                this.vortexCy = c.height / 2;
                this.vortexRadius = Math.min(c.width, c.height) * VORTEX.radiusFactor;
                this.x = this.vortexCx - this.vortexRadius;
                this.y = this.vortexCy - this.vortexRadius;
                this.w = this.vortexRadius * 2;
                this.h = this.vortexRadius * 2;
                this.frameX = this.x;
                this.frameY = this.y;
                this.frameW = this.w;
                this.frameH = this.h;
                return;
            }
            this.frameX = this.padding;
            this.frameY = this.padding;
            this.frameW = Math.max(60, c.width - this.padding * 2);
            this.frameH = Math.max(60, c.height - this.padding * 2);

            // Les dimensions de l'arène suivent toujours la taille réelle du canvas.
            // Les collisions utilisent x/y/w/h : les boules rebondissent donc sur ces murs.
            // Le padding ne sert qu'à garder le halo de la bordure visible dans le canvas.
            const inset = this.padding + this.shrinkOffset;
            this.x = inset;
            this.y = inset;
            this.w = Math.max(60, c.width - inset * 2);
            this.h = Math.max(60, c.height - inset * 2);
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
            } else if (map === 'void') {
                // Le passage central reste dégagé entre deux singularités latérales.
                if (count === 1) this.obstacles.push({ x: cx, y: cy - gap, r: r + 5 });
                else if (count === 2) {
                    this.obstacles.push({ x: cx, y: cy - gap, r });
                    this.obstacles.push({ x: cx, y: cy + gap, r });
                } else {
                    this.obstacles.push({ x: cx - 90, y: cy - gap, r });
                    this.obstacles.push({ x: cx + 90, y: cy, r: r + 4 });
                    this.obstacles.push({ x: cx - 90, y: cy + gap, r });
                }
            } else {
                if (count === 1) this.obstacles.push({ x: cx, y: cy, r: r + 6 });
                else if (count === 2) {
                    this.obstacles.push({ x: cx, y: cy - gap, r });
                    this.obstacles.push({ x: cx, y: cy + gap, r });
                } else {
                    this.obstacles.push({ x: cx, y: cy - gap, r });
                    this.obstacles.push({ x: cx, y: cy, r: r + 4 });
                    this.obstacles.push({ x: cx, y: cy + gap, r });
                }
            }
            while (this.obstacles.length < Math.min(10, count)) {
                const candidate = {
                    x: this.padding + 34 + Math.random() * Math.max(1, this.canvas.width - 2 * (this.padding + 34)),
                    y: this.padding + 34 + Math.random() * Math.max(1, this.canvas.height - 2 * (this.padding + 34)),
                    r
                };
                if (this.obstacles.every(o => Math.hypot(o.x - candidate.x, o.y - candidate.y) > 66)) this.obstacles.push(candidate);
                else if (this.obstacles.length >= 3 && this.obstacles.length < 10 && Math.random() < 0.04) this.obstacles.push(candidate);
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
                const maxPx = Math.min(this.canvas.width, this.canvas.height) * this.shrinkMax;
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

        isInsideDangerZone(ball) {
            if (this._isVortexMap() || !this.shrinkEnabled) return false;
            // La zone dangereuse suit les dimensions dynamiques de l'arène, quelle que soit sa forme.
            const maxInset = Math.min(this.w, this.h) * this.shrinkMax;
            const safeLeft = this.padding + maxInset;
            const safeTop = this.padding + maxInset;
            const safeRight = this.canvas.width - this.padding - maxInset;
            const safeBottom = this.canvas.height - this.padding - maxInset;
            return ball.x < safeLeft || ball.x > safeRight
                || ball.y < safeTop || ball.y > safeBottom;
        }

        addHitFlash(x, y, life = 0.35) {
            this.hitFlashes.push({ x, y, life, maxLife: life });
        }

        resolveBall(ball, dt = 1 / 60) {
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
                        // Effet bumper de flipper : renvoi franc vers l'extérieur, avec une
                        // légère conservation de la trajectoire pour rendre chaque rebond vivant.
                        const incomingX = ball.vx;
                        const incomingY = ball.vy;
                        const reflectedX = incomingX - 2 * dot * nx;
                        const reflectedY = incomingY - 2 * dot * ny;
                        const reflectedSpeed = Math.hypot(reflectedX, reflectedY) || 1;
                        const dirX = nx * 0.72 + (reflectedX / reflectedSpeed) * 0.28;
                        const dirY = ny * 0.72 + (reflectedY / reflectedSpeed) * 0.28;
                        const dirLength = Math.hypot(dirX, dirY) || 1;
                        const baseSpeed = Number(ball.baseMoveSpeed) || 180;
                        const launchSpeed = baseSpeed * 3.2;
                        ball.vx = (dirX / dirLength) * launchSpeed;
                        ball.vy = (dirY / dirLength) * launchSpeed;
                        ball._obstacleBoostTimer = 0.75;
                        o.hitPulse = 1;
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
                    ball.vx -= 1.65 * relNormal * onx;
                    ball.vy -= 1.65 * relNormal * ony;
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

        _initVortexTestShader() {
            if (this._vortexTestShaderAttempted) return !!this.vortexTestProgram;
            this._vortexTestShaderAttempted = true;
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 360;
                canvas.height = 640;
                const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });
                if (!gl) return false;
                const vertexSource = `attribute vec2 aPos;
varying vec2 vUV;
void main() {
    vUV = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}`;
                const fragmentSource = "\nprecision highp float;\nvarying vec2 vUV;\nuniform float uTime;\nuniform vec2 uRes;\n\nfloat hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat hash3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }\nfloat noise(vec2 p) {\n  vec2 i = floor(p), f = fract(p);\n  f = f * f * (3.0 - 2.0 * f);\n  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);\n}\nfloat noise3(vec3 p) {\n  vec3 i = floor(p), f = fract(p);\n  f = f*f*(3.0-2.0*f);\n  return mix(mix(mix(hash3(i), hash3(i+vec3(1,0,0)), f.x),\n                 mix(hash3(i+vec3(0,1,0)), hash3(i+vec3(1,1,0)), f.x), f.y),\n             mix(mix(hash3(i+vec3(0,0,1)), hash3(i+vec3(1,0,1)), f.x),\n                 mix(hash3(i+vec3(0,1,1)), hash3(i+vec3(1,1,1)), f.x), f.y), f.z);\n}\nfloat fbm(vec2 p) {\n  float s = 0.0, a = 0.5;\n  for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; }\n  return s;\n}\nfloat fbm3(vec3 p) {\n  float s = 0.0, a = 0.5;\n  for (int i = 0; i < 4; i++) { s += a * noise3(p); p *= 2.05; a *= 0.5; }\n  return s;\n}\nfloat sdRoundRect(vec2 p, vec2 b, float r) {\n  vec2 q = abs(p) - b + r;\n  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;\n}\nfloat sdHexagon(vec2 p, float r) {\n  vec3 k = vec3(-0.8660254, 0.5, 0.57735);\n  p = abs(p);\n  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;\n  p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);\n  return length(p) * sign(p.y);\n}\nfloat sdDiamond(vec2 p, float r) { return abs(p.x) + abs(p.y) - r; }\nfloat sdCross(vec2 p, vec2 b, float t) {\n  vec2 q = abs(p);\n  vec2 c = vec2(min(q.x, q.y), max(q.x, q.y));\n  float d = max(c.x - t, c.y - b.y);\n  return length(max(vec2(d, c.y - b.y), 0.0)) + min(max(d, c.y - b.y), 0.0);\n}\nfloat sdSeg(vec2 p, vec2 a, vec2 b, float r) {\n  vec2 pa = p - a, ba = b - a;\n  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);\n  return length(pa - ba * h) - r;\n}\nvec2 aspectUV() {\n  vec2 a = vec2(9.0 / 16.0, 1.0);\n  return (vUV - 0.5) * a + 0.5;\n}\nfloat vignette(vec2 uv) {\n  return 1.0 - length((uv - 0.5) * vec2(0.85, 1.0)) * 0.7;\n}\n\nvoid main() {\n  vec2 uvA = aspectUV(); vec2 p = uvA - 0.5;\n  float r = length(p);\n  float a = atan(p.y, p.x);\n  vec3 col = vec3(0.05, 0.01, 0.08);\n  col += vec3(0.6, 0.1, 1.0) * (sin(a * 6.0 + r * 25.0 - uTime * 3.0) * 0.5 + 0.5) * 0.15 * smoothstep(0.5, 0.0, r);\n  col += vec3(0.9, 0.3, 1.0) * (1.0 - smoothstep(0.0, 0.15, r)) * 0.4;\n  for (int i = 0; i < 12; i++) {\n    float fi = float(i);\n    float pa = fi * 0.52 + uTime * 2.0;\n    float pr = fract(hash(vec2(fi, 0.0)) + uTime * 0.15) * 0.45;\n    vec2 pp = vec2(cos(pa), sin(pa)) * pr;\n    col += vec3(0.8, 0.4, 1.0) * smoothstep(0.006, 0.0, length(p - pp)) * 0.7;\n  }\n  col += vec3(0.8, 0.4, 1.0) * smoothstep(0.008, 0.0, abs(r - 0.44)) * 1.2;\n  col *= vignette(uvA);\n  gl_FragColor = vec4(col, 1.0);\n}\n";
                const compile = (type, source) => {
                    const item = gl.createShader(type);
                    gl.shaderSource(item, source);
                    gl.compileShader(item);
                    if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
                        console.warn('[BallYstik] Vortex Test shader compile failed:', gl.getShaderInfoLog(item));
                        gl.deleteShader(item);
                        return null;
                    }
                    return item;
                };
                const vertex = compile(gl.VERTEX_SHADER, vertexSource);
                const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
                if (!vertex || !fragment) return false;
                const program = gl.createProgram();
                gl.attachShader(program, vertex);
                gl.attachShader(program, fragment);
                gl.linkProgram(program);
                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    console.warn('[BallYstik] Vortex Test shader link failed:', gl.getProgramInfoLog(program));
                    gl.deleteProgram(program);
                    return false;
                }
                const buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
                this.vortexTestCanvas = canvas;
                this.vortexTestGL = gl;
                this.vortexTestProgram = program;
                this.vortexTestUniforms = {
                    buffer,
                    aPos: gl.getAttribLocation(program, 'aPos'),
                    uTime: gl.getUniformLocation(program, 'uTime'),
                    uRes: gl.getUniformLocation(program, 'uRes')
                };
                return true;
            } catch (error) {
                console.warn('[BallYstik] Vortex Test WebGL unavailable; using 2D fallback.', error);
                return false;
            }
        }

        _renderVortexTest(ctx) {
            const cx = this.vortexCx, cy = this.vortexCy, R = this.vortexRadius, t = this.time;
            if (this._initVortexTestShader()) {
                const gl = this.vortexTestGL;
                const canvas = this.vortexTestCanvas;
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.clearColor(0.02, 0.005, 0.03, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.useProgram(this.vortexTestProgram);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vortexTestUniforms.buffer);
                gl.enableVertexAttribArray(this.vortexTestUniforms.aPos);
                gl.vertexAttribPointer(this.vortexTestUniforms.aPos, 2, gl.FLOAT, false, 0, 0);
                gl.uniform1f(this.vortexTestUniforms.uTime, t);
                if (this.vortexTestUniforms.uRes) gl.uniform2f(this.vortexTestUniforms.uRes, canvas.width, canvas.height);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                ctx.drawImage(canvas, 0, 0, this.canvas.width, this.canvas.height);
            } else {
                // Fallback sûr : rendu Canvas 2D existant, sans bloquer le match.
                this._renderVortex(ctx);
                return;
            }

            // Le shader ne gère que le décor : la limite et les obstacles restent en 2D.
            const borderPulse = 0.85 + 0.15 * Math.sin(t * 1.6);
            ctx.save();
            ctx.strokeStyle = 'rgba(192, 132, 252, ' + (0.6 * borderPulse) + ')';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 26 * borderPulse;
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cx, cy, R - 1, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            for (const o of this.obstacles) {
                const pulse = o.hitPulse || 0;
                const beat = 0.5 + 0.5 * Math.sin(t * 3 + (o.baseAngle || 0) * 3);
                ctx.save();
                ctx.globalAlpha = 0.55 + pulse * 0.45;
                ctx.shadowColor = pulse > 0 ? '#f3e8ff' : '#a855f7';
                ctx.shadowBlur = 18 + pulse * 22 + beat * 5;
                ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 3 + pulse * 5 + beat * 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = pulse > 0 ? '#f3e8ff' : 'rgba(168,85,247,0.6)';
                ctx.lineWidth = 2 + pulse * 2.5; ctx.stroke();
                ctx.globalAlpha = 1;
                const grad = ctx.createRadialGradient(o.x - o.r * 0.4, o.y - o.r * 0.4, 1, o.x, o.y, o.r);
                grad.addColorStop(0, pulse > 0 ? '#f3e8ff' : '#4c1d95');
                grad.addColorStop(0.7, '#2a0e4d');
                grad.addColorStop(1, '#1a0832');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = pulse > 0 ? '#ffffff' : '#c084fc';
                ctx.lineWidth = 1.8 + pulse * 2; ctx.stroke();
                ctx.fillStyle = pulse > 0 ? '#fff7ae' : '#a855f7';
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 8 + pulse * 20 + beat * 3;
                ctx.beginPath(); ctx.arc(o.x, o.y, 3 + beat * 1.5 + pulse * 4, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
            for (const f of this.hitFlashes) {
                const fade = f.life / f.maxLife;
                ctx.save();
                ctx.globalAlpha = fade;
                ctx.shadowColor = '#c084fc';
                ctx.shadowBlur = 24;
                ctx.beginPath(); ctx.arc(f.x, f.y, 6 + (1 - fade) * 14, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(233,213,255,0.85)';
                ctx.fill();
                ctx.restore();
            }
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
            if (this.mapStyle === 'vortex_test') {
                this._renderVortexTest(ctx);
                return;
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
            } else if (this.mapStyle === 'void') {
                for (let i = 0; i < 2; i++) {
                    const cx = frameX + frameW * (i ? 0.72 : 0.28), cy = frameY + frameH * (i ? 0.68 : 0.32);
                    ctx.globalAlpha = 0.24 + 0.1 * Math.sin(this.time * 3 + i);
                    ctx.strokeStyle = i ? '#c084fc' : '#00f2fe';
                    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 16;
                    for (let j = 0; j < 3; j++) {
                        ctx.beginPath();
                        ctx.arc(cx, cy, 15 + j * 11 + 3 * Math.sin(this.time * 2 + j), this.time * (i ? -0.8 : 0.8) + j, this.time * (i ? -0.8 : 0.8) + j + Math.PI * 1.4);
                        ctx.stroke();
                    }
                    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
                }
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
                ctx.save();
                // Halo qui s'intensifie nettement lors d'une collision.
                ctx.globalAlpha = 0.55 + pulse * 0.45;
                ctx.shadowColor = pulse > 0 ? '#fff176' : 'rgba(140,90,255,0.9)';
                ctx.shadowBlur = 16 + pulse * 30 + beat * 5;
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r + 3 + pulse * 7 + beat * 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = pulse > 0 ? '#fff176' : 'rgba(160,120,255,0.55)';
                ctx.lineWidth = 2 + pulse * 3;
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
                ctx.fillStyle = PALETTE.obstacle;
                ctx.fill();
                ctx.strokeStyle = pulse > 0 ? '#ffffff' : PALETTE.obstacleEdge;
                ctx.lineWidth = 1.8 + pulse * 2.2;
                ctx.stroke();
                // Noyau lumineux fixe : aucun élément ne gravite autour de l'obstacle.
                ctx.fillStyle = pulse > 0 ? '#fff7ae' : '#a78bfa';
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 8 + pulse * 22 + beat * 3;
                ctx.beginPath();
                ctx.arc(o.x, o.y, 5 + beat * 2 + pulse * 5, 0, Math.PI * 2);
                ctx.fill();
                if (pulse > 0) {
                    ctx.globalAlpha = pulse;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(o.x, o.y, o.r + (1 - pulse) * 28, 0, Math.PI * 2);
                    ctx.stroke();
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