/* Arena Brawl — contrôleur autonome du match et des réglages. */
(function () {
    'use strict';

    const SLIDERS = {
        abBallCount: ['ballCount', 'int', v => String(v)],
        abMaxHp: ['maxHp', 'int', v => String(v)],
        abContactDmg: ['contactDamageMult', 'float', v => v.toFixed(1) + 'x'],
        abPickupInterval: ['pickupInterval', 'float', v => v + 's'],
        abMaxSlots: ['maxSlots', 'int', v => String(v)],
        abShrinkStart: ['shrinkStart', 'int', v => v + 's'],
        abShrinkRate: ['shrinkRate', 'int', v => v + ' px/s'],
        abShrinkMax: ['shrinkMax', 'percent', v => v + '%'],
        abObstacles: ['obstacles', 'int', v => String(v)],
        abSpeed: ['gameSpeed', 'int', v => 'Vitesse ' + (v > 0 ? '+' : '') + v]
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
        mediaRecorder: null,
        recordingChunks: [],
        ffmpeg: null,
        recording: false,

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
                    if (el && saved[cfg[0]] != null) {\n                        let storedValue = saved[cfg[0]];\n                        if (id === 'abSpeed') storedValue = saved.speedLevel != null ? saved.speedLevel : Math.round((Number(storedValue) - 1.5) / 0.25);\n                        el.value = cfg[1] === 'percent' ? Math.round(storedValue * 100) : storedValue;\n                    }
                });
                const shrink = document.getElementById('abShrinkToggle');
                if (shrink && saved.shrinkEnabled != null) shrink.checked = !!saved.shrinkEnabled;
            } catch (_) {}
            this.updateLabels();
            this.syncShrinkOptions();
        },

        getOptions() {
            const options = {};
            Object.entries(SLIDERS).forEach(([id, cfg]) => {
                const el = document.getElementById(id);
                if (!el) return;
                const value = Number(el.value);
                options[cfg[0]] = cfg[1] === 'int' || cfg[1] === 'percent' ? (cfg[1] === 'percent' ? value / 100 : Math.round(value)) : value;
            });
            const shrink = document.getElementById('abShrinkToggle');
            if (document.getElementById('abSpeed')) options.gameSpeed = 1.5 + Number(document.getElementById('abSpeed').value) * 0.25;\n            options.speedLevel = Number(document.getElementById('abSpeed')?.value || 0);\n            options.matchMode = 'lastStanding';
            const mapSelect = document.getElementById('arenaMapSelect');
            options.arenaMap = mapSelect ? mapSelect.value : 'neon';
            try { options.obstaclePositions = JSON.parse(localStorage.getItem('ballystik.arena.obstaclePositions.v1') || 'null'); } catch (_) { options.obstaclePositions = null; }
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

        syncShrinkOptions() {
            const toggle = document.getElementById('abShrinkToggle');
            const options = document.getElementById('abShrinkOptions');
            if (toggle && options) options.hidden = !toggle.checked;
        },

        bindControls() {
            Object.keys(SLIDERS).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', () => {
                    if (id === 'abObstacles') { try { localStorage.removeItem('ballystik.arena.obstaclePositions.v1'); } catch (_) {} }
                    this.updateLabels();
                    this.saveOptions();
                    if (window.ArenaBattle) window.ArenaBattle.applyOptions(this.getOptions());
                });
            });
            ['abShrinkToggle'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('change', () => {
                    this.saveOptions();
                            this.syncShrinkOptions();
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
            ['resetBtn'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.addEventListener('click', () => this.start());
            });
            const newGame = document.getElementById('newGameBtn');
            if (newGame) newGame.addEventListener('click', () => {
                // Seed entière aléatoire sur 32 bits, non nulle pour rester compatible avec getSeed().
                const randomSeed = (Math.floor(Math.random() * 0xFFFFFFFF) + 1) >>> 0 || 1;
                if (seed) seed.value = String(randomSeed);
                try { localStorage.setItem(SEED_KEY, String(randomSeed)); } catch (_) {}
                this.start();
            });
            const play = document.getElementById('playPauseBtn');
            if (play) play.addEventListener('click', () => this.togglePause());

            const mapSelect = document.getElementById('arenaMapSelect');
            if (mapSelect) mapSelect.addEventListener('change', () => {
                this.saveOptions();
                const mapSettings = document.getElementById('defaultMapSettings');
                if (mapSettings) mapSettings.hidden = mapSelect.value !== 'neon';
                try { localStorage.removeItem('ballystik.arena.obstaclePositions.v1'); } catch (_) {}
                if (window.ArenaBattle) window.ArenaBattle.applyOptions({ ...this.getOptions(), obstaclePositions: null });
                this.start();
            });
            const randomizeObstacles = document.getElementById('randomizeObstaclesBtn');
            if (randomizeObstacles) randomizeObstacles.addEventListener('click', () => {
                const countEl = document.getElementById('abObstacles');
                const count = Math.max(0, Math.min(10, Number(countEl && countEl.value) || 0));
                const positions = [];
                const minDistance = 0.105;
                let attempts = 0;
                while (positions.length < count && attempts < count * 160) {
                    attempts++;
                    const candidate = { x: 0.22 + Math.random() * 0.56, y: 0.16 + Math.random() * 0.68 };
                    if (positions.every(p => Math.hypot((p.x-candidate.x)*0.65, p.y-candidate.y) > minDistance)) positions.push(candidate);
                }
                try { localStorage.setItem('ballystik.arena.obstaclePositions.v1', JSON.stringify(positions)); } catch (_) {}
                this.saveOptions();
                if (window.ArenaBattle) window.ArenaBattle.applyOptions({ ...this.getOptions(), obstacles: positions.length, obstaclePositions: positions });
                this.start();
            });

            const record = document.getElementById('recordBtn');
            if (record) record.addEventListener('click', () => this.recording ? this.stopRecording() : this.startRecording());
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

        async startRecording() {
            if (!this.canvas || !this.canvas.captureStream || !window.MediaRecorder) {
                this.setRecordStatus('Enregistrement non supporté par ce navigateur.', true);
                return;
            }
            try {
                const stream = this.canvas.captureStream(60);
                const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                    ? 'video/webm;codecs=vp9'
                    : (MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm');
                this.recordingChunks = [];
                this.mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
                this.mediaRecorder.ondataavailable = event => {
                    if (event.data && event.data.size) this.recordingChunks.push(event.data);
                };
                this.mediaRecorder.onerror = event => {
                    console.error('[BallYstik] Erreur MediaRecorder :', event.error || event);
                    this.setRecordStatus('Erreur pendant l’enregistrement.', true);
                };
                this.mediaRecorder.onstop = () => {
                    stream.getTracks().forEach(track => track.stop());
                    this.convertRecordingToMp4(mimeType);
                };
                this.mediaRecorder.start(250);
                this.recording = true;
                const text = document.getElementById('recordText');
                const icon = document.getElementById('recordIcon');
                const button = document.getElementById('recordBtn');
                if (text) text.textContent = 'Arrêter & exporter';
                if (icon) icon.className = 'fa-solid fa-stop text-red-400';
                if (button) button.classList.add('border-red-500');
                this.setRecordStatus('Enregistrement en cours…');
            } catch (error) {
                console.error('[BallYstik] Impossible de démarrer l’enregistrement :', error);
                this.setRecordStatus('Impossible de démarrer l’enregistrement.', true);
            }
        },

        stopRecording() {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;
            this.recording = false;
            const text = document.getElementById('recordText');
            const icon = document.getElementById('recordIcon');
            if (text) text.textContent = 'Conversion MP4…';
            if (icon) icon.className = 'fa-solid fa-spinner fa-spin text-amber-300';
            const button = document.getElementById('recordBtn');
            if (button) button.disabled = true;
            this.setRecordStatus('Conversion en MP4 en cours… gardez cette page ouverte.');
            this.mediaRecorder.stop();
        },

        setRecordStatus(message, isError = false) {
            const status = document.getElementById('recordStatus');
            if (status) {
                status.textContent = message;
                status.className = 'absolute top-14 left-1/2 -translate-x-1/2 z-30 px-3 py-2 rounded-lg text-xs font-semibold shadow-lg ' +
                    (isError ? 'bg-red-950/95 text-red-200 border border-red-500/40' : 'bg-zinc-950/90 text-zinc-200 border border-zinc-700/60');
                status.classList.remove('hidden');
            }
        },

        async convertRecordingToMp4(mimeType) {
            try {
                const sourceBlob = new Blob(this.recordingChunks, { type: mimeType });
                if (!sourceBlob.size) throw new Error('Le fichier vidéo enregistré est vide.');
                if (!window.FFmpeg || !window.FFmpeg.createFFmpeg) {
                    throw new Error('Le convertisseur MP4 ne s’est pas chargé. Vérifiez votre connexion puis rechargez la page.');
                }
                if (typeof SharedArrayBuffer === 'undefined' || !window.crossOriginIsolated) {
                    throw new Error('Le serveur doit activer COOP/COEP pour autoriser SharedArrayBuffer. Redéployez la version v2 avec les en-têtes de sécurité inclus.');
                }
                if (!this.ffmpeg) {
                    this.ffmpeg = window.FFmpeg.createFFmpeg({
                        log: false,
                        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
                    });
                }
                if (!this.ffmpeg.isLoaded()) await this.ffmpeg.load();
                const inputName = 'ballystik-recording.webm';
                const outputName = 'ballystik-recording.mp4';
                this.ffmpeg.FS('writeFile', inputName, new Uint8Array(await sourceBlob.arrayBuffer()));
                await this.ffmpeg.run('-i', inputName, '-an', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outputName);
                const output = this.ffmpeg.FS('readFile', outputName);
                const mp4Blob = new Blob([output.buffer], { type: 'video/mp4' });
                const url = URL.createObjectURL(mp4Blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'ballystik-' + new Date().toISOString().replace(/[:.]/g, '-') + '.mp4';
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(url), 60000);
                this.setRecordStatus('MP4 téléchargé.');
            } catch (error) {
                console.error('[BallYstik] Conversion MP4 échouée :', error);
                this.setRecordStatus('Échec de l’export MP4 : ' + (error.message || 'erreur inconnue'), true);
            } finally {
                this.recording = false;
                this.recordingChunks = [];
                this.mediaRecorder = null;
                const text = document.getElementById('recordText');
                const icon = document.getElementById('recordIcon');
                const button = document.getElementById('recordBtn');
                if (text) text.textContent = 'Enregistrer MP4';
                if (icon) icon.className = 'fa-solid fa-circle text-red-400';
                if (button) button.disabled = false;
                if (button) button.classList.remove('border-red-500');
            }
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
            const realDt = Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000));
            const gameSpeed = Number(window.ArenaBattle.getOptions().gameSpeed) || 1;
            const dt = realDt * gameSpeed;
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