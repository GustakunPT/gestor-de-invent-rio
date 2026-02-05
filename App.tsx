// Importa a biblioteca React e os hooks essenciais: useState (estado), useMemo (performance), useEffect (efeitos colaterais)
import React, { useState, useMemo, useEffect } from 'react';

// Importa ícones da biblioteca Lucide-React para usar na interface (ícones SVG leves)
import {
  Package, Plus, Search, LayoutDashboard, Database, TrendingUp,
  Download, History, ShoppingCart, Truck, Scan, Barcode,
  Settings as SettingsIcon, Sun, Moon, User as UserIcon,
  LogOut, Users, Filter, Loader, BarChart2, Gift, Bell, Building2
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
import { CommandPalette } from './components/CommandPalette';
import { Sidebar } from './components/Sidebar';
import { TenantManager } from './components/TenantManager';
import { OnboardingScreen } from './components/OnboardingScreen';
import { TenantProvider, useTenant } from './contexts/TenantContext';

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

  // Tenant context will be used after TenantProvider wraps the app
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);
  const [currentProduct, setCurrentProduct] = useState<Product | undefined>(undefined);
  const [view, setView] = useState<'dashboard' | 'sales_stats' | 'list' | 'history' | 'sales' | 'customers' | 'suppliers' | 'purchases' | 'settings' | 'users' | 'promotions' | 'tenants'>('dashboard');

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
  }, [isDataLoaded]);

  // Handle Onboarding Completion
  const handleOnboardingComplete = () => {
    // Force reload to ensure fresh auth state and data
    window.location.reload();
  };

  // (Auth Guards moved to render section to avoid Hook Violations)

  // Developer Dashboard (Create Tenant flow might be part of Tenants tab now)
  // We don't force OnboardingScreen anymore based on null tenant_id alone for Developers, 
  // as they might want to manage multiple.

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
      { id: 'users', label: 'Utilizadores', icon: Users },
      { id: 'settings', label: 'Config', icon: SettingsIcon },
    ];

    // Developer Tab
    if (currentUser.role === 'DEVELOPER') {
      return [...commonTabs, ...adminTabs, { id: 'tenants', label: 'Empresas', icon: Building2 }];
    }

    // Company Admin
    if (currentUser.role === 'ADMIN' || (currentUser as any).is_tenant_admin) {
      return [...commonTabs, ...adminTabs];
    }

    // Operator (Staff)
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
      const errorDetails = result.error?.message || result.error?.code || JSON.stringify(result.error) || 'Erro desconhecido';
      console.error('Erro ao guardar venda:', result.error);
      toast.error('Erro ao guardar venda', `Não foi possível salvar: ${errorDetails}`);
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

  const handleAddPromotion = async (p: Promotion) => {
    try {
      const result = await api.createPromotion(p);
      if (result.success && result.promotion) {
        setPromotions(prev => [...prev, result.promotion!]);
        toast.success('Promoção criada', p.name);
        await addHistory('PROMOCAO', result.promotion.id, p.name, 'Promoção criada');
      } else {
        toast.error('Erro ao criar promoção', 'Tente novamente.');
      }
    } catch (e) {
      toast.error('Erro ao criar promoção', 'Erro de conexão.');
    }
  };
  const handleEditPromotion = async (p: Promotion) => {
    try {
      const result = await api.updatePromotion(p.id, p);
      if (result.success && result.promotion) {
        setPromotions(prev => prev.map(promo => promo.id === p.id ? result.promotion! : promo));
        toast.success('Promoção atualizada', p.name);
      } else {
        toast.error('Erro ao atualizar', 'Tente novamente.');
      }
    } catch (e) {
      toast.error('Erro ao atualizar', 'Erro de conexão.');
    }
  };
  const handleDeletePromotion = async (id: string) => {
    try {
      const result = await api.deletePromotion(id);
      if (result.success) {
        setPromotions(prev => prev.filter(p => p.id !== id));
        toast.success('Promoção apagada', 'Sucesso');
      } else {
        toast.error('Erro ao apagar', 'Tente novamente.');
      }
    } catch (e) {
      toast.error('Erro ao apagar', 'Erro de conexão.');
    }
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

  // Access Control Check (Moved here to avoid Hook Violations)
  if (!currentUser.tenant_id && currentUser.role !== 'DEVELOPER') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Conta Pendente</h2>
          <p className="text-gray-500 mb-6">A sua conta não está associada a nenhuma empresa. Por favor, peça ao seu administrador para lhe enviar um convite.</p>
          <button
            onClick={() => authService.signOut().then(() => setCurrentUser(null))}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  // App Principal
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        currentView={view}
        onNavigate={(v) => setView(v as any)}
        visibleTabs={visibleTabs}
        companyName={settings.companyName}
        currentUser={currentUser}
        theme={settings.theme as 'light' | 'dark'}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {visibleTabs.find(t => t.id === view)?.label || 'Dashboard'}
            </h1>
            {isLoading && <Loader className="w-4 h-4 text-blue-500 animate-spin" />}
          </div>

          <div className="flex items-center gap-3">
            {/* Stats Quick View */}
            <div className="hidden lg:flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Valor Stock</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    {stats.totalValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-600"></div>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${stats.lowStockCount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                  <Bell className={`w-3.5 h-3.5 ${stats.lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Alertas</span>
                  <span className={`text-xs font-bold leading-tight ${stats.lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {stats.lowStockCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Command Palette */}
            <CommandPalette
              products={products}
              customers={customers}
              sales={sales}
              onNavigate={(v) => setView(v as any)}
              onSelectProduct={handleOpenEdit}
            />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {view === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 19 ? 'Boa tarde' : 'Boa noite'}, {currentUser?.name?.split(' ')[0] || 'Utilizador'}! 👋
                    </h1>
                    <p className="text-blue-100 mt-1">
                      {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[100px]">
                      <p className="text-2xl font-bold">{sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length}</p>
                      <p className="text-xs text-blue-100">Vendas Hoje</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[100px]">
                      <p className="text-2xl font-bold">
                        {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString())
                          .reduce((acc, s) => acc + s.totalAmount, 0)
                          .toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-blue-100">Receita Hoje</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Value */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor em Stock</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stats.totalValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="p-2.5 bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-sm">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Alertas Stock</p>
                      <p className={`text-2xl font-bold mt-1 ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {stats.lowStockCount}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{stats.lowStockCount === 0 ? 'Tudo OK!' : 'Produtos baixos'}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg shadow-sm ${stats.lowStockCount > 0 ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-green-400 to-green-600'}`}>
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Total Products */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Produtos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{products.length}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{stats.totalItems} unidades</p>
                    </div>
                    <div className="p-2.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-sm">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Profit Margin */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Margem Média</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {products.length > 0
                          ? ((1 - products.reduce((acc, p) => acc + (p.costPrice || 0), 0) / products.reduce((acc, p) => acc + p.price, 0)) * 100).toFixed(0)
                          : 0}%
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Lucro potencial</p>
                    </div>
                    <div className="p-2.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-sm">
                      <BarChart2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sales This Month */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                    Vendas Este Mês
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {sales.filter(s => {
                          const saleDate = new Date(s.date);
                          const now = new Date();
                          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
                        }).length}
                      </p>
                      <p className="text-xs text-gray-500">Total de Vendas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {sales.filter(s => {
                          const saleDate = new Date(s.date);
                          const now = new Date();
                          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
                        }).reduce((acc, s) => acc + s.totalAmount, 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-500">Receita Total</p>
                    </div>
                  </div>
                </div>

                {/* Pending Shipments */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                    Envios Pendentes
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-500">
                        {sales.filter(s => s.deliveryType === 'SHIPPING' && s.status === 'PENDING').length}
                      </p>
                      <p className="text-xs text-gray-500">A aguardar envio</p>
                    </div>
                    <Truck className="w-10 h-10 text-orange-200 dark:text-orange-800" />
                  </div>
                </div>

                {/* Active Promotions */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    Promoções Ativas
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-500">
                        {promotions.filter(p => p.isActive && new Date(p.endDate) >= new Date()).length}
                      </p>
                      <p className="text-xs text-gray-500">Cupões em vigor</p>
                    </div>
                    <Gift className="w-10 h-10 text-purple-200 dark:text-purple-800" />
                  </div>
                </div>
              </div>

              {/* Recent Sales */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                    Últimas Vendas
                  </span>
                  <button onClick={() => setView('sales_stats')} className="text-xs text-blue-600 hover:underline">Ver todas</button>
                </h4>
                {sales.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma venda registada</p>
                ) : (
                  <div className="space-y-2">
                    {sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{sale.customerName}</p>
                            <p className="text-xs text-gray-500">{new Date(sale.date).toLocaleDateString('pt-PT')}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {sale.totalAmount.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DashboardCharts products={dashboardFilteredProducts} />

              {activeAlerts.length > 0 && (
                <AlertsPanel alerts={activeAlerts} onDismiss={handleDismissAlert} onDismissAll={handleDismissAllAlerts} />
              )}

              {/* Quick Actions - Redesigned */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
                  Ações Rápidas
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <button
                    onClick={() => setView('sales')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                  >
                    <ShoppingCart className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-blue-600">Nova Venda</span>
                  </button>
                  <button
                    onClick={handleOpenCreate}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
                  >
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-green-600">Novo Produto</span>
                  </button>
                  <button
                    onClick={handleExportInventory}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                  >
                    <Download className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-purple-600">Exportar PDF</span>
                  </button>
                  <button
                    onClick={() => setView('customers')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
                  >
                    <Users className="w-6 h-6 text-gray-400 group-hover:text-orange-600 transition-colors" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-orange-600">Clientes</span>
                  </button>
                  {currentUser?.role === 'ADMIN' && (
                    <button
                      onClick={handleCreateBackup}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all group"
                    >
                      <Database className="w-6 h-6 text-gray-400 group-hover:text-teal-600 transition-colors" />
                      <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-teal-600">Backup</span>
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
              <InventoryTable
                products={filteredProducts}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                userRole={currentUser.role}
                categories={categories}
                suppliers={suppliers}
              />
            </div>
          )}
          {view === 'sales' && <SalesManager products={products} sales={sales} customers={customers} promotions={promotions} onNewSale={handleNewSale} settings={settings} />}
          {view === 'customers' && <CustomerManager customers={customers} onAddCustomer={handleAddCustomer} onEditCustomer={handleEditCustomer} onDeleteCustomer={handleDeleteCustomer} userRole={currentUser.role} />}
          {view === 'purchases' && (currentUser.role === 'ADMIN' || currentUser.role === 'DEVELOPER') && <PurchaseOrderManager products={products} suppliers={suppliers} purchaseOrders={purchaseOrders} onCreateOrder={handleCreatePO} onReceiveOrder={handleReceivePO} />}
          {view === 'suppliers' && (currentUser.role === 'ADMIN' || currentUser.role === 'DEVELOPER') && <SupplierManager suppliers={suppliers} onAddSupplier={handleAddSupplier} onEditSupplier={handleEditSupplier} onDeleteSupplier={handleDeleteSupplier} />}
          {view === 'users' && (currentUser.role === 'ADMIN' || currentUser.role === 'DEVELOPER') && <UserManager users={users} currentUser={currentUser} onAddUser={handleAddUser} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} />}
          {view === 'history' && (currentUser.role === 'ADMIN' || currentUser.role === 'DEVELOPER') && <HistoryLog history={history} onImport={handleImportHistory} />}
          {view === 'settings' && (currentUser.role === 'ADMIN' || currentUser.role === 'DEVELOPER') && <SettingsManager settings={settings} onSave={setSettings} />}
          {view === 'promotions' && (currentUser.role === 'ADMIN' || currentUser.role === 'DEVELOPER') && <PromotionManager promotions={promotions} onAdd={handleAddPromotion} onEdit={handleEditPromotion} onDelete={handleDeletePromotion} />}
          {view === 'tenants' && currentUser.role === 'DEVELOPER' && <TenantManager currentTenantId={currentUser.id} isSuperAdmin={currentUser.role === 'ADMIN'} />}
        </main>

        {isModalOpen && <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProduct} initialData={currentProduct} type={modalType} suppliers={suppliers} />}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      </div>
    </div>
  );
};

export default App;