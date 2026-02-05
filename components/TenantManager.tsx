// ============================================
// COMPONENTE: GESTOR DE EMPRESAS (TENANTS)
// ============================================
// Painel de administração para gerir múltiplas empresas (tenants)
// Apenas acessível a super admins ou tenant admins

import React, { useState, useEffect } from 'react';
import {
    Building2, Plus, Edit2, Trash2, Users, Package,
    Calendar, Check, X, AlertCircle, Crown, Settings,
    Mail, Phone, MapPin, FileText, Loader
} from 'lucide-react';
import { Tenant, SubscriptionPlan, User, Subscription } from '../types';
import { api } from '../api';

interface TenantManagerProps {
    currentTenantId?: string;
    isSuperAdmin?: boolean;
}

const PLAN_LIMITS: Record<SubscriptionPlan, { users: number; products: number; label: string; color: string }> = {
    starter: { users: 1, products: 100, label: 'Starter', color: 'bg-gray-100 text-gray-700' },
    professional: { users: 5, products: 1000, label: 'Professional', color: 'bg-blue-100 text-blue-700' },
    enterprise: { users: 999, products: 999999, label: 'Enterprise', color: 'bg-purple-100 text-purple-700' }
};

export const TenantManager: React.FC<TenantManagerProps> = ({
    currentTenantId,
    isSuperAdmin = false
}) => {
    // State
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [tenantUsers, setTenantUsers] = useState<User[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        nif: '',
        address: '',
        postalCode: '',
        city: '',
        phone: '',
        email: '',
        plan: 'starter' as SubscriptionPlan
    });

    // Subscription Form state
    const [isEditingSubscription, setIsEditingSubscription] = useState(false);
    const [subFormData, setSubFormData] = useState({
        plan: 'starter' as SubscriptionPlan,
        status: 'active' as 'active' | 'past_due' | 'canceled' | 'trial',
        endDate: ''
    });

    // Load tenants (super admin sees all, regular admin sees only their own)
    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        setIsLoading(true);
        try {
            // For now, we'll simulate loading. In production, this would call api.getAllTenants() for super admins
            // or api.getTenant() for regular tenant admins
            if (currentTenantId) {
                const tenant = await api.getTenant(currentTenantId);
                if (tenant) {
                    setTenants([tenant]);
                    setSelectedTenant(tenant);
                }
            }
        } catch (e) {
            setError('Erro ao carregar empresas');
        } finally {
            setIsLoading(false);
        }
    };

    const loadTenantUsers = async (tenantId: string) => {
        try {
            const users = await api.getTenantUsers(tenantId);
            setTenantUsers(users);
        } catch (e) {
            console.error('Error loading tenant users:', e);
        }
    };

    const handleSelectTenant = async (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setIsEditing(false);
        setIsCreating(false);
        setError(null);

        // Load details in parallel
        await Promise.all([
            loadTenantUsers(tenant.id),
            loadSubscription(tenant.id)
        ]);
    };

    const loadSubscription = async (tenantId: string) => {
        try {
            const sub = await api.getSubscription(tenantId);
            setCurrentSubscription(sub);
        } catch (e) {
            console.error('Error loading subscription:', e);
        }
    };

    const handleEdit = () => {
        if (!selectedTenant) return;
        setFormData({
            name: selectedTenant.name,
            nif: selectedTenant.nif || '',
            address: selectedTenant.address || '',
            postalCode: selectedTenant.postalCode || '',
            city: selectedTenant.city || '',
            phone: selectedTenant.phone || '',
            email: selectedTenant.email || '',
            plan: selectedTenant.plan
        });
        setIsEditing(true);
        setIsCreating(false);
    };

    const handleCreate = () => {
        setFormData({
            name: '',
            nif: '',
            address: '',
            postalCode: '',
            city: '',
            phone: '',
            email: '',
            plan: 'starter'
        });
        setIsCreating(true);
        setIsEditing(false);
        setSelectedTenant(null);
    };

    const handleSave = async () => {
        try {
            if (isCreating) {
                const result = await api.createTenant({
                    name: formData.name,
                    nif: formData.nif,
                    address: formData.address,
                    postalCode: formData.postalCode,
                    city: formData.city,
                    phone: formData.phone,
                    email: formData.email,
                    plan: formData.plan,
                    maxUsers: PLAN_LIMITS[formData.plan].users,
                    maxProducts: PLAN_LIMITS[formData.plan].products
                });
                if (result.success) {
                    await loadTenants();
                    setIsCreating(false);
                }
            } else if (isEditing && selectedTenant) {
                const result = await api.updateTenant(selectedTenant.id, {
                    name: formData.name,
                    nif: formData.nif,
                    address: formData.address,
                    postalCode: formData.postalCode,
                    city: formData.city,
                    phone: formData.phone,
                    email: formData.email
                });
                if (result.success) {
                    await loadTenants();
                    setIsEditing(false);
                }
            }
        } catch (e) {
            setError('Erro ao guardar empresa');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setIsCreating(false);
    };

    const handleEditSubscription = () => {
        if (!currentSubscription) return;
        setSubFormData({
            plan: currentSubscription.plan,
            status: currentSubscription.status,
            endDate: currentSubscription.endDate ? new Date(currentSubscription.endDate).toISOString().split('T')[0] : ''
        });
        setIsEditingSubscription(true);
    };

    const handleSaveSubscription = async () => {
        if (!currentSubscription) return;
        try {
            const result = await api.updateSubscription(currentSubscription.id, {
                plan: subFormData.plan,
                status: subFormData.status,
                endDate: subFormData.endDate ? new Date(subFormData.endDate).toISOString() : undefined
            });

            if (result.success) {
                await loadSubscription(currentSubscription.tenantId);
                setIsEditingSubscription(false);
            } else {
                setError('Erro ao atualizar subscrição');
            }
        } catch (e) {
            setError('Erro ao guardar subscrição');
        }
    };

    const handleEditSubscription = () => {
        if (!currentSubscription) return;
        setSubFormData({
            plan: currentSubscription.plan,
            status: currentSubscription.status,
            endDate: currentSubscription.endDate ? new Date(currentSubscription.endDate).toISOString().split('T')[0] : ''
        });
        setIsEditingSubscription(true);
    };

    const handleSaveSubscription = async () => {
        if (!currentSubscription) return;
        try {
            const result = await api.updateSubscription(currentSubscription.id, {
                plan: subFormData.plan,
                status: subFormData.status,
                endDate: subFormData.endDate ? new Date(subFormData.endDate).toISOString() : undefined
            });

            if (result.success) {
                await loadSubscription(currentSubscription.tenantId);
                setIsEditingSubscription(false);
            } else {
                setError('Erro ao atualizar subscrição');
            }
        } catch (e) {
            setError('Erro ao guardar subscrição');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestão de Empresas</h2>
                            <p className="text-sm text-gray-500">Administrar empresas e utilizadores</p>
                        </div>
                    </div>
                    {isSuperAdmin && (
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Empresa
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 dark:text-red-400">{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tenant List */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Empresas</h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {tenants.map(tenant => (
                                <button
                                    key={tenant.id}
                                    onClick={() => handleSelectTenant(tenant)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedTenant?.id === tenant.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{tenant.name}</p>
                                            <p className="text-xs text-gray-500">{tenant.nif || 'Sem NIF'}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${PLAN_LIMITS[tenant.plan].color}`}>
                                            {PLAN_LIMITS[tenant.plan].label}
                                        </span>
                                    </div>
                                </button>
                            ))}
                            {tenants.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>Nenhuma empresa encontrada</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tenant Details / Form */}
                <div className="lg:col-span-2">
                    {(isEditing || isCreating) ? (
                        /* Edit/Create Form */
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                {isCreating ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                                {isCreating ? 'Nova Empresa' : 'Editar Empresa'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nome da Empresa *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700 dark:text-white"
                                        placeholder="Ex: Empresa XYZ, Lda"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        NIF
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nif}
                                        onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700 dark:text-white"
                                        placeholder="500123456"
                                        maxLength={9}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700 dark:text-white"
                                        placeholder="empresa@exemplo.pt"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Telefone
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700 dark:text-white"
                                        placeholder="912 345 678"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Código Postal
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.postalCode}
                                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700 dark:text-white"
                                        placeholder="1000-001"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Morada
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700 dark:text-white"
                                        placeholder="Rua da Empresa, 123"
                                    />
                                </div>

                                {isCreating && isSuperAdmin && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Plano de Subscrição
                                        </label>
                                        <select
                                            value={formData.plan}
                                            onChange={(e) => setFormData({ ...formData, plan: e.target.value as SubscriptionPlan })}
                                            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="starter">Starter (1 utilizador, 100 produtos)</option>
                                            <option value="professional">Professional (5 utilizadores, 1000 produtos)</option>
                                            <option value="enterprise">Enterprise (Ilimitado)</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {isCreating ? 'Criar Empresa' : 'Guardar Alterações'}
                                </button>
                            </div>
                        </div>
                    ) : selectedTenant ? (
                        /* Tenant Details View */
                        <div className="space-y-6">
                            {/* Info Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                                            {selectedTenant.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTenant.name}</h3>
                                            <p className="text-gray-500">NIF: {selectedTenant.nif || 'N/D'}</p>
                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full mt-2 ${PLAN_LIMITS[selectedTenant.plan].color}`}>
                                                <Crown className="w-3 h-3" />
                                                {PLAN_LIMITS[selectedTenant.plan].label}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleEdit}
                                        className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Editar
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedTenant.email || 'N/D'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <Phone className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Telefone</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedTenant.phone || 'N/D'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg md:col-span-2">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Morada</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {selectedTenant.address || 'N/D'}
                                                {selectedTenant.postalCode && `, ${selectedTenant.postalCode}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Users className="w-6 h-6 text-blue-500 mb-2" />
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenantUsers.length}</p>
                                    <p className="text-xs text-gray-500">/ {selectedTenant.maxUsers} utilizadores</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Package className="w-6 h-6 text-green-500 mb-2" />
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
                                    <p className="text-xs text-gray-500">/ {selectedTenant.maxProducts} produtos</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Calendar className="w-6 h-6 text-purple-500 mb-2" />
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {new Date(selectedTenant.createdAt).toLocaleDateString('pt-PT')}
                                    </p>
                                    <p className="text-xs text-gray-500">Data criação</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Settings className="w-6 h-6 text-orange-500 mb-2" />
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {selectedTenant.settings.taxRate}%
                                    </p>
                                    <p className="text-xs text-gray-500">Taxa IVA</p>
                                </div>
                            </div>

                            {/* Subscription Details (Edit Aware) */}
                            {currentSubscription && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Crown className="w-5 h-5 text-yellow-500" />
                                            Subscrição Ativa
                                        </h4>
                                        {isSuperAdmin && !isEditingSubscription && (
                                            <button
                                                onClick={handleEditSubscription}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Gerir Licença
                                            </button>
                                        )}
                                    </div>

                                    {isEditingSubscription ? (
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">PLANO</label>
                                                    <select
                                                        value={subFormData.plan}
                                                        onChange={(e) => setSubFormData({ ...subFormData, plan: e.target.value as SubscriptionPlan })}
                                                        className="w-full text-sm border-gray-200 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                                    >
                                                        <option value="starter">Starter</option>
                                                        <option value="professional">Professional</option>
                                                        <option value="enterprise">Enterprise</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">STATUS</label>
                                                    <select
                                                        value={subFormData.status}
                                                        onChange={(e) => setSubFormData({ ...subFormData, status: e.target.value as any })}
                                                        className="w-full text-sm border-gray-200 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                                    >
                                                        <option value="active">Ativo</option>
                                                        <option value="trial">Trial (Teste)</option>
                                                        <option value="past_due">Vencido</option>
                                                        <option value="canceled">Cancelado</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">VALIDADE (Opcional)</label>
                                                    <input
                                                        type="date"
                                                        value={subFormData.endDate}
                                                        onChange={(e) => setSubFormData({ ...subFormData, endDate: e.target.value })}
                                                        className="w-full text-sm border-gray-200 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">Deixe em branco para acesso vitalício</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <button
                                                    onClick={() => setIsEditingSubscription(false)}
                                                    className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleSaveSubscription}
                                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">PLANO</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{currentSubscription.plan}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">STATUS</p>
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${currentSubscription.status === 'active' ? 'bg-green-100 text-green-700' :
                                                        currentSubscription.status === 'trial' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {currentSubscription.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">VALIDADE</p>
                                                <p className="text-gray-900 dark:text-white">
                                                    {currentSubscription.endDate ? new Date(currentSubscription.endDate).toLocaleDateString('pt-PT') : 'Vitalício'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Users List */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Utilizadores
                                    </h4>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {tenantUsers.map(user => (
                                        <div key={user.id} className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                    <span className="font-medium text-gray-600 dark:text-gray-300">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </div>
                                    ))}
                                    {tenantUsers.length === 0 && (
                                        <div className="p-8 text-center text-gray-500">
                                            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                            <p>Nenhum utilizador encontrado</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* No Selection */
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Selecione uma empresa</h3>
                            <p className="text-gray-500">Escolha uma empresa da lista para ver os detalhes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
