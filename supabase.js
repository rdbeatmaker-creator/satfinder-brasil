// =====================================================
// SATFINDER BRASIL
// CONEXÃO SUPABASE
// =====================================================

const SUPABASE_URL =
  "https://wpkocwcetmcgjazymthm.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "COLE_AQUI_A_MESMA_PUBLISHABLE_KEY_QUE_VOCE_ME_ENVIOU";

let supabaseClient = null;

function inicializarSupabase() {
  if (!window.supabase) {
    console.error("Biblioteca Supabase não carregada.");
    return false;
  }

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.log("🟢 Supabase conectado.");

  return true;
}
