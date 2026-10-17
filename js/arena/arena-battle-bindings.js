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
        abArenaTop: ['arenaTop', 'percent', v => v + '%'],
        abArenaBottom: ['arenaBottom', 'percent', v => v + '%'],
        abArenaLeft: ['arenaLeft', 'percent', v => v + '%'],
        abArenaRight: ['arenaRight', 'percent', v => v + '%'],
        abObstacles: ['obstacles', 'int', v => String(v)],
        vortexObstacleCount: ['vortexObstacles', 'int', v => String(v)],
        abSpeed: ['gameSpeed', 'int', v => 'Vitesse ' + (v > 0 ? '+' : '') + v]
    };
    const STORAGE_KEY = 'ballystik.arena.options.v1';
    const SEED_KEY = 'ballystik.arena.seed.v1';

    const Bridge = {
        running: false,
        world: null,
        canvas: null,
        ctx: null,
        recordingCanvas: null,
        recordingCtx: null,
        rafId: null,
        lastTime: 0,
        fpsFrames: 0,
        fpsAt: 0,
        mediaRecorder: null,
        recordingChunks: [],
        ffmpeg: null,
        recording: false,
        seedSearchRunning: false,
        seedSearchCancelRequested: false,
        randomState: 1,

        withSeededRandom(callback) {
            const originalRandom = Math.random;
            Math.random = () => {
                this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
                return this.randomState / 4294967296;
            };
            try { return callback(); }
            finally { Math.random = originalRandom; }
        },

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
            const resizeGame = () => {
                this.resizeCanvas();
                if (this.world) window.ArenaBattle.reset(this.world);
            };
            // Suit aussi les changements de taille du conteneur (pas seulement la fenêtre).
            if ('ResizeObserver' in window) {
                this.resizeObserver = new ResizeObserver(resizeGame);
                this.resizeObserver.observe(document.getElementById('frameWrapper') || this.canvas);
            }
            window.addEventListener('resize', resizeGame);
            this.start();
        },

        loadOptions() {
            try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                Object.entries(SLIDERS).forEach(([id, cfg]) => {
                    const el = document.getElementById(id);
                    if (el && saved[cfg[0]] != null) {
                        let storedValue = saved[cfg[0]];
                        if (id === 'abSpeed') storedValue = saved.speedLevel != null ? saved.speedLevel : Math.round((Number(storedValue) - 1.5) / 0.25);
                        el.value = cfg[1] === 'percent' ? storedValue * 100 : storedValue;
                    }
                });
                const shrink = document.getElementById('abShrinkToggle');
                if (shrink && saved.shrinkEnabled != null) shrink.checked = !!saved.shrinkEnabled;
            } catch (_) {}
            this.updateLabels();
            this.syncShrinkOptions();
            const copyDimensions = document.getElementById('abCopyArenaDimensions');
            if (copyDimensions) copyDimensions.addEventListener('click', async () => {
                const dimensions = {
                    top: Number(document.getElementById('abArenaTop')?.value || 0) / 100,
                    bottom: Number(document.getElementById('abArenaBottom')?.value || 0) / 100,
                    left: Number(document.getElementById('abArenaLeft')?.value || 0) / 100,
                    right: Number(document.getElementById('abArenaRight')?.value || 0) / 100
                };
                const message = 'Dimensions de base de mon arène BallYstik :\n' +
                    'Haut : ' + (dimensions.top * 100) + '%\n' +
                    'Bas : ' + (dimensions.bottom * 100) + '%\n' +
                    'Gauche : ' + (dimensions.left * 100) + '%\n' +
                    'Droite : ' + (dimensions.right * 100) + '%\n\n' +
                    'ARENA_CONFIG = ' + JSON.stringify(dimensions, null, 2);
                try {
                    await navigator.clipboard.writeText(message);
                    const status = document.getElementById('abArenaCopyStatus');
                    if (status) status.textContent = 'Dimensions copiées. Colle-les dans la conversation.';
                } catch (_) {
                    const status = document.getElementById('abArenaCopyStatus');
                    if (status) status.textContent = message;
                }
            });
            const mapSelect = document.getElementById('arenaMapSelect');
            const defaultSettings = document.getElementById('defaultMapSettings');
            const vortexSettings = document.getElementById('vortexMapSettings');
            if (defaultSettings) defaultSettings.hidden = (mapSelect?.value || 'neon') !== 'neon';
            if (vortexSettings) vortexSettings.hidden = !['vortex', 'vortex_test'].includes(mapSelect?.value);
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
            if (document.getElementById('abSpeed')) options.gameSpeed = 1.5 + Number(document.getElementById('abSpeed').value) * 0.25;
            options.speedLevel = Number(document.getElementById('abSpeed')?.value || 0);
            options.matchMode = 'lastStanding';
            const mapSelect = document.getElementById('arenaMapSelect');
            options.arenaMap = mapSelect ? mapSelect.value : 'neon';
            try { options.obstaclePositions = JSON.parse(localStorage.getItem('ballystik.arena.obstaclePositions.v1') || 'null'); } catch (_) { options.obstaclePositions = null; }
            // L'arène reste fixe : le rétrécissement est désactivé sur toutes les cartes.
            options.shrinkEnabled = false;
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
            // Le contrôle est conservé visuellement pour expliquer le réglage, mais l'arène reste fixe.
            const shrinkToggle = document.getElementById('abShrinkToggle');
            if (shrinkToggle) { shrinkToggle.checked = false; shrinkToggle.disabled = true; }
            this.syncShrinkOptions();
            const seed = document.getElementById('manualSeedInput');
            if (seed) {
                try { seed.value = localStorage.getItem(SEED_KEY) || seed.value || '104291'; } catch (_) {}
                seed.addEventListener('change', () => {
                    try { localStorage.setItem(SEED_KEY, String(this.getSeed())); } catch (_) {}
                });
            }
            const findSeed = document.getElementById('findWinningSeedBtn');
            if (findSeed) findSeed.addEventListener('click', () => {
                if (this.seedSearchRunning) {
                    this.seedSearchCancelRequested = true;
                    return;
                }
                this.searchWinningSeed();
            });

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
                const vortexSettings = document.getElementById('vortexMapSettings');
                if (mapSettings) mapSettings.hidden = mapSelect.value !== 'neon';
                if (vortexSettings) vortexSettings.hidden = !['vortex', 'vortex_test'].includes(mapSelect.value);
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
            this.randomState = seed >>> 0;
            this.world = {
                canvas: this.canvas, ctx: this.ctx, prng, seed,
                balls: [], projectiles: [], time: 0, elapsedTime: 0, matchTime: 60
            };
            window.ArenaBattle.applyOptions(this.getOptions());
            this.withSeededRandom(() => window.ArenaBattle.reset(this.world));
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

        async searchWinningSeed() {
            if (this.seedSearchRunning || !window.ArenaBattle) return;
            this.seedSearchRunning = true;
            this.seedSearchCancelRequested = false;
            const button = document.getElementById('findWinningSeedBtn');
            const status = document.getElementById('seedSearchStatus');
            const originalSeed = this.getSeed();
            const firstSeed = originalSeed >>> 0 || 1;

            // Réglages de recherche favorisant les éliminations, conservés aussi pour
            // rejouer exactement la seed trouvée dans la partie réelle.
            const hpInput = document.getElementById('abMaxHp');
            const contactInput = document.getElementById('abContactDmg');
            if (hpInput) hpInput.value = '50';
            if (contactInput) contactInput.value = '2';
            this.updateLabels();
            this.saveOptions();
            // Recherche continue jusqu'à trouver une seed ou jusqu'à ce que l'utilisateur l'arrête.
            const step = 1 / 60;
            const totalSteps = 3600;
            const frameBudgetMs = 8;
            let foundSeed = null;
            let attempts = 0;
            let wasCancelled = false;
            this.running = false;
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this.rafId = null;
            if (button) {
                button.innerHTML = '<i class="fa-solid fa-stop mr-1"></i> Arrêter la recherche';
                button.classList.add('border-red-500', 'text-red-200');
            }
            const setStatus = message => { if (status) status.textContent = message; };
            const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

            try {
                // Même principe que Hypnorai : la recherche est découpée en petits lots
                // pour laisser le navigateur répondre et mettre à jour la progression.
                for (attempts = 0; !this.seedSearchCancelRequested && attempts < 10000; attempts++) {
                    const candidateSeed = (firstSeed + attempts) >>> 0 || 1;
                    let state = candidateSeed;
                    const prng = { next() {
                        state = (state + 0x6D2B79F5) >>> 0;
                        let t = state;
                        t = Math.imul(t ^ (t >>> 15), t | 1);
                        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
                    }};
                    const trialWorld = {
                        canvas: this.canvas, ctx: this.ctx, prng, seed: candidateSeed,
                        balls: [], projectiles: [], time: 0, elapsedTime: 0, matchTime: 60
                    };
                    this.world = trialWorld;
                    this.randomState = candidateSeed;
                    let frame = 0;
                    let candidateWorked = false;

                    this.withSeededRandom(() => {
                        window.ArenaBattle.applyOptions({ ...this.getOptions(), shrinkEnabled: false, matchTime: 60 });
                        window.ArenaBattle.reset(trialWorld);
                        trialWorld.playSound = () => {};
                    });

                    // Conserver le même état de simulation entre les tranches de travail.
                    while (frame < totalSteps && !this.seedSearchCancelRequested) {
                        const sliceStart = performance.now();
                        this.withSeededRandom(() => {
                            while (frame < totalSteps && performance.now() - sliceStart < frameBudgetMs) {
                                window.ArenaBattle.update(step, trialWorld);
                                frame++;
                                const alive = trialWorld.balls.filter(ball => ball.alive && !ball.isClone);
                                if (window.ArenaBattle.winnerDisplayActive || window.ArenaBattle.finished) {
                                    candidateWorked = alive.length === 1
                                        && window.ArenaBattle.winnerDisplayActive
                                        && Math.abs(window.ArenaBattle.elapsedTime - 60) < 1e-5;
                                    frame = totalSteps;
                                    break;
                                }
                            }
                        });
                        if (frame < totalSteps && !this.seedSearchCancelRequested) {
                            setStatus('Seed #' + candidateSeed + ' : simulation ' + Math.min(60, frame / 60).toFixed(1) + ' / 60 s • ' + (attempts + 1) + ' seeds testées.');
                            await nextFrame();
                        }
                    }

                    if (this.seedSearchCancelRequested) break;
                    if (candidateWorked) {
                        foundSeed = candidateSeed;
                        break;
                    }
                    if ((attempts + 1) % 5 === 0) {
                        setStatus('Recherche en cours… ' + (attempts + 1) + ' seeds testées. Dernière seed : #' + candidateSeed + '.');
                        await nextFrame();
                    }
                }
            } catch (error) {
                console.error('[BallYstik] Recherche de seed échouée :', error);
                setStatus('Erreur pendant la recherche : ' + (error.message || 'erreur inconnue'));
            } finally {
                wasCancelled = this.seedSearchCancelRequested;
                this.seedSearchRunning = false;
                this.seedSearchCancelRequested = false;
                if (button) {
                    button.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i> Rechercher une seed gagnante à 1:00';
                    button.classList.remove('border-red-500', 'text-red-200');
                }
            }

            if (foundSeed != null) {
                const input = document.getElementById('manualSeedInput');
                if (input) input.value = String(foundSeed);
                try { localStorage.setItem(SEED_KEY, String(foundSeed)); } catch (_) {}
                setStatus('✅ SEED TROUVÉE : #' + foundSeed + ' — lancement de la partie.');
                // Lance immédiatement la seed trouvée : aucun clic supplémentaire nécessaire.
                this.start();
                if ('Notification' in window && Notification.permission === 'granted') {
                    try { new Notification('BallYstik — partie trouvée', { body: 'Seed #' + foundSeed + ' : la partie démarre.' }); } catch (_) {}
                }
            } else {
                const input = document.getElementById('manualSeedInput');
                if (wasCancelled) {
                    if (input) input.value = String(originalSeed);
                    setStatus('Recherche arrêtée. Seed active restaurée : #' + originalSeed + '.');
                } else {
                    const nextSeed = (firstSeed + Math.max(1, attempts)) >>> 0 || 1;
                    if (input) input.value = String(nextSeed);
                    try { localStorage.setItem(SEED_KEY, String(nextSeed)); } catch (_) {}
                    setStatus('Aucune seed trouvée après ' + attempts + ' essais. Réessaie : les réglages sont conservés et la recherche peut être relancée à partir de #' + nextSeed + '.');
                }
                this.start();
            }
        },

        async startRecording() {
            if (!this.canvas || !this.canvas.captureStream || !window.MediaRecorder) {
                this.setRecordStatus('Enregistrement non supporté par ce navigateur.', true);
                return;
            }
            try {
                // Capture dans une surface fixe 9:16 pour produire un MP4 TikTok en 1080x1920,
                // indépendamment de la taille d'affichage du canvas dans la page.
                this.recordingCanvas = document.createElement('canvas');
                this.recordingCanvas.width = 1080;
                this.recordingCanvas.height = 1920;
                this.recordingCtx = this.recordingCanvas.getContext('2d', { alpha: false });
                if (!this.recordingCtx) throw new Error('Impossible de créer le canvas vidéo.');
                this.recordingCtx.fillStyle = '#080a10';
                this.recordingCtx.fillRect(0, 0, 1080, 1920);
                this.recordingCtx.drawImage(this.canvas, 0, 0, 1080, 1920);
                const stream = this.recordingCanvas.captureStream(60);
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
                await this.ffmpeg.run('-i', inputName, '-an', '-vf', 'scale=1080:1920', '-r', '60', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outputName);
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
                this.recordingCanvas = null;
                this.recordingCtx = null;
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
                this.withSeededRandom(() => window.ArenaBattle.update(dt, this.world));
                window.ArenaBattle.render(this.ctx, this.world);
                // Chaque image du jeu est recopiée vers la sortie vidéo fixe en 1080x1920.
                if (this.recording && this.recordingCtx && this.recordingCanvas) {
                    this.recordingCtx.drawImage(this.canvas, 0, 0, this.recordingCanvas.width, this.recordingCanvas.height);
                }
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