/*
 * Le fil d'or : un trait SVG qui se déroule au fil du scroll et relie les chapitres.
 *
 * Le tracé passe par les « nœuds » (un par chapitre) : il descend le long de la marge,
 * puis traverse la page en S d'un chapitre à l'autre. Il ne fait que descendre, ce qui
 * permet de savoir, pour une hauteur donnée, quelle longueur de fil dérouler : la pointe
 * reste ainsi à hauteur fixe dans l'écran, comme une aiguille qui guide la lecture.
 */
export class GoldenThread {
    constructor({ container, svg, line, halo, tip, knots, anchor = 0.6 }) {
        Object.assign(this, { container, svg, line, halo, tip, knots, anchor });
        this.length = 0;
        this.build = this.build.bind(this);
        this.draw = this.draw.bind(this);
        this.build();
    }

    build() {
        const box = this.container.getBoundingClientRect();
        const width = box.width;
        const height = box.height;
        if (!width || !height) {
            return;
        }

        this.top = box.top + window.scrollY;
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        const knots = this.knots.map((knot) => {
            const rect = knot.getBoundingClientRect();
            const section = knot.closest('section')?.getBoundingClientRect() ?? rect;
            const y = rect.top + rect.height / 2 - box.top;

            return { x: rect.left + rect.width / 2 - box.left, y, bottom: Math.max(y + 40, section.bottom - box.top - 120) };
        });

        let previous = { x: width / 2, y: 0 };
        let d = `M ${previous.x} 0`;
        // Traversée en S : tangentes verticales aux deux bouts, toujours vers le bas.
        const swingTo = (to) => {
            const half = (to.y - previous.y) / 2;
            d += ` C ${previous.x} ${previous.y + half}, ${to.x} ${to.y - half}, ${to.x} ${to.y}`;
            previous = to;
        };
        // Descente le long de la marge, avec une légère ondulation de fil tenu à la main.
        const sway = Math.min(12, width * 0.012);
        const runTo = (y) => {
            const steps = Math.max(1, Math.round((y - previous.y) / 260));
            const h = (y - previous.y) / steps;
            for (let i = 0; i < steps; i++) {
                const side = i % 2 ? -sway : sway;
                const y0 = previous.y;
                d += ` C ${previous.x + side} ${y0 + h / 3}, ${previous.x - side} ${y0 + (2 * h) / 3}, ${previous.x} ${y0 + h}`;
                previous = { x: previous.x, y: y0 + h };
            }
        };

        knots.forEach((knot) => {
            swingTo(knot);
            runTo(knot.bottom);
        });
        swingTo({ x: width / 2, y: height });

        this.line.setAttribute('d', d);
        this.halo.setAttribute('d', d);
        this.length = this.line.getTotalLength();

        // Table hauteur → position le long du fil (getPointAtLength est trop lent pour chaque frame).
        const count = Math.ceil(this.length / 6) + 1;
        this.step = this.length / (count - 1);
        this.xs = new Float32Array(count);
        this.ys = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const point = this.line.getPointAtLength(i * this.step);
            this.xs[i] = point.x;
            this.ys[i] = i ? Math.max(point.y, this.ys[i - 1]) : point.y;
        }

        this.knotLengths = knots.map((knot) => this.lengthAt(knot.y));
        for (const path of [this.line, this.halo]) {
            path.style.strokeDasharray = `${this.length} ${this.length}`;
        }
        this.draw();
    }

    lengthAt(y) {
        const { ys } = this;
        const last = ys.length - 1;
        if (y <= ys[0]) return { length: 0, index: 0, t: 0 };
        if (y >= ys[last]) return { length: this.length, index: last, t: 0 };

        let low = 0;
        let high = last;
        while (high - low > 1) {
            const middle = (low + high) >> 1;
            if (ys[middle] <= y) low = middle;
            else high = middle;
        }
        const span = ys[high] - ys[low];
        const t = span > 0 ? (y - ys[low]) / span : 0;

        return { length: (low + t) * this.step, index: low, t };
    }

    draw() {
        if (!this.length) {
            return;
        }

        const target = window.scrollY + window.innerHeight * this.anchor - this.top;
        const { length, index, t } = this.lengthAt(target);
        const next = Math.min(index + 1, this.xs.length - 1);
        const x = this.xs[index] + (this.xs[next] - this.xs[index]) * t;
        const y = this.ys[index] + (this.ys[next] - this.ys[index]) * t;

        const offset = this.length - length;
        this.line.style.strokeDashoffset = offset;
        this.halo.style.strokeDashoffset = offset;
        this.tip.setAttribute('transform', `translate(${x} ${y})`);
        this.tip.style.opacity = length > 2 && length < this.length - 2 ? 1 : 0;
        this.knots.forEach((knot, i) => knot.classList.toggle('is-lit', length >= this.knotLengths[i].length - 4));
    }

    destroy() {
        for (const path of [this.line, this.halo]) {
            path.removeAttribute('d');
            path.style.removeProperty('stroke-dasharray');
            path.style.removeProperty('stroke-dashoffset');
        }
        this.tip.style.removeProperty('opacity');
        this.knots.forEach((knot) => knot.classList.remove('is-lit'));
    }
}
