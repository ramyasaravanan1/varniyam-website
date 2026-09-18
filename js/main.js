(() => {
 'use strict';
 const nav = document.getElementById('navigation');
 const toggle = document.querySelector('.menu-toggle');
 const navLinks = [...nav.querySelectorAll('a')];
 const compact = window.matchMedia('(max-width: 800px)');
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const brandMark = document.querySelector('.header-brand-mark');
 if (brandMark) document.querySelectorAll('.approach-brand-mark').forEach(mark => { mark.src = brandMark.src; });
 function closeMenu(returnFocus = false) {
  nav.classList.remove('open'); document.body.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation');
  if (returnFocus) toggle.focus();
 }
 toggle.addEventListener('click', () => {
  if (nav.classList.contains('open')) { closeMenu(true); return; }
  nav.classList.add('open'); document.body.classList.add('menu-open');
  toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Close navigation');
  navLinks[0].focus();
 });
 navLinks.forEach(link => link.addEventListener('click', () => closeMenu()));
 document.querySelector('header .logo').addEventListener('click', () => closeMenu());
 document.addEventListener('keydown', event => {
  if (!nav.classList.contains('open')) return;
  if (event.key === 'Escape') { closeMenu(true); return; }
  if (event.key !== 'Tab') return;
  const first = toggle, last = navLinks[navLinks.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
 });
 compact.addEventListener('change', () => closeMenu());
 // Let native anchors work, then move keyboard focus to the chosen section.
 document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
  const target = document.querySelector(link.getAttribute('href'));
  if (target) { target.setAttribute('tabindex', '-1'); target.focus({preventScroll:true}); }
 }));
 const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
 const backTop = document.querySelector('.top');
 let queued = false;
 function updatePosition() {
  let current = sections[0];
  sections.forEach(section => { if (section.getBoundingClientRect().top <= 150) current = section; });
  navLinks.forEach(link => {
   if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
   else link.removeAttribute('aria-current');
  });
  backTop.classList.toggle('visible', window.scrollY > 700); queued = false;
 }
 window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(updatePosition); } }, {passive:true});
 updatePosition();
 if ('IntersectionObserver' in window && !reduced.matches) {
  const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
   if (entry.isIntersecting) { entry.target.classList.remove('pending'); reveals.unobserve(entry.target); }
  }), {threshold:0.08});
  document.querySelectorAll('.reveal').forEach(element => {
   if (element.getBoundingClientRect().top > innerHeight) { element.classList.add('pending'); reveals.observe(element); }
  });
  const revealAll = () => { document.querySelectorAll('.pending').forEach(el => el.classList.remove('pending')); reveals.disconnect(); };
  reduced.addEventListener('change', event => { if (event.matches) revealAll(); });
  document.addEventListener('focusin', event => { const parent = event.target.closest('.pending'); if (parent) parent.classList.remove('pending'); });
 }
 const moods = {
  celebration:{name:'Indian Elegance',image:'https://images.pexels.com/photos/32597575/pexels-photo-32597575.jpeg?auto=compress&cs=tinysrgb&w=1200',alt:'Indian saree styling for a celebration mood',description:'A moment for tradition and your own expression. Explore half sarees, lehengas, anarkalis, and traditional gowns as a starting point.',anchor:'#indian'},
  date:{name:'After Hours',image:'https://images.pexels.com/photos/7273705/pexels-photo-7273705.jpeg?auto=compress&cs=tinysrgb&w=1000',alt:'A green evening dress for a romantic dinner mood',description:'A little romance, entirely your way. Start with date-night dresses, romantic silhouettes, and evening looks.',anchor:'#after-hours'},
  casual:{name:'Everyday Feminine',image:'https://images.pexels.com/photos/30698041/pexels-photo-30698041.jpeg?auto=compress&cs=tinysrgb&w=1000',alt:'Relaxed neutral clothing for an everyday mood',description:'An easy expression of you. Explore short tops, peplums, mini dresses, and casual outfits for your day out.',anchor:'#everyday'},
  away:{name:'Getaway',image:'https://images.pexels.com/photos/8112481/pexels-photo-8112481.jpeg?auto=compress&cs=tinysrgb&w=1000',alt:'A flowing beach dress for a weekend-away mood',description:'Dress for slower mornings and somewhere new. Explore beachwear, resort wear, and vacation looks.',anchor:'#getaway'},
  evening:{name:'Modern Gowns',image:'https://images.pexels.com/photos/33365174/pexels-photo-33365174.jpeg?auto=compress&cs=tinysrgb&w=1000',alt:'An elegant long gown for a special-evening mood',description:'Make room for a statement silhouette. Start with contemporary gowns and sleeveless shapes for your special evening.',anchor:'#gowns'}
 };
 document.querySelectorAll('[data-mood]').forEach(button => button.addEventListener('click', () => {
  const mood = moods[button.dataset.mood];
  document.querySelectorAll('[data-mood]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  const img = document.getElementById('occasion-image'); img.src = mood.image; img.alt = mood.alt;
  document.getElementById('occasion-name').textContent = mood.name;
  document.getElementById('occasion-description').textContent = mood.description;
  document.getElementById('occasion-link').href = mood.anchor;
 }));


 // Wardrobe replay animation — direction follows the user's scroll.
 const wardrobeStage = document.querySelector('[data-wardrobe-stage]');
 if (wardrobeStage && !reduced.matches && 'IntersectionObserver' in window) {
  let lastWardrobeY = window.scrollY;
  let wardrobeDirection = 'down';
  let wardrobeSettleTimer = 0;

  window.addEventListener('scroll', () => {
   const currentY = window.scrollY;
   if (Math.abs(currentY - lastWardrobeY) > 2) wardrobeDirection = currentY > lastWardrobeY ? 'down' : 'up';
   lastWardrobeY = currentY;
  }, {passive:true});

  const replayWardrobe = direction => {
   clearTimeout(wardrobeSettleTimer);
   wardrobeStage.dataset.direction = direction;
   wardrobeStage.dataset.settled = 'false';
   wardrobeStage.dataset.animating = 'false';
   void wardrobeStage.offsetWidth;
   wardrobeStage.dataset.animating = 'true';

   wardrobeSettleTimer = window.setTimeout(() => {
    wardrobeStage.dataset.animating = 'false';
    wardrobeStage.dataset.settled = 'true';
   }, 1500);
  };

  const wardrobeObserver = new IntersectionObserver(entries => {
   entries.forEach(entry => {
    if (entry.isIntersecting) {
     replayWardrobe(wardrobeDirection);
    } else {
     clearTimeout(wardrobeSettleTimer);
     wardrobeStage.dataset.animating = 'false';
     wardrobeStage.dataset.settled = 'false';
    }
   });
  }, {threshold:.16});

  wardrobeObserver.observe(wardrobeStage);
 }

 // If JavaScript is unavailable the form has no named field, so it cannot send an email.
})();
