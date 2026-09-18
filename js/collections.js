(() => {
  'use strict';
  const carousel = document.querySelector('#wardrobe .wardrobe-capsules');
  if (!carousel) return;

  const mobile = matchMedia('(max-width: 760px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cards = Array.from(carousel.querySelectorAll('.wardrobe-capsule'));
  if (cards.length < 2) return;

  let index = 0;
  let timer = 0;
  let resumeTimer = 0;
  let scrollTimer = 0;
  let sectionVisible = true;
  let userHolding = false;

  const cardLeft = card => Math.max(0,
    card.offsetLeft - carousel.offsetLeft - (carousel.clientWidth - card.clientWidth) / 2
  );

  const goTo = nextIndex => {
    if (!mobile.matches) return;
    index = (nextIndex + cards.length) % cards.length;
    carousel.scrollTo({left: cardLeft(cards[index]), behavior: reduced.matches ? 'auto' : 'smooth'});
  };

  const stop = () => {
    clearInterval(timer);
    timer = 0;
  };

  const start = () => {
    stop();
    if (!mobile.matches || reduced.matches || !sectionVisible || userHolding || document.hidden) return;
    timer = window.setInterval(() => goTo(index + 1), 3600);
  };

  const pauseForUser = () => {
    userHolding = true;
    stop();
    clearTimeout(resumeTimer);
  };

  const resumeAfterUser = () => {
    userHolding = false;
    clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(start, 5000);
  };

  const syncIndexToScroll = () => {
    clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      const center = carousel.scrollLeft + carousel.clientWidth / 2;
      let nearest = 0;
      let distance = Infinity;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft - carousel.offsetLeft + card.clientWidth / 2;
        const d = Math.abs(cardCenter - center);
        if (d < distance) { distance = d; nearest = i; }
      });
      index = nearest;
    }, 120);
  };

  carousel.addEventListener('pointerdown', pauseForUser, {passive:true});
  carousel.addEventListener('pointerup', resumeAfterUser, {passive:true});
  carousel.addEventListener('pointercancel', resumeAfterUser, {passive:true});
  carousel.addEventListener('touchstart', pauseForUser, {passive:true});
  carousel.addEventListener('touchend', resumeAfterUser, {passive:true});
  carousel.addEventListener('scroll', syncIndexToScroll, {passive:true});

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      sectionVisible = entries.some(entry => entry.isIntersecting);
      sectionVisible ? start() : stop();
    }, {threshold:.15});
    observer.observe(carousel);
  }

  document.addEventListener('visibilitychange', start);
  window.addEventListener('resize', () => {
    if (mobile.matches) goTo(index);
    start();
  }, {passive:true});

  if (typeof mobile.addEventListener === 'function') mobile.addEventListener('change', () => {
    if (mobile.matches) goTo(index);
    else carousel.scrollLeft = 0;
    start();
  });

  requestAnimationFrame(() => {
    if (mobile.matches) goTo(0);
    start();
  });
})();
