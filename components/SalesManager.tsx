import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Plus, Trash2, FileText, Check, AlertCircle, AlertTriangle, Search, X } from 'lucide-react';
import { Product, Sale, SaleItem, AppSettings, Customer } from '../types';
import { InvoiceModal } from './InvoiceModal';

interface SalesManagerProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  onNewSale: (sale: Sale) => void;
  settings: AppSettings;
}

export const SalesManager: React.FC<SalesManagerProps> = ({ products, sales, customers, onNewSale, settings }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // New Sale State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<SaleItem[]>([]);
  
  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerNif, setCustomerNif] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPostalCode, setCustomerPostalCode] = useState('');
  
  // Invoice State
  const [viewInvoice, setViewInvoice] = useState<Sale | null>(null);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Auto-fill customer data when selected from dropdown
  useEffect(() => {
    if (selectedCustomerId) {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (customer) {
            setCustomerName(customer.name);
            setCustomerNif(customer.nif);
            setCustomerEmail(customer.email);
            setCustomerPhone(customer.phone);
            setCustomerAddress(customer.address);
            setCustomerPostalCode(customer.postalCode);
        }
    } else {
        // Only clear if user explicitly clears selection, but maybe they want to type manually?
        // Let's decide: if they clear selection, we clear fields to avoid confusion.
        // But we won't clear if they are just typing.
    }
  }, [selectedCustomerId, customers]);

  const handleClearCustomer = () => {
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerNif('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerPostalCode('');
  };

  // NIF Validation Logic
  const isValidNif = (nif: string) => {
    if (!nif) return true; // Empty is valid (will be handled as consumer final if name empty, or just no nif)
    const nifRegex = /^[0-9]{9}$/;
    return nifRegex.test(nif);
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    
    // Check stock
    const currentInCart = cart.find(item => item.productId === selectedProduct.id)?.quantity || 0;
    if (selectedProduct.quantity < currentInCart + quantity) {
      alert('Stock insuficiente!');
      return;
    }

    const existingItem = cart.find(item => item.productId === selectedProductId);
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === selectedProductId 
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: quantity,
        unitPrice: selectedProduct.price,
        total: quantity * selectedProduct.price
      }]);
    }
    setQuantity(1);
    setSelectedProductId('');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      alert('Adicione itens ao carrinho antes de finalizar.');
      return;
    }

    let finalName = customerName.trim();
    let finalNif = customerNif.trim();

    // Validate NIF before proceeding
    if (finalNif && !isValidNif(finalNif)) {
      alert('O NIF inserido é inválido. Deve conter 9 dígitos numéricos.');
      return;
    }

    // Check if customer data is empty
    if (!finalName) {
      const confirmDefault = window.confirm(
        'Os dados do cliente (Nome) não foram preenchidos.\n\nDeseja emitir a fatura como "Consumidor Final"?'
      );

      if (confirmDefault) {
        finalName = 'Consumidor Final';
        if (!finalNif) finalNif = '000000000';
      } else {
        return; // User cancelled to fill in data
      }
    }

    const totalAmount = cart.reduce((acc, item) => acc + item.total, 0);
    const newSale: Sale = {
      id: `INV-${Date.now()}`,
      customerName: finalName,
      customerNif: finalNif,
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      customerPostalCode: customerPostalCode.trim(),
      date: new Date().toLocaleString('pt-PT'),
      items: [...cart],
      totalAmount,
      userId: '' // Populated in App.tsx
    };

    onNewSale(newSale);
    
    // Reset Form
    setCart([]);
    handleClearCustomer();
    
    setViewInvoice(newSale); // Show invoice immediately
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl px-4 pt-4">
        <button
          onClick={() => setActiveTab('new')}
          className={`pb-3 md:pb-4 px-2 md:px-4 font-medium text-xs md:text-sm transition-colors relative ${
            activeTab === 'new' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Nova Venda
          {activeTab === 'new' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 md:pb-4 px-2 md:px-4 font-medium text-xs md:text-sm transition-colors relative ${
            activeTab === 'history' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Histórico de Vendas
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>}
        </button>
      </div>

      {activeTab === 'new' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection & Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <User className="w-5 h-5 mr-2 text-gray-500" />
                    Dados do Cliente
                  </h3>
                  {selectedCustomerId && (
                      <button 
                        onClick={handleClearCustomer}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center"
                      >
                          <X className="w-3 h-3 mr-1" /> Limpar seleção
                      </button>
                  )}
              </div>
              
              {/* Customer Selector */}
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Pesquisar Cliente Existente
                  </label>
                  <select
                    className="w-full border border-blue-300 dark:border-blue-700 dark:bg-gray-800 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                      <option value="">-- Selecione ou preencha manualmente --</option>
                      {customers.map(c => (
                          <option key={c.id} value={c.id}>
                              {c.name} {c.nif ? `(NIF: ${c.nif})` : ''}
                          </option>
                      ))}
                  </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-300 dark:placeholder-gray-500"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Deixe vazio para Consumidor Final"
                    disabled={!!selectedCustomerId} // Disable editing if selected from DB to ensure consistency, or allow? Let's disable for now for "Source of Truth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NIF</label>
                  <input
                    type="text"
                    maxLength={9}
                    className={`w-full border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-300 dark:placeholder-gray-500 dark:bg-gray-700 dark:text-white
                      ${customerNif && !isValidNif(customerNif) ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    value={customerNif}
                    onChange={(e) => setCustomerNif(e.target.value.replace(/\D/g, ''))} // Allow only numbers
                    placeholder="000000000"
                    disabled={!!selectedCustomerId}
                  />
                  {customerNif && !isValidNif(customerNif) && (
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      O NIF deve ter 9 dígitos.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={!!selectedCustomerId}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    disabled={!!selectedCustomerId}
                  />
                </div>
                <div className="md:col-span-1">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Morada</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    disabled={!!selectedCustomerId}
                  />
                </div>
                <div className="md:col-span-1">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código Postal</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-300 dark:placeholder-gray-500"
                    value={customerPostalCode}
                    onChange={(e) => setCustomerPostalCode(e.target.value)}
                    placeholder="0000-000"
                    disabled={!!selectedCustomerId}
                  />
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Se o nome não for preenchido, será assumido "Consumidor Final" (NIF: 000000000).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-gray-500" />
                Adicionar Produtos
              </h3>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produto</label>
                  <select
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Selecione um produto...</option>
                    {products.filter(p => p.quantity > 0).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.price}€ (Stock: {p.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qtd</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <button
                  onClick={addToCart}
                  disabled={!selectedProductId}
                  className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resumo do Pedido</h3>
              
              <div className="flex-1 overflow-y-auto min-h-[200px] mb-4">
                {cart.length === 0 ? (
                  <p className="text-gray-400 dark:text-gray-500 text-center mt-10">O carrinho está vazio.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {cart.map((item, idx) => (
                      <li key={idx} className="py-3 flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.quantity} x {item.unitPrice}€</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 dark:text-white">{item.total}€</span>
                          <button 
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{cartTotal}€</span>
                </div>
                <button
                  onClick={handleFinalizeSale}
                  disabled={cart.length === 0 || (customerNif !== '' && !isValidNif(customerNif))}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:dark:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                <th className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Data</th>
                <th className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Itens</th>
                <th className="px-3 py-3 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-3 py-3 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">#{sale.id.slice(-4)}</td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    <div className="truncate max-w-[100px] sm:max-w-none">{sale.customerName}</div>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{sale.date}</td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{sale.items.length} itens</td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: settings.currency }).format(sale.totalAmount)}
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setViewInvoice(sale)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-end gap-1 ml-auto"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Fatura</span>
                    </button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma venda registada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Modal */}
      {viewInvoice && (
        <InvoiceModal 
          isOpen={!!viewInvoice} 
          onClose={() => setViewInvoice(null)} 
          sale={viewInvoice} 
          settings={settings}
        />
      )}
    </div>
  );
};