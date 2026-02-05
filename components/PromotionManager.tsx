import React, { useState, useMemo } from 'react';
import { Tag, Plus, Edit2, Trash2, Calendar, Percent, Gift, Zap, Clock, CheckCircle } from 'lucide-react';
import { Promotion } from '../types';
import { generateId } from '../validators';

interface PromotionManagerProps {
    promotions: Promotion[];
    onAdd: (promotion: Promotion) => void;
    onEdit: (promotion: Promotion) => void;
    onDelete: (id: string) => void;
}

export const PromotionManager: React.FC<PromotionManagerProps> = ({
    promotions,
    onAdd,
    onEdit,
    onDelete
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'PERCENTAGE' as Promotion['type'],
        value: 0,
        startDate: '',
        endDate: '',
        couponCode: '',
        minPurchase: 0,
        isActive: true
    });

    // Calculate active promotions
    const { activePromos, upcomingPromos, expiredPromos } = useMemo(() => {
        const now = new Date();
        const active: Promotion[] = [];
        const upcoming: Promotion[] = [];
        const expired: Promotion[] = [];

        promotions.forEach(promo => {
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);

            if (promo.isActive && now >= start && now <= end) {
                active.push(promo);
            } else if (now < start) {
                upcoming.push(promo);
            } else {
                expired.push(promo);
            }
        });

        return { activePromos: active, upcomingPromos: upcoming, expiredPromos: expired };
    }, [promotions]);

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'PERCENTAGE',
            value: 0,
            startDate: '',
            endDate: '',
            couponCode: '',
            minPurchase: 0,
            isActive: true
        });
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const promotion: Promotion = {
            id: editingId || generateId('PROMO'),
            name: formData.name,
            type: formData.type,
            value: formData.value,
            startDate: formData.startDate,
            endDate: formData.endDate,
            couponCode: formData.couponCode || undefined,
            minPurchase: formData.minPurchase || undefined,
            currentUses: 0,
            isActive: formData.isActive
        };

        if (editingId) {
            onEdit(promotion);
        } else {
            onAdd(promotion);
        }

        resetForm();
    };

    const startEdit = (promo: Promotion) => {
        setFormData({
            name: promo.name,
            type: promo.type,
            value: promo.value,
            startDate: promo.startDate,
            endDate: promo.endDate,
            couponCode: promo.couponCode || '',
            minPurchase: promo.minPurchase || 0,
            isActive: promo.isActive
        });
        setEditingId(promo.id);
        setIsFormOpen(true);
    };

    const isPromotionActive = (promo: Promotion) => {
        const now = new Date();
        const start = new Date(promo.startDate);
        const end = new Date(promo.endDate);
        return promo.isActive && now >= start && now <= end;
    };

    return (
        <div className="space-y-6">
            {/* Active Promotions Summary */}
            {activePromos.length > 0 && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Promoções Ativas</h2>
                            <p className="text-purple-100 text-sm">{activePromos.length} promoção{activePromos.length > 1 ? 'ões' : ''} em vigor</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activePromos.map(promo => {
                            const daysRemaining = getDaysRemaining(promo.endDate);
                            return (
                                <div key={promo.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-white">{promo.name}</h3>
                                        <span className="text-2xl font-bold">
                                            {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `${promo.value}€`}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-purple-100">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>

                                    {promo.couponCode && (
                                        <div className="mt-3 px-3 py-1.5 bg-white/20 rounded-lg text-center">
                                            <span className="font-mono font-bold tracking-wider">{promo.couponCode}</span>
                                        </div>
                                    )}

                                    {promo.minPurchase && promo.minPurchase > 0 && (
                                        <p className="text-xs text-purple-200 mt-2">
                                            Min. compra: {promo.minPurchase.toFixed(2)}€
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activePromos.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ativas</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingPromos.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Agendadas</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Calendar className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{expiredPromos.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Expiradas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-purple-500" />
                    Gestão de Promoções
                </h2>
                <button
                    onClick={() => { setIsFormOpen(true); setEditingId(null); }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nova Promoção
                </button>
            </div>

            {/* Form */}
            {isFormOpen && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        {editingId ? 'Editar Promoção' : 'Nova Promoção'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nome da Promoção *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Ex: Saldos de Verão"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tipo
                            </label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as Promotion['type'] })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                            >
                                <option value="PERCENTAGE">Percentagem (%)</option>
                                <option value="FIXED">Valor Fixo (€)</option>
                                <option value="BUY_X_GET_Y">Compre X Leve Y</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Valor {formData.type === 'PERCENTAGE' ? '(%)' : '(€)'}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step={formData.type === 'PERCENTAGE' ? '1' : '0.01'}
                                max={formData.type === 'PERCENTAGE' ? '100' : undefined}
                                value={formData.value}
                                onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Data Início *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Data Fim *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.endDate}
                                min={formData.startDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Código Promocional
                            </label>
                            <input
                                type="text"
                                value={formData.couponCode}
                                onChange={e => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 font-mono"
                                placeholder="Ex: VERAO2024"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Compra Mínima (€)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.minPurchase}
                                onChange={e => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                                {editingId ? 'Atualizar' : 'Criar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Promotions Grid */}
            {promotions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-xl text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma promoção criada.</p>
                    <p className="text-sm mt-1">Crie a primeira promoção para começar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {promotions.map(promo => {
                        const active = isPromotionActive(promo);
                        return (
                            <div
                                key={promo.id}
                                className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-2 relative overflow-hidden transition-all ${active
                                    ? 'border-green-300 dark:border-green-700'
                                    : 'border-gray-100 dark:border-gray-700 opacity-75'
                                    }`}
                            >
                                {active && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg font-medium">
                                        ATIVA
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-lg mr-3 ${active ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-700'
                                            }`}>
                                            {promo.type === 'PERCENTAGE' ? (
                                                <Percent className={`w-5 h-5 ${active ? 'text-purple-600' : 'text-gray-500'}`} />
                                            ) : (
                                                <Tag className={`w-5 h-5 ${active ? 'text-purple-600' : 'text-gray-500'}`} />
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{promo.name}</h3>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => startEdit(promo)}
                                            className="text-gray-400 hover:text-blue-500 p-1"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(promo.id)}
                                            className="text-gray-400 hover:text-red-500 p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-3">
                                    {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `${promo.value.toFixed(2)}€`}
                                    <span className="text-sm font-normal text-gray-500 ml-2">desconto</span>
                                </div>

                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {new Date(promo.startDate).toLocaleDateString('pt-PT')} - {new Date(promo.endDate).toLocaleDateString('pt-PT')}
                                </div>

                                {promo.couponCode && (
                                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-center border border-dashed border-gray-300 dark:border-gray-600">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Código:</span>
                                        <span className="ml-2 font-mono font-bold text-gray-900 dark:text-white">{promo.couponCode}</span>
                                    </div>
                                )}

                                {promo.minPurchase && promo.minPurchase > 0 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Compra mínima: {promo.minPurchase.toFixed(2)}€
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PromotionManager;
