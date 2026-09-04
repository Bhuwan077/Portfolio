const SUPABASE_URL = "https://cpvfolhfhohrduonzllm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vRniLHL0K84KEBR5fpqBKw_Uht4wKkB";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true
  }
});

const form = document.getElementById('loginForm');
const errorEl = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = "Login failed: " + error.message;
    return;
  }

  window.location.href = "dashboard.html";
});