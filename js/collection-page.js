(() => {
  'use strict';

  const nav = document.getElementById('navigation');
  const toggle = document.querySelector('.menu-toggle');
  const backTop = document.querySelector('.top');
  if (!nav || !toggle) return;

  const navLinks = [...nav.querySelectorAll('a')];
  const compact = window.matchMedia('(max-width: 800px)');

  function closeMenu(returnFocus = false) {
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (nav.classList.contains('open')) {
      closeMenu(true);
      return;
    }
    nav.classList.add('open');
    document.body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation');
    navLinks[0]?.focus();
  });

  navLinks.forEach(link => link.addEventListener('click', () => closeMenu()));
  compact.addEventListener('change', () => closeMenu());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
  });

  const brandMark = document.querySelector('.header-brand-mark');
  if (brandMark) {
    document.querySelectorAll('.entry-brand-logo').forEach(mark => {
      if (!mark.getAttribute('src')) mark.setAttribute('src', brandMark.src);
    });
  }

  function updateBackTop() {
    if (backTop) backTop.classList.toggle('visible', window.scrollY > 500);
  }
  window.addEventListener('scroll', updateBackTop, { passive: true });
  updateBackTop();
})();
