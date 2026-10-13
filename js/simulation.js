/* ==========================================================================
   Simulation Engine - Deterministic Substep Physics, Render Loop & Seed Engine
   ========================================================================== */

class Simulation {
    constructor() {
        this.canvas = document.getElementById('simCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.balls = [];
        this.particles = [];
        this.shockwaves = [];

        // Deterministic Seed & PRNG
        const initialCfg = window.APP_CONFIG && window.APP_CONFIG.classic ? window.APP_CONFIG.classic : null;
        this.seed = window.APP_CONFIG && window.APP_CONFIG.initialSeed ? window.APP_CONFIG.initialSeed : 104291;
        this.prng = new PRNG(this.seed);
        this.elapsedSeconds = 0;
        this.isVictory = false;

        // Global Simulation Controls (Loaded from root config.js)
        this.paused = false;
        this.gravity = initialCfg && initialCfg.ball ? initialCfg.ball.gravity : 0.24;
        this.bounciness = initialCfg && initialCfg.ball ? initialCfg.ball.bounciness : 1.02;
        this.ballRadius = initialCfg && initialCfg.ball ? initialCfg.ball.radius : 13;
        this.speedBoost = initialCfg && initialCfg.ball ? initialCfg.ball.speedBoost : 1.01;
        this.maxSpeed = initialCfg && initialCfg.ball ? initialCfg.ball.maxSpeed : 32;

        // Visual FX Toggles
        const visuals = window.APP_CONFIG && window.APP_CONFIG.visuals ? window.APP_CONFIG.visuals : null;
        this.enableTrail = visuals ? visuals.enableTrail : true;
        this.enableParticles = visuals ? visuals.enableParticles : true;
        this.enableShockwaves = visuals ? visuals.enableShockwaves : true;
        this.enableScreenShake = visuals ? visuals.enableScreenShake : false; // Disabled by default
        this.visualStyle = 'neon';
        this.backgroundTone = 'midnight';
        this.glowIntensity = 1;
        this.paletteName = 'neon';
        this.multiColor = true;
        this.screenShakeIntensity = 0;

        // Performance & Stats
        this.totalBounces = 0;
        this.fps = 60;
        this.lastTime = performance.now();
        this.frameCount = 0;

        // Dimensions
        this.center = { x: 0, y: 0 };
        this.boundaryRadius = 0;
        this.cssWidth = 0;
        this.cssHeight = 0;

        // Active Mode (Classic by default)
        this.modes = { classic: new ClassicMode(this), accumulation: new ArcadeMode(this, "accumulation"), multiply: new ArcadeMode(this, "multiply"), battleLines: new ArcadeMode(this, "battleLines"), lines: new ArcadeMode(this, "lines"), paint: new ArcadeMode(this, "paint"), target: new ArcadeMode(this, "target"), grow: new ArcadeMode(this, "grow"), shatter: new ArcadeMode(this, "shatter"), colorMatch: new ArcadeMode(this, "colorMatch"), portal: new ArcadeMode(this, "portal") };
        this.activeModeId = 'classic';
        this.activeMode = this.modes.classic;

        // Seed Searcher Engine
        this.seedSearcher = new SeedSearcher(this);

        this.resize();
        this.initMode();
        this.bindCanvasEvents();
    }

    setSeed(seed) {
        this.seed = parseInt(seed, 10) || 104291;
        this.initMode();
    }

    applyModeDefaults(id = this.activeModeId) {
        // Classic garde son chemin existant (config.js)
        if (!this.activeMode.applySettings) { this.applyModeConfig(id); return; }
        const cfg = window.MODES_CONFIG && window.MODES_CONFIG[id];
        if (!cfg) return;
        const b = cfg.ballPhysics;
        this.gravity = b.gravity;
        this.bounciness = b.bounciness;
        this.ballRadius = b.ballRadius;
        this.speedBoost = b.speedBoost;
        this.maxSpeed = b.maxSpeed;
        this.activeMode.applySettings(cfg.modeSettings);
        this.initMode();
    }

    setMode(id) {
        if (!this.modes[id] || this.activeModeId === id) return;
        this.seedSearcher.stopSearch();
        this.activeModeId = id;
        this.activeMode = this.modes[id];
        this.applyModeDefaults(id);
    }

    applyModeConfig(modeId) {
        const appCfg = window.APP_CONFIG ? window.APP_CONFIG[modeId] : null;
        if (appCfg) {
            if (appCfg.ball) {
                this.gravity = appCfg.ball.gravity;
                this.bounciness = appCfg.ball.bounciness;
                this.ballRadius = appCfg.ball.radius;
                this.speedBoost = appCfg.ball.speedBoost;
                this.maxSpeed = appCfg.ball.maxSpeed;
            }
            if (this.activeMode && appCfg.world) {
                this.activeMode.ringCount = appCfg.world.ringCount;
                this.activeMode.rotationMultiplier = appCfg.world.rotationSpeed;
                this.activeMode.rotationDirection = appCfg.world.rotationDirection;
                this.activeMode.initialGapMode = appCfg.world.initialGapMode || 'random';
                this.activeMode.gapOffset = appCfg.world.gapOffset ?? 0;
                this.activeMode.gapSize = Math.PI * appCfg.world.gapSizeRatio;
                this.activeMode.paletteName = appCfg.world.palette;
                this.activeMode.multiColor = appCfg.world.multiColor;
                this.activeMode.spikesEnabled = appCfg.world.spikesEnabled;
                this.activeMode.spikeCount = appCfg.world.spikeCount;
                this.activeMode.spikeLength = appCfg.world.spikeLength;
                this.activeMode.spikeWidth = appCfg.world.spikeWidth;
                if (this.activeMode.setupRings) {
                    this.activeMode.setupRings(true);
                }
            }
            this.initMode();
            return;
        }
    }

    resize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = Math.floor(rect.width * dpr);
        this.canvas.height = Math.floor(rect.height * dpr);

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);

