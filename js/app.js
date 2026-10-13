/* ==========================================================================
   Application Bootstrap & UI Event Handlers
   Connecte les panneaux gauche/droite, les réglages, et le chercheur de seed.
   ========================================================================== */

window.addEventListener('DOMContentLoaded', () => {
    const sim = new Simulation();
    window.sim = sim; // Expose for debugging

    // Unlock Web Audio on First User Gesture
    const unlockAudio = () => {
        if (window.audioSynth) {
            window.audioSynth.init();
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    // Render Loop (60 FPS normalized)
    const targetFrameTime = 1000 / 60;
    let lastFrameTime = 0;
    let simulationAccumulator = 0;

    function animate(timestamp) {
        if (!lastFrameTime) lastFrameTime = timestamp;
        // Fixed-step simulation: never speed up physics to compensate for a slow render frame.
        // The seed evaluator simulates 60 fixed ticks per simulated second, so live play must do the same.
        const elapsed = Math.min(timestamp - lastFrameTime, 250);
        lastFrameTime = timestamp;
        simulationAccumulator += elapsed;

        let steps = 0;
        const maxCatchUpSteps = 8;
        while (simulationAccumulator >= targetFrameTime && steps < maxCatchUpSteps) {
            sim.update(1);
            simulationAccumulator -= targetFrameTime;
            steps++;
        }

        // If the tab/device falls far behind, discard excess backlog rather than fast-forwarding the game.
        if (steps === maxCatchUpSteps && simulationAccumulator >= targetFrameTime) {
            simulationAccumulator = simulationAccumulator % targetFrameTime;
        }

        sim.draw();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    // Accordions Toggle Controller
    document.querySelectorAll('.accordion-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            const icon = btn.querySelector('.fa-chevron-down');
            if (targetEl) {
                targetEl.classList.toggle('open');
                if (targetEl.classList.contains('open')) {
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    icon.style.transform = 'rotate(-90deg)';
                }
            }
        });
    });

    // Mobile Sidebar Toggles (Left & Right)
    const leftSidebar = document.getElementById('leftSidebar');
    const rightSidebar = document.getElementById('rightSidebar');

    const toggleLeftSidebarBtn = document.getElementById('toggleLeftSidebarBtn');
    const closeLeftSidebarBtn = document.getElementById('closeLeftSidebarBtn');
    if (toggleLeftSidebarBtn && leftSidebar) {
        toggleLeftSidebarBtn.addEventListener('click', () => {
            leftSidebar.classList.toggle('-translate-x-full');
            if (rightSidebar) rightSidebar.classList.add('translate-x-full');
        });
    }
    if (closeLeftSidebarBtn && leftSidebar) {
        closeLeftSidebarBtn.addEventListener('click', () => {
            leftSidebar.classList.add('-translate-x-full');
        });
    }

    const toggleRightSidebarBtn = document.getElementById('toggleRightSidebarBtn');
    const closeRightSidebarBtn = document.getElementById('closeRightSidebarBtn');
    if (toggleRightSidebarBtn && rightSidebar) {
        toggleRightSidebarBtn.addEventListener('click', () => {
            rightSidebar.classList.toggle('translate-x-full');
            if (leftSidebar) leftSidebar.classList.add('-translate-x-full');
        });
    }
    if (closeRightSidebarBtn && rightSidebar) {
        closeRightSidebarBtn.addEventListener('click', () => {
            rightSidebar.classList.add('translate-x-full');
        });
    }

    // Play / Pause Controls
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = document.getElementById('playPauseIcon');
    const playPauseText = document.getElementById('playPauseText');

    function togglePlayPause() {
        sim.paused = !sim.paused;
        if (sim.paused) {
            playPauseIcon.className = 'fa-solid fa-play text-emerald-400';
            playPauseText.textContent = 'Reprendre';
        } else {
            playPauseIcon.className = 'fa-solid fa-pause text-cyan-400';
            playPauseText.textContent = 'Pause';
        }
    }

    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);

    // Fullscreen Toggle
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
        } else if (e.key === 'r' || e.key === 'R') {
            sim.initMode();
        } else if (e.key === 'b' || e.key === 'B') {
            const innermost = sim.activeMode && sim.activeMode.rings ? sim.activeMode.rings[0] : null;
            const spawnOffset = innermost ? innermost.radius * 0.35 : 10;
            sim.spawnBall(sim.center.x, sim.center.y - spawnOffset);
        }
    });

    // Scroll-lock helper for checkbox changes
    const lockScroll = (containerId, fn) => {
        const container = document.getElementById(containerId);
        return (e) => {
            const top = container ? container.scrollTop : 0;
            fn(e);
            if (container) {
                container.scrollTop = top;
                requestAnimationFrame(() => {
                    container.scrollTop = top;
                });
            }
        };
    };

    // =========================================================================
    // Mode Settings Controls (Left Sidebar)
    // =========================================================================
    // Réglages spécifiques aux modes arcade
    const arcadeControls = [
        ['accGapSize','gapSizeDeg','accGapSizeVal',v=>v+'°'],
        ['accGapAngle','gapAngleDeg','accGapAngleVal',v=>v+'°'+(Number(v)===30?' (2h)':'')],
        ['accFreeze','freezeInterval','accFreezeVal',v=>v+' s'],
        ['accSpeed','ballSpeed','accSpeedVal',v=>Number(v).toFixed(1)],
        ['mulInitial','initialBalls','mulInitialVal',v=>v],
        ['mulSpawn','spawnPerBounce','mulSpawnVal',v=>v],
        ['mulDiameter','radiusScale','mulDiameterVal',v=>v+'%'],
        ['mulMax','maxBalls','mulMaxVal',v=>v],
        ['mulSpeed','ballSpeed','mulSpeedVal',v=>v],
        ['battleCount','ballCount','battleCountVal',v=>v],
        ['battleLines','startingLines','battleLinesVal',v=>v],
        ['battleGain','wallLineGain','battleGainVal',v=>v],
        ['battleSpeed','battleSpeed','battleSpeedVal',v=>v],
        ['battleSpread','lineSpreadDeg','battleSpreadVal',v=>v+'°']
    ];
    const syncArcadeModePanel = () => {
        const id=sim.activeModeId;
        document.getElementById('accumulationOptions')?.classList.toggle('hidden',id!=='accumulation');
        document.getElementById('multiplyOptions')?.classList.toggle('hidden',id!=='multiply');
        document.getElementById('battleOptions')?.classList.toggle('hidden',id!=='battleLines');
    };
    arcadeControls.forEach(([id,prop,labelId,format])=>{
        const el=document.getElementById(id); if(!el)return;
        el.addEventListener('input',()=>{
            const mode=sim.activeMode;if(!mode)return;
            mode[prop]=Number(el.value);
            const label=document.getElementById(labelId);if(label)label.textContent=format(el.value);
            if(['mulInitial','mulSpawn','mulDiameter','mulMax','mulSpeed','battleCount','battleLines','battleGain','battleSpeed','battleSpread','accFreeze','accSpeed'].includes(id))sim.initMode();
        });
    });
    document.querySelectorAll('.mode-btn').forEach(btn=>btn.addEventListener('click',()=>setTimeout(syncArcadeModePanel,0)));
    syncArcadeModePanel();

    const classicRingsSlider = document.getElementById('classicRingsSlider');
    const classicRingsVal = document.getElementById('classicRingsVal');
    if (classicRingsSlider && sim.activeMode) {
        classicRingsSlider.addEventListener('input', (e) => {
            sim.activeMode.ringCount = parseInt(e.target.value, 10);
            if (classicRingsVal) classicRingsVal.textContent = sim.activeMode.ringCount;
            sim.activeMode.setupRings(true);
        });
    }

    const classicRotationSlider = document.getElementById('classicRotationSlider');
    const classicRotationValue = document.getElementById('classicRotationValue');
    if (classicRotationSlider && sim.activeMode) {
        classicRotationSlider.addEventListener('input', (e) => {
            sim.activeMode.rotationMultiplier = parseFloat(e.target.value);
            if (classicRotationValue) classicRotationValue.textContent = `${sim.activeMode.rotationMultiplier.toFixed(2)}x`;
        });
    }

    const classicDirSelect = document.getElementById('classicDirSelect');
    if (classicDirSelect && sim.activeMode) {
        classicDirSelect.addEventListener('change', (e) => {
            sim.activeMode.rotationDirection = e.target.value;
            sim.activeMode.setupRings(false);
        });
    }

    const classicGapModeSelect = document.getElementById('classicGapModeSelect');
    const classicGapOffsetGroup = document.getElementById('classicGapOffsetGroup');
    const classicGapOffsetSlider = document.getElementById('classicGapOffsetSlider');
    const classicGapOffsetValue = document.getElementById('classicGapOffsetValue');
    if (classicGapModeSelect && sim.modes.classic) {
        classicGapModeSelect.addEventListener('change', (e) => {
            sim.modes.classic.initialGapMode = e.target.value;
            if (classicGapOffsetGroup) classicGapOffsetGroup.classList.toggle('hidden', e.target.value !== 'offset');
            sim.modes.classic.setupRings(true);
        });
    }
    if (classicGapOffsetSlider && sim.modes.classic) {
        classicGapOffsetSlider.addEventListener('input', (e) => {
            sim.modes.classic.gapOffset = Number(e.target.value);
            if (classicGapOffsetValue) classicGapOffsetValue.textContent = `${sim.modes.classic.gapOffset}°`;
            sim.modes.classic.setupRings(true);
        });
    }

    const classicGapSlider = document.getElementById('classicGapSlider');
    const classicGapVal = document.getElementById('classicGapVal');
    if (classicGapSlider && sim.activeMode) {
        classicGapSlider.addEventListener('input', (e) => {
            sim.activeMode.gapSize = Math.PI * parseFloat(e.target.value);
            const val = parseFloat(e.target.value);
            const label = val <= 0.35 ? 'Étroite' : val <= 0.6 ? 'Moyenne' : 'Large';
            if (classicGapVal) classicGapVal.textContent = label;
            sim.activeMode.updateGeometry();
        });
    }

    const classicPaletteSelect = document.getElementById('classicPaletteSelect');
    const classicPalettePreview = document.getElementById('classicPalettePreview');
    if (classicPaletteSelect && sim.activeMode) {
        classicPaletteSelect.addEventListener('change', (e) => {
            sim.paletteName = e.target.value;
            sim.modes.classic.paletteName = e.target.value;
            if (classicPalettePreview) classicPalettePreview.textContent = e.target.options[e.target.selectedIndex].text;
            sim.modes.classic.updateRingColors();
        });
    }

    const classicMultiColorToggle = document.getElementById('classicMultiColorToggle');
    if (classicMultiColorToggle && sim.activeMode) {
        classicMultiColorToggle.addEventListener('change', lockScroll('rightSettingsContainer', (e) => {
            sim.multiColor = e.target.checked;
            sim.modes.classic.multiColor = e.target.checked;
            sim.modes.classic.updateRingColors();
        }));
    }

    const classicSpikeToggle = document.getElementById('classicSpikeToggle');
    const spikeGroup = document.getElementById('spikeCountGroup');
    if (classicSpikeToggle && sim.activeMode) {
        classicSpikeToggle.addEventListener('change', lockScroll('leftSettingsContainer', (e) => {
            sim.activeMode.spikesEnabled = e.target.checked;
            if (spikeGroup) spikeGroup.classList.toggle('hidden', !sim.activeMode.spikesEnabled);
        }));
    }

    const classicSpikeCountSlider = document.getElementById('classicSpikeCountSlider');
    const classicSpikeCountValue = document.getElementById('classicSpikeCountValue');
    if (classicSpikeCountSlider && sim.activeMode) {
        classicSpikeCountSlider.addEventListener('input', (e) => {
            sim.activeMode.spikeCount = parseInt(e.target.value, 10);
            if (classicSpikeCountValue) classicSpikeCountValue.textContent = sim.activeMode.spikeCount;
        });
    }

    // =========================================================================
    // Boule & Physique Controls (Left Sidebar)
    // =========================================================================
    const gravitySlider = document.getElementById('gravitySlider');
    const gravityVal = document.getElementById('gravityVal');
    if (gravitySlider) {
        gravitySlider.addEventListener('input', (e) => {
            sim.gravity = parseFloat(e.target.value);
            if (gravityVal) gravityVal.textContent = sim.gravity.toFixed(2);
        });
    }

    const bounceSlider = document.getElementById('bounceSlider');
    const bounceVal = document.getElementById('bounceVal');
    if (bounceSlider) {
        bounceSlider.addEventListener('input', (e) => {
            sim.bounciness = parseFloat(e.target.value);
            if (bounceVal) bounceVal.textContent = `${sim.bounciness.toFixed(2)}x`;
        });
    }

    const radiusSlider = document.getElementById('radiusSlider');
    const radiusVal = document.getElementById('radiusVal');
    if (radiusSlider) {
        radiusSlider.addEventListener('input', (e) => {
            sim.ballRadius = parseInt(e.target.value, 10);
            if (radiusVal) radiusVal.textContent = `${sim.ballRadius}px`;
            sim.balls.forEach(b => b.radius = sim.ballRadius);
        });
    }

    const speedBoostSlider = document.getElementById('speedBoostSlider');
    const speedBoostVal = document.getElementById('speedBoostVal');
    if (speedBoostSlider) {
        speedBoostSlider.addEventListener('input', (e) => {
            sim.speedBoost = parseFloat(e.target.value);
            const pct = Math.round((sim.speedBoost - 1.0) * 100);
            if (speedBoostVal) speedBoostVal.textContent = `+${pct}%`;
        });
    }

    // Reset to current mode defaults button
    const resetModeDefaultsBtn = document.getElementById('resetModeDefaultsBtn');
    if (resetModeDefaultsBtn) {
        resetModeDefaultsBtn.addEventListener('click', () => {
            sim.applyModeConfig('classic');

            // Sync UI sliders
            if (gravitySlider) gravitySlider.value = sim.gravity;
            if (gravityVal) gravityVal.textContent = sim.gravity.toFixed(2);

            if (bounceSlider) bounceSlider.value = sim.bounciness;
            if (bounceVal) bounceVal.textContent = `${sim.bounciness.toFixed(2)}x`;

            if (radiusSlider) radiusSlider.value = sim.ballRadius;
            if (radiusVal) radiusVal.textContent = `${sim.ballRadius}px`;

            if (speedBoostSlider) speedBoostSlider.value = sim.speedBoost;
            if (speedBoostVal) speedBoostVal.textContent = `+${Math.round((sim.speedBoost - 1) * 100)}%`;

            if (classicRingsSlider) classicRingsSlider.value = sim.activeMode.ringCount;
            if (classicRingsVal) classicRingsVal.textContent = sim.activeMode.ringCount;

            if (classicRotationSlider) classicRotationSlider.value = sim.activeMode.rotationMultiplier;
            if (classicRotationValue) classicRotationValue.textContent = `${sim.activeMode.rotationMultiplier.toFixed(2)}x`;
        });
    }

    // =========================================================================
    // Deterministic Seed & Duration Searcher Controller
    // =========================================================================
    let targetDuration = 65;
    const customDurationSlider = document.getElementById('customDurationSlider');
    const targetDurationVal = document.getElementById('targetDurationVal');
    const findSeedBtn = document.getElementById('findSeedBtn');
    const findSeedBtnText = document.getElementById('findSeedBtnText');
    const seedSearchStatusBox = document.getElementById('seedSearchStatusBox');
    const searchCountDisplay = document.getElementById('searchCountDisplay');
    const bestCandidateDisplay = document.getElementById('bestCandidateDisplay');
    const manualSeedInput = document.getElementById('manualSeedInput');
    const applySeedBtn = document.getElementById('applySeedBtn');
    const copySeedBtn = document.getElementById('copySeedBtn');
    const playBestSeedBtn = document.getElementById('playBestSeedBtn');
    
    function applyAccumulationSettings(settings) {
        if (!settings || sim.activeModeId !== 'accumulation') return;
        const mode = sim.activeMode;
        Object.assign(mode, {
            gapSizeDeg: settings.gapSizeDeg ?? mode.gapSizeDeg,
            gapAngleDeg: settings.gapAngleDeg ?? mode.gapAngleDeg,
            freezeInterval: settings.freezeInterval ?? mode.freezeInterval,
            ballSpeed: settings.ballSpeed ?? mode.ballSpeed
        });
        if (settings.gravity != null) sim.gravity = settings.gravity;
        if (settings.bounciness != null) sim.bounciness = settings.bounciness;
        const controls = [
            ['accGapSize', mode.gapSizeDeg], ['accGapAngle', mode.gapAngleDeg],
            ['accFreeze', mode.freezeInterval], ['accSpeed', mode.ballSpeed],
            ['gravitySlider', sim.gravity], ['bounceSlider', sim.bounciness]
        ];
        controls.forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.value = value;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        Object.assign(mode, {
            gapSizeDeg: settings.gapSizeDeg ?? mode.gapSizeDeg,
            gapAngleDeg: settings.gapAngleDeg ?? mode.gapAngleDeg,
            freezeInterval: settings.freezeInterval ?? mode.freezeInterval,
            ballSpeed: settings.ballSpeed ?? mode.ballSpeed
        });
        sim.gravity = settings.gravity ?? sim.gravity;
        sim.bounciness = settings.bounciness ?? sim.bounciness;
        sim.initMode();
    }

    function applySeedCandidate(seed, settings = null, optimized = false) {
        if (!Number.isFinite(Number(seed))) return;
        if (settings && optimized && sim.activeModeId === 'accumulation') {
            applyAccumulationSettings(settings);
        }
        if (settings && optimized && sim.activeModeId === 'classic') {
            const m = sim.activeMode;
            Object.assign(m, settings);
            sim.gravity = settings.gravity ?? sim.gravity;
            if (classicRingsSlider) classicRingsSlider.value = m.ringCount;
            if (classicRotationSlider) classicRotationSlider.value = m.rotationMultiplier;
            if (classicDirSelect) classicDirSelect.value = m.rotationDirection;
            if (classicGapSlider) classicGapSlider.value = m.gapSize / Math.PI;
            if (gravitySlider) gravitySlider.value = sim.gravity;
            [classicRingsSlider, classicRotationSlider, classicDirSelect, classicGapSlider, gravitySlider].forEach(el => {
                if (el) el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
            });
            Object.assign(m, settings);
            sim.gravity = settings.gravity ?? sim.gravity;
        }
        if (manualSeedInput) manualSeedInput.value = seed;
        sim.setSeed(Number(seed));
    }

    if (playBestSeedBtn) {
        playBestSeedBtn.addEventListener('click', () => {
            const searcher = sim.seedSearcher;
            if (!searcher || searcher.bestSeed == null) return;
            const seed = searcher.bestSeed;
            const duration = searcher.bestDuration;
            const settings = searcher.bestSettings;
            const optimized = !!searcher.autoOptimize;
            searcher.stopSearch();
            findSeedBtnText.textContent = `Trouver la Seed (${targetDuration}s)`;
            findSeedBtn.classList.remove('searching-active');
            applySeedCandidate(seed, settings, optimized);
            if (bestCandidateDisplay) bestCandidateDisplay.textContent = `Seed lancée #${seed} (${Number(duration).toFixed(1)}s)`;
            playBestSeedBtn.disabled = true;
        });
    }

    const autoOptimizeSeedToggle = document.getElementById('autoOptimizeSeedToggle');

    function updateTargetDuration(newSec) {
        targetDuration = parseInt(newSec, 10);
        if (customDurationSlider) customDurationSlider.value = targetDuration;
        if (targetDurationVal) targetDurationVal.textContent = `${targetDuration}s`;
        if (findSeedBtnText && !sim.seedSearcher.isSearching) {
            findSeedBtnText.textContent = `Trouver la Seed (${targetDuration}s)`;
        }

        // Highlight preset buttons
        document.querySelectorAll('.duration-preset-btn').forEach(btn => {
            const btnSec = parseInt(btn.getAttribute('data-duration'), 10);
            if (btnSec === targetDuration) {
                btn.className = 'duration-preset-btn py-1 px-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 text-xs font-mono font-semibold transition';
            } else {
                btn.className = 'duration-preset-btn py-1 px-2 rounded-lg bg-zinc-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-xs font-mono font-semibold border border-zinc-700 transition';
            }
        });
    }

    document.querySelectorAll('.duration-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            updateTargetDuration(btn.getAttribute('data-duration'));
        });
    });

    if (customDurationSlider) {
        customDurationSlider.addEventListener('input', (e) => {
            updateTargetDuration(e.target.value);
        });
    }

    if (findSeedBtn) {
        findSeedBtn.addEventListener('click', () => {
            if (sim.seedSearcher.isSearching) {
                sim.seedSearcher.stopSearch();
                findSeedBtnText.textContent = `Trouver la Seed (${targetDuration}s)`;
                findSeedBtn.classList.remove('searching-active');
                return;
            }

            // Start background fast-forward search
            seedSearchStatusBox.classList.remove('hidden');
            findSeedBtnText.textContent = 'Arrêter la recherche...';
            findSeedBtn.classList.add('searching-active');

            sim.seedSearcher.startSearch(
                targetDuration,
                // On progress
                (progress) => {
                    if (progress.unsupported) {
                        if (bestCandidateDisplay) bestCandidateDisplay.textContent = progress.message;
                        findSeedBtnText.textContent = `Trouver la Seed (${targetDuration}s)`;
                        findSeedBtn.classList.remove('searching-active');
                        return;
                    }
                    if (playBestSeedBtn) playBestSeedBtn.disabled = progress.bestSeed == null;
                    if (searchCountDisplay) searchCountDisplay.textContent = progress.testedCount.toLocaleString();
                    if (bestCandidateDisplay) {
                        const settingsLabel = progress.settings && progress.optimized ? ' · options auto' : '';
                        bestCandidateDisplay.textContent = progress.bestSeed ? `Seed #${progress.bestSeed} (${progress.bestDuration.toFixed(1)}s)${settingsLabel}` : 'Recherche en cours…';
                    }
                },
                // On exact match found
                (result) => {
                    findSeedBtnText.textContent = `Trouver la Seed (${targetDuration}s)`;
                    findSeedBtn.classList.remove('searching-active');
                    if (playBestSeedBtn) playBestSeedBtn.disabled = true;
                    if (searchCountDisplay) searchCountDisplay.textContent = result.testedCount.toLocaleString();
                    if (bestCandidateDisplay) {
                        bestCandidateDisplay.textContent = `✓ Trouvée: Seed #${result.seed} (${result.duration.toFixed(1)}s)${result.optimized ? ' · options optimisées' : ''}`;
                    }

                    // Apply the seed and the matching settings together.
                    if (result.settings && result.optimized && sim.activeModeId === 'accumulation') {
                        applyAccumulationSettings(result.settings);
                    }
                    if (result.settings && result.optimized && sim.activeModeId === 'classic') {
                        const m = sim.activeMode;
                        Object.assign(m, result.settings);
                        sim.gravity = result.settings.gravity ?? sim.gravity;
                        if (classicRingsSlider) classicRingsSlider.value = m.ringCount;
                        if (classicRotationSlider) classicRotationSlider.value = m.rotationMultiplier;
                        if (classicDirSelect) classicDirSelect.value = m.rotationDirection;
                        if (classicGapSlider) classicGapSlider.value = m.gapSize / Math.PI;
                        if (gravitySlider) gravitySlider.value = sim.gravity;
                        [classicRingsSlider, classicRotationSlider, classicDirSelect, classicGapSlider, gravitySlider].forEach(el => {
                            if (el) el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
                        });
                        m.ringCount = result.settings.ringCount;
                        m.rotationMultiplier = result.settings.rotationMultiplier;
                        m.gapSize = result.settings.gapSize;
                        m.rotationDirection = result.settings.rotationDirection;
                        sim.gravity = result.settings.gravity;
                    }
                    if (manualSeedInput) manualSeedInput.value = result.seed;
                    sim.setSeed(result.seed);
                },
                { autoOptimize: !!(autoOptimizeSeedToggle && autoOptimizeSeedToggle.checked) }
            );
        });
    }

    if (applySeedBtn && manualSeedInput) {
        applySeedBtn.addEventListener('click', () => {
            const entered = parseInt(manualSeedInput.value, 10);
            if (entered) sim.setSeed(entered);
        });
    }

    if (copySeedBtn && manualSeedInput) {
        copySeedBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(manualSeedInput.value).then(() => {
                copySeedBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i>';
                setTimeout(() => {
                    copySeedBtn.innerHTML = '<i class="fa-solid fa-copy"></i>';
                }, 1200);
            });
        });
    }

    // =========================================================================
    // Right Sidebar Controls : Audio & Synthétiseur
    // =========================================================================
    const audioButton = document.getElementById('audioInitBtn');
    if (audioButton && window.audioSynth) {
        audioButton.addEventListener('click', () => {
            window.audioSynth.init();
            window.audioSynth.muted = !window.audioSynth.muted;

            if (window.audioSynth.muted) {
                audioButton.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Mute';
                audioButton.classList.remove('bg-emerald-500/20', 'border-emerald-500/50', 'text-emerald-400');
                audioButton.classList.add('bg-red-500/20', 'border-red-500/50', 'text-red-400');
            } else {
                audioButton.innerHTML = '<i class="fa-solid fa-volume-high"></i> Audio';
                audioButton.classList.remove('bg-red-500/20', 'border-red-500/50', 'text-red-400');
                audioButton.classList.add('bg-emerald-500/20', 'border-emerald-500/50', 'text-emerald-400');
            }
        });
    }

    const instSelect = document.getElementById('instSelect');
    if (instSelect && window.audioSynth) {
        instSelect.addEventListener('change', (e) => {
            window.audioSynth.instrument = e.target.value;
        });
    }

    const scaleSelect = document.getElementById('scaleSelect');
    if (scaleSelect && window.audioSynth) {
        scaleSelect.addEventListener('change', (e) => {
            window.audioSynth.scaleName = e.target.value;
        });
    }

    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    if (volumeSlider && window.audioSynth) {
        volumeSlider.addEventListener('input', (e) => {
            window.audioSynth.volume = e.target.value / 100;
            if (volumeValue) volumeValue.textContent = `${e.target.value}%`;
        });
    }

    // =========================================================================
    // Right Sidebar Controls : Visual FX
    // =========================================================================

    const visualStyleSelect = document.getElementById('visualStyleSelect');
    const backgroundToneSelect = document.getElementById('backgroundToneSelect');
    const glowIntensitySlider = document.getElementById('glowIntensitySlider');
    const glowIntensityValue = document.getElementById('glowIntensityValue');
    if (visualStyleSelect) visualStyleSelect.addEventListener('change', e => { sim.visualStyle = e.target.value; });
    if (backgroundToneSelect) backgroundToneSelect.addEventListener('change', e => { sim.backgroundTone = e.target.value; });
    if (glowIntensitySlider) glowIntensitySlider.addEventListener('input', e => {
        sim.glowIntensity = parseFloat(e.target.value);
        if (glowIntensityValue) glowIntensityValue.textContent = Math.round(sim.glowIntensity * 100) + '%';
    });
    const trailToggle = document.getElementById('trailToggle');
    if (trailToggle) {
        trailToggle.addEventListener('change', lockScroll('rightSettingsContainer', (e) => {
            sim.enableTrail = e.target.checked;
        }));
    }

    const particlesToggle = document.getElementById('particlesToggle');
    if (particlesToggle) {
        particlesToggle.addEventListener('change', lockScroll('rightSettingsContainer', (e) => {
            sim.enableParticles = e.target.checked;
        }));
    }

    const shockwavesToggle = document.getElementById('shockwavesToggle');
    if (shockwavesToggle) {
        shockwavesToggle.addEventListener('change', lockScroll('rightSettingsContainer', (e) => {
            sim.enableShockwaves = e.target.checked;
        }));
    }

    const shakeToggle = document.getElementById('shakeToggle');
    if (shakeToggle) {
        shakeToggle.addEventListener('change', lockScroll('rightSettingsContainer', (e) => {
            sim.enableScreenShake = e.target.checked;
        }));
    }

    const portraitToggle = document.getElementById('portraitToggle');
    const frameWrapper = document.getElementById('frameWrapper');
    if (portraitToggle && frameWrapper) {
        portraitToggle.addEventListener('change', lockScroll('rightSettingsContainer', (e) => {
            if (e.target.checked) {
                frameWrapper.classList.add('aspect-[9/16]', 'max-w-[520px]', 'phone-frame');
            } else {
                frameWrapper.classList.remove('aspect-[9/16]', 'max-w-[520px]', 'phone-frame');
            }
            setTimeout(() => sim.resize(), 100);
        }));
    }

    // =========================================================================
    // Right Sidebar : Populate Mode Profiles & Default Values Visually
    // =========================================================================
    const presetsSettings = document.getElementById('presetsSettings');
    if (presetsSettings && window.MODES_CONFIG) {
        presetsSettings.innerHTML = '';
        Object.values(window.MODES_CONFIG).forEach(mode => {
            const card = document.createElement('div');
            card.className = 'p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5 text-xs';
            card.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="font-bold flex items-center gap-1.5" style="color: ${mode.color}">
                        <i class="fa-solid ${mode.icon}"></i> ${mode.name}
                    </span>
                    <span class="text-[9px] px-1.5 py-0.5 rounded font-mono ${mode.id === 'classic' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}">${mode.badge}</span>
                </div>
                <p class="text-[10px] text-zinc-400 leading-tight">${mode.description}</p>
                <div class="grid grid-cols-2 gap-1 text-[10px] font-mono pt-1 border-t border-zinc-800/60 text-zinc-300">
                    <div>Rayon boule : <strong class="text-cyan-300">${mode.ballPhysics.ballRadius}px</strong></div>
                    <div>Gravité : <strong class="text-purple-300">${mode.ballPhysics.gravity}</strong></div>
                    <div>Rebond : <strong class="text-pink-300">${mode.ballPhysics.bounciness}x</strong></div>
                    <div>Gain vit. : <strong class="text-yellow-300">+${Math.round((mode.ballPhysics.speedBoost - 1) * 100)}%</strong></div>
                </div>
            `;
            presetsSettings.appendChild(card);
        });
    }

    // =========================================================================
    // Action Buttons
    // =========================================================================
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            sim.initMode();
        });
    }

    const replayBtn = document.getElementById('replayBtn');
    if (replayBtn) {
        replayBtn.addEventListener('click', () => {
            sim.initMode();
        });
    }

    const spawnBallBtn = document.getElementById('spawnBallBtn');
    if (spawnBallBtn) {
        spawnBallBtn.addEventListener('click', () => {
            const innermost = sim.activeMode && sim.activeMode.rings ? sim.activeMode.rings[0] : null;
            const spawnOffset = innermost ? innermost.radius * 0.35 : 10;
            sim.spawnBall(sim.center.x, sim.center.y - spawnOffset);
        });
    }

    // Sélection du mode et synchronisation des réglages communs.
    const classicBox = document.getElementById('classicSettingsBox');

    function syncPhysicsUI() {
        if (gravitySlider) gravitySlider.value = sim.gravity;
        if (gravityVal) gravityVal.textContent = sim.gravity.toFixed(2);
        if (bounceSlider) bounceSlider.value = sim.bounciness;
        if (bounceVal) bounceVal.textContent = `${sim.bounciness.toFixed(2)}x`;
        if (radiusSlider) radiusSlider.value = sim.ballRadius;
        if (radiusVal) radiusVal.textContent = `${sim.ballRadius}px`;
        if (speedBoostSlider) speedBoostSlider.value = sim.speedBoost;
        if (speedBoostVal) speedBoostVal.textContent = `+${Math.round((sim.speedBoost - 1) * 100)}%`;
    }

    function selectMode(id) {
        sim.setMode(id);
        document.querySelectorAll('#modeButtons .mode-btn').forEach(b => {
            const on = b.dataset.mode === id;
            b.classList.toggle('opacity-50', !on);
            const badge = b.querySelector(':scope > span:last-child');
            if (badge) badge.textContent = on ? 'Actif' : 'Choisir';
        });
        if (classicBox) classicBox.classList.toggle('hidden', id !== 'classic');
        if (findSeedBtn) findSeedBtn.classList.remove('searching-active');
        if (seedSearchStatusBox) seedSearchStatusBox.classList.add('hidden');
        updateTargetDuration(65);
        sim.activeMode.setTargetDuration && sim.activeMode.setTargetDuration(targetDuration);
        syncPhysicsUI();
        if (manualSeedInput) manualSeedInput.value = sim.seed;
    }
    document.querySelectorAll('#modeButtons .mode-btn').forEach(btn => {
        btn.addEventListener('click', () => selectMode(btn.dataset.mode));
    });

    if (resetModeDefaultsBtn) {
        const freshBtn = resetModeDefaultsBtn.cloneNode(true);
        resetModeDefaultsBtn.replaceWith(freshBtn);
        freshBtn.addEventListener('click', () => {
            sim.applyModeDefaults();
            syncPhysicsUI();
            if (sim.activeModeId === 'classic') {
                if (classicRingsSlider) classicRingsSlider.value = sim.activeMode.ringCount;
                if (classicRingsVal) classicRingsVal.textContent = sim.activeMode.ringCount;
                if (classicRotationSlider) classicRotationSlider.value = sim.activeMode.rotationMultiplier;
                if (classicRotationValue) classicRotationValue.textContent = `${sim.activeMode.rotationMultiplier.toFixed(2)}x`;
            }
        });
    }

    // Persistance locale des réglages utilisateur
    const PREFS_KEY = 'hypnorai.preferences.v1';
    const preferenceIds = ['classicRingsSlider','classicRotationSlider','classicDirSelect','classicGapModeSelect','classicGapOffsetSlider','classicGapSlider','classicPaletteSelect','classicMultiColorToggle','classicSpikeToggle','classicSpikeCountSlider','visualStyleSelect','backgroundToneSelect','glowIntensitySlider','accGapSize','accGapAngle','accFreeze','accSpeed','mulInitial','mulSpawn','mulDiameter','mulMax','mulSpeed','battleCount','battleLines','battleGain','battleSpeed','battleSpread','gravitySlider','bounceSlider','radiusSlider','speedBoostSlider','instSelect','scaleSelect','volumeSlider','trailToggle','particlesToggle','shockwavesToggle','shakeToggle','portraitToggle','customDurationSlider','manualSeedInput','autoOptimizeSeedToggle'];
    const modePreferenceProps = {
        classic:['ringCount','rotationMultiplier','rotationDirection','initialGapMode','gapOffset','gapSize','paletteName','multiColor','spikesEnabled','spikeCount'],
        accumulation:['gapSizeDeg','gapAngleDeg','freezeInterval','ballSpeed'],
        multiply:['initialBalls','spawnPerBounce','radiusScale','maxBalls','ballSpeed'],
        battleLines:['ballCount','startingLines','wallLineGain','battleSpeed','lineSpreadDeg']
    };

    // Configuration export/import: files are portable and can be shared or committed to GitHub.
    const configVersion = 1;
    const configFileInput = document.createElement('input');
    configFileInput.type = 'file';
    configFileInput.accept = '.json,application/json';
    configFileInput.hidden = true;
    document.body.appendChild(configFileInput);

    const getModeConfig = (modeId) => {
        const mode = sim.modes[modeId];
        if (!mode) throw new Error('Mode inconnu : ' + modeId);
        const modeSettingKeys = {
            classic: ['ringCount','rotationMultiplier','rotationDirection','initialGapMode','gapOffset','gapSize','paletteName','multiColor','spikesEnabled','spikeCount','spikeLength','spikeWidth'],
            accumulation: ['gapSizeDeg','gapAngleDeg','freezeInterval','ballSpeed'],
            multiply: ['initialBalls','spawnPerBounce','radiusScale','maxBalls','ballSpeed'],
            battleLines: ['ballCount','startingLines','wallLineGain','battleSpeed','lineSpreadDeg']
        };
        const modeSettings = {};
        (modeSettingKeys[modeId] || []).forEach(key => {
            const value = mode[key];
            if (typeof value === 'string' || typeof value === 'boolean' ||
                (typeof value === 'number' && Number.isFinite(value))) modeSettings[key] = value;
        });
        return {
            format: 'hypnorai-mode-config',
            version: configVersion,
            exportedAt: new Date().toISOString(),
            modeId,
            modeName: mode.name || modeId,
            physics: {
                gravity: sim.gravity,
                bounciness: sim.bounciness,
                ballRadius: sim.ballRadius,
                speedBoost: sim.speedBoost,
                maxSpeed: sim.maxSpeed
            },
            modeSettings
        };
    };

    const downloadJson = (data, filename) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const modeNameForFile = id => String(id).replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    const modeList = document.getElementById('modeButtons');
    if (modeList) {
        // Add a small export action alongside every mode button without changing the existing HTML list.
        Array.from(modeList.querySelectorAll('.mode-btn')).forEach(modeButton => {
            const modeId = modeButton.dataset.mode;
            const wrapper = document.createElement('div');
            wrapper.className = 'flex items-stretch gap-1.5 min-w-0';
            modeButton.parentNode.insertBefore(wrapper, modeButton);
            wrapper.appendChild(modeButton);
            modeButton.classList.remove('w-full');
            modeButton.classList.add('flex-1', 'min-w-0');
            const exportButton = document.createElement('button');
            exportButton.type = 'button';
            exportButton.className = 'shrink-0 w-9 rounded-xl border border-zinc-700 bg-zinc-800/80 text-cyan-300 hover:bg-cyan-500/15 hover:border-cyan-500/50 transition';
            exportButton.title = 'Télécharger la configuration de ' + modeButton.innerText.trim();
            exportButton.setAttribute('aria-label', exportButton.title);
            exportButton.innerHTML = '<i class="fa-solid fa-download"></i>';
            exportButton.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                try {
                    downloadJson(getModeConfig(modeId), 'hypnorai-' + modeNameForFile(modeId) + '.json');
                } catch (error) {
                    alert('Impossible d’exporter cette configuration : ' + error.message);
                }
            });
            wrapper.appendChild(exportButton);
        });

        const toolsRow = document.createElement('div');
        toolsRow.className = 'grid grid-cols-2 gap-2 pt-2';
        toolsRow.innerHTML = `
            <button type="button" id="exportAllConfigBtn" class="py-2 px-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 text-[11px] font-semibold">
                <i class="fa-solid fa-file-export mr-1"></i> Exporter tout
            </button>
            <button type="button" id="importConfigBtn" class="py-2 px-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 text-[11px] font-semibold">
                <i class="fa-solid fa-file-import mr-1"></i> Importer JSON
            </button>`;
        modeList.insertAdjacentElement('afterend', toolsRow);

        document.getElementById('exportAllConfigBtn').addEventListener('click', () => {
            const allModes = {};
            Object.keys(sim.modes).forEach(id => { allModes[id] = getModeConfig(id); });
            downloadJson({
                format: 'hypnorai-full-config',
                version: configVersion,
                exportedAt: new Date().toISOString(),
                activeModeId: sim.activeModeId,
                physics: { gravity: sim.gravity, bounciness: sim.bounciness, ballRadius: sim.ballRadius, speedBoost: sim.speedBoost, maxSpeed: sim.maxSpeed },
                modes: allModes,
                visuals: { enableTrail: sim.enableTrail, enableParticles: sim.enableParticles, enableShockwaves: sim.enableShockwaves, enableScreenShake: sim.enableScreenShake, visualStyle: sim.visualStyle, backgroundTone: sim.backgroundTone, glowIntensity: sim.glowIntensity, paletteName: sim.paletteName, multiColor: sim.multiColor },
                audio: window.audioSynth ? { instrument: window.audioSynth.instrument, scaleName: window.audioSynth.scaleName, volume: window.audioSynth.volume, muted: window.audioSynth.muted } : null,
                seed: sim.seed
            }, 'hypnorai-config-complete.json');
        });
        document.getElementById('importConfigBtn').addEventListener('click', () => configFileInput.click());
    }

    const applyImportedConfig = data => {
        if (!data || !['hypnorai-mode-config', 'hypnorai-full-config'].includes(data.format) || data.version !== configVersion) {
            throw new Error('Format non reconnu ou version incompatible.');
        }
        const applyPhysics = values => {
            if (!values || typeof values !== 'object') return;
            ['gravity','bounciness','ballRadius','speedBoost','maxSpeed'].forEach(key => {
                if (Number.isFinite(values[key]) && key in sim) sim[key] = values[key];
            });
        };
        const applyOneMode = (id, config) => {
            const mode = sim.modes[id];
            if (!mode || !config || typeof config !== 'object') return;
            const values = config.modeSettings || config;
            Object.entries(values).forEach(([key, value]) => {
                if (key === 'sim' || key === 'id' || key === 'name' || key === 'ownsPhysics' || key === 'ownsSpawning') return;
                if (key in mode && ['string','number','boolean'].includes(typeof value) &&
                    (typeof value !== 'number' || Number.isFinite(value))) mode[key] = value;
            });
        };
        if (data.format === 'hypnorai-mode-config') {
            if (!sim.modes[data.modeId]) throw new Error('Ce mode n’existe pas dans cette version : ' + data.modeId);
            applyPhysics(data.physics);
            applyOneMode(data.modeId, data);
            selectMode(data.modeId);
        } else {
            applyPhysics(data.physics);
            Object.entries(data.modes || {}).forEach(([id, config]) => applyOneMode(id, config));
            if (data.visuals) Object.entries(data.visuals).forEach(([key,value]) => { if (['enableTrail','enableParticles','enableShockwaves','enableScreenShake'].includes(key) && typeof value === 'boolean') sim[key] = value; else if (key === 'visualStyle' && ['neon','soft','minimal'].includes(value)) sim[key] = value; else if (key === 'backgroundTone' && ['midnight','blue','black'].includes(value)) sim[key] = value; else if (key === 'glowIntensity' && Number.isFinite(value)) sim[key] = Math.max(0,Math.min(2,value));
                else if (key === 'paletteName' && ['neon','cyberpunk','ocean','sunset','candy','fire','rainbow'].includes(value)) { sim.paletteName = value; sim.modes.classic.paletteName = value; }
                else if (key === 'multiColor' && typeof value === 'boolean') { sim.multiColor = value; sim.modes.classic.multiColor = value; } });
            if (data.audio && window.audioSynth) {
                if (typeof data.audio.instrument === 'string') window.audioSynth.instrument = data.audio.instrument;
                if (typeof data.audio.scaleName === 'string') window.audioSynth.scaleName = data.audio.scaleName;
                if (Number.isFinite(data.audio.volume)) window.audioSynth.volume = data.audio.volume;
                if (typeof data.audio.muted === 'boolean') window.audioSynth.muted = data.audio.muted;
            }
            if (Number.isFinite(data.seed)) sim.seed = data.seed;
            selectMode(sim.modes[data.activeModeId] ? data.activeModeId : sim.activeModeId);
        }
        // Refresh controls using their existing event handlers so labels and mode geometry stay in sync.
        document.querySelectorAll('#leftSettingsContainer input, #leftSettingsContainer select, #rightSettingsContainer input, #rightSettingsContainer select').forEach(el => {
            if (el.id === 'manualSeedInput') el.value = sim.seed;
            if (el.type === 'checkbox') el.checked = !!el.checked;
            el.dispatchEvent(new Event(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
        });
        // Re-apply model values after UI events: some legacy controls target the active mode.
        if (data.format === 'hypnorai-mode-config') {
            applyPhysics(data.physics);
            applyOneMode(data.modeId, data);
            selectMode(data.modeId);
        } else {
            applyPhysics(data.physics);
            Object.entries(data.modes || {}).forEach(([id, config]) => applyOneMode(id, config));
            if (data.visuals) Object.entries(data.visuals).forEach(([key,value]) => {
                if (['enableTrail','enableParticles','enableShockwaves','enableScreenShake'].includes(key) && typeof value === 'boolean') sim[key] = value;
                else if (key === 'visualStyle' && ['neon','soft','minimal'].includes(value)) sim[key] = value;
                else if (key === 'backgroundTone' && ['midnight','blue','black'].includes(value)) sim[key] = value;
                else if (key === 'glowIntensity' && Number.isFinite(value)) sim[key] = Math.max(0,Math.min(2,value));
            });
            selectMode(sim.modes[data.activeModeId] ? data.activeModeId : sim.activeModeId);
        }
        if (visualStyleSelect) visualStyleSelect.value = sim.visualStyle;
        if (backgroundToneSelect) backgroundToneSelect.value = sim.backgroundTone;
        if (glowIntensitySlider) {
            glowIntensitySlider.value = sim.glowIntensity;
            if (glowIntensityValue) glowIntensityValue.textContent = Math.round(sim.glowIntensity * 100) + '%';
        }
        if (classicPaletteSelect) classicPaletteSelect.value = sim.paletteName;
        if (classicMultiColorToggle) classicMultiColorToggle.checked = sim.multiColor;
        syncPhysicsUI();
        sim.initMode();
        if (typeof savePreferences === 'function') savePreferences();
    };

    configFileInput.addEventListener('change', async () => {
        const file = configFileInput.files && configFileInput.files[0];
        if (!file) return;
        try {
            const data = JSON.parse(await file.text());
            applyImportedConfig(data);
            alert('Configuration importée : ' + (data.modeName || 'configuration complète') + '.');
        } catch (error) {
            alert('Import impossible : ' + error.message);
        } finally {
            configFileInput.value = '';
        }
    });

    let skipPreferenceSave = false;
    const savePreferences = () => {
        if (skipPreferenceSave) return;
        try {
            const controls = {};
            preferenceIds.forEach(id => { const el=document.getElementById(id); if(el) controls[id]=el.type==='checkbox'?el.checked:el.value; });
            const modes = {};
            Object.entries(modePreferenceProps).forEach(([id,props]) => { const m=sim.modes[id]; if(m){ modes[id]={}; props.forEach(p=>{if(m[p]!==undefined)modes[id][p]=m[p];}); } });
            localStorage.setItem(PREFS_KEY, JSON.stringify({
                version:1, activeModeId:sim.activeModeId, controls, modes,
                physics:{gravity:sim.gravity,bounciness:sim.bounciness,ballRadius:sim.ballRadius,speedBoost:sim.speedBoost},
                visuals:{enableTrail:sim.enableTrail,enableParticles:sim.enableParticles,enableShockwaves:sim.enableShockwaves,enableScreenShake:sim.enableScreenShake,visualStyle:sim.visualStyle,backgroundTone:sim.backgroundTone,glowIntensity:sim.glowIntensity,paletteName:sim.paletteName,multiColor:sim.multiColor},
                seed:sim.seed,
                audio:window.audioSynth?{instrument:window.audioSynth.instrument,scaleName:window.audioSynth.scaleName,volume:window.audioSynth.volume,muted:window.audioSynth.muted}:null
            }));
            const status=document.getElementById('preferencesStatus'); if(status) status.textContent='Réglages sauvegardés automatiquement';
        } catch(err) { console.warn('Sauvegarde des préférences impossible.',err); }
    };
    const loadPreferences = () => {
        let data; try { data=JSON.parse(localStorage.getItem(PREFS_KEY)||'null'); } catch(_) { return; }
        if(!data||data.version!==1) return;
        try {
            Object.entries(data.modes||{}).forEach(([id,values])=>{
                const m=sim.modes[id]; if(!m||!modePreferenceProps[id]) return;
                Object.entries(values).forEach(([p,v])=>{if(modePreferenceProps[id].includes(p))m[p]=v;});
            });
            Object.entries(data.controls||{}).forEach(([id,v])=>{const el=document.getElementById(id);if(el){if(el.type==='checkbox')el.checked=!!v;else el.value=v;}});
            Object.entries(data.physics||{}).forEach(([p,v])=>{if(Number.isFinite(v)&&p in sim)sim[p]=v;});
            Object.entries(data.visuals||{}).forEach(([p,v])=>{if(['enableTrail','enableParticles','enableShockwaves','enableScreenShake'].includes(p)&&typeof v==='boolean')sim[p]=v;else if(p==='visualStyle'&&['neon','soft','minimal'].includes(v))sim[p]=v;else if(p==='backgroundTone'&&['midnight','blue','black'].includes(v))sim[p]=v;else if(p==='glowIntensity'&&Number.isFinite(v))sim[p]=Math.max(0,Math.min(2,v));else if(p==='paletteName'&&['neon','cyberpunk','ocean','sunset','candy','fire','rainbow'].includes(v)){sim.paletteName=v;sim.modes.classic.paletteName=v;}else if(p==='multiColor'&&typeof v==='boolean'){sim.multiColor=v;sim.modes.classic.multiColor=v;}});
            if(data.audio&&window.audioSynth){
                if(data.audio.instrument)window.audioSynth.instrument=data.audio.instrument;
                if(data.audio.scaleName)window.audioSynth.scaleName=data.audio.scaleName;
                if(Number.isFinite(data.audio.volume))window.audioSynth.volume=data.audio.volume;
                if(typeof data.audio.muted==='boolean')window.audioSynth.muted=data.audio.muted;
            }
            if(data.seed)sim.seed=parseInt(data.seed,10)||sim.seed;
            const wanted=sim.modes[data.activeModeId]?data.activeModeId:'classic';
            selectMode(wanted);
            const ids={classic:['classicRingsSlider','classicRotationSlider','classicDirSelect','classicGapModeSelect','classicGapOffsetSlider','classicGapSlider','classicPaletteSelect','classicMultiColorToggle','classicSpikeToggle','classicSpikeCountSlider'],accumulation:['accGapSize','accGapAngle','accFreeze','accSpeed'],multiply:['mulInitial','mulSpawn','mulDiameter','mulMax','mulSpeed'],battleLines:['battleCount','battleLines','battleGain','battleSpeed','battleSpread']}[wanted]||[];
            ids.forEach(id=>{const el=document.getElementById(id);if(el)el.dispatchEvent(new Event(el.type==='checkbox'||el.tagName==='SELECT'?'change':'input',{bubbles:true}));});
            Object.entries(data.physics||{}).forEach(([p,v])=>{if(Number.isFinite(v)&&p in sim)sim[p]=v;});
            syncPhysicsUI();
            if(classicRingsSlider){classicRingsSlider.value=sim.modes.classic.ringCount;if(classicRingsVal)classicRingsVal.textContent=sim.modes.classic.ringCount;}
            if(classicRotationSlider){classicRotationSlider.value=sim.modes.classic.rotationMultiplier;if(classicRotationValue)classicRotationValue.textContent=Number(sim.modes.classic.rotationMultiplier).toFixed(2)+'x';}
            if(volumeSlider&&window.audioSynth){volumeSlider.value=Math.round(window.audioSynth.volume*100);if(volumeValue)volumeValue.textContent=volumeSlider.value+'%';}
            if(visualStyleSelect)visualStyleSelect.value=sim.visualStyle;if(backgroundToneSelect)backgroundToneSelect.value=sim.backgroundTone;if(classicPaletteSelect)classicPaletteSelect.value=sim.paletteName;if(classicMultiColorToggle)classicMultiColorToggle.checked=sim.multiColor;if(classicPalettePreview&&classicPaletteSelect)classicPalettePreview.textContent=classicPaletteSelect.options[classicPaletteSelect.selectedIndex].text;if(glowIntensitySlider){glowIntensitySlider.value=sim.glowIntensity;if(glowIntensityValue)glowIntensityValue.textContent=Math.round(sim.glowIntensity*100)+'%';}
            ['trailToggle','particlesToggle','shockwavesToggle','shakeToggle','portraitToggle'].forEach(id=>{const el=document.getElementById(id);if(el&&data.controls&&typeof data.controls[id]==='boolean')el.checked=data.controls[id];});
            if(frameWrapper&&portraitToggle){frameWrapper.classList.toggle('aspect-[9/16]',portraitToggle.checked);frameWrapper.classList.toggle('max-w-[520px]',portraitToggle.checked);frameWrapper.classList.toggle('phone-frame',portraitToggle.checked);setTimeout(()=>sim.resize(),0);}
            if(spikeGroup&&classicSpikeToggle)spikeGroup.classList.toggle('hidden',!classicSpikeToggle.checked);
            if(manualSeedInput)manualSeedInput.value=sim.seed;
            // Recalculer les dimensions après restauration (notamment si le layout vient de se recharger), puis replacer les balles dans la géométrie du mode actif.
            sim.resize();
            sim.initMode();
            syncArcadeModePanel();
            requestAnimationFrame(() => {
                sim.resize();
                sim.initMode();
                syncArcadeModePanel();
            });
        } catch(err) { console.warn('Restauration des préférences impossible.',err); }
    };
    document.addEventListener('input',savePreferences);
    document.addEventListener('change',savePreferences);
    window.addEventListener('beforeunload',savePreferences);
    const clearPreferencesBtn=document.getElementById('clearPreferencesBtn');
    if(clearPreferencesBtn)clearPreferencesBtn.addEventListener('click',()=>{
        skipPreferenceSave = true;
        try{localStorage.removeItem(PREFS_KEY);}catch(_){}
        window.location.reload();
    });
    loadPreferences();

});
