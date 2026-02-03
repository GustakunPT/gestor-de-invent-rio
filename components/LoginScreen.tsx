import React, { useState } from 'react';
import { Package, Lock, User } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginScreenProps {
  users: UserType[];
  onLogin: (user: UserType) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [idInput, setIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.id === idInput);

    if (!user) {
      setError('ID de utilizador não encontrado.');
      return;
    }

    if (user.password !== passwordInput) {
      setError('Password incorreta.');
      return;
    }

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                <Package className="w-10 h-10 text-white" />
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          ERP Inventário
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Inicie sessão para aceder ao sistema
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="userid" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                ID de Utilizador (Numérico)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="userid"
                  name="userid"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value.replace(/\D/g, ''))}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 border"
                  placeholder="Ex: 1001"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Erro de autenticação</h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                <p>{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Entrar
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Demo
                </span>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              <p>Admin: ID 1001 / Pass: 1234</p>
              <p>Staff: ID 1002 / Pass: 1234</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};