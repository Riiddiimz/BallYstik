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

    class Arena {
        constructor(canvas, options = {}) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            this.padding      = options.padding      ?? 16;
            this.cornerRadius = options.cornerRadius ?? 44;

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
            this._buildObstacles(options.obstacles ?? 1);

            this._recompute();
        }

        _recompute() {
            const c = this.canvas;
            const p = this.padding + this.shrinkOffset;
            this.x = p;
            this.y = p;
            this.w = Math.max(60, c.width  - p * 2);
            this.h = Math.max(60, c.height - p * 2);
        }

        _buildObstacles(count) {
            this.obstacles = [];
            if (count <= 0) return;
            const cx = this.canvas.width / 2;
            const cy = this.canvas.height / 2;
            const baseR = 24;
            const spacing = 110;

            if (count === 1) {
                this.obstacles.push({ x: cx, y: cy, r: baseR + 6 });
            } else if (count === 2) {
                this.obstacles.push({ x: cx, y: cy - spacing, r: baseR });
                this.obstacles.push({ x: cx, y: cy + spacing, r: baseR });
            } else {
                this.obstacles.push({ x: cx, y: cy - spacing, r: baseR });
                this.obstacles.push({ x: cx, y: cy,           r: baseR + 4 });
                this.obstacles.push({ x: cx, y: cy + spacing, r: baseR });
            }
        }

        update(dt) {
            this.time    += dt;
            this.elapsed += dt;
            this.wallPulse = Math.max(0, this.wallPulse - dt * 3.2);

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
            if (!this.shrinkEnabled) return false;
            const safeP = this.padding + Math.min(this.canvas.width, this.canvas.height) * this.shrinkMax;
            return ball.x < safeP || ball.x > this.canvas.width - safeP
                || ball.y < safeP || ball.y > this.canvas.height - safeP;
        }

        addHitFlash(x, y, life = 0.35) {
            this.hitFlashes.push({ x, y, life, maxLife: life });
        }

        resolveBall(ball) {
            const r = Math.max(0, Number(ball.radius) || 0);
            const left = this.x, right = this.x + this.w;
            const top = this.y, bottom = this.y + this.h;
            const corner = Math.min(this.cornerRadius, this.w / 2, this.h / 2);
            const arcRadius = Math.max(0, corner - r);
            const minX = left + r, maxX = right - r;
            const minY = top + r, maxY = bottom - r;
            let hit = null;
            let cornerHit = false;

            // Résoudre les coins avant les côtés : le clamp rectangulaire préalable
            // empêchait la normale radiale de fonctionner dans les angles arrondis.
            if (arcRadius > 0) {
                const corners = [
                    { cx: left + corner,  cy: top + corner,    sx:  1, sy:  1 },
                    { cx: right - corner, cy: top + corner,    sx: -1, sy:  1 },
                    { cx: left + corner,  cy: bottom - corner, sx:  1, sy: -1 },
                    { cx: right - corner, cy: bottom - corner, sx: -1, sy: -1 }
                ];

                for (const c of corners) {
                    const dx = ball.x - c.cx;
                    const dy = ball.y - c.cy;
                    if (dx * c.sx < 0 || dy * c.sy < 0) continue;

                    const d = Math.hypot(dx, dy);
                    // Détecte aussi les dépassements importants dus à une vitesse élevée.
                    const outsideBounds = ball.x < minX || ball.x > maxX || ball.y < minY || ball.y > maxY;
                    if (d <= arcRadius && !outsideBounds) continue;

                    const nx = d > 1e-8 ? dx / d : c.sx * Math.SQRT1_2;
                    const ny = d > 1e-8 ? dy / d : c.sy * Math.SQRT1_2;
                    ball.x = c.cx + nx * arcRadius;
                    ball.y = c.cy + ny * arcRadius;

                    // La zone jouable est à l'intérieur du rayon réduit.
                    // La boule frappe le mur lorsqu'elle s'éloigne du centre de l'arrondi.
                    const dot = ball.vx * nx + ball.vy * ny;
                    if (dot > 0) {
                        ball.vx -= 2 * dot * nx;
                        ball.vy -= 2 * dot * ny;
                    }

                    hit = { nx: -nx, ny: -ny, x: c.cx + nx * corner, y: c.cy + ny * corner };
                    cornerHit = true;
                    break;
                }
            }

            // Côtés droits, uniquement hors des zones d'arrondis.
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

            // Dernière sécurité anti-fuite pour une arène qui rétrécit sous une boule.
            if (ball.x < minX || ball.x > maxX || ball.y < minY || ball.y > maxY) {
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
                        ball.vx -= 2 * dot * nx;
                        ball.vy -= 2 * dot * ny;
                        hit = { nx, ny, x: o.x + nx * o.r, y: o.y + ny * o.r };
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

        render(ctx) {
            const { x, y, w, h, cornerRadius } = this;

            ctx.save();
            this._roundRectPath(ctx, x, y, w, h, cornerRadius);
            ctx.fillStyle = PALETTE.floor;
            ctx.fill();

            ctx.clip();
            ctx.strokeStyle = PALETTE.grid;
            ctx.lineWidth = 1;
            const grid = 40;
            for (let gx = x; gx < x + w; gx += grid) {
                ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
            }
            for (let gy = y; gy < y + h; gy += grid) {
                ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
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
                ctx.save();
                ctx.shadowColor = 'rgba(140,90,255,0.7)';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
                ctx.fillStyle = PALETTE.obstacle;
                ctx.fill();
                ctx.strokeStyle = PALETTE.obstacleEdge;
                ctx.lineWidth = 1.6;
                ctx.stroke();
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