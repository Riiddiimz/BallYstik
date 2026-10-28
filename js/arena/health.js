/**
 * HEALTH — Système de points de vie avec indication chiffrée des dégâts.
 */
(function () {
    'use strict';

    class Health {
        constructor(maxHp) {
            this.max = maxHp;
            this.current = maxHp;
            this.invuln = 0;
            this.dead = false;
            this.lastHitAt = -999;
            this.damageNumber = 0;
            this.damageNumberTimer = 0;
        }

        damage(amount, opts = {}) {
            if (this.dead) return 0;
            if (this.invuln > 0 && !opts.ignoreInvuln) return 0;
            const dmg = Math.min(this.current, Math.max(0, amount));
            if (dmg <= 0) return 0;

            this.current -= dmg;
            this.damageNumber = Math.round(dmg);
            this.damageNumberTimer = 0.8;
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
            return this.current - before;
        }

        update(dt) {
            if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
            if (this.damageNumberTimer > 0) {
                this.damageNumberTimer = Math.max(0, this.damageNumberTimer - dt);
            }
        }

        getRatio() { return this.max ? this.current / this.max : 0; }
        getChipRatio() { return this.getRatio(); }

        render(ctx, x, y, width, height, color = '#00f2fe') {
            const w = width;
            const h = height;
            const fillW = w * this.getRatio();

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this._rounded(ctx, x - w / 2 - 2, y - 2, w + 4, h + 4, h);
            ctx.fill();

            const r = this.getRatio();
            let fillColor = color;
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

            if (this.damageNumberTimer > 0 && this.damageNumber > 0) {
                const progress = this.damageNumberTimer / 0.8;
                ctx.globalAlpha = Math.min(1, progress * 1.5);
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                ctx.strokeText(`-${this.damageNumber}`, x, y - 3 - (1 - progress) * 10);
                ctx.fillStyle = '#ff5a5f';
                ctx.fillText(`-${this.damageNumber}`, x, y - 3 - (1 - progress) * 10);
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