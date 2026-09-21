/* ==========================================================
   APEX ATHLETICS — products.js
   Products-page-only behaviour. Loaded AFTER script.js, so it
   can read the same ANIMATE decision by re-checking gsap /
   ScrollTrigger and the .gsap-enabled class script.js already
   set on <html>. Every block is guarded so a failure here can
   never hide catalog content.

   FIX: every animation now uses gsap.fromTo() with an explicit
   end state (opacity: 1). Previously gsap.from() animated
   "to whatever the element currently is" — and because the
   .reveal class starts elements at opacity 0 in CSS, GSAP was
   animating 0 -> 0 and the cards never appeared.
   ========================================================== */

(function () {
  'use strict';

  var HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ANIMATE = HAS_GSAP && !REDUCED && document.documentElement.classList.contains('gsap-enabled');

  function guard(fn) {
    try { fn(); } catch (e) {
      if (window.console) console.error('[Apex products] disabled a block:', e);
    }
  }

  /* ----------------------------------------------------------
     0. Always start at the top on reload + sync header height
     ---------------------------------------------------------- */
  var navEntry = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  var isReload = navEntry ? navEntry.type === 'reload' : false;
  var isBackForward = navEntry ? navEntry.type === 'back_forward' : false;
  if (!isBackForward && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (isReload && location.hash) history.replaceState(null, '', location.pathname + location.search);
  if (!location.hash && !isBackForward) {
    window.scrollTo(0, 0);
    window.addEventListener('load', function () { window.scrollTo(0, 0); });
  }

  // Keeps the sticky category bar directly under the header on every screen size
  var headerEl = document.querySelector('header');
  function syncHeaderHeight() {
    if (!headerEl || !headerEl.offsetHeight) return;
    document.documentElement.style.setProperty('--header-h', headerEl.offsetHeight + 'px');
  }
  guard(function () {
    syncHeaderHeight();
    window.addEventListener('load', syncHeaderHeight);
    window.addEventListener('resize', syncHeaderHeight);
    if ('ResizeObserver' in window && headerEl) {
      new ResizeObserver(syncHeaderHeight).observe(headerEl);
    } else {
      window.addEventListener('scroll', syncHeaderHeight, { passive: true });
    }
  });

  /* ----------------------------------------------------------
     1. Category filter chips
     ---------------------------------------------------------- */
  var chips = document.querySelectorAll('.filter-chip');
  var cards = document.querySelectorAll('.catalog-grid .product-card');
  var resultCount = document.getElementById('resultCount');
  var activeFilter = 'all'; // tracks current filter so Load More can respect it

  function updateResultCount() {
    if (!resultCount) return;
    var visible = document.querySelectorAll('.catalog-grid .product-card:not(.hidden-item)').length;
    resultCount.textContent = visible + (visible === 1 ? ' product' : ' products');
  }

  function applyFilter(category) {
    activeFilter = category;
    cards.forEach(function (card) {
      // Cards still waiting behind "Load More" stay hidden no matter what filter is picked
      if (card.classList.contains('extra-batch')) {
        card.classList.add('hidden-item');
        return;
      }
      var match = category === 'all' || card.dataset.category === category;
      card.classList.toggle('hidden-item', !match);
    });

    updateResultCount();

    if (ANIMATE) {
      guard(function () {
        var visibleCards = Array.prototype.filter.call(cards, function (c) {
          return !c.classList.contains('hidden-item');
        });
        gsap.fromTo(
          visibleCards,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.04,
            overwrite: 'auto', clearProps: 'transform' }
        );
      });
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      // On phones the chips scroll sideways — bring the tapped one into view
      guard(function () {
        chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
      applyFilter(chip.dataset.filter);
    });
  });

  /* ----------------------------------------------------------
     2. Sort dropdown (price / rating / name — client side)
     ---------------------------------------------------------- */
  var sortSelect = document.getElementById('sortSelect');
  var grid = document.querySelector('.catalog-grid');

  if (sortSelect && grid) {
    sortSelect.addEventListener('change', function () {
      var mode = sortSelect.value;
      var list = Array.prototype.slice.call(grid.querySelectorAll('.product-card'));

      list.sort(function (a, b) {
        if (mode === 'price-asc') return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
        if (mode === 'price-desc') return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
        if (mode === 'rating') return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
        if (mode === 'name') return a.dataset.name.localeCompare(b.dataset.name);
        return 0; // 'featured' — leave original DOM order
      });

      list.forEach(function (card) { grid.appendChild(card); });
    });
  }

  /* ----------------------------------------------------------
     3. Deal countdown timer
     ---------------------------------------------------------- */
  var timerEl = document.getElementById('bundleTimer');
  if (timerEl) {
    var deadline = Date.now() + (1000 * 60 * 60 * 26) + (1000 * 60 * 41); // ~26h41m demo window
    var hEl = timerEl.querySelector('[data-unit="h"]');
    var mEl = timerEl.querySelector('[data-unit="m"]');
    var sEl = timerEl.querySelector('[data-unit="s"]');

    function pad(n) { return String(n).padStart(2, '0'); }

    function tick() {
      var diff = Math.max(0, deadline - Date.now());
      var h = Math.floor(diff / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      if (hEl) hEl.textContent = pad(h);
      if (mEl) mEl.textContent = pad(m);
      if (sEl) sEl.textContent = pad(s);
      if (diff > 0) requestAnimationFrame(function () { setTimeout(tick, 1000); });
    }
    tick();
  }

  /* ----------------------------------------------------------
     3b. Spotlight arrows
     ---------------------------------------------------------- */
  var spotlightTrack = document.getElementById('spotlightTrack');
  var spotlightPrev = document.getElementById('spotlightPrev');
  var spotlightNext = document.getElementById('spotlightNext');

  if (spotlightTrack && spotlightPrev && spotlightNext) {
    function scrollSpotlight(direction) {
      var card = spotlightTrack.querySelector('.spotlight-card');
      var gap = 26; // matches the CSS gap on .spotlight-track
      var amount = card ? card.getBoundingClientRect().width + gap : 280;
      spotlightTrack.scrollBy({ left: direction * amount, behavior: 'smooth' });
    }

    function updateSpotlightArrows() {
      var maxScroll = spotlightTrack.scrollWidth - spotlightTrack.clientWidth;
      spotlightPrev.disabled = spotlightTrack.scrollLeft <= 4;
      spotlightNext.disabled = spotlightTrack.scrollLeft >= maxScroll - 4;
    }

    spotlightPrev.addEventListener('click', function () { scrollSpotlight(-1); });
    spotlightNext.addEventListener('click', function () { scrollSpotlight(1); });
    spotlightTrack.addEventListener('scroll', updateSpotlightArrows, { passive: true });
    window.addEventListener('resize', updateSpotlightArrows);
    updateSpotlightArrows();
  }

  /* ----------------------------------------------------------
     4. Load more (reveals a second batch already in the DOM,
     filtered to match whichever category chip is active)
     ---------------------------------------------------------- */
  var loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function () {
      var extra = document.querySelectorAll('.product-card.extra-batch');
      var revealed = [];

      extra.forEach(function (card) {
        card.classList.remove('extra-batch');
        var match = activeFilter === 'all' || card.dataset.category === activeFilter;
        card.classList.toggle('hidden-item', !match);
        if (match) revealed.push(card);
      });

      loadMoreBtn.style.display = 'none';
      updateResultCount();

      if (ANIMATE && revealed.length) {
        guard(function () {
          gsap.fromTo(
            revealed,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08,
              clearProps: 'transform' }
          );
        });
      }
    });
  }

  /* ----------------------------------------------------------
     5. Fallback reveal for new sections when GSAP is unavailable
     ---------------------------------------------------------- */
  if (!ANIMATE) {
    var lateReveal = document.querySelectorAll('.reveal');
    function checkLateReveal() {
      var triggerBottom = window.innerHeight * 0.85;
      lateReveal.forEach(function (el) {
        if (el.getBoundingClientRect().top < triggerBottom) el.classList.add('active');
      });
    }
    if (REDUCED) {
      lateReveal.forEach(function (el) { el.classList.add('active'); });
    } else {
      window.addEventListener('scroll', checkLateReveal);
      checkLateReveal();
    }
  }

  /* ----------------------------------------------------------
     6. GSAP scroll choreography for products-page-only sections

     All tweens use fromTo() with an explicit end of opacity: 1,
     so they work even if CSS (.reveal) starts elements hidden.
     clearProps: 'transform' hands transforms back to CSS once
     the animation is done, so :hover lifts still work. Opacity
     is deliberately NOT cleared (clearing it would fall back to
     the CSS .reveal value of 0 and hide the element again).
     ---------------------------------------------------------- */
  if (ANIMATE) guard(function () {
    var ST = function (trigger, start) {
      return { trigger: trigger, start: start || 'top 85%', toggleActions: 'play none none reverse' };
    };

    // Hero
    gsap.fromTo(
      '.breadcrumb, .products-hero h1, .products-hero p, .products-hero-meta div',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.15,
        clearProps: 'transform' }
    );

    // Filter chips: intentionally not animated (see note in original file —
    // ScrollTrigger can't reliably measure a position: sticky element).

    // Catalog grid
    gsap.fromTo(
      '.catalog-grid .product-card:not(.hidden-item)',
      { rotationX: -55, y: 45, opacity: 0, transformOrigin: '50% 100%' },
      { rotationX: 0, y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.07,
        scrollTrigger: ST('.catalog-grid', 'top 85%'), clearProps: 'transform' }
    );

    // Bundle banner (scoped to .bundle-copy .btn so Load More etc. aren't caught)
    gsap.fromTo(
      '.bundle-tag, .bundle-banner h2, .bundle-banner p, .bundle-timer, .bundle-copy .btn',
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: ST('.bundle-banner-inner', 'top 78%'), clearProps: 'transform' }
    );
    gsap.fromTo(
      '.bundle-visual',
      { x: 40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.15,
        scrollTrigger: ST('.bundle-banner-inner', 'top 78%'), clearProps: 'transform' }
    );

    // Best sellers spotlight
    gsap.fromTo(
      '.spotlight-card',
      { y: 40, opacity: 0, scale: 0.92 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.08,
        scrollTrigger: ST('.spotlight-track', 'top 88%'), clearProps: 'transform' }
    );

    // Comparison table
    gsap.fromTo(
      '.compare-table thead th, .compare-table tbody tr',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: ST('.compare-wrap', 'top 82%'), clearProps: 'transform' }
    );

    // Trust strip
    gsap.fromTo(
      '.trust-item',
      { y: 25, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: ST('.trust-strip-inner', 'top 88%'), clearProps: 'transform' }
    );

    // Buyer's guide
    gsap.fromTo(
      '.guide-card',
      { y: 35, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: ST('.guide-grid', 'top 85%'), clearProps: 'transform' }
    );

    // Only runs if a .guide-cta exists in the HTML (it was removed from the markup)
    if (document.querySelector('.guide-cta')) {
      gsap.fromTo(
        '.guide-cta',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out',
          scrollTrigger: ST('.guide-cta', 'top 92%'), clearProps: 'transform' }
      );
    }

    // Recalculate trigger positions once images/fonts have loaded
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  });
})();