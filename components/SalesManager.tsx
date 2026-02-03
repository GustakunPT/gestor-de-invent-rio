// ============================================
// COMPONENTE: GESTOR DE VENDAS (POS)
// ============================================

import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Plus, Trash2, FileText, Check, AlertCircle, AlertTriangle, Search, X, CreditCard, RotateCcw, ScanLine } from 'lucide-react';
import { Product, Sale, SaleItem, AppSettings, Customer, PaymentMethod, Promotion } from '../types';
import { InvoiceModal } from './InvoiceModal';
import { isValidNIF, isValidEmail } from '../validators';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'; // Novo Hook

// Definição das props recebidas pelo componente
interface SalesManagerProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  promotions?: Promotion[];
  onNewSale: (sale: Sale) => void;
  settings: AppSettings;
}

export const SalesManager: React.FC<SalesManagerProps> = ({
  products,
  sales,
  customers,
  promotions = [],
  onNewSale,
  settings
}) => {
  // ============================================
  // GESTÃO DE ESTADO (STATE MANAGEMENT)
  // ============================================

  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // --- NOVA VENDA ---
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<SaleItem[]>([]);

  // --- PAGAMENTO ---
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);

  // --- CLIENTE ---
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerNif, setCustomerNif] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPostalCode, setCustomerPostalCode] = useState('');

  // --- UI AUXILIAR ---
  const [viewInvoice, setViewInvoice] = useState<Sale | null>(null);

  // --- DEVOLUÇÕES (RMA) ---
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [saleToReturn, setSaleToReturn] = useState<Sale | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // ============================================
  // BARCODE SCANNER (INTEGRAÇÃO)
  // ============================================

  // Função auxiliar para adicionar produto (usada pelo botão e pelo scanner)
  const addProductToCart = (product: Product, qty: number = 1) => {
    // 1. Verificar stock considerando o que já está no carrinho
    const currentInCart = cart.find(item => item.productId === product.id)?.quantity || 0;

    if (product.quantity < currentInCart + qty) {
      alert(`Stock insuficiente para ${product.name}! Stock atual: ${product.quantity}`);
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      setCart(prev => prev.map(item =>
        item.productId === product.id
          ? {
            ...item,
            quantity: item.quantity + qty,
            total: (item.quantity + qty) * item.unitPrice
          }
          : item
      ));
    } else {
      setCart(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
        costPrice: product.costPrice,
        total: qty * product.price
      }]);
    }

    // Feedback sonoro (opcional, requer setup de Audio) ou visual
    // const audio = new Audio('/beep.mp3'); audio.play().catch(() => {});
  };

  // Hook que ouve eventos globais de teclado (leitor USB)
  useBarcodeScanner((code) => {
    // Procura por SKU ou Barcode (EAN)
    // Usamos toLowerCase para garantir robustez
    const product = products.find(p =>
      (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase() === code.toLowerCase())
    );

    if (product) {
      addProductToCart(product, 1);
      // Feedback visual (Toast) seria bom aqui, mas por agora o item aparece no carrinho
    } else {
      // Se não encontrar produto, ignora silenciosamente ou avisa?
      // Num POS rápido, talvez um som de erro.
      console.warn(`Código ${code} não encontrado.`);
    }
  });

  // Wrapper para o botão "Adicionar" manual
  const handleManualAdd = () => {
    if (selectedProduct) {
      addProductToCart(selectedProduct, quantity);
      setQuantity(1);
      setSelectedProductId('');
    }
  };

  // ============================================
  // LÓGICA DE NEGÓCIO
  // ============================================

  // Auto-fill cliente
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

  const isValidNif = (nif: string) => {
    if (!nif) return true;
    return isValidNIF(nif).isValid;
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    let finalName = customerName.trim();
    let finalNif = customerNif.trim();

    if (finalNif && !isValidNif(finalNif)) {
      alert('NIF inválido.');
      return;
    }

    if (!finalName) {
      if (!window.confirm('Emitir como "Consumidor Final"?')) return;
      finalName = 'Consumidor Final';
      if (!finalNif) finalNif = '999999990';
    }

    const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
    const finalDiscount = Math.min(discountAmount, subtotal);
    const totalAmount = subtotal - finalDiscount;

    const profit = cart.reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      const costPrice = product?.costPrice || 0;
      return acc + ((item.unitPrice - costPrice) * item.quantity);
    }, 0) - finalDiscount;

    const newSale: Sale = {
      id: `INV-${Date.now()}`,
      customerName: finalName,
      customerNif: finalNif,
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      customerPostalCode: customerPostalCode.trim(),
      date: new Date().toISOString(),
      items: [...cart],
      totalAmount,
      subtotal,
      paymentMethod,
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      discountAmount: finalDiscount,
      discountReason,
      profit,
      userId: '' // Preenchido no App.tsx
    };

    onNewSale(newSale);

    // Reset
    setCart([]);
    handleClearCustomer();
    setPaymentMethod('CASH');
    setDiscountAmount(0);
    setViewInvoice(newSale);
  };

  // ============================================
  // DEVOLUÇÕES (RMA)
  // ============================================

  const handleOpenReturn = (sale: Sale) => {
    setSaleToReturn(sale);
    // Inicializa quantidades com 0
    const initialQts: Record<string, number> = {};
    sale.items.forEach(item => {
      initialQts[item.productId] = 0;
    });
    setReturnQuantities(initialQts);
    setReturnModalOpen(true);
  };

  const handleProcessReturn = () => {
    if (!saleToReturn) return;

    // Filtrar itens com quantidade > 0 para devolver
    const itemsToReturn = saleToReturn.items.filter(item => (returnQuantities[item.productId] || 0) > 0);

    if (itemsToReturn.length === 0) {
      alert("Selecione pelo menos um item para devolver.");
      return;
    }

    const returnItems: SaleItem[] = itemsToReturn.map(item => ({
      ...item,
      quantity: - (returnQuantities[item.productId] || 0), // Quantidade negativa aumenta stock
      total: - ((returnQuantities[item.productId] || 0) * item.unitPrice)
    }));

    const totalRefund = returnItems.reduce((acc, item) => acc + item.total, 0); // Será negativo

    const returnSale: Sale = {
      ...saleToReturn,
      id: `RET-${Date.now()}`,
      date: new Date().toISOString(),
      status: 'SHIPPED', // Usar status existente, idealmente seria 'RETURNED'
      items: returnItems,
      totalAmount: totalRefund, // Valor negativo afeta as contas corretamente? Sim.
      subtotal: totalRefund,
      notes: `Devolução referente à fatura #${saleToReturn.id}`,
      profit: 0 // Devolução anula lucro (simplificação)
    };

    onNewSale(returnSale);
    setReturnModalOpen(false);
    setSaleToReturn(null);
    alert("Devolução processada e stock atualizado.");
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl px-4 pt-4">
        <button onClick={() => setActiveTab('new')} className={`pb-3 px-4 ${activeTab === 'new' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}>Nova Venda</button>
        <button onClick={() => setActiveTab('history')} className={`pb-3 px-4 ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}>Histórico</button>
      </div>

      {activeTab === 'new' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between mb-4">
                <h3 className="font-medium flex items-center text-gray-900 dark:text-white"><User className="w-5 h-5 mr-2" /> Cliente</h3>
                {selectedCustomerId && <button onClick={handleClearCustomer} className="text-red-500 text-xs flex items-center"><X className="w-3 h-3 mr-1" /> Limpar</button>}
              </div>

              <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center">
                <Search className="w-4 h-4 text-blue-500 mr-2" />
                <select
                  className="w-full bg-transparent border-none focus:ring-0 text-sm"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">Pesquisar cliente existente...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.nif})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Nome (Vazio = Consumidor Final)" className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={customerName} onChange={e => setCustomerName(e.target.value)} disabled={!!selectedCustomerId} />
                <input placeholder="NIF" maxLength={9} className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={customerNif} onChange={e => setCustomerNif(e.target.value.replace(/\D/g, ''))} disabled={!!selectedCustomerId} />
              </div>
            </div>

            {/* Produtos */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between mb-4">
                <h3 className="font-medium flex items-center text-gray-900 dark:text-white">
                  <ShoppingCart className="w-5 h-5 mr-2" /> Adicionar Produtos
                </h3>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  <ScanLine className="w-3 h-3 mr-1" /> Leitor código barras pronto
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-xs mb-1 block text-gray-500">Produto</label>
                  <select className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {products.filter(p => p.quantity > 0).map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.price}€</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-xs mb-1 block text-gray-500">Qtd</label>
                  <input type="number" min="1" className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} />
                </div>
                <button onClick={handleManualAdd} disabled={!selectedProductId} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"><Plus /></button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border h-full flex flex-col">
            <h3 className="font-medium mb-4 text-gray-900 dark:text-white">Carrinho</h3>
            <div className="flex-1 overflow-y-auto min-h-[200px]">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                    <div className="text-xs text-gray-500">{item.quantity} x {item.unitPrice}€</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold dark:text-white">{item.total.toFixed(2)}€</span>
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <div className="text-center text-gray-400 mt-10">Vazio</div>}
            </div>
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="flex justify-between text-xl font-bold mb-4 dark:text-white"><span>Total</span><span>{cartTotal.toFixed(2)}€</span></div>
              <button onClick={handleFinalizeSale} disabled={cart.length === 0} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">Finalizar Venda</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {sales.map(sale => (
                <tr key={sale.id} className={sale.totalAmount < 0 ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">#{sale.id.slice(-4)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-200">{sale.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.date).toLocaleDateString()}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${sale.totalAmount < 0 ? 'text-red-600' : 'dark:text-white'}`}>
                    {sale.totalAmount.toFixed(2)}€
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                    <button onClick={() => setViewInvoice(sale)} className="text-blue-600 hover:text-blue-900 flex items-center pr-2 border-r"><FileText className="w-4 h-4 mr-1" /> Fatura</button>
                    {sale.totalAmount > 0 && (
                      <button onClick={() => handleOpenReturn(sale)} className="text-orange-600 hover:text-orange-900 flex items-center"><RotateCcw className="w-4 h-4 mr-1" /> Devolver</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Fatura */}
      {viewInvoice && <InvoiceModal isOpen={!!viewInvoice} onClose={() => setViewInvoice(null)} sale={viewInvoice} settings={settings} />}

      {/* Modal Devolução */}
      {returnModalOpen && saleToReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Processar Devolução (#{saleToReturn.id.slice(-4)})</h3>
            <p className="text-sm text-gray-500 mb-4">Indique a quantidade a devolver de cada item.</p>

            <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
              {saleToReturn.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border rounded dark:border-gray-700">
                  <div className="flex-1">
                    <div className="font-medium dark:text-white">{item.productName}</div>
                    <div className="text-xs text-gray-500">Comprou: {item.quantity} un.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs dark:text-gray-400">Devolver:</label>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      className="w-16 border rounded p-1 dark:bg-gray-700 dark:text-white"
                      value={returnQuantities[item.productId] || 0}
                      onChange={(e) => {
                        const val = Math.min(parseInt(e.target.value) || 0, item.quantity);
                        setReturnQuantities(prev => ({ ...prev, [item.productId]: val }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setReturnModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700">Cancelar</button>
              <button onClick={handleProcessReturn} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Confirmar Devolução</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};