/**
 * ARENA HUD — Barres de vie flottantes, leaderboard, kill feed, timer.
 * Format 9:16 TikTok : tout doit rester lisible sur mobile.
 */
(function () {
    'use strict';

    class KillFeed {
        constructor() {
            this.items = [];
        }
        push(killer, victim, cause) {
            this.items.push({
                killer, victim, cause,
                life: 3.2,
                maxLife: 3.2
            });
            if (this.items.length > 5) this.items.shift();
        }
        update(dt) {
            for (let i = this.items.length - 1; i >= 0; i--) {
                this.items[i].life -= dt;
                if (this.items[i].life <= 0) this.items.splice(i, 1);
            }
        }
        render(ctx, x, y, width) {
            ctx.save();
            ctx.font = 'bold 11px Outfit, system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            let cy = y;
            for (const it of this.items) {
                const t = Math.min(1, it.life / 0.5);
                ctx.globalAlpha = t;
                const txt = `${it.killer} ✕ ${it.victim}`;
                const tw = ctx.measureText(txt).width;
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.fillRect(x + width - tw - 14, cy - 8, tw + 12, 16);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(txt, x + width - 4, cy);
                cy += 20;
            }
            ctx.restore();
        }
        clear() { this.items.length = 0; }
    }

    class Leaderboard {
        constructor() { this.entries = []; }
        update(world) {
            const sorted = world.balls
                .filter(b => b.isPlayer || b.alive)
                .slice()
                .sort((a, b) => {
                    if (a.alive !== b.alive) return a.alive ? -1 : 1;
                    const ha = a.health ? a.health.current : 0;
                    const hb = b.health ? b.health.current : 0;
                    return hb - ha;
                });
            this.entries = sorted.slice(0, 5);
        }
        render(ctx, x, y, width) {
            ctx.save();
            ctx.font = 'bold 10px Outfit, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            let cy = y;
            const rowH = 15;
            for (let i = 0; i < this.entries.length; i++) {
                const b = this.entries[i];
                const color = b.color || '#ffffff';
                const hp = b.health ? b.health.getRatio() : 0;

                // Pastille
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.fillRect(x, cy - rowH / 2 - 1, width, rowH + 2);

                // Carré de couleur
                ctx.fillStyle = b.alive ? color : '#555';
                ctx.fillRect(x + 3, cy - 4, 8, 8);

                // Nom / id
                ctx.fillStyle = b.alive ? '#ffffff' : '#888';
                ctx.fillText(`#${b.id}`, x + 14, cy);

                // HP bar
                const barX = x + width * 0.42;
                const barW = width * 0.5;
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(barX, cy - 3, barW, 6);
                ctx.fillStyle = hp > 0.6 ? '#34d399' : hp > 0.3 ? '#fbbf24' : '#ef4444';
                ctx.fillRect(barX, cy - 3, barW * hp, 6);

                cy += rowH + 1;
            }
            ctx.restore();
        }
    }

    class ArenaHUD {
        constructor() {
            this.killFeed = new KillFeed();
            this.leaderboard = new Leaderboard();
        }
        update(dt, world) {
            this.killFeed.update(dt);
            this.leaderboard.update(world);
        }
        render(ctx, world) {
            const c = ctx.canvas;
            const topSafe = 60;

            // Timer en haut au centre
            const t = world.matchTime - world.elapsedTime;
            const timerText = this._fmt(Math.max(0, t));
            ctx.save();
            ctx.font = '900 18px Outfit, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            const tw = ctx.measureText(timerText).width;
            ctx.fillRect(c.width / 2 - tw / 2 - 12, topSafe, tw + 24, 30);
            ctx.fillStyle = t < 10 ? '#ff2a85' : '#ffffff';
            ctx.shadowColor = t < 10 ? '#ff2a85' : 'transparent';
            ctx.shadowBlur = t < 10 ? 12 : 0;
            ctx.fillText(timerText, c.width / 2, topSafe + 6);
            ctx.restore();

            // Leaderboard en haut à gauche
            this.leaderboard.render(ctx, 12, topSafe + 40, 150);

            // Kill feed en haut à droite
            this.killFeed.render(ctx, c.width - 180, topSafe + 8, 168);
        }
        _fmt(s) {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${m}:${sec.toString().padStart(2, '0')}`;
        }
        clear() {
            this.killFeed.clear();
            this.leaderboard.entries.length = 0;
        }
    }

    window.KillFeed = KillFeed;
    window.Leaderboard = Leaderboard;
    window.ArenaHUD = ArenaHUD;
})();