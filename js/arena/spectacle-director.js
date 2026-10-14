/**
 * SPECTACLE DIRECTOR — événements visuels courts pour garder l'arène vivante.
 * Visuel uniquement : ne modifie ni les trajectoires, ni les dégâts, ni le RNG de combat.
 */
(function () {
    'use strict';

    const EVENTS = [
        { title: 'NOVA ÉNERGÉTIQUE', sub: 'IMPULSION COSMIQUE', color: '#00f2fe', kind: 'nova' },
        { title: 'ORAGE PRISMATIQUE', sub: 'CHARGES EN APPROCHE', color: '#c084fc', kind: 'storm' },
        { title: 'RUPTURE DE PHASE', sub: 'ESPACE INSTABLE', color: '#ff2a85', kind: 'phase' },
        { title: 'SURCHARGE', sub: 'ÉNERGIE MAXIMALE', color: '#fbbf24', kind: 'surge' },
        { title: 'PLUIE DE COMÈTES', sub: 'IMPACT IMMINENT', color: '#fb7185', kind: 'comets' },
        { title: 'ONDE QUANTIQUE', sub: 'RÉSONANCE DÉTECTÉE', color: '#34d399', kind: 'wave' }
    ];

    class SpectacleDirector {
        constructor() {
            this.timer = 0.65;
            this.eventIndex = -1;
            this.event = null;
            this.age = 0;
            this.rings = [];
            this.bolts = [];
            this.streaks = [];
            this.flash = 0;
            this.serial = 0;
            this.randomState = 0x6d2b79f5;
        }

        reset() {
            this.timer = 0.65;
            this.eventIndex = -1;
            this.event = null;
            this.age = 0;
            this.rings.length = 0;
            this.bolts.length = 0;
            this.streaks.length = 0;
            this.flash = 0;
            this.serial = 0;
            this.randomState = 0x6d2b79f5;
        }

        _random() {
            // PRNG privé : les animations ne consomment jamais la seed de combat.
            this.randomState = (Math.imul(1664525, this.randomState) + 1013904223) >>> 0;
            return this.randomState / 4294967296;
        }

        _point(world) {
            const a = world.arena;
            const pad = 54;
            return {
                x: a.x + pad + this._random(world) * Math.max(1, a.w - pad * 2),
                y: a.y + pad + this._random(world) * Math.max(1, a.h - pad * 2)
            };
        }

        _launch(world) {
            this.eventIndex = (this.eventIndex + 1) % EVENTS.length;
            // Déplace l'ordre de départ selon la seed sans introduire d'aléatoire à chaque frame.
            if (this.serial === 0) this.eventIndex = Math.floor(this._random(world) * EVENTS.length);
            this.serial++;
            this.event = EVENTS[this.eventIndex];
            this.age = 0;
            this.flash = 0.22;
            this.rings.length = 0;
            this.bolts.length = 0;
            this.streaks.length = 0;

            const p = this._point(world);
            const count = this.event.kind === 'storm' ? 5 : this.event.kind === 'comets' ? 7 : 3;
            for (let i = 0; i < count; i++) {
                const q = this._point(world);
                this.rings.push({
                    x: this.event.kind === 'nova' || this.event.kind === 'wave' ? p.x : q.x,
                    y: this.event.kind === 'nova' || this.event.kind === 'wave' ? p.y : q.y,
                    radius: 8 + this._random(world) * 30,
                    maxRadius: 70 + this._random(world) * 160,
                    width: 1.5 + this._random(world) * 3,
                    delay: i * (this.event.kind === 'storm' ? 0.045 : 0.075),
                    life: 1.05 + this._random(world) * 0.3
                });
            }

            if (this.event.kind === 'storm' || this.event.kind === 'phase') {
                const a = world.arena;
                for (let i = 0; i < 6; i++) {
                    const x1 = a.x + 20 + this._random(world) * (a.w - 40);
                    const x2 = a.x + 20 + this._random(world) * (a.w - 40);
                    const y = a.y + 12 + this._random(world) * (a.h - 24);
                    const points = [{ x: x1, y }];
                    const segments = 5 + Math.floor(this._random(world) * 5);
                    for (let j = 1; j < segments; j++) {
                        points.push({
                            x: x1 + (x2 - x1) * j / segments + (this._random(world) - 0.5) * 52,
                            y: y + (this._random(world) - 0.5) * 120
                        });
                    }
                    points.push({ x: x2, y: y + (this._random(world) - 0.5) * 80 });
                    this.bolts.push({ points, delay: i * 0.055, life: 0.32 + this._random(world) * 0.16 });
                }
            }

            const streakCount = this.event.kind === 'comets' ? 26 : 12;
            const a = world.arena;
            for (let i = 0; i < streakCount; i++) {
                this.streaks.push({
                    x: a.x + this._random(world) * a.w,
                    y: a.y + this._random(world) * a.h,
                    vx: (this._random(world) - 0.5) * (this.event.kind === 'surge' ? 900 : 520),
                    vy: -80 - this._random(world) * 420,
                    length: 12 + this._random(world) * 54,
                    life: 0.35 + this._random(world) * 0.55,
                    maxLife: 0.35 + this._random(world) * 0.55
                });
            }

            if (world.addShockwave) {
                world.addShockwave(p.x, p.y, {
                    radius: Math.min(aSafe(world.arena), 220),
                    color: this.event.color,
                    life: 0.72
                });
            }
            if (world.spawnParticle) {
                world.spawnParticle(p.x, p.y, {
                    color: this.event.color,
                    count: this.event.kind === 'comets' ? 38 : 28,
                    speed: this.event.kind === 'surge' ? 420 : 300,
                    life: 0.9,
                    spread: Math.PI * 2,
                    size: 3.2
                });
            }
        }

        update(dt, world) {
            this.timer -= dt;
            this.flash = Math.max(0, this.flash - dt);
            if (this.timer <= 0 && !this._matchFinished(world)) {
                this._launch(world);
                // Un événement environ toutes les 1,8 seconde, avec une petite variation.
                this.timer = 1.72 + this._random(world) * 0.24;
            }
            if (this.event) this.age += dt;

            for (let i = this.rings.length - 1; i >= 0; i--) {
                const r = this.rings[i];
                r.delay -= dt;
                if (r.delay <= 0) r.radius += (r.maxRadius - r.radius) * Math.min(1, dt * 5.5);
                r.life -= dt;
                if (r.life <= 0) this.rings.splice(i, 1);
            }
            for (let i = this.bolts.length - 1; i >= 0; i--) {
                this.bolts[i].life -= dt;
                this.bolts[i].delay -= dt;
                if (this.bolts[i].life <= 0) this.bolts.splice(i, 1);
            }
            for (let i = this.streaks.length - 1; i >= 0; i--) {
                const s = this.streaks[i];
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                s.life -= dt;
                if (s.life <= 0) this.streaks.splice(i, 1);
            }
        }

        _matchFinished(world) {
            return !!(world && window.ArenaBattle && window.ArenaBattle.finished);
        }

        render(ctx, world) {
            const arena = world && world.arena;
            if (!arena || !this.event) return;
            const w = ctx.canvas.width;
            const h = ctx.canvas.height;
            const color = this.event.color;
            const progress = Math.min(1, this.age / 0.22);
            const fadeOut = this.age > 1.18 ? Math.max(0, 1 - (this.age - 1.18) / 0.42) : 1;

            ctx.save();
            arena._roundRectPath(ctx, arena.x, arena.y, arena.w, arena.h, arena.cornerRadius);
            ctx.clip();

            // Flash bref et contrôlé, sans masquer les combats.
            if (this.flash > 0) {
                ctx.fillStyle = color;
                ctx.globalAlpha = Math.min(0.11, this.flash * 0.48);
                ctx.fillRect(arena.x, arena.y, arena.w, arena.h);
                ctx.globalAlpha = 1;
            }

            // Anneaux d'énergie avec lueur.
            ctx.globalCompositeOperation = 'lighter';
            for (const r of this.rings) {
                if (r.delay > 0) continue;
                const alpha = Math.min(1, r.life / 0.35) * fadeOut;
                ctx.globalAlpha = alpha * 0.72;
                ctx.strokeStyle = color;
                ctx.lineWidth = r.width * (0.7 + alpha);
                ctx.shadowColor = color;
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Éclairs anguleux, dessinés sur une seule frame brillante puis en fondu.
            for (const bolt of this.bolts) {
                if (bolt.delay > 0) continue;
                ctx.globalAlpha = Math.min(1, bolt.life / 0.12) * fadeOut;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.2;
                ctx.shadowColor = color;
                ctx.shadowBlur = 20;
                ctx.beginPath();
                bolt.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
                ctx.stroke();
                ctx.strokeStyle = color;
                ctx.lineWidth = 6;
                ctx.globalAlpha *= 0.25;
                ctx.stroke();
            }

            // Traînées lumineuses : pluie de comètes / accélération visuelle.
            for (const s of this.streaks) {
                ctx.globalAlpha = Math.max(0, s.life / s.maxLife) * 0.8 * fadeOut;
                ctx.strokeStyle = color;
                ctx.lineWidth = 1 + ctx.globalAlpha * 2;
                ctx.shadowColor = color;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.vx * 0.045, s.y - s.vy * 0.045 - s.length);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            ctx.globalCompositeOperation = 'source-over';

            // Scanlines de rupture de phase.
            if (this.event.kind === 'phase' && this.age < 0.7) {
                ctx.globalAlpha = (1 - this.age / 0.7) * 0.26;
                ctx.fillStyle = color;
                for (let y = arena.y + 8; y < arena.y + arena.h; y += 17) {
                    ctx.fillRect(arena.x, y, arena.w, 1);
                }
            }

            // Cartouche événementiel premium, animé en entrée/sortie.
            if (fadeOut > 0) {
                const bannerW = Math.min(arena.w - 28, 300);
                const bannerH = 62;
                const slide = (1 - progress) * -22;
                const bx = arena.x + (arena.w - bannerW) / 2;
                const by = arena.y + 18 + slide;
                ctx.globalAlpha = fadeOut;
                ctx.fillStyle = 'rgba(5,8,20,0.84)';
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(bx, by, bannerW, bannerH, 12) : arena._roundRectPath(ctx, bx, by, bannerW, bannerH, 12);
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.2;
                ctx.shadowColor = color;
                ctx.shadowBlur = 16;
                ctx.stroke();
                ctx.shadowBlur = 0;

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '900 12px Outfit, system-ui, sans-serif';
                ctx.fillStyle = color;
                ctx.fillText('✦  ÉVÉNEMENT ARENA  ✦', arena.x + arena.w / 2, by + 15);
                ctx.font = '900 15px Outfit, system-ui, sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = color;
                ctx.shadowBlur = 12;
                ctx.fillText(this.event.title, arena.x + arena.w / 2, by + 33, bannerW - 20);
                ctx.shadowBlur = 0;
                ctx.font = '700 8px Outfit, system-ui, sans-serif';
                ctx.fillStyle = 'rgba(226,232,240,0.78)';
                ctx.fillText(this.event.sub, arena.x + arena.w / 2, by + 48, bannerW - 20);
                ctx.globalAlpha = fadeOut * 0.82;
                ctx.fillStyle = color;
                ctx.fillRect(bx + 8, by + bannerH - 3, (bannerW - 16) * Math.min(1, this.age / 1.6), 2);
            }

            ctx.restore();
        }
    }

    function aSafe(arena) {
        return Math.min(arena.w, arena.h) * 0.42;
    }

    window.SpectacleDirector = SpectacleDirector;
})();