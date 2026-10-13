/* Arena Brawl — contrôleur autonome du match et des réglages. */
(function () {
    'use strict';

    const SLIDERS = {
        abBallCount: ['ballCount', 'int', v => String(v)],
        abMaxHp: ['maxHp', 'int', v => String(v)],
        abContactDmg: ['contactDamageMult', 'float', v => v.toFixed(1) + 'x'],
        abPickupInterval: ['pickupInterval', 'float', v => v + 's'],
        abMaxSlots: ['maxSlots', 'int', v => String(v)],
        abMatchTime: ['matchTime', 'int', v => v + 's'],
        abObstacles: ['obstacles', 'int', v => String(v)],
        abSpeed: ['gameSpeed', 'float', v => v.toFixed(1) + 'x']
    };
    const STORAGE_KEY = 'ballystik.arena.options.v1';
    const SEED_KEY = 'ballystik.arena.seed.v1';

    const Bridge = {
        running: false,
        world: null,
        canvas: null,
        ctx: null,
        rafId: null,
        lastTime: 0,
        fpsFrames: 0,
        fpsAt: 0,

        init() {
            this.canvas = document.getElementById('simCanvas');
            if (!this.canvas || !window.ArenaBattle) {
                console.error('[BallYstik] Arena Brawl ou canvas manquant.');
                return;
            }
            this.ctx = this.canvas.getContext('2d');
            this.loadOptions();
            this.bindControls();
            this.resizeCanvas();
            window.addEventListener('resize', () => {
                this.resizeCanvas();
                if (this.world) window.ArenaBattle.reset(this.world);
            });
            this.start();
        },

        loadOptions() {
            try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                Object.entries(SLIDERS).forEach(([id, cfg]) => {
                    const el = document.getElementById(id);
                    if (el && saved[cfg[0]] != null) el.value = saved[cfg[0]];
                });
                const mode = document.getElementById('abMatchMode');
                if (mode && saved.matchMode) mode.value = saved.matchMode;
                const shrink = document.getElementById('abShrinkToggle');
                if (shrink && saved.shrinkEnabled != null) shrink.checked = !!saved.shrinkEnabled;
            } catch (_) {}
            this.updateLabels();
            this.syncMatchTime();
        },

        getOptions() {
            const options = {};
            Object.entries(SLIDERS).forEach(([id, cfg]) => {
                const el = document.getElementById(id);
                if (!el) return;
                const value = Number(el.value);
                options[cfg[0]] = cfg[1] === 'int' ? Math.round(value) : value;
            });
            const mode = document.getElementById('abMatchMode');
            const shrink = document.getElementById('abShrinkToggle');
            options.matchMode = mode ? mode.value : 'lastStanding';
            options.shrinkEnabled = !!(shrink && shrink.checked);
            return options;
        },

        saveOptions() {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getOptions())); } catch (_) {}
        },

        updateLabels() {
            Object.entries(SLIDERS).forEach(([id, cfg]) => {
                const el = document.getElementById(id);
                const label = document.getElementById(id + 'Val');
                if (el && label) label.textContent = cfg[2](Number(el.value));
            });
        },

        syncMatchTime() {
            const mode = document.getElementById('abMatchMode');
            const group = document.getElementById('abMatchTimeGroup');
            if (mode && group) group.style.display = mode.value === 'timed' ? '' : 'none';
        },

        bindControls() {
            Object.keys(SLIDERS).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', () => {
                    this.updateLabels();
                    this.saveOptions();
                    if (window.ArenaBattle) window.ArenaBattle.applyOptions(this.getOptions());
                });
            });
            ['abMatchMode', 'abShrinkToggle'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('change', () => {
                    this.saveOptions();
                    this.syncMatchTime();
                    if (window.ArenaBattle) window.ArenaBattle.applyOptions(this.getOptions());
                });
            });
            const seed = document.getElementById('manualSeedInput');
            if (seed) {
                try { seed.value = localStorage.getItem(SEED_KEY) || seed.value || '104291'; } catch (_) {}
                seed.addEventListener('change', () => {
                    try { localStorage.setItem(SEED_KEY, String(this.getSeed())); } catch (_) {}
                });
            }
            const apply = document.getElementById('applySeedBtn');
            if (apply) apply.addEventListener('click', () => this.start());
            const copy = document.getElementById('copySeedBtn');
            if (copy) copy.addEventListener('click', async () => {
                const value = String(this.getSeed());
                try {
                    await navigator.clipboard.writeText(value);
                    copy.innerHTML = '<i class="fa-solid fa-check"></i>';
                    setTimeout(() => { copy.innerHTML = '<i class="fa-solid fa-copy"></i>'; }, 900);
                } catch (_) {
                    if (seed) { seed.select(); document.execCommand('copy'); }
                }
            });
            ['resetBtn', 'replayBtn'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.addEventListener('click', () => this.start());
            });
            const play = document.getElementById('playPauseBtn');
            if (play) play.addEventListener('click', () => this.togglePause());
        },

        getSeed() {
            const input = document.getElementById('manualSeedInput');
            const parsed = input ? parseInt(input.value, 10) : 104291;
            return Number.isFinite(parsed) && parsed !== 0 ? parsed : 104291;
        },

        resizeCanvas() {
            const rect = this.canvas.getBoundingClientRect();
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.max(1, Math.round(rect.width * ratio));
            const height = Math.max(1, Math.round(rect.height * ratio));
            if (this.canvas.width !== width || this.canvas.height !== height) {
                this.canvas.width = width;
                this.canvas.height = height;
            }
            this.ctx = this.canvas.getContext('2d');
        },

        start() {
            if (!window.ArenaBattle) return;
            this.resizeCanvas();
            const seed = this.getSeed();
            let state = seed >>> 0;
            const prng = { next() {
                state = (state + 0x6D2B79F5) >>> 0;
                let t = state;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            }};
            this.world = {
                canvas: this.canvas, ctx: this.ctx, prng, seed,
                balls: [], projectiles: [], time: 0, elapsedTime: 0, matchTime: 60
            };
            window.ArenaBattle.applyOptions(this.getOptions());
            window.ArenaBattle.reset(this.world);
            const overlay = document.getElementById('victoryOverlay');
            if (overlay) overlay.classList.add('opacity-0', 'pointer-events-none');
            this.running = true;
            this.lastTime = performance.now();
            this.fpsAt = this.lastTime;
            this.fpsFrames = 0;
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this.rafId = requestAnimationFrame(t => this.tick(t));
            const badge = document.getElementById('activeSeedBadge');
            if (badge) badge.textContent = '#' + seed;
            const playText = document.getElementById('playPauseText');
            const playIcon = document.getElementById('playPauseIcon');
            if (playText) playText.textContent = 'Pause';
            if (playIcon) playIcon.className = 'fa-solid fa-pause text-cyan-400';
        },

        togglePause() {
            this.running = !this.running;
            const btnText = document.getElementById('playPauseText');
            const icon = document.getElementById('playPauseIcon');
            if (btnText) btnText.textContent = this.running ? 'Pause' : 'Reprendre';
            if (icon) icon.className = this.running ? 'fa-solid fa-pause text-cyan-400' : 'fa-solid fa-play text-cyan-400';
            if (this.running) {
                this.lastTime = performance.now();
                this.rafId = requestAnimationFrame(t => this.tick(t));
            } else if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        },

        tick(now) {
            if (!this.running || !this.world) return;
            const dt = Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000));
            this.lastTime = now;
            try {
                window.ArenaBattle.update(dt, this.world);
                window.ArenaBattle.render(this.ctx, this.world);
                this.syncCounters(now);
            } catch (error) {
                console.error('[BallYstik] Erreur pendant le match :', error);
            }
            this.rafId = requestAnimationFrame(t => this.tick(t));
        },

        syncCounters(now) {
            const alive = this.world.balls.filter(ball => ball.alive).length;
            const balls = document.getElementById('ballCounter');
            if (balls) balls.textContent = String(alive);
            const timer = document.getElementById('timerCounter');
            if (timer) timer.textContent = Math.max(0, window.ArenaBattle.matchTime - window.ArenaBattle.elapsedTime).toFixed(1) + 's';
            this.fpsFrames++;
            if (now - this.fpsAt >= 1000) {
                const fps = document.getElementById('fpsCounter');
                if (fps) fps.textContent = String(this.fpsFrames);
                this.fpsFrames = 0;
                this.fpsAt = now;
            }
        }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Bridge.init());
    else Bridge.init();
    window.ArenaBattleBridge = Bridge;
})();