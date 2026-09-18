(() => {
  'use strict';
  const client = window.varniyamSupabase;
  const gate = document.getElementById('entry-gate');
  if (!gate) return;

  const guestKey = 'varniyamGuestSession';
  const closeButton = document.getElementById('entry-close');
  const guestButton = document.getElementById('entry-guest');
  const accountButton = document.getElementById('account-button');
  const navLogoutButton = document.getElementById('nav-logout-button');
  const navMemberGreeting = document.getElementById('nav-member-greeting');
  const memberWelcomeBar = document.getElementById('member-welcome-bar');
  const memberWelcomeName = document.getElementById('member-welcome-name');
  const reviewName = document.getElementById('review-name');
  const reviewAuthNote = document.getElementById('review-auth-note');
  const views = {
    home: document.getElementById('entry-home-view'),
    signin: document.getElementById('entry-signin-view'),
    signup: document.getElementById('entry-signup-view'),
    reset: document.getElementById('entry-reset-view'),
    update: document.getElementById('entry-update-password-view'),
    account: document.getElementById('entry-account-view')
  };
  let currentUser = null;
  let initialized = false;

  const status = (id, message = '', isError = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('error', !!isError);
  };

  const isHosted = /^https?:$/.test(location.protocol);
  const returnUrl = isHosted ? `${location.origin}${location.pathname}` : null;

  const displayName = user => {
    const meta = user?.user_metadata || {};
    return (meta.full_name || meta.name || user?.email?.split('@')[0] || 'VARNIYAM member').trim();
  };

  function copyBrandLogo() {
    const source = document.querySelector('.header-brand-mark');
    const target = document.getElementById('entry-brand-logo');
    if (source?.src && target) target.src = source.src;
  }

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => { if (el) el.hidden = key !== name; });
    const focusable = views[name]?.querySelector('input,button:not(.entry-back)');
    requestAnimationFrame(() => focusable?.focus({ preventScroll: true }));
  }

  function openGate(view = 'home', closable = false) {
    gate.hidden = false;
    document.body.classList.add('entry-open');
    closeButton.hidden = !closable;
    showView(view);
    gate.scrollTop = 0;
  }

  function closeGate() {
    gate.hidden = true;
    document.body.classList.remove('entry-open');
  }

  function fillAccount(user) {
    const name = displayName(user);
    document.getElementById('entry-account-name').textContent = name;
    document.getElementById('entry-account-email').textContent = user?.email || '';
    document.getElementById('entry-account-avatar').textContent = (name[0] || 'V').toUpperCase();
  }

  function updateMemberUI(user) {
    currentUser = user || null;
    if (currentUser) {
      sessionStorage.removeItem(guestKey);
      const name = displayName(currentUser);
      const firstName = name.split(/\s+/)[0] || name;
      accountButton.textContent = 'My Account';
      navMemberGreeting.textContent = `Hi, ${firstName}`;
      navMemberGreeting.hidden = false;
      navLogoutButton.hidden = false;
      memberWelcomeName.textContent = name;
      memberWelcomeBar.hidden = false;
      fillAccount(currentUser);
      if (reviewAuthNote) reviewAuthNote.textContent = `Signed in as ${currentUser.email}. Your review will be connected to your VARNIYAM account and held for approval.`;
      if (reviewName && !reviewName.value.trim()) reviewName.value = name;
    } else {
      accountButton.textContent = 'Account';
      navMemberGreeting.textContent = '';
      navMemberGreeting.hidden = true;
      navLogoutButton.hidden = true;
      memberWelcomeBar.hidden = true;
      if (reviewAuthNote) reviewAuthNote.textContent = 'Sign in to your VARNIYAM account to submit a review. Approved reviews and photos are saved online for the community.';
    }
  }

  document.querySelectorAll('[data-entry-view]').forEach(button => {
    button.addEventListener('click', () => showView(button.dataset.entryView));
  });

  guestButton.addEventListener('click', () => {
    sessionStorage.setItem(guestKey, '1');
    closeGate();
  });
  closeButton.addEventListener('click', closeGate);
  document.getElementById('entry-account-back').addEventListener('click', closeGate);
  document.getElementById('entry-account-enter').addEventListener('click', closeGate);

  accountButton.addEventListener('click', () => {
    openGate(currentUser ? 'account' : 'signin', true);
  });

  window.addEventListener('varniyam:open-auth', event => {
    openGate(event.detail || 'signin', true);
  });

  views.signin.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return status('entry-signin-status', 'Account service is unavailable. Please refresh.', true);
    const email = document.getElementById('entry-signin-email').value.trim();
    const password = document.getElementById('entry-signin-password').value;
    status('entry-signin-status', 'Signing you in…');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return status('entry-signin-status', error.message, true);
    updateMemberUI(data.user);
    status('entry-signin-status', 'Welcome back.');
    closeGate();
  });

  views.signup.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return status('entry-signup-status', 'Account service is unavailable. Please refresh.', true);
    const fullName = document.getElementById('entry-signup-name').value.trim();
    const email = document.getElementById('entry-signup-email').value.trim();
    const password = document.getElementById('entry-signup-password').value;
    const confirm = document.getElementById('entry-signup-confirm').value;
    if (fullName.length < 2) return status('entry-signup-status', 'Please enter your name.', true);
    if (password.length < 8) return status('entry-signup-status', 'Use at least 8 characters for your password.', true);
    if (password !== confirm) return status('entry-signup-status', 'The two passwords do not match.', true);
    status('entry-signup-status', 'Creating your VARNIYAM account…');
    const options = { data: { full_name: fullName } };
    if (returnUrl) options.emailRedirectTo = returnUrl;
    const { data, error } = await client.auth.signUp({ email, password, options });
    if (error) return status('entry-signup-status', error.message, true);
    if (data.session && data.user) {
      updateMemberUI(data.user);
      status('entry-signup-status', 'Account created. Welcome to VARNIYAM.');
      closeGate();
    } else {
      status('entry-signup-status', 'Account created. Check your email and confirm your address, then return here and sign in.');
    }
  });

  views.reset.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return status('entry-reset-status', 'Account service is unavailable. Please refresh.', true);
    const email = document.getElementById('entry-reset-email').value.trim();
    status('entry-reset-status', 'Sending your reset email…');
    const options = returnUrl ? { redirectTo: returnUrl } : undefined;
    const { error } = await client.auth.resetPasswordForEmail(email, options);
    if (error) return status('entry-reset-status', error.message, true);
    status('entry-reset-status', 'Reset link sent. Check your email.');
  });

  views.update.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return status('entry-update-status', 'Account service is unavailable. Please refresh.', true);
    const password = document.getElementById('entry-new-password').value;
    if (password.length < 8) return status('entry-update-status', 'Use at least 8 characters.', true);
    status('entry-update-status', 'Updating your password…');
    const { error } = await client.auth.updateUser({ password });
    if (error) return status('entry-update-status', error.message, true);
    status('entry-update-status', 'Password updated. You are signed in.');
    setTimeout(closeGate, 700);
  });

  async function signOutMember() {
    if (!client) return;
    status('entry-account-status', 'Signing out…');
    navLogoutButton.disabled = true;
    const { error } = await client.auth.signOut();
    navLogoutButton.disabled = false;
    if (error) return status('entry-account-status', error.message, true);
    updateMemberUI(null);
    status('entry-account-status', '');
    sessionStorage.removeItem(guestKey);
    openGate('home', false);
  }

  document.getElementById('entry-logout').addEventListener('click', signOutMember);
  navLogoutButton.addEventListener('click', signOutMember);

  copyBrandLogo();

  if (!client) {
    updateMemberUI(null);
    openGate('home', false);
    initialized = true;
    return;
  }

  client.auth.onAuthStateChange((event, session) => {
    updateMemberUI(session?.user || null);
    if (event === 'PASSWORD_RECOVERY') {
      openGate('update', false);
      return;
    }
    if (initialized && event === 'SIGNED_IN') closeGate();
  });

  client.auth.getSession().then(({ data, error }) => {
    initialized = true;
    if (error) console.error('Could not read VARNIYAM session:', error);
    const user = data?.session?.user || null;
    updateMemberUI(user);
    if (user) closeGate();
    else if (sessionStorage.getItem(guestKey) === '1') closeGate();
    else openGate('home', false);
  });
})();
