import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, AlertTriangle, MapPin, ChevronUp, ChevronDown, Filter, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Product, Supplier } from '../types';

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  userRole: string;
  categories?: string[];
  suppliers?: Supplier[];
}

type SortField = 'name' | 'quantity' | 'price' | 'category';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const InventoryTable: React.FC<InventoryTableProps> = ({ products, onEdit, onDelete, userRole, categories = [], suppliers = [] }) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'ok' | 'zero'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<{ min: string, max: string }>({ min: '', max: '' });

  const [showFilters, setShowFilters] = useState(false);

  // Sort states
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Derive unique categories from products if not provided
  const allCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    return Array.from(new Set(products.map(p => p.category))).sort();
  }, [products, categories]);

  // Derive unique locations
  const allLocations = useMemo(() => {
    return Array.from(new Set(products.map(p => p.location).filter(Boolean))).sort();
  }, [products]);

  // Filter and sort logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.barcode?.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter !== 'all') {
      result = result.filter(p => {
        if (stockFilter === 'zero') return p.quantity === 0;
        if (stockFilter === 'low') return p.quantity > 0 && p.quantity <= p.minStock;
        if (stockFilter === 'ok') return p.quantity > p.minStock;
        return true;
      });
    }

    // Supplier filter
    if (supplierFilter !== 'all') {
      result = result.filter(p => p.supplierId === supplierFilter);
    }

    // Location filter
    if (locationFilter !== 'all') {
      result = result.filter(p => p.location === locationFilter);
    }

    // Price Range filter
    if (priceRange.min !== '') {
      result = result.filter(p => p.price >= Number(priceRange.min));
    }
    if (priceRange.max !== '') {
      result = result.filter(p => p.price <= Number(priceRange.max));
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'quantity':
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'category':
          aVal = a.category.toLowerCase();
          bVal = b.category.toLowerCase();
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, searchTerm, categoryFilter, stockFilter, supplierFilter, locationFilter, priceRange, sortField, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredAndSortedProducts.length);
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStockFilter('all');
    setSupplierFilter('all');
    setLocationFilter('all');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || categoryFilter !== 'all' || stockFilter !== 'all' || supplierFilter !== 'all' || locationFilter !== 'all' || priceRange.min !== '' || priceRange.max !== '';

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-blue-500" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-500" />
    );
  };

  if (products.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 dark:text-gray-400">
        Nenhum produto encontrado. Adicione um novo produto para começar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        {/* Search and Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, SKU ou código de barras..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); handleFilterChange(); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters || hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
              : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                {[searchTerm, categoryFilter !== 'all', stockFilter !== 'all', supplierFilter !== 'all', locationFilter !== 'all', priceRange.min !== '', priceRange.max !== ''].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-2 animate-slideDown">
            {/* Category Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Categoria</label>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); handleFilterChange(); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as Categorias</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Estado Stock</label>
              <select
                value={stockFilter}
                onChange={(e) => { setStockFilter(e.target.value as any); handleFilterChange(); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="ok">✅ Stock OK</option>
                <option value="low">⚠️ Stock Baixo</option>
                <option value="zero">❌ Sem Stock</option>
              </select>
            </div>

            {/* Supplier Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fornecedor</label>
              <select
                value={supplierFilter}
                onChange={(e) => { setSupplierFilter(e.target.value); handleFilterChange(); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os Fornecedores</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Localização</label>
              <select
                value={locationFilter}
                onChange={(e) => { setLocationFilter(e.target.value); handleFilterChange(); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                {allLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="w-full sm:w-auto flex gap-2">
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Preço Min</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => { setPriceRange(prev => ({ ...prev, min: e.target.value })); handleFilterChange(); }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Preço Max</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => { setPriceRange(prev => ({ ...prev, max: e.target.value })); handleFilterChange(); }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results summary */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            A mostrar <strong>{startIndex + 1}-{endIndex}</strong> de <strong>{filteredAndSortedProducts.length}</strong> produtos
            {hasActiveFilters && ` (${products.length} total)`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                scope="col"
                className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Produto / SKU
                  <SortIcon field="name" />
                </div>
              </th>
              <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                Localização
              </th>
              <th
                scope="col"
                className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  Categoria
                  <SortIcon field="category" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center gap-1">
                  Stock
                  <SortIcon field="quantity" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center gap-1">
                  Custo / Venda
                  <SortIcon field="price" />
                </div>
              </th>
              {userRole === 'ADMIN' && (
                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  Nenhum produto corresponde aos filtros selecionados.
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => {
                const isLowStock = product.quantity <= product.minStock;
                const isZeroStock = product.quantity === 0;
                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isZeroStock ? 'bg-red-50 dark:bg-red-900/20' : isLowStock ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                      }`}
                  >
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
                        <div className={`text-sm font-bold ${isZeroStock ? 'text-red-600 dark:text-red-400' : isLowStock ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
                          {product.quantity}
                        </div>
                        {isZeroStock && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 flex items-center">
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                        {!isZeroStock && isLowStock && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 flex items-center">
                            ⚠️
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Mostrar</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              {ITEMS_PER_PAGE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>por página</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Primeira página"
            >
              <ChevronLeft className="w-4 h-4" />
              <ChevronLeft className="w-4 h-4 -ml-2" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Próxima página"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Última página"
            >
              <ChevronRight className="w-4 h-4" />
              <ChevronRight className="w-4 h-4 -ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};