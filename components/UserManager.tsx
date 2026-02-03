import React, { useState } from 'react';
import { User, Plus, Trash2, Edit2, Shield, User as UserIcon, Lock } from 'lucide-react';
import { User as UserType } from '../types';

interface UserManagerProps {
  users: UserType[];
  currentUser: UserType;
  onAddUser: (user: UserType) => void;
  onEditUser: (user: UserType) => void;
  onDeleteUser: (id: string) => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ users, currentUser, onAddUser, onEditUser, onDeleteUser }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<UserType, 'id'>>({
    name: '',
    role: 'STAFF',
    password: ''
  });

  const handleOpenForm = (user?: UserType) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        name: user.name,
        role: user.role,
        password: user.password
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', role: 'STAFF', password: '' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEditUser({
        id: editingId,
        ...formData
      });
    } else {
      // Generate next numeric ID
      const maxId = users.reduce((max, user) => {
          const numId = parseInt(user.id);
          return !isNaN(numId) && numId > max ? numId : max;
      }, 1000);
      
      onAddUser({
        id: (maxId + 1).toString(),
        ...formData
      });
    }
    setFormData({ name: '', role: 'STAFF', password: '' });
    setEditingId(null);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
          Gestão de Utilizadores
        </h2>
        <button
          onClick={() => handleOpenForm()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Utilizador
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">{editingId ? 'Editar Utilizador' : 'Adicionar Utilizador'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Função (Cargo)</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as 'ADMIN' | 'STAFF'})}
              >
                <option value="STAFF">Staff (Vendedor/Operador)</option>
                <option value="ADMIN">Administrador (Acesso Completo)</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text" // Showing text for ease of management in this mock
                        required
                        className="w-full pl-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder="Definir password"
                    />
                </div>
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
                {editingId ? 'Atualizar' : 'Criar Utilizador'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Função</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Password</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {user.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center">
                     <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                        <UserIcon className="h-4 w-4" />
                     </div>
                     <div className="ml-4">
                       <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                       {user.id === currentUser.id && (
                         <span className="text-xs text-green-500 font-medium">Você</span>
                       )}
                     </div>
                   </div>
                </td>
               
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full flex items-center w-fit gap-1
                    ${user.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                    {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 dark:text-gray-500">
                   ••••••
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenForm(user)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="Apagar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};