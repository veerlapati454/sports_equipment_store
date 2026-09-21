/* ==========================================================
   APEX ATHLETICS — login.js
   Login behaviour for html/login.html
   - Gmail-only email field
   - Password field with show / hide
   - Two roles (user / admin) that redirect to their own dashboard
   - Back button (previous page) with a safe fallback to home
   - Email & password always start empty (no autofill / restored values)

   IMPORTANT: this is a FRONT-END DEMO. Any Gmail-format address and
   any non-empty password is accepted, and the account's "role" is
   whatever the visitor selected in the form. Before going live,
   replace authenticate() with a real request to your server and let
   the server verify credentials and decide the role.
   ========================================================== */

(function () {
  'use strict';

  /* ---------- Settings you may want to change ---------- */
  var CONFIG = {
    home: '../index.html',
    dashboards: {
      user: './user-dashboard.html',
      admin: './admin-dashboard.html'
    }
  };

  var form = document.getElementById('loginForm');
  if (!form) return;

  var emailEl = document.getElementById('lg-email');
  var passEl = document.getElementById('lg-password');
  var alertEl = document.getElementById('loginAlert');
  var submitBtn = document.getElementById('loginSubmit');
  var toggleBtn = document.getElementById('togglePass');
  var backBtn = document.getElementById('backBtn');

  /* ----------------------------------------------------------
     Always start with empty fields (no autofill / restored values)
     ---------------------------------------------------------- */
  function clearFields() {
    emailEl.value = '';
    passEl.value = '';
    passEl.type = 'password';
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', 'false');
      toggleBtn.setAttribute('aria-label', 'Show password');
      toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
    setAlert('');
    showError(emailEl, '');
    showError(passEl, '');
  }

  clearFields();

  // Back/forward cache restores old form values, so clear again on return
  window.addEventListener('pageshow', clearFields);

  // Some browsers autofill just after load; clear once if the user hasn't started typing
  setTimeout(function () {
    var a = document.activeElement;
    if (a !== emailEl && a !== passEl) clearFields();
  }, 150);

  /* ----------------------------------------------------------
     Field rules — each returns an error message, or '' if valid
     ---------------------------------------------------------- */
  var rules = {
    'lg-email': function (v) {
      v = v.trim();
      if (!v) return 'Please enter your Gmail address.';
      if (!/^[^\s@]+@[^\s@]+$/.test(v)) return 'Enter a valid email address.';
      if (!/^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(v)) return 'Only Gmail addresses are accepted (name@gmail.com).';
      return '';
    },
    'lg-password': function (v) {
      if (!v) return 'Please enter your password.';
      return '';
    }
  };

  function showError(el, msg) {
    var wrap = el.closest('.login-field');
    var err = wrap.querySelector('.login-error');

    if (msg) {
      if (!err) {
        err = document.createElement('span');
        err.className = 'login-error';
        err.id = 'err-' + el.id;
        err.setAttribute('role', 'alert');
        wrap.appendChild(err);
      }
      err.textContent = msg;
      el.classList.add('is-invalid');
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', err.id);
    } else {
      if (err) err.parentNode.removeChild(err);
      el.classList.remove('is-invalid');
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    }
    return !msg;
  }

  function check(el) { return showError(el, rules[el.id](el.value)); }

  function setAlert(msg) { alertEl.textContent = msg || ''; }

  [emailEl, passEl].forEach(function (el) {
    el.addEventListener('blur', function () { check(el); });
    el.addEventListener('input', function () {
      setAlert('');
      if (el.classList.contains('is-invalid')) check(el);
    });
  });

  // Changing role clears any old message
  Array.prototype.forEach.call(form.querySelectorAll('input[name="role"]'), function (r) {
    r.addEventListener('change', function () { setAlert(''); });
  });

  /* ----------------------------------------------------------
     Show / hide password
     ---------------------------------------------------------- */
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var show = passEl.type === 'password';
      passEl.type = show ? 'text' : 'password';
      toggleBtn.setAttribute('aria-pressed', show ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      toggleBtn.innerHTML = show ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
      passEl.focus();
    });
  }

  /* ----------------------------------------------------------
     Back button — previous page, or home if there is none
     ---------------------------------------------------------- */
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = CONFIG.home;
      }
    });
  }

  /* ----------------------------------------------------------
     Authentication (DEMO — swap for a real server call)
     Any Gmail-format address + any non-empty password is
     accepted. The role is whatever the visitor picked in the
     form, since there's no backend to verify it against.
     Returns { ok: true, role } or { ok: false, message: '...' }
     ---------------------------------------------------------- */
  function authenticate(email, password, role) {
    if (!email || !password) {
      return { ok: false, message: 'Please enter your Gmail address and password.' };
    }
    return { ok: true, role: role };
  }

  /* ----------------------------------------------------------
     Submit
     ---------------------------------------------------------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setAlert('');

    var emailOk = check(emailEl);
    var passOk = check(passEl);
    if (!emailOk || !passOk) {
      (emailOk ? passEl : emailEl).focus();
      return;
    }

    var email = emailEl.value.trim().toLowerCase();
    var role = form.querySelector('input[name="role"]:checked').value;
    var result = authenticate(email, passEl.value, role);

    if (!result.ok) {
      setAlert(result.message);
      return;
    }

    // Remember who is logged in so dashboards can read it
    try {
      sessionStorage.setItem('apexSession', JSON.stringify({ email: email, role: result.role, at: Date.now() }));
    } catch (err) { /* storage blocked — still continue */ }

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Signing in...';

    setTimeout(function () {
      window.location.replace(CONFIG.dashboards[result.role]);
    }, 500);
  });

  /* ----------------------------------------------------------
     Entrance animation (skipped when GSAP is missing or the
     visitor prefers reduced motion)
     ---------------------------------------------------------- */
  var HAS_GSAP = typeof window.gsap !== 'undefined';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (HAS_GSAP && !REDUCED) {
    try {
      gsap.from('.login-card', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 });
      gsap.from('.login-promo > *', { y: 24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, delay: 0.15 });
    } catch (err) {
      if (window.console) console.error('[Apex login] animation skipped:', err);
    }
  }
})();