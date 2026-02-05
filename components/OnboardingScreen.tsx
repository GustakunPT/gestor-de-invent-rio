import React, { useState } from 'react';
import { Building2, Save, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { User, Tenant } from '../types';

interface OnboardingScreenProps {
    currentUser: User;
    onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ currentUser, onComplete }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        nif: '',
        address: '',
        postalCode: '',
        city: '',
        phone: '',
        email: currentUser.email || '',
        plan: 'starter' as 'starter' | 'professional' | 'enterprise'
    });

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.nif) {
            setError('Nome e NIF são obrigatórios.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Create Tenant
            console.log('Creating tenant...');
            const tenantRes = await api.createTenant({
                name: formData.name,
                nif: formData.nif,
                address: formData.address,
                postalCode: formData.postalCode,
                city: formData.city,
                phone: formData.phone,
                email: formData.email,
                plan: formData.plan
            });

            if (!tenantRes.success || !tenantRes.tenant) {
                throw new Error(tenantRes.error as string || 'Falha ao criar empresa.');
            }

            const newTenant = tenantRes.tenant;
            console.log('Tenant created:', newTenant.id);

            // 2. Assign current user to this tenant as Admin
            console.log('Assigning user...');
            const assignRes = await api.assignUserToTenant(currentUser.id, newTenant.id, true);

            if (!assignRes.success) {
                throw new Error('Falha ao associar utilizador à empresa.');
            }

            // 3. Success!
            setStep(2);
            setTimeout(() => {
                onComplete();
            }, 2000);

        } catch (err: any) {
            console.error('Onboarding Error:', err);
            setError(typeof err === 'string' ? err : 'Erro desconhecido ao configurar empresa.');
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 2) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tudo Pronto!</h2>
                    <p className="text-gray-500 text-lg">A sua empresa foi configurada com sucesso.</p>
                    <p className="text-sm text-gray-400 animate-pulse">A entrar...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            {/* Brand / Logo Area */}
            <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ERP Manager</h1>
                </div>
                <p className="text-gray-500">Bem-vindo! Vamos configurar a sua empresa.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Left Side: Info */}
                <div className="md:w-1/3 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white hidden md:flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-4">Nova Empresa</h3>
                        <p className="text-blue-100 mb-6">Preencha os dados da sua empresa para começar a gerir o seu inventário e vendas.</p>

                        <ul className="space-y-3 text-sm text-blue-100">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Gestão de Inventário</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Faturação Simples</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Gestão de Clientes</span>
                            </li>
                        </ul>
                    </div>
                    <div className="text-xs text-blue-200 mt-8">
                        Passo 1 de 1
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="md:w-2/3 p-8">
                    <form onSubmit={handleCreateCompany} className="space-y-4">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nome da Empresa *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ex: Minha Loja Lda"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    NIF *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nif}
                                    onChange={e => setFormData({ ...formData, nif: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="500..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Telemóvel
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="+351..."
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Morada
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Rua..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Código Postal
                                </label>
                                <input
                                    type="text"
                                    value={formData.postalCode}
                                    onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="0000-000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Lisboa"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>Configurando...</>
                            ) : (
                                <>
                                    Começar
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
