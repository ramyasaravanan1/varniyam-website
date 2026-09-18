// Paused, frame-selected hero video. No playback or autoplay is needed.
(() => {
  'use strict';
  const hero = document.getElementById('home');
  const video = hero && hero.querySelector('.hero-gaze-video');
  if (!video) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const smallScreen = matchMedia('(max-width: 560px)');
  const NEUTRAL = .52;
  const FRAME = 1 / 30;
  const IDLE_DELAY = 1800;
  // Observed blink intervals in this supplied clip, in seconds.
  // Only resting targets are adjusted; motion may pass naturally through a blink.
  const blinks = [[1.30, 1.84], [3.42, 3.92], [6.24, 6.70]];
  let ready = false;
  let visible = true;
  let failed = false;
  let limit = 0;
  let neutralTime = 0;
  let targetTime = 0;
  let smoothedTime = 0;
  let frameId = 0;
  let lastTick = 0;
  let lastSeek = -Infinity;
  let seekPending = false;
  let idleTimer = 0;
  const canTrack = () => finePointer.matches && !smallScreen.matches && !reduced.matches;
  const canRender = () => ready && !failed && visible && !document.hidden;
  const clamp = time => Math.max(0, Math.min(limit, time));

  function cleanTarget(time) {
    for (const [start, end] of blinks) {
      if (time > start && time < end) return time - start < end - time ? start : end;
    }
    return time;
  }
  function stop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastTick = 0;
  }
  function wake() {
    if (canRender() && !frameId) frameId = requestAnimationFrame(tick);
  }
  function seek(time) {
    if (seekPending || video.seeking) return;
    seekPending = true;
    try { video.currentTime = clamp(time); }
    catch (_) { seekPending = false; }
  }
  function tick(now) {
    frameId = 0;
    if (!canRender()) return;
    // One outstanding seek, with no backlog. seeked wakes the next frame.
    if (seekPending || video.seeking) return;
    const elapsed = lastTick ? Math.min(now - lastTick, 50) : 1000 / 60;
    lastTick = now;
    const alpha = 1 - Math.pow(1 - .09, elapsed / (1000 / 60));
    smoothedTime = canTrack()
      ? smoothedTime + (targetTime - smoothedTime) * alpha
      : neutralTime;
    if (Math.abs(targetTime - smoothedTime) < .012) smoothedTime = targetTime;
    const resting = smoothedTime === targetTime;
    const threshold = resting ? .004 : FRAME / 2;
    // Decode at most 30 frames per second, also on high-refresh displays.
    if (Math.abs(video.currentTime - smoothedTime) > threshold && now - lastSeek >= 1000 / 30) {
      lastSeek = now;
      seek(smoothedTime);
    }
    if (!resting || Math.abs(video.currentTime - targetTime) > .004) wake();
    else lastTick = 0;
  }
  function returnToCenter() {
    clearTimeout(idleTimer);
    targetTime = neutralTime;
    wake();
  }
  function initialize() {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    video.pause();
    video.muted = true;
    limit = Math.max(0, video.duration - FRAME);
    neutralTime = clamp(video.duration * NEUTRAL);
    targetTime = smoothedTime = neutralTime;
    ready = true;
    seek(neutralTime);
    wake();
  }
  function resetInput() {
    clearTimeout(idleTimer);
    targetTime = neutralTime;
    if (!canTrack()) smoothedTime = neutralTime;
    stop();
    wake();
  }
  hero.addEventListener('pointermove', event => {
    if (!canTrack() || !canRender() || event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    targetTime = clamp(cleanTarget(x * limit));
    clearTimeout(idleTimer);
    idleTimer = setTimeout(returnToCenter, IDLE_DELAY);
    wake();
  }, {passive:true});
  hero.addEventListener('pointerleave', returnToCenter);
  hero.addEventListener('pointercancel', returnToCenter);
  video.addEventListener('loadedmetadata', initialize);
  video.addEventListener('seeked', () => { seekPending = false; wake(); });
  video.addEventListener('loadeddata', wake);
  video.addEventListener('canplay', wake);
  video.addEventListener('error', () => {
    failed = true;
    clearTimeout(idleTimer);
    stop();
    // Keep the embedded neutral poster visible if the external asset is unavailable.
    video.removeAttribute('src');
    video.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
    video.load();
  }, {once:true});
  [reduced, finePointer, smallScreen].forEach(query => query.addEventListener('change', resetInput));
  document.addEventListener('visibilitychange', () => {
    clearTimeout(idleTimer);
    targetTime = neutralTime;
    stop();
    if (!document.hidden) wake();
  });
  window.addEventListener('blur', returnToCenter);
  window.addEventListener('pageshow', resetInput);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) wake();
      else { clearTimeout(idleTimer); targetTime = neutralTime; stop(); }
    }).observe(hero);
  }
  if (video.readyState >= 1) initialize();
})();
