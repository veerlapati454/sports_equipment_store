/* =========================================================
   APEX ATHLETICS — 404 page behaviour
   - Go Back / Back to Home
   - Shows the address that went out of bounds
   - Tap-the-ball keepy-up mini game (+ sparks)
   - Button ripple + magnetic hover
   ========================================================= */
(function () {
  'use strict';

  var HOME_URL = '../index.html';
  var BEST_KEY = 'apex404Best';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  // ─── Navigation ───
  var backBtn = document.getElementById('back-btn');
  backBtn.addEventListener('click', function () {
    // Something to go back to? Use it. Otherwise (direct visit, new tab) fall back to home.
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = HOME_URL;
    }
  });

  // ─── Show the requested address ───
  (function showRequestedPath() {
    var el = document.getElementById('req-path');
    var path = window.location.pathname + window.location.search;
    // If a page redirected here on purpose (e.g. …/404.html), show where the visitor came from.
    if (/404\.html$/i.test(window.location.pathname) && document.referrer) {
      try {
        var ref = new URL(document.referrer);
        if (ref.origin === window.location.origin) path = ref.pathname + ref.search;
      } catch (e) { /* ignore malformed referrers */ }
    }
    try { path = decodeURIComponent(path); } catch (e) { /* keep raw path */ }
    el.textContent = path || '/';
    el.title = path;
  })();

  // ─── Button polish: ripple + magnetic pull ───
  var buttons = document.querySelectorAll('.btn');
  buttons.forEach(function (btn) {
    btn.addEventListener('pointerdown', function (e) {
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 2;
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', function () { ripple.remove(); });
    });

    if (canHover && !prefersReducedMotion) {
      btn.addEventListener('pointermove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = (e.clientX - (rect.left + rect.width / 2)) * 0.18;
        var y = (e.clientY - (rect.top + rect.height / 2)) * 0.28;
        btn.style.setProperty('--mx', x.toFixed(1) + 'px');
        btn.style.setProperty('--my', y.toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    }
  });

  // ─── Keepy-ups ───
  var ball = document.getElementById('ball');
  var kickEl = document.getElementById('ball-kick');
  var sparks = document.getElementById('sparks');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');

  var streak = 0;
  var best = 0;
  var airborne = false;
  var kickAnim = null;

  try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) { best = 0; }
  bestEl.textContent = best;

  function pop(el) {
    el.classList.remove('pop');
    void el.offsetWidth; // restart the animation
    el.classList.add('pop');
  }

  function currentOffsetY() {
    var t = window.getComputedStyle(kickEl).transform;
    if (!t || t === 'none') return 0;
    return new DOMMatrixReadOnly(t).m42;
  }

  function burst(y) {
    var colors = ['#FF4500', '#00E5FF', '#FFC94D', '#FF9466'];
    for (var i = 0; i < 10; i++) {
      var s = document.createElement('span');
      s.className = 'spark';
      s.style.background = colors[i % colors.length];
      sparks.appendChild(s);
      var angle = Math.random() * Math.PI * 2;
      var dist = 45 + Math.random() * 55;
      var anim = s.animate([
        { transform: 'translate(0px,' + y + 'px) scale(1)', opacity: 1 },
        { transform: 'translate(' + (Math.cos(angle) * dist) + 'px,' + (y + Math.sin(angle) * dist) + 'px) scale(0)', opacity: 0 }
      ], { duration: 550 + Math.random() * 250, easing: 'cubic-bezier(.2,.8,.4,1)' });
      anim.onfinish = (function (node) { return function () { node.remove(); }; })(s);
    }
  }

  function kick() {
    streak = airborne ? streak + 1 : 1;
    scoreEl.textContent = streak;
    pop(scoreEl);

    if (streak > best) {
      best = streak;
      bestEl.textContent = best;
      pop(bestEl);
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) { /* storage unavailable */ }
    }

    if (prefersReducedMotion || !kickEl.animate) return;

    var startY = currentOffsetY();      // continue from wherever the ball is now
    if (kickAnim) kickAnim.cancel();

    var rise = Math.min(window.innerHeight * 0.34, 250) + Math.min(streak, 10) * 8;
    rise = Math.min(rise, window.innerHeight * 0.5);
    var tilt = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 14);

    kickAnim = kickEl.animate([
      { transform: 'translateY(' + startY + 'px) rotate(0deg)',   easing: 'cubic-bezier(.2,.75,.4,1)' },
      { transform: 'translateY(' + (-rise) + 'px) rotate(' + tilt + 'deg)', offset: 0.45, easing: 'cubic-bezier(.6,0,.8,.35)' },
      { transform: 'translateY(0px) rotate(0deg)' }
    ], { duration: 900 });

    airborne = true;
    var thisAnim = kickAnim;
    thisAnim.onfinish = function () {
      if (kickAnim === thisAnim) { airborne = false; kickAnim = null; }
    };

    burst(startY);
  }

  ball.addEventListener('click', kick);
})();