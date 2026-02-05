// ============================================
// TENANT CONTEXT
// ============================================
// Provides tenant information to all components
// in the application through React Context.

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, TenantSettings, User } from '../types';
import { supabase } from '../supabaseClient';

// Default tenant settings
const DEFAULT_SETTINGS: TenantSettings = {
    taxRate: 23,
    currency: 'EUR',
    theme: 'light',
    lowStockAlertEnabled: true,
    expiryAlertDays: 30
};

// Default tenant (fallback)
const DEFAULT_TENANT: Tenant = {
    id: '',
    name: 'Empresa',
    slug: 'empresa',
    settings: DEFAULT_SETTINGS,
    plan: 'starter',
    maxUsers: 1,
    maxProducts: 100,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// Context type
interface TenantContextType {
    tenant: Tenant | null;
    settings: TenantSettings;
    isLoading: boolean;
    error: string | null;
    isTenantAdmin: boolean;
    refreshTenant: () => Promise<void>;
    updateTenantSettings: (settings: Partial<TenantSettings>) => Promise<void>;
}

// Create context
const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Provider props
interface TenantProviderProps {
    children: ReactNode;
    userId?: string;
}

// Provider component
export const TenantProvider: React.FC<TenantProviderProps> = ({ children, userId }) => {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTenantAdmin, setIsTenantAdmin] = useState(false);

    // Fetch tenant data
    const fetchTenant = async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Get user's tenant_id
            const { data: userData, error: userError } = await supabase
                .from('app_users')
                .select('tenant_id, is_tenant_admin')
                .eq('id', userId)
                .single();

            if (userError || !userData?.tenant_id) {
                console.error('Error fetching user tenant:', userError);
                setError('Utilizador não associado a nenhuma empresa.');
                setIsLoading(false);
                return;
            }

            setIsTenantAdmin(userData.is_tenant_admin || false);

            // 2. Get tenant data
            const { data: tenantData, error: tenantError } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', userData.tenant_id)
                .single();

            if (tenantError || !tenantData) {
                console.error('Error fetching tenant:', tenantError);
                setError('Empresa não encontrada.');
                setIsLoading(false);
                return;
            }

            // 3. Map to Tenant interface
            const mappedTenant: Tenant = {
                id: tenantData.id,
                name: tenantData.name,
                slug: tenantData.slug,
                nif: tenantData.nif,
                address: tenantData.address,
                postalCode: tenantData.postal_code,
                city: tenantData.city,
                phone: tenantData.phone,
                email: tenantData.email,
                logoUrl: tenantData.logo_url,
                settings: tenantData.settings || DEFAULT_SETTINGS,
                plan: tenantData.plan,
                maxUsers: tenantData.max_users,
                maxProducts: tenantData.max_products,
                isActive: tenantData.is_active,
                createdAt: tenantData.created_at,
                updatedAt: tenantData.updated_at
            };

            setTenant(mappedTenant);
        } catch (e) {
            console.error('Unexpected error fetching tenant:', e);
            setError('Erro ao carregar dados da empresa.');
        } finally {
            setIsLoading(false);
        }
    };

    // Update tenant settings
    const updateTenantSettings = async (newSettings: Partial<TenantSettings>) => {
        if (!tenant || !isTenantAdmin) return;

        try {
            const updatedSettings = { ...tenant.settings, ...newSettings };

            const { error } = await supabase
                .from('tenants')
                .update({ settings: updatedSettings })
                .eq('id', tenant.id);

            if (error) throw error;

            setTenant({ ...tenant, settings: updatedSettings });
        } catch (e) {
            console.error('Error updating tenant settings:', e);
            throw e;
        }
    };

    // Fetch on mount and when userId changes
    useEffect(() => {
        fetchTenant();
    }, [userId]);

    // Context value
    const value: TenantContextType = {
        tenant,
        settings: tenant?.settings || DEFAULT_SETTINGS,
        isLoading,
        error,
        isTenantAdmin,
        refreshTenant: fetchTenant,
        updateTenantSettings
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
};

// Custom hook for accessing tenant context
export const useTenant = (): TenantContextType => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};

// Export default settings for use elsewhere
export { DEFAULT_SETTINGS, DEFAULT_TENANT };
