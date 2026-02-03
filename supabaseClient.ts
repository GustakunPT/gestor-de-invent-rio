import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação obrigatória das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'ERRO FATAL: Variáveis de ambiente Supabase em falta (VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY). A aplicação não pode iniciar.';
  console.error(errorMessage);
  // Mostrar erro visível ao utilizador
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #fef2f2;">
      <div style="text-align: center; padding: 2rem; max-width: 500px;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Erro de Configuração</h1>
        <p style="color: #7f1d1d;">As variáveis de ambiente do Supabase não estão configuradas.</p>
        <p style="color: #7f1d1d; font-size: 0.875rem; margin-top: 1rem;">
          Verifique o ficheiro <code>.env.local</code> e adicione:<br/>
          <code>VITE_SUPABASE_URL=...</code><br/>
          <code>VITE_SUPABASE_ANON_KEY=...</code>
        </p>
      </div>
    </div>
  `;
  throw new Error(errorMessage);
}

// Criar cliente Supabase apenas se as variáveis existirem
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Função para verificar conectividade
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('app_users').select('count', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
};