/* ==========================================================
   APEX ATHLETICS — script.js
   Original behaviour + GSAP / ScrollTrigger motion layer
   Load order in index.html:
     gsap.min.js -> ScrollTrigger.min.js -> ScrollToPlugin.min.js -> this file
   Every GSAP block is guarded: if anything throws, the page
   falls back to the plain CSS reveal and nothing stays hidden.

   FIX (earlier revision): the "Athlete voices + footer" tweens used
   to sit at the top level of the IIFE while calling ST(), which is
   only defined inside the `if (ANIMATE) guard(...)` block. That threw
   a ReferenceError and aborted the rest of the file — which is why
   the 404 overlay and the mobile menu below it never got bound.
   Those tweens now live inside the guarded block with the others.

   NOTE (earlier revision): the preloader logo swap (basketball icon ->
   stackly_logo.webp) is markup + CSS only. The preloader timeline
   targets the .sports-loader wrapper, so no JS changes were needed.

   FIX (earlier revision): pressing Go Back on the 404 page returned to
   the footer position and then jumped to the top of the page. Cause:
   scroll was forced to the top on EVERY load. It is now only forced
   on a fresh visit or reload; on back/forward navigation the browser's
   own scroll restoration is left alone.

   FIX (this revision): the inline script in the <head> of index.html
   (and any other page copying it) was ALSO forcing scroll to the top on
   every load, which overrode the fix above. That head script now skips
   back/forward navigations too. As a safety net, this file also saves
   the scroll position when the visitor leaves and restores it on
   back/forward if the browser did not do so itself (see restoreScroll).
   ========================================================== */

