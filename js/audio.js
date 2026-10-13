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
}

// Global audio synth instance
window.audioSynth = new AudioSynth();
