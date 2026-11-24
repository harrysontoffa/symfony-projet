import { gsap } from 'gsap';

/*
 * Poussière de lumière dessinée sur un <canvas> fixe.
 *
 * Elle flotte doucement, s'écarte du pointeur, et réagit au scroll : les grains
 * proches filent plus vite (parallaxe) et s'étirent en traînées quand on défile vite.
 * Sa teinte suit le décor du chapitre en cours (or, nacre, argent, ambre…).
 */
export class DustField {
    constructor(canvas, { velocity = () => 0 } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.velocity = velocity;
        this.count = window.matchMedia('(max-width: 767px)').matches ? 34 : 70;
        this.tint = [253, 224, 170];
        this.targetTint = [...this.tint];
        this.intensity = 1;
        this.speed = 0;
        this.pointer = { x: -9999, y: -9999 };

        this.resize = this.resize.bind(this);
        this.tick = this.tick.bind(this);
        this.onPointerMove = (event) => {
            this.pointer.x = event.clientX;
            this.pointer.y = event.clientY;
        };

        this.resize();
        this.particles = Array.from({ length: this.count }, () => this.spawn());
        this.sprite = this.makeSprite();

        window.addEventListener('resize', this.resize);
        window.addEventListener('pointermove', this.onPointerMove, { passive: true });
        gsap.ticker.add(this.tick);
    }

    spawn() {
        const z = 0.25 + Math.random() ** 1.5 * 0.75;

        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            z,
            size: 2 + z * 7,
            alpha: 0.25 + Math.random() * 0.55,
            drift: (Math.random() - 0.5) * 0.25,
            rise: -0.05 - Math.random() * 0.15,
            phase: Math.random() * Math.PI * 2,
            twinkle: 0.6 + Math.random() * 1.6,
        };
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = this.canvas.clientWidth || window.innerWidth;
        this.height = this.canvas.clientHeight || window.innerHeight;
        this.canvas.width = Math.round(this.width * dpr);
        this.canvas.height = Math.round(this.height * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Halo doux pré-rendu dans la teinte courante : bien moins cher qu'un dégradé par grain.
    makeSprite() {
        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = 64;
        const context = sprite.getContext('2d');
        const [r, g, b] = this.tint.map(Math.round);
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 252, 240, 1)');
        gradient.addColorStop(0.18, `rgba(${r}, ${g}, ${b}, 0.9)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        this.spriteTint = this.tint.map(Math.round).join();

        return sprite;
    }

    /** @param {string|undefined} rgb « r, g, b » */
    tintTo(rgb) {
        const parts = (rgb ?? '').split(',').map(Number);
        if (parts.length === 3 && parts.every(Number.isFinite)) {
            this.targetTint = parts;
        }
    }

    setIntensity(value) {
        this.intensity = Math.max(0, Math.min(1, value));
    }

    tick(time, deltaTime) {
        const { ctx, width, height } = this;
        const step = Math.min(deltaTime, 50) / 16.67;

        this.speed += (this.velocity() - this.speed) * 0.12;
        let tintMoved = false;
        for (let i = 0; i < 3; i++) {
            const delta = this.targetTint[i] - this.tint[i];
            if (Math.abs(delta) > 0.5) {
                this.tint[i] += delta * 0.04;
                tintMoved = true;
            }
        }
        if (tintMoved && this.tint.map(Math.round).join() !== this.spriteTint) {
            this.sprite = this.makeSprite();
        }

        ctx.clearRect(0, 0, width, height);
        if (this.intensity <= 0.01) {
            return;
        }

        const [r, g, b] = this.tint.map(Math.round);
        const streak = Math.min(Math.abs(this.speed) * 1.5, 70);
        const direction = Math.sign(this.speed);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';

        for (const p of this.particles) {
            p.x += (p.drift + Math.sin(time * 0.5 + p.phase) * 0.12) * step;
            p.y += (p.rise - this.speed * 0.4 * p.z) * step;

            const dx = p.x - this.pointer.x;
            const dy = p.y - this.pointer.y;
            const distance2 = dx * dx + dy * dy;
            if (distance2 < 16000 && distance2 > 1) {
                const push = (1 - distance2 / 16000) * 2.2 * step;
                const distance = Math.sqrt(distance2);
                p.x += (dx / distance) * push;
                p.y += (dy / distance) * push;
            }

            if (p.y < -30) { p.y = height + 30; p.x = Math.random() * width; }
            else if (p.y > height + 30) { p.y = -30; p.x = Math.random() * width; }
            if (p.x < -30) { p.x = width + 30; }
            else if (p.x > width + 30) { p.x = -30; }

            const alpha = p.alpha * (0.55 + 0.45 * Math.sin(time * p.twinkle + p.phase)) * this.intensity;
            if (alpha < 0.02) {
                continue;
            }

            const length = streak * p.z;
            if (length > 3) {
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`;
                ctx.lineWidth = Math.max(1, p.size * 0.22);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x, p.y + length * direction);
                ctx.stroke();
            }

            ctx.globalAlpha = alpha;
            ctx.drawImage(this.sprite, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
            ctx.globalAlpha = 1;
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    destroy() {
        gsap.ticker.remove(this.tick);
        window.removeEventListener('resize', this.resize);
        window.removeEventListener('pointermove', this.onPointerMove);
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}
