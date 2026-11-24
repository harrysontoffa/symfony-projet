import { Controller } from '@hotwired/stimulus';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { DustField } from '../story/dust_field.js';
import { GoldenThread } from '../story/golden_thread.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

/*
 * Accueil : l'histoire de la bibliothèque, de l'aube à la nuit, racontée au scroll.
 *
 * Prologue    un livre relié s'ouvre (ex-libris au nom du lecteur), la lumière monte,
 *             on plonge dans la page… et l'on se réveille à l'aube.
 * Chapitres   chaque chapitre relève sa photo depuis le bas ; un fil d'or se déroule
 *             de l'un à l'autre ; les citations s'allument mot à mot.
 *             II : les catégories tanguent comme des barques au rythme du scroll.
 *             III : les derniers livres s'allument derrière des fenêtres.
 *             IV : les parcours se relient en Grande Ourse.
 * Épilogue    une lettre cachetée arrive, le cachet se brise, elle se déplie en trois.
 * Fin         la bougie s'éteint : « À suivre… ».
 *
 * Le décor réagit au scroll : la poussière de lumière file et s'étire selon la vitesse
 * et prend la teinte de chaque chapitre.
 *
 * Avec prefers-reduced-motion : aucun mouvement, seul le décor change de chapitre en chapitre.
 */
export default class extends Controller {
    static targets = [
        'scene', 'night', 'dust', 'flash', 'tocLink',
        'prologue', 'prologueStage', 'heroText', 'heroTitle', 'heroLine', 'cue',
        'bookAnchor', 'bookIntro', 'bookTilt', 'book', 'cover', 'ribbon', 'pageLine', 'pageLight', 'glow', 'rays',
        'chapters', 'chapter', 'thread', 'threadLine', 'threadHalo', 'threadTip', 'knot', 'numeral', 'quote', 'reveal', 'count',
        'wave', 'chip', 'facade', 'window', 'sky', 'starLine',
        'epilogue', 'letterIntro', 'letter', 'letterTop', 'letterBottom', 'letterShade', 'sealHalf', 'flourish',
        'coda', 'codaTitle',
    ];

    connect() {
        this.teardown = this.teardown.bind(this);
        // Turbo garde une copie de la page avant de la quitter : on la remet dans son état d'origine.
        document.addEventListener('turbo:before-cache', this.teardown);

        this.mm = gsap.matchMedia();
        this.mm.add({
            motion: '(prefers-reduced-motion: no-preference)',
            still: '(prefers-reduced-motion: reduce)',
            finePointer: '(pointer: fine)',
        }, (context) => (context.conditions.motion ? this.setupMotion(context.conditions) : this.setupStill()));
    }

    disconnect() {
        document.removeEventListener('turbo:before-cache', this.teardown);
        this.teardown();
    }

    teardown() {
        this.mm?.revert();
        this.mm = null;
    }

    // ------------------------------------------------------------------ mise en place

    setupMotion({ finePointer }) {
        // Allonge le prologue et l'épilogue (variante CSS story-motion:) avant de mesurer quoi que ce soit.
        this.element.setAttribute('data-story-motion', '');
        this.startSmoothScroll();

        this.dust = new DustField(this.dustTarget, { velocity: () => this.lenis?.velocity ?? 0 });

        this.buildPrologue();
        this.buildIntro();
        this.buildScenes();
        this.buildThread();
        this.buildChapters();
        this.buildWave();
        this.buildWindows();
        this.buildSky();
        this.buildLetter();
        this.buildCoda();
        this.trackChapters();
        if (finePointer) {
            this.bindTilt();
        }

        // Les polices changent la hauteur des textes : on remesure une fois chargées.
        document.fonts?.ready.then(() => this.mm && ScrollTrigger.refresh());

        return () => {
            this.element.removeAttribute('data-story-motion');
            this.unbindTilt();
            this.dust?.destroy();
            this.dust = null;
            this.thread?.destroy();
            this.thread = null;
            this.countTargets.forEach((element) => {
                element.textContent = element.dataset.countTo;
            });
            this.stopSmoothScroll();
        };
    }

