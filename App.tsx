// Importa a biblioteca React e os hooks essenciais: useState (estado), useMemo (performance), useEffect (efeitos colaterais)
import React, { useState, useMemo, useEffect } from 'react';

// Importa ícones da biblioteca Lucide-React para usar na interface (ícones SVG leves)
import {
  Package, Plus, Search, LayoutDashboard, Database, TrendingUp,
  Download, History, ShoppingCart, Truck, Scan, Barcode,
  Settings as SettingsIcon, Sun, Moon, User as UserIcon,
  LogOut, Users, Filter, Loader, BarChart2, Gift, Bell
} from 'lucide-react';

// Importa as definições de Tipos (TypeScript) para garantir segurança nos dados
import {
  Product, ModalType, ProductFormData, HistoryEntry, Sale,
  Supplier, PurchaseOrder, AppSettings, User, Customer, Promotion
} from './types';

// Importa os componentes filhos que compõem a aplicação
import { InventoryTable } from './components/InventoryTable';
import { ProductModal } from './components/ProductModal';
import { DashboardCharts } from './components/DashboardCharts';
import { HistoryLog } from './components/HistoryLog';
import { SalesManager } from './components/SalesManager';
import { SupplierManager } from './components/SupplierManager';
import { PurchaseOrderManager } from './components/PurchaseOrderManager';
import { SettingsManager } from './components/SettingsManager';
import { UserManager } from './components/UserManager';
import { CustomerManager } from './components/CustomerManager';
import { SalesDashboard } from './components/SalesDashboard'; // Dashboard de Análise de Vendas
import { LoginScreen } from './components/LoginScreen';
import { ToastContainer } from './components/Toast';
import { AlertsPanel } from './components/AlertsPanel';
import { PromotionManager } from './components/PromotionManager';

// Importa hooks personalizados
import { useDebounce } from './hooks/useDebounce';
import { useToast } from './hooks/useToast';
import { useStockAlerts } from './hooks/useStockAlerts';

// Importa utilitários e serviços
import { generateId } from './validators';
import { createBackup, readBackupFile } from './utils/backupUtils';
import { exportProductsToPdf, exportSalesReport } from './utils/exportUtils';
import { api } from './api';
import { authService } from './authService';

// Define as configurações iniciais padrão da aplicação
const INITIAL_SETTINGS: AppSettings = {
  taxRate: 23, // Taxa de IVA padrão
  companyName: 'Empresa Demo, Lda', // Nome da empresa
  companyAddress: 'Rua da Inovação, 123, 1000-001 Lisboa', // Morada
  companyNif: '500123456', // NIF
  currency: 'EUR', // Moeda
  theme: 'light' // Tema claro por defeito
};

