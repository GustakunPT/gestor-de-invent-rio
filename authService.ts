import { supabase } from './supabaseClient';
import { User, UserRole } from './types';

/**
 * Serviço de Autenticação utilizando Supabase Auth.
 * Substitui o login simulado anterior.
 */

// Converter utilizador do Supabase (Auth) para o nosso tipo User da aplicação
const mapAuthToAppUser = (authUser: any): User | null => {
    if (!authUser) return null;

    // Tenta obter o nome e role dos metadados, ou usa defaults
    const metadata = authUser.user_metadata || {};

    return {
        id: authUser.id,
        email: authUser.email,
        name: metadata.name || authUser.email?.split('@')[0] || 'Utilizador',
        role: (metadata.role as UserRole) || 'STAFF', // Default para STAFF se não definido
        password: '', // Não guardamos a password na aplicação
        isActive: true,
        createdAt: authUser.created_at,
        lastLogin: authUser.last_sign_in_at
    };
};

export const authService = {
    /**
     * Login com Email e Password
     */
    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            user: mapAuthToAppUser(data.user)
        };
    },

    /**
     * Terminar Sessão
     */
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { success: !error, error };
    },

    /**
     * Obter utilizador atual da sessão (se existir)
     */
    /**
     * Obter utilizador atual da sessão (se existir)
     */
    getCurrentUser: async (): Promise<User | null> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return null;

            // Fetch full profile from app_users to get tenant_id and role
            const { data: profile } = await supabase
                .from('app_users')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                return {
                    id: profile.id,
                    email: profile.email,
                    name: profile.name,
                    role: profile.role,
                    tenant_id: profile.tenant_id,
                    isActive: true,
                    createdAt: profile.created_at,
                    lastLogin: new Date().toISOString(),
                    password: ''
                };
            }

            // Fallback for immediate sign-up state (unlikely but safe)
            return mapAuthToAppUser(session.user);
        } catch (e) {
            console.error('Auth check error:', e);
            return null;
        }
    },

    /**
     * Subscrever alterações de estado de autenticação (Login, Logout, Refresh)
     */
    onAuthStateChange: (callback: (user: User | null) => void) => {
        const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                // Fetch profile on auth change too
                const { data: profile } = await supabase
                    .from('app_users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    callback({
                        id: profile.id,
                        email: profile.email,
                        name: profile.name,
                        role: profile.role,
                        tenant_id: profile.tenant_id,
                        isActive: true,
                        createdAt: profile.created_at,
                        lastLogin: new Date().toISOString(),
                        password: ''
                    });
                    return;
                }
            }
            // If no session or profile fetch fails
            const user = session?.user ? mapAuthToAppUser(session.user) : null;
            callback(user);
        });
        return data.subscription;
    },

    /**
     * (Opcional) Registar novo utilizador via código
     */
    signUp: async (email: string, password: string, name: string, role: UserRole = 'STAFF') => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role // Guarda a role nos metadados do utilizador
                }
            }
        });

        if (error) return { success: false, error: error.message };
        return { success: true, user: mapAuthToAppUser(data.user) };
    }
};
