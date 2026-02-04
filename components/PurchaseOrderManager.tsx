import React, { useState } from 'react';
import { PackagePlus, Plus, CheckCircle, Clock } from 'lucide-react';
import { Product, Supplier, PurchaseOrder, PurchaseOrderItem } from '../types';
import { formatDateTime } from '../utils/dateUtils';

interface PurchaseOrderManagerProps {
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onCreateOrder: (order: PurchaseOrder) => void;
  onReceiveOrder: (orderId: string) => void;
}

export const PurchaseOrderManager: React.FC<PurchaseOrderManagerProps> = ({
  products,
  suppliers,
  purchaseOrders,
  onCreateOrder,
  onReceiveOrder
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [cart, setCart] = useState<PurchaseOrderItem[]>([]);

  // Item selection
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [costPrice, setCostPrice] = useState(0);

  const addItem = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    setCart([...cart, {
      productId: product.id,
      productName: product.name,
      quantity,
      costPrice,
      total: quantity * costPrice
    }]);

    // Reset inputs
    setSelectedProductId('');
    setQuantity(1);
    setCostPrice(0);
  };

  const handleCreateOrder = () => {
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier || cart.length === 0) return;

    const order: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: new Date().toISOString(), // Use ISO string for DB compatibility
      status: 'PENDENTE',
      items: cart,
      totalAmount: cart.reduce((acc, item) => acc + item.total, 0)
    };

    onCreateOrder(order);
    setCart([]);
    setSelectedSupplierId('');
    setActiveTab('history');
  };

  // Auto-fill cost price when product selected
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const p = products.find(prod => prod.id === id);
    if (p) setCostPrice(p.costPrice || 0);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl px-6 pt-4">
        <button
          onClick={() => setActiveTab('new')}
          className={`pb-4 px-4 font-medium text-sm transition-colors relative ${activeTab === 'new' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
        >
          Nova Encomenda (Entrada)
          {activeTab === 'new' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 px-4 font-medium text-sm transition-colors relative ${activeTab === 'history' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
        >
          Histórico de Compras
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
        </button>
      </div>

      {activeTab === 'new' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">1. Selecionar Fornecedor</h3>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
              >
                <option value="">Selecione um fornecedor...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">2. Adicionar Produtos</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Produto</label>
                  <select
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                    value={selectedProductId}
                    onChange={e => handleProductSelect(e.target.value)}
                    disabled={!selectedSupplierId}
                  >
                    <option value="">Selecione...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Qtd</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Custo Unit.</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                    value={costPrice}
                    onChange={e => setCostPrice(parseFloat(e.target.value))}
                  />
                </div>
                <div className="md:col-span-4">
                  <button
                    onClick={addItem}
                    disabled={!selectedProductId}
                    className="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800"
                  >
                    + Adicionar Item à Ordem
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resumo da Ordem</h3>
              <div className="flex-1 overflow-y-auto mb-4 min-h-[200px]">
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-center text-sm">Nenhum item adicionado.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {cart.map((item, idx) => (
                      <li key={idx} className="py-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">{item.productName}</span>
                          <span className="text-gray-900 dark:text-white">{item.total}€</span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {item.quantity} x {item.costPrice}€
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between font-bold text-lg mb-4 text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{cart.reduce((a, b) => a + b.total, 0)}€</span>
                </div>
                <button
                  onClick={handleCreateOrder}
                  disabled={cart.length === 0}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:dark:bg-gray-600"
                >
                  Criar Ordem de Compra
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fornecedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {purchaseOrders.map(po => (
                <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{po.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{po.supplierName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateTime(po.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${po.status === 'RECEBIDO' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(po.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {po.status === 'PENDENTE' && (
                      <button
                        onClick={() => onReceiveOrder(po.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center justify-end w-full"
                      >
                        <PackagePlus className="w-4 h-4 mr-1" />
                        Receber Stock
                      </button>
                    )}
                    {po.status === 'RECEBIDO' && (
                      <span className="text-gray-400 text-sm flex items-center justify-end">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Concluído
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};