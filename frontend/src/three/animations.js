/**
 * StegX GSAP Animations — v2.0 Enhanced Rewrite
 *
 * Features:
 *  - Page transitions with direction awareness
 *  - Intersection Observer for scroll-triggered animations
 *  - Magnetic button hover effect
 *  - Ripple click effect utility
 *  - Morphing number transitions
 *  - Parallax scroll effect
 *  - All original animations preserved + improved
 */
import gsap from 'gsap';

/* ── Page Transitions ──────────────────────────────────────────── */

/** Fade out → callback → fade in. */
export function pageTransition(container, callback) {
  const tl = gsap.timeline();
  tl.to(container, {
    opacity: 0,
    y: -20,
    duration: 0.2,
    ease: 'power2.in',
    onComplete: () => {
      if (callback) callback();
      gsap.fromTo(
        container,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    },
  });
}

/* ── Entrance Animations ───────────────────────────────────────── */

/** Stagger-in multiple elements matching a selector. */
export function staggerIn(selector, opts = {}) {
  const els = document.querySelectorAll(selector);
  if (els.length === 0) return;

  gsap.fromTo(
    els,
    { opacity: 0, y: 30, scale: 0.97 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: opts.duration || 0.5,
      stagger: opts.stagger || 0.08,
      ease: opts.ease || 'power3.out',
      delay: opts.delay || 0.1,
    }
  );
}

/** Fade in a single element. */
export function fadeIn(element, opts = {}) {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, y: opts.y || 20 },
    {
      opacity: 1,
      y: 0,
      duration: opts.duration || 0.5,
      ease: opts.ease || 'power3.out',
      delay: opts.delay || 0,
    }
  );
}

/** Slide in from a direction. */
export function slideIn(element, direction = 'left', opts = {}) {
  if (!element) return;
  const x = direction === 'left' ? -50 : direction === 'right' ? 50 : 0;
  const y = direction === 'up' ? 50 : direction === 'down' ? -50 : 0;

  gsap.fromTo(
    element,
    { opacity: 0, x, y },
    {
      opacity: 1,
      x: 0,
      y: 0,
      duration: opts.duration || 0.6,
      ease: 'power3.out',
      delay: opts.delay || 0,
    }
  );
}

/* ── Counter / Progress ────────────────────────────────────────── */

/** Animate a number from 0 to `target`. */
export function animateCounter(element, target, opts = {}) {
  if (!element) return;
  const obj = { value: 0 };
  gsap.to(obj, {
    value: target,
    duration: opts.duration || 1.5,
    ease: 'power2.out',
    delay: opts.delay || 0,
    onUpdate: () => {
      element.textContent = Math.round(obj.value).toLocaleString();
    },
  });
}

/**
 * Morphing number transition — smoothly changes a number display.
 * Better than animateCounter for updating an already-displayed number.
 */
export function morphNumber(element, from, to, opts = {}) {
  if (!element) return;
  const obj = { value: from };
  gsap.to(obj, {
    value: to,
    duration: opts.duration || 0.8,
    ease: 'power2.out',
    onUpdate: () => {
      const formatted = opts.format
        ? opts.format(obj.value)
        : Math.round(obj.value).toLocaleString();
      element.textContent = formatted;
    },
  });
}

/** Animate a progress bar width. */
export function animateProgress(element, percentage, opts = {}) {
  if (!element) return;
  gsap.fromTo(
    element,
    { width: opts.from || '0%' },
    {
      width: `${percentage}%`,
      duration: opts.duration || 1,
      ease: 'power2.out',
      delay: opts.delay || 0.3,
    }
  );
}

/* ── Continuous Effects ────────────────────────────────────────── */

/** Neon glow pulse on an element. */
export function glowPulse(element) {
  if (!element) return;
  return gsap.to(element, {
    boxShadow:
      '0 0 30px rgba(0,229,255,0.3), 0 0 60px rgba(0,229,255,0.1)',
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
}

/** Neon text flicker. */
export function neonFlicker(element) {
  if (!element) return;
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
  tl.to(element, { opacity: 0.8, duration: 0.05 })
    .to(element, { opacity: 1, duration: 0.05 })
    .to(element, { opacity: 0.7, duration: 0.08 })
    .to(element, { opacity: 1, duration: 0.05 });
  return tl;
}

/** Gentle float animation. */
export function floatElement(element, opts = {}) {
  if (!element) return;
  return gsap.to(element, {
    y: opts.distance || -10,
    duration: opts.duration || 2,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  });
}

/** Scale-pop entrance. */
export function scalePop(element) {
  if (!element) return;
  gsap.fromTo(
    element,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
  );
}

/** Loading shimmer. */
export function addShimmer(element) {
  if (!element) return;
  return gsap.fromTo(
    element,
    { backgroundPosition: '200% 0' },
    {
      backgroundPosition: '-200% 0',
      duration: 1.5,
      ease: 'linear',
      repeat: -1,
    }
  );
}

/* ── Typing Effect ─────────────────────────────────────────────── */

/** Typewriter effect — resolves when complete. */
export function typeText(element, text, opts = {}) {
  if (!element) return Promise.resolve();
  element.textContent = '';
  let index = 0;
  const speed = opts.speed || 30;

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      element.textContent += text[index];
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

/* ── Scroll-Triggered Animations (IntersectionObserver) ────────── */

/**
 * Observe elements and trigger stagger-in animation when they scroll into view.
 * @param {string} selector - CSS selector for elements to observe
 * @param {object} [opts] - animation options
 */
export function observeAndAnimate(selector, opts = {}) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          gsap.fromTo(
            entry.target,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: opts.duration || 0.6,
              ease: 'power3.out',
            }
          );
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: opts.threshold || 0.1, rootMargin: opts.rootMargin || '0px' }
  );

  elements.forEach((el) => {
    el.style.opacity = '0';
    observer.observe(el);
  });

  return observer;
}

/* ── Magnetic Hover Effect ─────────────────────────────────────── */

/**
 * Add magnetic hover effect to elements.
 * Elements subtly follow the cursor when hovered.
 */
export function addMagneticEffect(selector, strength = 0.3) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      gsap.to(el, { x, y, duration: 0.3, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    });
  });
}

/* ── Ripple Click Effect ───────────────────────────────────────── */

/**
 * Add ripple click effect to elements.
 * Creates a spreading circle at the click point.
 */
export function addRippleEffect(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => {
    el.style.position = el.style.position || 'relative';
    el.style.overflow = 'hidden';

    el.addEventListener('click', (e) => {
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('div');
      const size = Math.max(rect.width, rect.height) * 2;

      ripple.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none;
        background:rgba(0,229,255,0.2);
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top:${e.clientY - rect.top - size / 2}px;
        transform:scale(0); opacity:1;
      `;

      el.appendChild(ripple);
      gsap.to(ripple, {
        scale: 1,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => ripple.remove(),
      });
    });
  });
}

/* ── Parallax Scroll ───────────────────────────────────────────── */

/**
 * Add parallax scroll effect to elements.
 * Elements move at different speeds based on their data-parallax-speed attribute.
 */
export function initParallax(selector = '[data-parallax-speed]') {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) return;

  const container = document.getElementById('content') || window;

  const onScroll = () => {
    const scrollY = container === window ? window.scrollY : container.scrollTop;
    elements.forEach((el) => {
      const speed = parseFloat(el.dataset.parallaxSpeed || '0.5');
      const offset = scrollY * speed;
      gsap.set(el, { y: -offset });
    });
  };

  container.addEventListener('scroll', onScroll, { passive: true });
  return () => container.removeEventListener('scroll', onScroll);
}
