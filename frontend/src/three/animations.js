/**
 * StegX GSAP Animations
 * Page transitions, entrance animations, and continuous effects.
 */
import gsap from 'gsap';

// Page transition
export function pageTransition(container, callback) {
  const tl = gsap.timeline();

  tl.to(container, {
    opacity: 0,
    y: -20,
    duration: 0.2,
    ease: 'power2.in',
    onComplete: () => {
      if (callback) callback();
      gsap.fromTo(container, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    },
  });
}

// Animate elements into view with stagger
export function staggerIn(selector, options = {}) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) return;

  gsap.fromTo(elements,
    { opacity: 0, y: 30, scale: 0.97 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: options.duration || 0.5,
      stagger: options.stagger || 0.08,
      ease: options.ease || 'power3.out',
      delay: options.delay || 0.1,
    }
  );
}

// Fade in element
export function fadeIn(element, options = {}) {
  gsap.fromTo(element,
    { opacity: 0, y: options.y || 20 },
    {
      opacity: 1,
      y: 0,
      duration: options.duration || 0.5,
      ease: options.ease || 'power3.out',
      delay: options.delay || 0,
    }
  );
}

// Slide in from side
export function slideIn(element, direction = 'left', options = {}) {
  const x = direction === 'left' ? -50 : direction === 'right' ? 50 : 0;
  const y = direction === 'up' ? 50 : direction === 'down' ? -50 : 0;

  gsap.fromTo(element,
    { opacity: 0, x, y },
    {
      opacity: 1,
      x: 0,
      y: 0,
      duration: options.duration || 0.6,
      ease: 'power3.out',
      delay: options.delay || 0,
    }
  );
}

// Counter animation
export function animateCounter(element, target, options = {}) {
  const obj = { value: 0 };
  gsap.to(obj, {
    value: target,
    duration: options.duration || 1.5,
    ease: 'power2.out',
    delay: options.delay || 0,
    onUpdate: () => {
      element.textContent = Math.round(obj.value).toLocaleString();
    },
  });
}

// Progress bar animation
export function animateProgress(element, percentage, options = {}) {
  gsap.fromTo(element,
    { width: '0%' },
    {
      width: `${percentage}%`,
      duration: options.duration || 1,
      ease: 'power2.out',
      delay: options.delay || 0.3,
    }
  );
}

// Glow pulse
export function glowPulse(element) {
  gsap.to(element, {
    boxShadow: '0 0 30px rgba(0, 229, 255, 0.3), 0 0 60px rgba(0, 229, 255, 0.1)',
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
}

// Neon text flicker
export function neonFlicker(element) {
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
  tl.to(element, { opacity: 0.8, duration: 0.05 })
    .to(element, { opacity: 1, duration: 0.05 })
    .to(element, { opacity: 0.7, duration: 0.08 })
    .to(element, { opacity: 1, duration: 0.05 });
}

// Float animation
export function floatElement(element, options = {}) {
  gsap.to(element, {
    y: options.distance || -10,
    duration: options.duration || 2,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  });
}

// Scale pop
export function scalePop(element) {
  gsap.fromTo(element,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
  );
}

// Loading shimmer
export function addShimmer(element) {
  gsap.fromTo(element,
    { backgroundPosition: '200% 0' },
    {
      backgroundPosition: '-200% 0',
      duration: 1.5,
      ease: 'linear',
      repeat: -1,
    }
  );
}

// Typing effect
export function typeText(element, text, options = {}) {
  element.textContent = '';
  let index = 0;
  const speed = options.speed || 30;

  return new Promise(resolve => {
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
