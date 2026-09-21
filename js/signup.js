/* ==========================================================
   APEX ATHLETICS — signup.js
   Sign-up behaviour for html/signup.html
   - Username: letters only (typed non-letters are stripped live)
   - Gmail-only email field
   - Password + confirm password, each with its own show/hide toggle
   - Terms & Conditions checkbox must be checked to register
   - Back button (previous page) with a safe fallback to home
   - All fields always start empty (no autofill / restored values)

   IMPORTANT: this is a FRONT-END DEMO. There is no real backend —
   "creating an account" just validates the form, then sends the
   visitor to the login page. Replace registerAccount() with a real
   request to your server before going live.
   ========================================================== */

(function () {
  'use strict';

  var CONFIG = {
    home: '../index.html',
    loginPage: './login.html'
  };

  var form = document.getElementById('signupForm');
  if (!form) return;

  var usernameEl = document.getElementById('su-username');
  var emailEl = document.getElementById('su-email');
  var passEl = document.getElementById('su-password');
  var confirmEl = document.getElementById('su-confirm');
  var termsEl = document.getElementById('su-terms');
  var alertEl = document.getElementById('signupAlert');
  var submitBtn = document.getElementById('signupSubmit');
  var backBtn = document.getElementById('backBtn');
  var toggleBtns = form.querySelectorAll('.toggle-pass');

  var textFields = [usernameEl, emailEl, passEl, confirmEl];

  /* ----------------------------------------------------------
     Always start with empty fields (no autofill / restored values)
     ---------------------------------------------------------- */
  function resetField(el) {
    var wrap = el.closest('.signup-field');
    var err = wrap && wrap.querySelector('.signup-error');
    if (err) err.parentNode.removeChild(err);
    el.classList.remove('is-invalid', 'is-valid');
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  }

  function clearFields() {
    textFields.forEach(function (el) {
      el.value = '';
      resetField(el);
    });

    // Password fields back to hidden, with the eye icon reset
    passEl.type = 'password';
    confirmEl.type = 'password';
    Array.prototype.forEach.call(toggleBtns, function (btn) {
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Show password');
      btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    });

    // Terms box unticked
    termsEl.checked = false;
    termsEl.closest('.signup-terms').classList.remove('is-invalid');

    setAlert('');
  }

  clearFields();

  // Back/forward cache restores old form values, so clear again on return
  window.addEventListener('pageshow', clearFields);

  // Some browsers autofill just after load; clear once if the user hasn't started typing
  setTimeout(function () {
    var a = document.activeElement;
    if (textFields.indexOf(a) === -1) clearFields();
  }, 150);

  /* ----------------------------------------------------------
     Field rules — each returns an error message, or '' if valid
     ---------------------------------------------------------- */
  var rules = {
    'su-username': function (v) {
      v = v.trim();
      if (!v) return 'Please enter a username.';
      if (!/^[A-Za-z]+$/.test(v)) return 'Username can only contain letters (no numbers, spaces, or symbols).';
      if (v.length < 3) return 'Username must be at least 3 letters.';
      return '';
    },
    'su-email': function (v) {
      v = v.trim();
      if (!v) return 'Please enter your Gmail address.';
      if (!/^[^\s@]+@[^\s@]+$/.test(v)) return 'Enter a valid email address.';
      if (!/^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(v)) return 'Only Gmail addresses are accepted (name@gmail.com).';
      return '';
    },
    'su-password': function (v) {
      if (!v) return 'Please enter a password.';
      if (v.length < 8) return 'Password must be at least 8 characters.';
      return '';
    },
    'su-confirm': function (v) {
      if (!v) return 'Please confirm your password.';
      if (v !== passEl.value) return 'Passwords do not match.';
      return '';
    }
  };

  function showError(el, msg) {
    var wrap = el.closest('.signup-field');
    var err = wrap.querySelector('.signup-error');

    if (msg) {
      if (!err) {
        err = document.createElement('span');
        err.className = 'signup-error';
        err.id = 'err-' + el.id;
        err.setAttribute('role', 'alert');
        wrap.appendChild(err);
      }
      err.textContent = msg;
      el.classList.add('is-invalid');
      el.classList.remove('is-valid');
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', err.id);
    } else {
      if (err) err.parentNode.removeChild(err);
      el.classList.remove('is-invalid');
      el.classList.add('is-valid');
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    }
    return !msg;
  }

  function check(el) { return showError(el, rules[el.id](el.value)); }

  function setAlert(msg, isSuccess) {
    alertEl.textContent = msg || '';
    alertEl.classList.toggle('is-success', !!isSuccess);
  }

  /* ----------------------------------------------------------
     Validate on blur for every field
     ---------------------------------------------------------- */
  textFields.forEach(function (el) {
    el.addEventListener('blur', function () { check(el); });
  });

  /* ----------------------------------------------------------
     Username: strip anything that isn't a letter as they type
     ---------------------------------------------------------- */
  usernameEl.addEventListener('input', function () {
    var cleaned = usernameEl.value.replace(/[^A-Za-z]/g, '');
    if (cleaned !== usernameEl.value) usernameEl.value = cleaned;
    setAlert('');
    if (usernameEl.classList.contains('is-invalid')) check(usernameEl);
  });

  [emailEl, passEl, confirmEl].forEach(function (el) {
    el.addEventListener('input', function () {
      setAlert('');
      if (el.classList.contains('is-invalid')) check(el);
      // Re-validate confirm password live once both fields have input
      if (el === passEl && confirmEl.value) check(confirmEl);
    });
  });

  /* ----------------------------------------------------------
     Terms & Conditions — clears its own error state on toggle
     ---------------------------------------------------------- */
  termsEl.addEventListener('change', function () {
    setAlert('');
    termsEl.closest('.signup-terms').classList.remove('is-invalid');
  });

  /* ----------------------------------------------------------
     Show / hide password — works for both password fields via
     data-target, and each button only controls its own field so
     there's no cross-talk between the two toggles.
     ---------------------------------------------------------- */
  Array.prototype.forEach.call(toggleBtns, function (btn) {
    var target = document.getElementById(btn.getAttribute('data-target'));
    if (!target) return;
    btn.addEventListener('click', function () {
      var show = target.type === 'password';
      target.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', show ? 'true' : 'false');
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.innerHTML = show ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
      target.focus();
    });
  });

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
     Registration (DEMO — swap for a real server call)
     Returns { ok: true } or { ok: false, message: '...' }
     ---------------------------------------------------------- */
  function registerAccount(username, email, password) {
    // No backend here — this always succeeds once every field is
    // valid and terms have been accepted.
    return { ok: true };
  }

  /* ----------------------------------------------------------
     Submit
     ---------------------------------------------------------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setAlert('');

    var usernameOk = check(usernameEl);
    var emailOk = check(emailEl);
    var passOk = check(passEl);
    var confirmOk = check(confirmEl);
    var termsOk = termsEl.checked;

    var termsWrap = termsEl.closest('.signup-terms');
    termsWrap.classList.toggle('is-invalid', !termsOk);

    if (!usernameOk || !emailOk || !passOk || !confirmOk || !termsOk) {
      if (!termsOk && usernameOk && emailOk && passOk && confirmOk) {
        setAlert('You must accept the Terms & Conditions to register.');
      } else {
        setAlert('Please fix the highlighted fields to continue.');
      }
      var firstInvalid = form.querySelector('.is-invalid, input[type="checkbox"]:not(:checked)');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var username = usernameEl.value.trim();
    var email = emailEl.value.trim().toLowerCase();
    var result = registerAccount(username, email, passEl.value);

    if (!result.ok) {
      setAlert(result.message);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Creating account...';
    setAlert('Account created! Redirecting you to login...', true);

    setTimeout(function () {
      window.location.href = CONFIG.loginPage;
    }, 900);
  });

  /* ----------------------------------------------------------
     Entrance animation (skipped when GSAP is missing or the
     visitor prefers reduced motion)
     ---------------------------------------------------------- */
  var HAS_GSAP = typeof window.gsap !== 'undefined';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (HAS_GSAP && !REDUCED) {
    try {
      gsap.from('.signup-card', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 });
      gsap.from('.signup-promo > *', { y: 24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, delay: 0.15 });
    } catch (err) {
      if (window.console) console.error('[Apex signup] animation skipped:', err);
    }
  }
})();