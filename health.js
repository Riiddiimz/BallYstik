/**
 * HEALTH — Système HP avec chip damage (traînée blanche) façon jeu de combat.
 */
(function () {
    'use strict';

    class Health {
        constructor(maxHp) {
            this.max        = maxHp;
            this.current    = maxHp;
            this.chipValue  = maxHp;
            this.chipDelay  = 0;
            this.chipSpeed  = maxHp * 1.8;
            this.invuln     = 0;
            this.dead       = false;
            this.lastHitAt  = -999;
            this.hitFlash   = 0;
        }

        damage(amount, opts = {}) {
            if (this.dead) return 0;
            if (this.invuln > 0 && !opts.ignoreInvuln) return 0;
            const dmg = Math.min(this.current, amount);
            this.current -= dmg;
            this.chipDelay = 0.35;
            this.hitFlash = 1;
            this.lastHitAt = performance.now() / 1000;
            if (this.current <= 0) {
                this.current = 0;
                this.dead = true;
            }
            return dmg;
        }

        heal(amount) {
            if (this.dead) return 0;
            const before = this.current;
            this.current = Math.min(this.max, this.current + amount);
            if (this.current > this.chipValue) this.chipValue = this.current;
            return this.current - before;
        }

        update(dt) {
            if (this.invuln > 0) this.invuln -= dt;
            if (this.chipDelay > 0) {
                this.chipDelay -= dt;
            } else if (this.chipValue > this.current) {
                this.chipValue = Math.max(this.current, this.chipValue - this.chipSpeed * dt);
            }
            if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
        }

        getRatio()      { return this.max ? this.current / this.max : 0; }
        getChipRatio()  { return this.max ? this.chipValue / this.max : 0; }

        render(ctx, x, y, width, height, color = '#00f2fe') {
            const w = width;
            const h = height;
            const chipW = w * this.getChipRatio();
            const fillW = w * this.getRatio();

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this._rounded(ctx, x - w / 2 - 2, y - 2, w + 4, h + 4, h);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            this._rounded(ctx, x - w / 2, y, chipW, h, h / 2);
            ctx.fill();

            let fillColor = color;
            const r = this.getRatio();
            if (r < 0.3) {
                const p = 0.5 + 0.5 * Math.sin(performance.now() * 0.008);
                fillColor = `rgba(255, ${60 + p * 60}, 90, 1)`;
                ctx.shadowColor = 'rgba(255,42,133,0.9)';
                ctx.shadowBlur = 12 * p;
            } else if (r < 0.6) {
                fillColor = '#fbbf24';
            }
            ctx.fillStyle = fillColor;
            this._rounded(ctx, x - w / 2, y, fillW, h, h / 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (this.hitFlash > 0) {
                ctx.globalAlpha = this.hitFlash * 0.9;
                ctx.fillStyle = '#ffffff';
                this._rounded(ctx, x - w / 2, y, w, h, h / 2);
                ctx.fill();
            }
            ctx.restore();
        }

        _rounded(ctx, x, y, w, h, r) {
            if (w <= 0) return;
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

    window.Health = Health;
})();