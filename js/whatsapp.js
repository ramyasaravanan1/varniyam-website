(() => {
 'use strict';
document.getElementById('newsletter').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const phoneInput = document.getElementById('whatsapp-phone');
  const consentInput = document.getElementById('whatsapp-consent');
  const statusEl = document.getElementById('newsletter-status');
  const submitButton = form.querySelector('button[type="submit"]');

  let phone = phoneInput.value.trim().replace(/[\s().-]/g, '');
  if (/^[6-9]\d{9}$/.test(phone)) phone = '+91' + phone;

  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    statusEl.textContent = 'Please enter a valid WhatsApp number with country code, for example +91 98765 43210.';
    phoneInput.focus();
    return;
  }
  if (!consentInput.checked) {
    statusEl.textContent = 'Please confirm that you agree to receive VARNIYAM WhatsApp updates.';
    consentInput.focus();
    return;
  }

  const supabaseClient = window.varniyamSupabase;
  if (!supabaseClient) {
    statusEl.textContent = 'The WhatsApp signup service is still loading. Please try again in a moment.';
    return;
  }

  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  statusEl.textContent = 'Joining the VARNIYAM WhatsApp circle…';

  try {
    const { data, error } = await supabaseClient.rpc('join_varniyam_whatsapp', { p_phone: phone });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.message || 'We could not save this WhatsApp number.');

    statusEl.textContent = data.already_joined
      ? 'You are already on the VARNIYAM WhatsApp list. ✦'
      : 'Welcome to the VARNIYAM WhatsApp circle. ✦';
    form.reset();
  } catch (error) {
    console.error('WhatsApp signup error:', error);
    statusEl.textContent = 'We could not join your WhatsApp number right now. Please try again shortly.';
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
  }
 });
})();
