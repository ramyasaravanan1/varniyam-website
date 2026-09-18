(() => {
  'use strict';

  const SUPABASE_URL = 'https://rxoutigeogvdgnnlopvr.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_T5yLoFTc_aY0PV-XL3nAAw_lHiLPCP0';

  window.VARNIYAM_CONFIG = Object.freeze({
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  });

  if (!window.supabase?.createClient) {
    console.error('Supabase library is unavailable. Online VARNIYAM features require an internet connection.');
    window.varniyamSupabase = null;
    return;
  }

  if (!window.varniyamSupabase) {
    window.varniyamSupabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }
})();
