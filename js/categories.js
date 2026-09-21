/* ==========================================================
   APEX ATHLETICS — categories.js
   Ported from index.html's script.js so both pages share one
   animation language: word-split headings, bespoke
   per-section 3D entrances, cursor tilt, magnetic buttons,
   scroll progress bar, condensed header — plus this page's own
   equipment filter, flip cards and 404 router.

   Load order in categories.html:
     gsap.min.js -> ScrollTrigger.min.js -> ScrollToPlugin.min.js -> this file

   Every GSAP block is guarded: if anything throws, the page falls
   back to the plain CSS .reveal fade and nothing stays hidden.
   ========================================================== */

(function () {
  'use strict';

  // Reloading mid-scroll used to leave the page half-transformed: the
  // browser restores the old scroll position before this script runs, so
  // scroll-linked animation would initialize against that stale position instead of a clean top-of-page
  // state. Forcing scroll-to-top here, before GSAP/ScrollTrigger touch
  // anything, makes a reload look identical to a fresh load. The <head>
  // script in categories.html already does this before paint; this repeats
  // it once the DOM/script itself is running.
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  window.scrollTo(0, 0);

  // Back/forward-cache restores (Safari and some Firefox/Chrome flows) can
  // reapply the browser's own scroll position on 'pageshow' — after the
  // scrollTo above already ran — which is what made a reload sometimes
  // land mid-page instead of at the top. Forcing it again here catches
  // that case too.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) window.scrollTo(0, 0);
  });

  var HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ANIMATE = HAS_GSAP && !REDUCED;
  var introDone = false;

  // Must match the nav breakpoint in categories.css.
  var NAV_BREAKPOINT = 992;

  if (ANIMATE) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);
    document.documentElement.classList.add('gsap-enabled');
  }

  /* ----------------------------------------------------------
     0. Safety net
     Whatever happens, nothing on this page stays invisible.
     ---------------------------------------------------------- */
  var ANIMATED_SELECTOR = [
    '.reveal', '.g-word', '.category-card', '.why-card', '.why-icon-box',
    '.product-card', '.product-badge', '.benefit-card', '.review-card',
    '.ambassador-card', '.ambassador-img-wrap', '.footer-col', '.social-btn',
    '.specs-table tbody tr', '.category-filters .filter-btn'
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
    showEverything();
  }

  function guard(fn) {
    try { fn(); } catch (e) { bail(e); }
  }

  /* ----------------------------------------------------------
     1. Helpers
     ---------------------------------------------------------- */

  // Wraps each word in <b class="g-word">.
  // A <b> is used deliberately, NOT a <span>: the CSS already styles
  // `.hero-content h1 span` and `.section-title h2 span`, and spans here
  // would inherit colouring meant for one phrase only.
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

  /* ----------------------------------------------------------
     2. Hero: intentionally no entrance animation (matches index).
     There's no preloader gating the page anymore, so this just
     flips the flag magnetic buttons check before engaging.
     ---------------------------------------------------------- */
  function startHero() {
    introDone = true;
  }

  // Wait for web fonts so Teko is painted before ScrollTrigger measures
  // anything (avoids mistimed trigger points from a late font swap), then
  // refresh ScrollTrigger and mark the intro as done.
  function boot() {
    var fontsReady = (window.document.fonts && window.document.fonts.ready)
      ? window.document.fonts.ready.catch(function () {})
      : Promise.resolve();
    fontsReady.then(function () {
      if (ANIMATE && window.ScrollTrigger) ScrollTrigger.refresh();
      startHero();
    });
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);

  /* ----------------------------------------------------------
     3. Scroll reveal fallback (no GSAP / reduced motion)
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
     4. Scroll choreography
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

    /* --- Category hero: no scroll effects — stays static, matches index --- */

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

    /* --- Core sports: flip cards spin in on alternating axes --- */
    gsap.from('.category-grid .category-card', {
      scrollTrigger: ST('.category-grid', 'top 82%'),
      rotationY: function (i) { return i % 2 ? -70 : 70; },
      z: -160, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1
    });

    /* --- Endurance & action: rise + scale, icon flip --- */
    gsap.from('.why-us-grid .why-card', {
      scrollTrigger: ST('.why-us-grid', 'top 82%'),
      y: 60, opacity: 0, scale: 0.94, duration: 0.75, ease: 'power3.out', stagger: 0.08
    });
    gsap.from('.why-us-grid .why-icon-box', {
      scrollTrigger: ST('.why-us-grid', 'top 80%'),
      rotationY: 180, duration: 0.8, ease: 'power2.out', stagger: 0.08, delay: 0.2
    });

    /* --- Equipment catalog: filters fade, cards hinge up, badges pop --- */
    gsap.from('.category-filters', {
      scrollTrigger: ST('.category-filters', 'top 88%'),
      y: 20, opacity: 0, duration: 0.5, ease: 'power2.out'
    });
    gsap.from('#category-grid-section .product-card', {
      scrollTrigger: ST('#category-grid-section .product-grid', 'top 82%'),
      rotationX: -60, y: 50, opacity: 0,
      transformOrigin: '50% 100%', duration: 0.85, ease: 'power3.out', stagger: 0.09
    });
    gsap.from('#category-grid-section .product-badge', {
      scrollTrigger: ST('#category-grid-section .product-grid', 'top 78%'),
      scale: 0, opacity: 0, duration: 0.45, ease: 'back.out(3)', stagger: 0.09, delay: 0.4
    });

    /* --- Comparison table: rows slide in from the left --- */
    gsap.from('.specs-table tbody tr', {
      scrollTrigger: ST('.specs-table', 'top 85%'),
      x: -20, opacity: 0, duration: 0.4, ease: 'power2.out', stagger: 0.08
    });

    /* --- Bundles: door flip, matches index's benefit cards --- */
    gsap.utils.toArray('.sports-benefits .benefit-card').forEach(function (card, i) {
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

    /* --- Athlete reviews: hinge up like index's testimonial cards --- */
    gsap.from('.reviews-grid .review-card', {
      scrollTrigger: ST('.reviews-grid', 'top 82%'),
      y: 55, rotationX: 18, opacity: 0,
      transformOrigin: '50% 0%', duration: 0.8, ease: 'power3.out', stagger: 0.12
    });

    /* --- Ambassadors: rise + scale, avatar flip --- */
    gsap.from('.ambassadors-grid .ambassador-card', {
      scrollTrigger: ST('.ambassadors-grid', 'top 82%'),
      y: 60, opacity: 0, scale: 0.94, duration: 0.75, ease: 'power3.out', stagger: 0.08
    });
    gsap.from('.ambassadors-grid .ambassador-img-wrap', {
      scrollTrigger: ST('.ambassadors-grid', 'top 80%'),
      rotationY: 180, duration: 0.8, ease: 'power2.out', stagger: 0.08, delay: 0.2
    });

    /* --- Footer (identical choreography to index.html) --- */
    gsap.from('.footer-col', {
      scrollTrigger: ST('footer', 'top 88%'),
      y: 45, opacity: 0, duration: 0.65, ease: 'power3.out', stagger: 0.09
    });
    gsap.from('.social-btn', {
      scrollTrigger: ST('footer', 'top 85%'),
      x: 25, opacity: 0, duration: 0.45, stagger: 0.07, delay: 0.2
    });
    gsap.from('.footer-bottom', {
      scrollTrigger: ST('footer', 'top 70%'),
      opacity: 0, y: 20, duration: 0.6, ease: 'power2.out', delay: 0.35
    });

    /* --- Cursor tilt: pointer devices only, so phones are untouched.
       Scoped to plain product cards; the category flip cards already
       own their own 3D hover interaction, so they're left alone. --- */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      gsap.utils.toArray('#category-grid-section .product-card').forEach(function (card) {
        var rx = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power2.out' });
        var ry = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power2.out' });

        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 12);
          rx((0.5 - (e.clientY - r.top) / r.height) * 12);
        });
        card.addEventListener('mouseenter', function () {
          gsap.to(card, { y: -8, scale: 1.02, duration: 0.35, ease: 'power2.out' });
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
      document.querySelectorAll('a[href^="#"]:not(.trigger-404), .smooth-scroll').forEach(function (link) {
        link.addEventListener('click', function (e) {
          var href = link.getAttribute('href');
          if (!href || href.charAt(0) !== '#') return;
          var target = document.querySelector(href);
          if (!target) return;
          e.preventDefault();
          gsap.to(window, { duration: 1, ease: 'power2.inOut', scrollTo: { y: target, offsetY: 80 } });
        });
      });
    }
  });

  /* ----------------------------------------------------------
     5. Equipment catalog filter
     ---------------------------------------------------------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var productCards = document.querySelectorAll('#category-grid-section .product-card');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var filter = btn.getAttribute('data-filter');

      productCards.forEach(function (card) {
        var match = filter === 'all' || card.getAttribute('data-category') === filter;

        if (match) {
          card.style.display = 'block';
          if (ANIMATE) {
            gsap.fromTo(card, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 });
          } else {
            card.style.opacity = '';
            card.style.transform = '';
          }
        } else {
          card.style.display = 'none';
        }
      });

      if (HAS_GSAP) ScrollTrigger.refresh();
    });
  });

  /* ----------------------------------------------------------
     6. 404 overlay router
     Reached from the header Login link and the footer's
     "Account Login" link.
     ---------------------------------------------------------- */
  var page404 = document.getElementById('page-404');
  var close404Btn = document.getElementById('close404Btn');

  document.querySelectorAll('.trigger-404').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
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
     7. Mobile menu
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