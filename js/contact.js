(function () {
    'use strict';

    /* Only one FAQ answer open at a time */
    var items = document.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });

    /* Form: inline validation, no alert */
    var form = document.getElementById('contactForm');
    if (!form) return;
    var hint = form.querySelector('.form-hint');
    var defaultHint = hint ? hint.textContent : '';

    /* ---------- Mobile number: digits only ---------- */
    var PHONE_LENGTH = 10; // change if you need another length (e.g. 12 with country code)
    var phone = form.querySelector(
      'input[type="tel"], input[name="phone"], input[name="mobile"], #phone, #mobile'
    );

    if (phone) {
      phone.setAttribute('inputmode', 'numeric');   // numeric keypad on phones
      phone.setAttribute('maxlength', PHONE_LENGTH);
      phone.setAttribute('autocomplete', 'tel-national');

      // Block letters/symbols as they are typed (keeps shortcuts like Ctrl+V working)
      phone.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.length === 1 && !/\d/.test(e.key)) e.preventDefault();
      });

      // Catches paste, drag-drop, autofill and mobile keyboards
      phone.addEventListener('input', function () {
        var clean = phone.value.replace(/\D/g, '').slice(0, PHONE_LENGTH);
        if (phone.value !== clean) phone.value = clean;
      });
    }

    function isInvalid(input) {
      var value = input.value.trim();

      if (input === phone) {
        // Required and empty, or filled in but too short
        if (input.required && !value) return true;
        return value !== '' && value.length < PHONE_LENGTH;
      }
      if (!value) return true;
      if (input.type === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      return false;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // All required fields, plus the phone field even if it is optional
      var fields = Array.prototype.slice.call(form.querySelectorAll('[required]'));
      if (phone && fields.indexOf(phone) === -1) fields.push(phone);

      var missing = [];
      fields.forEach(function (input) {
        var bad = isInvalid(input);
        input.closest('.field').classList.toggle('invalid', bad);
        if (bad) missing.push(input);
      });

      if (missing.length) {
        if (hint) { hint.textContent = 'Check the highlighted fields and try again'; hint.classList.add('error'); }
        missing[0].focus();
        return;
      }

      if (hint) { hint.textContent = defaultHint; hint.classList.remove('error'); }
      form.classList.add('sent');
      form.querySelector('.submit-pill').innerHTML = 'Enquiry sent <i class="fa-solid fa-check"></i>';

      setTimeout(function () {
        form.reset();
        form.classList.remove('sent');
        form.querySelector('.submit-pill').innerHTML = 'Send enquiry <i class="fa-solid fa-arrow-right"></i>';
      }, 2600);
    });

    form.querySelectorAll('input, textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        input.closest('.field').classList.remove('invalid');
      });
    });
  })();