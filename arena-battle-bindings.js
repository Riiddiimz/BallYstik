/**
 * ARENA BRAWL BINDINGS — Fait le pont entre l'UI (sliders/bouton) et le mode
 * ArenaBattle.
 */
(function () {
    'use strict';

    const SLIDER_MAP = {
        abBallCount:      { key: 'ballCount',          type: 'int',   fmt: v => v },
        abMaxHp:          { key: 'maxHp',              type: 'int',   fmt: v => v },
        abContactDmg:     { key: 'contactDamageMult',  type: 'float', fmt: v => v.toFixed(1) + 'x' },
        abPickupInterval: { key: 'pickupInterval',     type: 'float', fmt: v => v + 's' },
        abMaxSlots:       { key: 'maxSlots',           type: 'int',   fmt: v => v },
        abMatchTime:      { key: 'matchTime',          type: 'int',   fmt: v => v + 's' },
        abObstacles:      { key: 'obstacles',          type: 'int',   fmt: v => v },
        abSpeed:          { key: 'gameSpeed',          type: 'float', fmt: v => v.toFixed(1) + 'x' }
    };

    const SELECT_MAP = {
        abMatchMode: { key: 'matchMode' }
    };

    const TOGGLE_MAP = {
        abShrinkToggle: { key: 'shrinkEnabled' }
    };

    const STORAGE_KEY = 'balltok.arenaBattle.options';

    const Bridge = {
        active: false,
        running: false,
        world: null,
        canvas: null,
        ctx: null,
        rafId: null,
        lastTime: 0,
        _hookedTargets: [],
        _previousMode: 'classic',
        _autoHooked: false,

        init() {
            if (!window.ArenaBattle) {
                console.warn('[ArenaBridge] window.ArenaBattle introuvable. Vérifie l\'ordre des scripts.');
                return;
            }

            this._loadOptionsFromStorage();
            this._bindInputs();
            this._activateArenaButton();
            this._bindModeButtons();
            this._applyOptionsToMode();
            this._tryAutoHook();

            setTimeout(() => this._tryAutoHook(), 1000);
            setTimeout(() => this._tryAutoHook(), 3000);

            console.log('[ArenaBridge] Prêt. Options :', this.getOptions());
        },

        _loadOptionsFromStorage() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return;
                const opts = JSON.parse(raw);
                if (!opts || typeof opts !== 'object') return;

                for (const id in SLIDER_MAP) {
                    const el = document.getElementById(id);
                    if (el && opts[SLIDER_MAP[id].key] != null) {
                        el.value = opts[SLIDER_MAP[id].key];
                    }
                }
                for (const id in SELECT_MAP) {
                    const el = document.getElementById(id);
                    if (el && opts[SELECT_MAP[id].key] != null) {
                        el.value = opts[SELECT_MAP[id].key];
                    }
                }
                for (const id in TOGGLE_MAP) {
                    const el = document.getElementById(id);
                    if (el && opts[TOGGLE_MAP[id].key] != null) {
                        el.checked = !!opts[TOGGLE_MAP[id].key];
                    }
                }
                this._updateAllLabels();
            } catch (e) {
                console.warn('[ArenaBridge] Lecture storage KO:', e);
            }
        },

        _saveOptionsToStorage() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getOptions()));
            } catch (e) {}
        },

        _bindInputs() {
            for (const id in SLIDER_MAP) {
                const el = document.getElementById(id);
                if (!el) continue;
                el.addEventListener('input', () => {
                    this._updateLabel(id);
                    this._applyOptionsToMode();
                    this._saveOptionsToStorage();
                });
            }
            for (const id in SELECT_MAP) {
                const el = document.getElementById(id);
                if (!el) continue;
                el.addEventListener('change', () => {
                    this._applyOptionsToMode();
                    this._saveOptionsToStorage();
                    this._syncMatchTimeVisibility();
                });
            }
            for (const id in TOGGLE_MAP) {
                const el = document.getElementById(id);
                if (!el) continue;
                el.addEventListener('change', () => {
                    this._applyOptionsToMode();
                    this._saveOptionsToStorage();
                });
            }
            this._updateAllLabels();
            this._syncMatchTimeVisibility();
        },

        _updateAllLabels() {
            for (const id in SLIDER_MAP) this._updateLabel(id);
        },

        _updateLabel(id) {
            const cfg = SLIDER_MAP[id];
            const el = document.getElementById(id);
            const val = document.getElementById(id + 'Val');
            if (!el || !val) return;
            const v = parseFloat(el.value);
            val.textContent = cfg.fmt(v);
        },

        _syncMatchTimeVisibility() {
            const modeSel = document.getElementById('abMatchMode');
            const grp = document.getElementById('abMatchTimeGroup');
            if (!modeSel || !grp) return;
            grp.style.display = modeSel.value === 'timed' ? '' : 'none';
        },

        getOptions() {
            const opts = {};
            for (const id in SLIDER_MAP) {
                const el = document.getElementById(id);
                if (!el) continue;
                const cfg = SLIDER_MAP[id];
                let v = parseFloat(el.value);
                if (cfg.type === 'int') v = Math.round(v);
                opts[cfg.key] = v;
            }
            for (const id in SELECT_MAP) {
                const el = document.getElementById(id);
                if (!el) continue;
                opts[SELECT_MAP[id].key] = el.value;
            }
            for (const id in TOGGLE_MAP) {
                const el = document.getElementById(id);
                if (!el) continue;
                opts[TOGGLE_MAP[id].key] = !!el.checked;
            }
            return opts;
        },

        _applyOptionsToMode() {
            if (!window.ArenaBattle) return;
            window.ArenaBattle.applyOptions(this.getOptions());
        },

        _activateArenaButton() {
            const btn = document.querySelector('.mode-btn[data-mode="arenaBattle"]');
            if (!btn) return;
            btn.classList.remove('opacity-50');
            const badge = btn.querySelector('span:last-child');
            if (badge) {
                badge.textContent = 'Prêt';
                badge.className = 'text-[10px] text-amber-400 font-mono font-semibold';
            }
        },

        _bindModeButtons() {
            const container = document.getElementById('modeButtons');
            if (!container) return;

            container.addEventListener('click', (e) => {
                const btn = e.target.closest('.mode-btn');
                if (!btn) return;
                const mode = btn.dataset.mode;
                if (!mode) return;
                setTimeout(() => this._onModeChanged(mode), 30);
            });

            const obs = new MutationObserver(() => {
                const activeBtn = container.querySelector('.mode-btn.active, .mode-btn[data-active="true"]');
                if (activeBtn) {
                    const mode = activeBtn.dataset.mode;
                    if (mode && mode !== this._previousMode) {
                        this._onModeChanged(mode);
                    }
                }
            });
            obs.observe(container, { attributes: true, subtree: true, attributeFilter: ['class', 'data-active'] });
        },

        _onModeChanged(mode) {
            if (mode === this._previousMode) return;
            const wasActive = this.active;
            this._previousMode = mode;
            this.active = (mode === 'arenaBattle');

            if (this.active && !wasActive) {
                this.start();
            } else if (!this.active && wasActive) {
                this.stop();
            }
        },

        start() {
            console.log('[ArenaBridge] Démarrage du mode Arena Brawl');
            if (!window.ArenaBattle) return;

            this.canvas = document.getElementById('simCanvas');
            if (!this.canvas) {
                console.warn('[ArenaBridge] canvas #simCanvas introuvable');
                return;
            }
            this.ctx = this.canvas.getContext('2d');

            const seedInput = document.getElementById('manualSeedInput');
            const seed = seedInput ? parseInt(seedInput.value, 10) || 104291 : 104291;

            let prng;
            if (window.PRNG) {
                try {
                    prng = (typeof window.PRNG === 'function')
                        ? new window.PRNG(seed)
                        : window.PRNG;
                } catch (e) { prng = null; }
            }
            if (!prng || typeof prng.next !== 'function') {
                let a = seed >>> 0;
                prng = {
                    next() {
                        a |= 0; a = a + 0x6D2B79F5 | 0;
                        let t = Math.imul(a ^ a >>> 15, 1 | a);
                        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
                        return ((t ^ t >>> 14) >>> 0) / 4294967296;
                    }
                };
            }

            const world = {
                canvas: this.canvas,
                ctx: this.ctx,
                prng,
                balls: [],
                projectiles: [],
                time: 0,
                elapsedTime: 0,
                matchTime: 60,
                seed
            };
            this.world = world;

            world.arena = null;
            window.ArenaBattle.reset(world);

            const overlay = document.getElementById('victoryOverlay');
            if (overlay) overlay.classList.add('opacity-0', 'pointer-events-none');

            this.running = true;
            this.lastTime = performance.now();

            if (!this._autoHooked) {
                this._startLocalLoop();
            }
        },

        stop() {
            console.log('[ArenaBridge] Arrêt du mode Arena Brawl');
            this.running = false;
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        },

        _startLocalLoop() {
            const tick = (now) => {
                if (!this.running) return;
                const dt = Math.min(0.05, (now - this.lastTime) / 1000);
                this.lastTime = now;

                const speed = (window.ArenaBattle.options && window.ArenaBattle.options.gameSpeed) || 1;
                this.update(dt * speed);
                this.render();

                this.rafId = requestAnimationFrame(tick);
            };
            this.rafId = requestAnimationFrame(tick);
        },

        update(dt) {
            if (!this.running || !this.world) return;
            try {
                window.ArenaBattle.update(dt, this.world);
                this._syncHudCounters();
            } catch (e) {
                console.error('[ArenaBridge] update error:', e);
            }
        },

        render() {
            if (!this.running || !this.world) return;
            try {
                window.ArenaBattle.render(this.ctx, this.world);
            } catch (e) {
                console.error('[ArenaBridge] render error:', e);
            }
        },

        _syncHudCounters() {
            const w = this.world;
            const balls = document.getElementById('ballCounter');
            if (balls) balls.textContent = w.balls.filter(b => b.alive).length;
            const timer = document.getElementById('timerCounter');
            if (timer) {
                const t = Math.max(0, window.ArenaBattle.matchTime - window.ArenaBattle.elapsedTime);
                timer.textContent = t.toFixed(1) + 's';
            }
        },

        _tryAutoHook() {
            if (this._autoHooked) return;

            const candidates = [
                window.App,
                window.Simulation,
                window.sim,
                window.Sim,
                window.game,
                window.Game
            ].filter(Boolean);

            for (const target of candidates) {
                if (this._hookTarget(target)) {
                    this._autoHooked = true;
                    console.log('[ArenaBridge] Auto-hooké sur', target);
                    return;
                }
            }
        },

        _hookTarget(target) {
            if (!target || typeof target !== 'object') return false;
            if (this._hookedTargets.includes(target)) return false;

            const updateNames = ['update', 'tick', 'step', 'updateSim'];
            const renderNames = ['render', 'draw', 'paint', 'renderSim'];

            let updateFn = null, updateName = null;
            let renderFn = null, renderName = null;

            for (const n of updateNames) {
                if (typeof target[n] === 'function') {
                    updateFn = target[n]; updateName = n; break;
                }
            }
            for (const n of renderNames) {
                if (typeof target[n] === 'function') {
                    renderFn = target[n]; renderName = n; break;
                }
            }

            if (!updateFn) return false;

            const self = this;
            const origUpdate = updateFn;
            const origRender = renderFn;

            target[updateName] = function (dt, ...args) {
                if (self.active) {
                    self.world && self.running && window.ArenaBattle.update(dt, self.world);
                    self._syncHudCounters();
                    return;
                }
                return origUpdate.apply(this, [dt, ...args]);
            };

            if (renderName && origRender) {
                target[renderName] = function (...args) {
                    if (self.active) {
                        if (self.world) {
                            const ctx = (args[0] && args[0].canvas) ? args[0] : (self.ctx || null);
                            if (ctx) window.ArenaBattle.render(ctx, self.world);
                        }
                        return;
                    }
                    return origRender.apply(this, args);
                };
            }

            this._hookedTargets.push(target);
            return true;
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Bridge.init());
    } else {
        setTimeout(() => Bridge.init(), 0);
    }

    window.ArenaBattleBridge = Bridge;
})();