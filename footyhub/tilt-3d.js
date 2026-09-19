/* =========================================================
   FootyHub — Interactive 3D Perspective Tilt & Specular Glare Engine
   Zero-dependency, high-performance GPU-accelerated micro-interactions
   ========================================================= */

(function () {
  'use strict';

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) return;

  const DEFAULT_CONFIG = {
    maxTilt: 12,       // Maximum tilt angle in degrees
    perspective: 900,  // Perspective in px
    scale: 1.03,       // Hover scale factor
    speed: 400,        // Transition speed in ms
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    glare: true,       // Generate specular light reflection
    maxGlare: 0.35     // Maximum glare opacity
  };

  class Tilt3D {
    constructor(element, config = {}) {
      this.el = element;
      this.cfg = { ...DEFAULT_CONFIG, ...config };
      this.width = 0;
      this.height = 0;
      this.left = 0;
      this.top = 0;
      this.ticking = false;
      this.isHovered = false;

      this.currentX = 0;
      this.currentY = 0;
      this.targetX = 0;
      this.targetY = 0;

      this.init();
    }

    init() {
      this.el.style.transformStyle = 'preserve-3d';
      this.el.style.willChange = 'transform';

      if (this.cfg.glare && !this.el.querySelector('.tilt-glare-layer')) {
        this.glareEl = document.createElement('div');
        this.glareEl.className = 'tilt-glare-layer';
        this.glareEl.style.position = 'absolute';
        this.glareEl.style.inset = '0';
        this.glareEl.style.borderRadius = 'inherit';
        this.glareEl.style.pointerEvents = 'none';
        this.glareEl.style.overflow = 'hidden';
        this.glareEl.style.zIndex = '5';
        this.glareEl.style.opacity = '0';
        this.glareEl.style.transition = 'opacity 0.25s ease';

        this.glareShine = document.createElement('div');
        this.glareShine.className = 'tilt-glare-shine';
        this.glareShine.style.position = 'absolute';
        this.glareShine.style.top = '50%';
        this.glareShine.style.left = '50%';
        this.glareShine.style.width = '220%';
        this.glareShine.style.height = '220%';
        this.glareShine.style.transform = 'translate(-50%, -50%)';
        this.glareShine.style.background = 'radial-gradient(circle at center, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.12) 30%, transparent 65%)';
        this.glareShine.style.pointerEvents = 'none';

        this.glareEl.appendChild(this.glareShine);
        this.el.appendChild(this.glareEl);
      } else {
        this.glareEl = this.el.querySelector('.tilt-glare-layer');
        if (this.glareEl) this.glareShine = this.glareEl.querySelector('.tilt-glare-shine');
      }

      this.bindEvents();
    }

    updateBounds() {
      const rect = this.el.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
      this.left = rect.left;
      this.top = rect.top;
    }

    bindEvents() {
      this.onMouseEnter = () => {
        this.isHovered = true;
        this.updateBounds();
        this.el.style.transition = `transform 0.15s ease-out`;
        if (this.glareEl) this.glareEl.style.opacity = '1';
      };

      this.onMouseMove = (e) => {
        if (!this.isHovered) return;
        const x = Math.min(Math.max(e.clientX - this.left, 0), this.width);
        const y = Math.min(Math.max(e.clientY - this.top, 0), this.height);

        // Normalize between -1 and 1
        const normX = (x / this.width) * 2 - 1;
        const normY = (y / this.height) * 2 - 1;

        this.targetX = normX;
        this.targetY = normY;

        if (!this.ticking) {
          this.ticking = true;
          requestAnimationFrame(() => this.render(x, y));
        }
      };

      this.onMouseLeave = () => {
        this.isHovered = false;
        this.targetX = 0;
        this.targetY = 0;
        this.el.style.transition = `transform ${this.cfg.speed}ms ${this.cfg.easing}`;
        this.el.style.transform = `perspective(${this.cfg.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;

        if (this.glareEl) {
          this.glareEl.style.opacity = '0';
        }

        // Reset child depth layers
        const depthElements = this.el.querySelectorAll('[data-tilt-depth], .tilt-depth');
        depthElements.forEach(item => {
          item.style.transition = `transform ${this.cfg.speed}ms ${this.cfg.easing}`;
          item.style.transform = `translateZ(0px)`;
        });
      };

      this.el.addEventListener('mouseenter', this.onMouseEnter, { passive: true });
      this.el.addEventListener('mousemove', this.onMouseMove, { passive: true });
      this.el.addEventListener('mouseleave', this.onMouseLeave, { passive: true });
    }

    render(pixelX, pixelY) {
      if (!this.isHovered) {
        this.ticking = false;
        return;
      }

      // Smooth damp
      this.currentX += (this.targetX - this.currentX) * 0.22;
      this.currentY += (this.targetY - this.currentY) * 0.22;

      // Calculate tilt angles (tilt towards mouse)
      const rotateX = -(this.currentY * this.cfg.maxTilt).toFixed(2);
      const rotateY = (this.currentX * this.cfg.maxTilt).toFixed(2);

      this.el.style.transform = `perspective(${this.cfg.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${this.cfg.scale}, ${this.cfg.scale}, ${this.cfg.scale})`;

      // Dynamic Specular Glare Position
      if (this.glareShine && this.width > 0 && this.height > 0) {
        const percentX = (pixelX / this.width) * 100;
        const percentY = (pixelY / this.height) * 100;
        this.glareShine.style.transform = `translate(${-percentX}%, ${-percentY}%)`;
      }

      // 3D Parallax Depth for child elements (badges, emblems, scores)
      const depthElements = this.el.querySelectorAll('[data-tilt-depth], .tilt-depth, .league-card-icon, .team-logo, .result-score, .points-badge, .stat-badge');
      depthElements.forEach(item => {
        const depth = item.getAttribute('data-tilt-depth') || '20';
        item.style.transform = `translateZ(${depth}px)`;
        item.style.transformStyle = 'preserve-3d';
      });

      if (Math.abs(this.targetX - this.currentX) > 0.005 || Math.abs(this.targetY - this.currentY) > 0.005) {
        requestAnimationFrame(() => this.render(pixelX, pixelY));
      } else {
        this.ticking = false;
      }
    }
  }

  // Auto-initialize across FootyHub cards
  function initTilt() {
    const selector = [
      '.league-card:not(.league-card-disabled)',
      '.match-card',
      '.result-card',
      '.podium-card',
      '.team-lineup-panel',
      '[data-tilt]'
    ].join(',');

    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (!el.__tilt3d) {
        const customTilt = el.dataset.tiltMax ? parseFloat(el.dataset.tiltMax) : 10;
        const customScale = el.dataset.tiltScale ? parseFloat(el.dataset.tiltScale) : 1.025;
        el.__tilt3d = new Tilt3D(el, {
          maxTilt: customTilt,
          scale: customScale
        });
      }
    });
  }

  // Run on DOM load and export helper
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTilt);
  } else {
    initTilt();
  }

  window.FootyHubTilt = {
    init: initTilt,
    Tilt3D: Tilt3D
  };
})();