// Início do Componente Principal da Aplicação
const App: React.FC = () => {

  // --- ESTADO DOS DADOS (DATA STATE) ---
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // --- ESTADO DA INTERFACE (UI STATE) ---
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);
  const [currentProduct, setCurrentProduct] = useState<Product | undefined>(undefined);
  const [view, setView] = useState<'dashboard' | 'sales_stats' | 'list' | 'history' | 'sales' | 'customers' | 'suppliers' | 'purchases' | 'settings' | 'users' | 'promotions'>('dashboard');

  // --- ESTADO DOS FILTROS DO DASHBOARD ---
  const [dashCategoryFilter, setDashCategoryFilter] = useState<string>('all');
  const [dashSupplierFilter, setDashSupplierFilter] = useState<string>('all');

  // --- HOOKS PERSONALIZADOS ---
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const toast = useToast();
  const stockAlerts = useStockAlerts(products);
  const activeAlerts = useMemo(() =>
    stockAlerts.filter(a => !dismissedAlerts.includes(a.id)),
    [stockAlerts, dismissedAlerts]
  );

  // --- FUNÇÃO DE CARREGAMENTO DE DADOS ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getInitialData();
      setProducts(data.products || []);
      setUsers(data.users || []);
      setCustomers(data.customers || []);
      setSales(data.sales || []);
      setSuppliers(data.suppliers || []);
      setPurchaseOrders(data.purchaseOrders || []);
      setHistory(data.history || []);

      // Carrega settings da DB se existir (implementação futura)
      // setSettings(data.settings || INITIAL_SETTINGS); 

      setIsDataLoaded(true);
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error('Erro ao carregar dados', 'Não foi possível conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- AUTENTICAÇÃO E EFEITOS INICIAIS ---

  // 1. Verificar sessão existente e subscrever alterações (Login/Logout)
  useEffect(() => {
    const initAuth = async () => {
      // Verifica se já existe uma sessão válida (ex: refresh da página)
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        loadData(); // Carrega dados se já estiver logado
      }
    };
    initAuth();

    // Listener para eventos de Auth (login noutra aba, logout, token expire)
    const subscription = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        if (!isDataLoaded) loadData(); // Carrega dados ao entrar
      } else {
        // Se saiu, limpa dados sensíveis da memória (opcional, por segurança)
        setView('dashboard');
        setIsDataLoaded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Tema
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const toggleTheme = () => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  // --- AUTH HANDLERS ---

  // Handler chamado pelo LoginScreen quando o login é bem sucedido
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('dashboard');
    loadData();
  };

  const handleLogout = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setIsUserMenuOpen(false);
    setView('dashboard');
  };

  // --- LÓGICA DE DADOS COMPUTADOS (MEMO) ---
  const filteredProducts = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase();
    if (!term) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      product.id.toLowerCase().includes(term) ||
      (product.sku && product.sku.toLowerCase().includes(term)) ||
      (product.barcode && product.barcode.toLowerCase().includes(term))
    );
  }, [products, debouncedSearchTerm]);

  const dashboardFilteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = dashCategoryFilter === 'all' || p.category === dashCategoryFilter;
      const matchesSupplier = dashSupplierFilter === 'all' || p.supplierId === dashSupplierFilter;
      return matchesCategory && matchesSupplier;
    });
  }, [products, dashCategoryFilter, dashSupplierFilter]);

  const stats = useMemo(() => {
    const totalItems = dashboardFilteredProducts.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalValue = dashboardFilteredProducts.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const lowStockCount = dashboardFilteredProducts.filter(p => p.quantity <= p.minStock).length;
    return { totalItems, totalValue, lowStockCount };
  }, [dashboardFilteredProducts]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category))).sort();
  }, [products]);

  // --- NAVEGAÇÃO E PERMISSÕES ---
  const visibleTabs = useMemo(() => {
    if (!currentUser) return [];

    const commonTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'sales_stats', label: 'Análise Vendas', icon: BarChart2 },
      { id: 'sales', label: 'Nova Venda', icon: ShoppingCart },
      { id: 'customers', label: 'Clientes', icon: Users },
      { id: 'list', label: 'Produtos', icon: Database },
    ];

    const adminTabs = [
      { id: 'purchases', label: 'Compras', icon: Package },
      { id: 'suppliers', label: 'Fornecedores', icon: Truck },
      { id: 'promotions', label: 'Promoções', icon: Gift },
      { id: 'history', label: 'Histórico', icon: History },
      { id: 'users', label: 'Users', icon: UserIcon },
      { id: 'settings', label: 'Config', icon: SettingsIcon },
    ];

    if (currentUser.role === 'ADMIN') {
      return [...commonTabs, ...adminTabs];
    }
    return commonTabs;
  }, [currentUser]);

  // --- HISTORY LOG UTILS ---
  const addHistory = async (action: HistoryEntry['action'], productId: string, productName: string, details: string) => {
    const entry: HistoryEntry = {
      id: generateId('HIST'),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Sistema',
      productId,
      productName,
      action,
      timestamp: new Date().toLocaleString('pt-PT'),
      details
    };
    await api.saveHistoryEntry(entry);
    setHistory(prev => [entry, ...prev]);
  };

  // --- CRUD HANDLERS ---

  const handleOpenCreate = () => {
    setModalType(ModalType.CREATE);
    setCurrentProduct(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setModalType(ModalType.EDIT);
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem a certeza que deseja apagar este produto?')) {
      setIsLoading(true);
      const prod = products.find(p => p.id === id);
      await api.deleteProduct(id);
      if (prod) addHistory('APAGAR', id, prod.name, 'Produto eliminado');
      await loadData();
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (data: ProductFormData) => {
    setIsLoading(true);
    const timestamp = new Date().toLocaleString('pt-PT');
    const newProduct: Product = {
      id: modalType === ModalType.CREATE ? `PROD-${Date.now()}` : currentProduct!.id,
      ...data,
      updatedAt: timestamp
    };
    await api.saveProduct(newProduct);
    await addHistory(
      modalType === ModalType.CREATE ? 'CRIAR' : 'EDITAR',
      newProduct.id,
      newProduct.name,
      modalType === ModalType.CREATE ? 'Novo produto' : 'Produto atualizado'
    );
    await loadData();
    setIsModalOpen(false);
    setIsLoading(false);
  };

  const handleNewSale = async (newSale: Sale) => {
    setIsLoading(true);
    const saleWithUser = { ...newSale, userId: currentUser?.id || '' };
    const result = await api.saveSale(saleWithUser);

    if (!result.success) {
      toast.error('Erro ao guardar venda', 'Não foi possível salvar a venda na base de dados.');
      setIsLoading(false);
      return;
    }

    for (const item of newSale.items) {
      await addHistory('VENDA', item.productId, item.productName, `Venda #${newSale.id} (-${item.quantity})`);
    }

    toast.success('Venda registada', `Venda #${newSale.id} finalizada com sucesso.`);
    await loadData();
    setIsLoading(false);
  };

  // Handlers genéricos para outras entidades (simplificados para brevidade)
  const handleAddCustomer = async (c: Customer) => { setIsLoading(true); await api.saveCustomer(c); await addHistory('CLIENTE', c.id, c.name, 'Novo cliente'); await loadData(); setIsLoading(false); };
  const handleEditCustomer = async (c: Customer) => { setIsLoading(true); await api.saveCustomer(c); await addHistory('CLIENTE', c.id, c.name, 'Cliente atualizado'); await loadData(); setIsLoading(false); };
  const handleDeleteCustomer = async (id: string) => { if (confirm('Tem a certeza?')) { setIsLoading(true); await api.deleteCustomer(id); await addHistory('CLIENTE', id, 'Cliente', 'Cliente removido'); await loadData(); setIsLoading(false); } };

  const handleAddSupplier = async (s: Supplier) => { setIsLoading(true); await api.saveSupplier(s); await loadData(); setIsLoading(false); };
  const handleEditSupplier = async (s: Supplier) => { setIsLoading(true); await api.saveSupplier(s); await loadData(); setIsLoading(false); };
  const handleDeleteSupplier = async (id: string) => { if (confirm('Tem a certeza?')) { setIsLoading(true); await api.deleteSupplier(id); await loadData(); setIsLoading(false); } };

  const handleAddUser = async (u: User) => { setIsLoading(true); await api.saveUser(u); await loadData(); setIsLoading(false); };
  const handleEditUser = async (u: User) => { setIsLoading(true); await api.saveUser(u); if (currentUser && currentUser.id === u.id) setCurrentUser(u); await loadData(); setIsLoading(false); };
  const handleDeleteUser = async (id: string) => { if (confirm('Tem a certeza?')) { setIsLoading(true); await api.deleteUser(id); await loadData(); setIsLoading(false); } };

  const handleCreatePO = async (po: PurchaseOrder) => {
    setIsLoading(true);
    const result = await api.savePurchaseOrder(po);

    if (!result.success) {
      toast.error('Erro ao salvar Encomenda', `Erro: ${(result as any).error?.message || 'Erro desconhecido'}`);
      console.error(result);
      setIsLoading(false);
      return;
    }

    await addHistory('COMPRA', po.id, po.supplierName, 'Nova Encomenda');
    toast.success('Encomenda Criada', `A ordem ${po.id} foi registada.`);
    await loadData();
    setIsLoading(false);
  };

  const handleReceivePO = async (orderId: string) => {
    const order = purchaseOrders.find(po => po.id === orderId);
    if (!order || order.status === 'RECEBIDO') return;
    setIsLoading(true);
    await api.updatePurchaseOrderStatus(orderId, 'RECEBIDO');
    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const updatedProduct = { ...product, quantity: product.quantity + item.quantity, updatedAt: new Date().toLocaleString('pt-PT') };
        await api.saveProduct(updatedProduct);
        await addHistory('RECEBIMENTO', product.id, product.name, `Recebido de PO #${orderId} (+${item.quantity})`);
      }
    }
    await loadData();
    setIsLoading(false);
  };

  const handleImportHistory = (file: File) => { toast.info('Importação de histórico', 'Funcionalidade em desenvolvimento.'); };

  const handleAddPromotion = (p: Promotion) => {
    setPromotions(prev => [...prev, p]);
    toast.success('Promoção criada', p.name);
    addHistory('PROMOCAO', p.id, p.name, 'Promoção criada');
  };
  const handleEditPromotion = (p: Promotion) => {
    setPromotions(prev => prev.map(promo => promo.id === p.id ? p : promo));
    toast.success('Promoção atualizada', p.name);
  };
  const handleDeletePromotion = (id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
    toast.success('Promoção apagada', 'Sucesso');
  };

  const handleDismissAlert = (id: string) => setDismissedAlerts(prev => [...prev, id]);
  const handleDismissAllAlerts = () => setDismissedAlerts(stockAlerts.map(a => a.id));

  const handleExportInventory = () => { exportProductsToPdf(products, settings); toast.success('Exportação', 'Inventário PDF gerado.'); };
  const handleExportSales = () => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    exportSalesReport(sales, d, new Date(), settings);
    toast.success('Exportação', 'Vendas PDF gerado.');
  };
  const handleCreateBackup = () => { createBackup({ products, customers, suppliers, sales, purchaseOrders, users, settings, promotions }); toast.success('Backup', 'Ficheiro gerado.'); };

  // --- RENDERIZAÇÃO ---

  // Loading inicial
  if (isLoading && !isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">A carregar dados do sistema...</p>
        </div>
      </div>
    );
  }

  // Login
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // App Principal
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white hidden sm:block">ERP Inventário</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white sm:hidden">ERP</span>
              {isLoading && <Loader className="w-4 h-4 text-blue-500 animate-spin ml-2" />}
            </div>

            {/* Menu Topo */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative hidden md:block w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-full text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                {settings.theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 md:p-1.5 md:pr-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{currentUser.name}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center">
                      <LogOut className="w-4 h-4 mr-2" /> Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Navegação */}
          <div className="flex overflow-x-auto space-x-2 md:space-x-4 pb-0 scrollbar-hide">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`flex items-center px-2 py-2 md:px-3 md:py-3 border-b-2 text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${view === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-4 md:py-8">
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total em Stock</p>
                    <p className="text-2xl font-bold dark:text-white">{stats.totalValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
                  </div>
                  <TrendingUp className="text-green-500" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Alertas Stock</p>
                    <p className="text-2xl font-bold text-red-500">{stats.lowStockCount}</p>
                  </div>
                  <Barcode className="text-red-500" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total SKUs</p>
                    <p className="text-2xl font-bold dark:text-white">{stats.totalItems}</p>
                  </div>
                  <Package className="text-blue-500" />
                </div>
              </div>
            </div>

            <DashboardCharts products={dashboardFilteredProducts} />

            {activeAlerts.length > 0 && (
              <div className="mt-6">
                <AlertsPanel alerts={activeAlerts} onDismiss={handleDismissAlert} onDismissAll={handleDismissAllAlerts} />
              </div>
            )}

            <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Ações Rápidas</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleExportInventory} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-4 h-4 mr-2" /> Exportar Inventário
                </button>
                <button onClick={handleExportSales} className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="w-4 h-4 mr-2" /> Exportar Vendas
                </button>
                {currentUser.role === 'ADMIN' && (
                  <button onClick={handleCreateBackup} className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                    <Database className="w-4 h-4 mr-2" /> Backup
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {view === 'sales_stats' && <SalesDashboard sales={sales} users={users} products={products} currency={settings.currency} />}
        {view === 'list' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between">
              <h2 className="font-bold text-lg dark:text-white">Produtos</h2>
              {currentUser.role === 'ADMIN' && <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"><Plus className="inline w-4 h-4 mr-1" />Novo</button>}
            </div>
            <InventoryTable products={filteredProducts} onEdit={handleOpenEdit} onDelete={handleDelete} userRole={currentUser.role} />
          </div>
        )}
        {view === 'sales' && <SalesManager products={products} sales={sales} customers={customers} onNewSale={handleNewSale} settings={settings} />}
        {view === 'customers' && <CustomerManager customers={customers} onAddCustomer={handleAddCustomer} onEditCustomer={handleEditCustomer} onDeleteCustomer={handleDeleteCustomer} userRole={currentUser.role} />}
        {view === 'purchases' && currentUser.role === 'ADMIN' && <PurchaseOrderManager products={products} suppliers={suppliers} purchaseOrders={purchaseOrders} onCreateOrder={handleCreatePO} onReceiveOrder={handleReceivePO} />}
        {view === 'suppliers' && currentUser.role === 'ADMIN' && <SupplierManager suppliers={suppliers} onAddSupplier={handleAddSupplier} onEditSupplier={handleEditSupplier} onDeleteSupplier={handleDeleteSupplier} />}
        {view === 'users' && currentUser.role === 'ADMIN' && <UserManager users={users} currentUser={currentUser} onAddUser={handleAddUser} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} />}
        {view === 'history' && currentUser.role === 'ADMIN' && <HistoryLog history={history} onImport={handleImportHistory} />}
        {view === 'settings' && currentUser.role === 'ADMIN' && <SettingsManager settings={settings} onSave={setSettings} />}
        {view === 'promotions' && currentUser.role === 'ADMIN' && <PromotionManager promotions={promotions} onAdd={handleAddPromotion} onEdit={handleEditPromotion} onDelete={handleDeletePromotion} />}
      </main>

      {isModalOpen && <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProduct} initialData={currentProduct} type={modalType} suppliers={suppliers} />}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </div>
  );
};

export default App;