import { Controller } from '@hotwired/stimulus';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger, SplitText);

/*
 * Page /books : la bibliothèque qui s'ouvre au scroll.
 *
 * - Le titre se « compose » lettre par lettre (SplitText).
 * - Chaque livre est un objet 3D (couverture, dos, tranche, 4e de couverture) qui
 *   arrive par la tranche puis pivote vers sa couverture, piloté par le scroll
 *   (ScrollTrigger scrub), avec un décalage par colonne et un reflet qui balaie la couverture.
 * - Un mot géant en contour glisse derrière les livres.
 * - Un marque-page ambre descend avec la progression du scroll.
 * - Lenis rend le défilement fluide.
 *
 * Tout est désactivé si l'utilisateur a demandé moins d'animations (prefers-reduced-motion).
 */
export default class extends Controller {
    static targets = ['intro', 'title', 'reveal', 'grid', 'item', 'ghost', 'ribbon'];

    connect() {
        this.teardown = this.teardown.bind(this);
        // Turbo met la page en cache avant de la quitter : on la remet dans son état d'origine.
        document.addEventListener('turbo:before-cache', this.teardown);

        this.mm = gsap.matchMedia();
        this.mm.add('(prefers-reduced-motion: no-preference)', () => {
            this.startSmoothScroll();
            this.animateIntro();
            this.animateBooks();
            this.animateGhost();
            this.animateRibbon();

            return () => this.stopSmoothScroll();
        });
    }

    disconnect() {
        document.removeEventListener('turbo:before-cache', this.teardown);
        this.teardown();
    }

    teardown() {
        this.mm?.revert();
        this.mm = null;
    }

    startSmoothScroll() {
        this.lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
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

    animateIntro() {
        if (!this.hasIntroTarget) {
            return;
        }

        if (this.hasTitleTarget) {
            SplitText.create(this.titleTarget, {
                type: 'words, chars',
                mask: 'words',
                autoSplit: true,
                onSplit: (self) => gsap.from(self.chars, {
                    yPercent: 120,
                    rotateX: -80,
                    transformPerspective: 600,
                    transformOrigin: '50% 100%',
                    duration: 1.4,
                    ease: 'expo.out',
                    stagger: 0.035,
                    delay: 0.15,
                }),
            });
        }

        gsap.from(this.revealTargets, {
            y: 28,
            opacity: 0,
            duration: 1.1,
            ease: 'power3.out',
            stagger: 0.12,
            delay: 0.55,
        });

        // L'en-tête s'efface doucement en remontant.
        gsap.to(this.introTarget, {
            yPercent: -25,
            opacity: 0.2,
            ease: 'none',
            scrollTrigger: { trigger: this.introTarget, start: 'top 15%', end: 'bottom top', scrub: true },
        });
    }

    animateBooks() {
        if (!this.hasGridTarget) {
            return;
        }

        const columns = () => getComputedStyle(this.gridTarget).gridTemplateColumns.split(' ').length;
        const alreadyVisible = [];

        this.itemTargets.forEach((item, index) => {
            const book = item.querySelector('[data-book="scroll"]');
            const sheen = item.querySelector('[data-book="sheen"]');
            const shadow = item.querySelector('[data-book="shadow"]');
            // Chaque colonne démarre un peu plus tard : la rangée se déploie en vague.
            const column = () => index % columns();

            gsap.timeline({
                scrollTrigger: {
                    trigger: item,
                    start: () => `top bottom-=${column() * 80}`,
                    end: () => `top ${60 - column() * 4}%`,
                    scrub: 1.2,
                    invalidateOnRefresh: true,
                },
            })
                .fromTo(book, { rotateY: 86, rotateX: 12, z: -280, yPercent: 18 }, { rotateY: 0, rotateX: 0, z: 0, yPercent: 0, duration: 1, ease: 'power3.out' }, 0)
                .fromTo(shadow, { opacity: 0, scaleX: 0.2 }, { opacity: 1, scaleX: 1, duration: 1, ease: 'power2.out' }, 0)
                .fromTo(sheen, { xPercent: -150 }, { xPercent: 230, duration: 0.6, ease: 'power1.inOut' }, 0.35);

            if (item.getBoundingClientRect().top < window.innerHeight) {
                alreadyVisible.push(item.querySelector('[data-book="intro"]'));
            }
        });

        // Les livres visibles dès le chargement sortent de l'étagère tout seuls.
        gsap.from(alreadyVisible, {
            rotateY: 80,
            z: -320,
            y: 90,
            duration: 1.7,
            ease: 'expo.out',
            stagger: 0.09,
            delay: 0.35,
        });
    }

    animateGhost() {
        if (!this.hasGhostTarget || !this.hasGridTarget) {
            return;
        }

        gsap.fromTo(this.ghostTarget, { xPercent: 8 }, {
            xPercent: -62,
            ease: 'none',
            scrollTrigger: { trigger: this.gridTarget, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });
    }

    animateRibbon() {
        if (!this.hasRibbonTarget) {
            return;
        }

        gsap.set(this.ribbonTarget, { visibility: 'visible' });
        gsap.fromTo(this.ribbonTarget, { yPercent: -88 }, {
            yPercent: 0,
            ease: 'none',
            scrollTrigger: { start: 0, end: 'max', scrub: 0.4 },
        });
    }
}
