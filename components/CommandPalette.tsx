import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Package, Users, ShoppingCart, X, Command, ArrowRight, Loader } from 'lucide-react';
import { Product, Customer, Sale } from '../types';

interface CommandPaletteProps {
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    onNavigate: (view: string, item?: any) => void;
    onSelectProduct?: (product: Product) => void;
}

interface SearchResult {
    id: string;
    type: 'product' | 'customer' | 'sale';
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    data: any;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    products,
    customers,
    sales,
    onNavigate,
    onSelectProduct
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcut to open (Cmd+K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setQuery('');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search results
    const results = useMemo((): SearchResult[] => {
        if (!query.trim()) return [];

        const term = query.toLowerCase();
        const maxPerCategory = 5;
        const allResults: SearchResult[] = [];

        // Search products
        const matchedProducts = products
            .filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.sku?.toLowerCase().includes(term) ||
                p.barcode?.toLowerCase().includes(term) ||
                p.category.toLowerCase().includes(term)
            )
            .slice(0, maxPerCategory)
            .map(p => ({
                id: `product-${p.id}`,
                type: 'product' as const,
                title: p.name,
                subtitle: `SKU: ${p.sku || '-'} • Stock: ${p.quantity} • ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(p.price)}`,
                icon: <Package className="w-4 h-4 text-blue-500" />,
                data: p
            }));

        // Search customers
        const matchedCustomers = customers
            .filter(c =>
                c.name.toLowerCase().includes(term) ||
                c.email?.toLowerCase().includes(term) ||
                c.nif?.includes(term) ||
                c.phone?.includes(term)
            )
            .slice(0, maxPerCategory)
            .map(c => ({
                id: `customer-${c.id}`,
                type: 'customer' as const,
                title: c.name,
                subtitle: `NIF: ${c.nif || '-'} • ${c.email || '-'}`,
                icon: <Users className="w-4 h-4 text-green-500" />,
                data: c
            }));

        // Search sales
        const matchedSales = sales
            .filter(s =>
                s.id.toLowerCase().includes(term) ||
                s.customerName?.toLowerCase().includes(term) ||
                s.customerNif?.includes(term)
            )
            .slice(0, maxPerCategory)
            .map(s => ({
                id: `sale-${s.id}`,
                type: 'sale' as const,
                title: `Venda #${s.id}`,
                subtitle: `${s.customerName || 'Cliente anónimo'} • ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(s.totalAmount)}`,
                icon: <ShoppingCart className="w-4 h-4 text-purple-500" />,
                data: s
            }));

        allResults.push(...matchedProducts, ...matchedCustomers, ...matchedSales);
        return allResults;
    }, [query, products, customers, sales]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
        }
    };

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex]);

    const handleSelect = (result: SearchResult) => {
        setIsOpen(false);
        setQuery('');

        switch (result.type) {
            case 'product':
                if (onSelectProduct) {
                    onSelectProduct(result.data);
                } else {
                    onNavigate('list');
                }
                break;
            case 'customer':
                onNavigate('customers');
                break;
            case 'sale':
                onNavigate('sales_stats');
                break;
        }
    };

    const close = () => {
        setIsOpen(false);
        setQuery('');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Pesquisa global (Ctrl+K)"
            >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Pesquisar...</span>
                <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 font-mono">
                    <span className="text-xs">Ctrl</span> K
                </kbd>
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
                onClick={close}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-[15%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl z-50 animate-slideDown">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Search input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pesquisar produtos, clientes, vendas..."
                            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-sm"
                        />
                        <button
                            onClick={close}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Results */}
                    <div ref={listRef} className="max-h-80 overflow-y-auto">
                        {query && results.length === 0 && (
                            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Nenhum resultado encontrado para "{query}"</p>
                            </div>
                        )}

                        {!query && (
                            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                <p className="text-sm">Comece a escrever para pesquisar...</p>
                                <div className="flex justify-center gap-4 mt-4 text-xs">
                                    <span className="flex items-center gap-1"><Package className="w-3 h-3" /> Produtos</span>
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Clientes</span>
                                    <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Vendas</span>
                                </div>
                            </div>
                        )}

                        {results.map((result, index) => (
                            <button
                                key={result.id}
                                onClick={() => handleSelect(result)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${index === selectedIndex
                                    ? 'bg-blue-50 dark:bg-blue-900/30'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                                    {result.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {result.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {result.subtitle}
                                    </p>
                                </div>
                                {index === selectedIndex && (
                                    <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">↑</kbd>
                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">↓</kbd>
                                navegar
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Enter</kbd>
                                selecionar
                            </span>
                        </div>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Esc</kbd>
                            fechar
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};