(function () {
  'use strict';

  // Fresh visit or reload -> start clean at the top. Reloading mid-scroll used
  // to leave the hero half-transformed: the browser restores the old scroll
  // position before this script runs, so the hero and the preloader's
  // full-screen overlay would initialize against a stale position. Forcing
  // scroll-to-top keeps the intro identical on a fresh load and a reload.
  //
  // Back/forward (e.g. returning from the 404 page) -> do NOT force the top.
  // Let the browser put the visitor back exactly where they were.
  var navType = 'navigate';
  try {
    var navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry && navEntry.type) navType = navEntry.type;
  } catch (e) {}

  var canRestore = 'scrollRestoration' in history;

  if (navType === 'back_forward') {
    try { if (canRestore) history.scrollRestoration = 'auto'; } catch (e) {}
  } else {
    try { if (canRestore) history.scrollRestoration = 'manual'; } catch (e) {}
    window.scrollTo(0, 0);
  }

  // 'manual' is stored on this history entry, which would block scroll
  // restoration when the visitor comes back to it. Reset it as they leave.
  // Also remember where they were, as a fallback for restoring on return.
  var SCROLL_KEY = 'apex-scroll:' + location.pathname;

  window.addEventListener('pagehide', function () {
    try { if (canRestore) history.scrollRestoration = 'auto'; } catch (e) {}
    try { sessionStorage.setItem(SCROLL_KEY, String(window.pageYOffset || 0)); } catch (e) {}
  });

  // Back/forward only: if the browser did not put the visitor back where they
  // were, jump to the saved position (instantly, ignoring CSS smooth scroll).
  function restoreScroll() {
    if (navType !== 'back_forward') return;
    var saved;
    try { saved = parseInt(sessionStorage.getItem(SCROLL_KEY), 10); } catch (e) {}
    if (!isNaN(saved) && Math.abs((window.pageYOffset || 0) - saved) > 5) {
      window.scrollTo({ top: saved, left: 0, behavior: 'instant' });
    }
  }

  var HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ANIMATE = HAS_GSAP && !REDUCED;
  var introDone = false;

  // Must match the nav breakpoint in styles.css (section 14).
  var NAV_BREAKPOINT = 992;

  if (ANIMATE) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);
    document.documentElement.classList.add('gsap-enabled');
  }

  /* ----------------------------------------------------------
     0. Safety net
     ---------------------------------------------------------- */
  var ANIMATED_SELECTOR = [
    '.reveal', '.g-word', '.category-card', '.product-card', '.product-badge',
    '.benefit-card', '.why-card', '.why-icon-box', '.benefit-icon', '.tech-card',
    '.tech-list li', '.about-image-column', '.about-content-column > *', '.about-badge',
    '.athlete-card', '.strip-item', '.footer-col', '.social-btn'
  ].join(', ');

  function showEverything() {
    document.querySelectorAll(ANIMATED_SELECTOR).forEach(function (el) {
      el.style.opacity = '';
      el.style.transform = '';
      el.style.visibility = '';
      el.classList.add('active');
    });
  }

  function bail(err) {
    if (window.console) console.error('[Apex] animation disabled:', err);
    ANIMATE = false;
    document.documentElement.classList.remove('gsap-enabled');
    var p = document.getElementById('preloader');
    if (p) { p.style.opacity = '0'; p.style.visibility = 'hidden'; }
    document.body.classList.remove('loading');
    showEverything();
    restoreScroll();
  }

  function guard(fn) {
    try { fn(); } catch (e) { bail(e); }
  }

  // Hard failsafe: whatever happened, nothing stays invisible past 5s.
  setTimeout(function () {
    if (!introDone) {
      var p = document.getElementById('preloader');
      if (p && p.style.visibility !== 'hidden') {
        p.style.opacity = '0';
        p.style.visibility = 'hidden';
        document.body.classList.remove('loading');
      }
    }
  }, 5000);

  /* ----------------------------------------------------------
     1. Helpers
     ---------------------------------------------------------- */

  // Wraps each word in <b class="g-word">.
  // A <b> is used deliberately, NOT a <span>: the CSS already styles
  // `.hero-content h1 span` and `.section-title h2 span`, and spans here
  // would inherit the orange stroke / colour meant for one phrase only.
  function splitWords(root) {
    if (!root || root.dataset.split === '1') {
      return root ? Array.prototype.slice.call(root.querySelectorAll('.g-word')) : [];
    }
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          if (!child.nodeValue.trim()) return;
          var frag = document.createDocumentFragment();
          child.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              var w = document.createElement('b');
              w.className = 'g-word';
              w.textContent = part;
              frag.appendChild(w);
              words.push(w);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.className !== 'g-word') {
          walk(child);
        }
      });
    })(root);
    root.dataset.split = '1';
    return words;
  }

  function parseStat(text) {
    var match = text.match(/([\d.,]+)/);
    if (!match) return null;
    var raw = match[1].replace(/,/g, '');
    return {
      value: parseFloat(raw),
      prefix: text.slice(0, match.index),
      suffix: text.slice(match.index + match[1].length),
      decimals: (raw.split('.')[1] || '').length
    };
  }

  function countUp(el) {
    var data = parseStat(el.textContent.trim());
    if (!data) return;
    var obj = { n: 0 };
    gsap.to(obj, {
      n: data.value,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: function () {
        var n = data.decimals
          ? obj.n.toFixed(data.decimals)
          : Math.round(obj.n).toLocaleString('en-US');
        el.textContent = data.prefix + n + data.suffix;
      }
    });
  }

  /* ----------------------------------------------------------
     2. Hero intro
     The hero has no entrance animation or scroll effects.
     ---------------------------------------------------------- */
  function startHero() {
    introDone = true;
  }

  /* ----------------------------------------------------------
     3. Preloader
     ---------------------------------------------------------- */
  function runPreloader() {
    var preloader = document.getElementById('preloader');

    if (!preloader) { startHero(); return; }

    if (!ANIMATE) {
      setTimeout(function () {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        document.body.classList.remove('loading');
        restoreScroll();
        introDone = true;
      }, 1000);
      return;
    }

    try {
      gsap.timeline({ delay: 0.7 })
        .to('.preloader-text', { opacity: 0, y: -15, duration: 0.3 })
        .to('.sports-loader', { scale: 0.4, opacity: 0, duration: 0.4, ease: 'back.in(2)' }, '-=0.2')
        .to(preloader, {
          yPercent: -100,
          duration: 0.7,
          ease: 'power4.inOut',
          onStart: function () {
            document.body.classList.remove('loading');
            restoreScroll();
          },
          onComplete: function () {
            preloader.style.visibility = 'hidden';
            ScrollTrigger.refresh();
          }
        })
        .add(startHero, '-=0.3');
    } catch (e) { bail(e); }
  }

  // Wait for both the `load` event AND web fonts before the preloader lifts,
  // so Teko is painted before anything is revealed or measured.
  function boot() {
    var fontsReady = (window.document.fonts && window.document.fonts.ready)
      ? window.document.fonts.ready.catch(function () {})
      : Promise.resolve();
    fontsReady.then(runPreloader);
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);

  /* ----------------------------------------------------------
     4. Scroll reveal fallback (no GSAP / reduced motion)
     ---------------------------------------------------------- */
  var revealElements = document.querySelectorAll('.reveal');

  function checkReveal() {
    var triggerBottom = window.innerHeight * 0.85;
    revealElements.forEach(function (el) {
      if (el.getBoundingClientRect().top < triggerBottom) el.classList.add('active');
    });
  }

  if (!ANIMATE) {
    if (REDUCED) revealElements.forEach(function (el) { el.classList.add('active'); });
    else {
      window.addEventListener('scroll', checkReveal);
      checkReveal();
    }
  }

  /* ----------------------------------------------------------
     5. Scroll choreography
     ---------------------------------------------------------- */
  if (ANIMATE) guard(function () {

    var ST = function (trigger, start) {
      return { trigger: trigger, start: start || 'top 85%', toggleActions: 'play none none reverse' };
    };

    /* --- Progress bar --- */
    var bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    /* --- Header condense --- */
    ScrollTrigger.create({
      start: 'top -80',
      end: 'max',
      onToggle: function (self) {
        document.querySelector('header').classList.toggle('scrolled', self.isActive);
      }
    });

    /* --- Hero: no scroll effects — it stays static while you scroll past it --- */

    /* --- Section headings, word by word --- */
    gsap.utils.toArray('.section-title').forEach(function (title) {
      var words = splitWords(title.querySelector('h2'));
      if (words.length) {
        gsap.from(words, {
          scrollTrigger: ST(title),
          yPercent: 100, rotationX: -70, opacity: 0,
          transformOrigin: '50% 100%', duration: 0.65, ease: 'power3.out', stagger: 0.04
        });
      }
      var sub = title.querySelector('p');
      if (sub) gsap.from(sub, { scrollTrigger: ST(title), y: 18, opacity: 0, duration: 0.55, delay: 0.15 });
    });

    /* --- Categories: side flip --- */
    gsap.from('.category-card', {
      scrollTrigger: ST('.category-grid', 'top 82%'),
      rotationY: function (i) { return i % 2 ? -70 : 70; },
      z: -160, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1
    });

    /* --- Products: hinge up, badge pop, stars --- */
    gsap.from('.product-card', {
      scrollTrigger: ST('.product-grid', 'top 82%'),
      rotationX: -60, y: 50, opacity: 0,
      transformOrigin: '50% 100%', duration: 0.85, ease: 'power3.out', stagger: 0.09
    });
    gsap.from('.product-badge', {
      scrollTrigger: ST('.product-grid', 'top 78%'),
      scale: 0, opacity: 0, duration: 0.45, ease: 'back.out(3)', stagger: 0.09, delay: 0.4
    });
    gsap.utils.toArray('.product-rating').forEach(function (row) {
      gsap.from(row.querySelectorAll('i'), {
        scrollTrigger: ST(row, 'top 90%'),
        scale: 0, opacity: 0, duration: 0.3, ease: 'back.out(4)', stagger: 0.05
      });
    });

    /* --- Benefits: door flip --- */
    gsap.utils.toArray('.benefit-card').forEach(function (card, i) {
      gsap.timeline({ scrollTrigger: ST(card) })
        .from(card, {
          rotationY: 85,
          transformOrigin: i % 2 ? 'right center' : 'left center',
          opacity: 0, duration: 0.85, ease: 'power3.out'
        })
        .from(card.querySelector('.benefit-icon'), {
          rotationY: 180, scale: 0.4, opacity: 0, duration: 0.55, ease: 'back.out(2)'
        }, '-=0.4')
        .from(card.querySelector('.benefit-number'), { x: 25, opacity: 0, duration: 0.45 }, '-=0.45')
        .from(card.querySelector('.gear-connection'), { x: -20, opacity: 0, duration: 0.45 }, '-=0.3');
    });

    /* --- Why us --- */
    gsap.from('.why-card', {
      scrollTrigger: ST('.why-us-grid', 'top 82%'),
      y: 60, opacity: 0, scale: 0.94, duration: 0.75, ease: 'power3.out', stagger: 0.08
    });
    gsap.from('.why-icon-box', {
      scrollTrigger: ST('.why-us-grid', 'top 80%'),
      rotationY: 180, duration: 0.8, ease: 'power2.out', stagger: 0.08, delay: 0.2
    });

    /* --- About --- */
    gsap.from('.about-image-column', {
      scrollTrigger: ST('.about-container', 'top 80%'),
      x: -60, rotationY: 18, opacity: 0, duration: 0.9, ease: 'power3.out'
    });
    gsap.from('.about-content-column > *', {
      scrollTrigger: ST('.about-container', 'top 78%'),
      x: 45, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1
    });
    gsap.to('.about-main-img', {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: '.about-us', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.from('.about-badge', {
      scrollTrigger: ST('.about-image-column', 'top 70%'),
      scale: 0, rotation: -20, opacity: 0, duration: 0.6, ease: 'back.out(2)', delay: 0.35
    });

    gsap.utils.toArray('.stat-item h3, .about-badge .badge-num').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () { countUp(el); }
      });
    });

    /* --- Tech hub --- */
    gsap.utils.toArray('.tech-card').forEach(function (card, i) {
      gsap.timeline({ scrollTrigger: ST(card) })
        .from(card, {
          y: 70, rotationX: 22, opacity: 0,
          transformOrigin: '50% 0%', duration: 0.85, ease: 'power3.out', delay: i * 0.07
        })
        .from(card.querySelectorAll('.tech-list li'), {
          x: -20, opacity: 0, duration: 0.4, stagger: 0.08
        }, '-=0.35');
    });

    /* --- Athlete voices (moved inside the guard — see header note) --- */
    gsap.from('.athlete-card', {
      scrollTrigger: ST('.athlete-grid', 'top 82%'),
      y: 55, rotationX: 18, opacity: 0,
      transformOrigin: '50% 0%', duration: 0.8, ease: 'power3.out', stagger: 0.12
    });
    gsap.from('.strip-item', {
      scrollTrigger: ST('.athlete-strip', 'top 88%'),
      x: -25, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.1
    });

    /* --- Footer --- */
    gsap.from('.footer-col', {
      scrollTrigger: ST('footer', 'top 88%'),
      y: 45, opacity: 0, duration: 0.65, ease: 'power3.out', stagger: 0.09
    });
    gsap.from('.social-btn', {
      scrollTrigger: ST('footer', 'top 85%'),
      x: 25, opacity: 0, duration: 0.45, stagger: 0.07, delay: 0.2
    });

    /* --- Cursor tilt: pointer devices only, so phones are untouched --- */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      gsap.utils.toArray('.product-card, .category-card').forEach(function (card) {
        var lift = card.classList.contains('product-card') ? -8 : 0;
        var rx = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power2.out' });
        var ry = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power2.out' });

        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 12);
          rx((0.5 - (e.clientY - r.top) / r.height) * 12);
        });
        card.addEventListener('mouseenter', function () {
          gsap.to(card, { y: lift, scale: 1.02, duration: 0.35, ease: 'power2.out' });
        });
        card.addEventListener('mouseleave', function () {
          rx(0); ry(0);
          gsap.to(card, { y: 0, scale: 1, duration: 0.45, ease: 'power2.out' });
        });
      });

      /* --- Magnetic buttons (hero CTAs excluded) --- */
      gsap.utils.toArray('.btn').filter(function (btn) {
        return !btn.closest('.hero-buttons');
      }).forEach(function (btn) {
        var x = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power2.out' });
        var y = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power2.out' });
        btn.addEventListener('mousemove', function (e) {
          if (!introDone) return;
          var r = btn.getBoundingClientRect();
          x((e.clientX - r.left - r.width / 2) * 0.25);
          y((e.clientY - r.top - r.height / 2) * 0.35);
        });
        btn.addEventListener('mouseleave', function () { x(0); y(0); });
      });
    }

    /* --- Smooth anchors with header offset --- */
    if (window.ScrollToPlugin) {
      document.querySelectorAll('a[href^="#"]:not(.trigger-404)').forEach(function (link) {
        link.addEventListener('click', function (e) {
          var target = document.querySelector(link.getAttribute('href'));
          if (!target) return;
          e.preventDefault();
          gsap.to(window, { duration: 1, ease: 'power2.inOut', scrollTo: { y: target, offsetY: 80 } });
        });
      });
    }
  });

  /* ----------------------------------------------------------
     6. Contact form (unchanged behaviour)
     ---------------------------------------------------------- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (ANIMATE) {
        gsap.fromTo(contactForm, { x: 0 },
          { keyframes: [{ x: -8 }, { x: 8 }, { x: 0 }], duration: 0.4, ease: 'power2.out' });
      }
      alert('Thank you for reaching out! A representative will contact you shortly.');
      contactForm.reset();
    });
  }

  /* ----------------------------------------------------------
     7. 404 overlay router
     ---------------------------------------------------------- */
  var page404 = document.getElementById('page-404');
  var close404Btn = document.getElementById('close404Btn');

  document.querySelectorAll('.trigger-404').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!page404) return;
      closeMenu();
      page404.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (!ANIMATE) return;
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(page404, { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .from(page404.querySelector('h1'), { scale: 0.5, opacity: 0, duration: 0.55, ease: 'back.out(2)' }, '-=0.1')
        .from(page404.querySelectorAll('h2, p, .btn'), { y: 22, opacity: 0, duration: 0.4, stagger: 0.09 }, '-=0.25');
    });
  });

  if (close404Btn) {
    close404Btn.addEventListener('click', function () {
      if (!page404) return;
      var done = function () {
        page404.classList.remove('active');
        page404.style.opacity = '';
        document.body.style.overflow = '';
      };
      if (ANIMATE) gsap.to(page404, { opacity: 0, duration: 0.3, onComplete: done });
      else done();
    });
  }

  /* ----------------------------------------------------------
     8. Mobile menu
     Opens the full nav list under the header, locks the page
     behind it, and closes on: link tap, outside tap, Escape,
     or the viewport growing back past the nav breakpoint.
     ---------------------------------------------------------- */
  var menuToggle = document.querySelector('.menu-toggle');
  var navLinks = document.querySelector('.nav-links');
  var header = document.querySelector('header');

  function setToggleIcon(open) {
    if (!menuToggle) return;
    menuToggle.innerHTML = open
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  function closeMenu() {
    if (!navLinks || !navLinks.classList.contains('open')) return;
    navLinks.classList.remove('open');
    document.body.classList.remove('nav-open');
    setToggleIcon(false);
  }

  function openMenu() {
    if (!navLinks) return;
    navLinks.classList.add('open');
    document.body.classList.add('nav-open');
    setToggleIcon(true);
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (navLinks.classList.contains('open')) closeMenu();
      else openMenu();
    });

    // Tapping any link closes the panel before navigating / scrolling.
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    // Tap anywhere outside the header.
    document.addEventListener('click', function (e) {
      if (!navLinks.classList.contains('open')) return;
      if (header && header.contains(e.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') closeMenu();
    });

    // Rotating to landscape / resizing past the breakpoint must not leave
    // the page scroll-locked behind a panel that is no longer visible.
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth > NAV_BREAKPOINT) closeMenu();
        if (ANIMATE && window.ScrollTrigger) ScrollTrigger.refresh();
      }, 150);
    });
  }
})();