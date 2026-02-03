import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ModalType, Product, ProductFormData, Supplier } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductFormData) => void;
  initialData?: Product;
  type: ModalType;
  suppliers: Supplier[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  type,
  suppliers
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    category: '',
    quantity: 0,
    minStock: 5,
    maxStock: 100,
    location: '',
    serialNumber: '',
    batchNumber: '',
    price: 0,
    costPrice: 0,
    supplierId: ''
  });

  useEffect(() => {
    if (initialData && type === ModalType.EDIT) {
      setFormData({
        sku: initialData.sku || '',
        name: initialData.name,
        category: initialData.category,
        quantity: initialData.quantity,
        minStock: initialData.minStock || 5,
        maxStock: initialData.maxStock || 100,
        location: initialData.location || '',
        serialNumber: initialData.serialNumber || '',
        batchNumber: initialData.batchNumber || '',
        price: initialData.price,
        costPrice: initialData.costPrice || 0,
        supplierId: initialData.supplierId || ''
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        category: '',
        quantity: 0,
        minStock: 5,
        maxStock: 100,
        location: '',
        serialNumber: '',
        batchNumber: '',
        price: 0,
        costPrice: 0,
        supplierId: ''
      });
    }
  }, [initialData, type, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                {type === ModalType.CREATE ? 'Adicionar Novo Produto' : 'Editar Produto'}
              </h3>
              <button
                onClick={onClose}
                className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU / Código de Barras</label>
                  <input
                    type="text"
                    id="sku"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Ex: ELE-001"
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Produto</label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Série</label>
                  <input
                    type="text"
                    id="serialNumber"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lote</label>
                  <input
                    type="text"
                    id="batchNumber"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                  <select
                    id="category"
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Selecione...</option>
                    <option value="Eletrônicos">Eletrônicos</option>
                    <option value="Periféricos">Periféricos</option>
                    <option value="Mobiliário">Mobiliário</option>
                    <option value="Escritório">Escritório</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                 <div>
                  <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fornecedor Principal</label>
                  <select
                    id="supplier"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.supplierId}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                  >
                    <option value="">Selecione...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 sm:col-span-1">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Localização</label>
                  <input
                    type="text"
                    id="location"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: A-01"
                  />
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qtd Atual</label>
                  <input
                    type="number"
                    id="quantity"
                    min="0"
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Mín</label>
                  <input
                    type="number"
                    id="minStock"
                    min="0"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço Custo (€)</label>
                  <input
                    type="number"
                    id="costPrice"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.costPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço Venda (€)</label>
                  <input
                    type="number"
                    id="price"
                    min="0"
                    step="0.01"
                    required
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                >
                  {type === ModalType.CREATE ? 'Criar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={onClose}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};