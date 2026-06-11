import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export { gsap, ScrollTrigger };

export const EASE_ENTER = 'power4.out';
export const EASE_EXIT  = 'power2.in';

export function initPageEnter() {
  gsap.registerPlugin(ScrollTrigger);
  gsap.from(document.body, {
    opacity: 0,
    x: 40,
    duration: 0.6,
    ease: EASE_ENTER,
    clearProps: 'all',
  });
}

export function initPageExit(href: string) {
  gsap.to(document.body, {
    opacity: 0,
    x: -40,
    duration: 0.45,
    ease: EASE_EXIT,
    onComplete: () => { window.location.href = href; },
  });
}

export function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.batch('.animate-on-scroll', {
    onEnter: (els) => {
      gsap.from(els, { opacity: 0, y: 30, duration: 0.5, stagger: 0.08, ease: 'power3.out' });
    },
    once: true,
  });
}

export function animateModalOpen(el: HTMLElement) {
  gsap.from(el, { opacity: 0, scale: 0.95, duration: 0.25, ease: 'power2.out' });
}

export function animateModalClose(el: HTMLElement, onDone: () => void) {
  gsap.to(el, { opacity: 0, scale: 0.95, duration: 0.2, ease: 'power2.in', onComplete: onDone });
}
