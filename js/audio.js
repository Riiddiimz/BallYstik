/* ==========================================================================
   Audio Engine - Web Audio Synthesizer (Polyphonic, Scaled, Pop-Free)
   ========================================================================== */

class AudioSynth {
    constructor() {
        this.ctx = null;
        this.volume = 0.8;
        this.muted = false;
        this.instrument = 'marimba';
        this.scaleName = 'pentatonic';

        // Musical Scales (frequencies in Hz)
        this.scales = {
            pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00], // C D E G A
            major: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25], // C Major
            minor: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25, 587.33, 622.25], // C Minor
            synthwave: [196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
            japanese: [261.63, 277.18, 349.23, 392.00, 415.30, 523.25, 554.37, 698.46, 783.99, 830.61],
            celestial: [329.63, 392.00, 440.00, 523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51]
        };
        this.noteIndex = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return false;
            try {
                this.ctx = new AudioCtx();
            } catch (e) {
                return false;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return true;
    }

    playBounceSound(velocitySq = 100, pitchOffset = 0) {
        if (!this.ctx || this.muted || this.volume <= 0) return;

        const scale = this.scales[this.scaleName] || this.scales.pentatonic;
        const notePos = (this.noteIndex + pitchOffset) % scale.length;
        const freq = scale[Math.abs(notePos)];
        this.noteIndex = (this.noteIndex + 1) % scale.length;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Safe normalized volume (prevent 0 for exponential ramp)
        const impactFactor = Math.min(Math.max(Math.sqrt(velocitySq) / 22, 0.25), 1.0);
        const peakVol = Math.max(impactFactor * this.volume * 0.45, 0.001);

        osc.frequency.setValueAtTime(freq, now);

        switch (this.instrument) {
            case 'marimba':
                osc.type = 'sine';
                gain.gain.setValueAtTime(peakVol, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'synth':
                osc.type = 'sawtooth';
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1400, now);
                filter.frequency.exponentialRampToValueAtTime(180, now + 0.4);
                gain.gain.setValueAtTime(peakVol * 0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.45);
                break;

            case 'piano':
                osc.type = 'triangle';
                gain.gain.setValueAtTime(peakVol * 0.7, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.6);
                break;

            case 'bell':
                osc.type = 'sine';
                const overtone = this.ctx.createOscillator();
                const otGain = this.ctx.createGain();
                overtone.type = 'sine';
                overtone.frequency.setValueAtTime(freq * 2.76, now);
                otGain.gain.setValueAtTime(peakVol * 0.3, now);
                otGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
                overtone.connect(otGain);
                otGain.connect(this.ctx.destination);
                overtone.start(now);
                overtone.stop(now + 0.5);

                gain.gain.setValueAtTime(peakVol * 0.7, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.8);
                break;

            case 'chiptune':
                osc.type = 'square';
                gain.gain.setValueAtTime(peakVol * 0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.16);
                break;

            case 'pluck':
                osc.type = 'triangle';
                const pluckFilter = this.ctx.createBiquadFilter();
                pluckFilter.type = 'bandpass';
                pluckFilter.frequency.setValueAtTime(freq * 1.5, now);
                gain.gain.setValueAtTime(peakVol * 0.8, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
                osc.connect(pluckFilter);
                pluckFilter.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
                break;
        }
    }
    // Effets synthétiques dédiés : tous les sons sont générés en temps réel, sans fichiers externes.
    playFx(name = 'hit', opts = {}) {
        if (!this.ctx || this.muted || this.volume <= 0) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const master = Math.max(0.001, Math.min(1, opts.volume ?? 0.22)) * this.volume;
        const powerId = String(opts.powerId || name);
        let hash = 0;
        for (let i = 0; i < powerId.length; i++) hash = (hash * 31 + powerId.charCodeAt(i)) >>> 0;
        const varied = (hash % 97) / 97;
        const profiles = {
            judgment_ray: { wave: 'sawtooth', low: 780, high: 115, dur: 0.36, steps: [1, 0.56, 0.32] },
            star_hunter: { wave: 'triangle', low: 420, high: 1120, dur: 0.30, steps: [1, 1.5, 2.1] },
            bomb_shrapnel: { wave: 'square', low: 150, high: 48, dur: 0.42, steps: [1, 0.72, 0.42] },
            seismic_nova: { wave: 'sine', low: 105, high: 52, dur: 0.48, steps: [1, 0.5, 0.25] },
            magma_rift: { wave: 'sawtooth', low: 180, high: 65, dur: 0.52, steps: [1, 0.82, 0.45] },
            singularity: { wave: 'sine', low: 640, high: 75, dur: 0.58, steps: [1, 0.5, 0.25] },
            quantum_jump: { wave: 'triangle', low: 280, high: 880, dur: 0.24, steps: [1, 1.8, 2.7] },
            colossus: { wave: 'square', low: 95, high: 44, dur: 0.38, steps: [1, 0.5, 0.25] },
            prism_reflector: { wave: 'sine', low: 900, high: 620, dur: 0.34, steps: [1, 1.33, 1.8] },
            multiplication: { wave: 'triangle', low: 360, high: 720, dur: 0.32, steps: [1, 1.25, 1.65] },
            chain_lightning: { wave: 'sawtooth', low: 980, high: 180, dur: 0.26, steps: [1, 1.8, 0.7] },
            crystal_prison: { wave: 'sine', low: 1050, high: 420, dur: 0.40, steps: [1, 1.5, 2] },
            explosive_flower: { wave: 'triangle', low: 260, high: 920, dur: 0.36, steps: [1, 1.4, 2.2] },
            imprisonment_seal: { wave: 'sawtooth', low: 520, high: 130, dur: 0.46, steps: [1, 0.75, 0.4] }
        };
        const powerKeys = Object.keys(profiles);
        const profile = name === 'power'
            ? (profiles[powerId] || profiles[powerKeys[hash % powerKeys.length]])
            : null;
        const duration = profile ? profile.dur
            : name === 'collision' ? 0.075
            : name === 'wall' ? 0.095
            : name === 'obstacle' ? 0.12
            : name === 'ko' ? 0.62
            : name === 'hit' ? 0.15 : 0.22;
        const baseFreq = profile ? profile.low * (0.94 + varied * 0.12)
            : name === 'collision' ? 145 + (hash % 105)
            : name === 'wall' ? 220 + (hash % 140)
            : name === 'obstacle' ? 115 + (hash % 95)
            : name === 'ko' ? 180 + (hash % 100)
            : name === 'hit' ? 280 + (hash % 100)
            : 260 + (hash % 420);
        const endFreq = profile ? profile.high
            : name === 'collision' ? 72
            : name === 'wall' ? 95
            : name === 'obstacle' ? 58
            : name === 'ko' ? 42
            : name === 'hit' ? 105 : baseFreq * 1.7;

        const makeTone = (frequency, endFrequency, wave, gainScale, offset = 0, length = duration) => {
            const osc = ctx.createOscillator();
            const amp = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = wave;
            osc.frequency.setValueAtTime(Math.max(30, frequency), now + offset);
            osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + offset + length);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(name === 'power' ? 5000 : 2200, now + offset);
            filter.frequency.exponentialRampToValueAtTime(name === 'power' ? 1100 : 420, now + offset + length);
            const peak = Math.max(0.0001, master * gainScale);
            amp.gain.setValueAtTime(0.0001, now + offset);
            amp.gain.linearRampToValueAtTime(peak, now + offset + Math.min(0.012, length * 0.15));
            amp.gain.exponentialRampToValueAtTime(0.0001, now + offset + length);
            osc.connect(filter);
            filter.connect(amp);
            amp.connect(ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + length + 0.02);
        };

        if (profile) {
            // Trois couches donnent une signature différente à chaque pouvoir.
            makeTone(baseFreq, endFreq, profile.wave, 0.58);
            makeTone(baseFreq * profile.steps[1], endFreq * profile.steps[1], 'triangle', 0.22, 0.018, duration * 0.78);
            if (hash % 2 === 0) makeTone(baseFreq * profile.steps[2], endFreq * profile.steps[2], 'sine', 0.13, 0.035, duration * 0.62);
            return;
        }
        if (name === 'ko') {
            makeTone(baseFreq * 1.8, 55, 'sawtooth', 0.5, 0, 0.42);
            makeTone(baseFreq, 38, 'sine', 0.45, 0.045, 0.58);
            makeTone(820, 190, 'triangle', 0.18, 0.015, 0.19);
            return;
        }
        if (name === 'obstacle') {
            makeTone(baseFreq, endFreq, 'triangle', 0.42, 0, duration);
            makeTone(baseFreq * 2.4, endFreq * 1.5, 'sine', 0.16, 0.004, duration * 0.55);
            return;
        }
        if (name === 'collision' || name === 'wall') {
            makeTone(baseFreq, endFreq, name === 'wall' ? 'sine' : 'triangle', 0.48, 0, duration);
            makeTone(baseFreq * 2.2, endFreq * 1.4, 'sine', 0.12, 0.003, duration * 0.55);
            return;
        }
        makeTone(baseFreq, endFreq, name === 'hit' ? 'sawtooth' : 'triangle', name === 'hit' ? 0.36 : 0.42);
        if (name === 'power') makeTone(baseFreq * 1.5, baseFreq * 2.2, 'triangle', 0.22, 0.018, duration * 0.8);
    }

}

// Global audio synth instance
window.audioSynth = new AudioSynth();
