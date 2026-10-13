/* ==========================================================================
   PRNG - Pseudo-Random Number Generator (Mulberry32)
   Provides 100% deterministic, seed-based reproducibility.
   ========================================================================== */

class PRNG {
    constructor(seed = 123456) {
        this.setSeed(seed);
    }

    setSeed(seed) {
        // Ensure 32-bit positive integer
        this.seed = Math.floor(Math.abs(seed)) % 2147483647;
        if (this.seed === 0) this.seed = 123456;
        this.state = this.seed;
    }

    // Returns float in [0, 1)
    random() {
        let t = (this.state += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Returns float in [min, max)
    range(min, max) {
        return min + this.random() * (max - min);
    }

    // Returns integer in [min, max]
    rangeInt(min, max) {
        return Math.floor(this.range(min, max + 1));
    }
}

window.PRNG = PRNG;
