/* ==========================================================================
   Ball Physics Entity
   ========================================================================== */

class Ball {
    constructor(x, y, vx, vy, radius, hue) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.hue = hue || Math.floor(Math.random() * 360);
        this.trail = [];
        this.maxTrail = 20;
    }

    get color() {
        return `hsl(${this.hue}, 100%, 65%)`;
    }

    recordTrail() {
        this.trail.push({ x: this.x, y: this.y, hue: this.hue });
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
        this.hue = (this.hue + 0.4) % 360;
    }

    draw(ctx, enableTrail, style = {}) {
        const glowScale = style.visualStyle === 'minimal' ? 0 : style.visualStyle === 'soft' ? 0.4 : 1;
        const glowBlur = Math.max(0, (style.glowIntensity ?? 1) * 18 * glowScale);
        // Glowing Trail
        if (enableTrail && this.trail.length > 1) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const p1 = this.trail[i];
                const p2 = this.trail[i + 1];
                const alpha = (i / this.trail.length) * 0.65;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `hsla(${p1.hue}, 100%, 60%, ${alpha})`;
                ctx.lineWidth = (i / this.trail.length) * (this.radius * (style.visualStyle === 'minimal' ? 0.8 : 1.6));
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        }

        // Glowing Ball Body
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = glowBlur;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Glossy Specular Highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.32, this.y - this.radius * 0.32, this.radius * 0.36, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
        ctx.restore();
    }
}
