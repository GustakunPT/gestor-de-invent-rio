import React from 'react';
import { Edit2, Trash2, AlertTriangle, MapPin } from 'lucide-react';
import { Product } from '../types';

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  userRole: string; // Nova prop obrigatória
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ products, onEdit, onDelete, userRole }) => {
  if (products.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 dark:text-gray-400">
        Nenhum produto encontrado. Adicione um novo produto para começar.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Produto / SKU
            </th>
            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
              Localização
            </th>
             <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
              Categoria
            </th>
            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Stock
            </th>
            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Custo / Venda
            </th>
            {/* Esconde cabeçalho de Ações se não for ADMIN */}
            {userRole === 'ADMIN' && (
              <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {products.map((product) => {
             const isLowStock = product.quantity <= product.minStock;
             return (
              <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isLowStock ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                <td className="px-3 py-3 sm:px-6 sm:py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{product.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">SKU: {product.sku || '-'}</span>
                  </div>
                </td>
                <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                   <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                     <MapPin className="w-3 h-3 mr-1" />
                     {product.location || 'N/A'}
                   </div>
                </td>
                <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap hidden md:table-cell">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    {product.category}
                  </span>
                </td>
                <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`text-sm font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {product.quantity}
                    </div>
                    {isLowStock && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 flex items-center">
                        <AlertTriangle className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">Min: {product.minStock}</div>
                </td>
                <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(product.price)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                      Custo: {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(product.costPrice || 0)}
                    </span>
                  </div>
                </td>
                {/* Esconde botões de ação se não for ADMIN */}
                {userRole === 'ADMIN' && (
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="Apagar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};