import React, { useState } from 'react';
import { Users, Plus, Trash2, Mail, Phone, MapPin, Edit2, Search } from 'lucide-react';
import { Customer } from '../types';

interface CustomerManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  userRole: string; // Nova prop obrigatória
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, onAddCustomer, onEditCustomer, onDeleteCustomer, userRole }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
    name: '',
    nif: '',
    email: '',
    phone: '',
    address: '',
    postalCode: ''
  });

  const handleOpenForm = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData({
        name: customer.name,
        nif: customer.nif,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        postalCode: customer.postalCode
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', nif: '', email: '', phone: '', address: '', postalCode: '' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEditCustomer({
        id: editingId,
        ...formData
      });
    } else {
      onAddCustomer({
        id: `CUST-${Date.now()}`,
        ...formData
      });
    }
    setFormData({ name: '', nif: '', email: '', phone: '', address: '', postalCode: '' });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nif.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
        <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-gray-500" />
            Gestão de Clientes
            </h2>
        </div>
        
        <div className="flex w-full sm:w-auto gap-3">
             <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Pesquisar cliente..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button
            onClick={() => handleOpenForm()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
            >
            <Plus className="w-5 h-5 mr-2" />
            Novo Cliente
            </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">{editingId ? 'Editar Cliente' : 'Adicionar Cliente'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                <input
                type="text"
                required
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NIF</label>
                <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                value={formData.nif}
                onChange={e => setFormData({...formData, nif: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                <input
                type="tel"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                type="email"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código Postal</label>
                <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                value={formData.postalCode}
                onChange={e => setFormData({...formData, postalCode: e.target.value})}
                />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Morada</label>
                <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
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
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button
                onClick={() => handleOpenForm(customer)}
                className="text-gray-400 hover:text-blue-500"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {/* Só mostra botão de apagar se for ADMIN */}
              {userRole === 'ADMIN' && (
                <button
                  onClick={() => onDeleteCustomer(customer.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="Apagar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{customer.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">NIF: {customer.nif || 'N/A'}</p>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <span className="truncate">{customer.email || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                {customer.phone || 'N/A'}
              </div>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                <span>
                    {customer.address ? customer.address : 'N/A'}
                    {customer.postalCode && <span className="block text-xs text-gray-400">{customer.postalCode}</span>}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>
    </div>
  );
};