        this.cssWidth = rect.width;
        this.cssHeight = rect.height;
        this.center = { x: this.cssWidth / 2, y: this.cssHeight / 2 };
        this.boundaryRadius = Math.max(30, Math.min(this.cssWidth, this.cssHeight) * 0.44);

        if (this.activeMode && this.activeMode.updateGeometry) {
            this.activeMode.updateGeometry();
        }
    }

    initMode() {
        this.balls = [];
        this.particles = [];
        this.shockwaves = [];
        this.totalBounces = 0;
        this.screenShakeIntensity = 0;
        this.elapsedSeconds = 0;
        this.isVictory = false;

        // Always re-seed PRNG on init so results are 100% deterministic!
        this.prng.setSeed(this.seed);

        // Hide victory overlay
        const overlay = document.getElementById('victoryOverlay');
        if (overlay) {
            overlay.classList.remove('opacity-100', 'pointer-events-auto');
            overlay.classList.add('opacity-0', 'pointer-events-none');
        }

        // Setup active mode
        if (this.activeMode && this.activeMode.setupRings) {
            this.activeMode.setupRings(true);
        }

        if (this.activeMode && this.activeMode.initializeBalls) {
            this.activeMode.initializeBalls();
            this.updateStatsUI();
            return;
        }

        // Spawn ball safely at center inside innermost ring using deterministic velocities
        const innermost = this.activeMode && this.activeMode.rings ? this.activeMode.rings[0] : null;
        const spawnOffset = innermost ? innermost.radius * 0.35 : 10;
        
        const vx = (this.prng.random() - 0.5) * 6;
        const vy = (this.prng.random() - 0.5) * 4;
        const hue = Math.floor(this.prng.random() * 360);

        this.spawnBall(
            this.center.x,
            this.center.y - spawnOffset,
            vx,
            vy,
            hue
        );

        this.updateStatsUI();
    }

    spawnBall(x, y, vx, vy, hue) {
        // Hard safety cap prevents accidental runaway growth from freezing the browser.
        if (this.activeModeId === "multiply" && this.balls.length >= Math.min(1200, Math.max(1, this.activeMode.maxBalls || 10))) return;
        if (this.activeModeId !== "multiply" && this.balls.length >= 80) return;
        vx = vx ?? ((this.prng.random() - 0.5) * 7);
        vy = vy ?? ((this.prng.random() - 0.5) * 5);
        hue = hue ?? Math.floor(this.prng.random() * 360);
        this.balls.push(new Ball(x, y, vx, vy, this.ballRadius, hue));
        this.updateStatsUI();
    }

    addEffects(x, y, color) {
        if (this.enableParticles) {
            const count = Math.min(10, 60 - this.particles.length);
            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(x, y, color));
            }
        }
        if (this.enableShockwaves && this.shockwaves.length < 15) {
            this.shockwaves.push(new Shockwave(x, y, color));
        }
        if (this.enableScreenShake) {
            this.screenShakeIntensity = Math.min(this.screenShakeIntensity + 3.5, 9);
        }
    }

    triggerVictory() {
        if (this.isVictory) return;
        this.isVictory = true;
        this.screenShakeIntensity = 0; // zero shake per user request

        const overlay = document.getElementById('victoryOverlay');
        const detailsEl = document.getElementById('victoryDetails');
        if (detailsEl) {
            detailsEl.textContent = `Durée : ${this.elapsedSeconds.toFixed(1)}s • Seed #${this.seed}`;
        }
        if (overlay) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100', 'pointer-events-auto');
        }
    }

    update(dtScale = 1) {
        if (this.paused) return;

        dtScale = Math.min(Math.max(dtScale, 0.2), 2.2);

        // Advance simulation timer
        if (!this.isVictory) {
            this.elapsedSeconds += dtScale / 60;
        }

        // FPS Calculation
        const now = performance.now();
        this.frameCount++;
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
            const fpsEl = document.getElementById('fpsCounter');
            if (fpsEl) fpsEl.textContent = this.fps;
        }

        // Screen shake decay
        if (this.screenShakeIntensity > 0.05) {
            this.screenShakeIntensity *= 0.88;
        } else {
            this.screenShakeIntensity = 0;
        }

        // Update active mode
        if (this.activeMode && this.activeMode.update) {
            this.activeMode.update(dtScale);
        }

        // Update Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            this.shockwaves[i].update(dtScale);
            if (this.shockwaves[i].alpha <= 0) this.shockwaves.splice(i, 1);
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dtScale);
            if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
        }

        // Fixed Sub-stepping physics (8 substeps per frame for 0% tunneling)
        const substeps = 8;
        const subDt = dtScale / substeps;

        for (let step = 0; step < substeps && !this.activeMode.ownsPhysics; step++) {
            for (let bIndex = this.balls.length - 1; bIndex >= 0; bIndex--) {
                const ball = this.balls[bIndex];

                // Integration
                ball.vy += this.gravity * subDt;
                ball.x += ball.vx * subDt;
                ball.y += ball.vy * subDt;

                // Max speed safety clamp
                const curSpeed = Math.hypot(ball.vx, ball.vy);
                if (curSpeed > this.maxSpeed) {
                    ball.vx = (ball.vx / curSpeed) * this.maxSpeed;
                    ball.vy = (ball.vy / curSpeed) * this.maxSpeed;
                }

                // Collisions with active mode
                if (this.activeMode && this.activeMode.handleCollision) {
                    this.activeMode.handleCollision(ball);
                    if (this.activeMode.handleSpikeCollision) {
                        this.activeMode.handleSpikeCollision(ball);
                    }
                }
            }
        }

        // Record trails once per full frame
        // Trail history is expensive when the scene contains hundreds of balls.
        if (this.balls.length <= 250) {
            for (const ball of this.balls) ball.recordTrail();
        } else {
            for (const ball of this.balls) {
                ball.trail.length = 0;
                ball.hue = (ball.hue + 0.4) % 360;
            }
        }

        this.updateStatsUI();
    }

    draw() {
        // Clear background
        const backgrounds = { midnight: '#080a10', blue: '#07111f', black: '#000000' };
        this.ctx.fillStyle = backgrounds[this.backgroundTone] || backgrounds.midnight;
        this.ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);

        // Subtle background grid
        this.drawBackgroundGrid();

        this.ctx.save();

        // Screen shake transform
        if (this.screenShakeIntensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
            this.ctx.translate(shakeX, shakeY);
        }

        // Zoom out visually in Multiply mode while keeping the physics world and ball sizes unchanged.
        if (this.activeModeId === "multiply") {
            // Keep a constant zoom-out so changing diameter remains visibly meaningful.
            const zoom = 0.65;
            this.ctx.translate(this.center.x, this.center.y);
            this.ctx.scale(zoom, zoom);
            this.ctx.translate(-this.center.x, -this.center.y);
        }

        // Shared glow for modes that don't define their own shadow.
        const styleGlow = this.visualStyle === 'minimal' ? 0 : this.visualStyle === 'soft' ? 0.45 : 1;
        this.ctx.shadowBlur = this.glowIntensity * 8 * styleGlow;
        this.ctx.shadowColor = this.activeMode && this.activeMode.color ? this.activeMode.color : '#22d3ee';

        // Share the selected palette with every non-Escape mode and its effects/balls.
        const paletteHueShift = { neon: 0, cyberpunk: 8, ocean: 145, sunset: -25, candy: -12, fire: -38, rainbow: 0 };
        if (this.activeModeId !== 'classic') {
            this.ctx.filter = `hue-rotate(${paletteHueShift[this.paletteName] ?? 0}deg)`;
        }

        // Render active mode boundaries
        if (this.activeMode && this.activeMode.render) {
            this.activeMode.render(this.ctx);
        }
        // Escape draws its ring palette directly; apply the shared palette to its balls and effects.
        if (this.activeModeId === 'classic') {
            this.ctx.filter = `hue-rotate(${paletteHueShift[this.paletteName] ?? 0}deg)`;
        }

        // Render Shockwaves & Particles
        this.shockwaves.forEach(sw => sw.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));

        // Render Balls
        const crowded = this.balls.length > 250;
        this.balls.forEach(ball => ball.draw(this.ctx, crowded ? false : this.enableTrail, {
            visualStyle: crowded ? 'minimal' : this.visualStyle,
            glowIntensity: crowded ? 0 : this.glowIntensity
        }));
        this.ctx.filter = 'none';

        this.ctx.restore();
    }

    drawBackgroundGrid() {
        this.ctx.save();
        const gridAlpha = this.backgroundTone === 'black' ? '0.035' : this.backgroundTone === 'blue' ? '0.045' : '0.025';
        this.ctx.strokeStyle = `rgba(180, 210, 255, ${gridAlpha})`;
        this.ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < this.cssWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.cssHeight);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.cssHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.cssWidth, y);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    updateStatsUI() {
        const ballEl = document.getElementById('ballCounter');
        if (ballEl) ballEl.textContent = this.balls.length;

        const bounceEl = document.getElementById('bounceCounter');
        if (bounceEl) bounceEl.textContent = this.totalBounces;

        const clearEl = document.getElementById('clearedCounter');
        if (clearEl && this.activeMode && this.activeMode.rings) {
            clearEl.textContent = `${this.activeMode.clearedCount}/${this.activeMode.rings.length}`;
        }

        const timerEl = document.getElementById('timerCounter');
        if (timerEl) {
            const mins = Math.floor(this.elapsedSeconds / 60);
            const secs = (this.elapsedSeconds % 60).toFixed(1);
            timerEl.textContent = `${mins > 0 ? mins + 'm ' : ''}${secs}s`;
        }

        const seedDisplayEl = document.getElementById('activeSeedBadge');
        if (seedDisplayEl) {
            seedDisplayEl.textContent = `#${this.seed}`;
        }
    }

    bindCanvasEvents() {
        window.addEventListener('resize', () => this.resize());

        // Interactive click/tap to spawn ball
        this.canvas.addEventListener('pointerdown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            if (this.balls.length < 20) {
                const vx = (this.center.x - clickX) * 0.05 + (this.prng.random() - 0.5) * 4;
                const vy = (this.center.y - clickY) * 0.05 - 2;
                this.spawnBall(clickX, clickY, vx, vy);
                this.addEffects(clickX, clickY, '#00f2fe');
            }
        });
    }
}
