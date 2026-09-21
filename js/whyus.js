(function () {
  'use strict';
  var HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!HAS_GSAP || REDUCED) return;

  function guard(fn) {
    try {
      fn();
    } catch (e) {
      if (window.console) console.error('[Apex/whyus] animation disabled:', e);
    }
  }

  var ST = function (trigger, start) {
    return { trigger: trigger, start: start || 'top 85%', toggleActions: 'play none none reverse' };
  };

  guard(function () {
    // Hero animation
    gsap.from('.page-hero-content', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 });
    gsap.from('.page-hero-visual', { scale: 0.85, opacity: 0, duration: 0.9, ease: 'back.out(1.6)', delay: 0.25 });
    gsap.fromTo('.dial-progress', { strokeDashoffset: 753.98 }, { strokeDashoffset: 8, duration: 1.6, ease: 'power2.out', delay: 0.35 });
    var dialObj = { n: 0 };
    gsap.to(dialObj, {
      n: 99.4, duration: 1.6, ease: 'power2.out', delay: 0.35,
      onUpdate: function () { document.querySelector('.dial-num').textContent = dialObj.n.toFixed(1); }
    });
  });

  guard(function () {
    // Trust band counters
    gsap.utils.toArray('.trust-item h3').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          var raw = el.textContent.trim();
          var match = raw.match(/([\d.]+)/);
          if (!match) return;
          var value = parseFloat(match[1]);
          var decimals = (match[1].split('.')[1] || '').length;
          var prefix = raw.slice(0, match.index);
          var suffix = raw.slice(match.index + match[1].length);
          var obj = { n: 0 };
          gsap.to(obj, {
            n: value, duration: 1.6, ease: 'power2.out',
            onUpdate: function () {
              el.textContent = prefix + (decimals ? obj.n.toFixed(decimals) : Math.round(obj.n)) + suffix;
            }
          });
        }
      });
    });
    gsap.from('.trust-item', { scrollTrigger: ST('.trust-grid', 'top 88%'), y: 25, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 });
  });

  guard(function () {
    // Testing process animation
    gsap.from('.process-step', {
      scrollTrigger: ST('.process-track', 'top 82%'),
      y: 50, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.15
    });
    gsap.from('.process-num', {
      scrollTrigger: ST('.process-track', 'top 78%'),
      scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(3)', stagger: 0.15, delay: 0.2
    });
  });

  guard(function () {
    // Research cards animation
    gsap.from('.research-card', {
      scrollTrigger: ST('.research-grid', 'top 82%'),
      y: 55, opacity: 0, scale: 0.95, duration: 0.75, ease: 'power3.out', stagger: 0.1
    });
    gsap.from('.research-icon', {
      scrollTrigger: ST('.research-grid', 'top 80%'),
      rotationY: 180, duration: 0.75, ease: 'power2.out', stagger: 0.1, delay: 0.2
    });
  });

  guard(function () {
    // Sustainability progress bars
    gsap.utils.toArray('.sustain-row').forEach(function (row) {
      var pct = parseFloat(row.dataset.pct || '0');
      var fill = row.querySelector('.sustain-fill');
      var label = row.querySelector('.sustain-pct');
      var tl = gsap.timeline({ scrollTrigger: ST(row, 'top 88%') });
      tl.from(row, { x: -25, opacity: 0, duration: 0.5, ease: 'power3.out' })
        .to(fill, { width: pct + '%', duration: 1.1, ease: 'power2.out' }, '-=0.3');
      var obj = { n: 0 };
      gsap.to(obj, {
        n: pct, duration: 1.1, ease: 'power2.out',
        scrollTrigger: ST(row, 'top 88%'),
        onUpdate: function () { label.textContent = Math.round(obj.n) + '%'; }
      });
    });
  });

  guard(function () {
    // Comparison table rows
    gsap.from('.compare-row', {
      scrollTrigger: ST('.compare-table', 'top 82%'),
      x: function (i) { return i % 2 ? 30 : -30; },
      opacity: 0, duration: 0.55, ease: 'power3.out', stagger: 0.1
    });
  });

  guard(function () {
    // Certifications + support quote
    gsap.from('.cert-badge', {
      scrollTrigger: ST('.cert-grid', 'top 85%'),
      scale: 0.6, opacity: 0, duration: 0.5, ease: 'back.out(2.5)', stagger: 0.08
    });
    gsap.from('.support-quote', {
      scrollTrigger: ST('.support-quote', 'top 85%'),
      x: 30, opacity: 0, duration: 0.7, ease: 'power3.out'
    });
  });

  guard(function () {
    // Athlete FAQ animation
    gsap.from('.faq-item', {
      scrollTrigger: ST('.faq-wrap', 'top 85%'),
      y: 30, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1
    });
  });
})();