    setupStill() {
        // Pas de mouvement : le décor change simplement d'un chapitre à l'autre.
        const layers = this.sceneTargets;
        this.sceneSections().forEach((section) => {
            const index = layers.findIndex((layer) => layer.dataset.scene === section.dataset.scene);
            ScrollTrigger.create({
                trigger: section,
                start: 'top 60%',
                end: 'bottom 60%',
                onToggle: (self) => {
                    if (!self.isActive) return;
                    layers.forEach((layer, i) => layer.style.setProperty('--rise', i <= index ? '100%' : '0%'));
                    this.activate(section);
                },
            });
        });

        return () => layers.forEach((layer) => layer.style.removeProperty('--rise'));
    }

    startSmoothScroll() {
        this.lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
        this.lenis.on('scroll', ScrollTrigger.update);
        this.raf = (time) => this.lenis.raf(time * 1000);
        gsap.ticker.add(this.raf);
        gsap.ticker.lagSmoothing(0);
    }

    stopSmoothScroll() {
        gsap.ticker.remove(this.raf);
        gsap.ticker.lagSmoothing(500, 33);
        this.lenis?.destroy();
        this.lenis = null;
    }

    // ------------------------------------------------------------------ prologue

    buildPrologue() {
        if (!this.hasPrologueTarget || !this.hasBookTarget) return;

        const library = this.sceneLayer('bibliotheque')?.querySelector('img');
        const dawn = this.sceneLayer('aube');

        const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                trigger: this.prologueTarget,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.7,
                onUpdate: (self) => this.setTilt(self.progress < 0.04),
            },
        });

        // 1. Le texte s'efface, le livre vient au centre et se redresse.
        tl.to(this.heroTextTarget, { yPercent: -16, autoAlpha: 0, duration: 1.6, ease: 'power1.in' }, 0)
            .to(this.cueTarget, { autoAlpha: 0, duration: 0.5 }, 0)
            .to(this.bookAnchorTarget, { '--shift': 0, duration: 2.2, ease: 'power2.inOut' }, 0)
            .fromTo(this.bookTarget, { rotationX: 16, rotationY: -26, rotationZ: -3 }, { rotationX: 6, rotationY: 0, rotationZ: 0, scale: 1.06, duration: 2.2, ease: 'power2.inOut' }, 0)
            // 2. La couverture s'ouvre, le signet se déroule, la lumière sort des pages.
            .to(this.coverTarget, { rotationY: -176, duration: 3.2, ease: 'power2.inOut' }, 2)
            .to(this.bookTarget, { xPercent: 50, rotationX: 0, duration: 3.2, ease: 'power2.inOut' }, 2)
            .to(this.ribbonTarget, { scaleY: 1.8, duration: 3, ease: 'power1.inOut' }, 2.4)
            .fromTo(this.glowTarget, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1.15, duration: 3, ease: 'power1.out' }, 2.8)
            .fromTo(this.raysTarget, { autoAlpha: 0 }, { autoAlpha: 1, duration: 3 }, 3.2)
            .fromTo(this.pageLightTarget, { autoAlpha: 0 }, { autoAlpha: 0.85, duration: 2 }, 3.4)
            // 3. « Il était une fois… » s'écrit sur la page.
            .from(this.pageLineTargets, { autoAlpha: 0, y: 10, stagger: 0.35, duration: 0.9, ease: 'power1.out' }, 4.4)
            // 4. On plonge dans la page, tout devient lumière… et l'aube apparaît.
            .to(this.bookTarget, { xPercent: 0, yPercent: -6, scale: 5.5, duration: 2.6, ease: 'power3.in' }, 6.8)
            .to(this.flashTarget, { autoAlpha: 1, duration: 1.2, ease: 'power2.in' }, 8.1)
            .set(dawn, { '--rise': '100%' }, 9.3)
            .set(this.prologueStageTarget, { autoAlpha: 0 }, 9.3)
            .to(this.flashTarget, { autoAlpha: 0, duration: 0.9, ease: 'power1.out' }, 9.3);

        if (library) {
            tl.fromTo(library, { scale: 1.04 }, { scale: 1.2, duration: 9.3 }, 0);
        }
    }

    // Entrée à l'ouverture de la page (créée après la timeline du prologue pour ne pas fausser ses valeurs de départ).
    buildIntro() {
        if (this.hasHeroTitleTarget) {
            SplitText.create(this.heroTitleTarget, {
                type: 'words, chars',
                mask: 'words',
                autoSplit: true,
                onSplit: (self) => gsap.from(self.chars, { yPercent: 110, rotation: 4, duration: 1.25, ease: 'expo.out', stagger: 0.026, delay: 0.2 }),
            });
        }
        gsap.from(this.heroLineTargets, { y: 24, autoAlpha: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, delay: 0.55 });
        if (this.hasBookIntroTarget) {
            gsap.from(this.bookIntroTarget, { y: 160, rotationX: 38, rotationZ: -16, duration: 2.1, ease: 'expo.out', delay: 0.3 });
            gsap.from(this.bookAnchorTarget, { autoAlpha: 0, duration: 1.1, delay: 0.3 });
        }
        if (this.hasCueTarget) {
            gsap.from(this.cueTarget, { autoAlpha: 0, y: 12, duration: 1, delay: 1.4 });
        }
    }

    bindTilt() {
        if (!this.hasBookTiltTarget) return;

        this.tiltEnabled = true;
        this.tiltX = gsap.quickTo(this.bookTiltTarget, 'rotationX', { duration: 0.9, ease: 'power3' });
        this.tiltY = gsap.quickTo(this.bookTiltTarget, 'rotationY', { duration: 0.9, ease: 'power3' });
        this.onPointerMove = (event) => {
            if (!this.tiltEnabled) return;
            this.tiltY((event.clientX / window.innerWidth - 0.5) * 22);
            this.tiltX((event.clientY / window.innerHeight - 0.5) * -14);
        };
        window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    }

    unbindTilt() {
        if (this.onPointerMove) {
            window.removeEventListener('pointermove', this.onPointerMove);
        }
        this.onPointerMove = this.tiltX = this.tiltY = null;
    }

    setTilt(enabled) {
        if (!this.tiltX || this.tiltEnabled === enabled) return;

        this.tiltEnabled = enabled;
        if (!enabled) {
            this.tiltX(0);
            this.tiltY(0);
        }
    }

    // ------------------------------------------------------------------ décor

    buildScenes() {
        this.sceneSections().forEach((section) => {
            const layer = this.sceneLayer(section.dataset.scene);
            const image = layer?.querySelector('img');
            if (!layer || section === this.prologueTarget) return;

            if (section.dataset.sceneReveal !== 'flash') {
                // La photo se relève depuis le bas, en reculant légèrement.
                gsap.timeline({ scrollTrigger: { trigger: section, start: 'top 92%', end: 'top 18%', scrub: 0.5 } })
                    .fromTo(layer, { '--rise': '0%' }, { '--rise': '100%', ease: 'none' }, 0)
                    .fromTo(image, { scale: 1.25, yPercent: 5 }, { scale: 1.08, yPercent: 0, ease: 'power1.out' }, 0);
            }

            // Puis un lent travelling pendant tout le chapitre.
            gsap.fromTo(image, { scale: 1.08 }, {
                scale: 1,
                yPercent: -3,
                ease: 'none',
                immediateRender: false,
                scrollTrigger: { trigger: section, start: 'top 18%', end: 'bottom top', scrub: true },
            });
        });
    }

    trackChapters() {
        this.sceneSections().forEach((section) => {
            ScrollTrigger.create({
                trigger: section,
                start: 'top 55%',
                end: 'bottom 55%',
                onToggle: (self) => self.isActive && this.activate(section),
            });
        });
    }

    activate(section) {
        this.tocLinkTargets.forEach((link) => {
            if (link.hash === `#${section.id}`) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
        this.dust?.tintTo(this.sceneLayer(section.dataset.scene)?.dataset.tint);
    }

    goTo(event) {
        const target = document.querySelector(event.currentTarget.hash);
        if (!target || !this.lenis) return; // sans Lenis, le saut d'ancre natif suffit

        event.preventDefault();
        this.lenis.scrollTo(target, { duration: 1.8 });
    }

    // ------------------------------------------------------------------ chapitres

    buildThread() {
        if (!this.hasThreadTarget || !this.hasChaptersTarget || !this.knotTargets.length) return;

        this.thread = new GoldenThread({
            container: this.chaptersTarget,
            svg: this.threadTarget,
            line: this.threadLineTarget,
            halo: this.threadHaloTarget,
            tip: this.threadTipTarget,
            knots: this.knotTargets,
        });
        ScrollTrigger.create({
            trigger: this.chaptersTarget,
            start: 'top bottom',
            end: 'bottom top',
            onUpdate: this.thread.draw,
            onRefresh: this.thread.build,
        });
    }

    buildChapters() {
        this.numeralTargets.forEach((numeral) => {
            gsap.fromTo(numeral, { yPercent: 35 }, {
                yPercent: -45,
                ease: 'none',
                scrollTrigger: { trigger: numeral.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true },
            });
        });

        // Les citations s'allument mot à mot, au rythme de la lecture.
        this.quoteTargets.forEach((quote) => {
            SplitText.create(quote, {
                type: 'words',
                autoSplit: true,
                onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.16 }, {
                    opacity: 1,
                    ease: 'none',
                    stagger: 0.1,
                    scrollTrigger: { trigger: quote, start: 'top 80%', end: 'bottom 50%', scrub: true },
                }),
            });
        });

        this.revealTargets.forEach((element) => {
            gsap.from(element, {
                y: 56,
                autoAlpha: 0,
                duration: 1.1,
                ease: 'power3.out',
                scrollTrigger: { trigger: element, start: 'top 88%', toggleActions: 'play none none reverse' },
            });
        });

        this.countTargets.forEach((element) => {
            const counter = { value: 0 };
            gsap.to(counter, {
                value: Number(element.dataset.countTo) || 0,
                duration: 1.8,
                ease: 'power2.out',
                scrollTrigger: { trigger: element, start: 'top 90%' },
                onStart: () => { element.textContent = '0'; },
                onUpdate: () => { element.textContent = Math.round(counter.value).toLocaleString('fr-FR'); },
            });
        });
    }

    // Chapitre II : les catégories tanguent sur une houle qui avance avec le scroll.
    buildWave() {
        if (!this.hasWaveTarget || !this.chipTargets.length) return;

        const chips = this.chipTargets;
        const setters = chips.map((chip) => ({ y: gsap.quickSetter(chip, 'y', 'px'), rotation: gsap.quickSetter(chip, 'rotation', 'deg') }));
        let phases = [];
        const measure = () => {
            const width = this.waveTarget.offsetWidth || 1;
            phases = chips.map((chip) => ((chip.offsetLeft + chip.offsetWidth / 2) / width) * Math.PI * 2.4 + chip.offsetTop / 50);
        };
        const swell = (progress) => {
            const t = progress * Math.PI * 5;
            setters.forEach((set, i) => {
                set.y(Math.sin(phases[i] - t) * 16);
                set.rotation(Math.cos(phases[i] - t) * 5);
            });
        };

        measure();
        gsap.from(chips, {
            autoAlpha: 0,
            scale: 0.5,
            duration: 0.9,
            ease: 'back.out(2)',
            stagger: { each: 0.04, from: 'center' },
            scrollTrigger: { trigger: this.waveTarget, start: 'top 88%', toggleActions: 'play none none reverse' },
        });
        ScrollTrigger.create({
            trigger: this.waveTarget,
            start: 'top bottom',
            end: 'bottom top',
            onRefresh: (self) => { measure(); swell(self.progress); },
            onUpdate: (self) => swell(self.progress),
        });
    }

    // Chapitre III : les fenêtres s'allument une à une, avec le petit vacillement d'une lampe.
    buildWindows() {
        if (!this.windowTargets.length) return;

        const order = this.windowTargets
            .map((element, i) => ({ element, key: Math.abs(Math.sin((i + 1) * 12.9898) * 43758.5453) % 1 }))
            .sort((a, b) => a.key - b.key)
            .map(({ element }) => element);
        const flicker = (p) => Math.max(0, Math.min(1, p * (1 + 0.7 * Math.sin(p * 42) * (1 - p))));

        const tl = gsap.timeline({ scrollTrigger: { trigger: this.hasFacadeTarget ? this.facadeTarget : this.windowTargets[0], start: 'top 80%', end: 'bottom 55%', scrub: 0.4 } });
        order.forEach((element, i) => tl.fromTo(element, { '--lit': 0 }, { '--lit': 1, duration: 1, ease: flicker }, i * 0.55));
    }

    // Chapitre IV : la Grande Ourse se trace étoile après étoile.
    buildSky() {
        if (!this.hasSkyTarget || !this.starLineTargets.length) return;

        const stars = new Map([...this.skyTarget.querySelectorAll('[data-slot]')].map((element) => [element.dataset.slot, element]));
        const lit = new Set();
        const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: this.skyTarget, start: 'top 80%', end: 'bottom 92%', scrub: 0.5 } });
        const light = (slot, at) => {
            const star = stars.get(slot);
            if (!star || lit.has(slot)) return;
            lit.add(slot);
            tl.fromTo(star, { '--glow': 0 }, { '--glow': 1, duration: 0.6, ease: 'power2.out' }, at);
        };

        let at = 0;
        this.starLineTargets.forEach((line) => {
            light(line.dataset.from, at);
            at += 0.3;
            tl.fromTo(line, { attr: { x2: line.getAttribute('x1'), y2: line.getAttribute('y1') } }, { attr: { x2: line.getAttribute('x2'), y2: line.getAttribute('y2') }, duration: 1 }, at);
            at += 1;
            light(line.dataset.to, at - 0.15);
        });
    }

    // ------------------------------------------------------------------ épilogue et fin

    buildLetter() {
        if (!this.hasLetterTarget || !this.hasEpilogueTarget) return;

        const [shadeTop, shadeBottom] = this.letterShadeTargets;
        const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: this.epilogueTarget, start: 'top top', end: 'bottom bottom', scrub: 0.7 },
        });

        tl.fromTo(this.letterTarget, { y: '30vh', rotation: -8, scale: 0.84 }, { y: 0, rotation: -2.5, scale: 1, duration: 2, ease: 'power2.out' }, 0)
            .to(this.sealHalfTargets, { x: (i) => (i ? 38 : -38), y: 56, rotation: (i) => (i ? 26 : -26), autoAlpha: 0, duration: 1.1, ease: 'power2.in' }, 2.1)
            .to(this.letterIntroTarget, { autoAlpha: 0, y: -24, duration: 1 }, 3)
            .fromTo(this.letterTopTarget, { z: 2, rotationX: -180, transformOrigin: '50% 100%' }, { z: 2, rotationX: 0, duration: 2.2, ease: 'power2.inOut' }, 3.2)
            .fromTo(this.letterBottomTarget, { z: 1, rotationX: 180, transformOrigin: '50% 0%' }, { z: 1, rotationX: 0, duration: 2.2, ease: 'power2.inOut' }, 5)
            .to(this.letterTarget, { rotation: 0, duration: 3.8, ease: 'power1.inOut' }, 3.2);

        // Ombre qui passe sur le papier pendant qu'il se déplie.
        [[shadeTop, 3.2], [shadeBottom, 5]].forEach(([shade, at]) => {
            if (!shade) return;
            tl.fromTo(shade, { autoAlpha: 0 }, { autoAlpha: 0.6, duration: 1.1, ease: 'power1.in' }, at)
                .to(shade, { autoAlpha: 0, duration: 1.1, ease: 'power1.out' }, at + 1.1);
        });

        if (this.hasFlourishTarget) {
            tl.fromTo(this.flourishTarget, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' }, 7);
        }
        tl.to({}, { duration: 1.2 });
    }

    // Un lien de la lettre reçoit le focus clavier : on la déplie pour qu'il soit visible.
    revealLetter() {
        if (!this.lenis || !this.hasEpilogueTarget) return;

        const box = this.epilogueTarget.getBoundingClientRect();
        const end = box.bottom + window.scrollY - window.innerHeight;
        if (Math.abs(window.scrollY - end) > 4) {
            this.lenis.scrollTo(end, { duration: 1.2 });
        }
    }

    buildCoda() {
        if (!this.hasCodaTarget) return;

        // La bougie s'éteint : le décor plonge dans le noir, la poussière retombe.
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: this.codaTarget,
                start: 'top bottom',
                end: 'top 20%',
                scrub: true,
                onUpdate: (self) => this.dust?.setIntensity(1 - self.progress * 0.85),
            },
        });
        if (this.hasNightTarget) {
            tl.fromTo(this.nightTarget, { autoAlpha: 0 }, { autoAlpha: 0.92, ease: 'power1.in' }, 0);
        }
        if (this.hasCodaTitleTarget) {
            tl.from(this.codaTitleTarget, { autoAlpha: 0, y: 70, letterSpacing: '0.12em', ease: 'power2.out' }, 0.25);
        }
    }

    // ------------------------------------------------------------------ outils

    sceneSections() {
        return [
            this.hasPrologueTarget && this.prologueTarget,
            ...this.chapterTargets,
            this.hasEpilogueTarget && this.epilogueTarget,
        ].filter(Boolean);
    }

    sceneLayer(key) {
        return this.sceneTargets.find((layer) => layer.dataset.scene === key);
    }
}
