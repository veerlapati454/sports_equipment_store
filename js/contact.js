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

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var missing = [];
      form.querySelectorAll('[required]').forEach(function (input) {
        var bad = !input.value.trim() || (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
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