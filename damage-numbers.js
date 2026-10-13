/**
 * DAMAGE NUMBERS — Nombres flottants façon jeu de combat.
 */
(function () {
    'use strict';

    class DamageNumber {
        constructor(x, y, text, color, opts = {}) {
            this.x = x;
            this.y = y;
            this.vx = opts.vx ?? (Math.random() - 0.5) * 60;
            this.vy = opts.vy ?? -110;
            this.text = String(text);
            this.color = color || '#ffffff';
            this.life = opts.life ?? 0.9;
            this.maxLife = this.life;
            this.size = opts.size ?? 16;
            this.scale = 0.4;
            this.crit = !!opts.crit;
        }
        update(dt) {
            this.life -= dt;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += 180 * dt;
            this.vx *= 0.94;
            this.scale = Math.min(1, this.scale + dt * 8);
            return this.life > 0;
        }
        render(ctx) {
            const t = this.life / this.maxLife;
            ctx.save();
            ctx.globalAlpha = Math.min(1, t * 2);
            const sz = this.size * this.scale;
            ctx.font = `900 ${sz}px Outfit, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = Math.max(2, sz * 0.18);
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
            ctx.strokeText(this.text, this.x, this.y);
            if (this.crit) {
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 14;
            }
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }

    class DamageNumberSystem {
        constructor() { this.items = []; }
        spawn(x, y, text, color, opts) {
            this.items.push(new DamageNumber(x, y, text, color, opts));
            if (this.items.length > 80) this.items.splice(0, this.items.length - 80);
        }
        update(dt) {
            for (let i = this.items.length - 1; i >= 0; i--) {
                if (!this.items[i].update(dt)) this.items.splice(i, 1);
            }
        }
        render(ctx) {
            for (const it of this.items) it.render(ctx);
        }
        clear() { this.items.length = 0; }
    }

    window.DamageNumber = DamageNumber;
    window.DamageNumberSystem = DamageNumberSystem;
})();