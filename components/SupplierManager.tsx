import React, { useState } from 'react';
import { Truck, Plus, Trash2, Mail, Phone, MapPin, Edit2 } from 'lucide-react';
import { Supplier } from '../types';

interface SupplierManagerProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Supplier) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

export const SupplierManager: React.FC<SupplierManagerProps> = ({ suppliers, onAddSupplier, onEditSupplier, onDeleteSupplier }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    nif: ''
  });

  const handleOpenForm = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id);
      setFormData({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        nif: supplier.nif
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '', address: '', nif: '' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEditSupplier({
        id: editingId,
        ...formData
      });
    } else {
      onAddSupplier({
        id: `SUP-${Date.now()}`,
        ...formData
      });
    }
    setFormData({ name: '', email: '', phone: '', address: '', nif: '' });
    setEditingId(null);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Truck className="w-5 h-5 mr-2 text-gray-500" />
          Gestão de Fornecedores
        </h2>
        <button
          onClick={() => handleOpenForm()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Fornecedor
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">{editingId ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome da Empresa"
              required
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <input
              type="text"
              placeholder="NIF"
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
              value={formData.nif}
              onChange={e => setFormData({...formData, nif: e.target.value})}
            />
            <input
              type="email"
              placeholder="Email"
              required
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
            <input
              type="tel"
              placeholder="Telefone"
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
            <input
              type="text"
              placeholder="Morada"
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 md:col-span-2"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button
                onClick={() => handleOpenForm(supplier)}
                className="text-gray-400 hover:text-blue-500"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteSupplier(supplier.id)}
                className="text-gray-400 hover:text-red-500"
                title="Apagar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{supplier.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">ID: {supplier.id}</p>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                {supplier.email}
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                {supplier.phone || 'N/A'}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                {supplier.address || 'N/A'}
              </div>
              <div className="pt-2 text-xs font-mono text-gray-400">
                NIF: {supplier.nif || 'N/A'}
              </div>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            Nenhum fornecedor registado.
          </div>
        )}
      </div>
    </div>
  );
};