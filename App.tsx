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

// Importa utilitários
import { generateId } from './validators';
import { createBackup, readBackupFile } from './utils/backupUtils';
import { exportProductsToPdf, exportSalesReport } from './utils/exportUtils';

// Importa a camada de API para comunicar com o Backend (Supabase)
import { api } from './api';

// Define as configurações iniciais padrão da aplicação (caso a BD falhe ou seja a primeira vez)
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
  // Estado para armazenar a lista de produtos carregados do backend
  const [products, setProducts] = useState<Product[]>([]);
  // Estado para armazenar a lista de fornecedores
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  // Estado para armazenar a lista de clientes
  const [customers, setCustomers] = useState<Customer[]>([]);
  // Estado para armazenar as encomendas de compra a fornecedores
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  // Estado para armazenar o histórico de ações (logs)
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // Estado para armazenar o histórico de vendas realizadas
  const [sales, setSales] = useState<Sale[]>([]);
  // Estado para armazenar os utilizadores do sistema (staff/admin)
  const [users, setUsers] = useState<User[]>([]);
  // Estado para promoções
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  // Estado para alertas dismissidos
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // --- ESTADO DA INTERFACE (UI STATE) ---
  // Estado para as configurações globais (tema, empresa, impostos)
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  // Estado para guardar o utilizador que está logado atualmente (null se ninguém)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Estado para controlar se a aplicação está a carregar dados (spinner)
  const [isLoading, setIsLoading] = useState(false);
  // Estado para saber se os dados iniciais já foram carregados com sucesso
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  // Estado para controlar se o menu dropdown do utilizador (canto superior direito) está aberto
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // Estado para o termo de pesquisa na barra superior (filtro global)
  const [searchTerm, setSearchTerm] = useState('');
  // Estado para controlar se a modal de produtos (criar/editar) está visível
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Estado para definir o tipo da modal: NONE (fechada), CREATE (novo), EDIT (editar)
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);
  // Estado para guardar o produto que está a ser editado atualmente
  const [currentProduct, setCurrentProduct] = useState<Product | undefined>(undefined);
  // Estado para controlar qual "Tab" (aba) está ativa no momento (Dashboard, Vendas, etc.)
  const [view, setView] = useState<'dashboard' | 'sales_stats' | 'list' | 'history' | 'sales' | 'customers' | 'suppliers' | 'purchases' | 'settings' | 'users' | 'promotions'>('dashboard');

  // --- ESTADO DOS FILTROS DO DASHBOARD ---
  // Filtro de categoria selecionada no dashboard ('all' para todas)
  const [dashCategoryFilter, setDashCategoryFilter] = useState<string>('all');
  // Filtro de fornecedor selecionado no dashboard ('all' para todos)
  const [dashSupplierFilter, setDashSupplierFilter] = useState<string>('all');

  // --- HOOKS PERSONALIZADOS ---
  // Debounce da pesquisa para melhor performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  // Sistema de notificações toast
  const toast = useToast();
  // Alertas de stock automáticos
  const stockAlerts = useStockAlerts(products);
  // Filtrar alertas não dismissidos
  const activeAlerts = useMemo(() =>
    stockAlerts.filter(a => !dismissedAlerts.includes(a.id)),
    [stockAlerts, dismissedAlerts]
  );

  // --- FUNÇÃO DE CARREGAMENTO DE DADOS ---
  // Função assíncrona para buscar todos os dados iniciais ao Backend
  const loadData = async () => {
    // Ativa o indicador de carregamento
    setIsLoading(true);
    try {
      // Chama a API para obter o objeto com todas as coleções
      const data = await api.getInitialData();

      // Atualiza os estados com os dados recebidos (ou arrays vazios se falhar)
      setProducts(data.products || []);
      setUsers(data.users || []);
      setCustomers(data.customers || []);
      setSales(data.sales || []);
      setSuppliers(data.suppliers || []);
      setPurchaseOrders(data.purchaseOrders || []);
      setHistory(data.history || []);

      // Marca que os dados foram carregados
      setIsDataLoaded(true);
    } catch (error) {
      // Regista erro na consola se falhar
      console.error("Failed to load data", error);
      // Mostra notificação de erro
      toast.error('Erro ao carregar dados', 'Não foi possível conectar ao servidor.');
    } finally {
      // Desativa o indicador de carregamento (sempre executa)
      setIsLoading(false);
    }
  };

  // --- EFEITOS (SIDE EFFECTS) ---

  // Executa uma vez quando o componente é montado (ao abrir a app)
  useEffect(() => {
    loadData(); // Carrega os dados
  }, []); // Array vazio [] garante execução única

  // Executa sempre que o tema muda nas configurações
  useEffect(() => {
    // Se o tema for 'dark', adiciona a classe CSS ao elemento HTML raiz
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      // Se não, remove a classe (modo claro)
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]); // Dependência: só corre se settings.theme mudar

  // Função para alternar entre tema claro e escuro
  const toggleTheme = () => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  // --- AUTENTICAÇÃO ---

  // Função para lidar com o login do utilizador
  const handleLogin = async (userAttempt: User) => {
    setIsLoading(true); // Mostra loading
    try {
      // Tenta fazer login via API
      const result = await api.login(userAttempt.id, userAttempt.password);
      if (result.success) {
        // Se sucesso, define o utilizador atual
        setCurrentUser(result.user);
        // Redireciona para o dashboard
        setView('dashboard');
        // Recarrega dados para garantir frescura
        loadData();
      } else {
        // Mostra erro se credenciais inválidas
        alert(result.message || "Erro de login");
      }
    } catch (e) {
      alert("Erro de conexão");
    } finally {
      setIsLoading(false); // Esconde loading
    }
  };

  // Função para fazer logout
  const handleLogout = () => {
    setCurrentUser(null); // Limpa o utilizador atual
    setIsUserMenuOpen(false); // Fecha o menu
  };

  // --- LÓGICA DE DADOS COMPUTADOS (MEMO) ---

  // Filtra a lista de produtos com base no termo de pesquisa (Search Bar) COM DEBOUNCE
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
  }, [products, debouncedSearchTerm]); // Usa debouncedSearchTerm para performance

  // Filtra produtos especificamente para os gráficos do Dashboard (Filtros dropdown)
  const dashboardFilteredProducts = useMemo(() => {
    return products.filter(p => {
      // Verifica se corresponde à categoria selecionada (ou se é 'all')
      const matchesCategory = dashCategoryFilter === 'all' || p.category === dashCategoryFilter;
      // Verifica se corresponde ao fornecedor selecionado
      const matchesSupplier = dashSupplierFilter === 'all' || p.supplierId === dashSupplierFilter;
      return matchesCategory && matchesSupplier;
    });
  }, [products, dashCategoryFilter, dashSupplierFilter]);

  // Calcula estatísticas gerais para os cartões do Dashboard
  const stats = useMemo(() => {
    // Total de itens físicos (soma das quantidades)
    const totalItems = dashboardFilteredProducts.reduce((acc, curr) => acc + curr.quantity, 0);
    // Valor total em stock (Preço * Quantidade)
    const totalValue = dashboardFilteredProducts.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    // Contagem de produtos com stock abaixo do mínimo
    const lowStockCount = dashboardFilteredProducts.filter(p => p.quantity <= p.minStock).length;
    return { totalItems, totalValue, lowStockCount };
  }, [dashboardFilteredProducts]);

  // Gera lista única de categorias para o dropdown de filtro
  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category))).sort();
  }, [products]);

  // --- LÓGICA DE PERMISSÕES E NAVEGAÇÃO ---

  // Define quais abas são visíveis com base no cargo do utilizador (Role-Based Access Control)
  const visibleTabs = useMemo(() => {
    // Se não houver utilizador logado, não mostra abas
    if (!currentUser) return [];

    // Tabs comuns disponíveis para TODOS (Staff e Admin)
    const commonTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, // Visão geral de stock
      { id: 'sales_stats', label: 'Análise Vendas', icon: BarChart2 }, // Novo Dashboard Financeiro
      { id: 'sales', label: 'Nova Venda', icon: ShoppingCart }, // POS (Ponto de Venda)
      { id: 'customers', label: 'Clientes', icon: Users }, // Gestão de clientes
      { id: 'list', label: 'Produtos', icon: Database }, // Lista de produtos (Staff vê read-only)
    ];

    // Tabs exclusivas para ADMINISTRADORES
    const adminTabs = [
      { id: 'purchases', label: 'Compras', icon: Package }, // Encomendas a fornecedores
      { id: 'suppliers', label: 'Fornecedores', icon: Truck }, // Gestão de fornecedores
      { id: 'promotions', label: 'Promoções', icon: Gift }, // Gestão de promoções
      { id: 'history', label: 'Histórico', icon: History }, // Log de auditoria
      { id: 'users', label: 'Users', icon: UserIcon }, // Gestão de utilizadores
      { id: 'settings', label: 'Config', icon: SettingsIcon }, // Configurações do sistema
    ];

    // Se for ADMIN, junta as duas listas
    if (currentUser.role === 'ADMIN') {
      return [...commonTabs, ...adminTabs];
    }

    // Se for STAFF, retorna apenas as comuns
    return commonTabs;
  }, [currentUser]); // Recalcula se o utilizador mudar


  // Função auxiliar para adicionar entradas ao histórico (Log)
  const addHistory = async (action: HistoryEntry['action'], productId: string, productName: string, details: string) => {
    const entry: HistoryEntry = {
      id: generateId('HIST'), // Gera ID único via UUID
      userId: currentUser?.id || 'sys', // Regista quem fez a ação
      userName: currentUser?.name || 'Sistema',
      productId,
      productName,
      action,
      timestamp: new Date().toLocaleString('pt-PT'), // Carimbo de tempo
      details
    };
    // Grava no backend
    await api.saveHistoryEntry(entry);
    // Atualiza estado local para feedback imediato
    setHistory(prev => [entry, ...prev]);
  };

  // --- HANDLERS DE AÇÕES (CRUD) ---

  // Abre a modal para CRIAR novo produto
  const handleOpenCreate = () => {
    setModalType(ModalType.CREATE);
    setCurrentProduct(undefined); // Limpa produto atual
    setIsModalOpen(true);
  };

  // Abre a modal para EDITAR produto existente
  const handleOpenEdit = (product: Product) => {
    setModalType(ModalType.EDIT);
    setCurrentProduct(product); // Define produto a editar
    setIsModalOpen(true);
  };

  // Apaga um produto
  const handleDelete = async (id: string) => {
    // Pede confirmação ao utilizador
    if (window.confirm('Tem a certeza que deseja apagar este produto?')) {
      setIsLoading(true);
      const prod = products.find(p => p.id === id);
      // Chama API para apagar
      await api.deleteProduct(id);
      // Regista no histórico
      if (prod) addHistory('APAGAR', id, prod.name, 'Produto eliminado');
      // Recarrega dados
      await loadData();
      setIsLoading(false);
    }
  };

  // Salva produto (Criação ou Edição) vindo da Modal
  const handleSaveProduct = async (data: ProductFormData) => {
    setIsLoading(true);
    const timestamp = new Date().toLocaleString('pt-PT');

    // Constrói objeto do produto
    const newProduct: Product = {
      // Se for criar, gera ID novo. Se editar, mantém ID antigo.
      id: modalType === ModalType.CREATE ? `PROD-${Date.now()}` : currentProduct!.id,
      ...data, // Espalha os dados do formulário
      updatedAt: timestamp
    };

    // Chama API para salvar
    await api.saveProduct(newProduct);

    // Adiciona log ao histórico
    await addHistory(
      modalType === ModalType.CREATE ? 'CRIAR' : 'EDITAR',
      newProduct.id,
      newProduct.name,
      modalType === ModalType.CREATE ? 'Novo produto' : 'Produto atualizado'
    );

    // Atualiza dados e fecha modal
    await loadData();
    setIsModalOpen(false);
    setIsLoading(false);
  };

  // Processa uma Nova Venda
  const handleNewSale = async (newSale: Sale) => {
    setIsLoading(true);
    // Associa o ID do utilizador atual à venda
    const saleWithUser = { ...newSale, userId: currentUser?.id || '' };

    // Chama API para salvar venda e atualizar stock (Logic no Backend ou API layer)
    await api.saveSale(saleWithUser);

    // Regista cada item vendido no histórico
    for (const item of newSale.items) {
      await addHistory('VENDA', item.productId, item.productName, `Venda #${newSale.id} (-${item.quantity})`);
    }

    // Recarrega dados para atualizar stocks na tabela
    await loadData();
    setIsLoading(false);
  };

  // --- HANDLERS DE CLIENTES ---
  const handleAddCustomer = async (customer: Customer) => {
    setIsLoading(true);
    await api.saveCustomer(customer);
    await addHistory('CLIENTE', customer.id, customer.name, 'Novo cliente');
    await loadData();
    setIsLoading(false);
  };

  const handleEditCustomer = async (customer: Customer) => {
    setIsLoading(true);
    await api.saveCustomer(customer);
    await addHistory('CLIENTE', customer.id, customer.name, 'Cliente atualizado');
    await loadData();
    setIsLoading(false);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('Tem a certeza?')) {
      setIsLoading(true);
      await api.deleteCustomer(id);
      await addHistory('CLIENTE', id, 'Cliente', 'Cliente removido');
      await loadData();
      setIsLoading(false);
    }
  };

  // --- HANDLERS DE FORNECEDORES ---
  const handleAddSupplier = async (s: Supplier) => {
    setIsLoading(true);
    await api.saveSupplier(s);
    await loadData();
    setIsLoading(false);
  };

  const handleEditSupplier = async (s: Supplier) => {
    setIsLoading(true);
    await api.saveSupplier(s);
    await loadData();
    setIsLoading(false);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (window.confirm('Tem a certeza?')) {
      setIsLoading(true);
      await api.deleteSupplier(id);
      await loadData();
      setIsLoading(false);
    }
  };

  // --- HANDLERS DE UTILIZADORES ---
  const handleAddUser = async (u: User) => {
    setIsLoading(true);
    await api.saveUser(u);
    await loadData();
    setIsLoading(false);
  };

  const handleEditUser = async (u: User) => {
    setIsLoading(true);
    await api.saveUser(u);
    // Se o utilizador editou o seu próprio perfil, atualiza o estado local
    if (currentUser && currentUser.id === u.id) {
      setCurrentUser(u);
    }
    await loadData();
    setIsLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Tem a certeza?')) {
      setIsLoading(true);
      await api.deleteUser(id);
      await loadData();
      setIsLoading(false);
    }
  };

  // --- HANDLERS DE ENCOMENDAS (PURCHASE ORDERS) ---
  const handleCreatePO = async (po: PurchaseOrder) => {
    setIsLoading(true);
    await api.savePurchaseOrder(po);
    await addHistory('COMPRA', po.id, po.supplierName, 'Nova Encomenda a Fornecedor');
    await loadData();
    setIsLoading(false);
  };

  // Receber Encomenda (Entrada de Stock)
  const handleReceivePO = async (orderId: string) => {
    const order = purchaseOrders.find(po => po.id === orderId);
    // Valida se já foi recebida
    if (!order || order.status === 'RECEBIDO') return;

    setIsLoading(true);
    // 1. Atualiza estado da encomenda
    await api.updatePurchaseOrderStatus(orderId, 'RECEBIDO');

    // 2. Atualiza stock de cada produto
    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const updatedProduct = {
          ...product,
          quantity: product.quantity + item.quantity, // Soma stock
          updatedAt: new Date().toLocaleString('pt-PT')
        };
        await api.saveProduct(updatedProduct);
        await addHistory('RECEBIMENTO', product.id, product.name, `Recebido de PO #${orderId} (+${item.quantity})`);
      }
    }
    await loadData();
    setIsLoading(false);
  };

  const handleImportHistory = (file: File) => {
    toast.info('Importação de histórico', 'Funcionalidade em desenvolvimento.');
  };

  // --- HANDLERS DE PROMOÇÕES ---
  const handleAddPromotion = (promotion: Promotion) => {
    setPromotions(prev => [...prev, promotion]);
    toast.success('Promoção criada', `"${promotion.name}" foi adicionada.`);
    addHistory('PROMOCAO', promotion.id, promotion.name, `Promoção criada: ${promotion.value}${promotion.type === 'PERCENTAGE' ? '%' : '€'}`);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setPromotions(prev => prev.map(p => p.id === promotion.id ? promotion : p));
    toast.success('Promoção atualizada', `"${promotion.name}" foi guardada.`);
  };

  const handleDeletePromotion = (id: string) => {
    const promo = promotions.find(p => p.id === id);
    if (window.confirm(`Apagar promoção "${promo?.name}"?`)) {
      setPromotions(prev => prev.filter(p => p.id !== id));
      toast.success('Promoção eliminada', promo?.name || '');
    }
  };

  // --- HANDLERS DE ALERTAS ---
  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const handleDismissAllAlerts = () => {
    const allIds = stockAlerts.map(a => a.id);
    setDismissedAlerts(allIds);
  };

  // --- HANDLERS DE EXPORTAÇÃO E BACKUP ---
  const handleExportInventory = () => {
    exportProductsToPdf(products, settings);
    toast.success('Exportação concluída', 'Relatório de inventário gerado.');
  };

  const handleExportSales = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // Último mês
    exportSalesReport(sales, startDate, endDate, settings);
    toast.success('Exportação concluída', 'Relatório de vendas gerado.');
  };

  const handleCreateBackup = () => {
    createBackup({
      products,
      customers,
      suppliers,
      sales,
      purchaseOrders,
      users,
      settings,
      promotions
    });
    toast.success('Backup criado', 'Ficheiro de backup descarregado.');
  };

  // --- RENDERIZAÇÃO CONDICIONAL (LOADING) ---
  // Se estiver a carregar e ainda não tiver dados, mostra ecrã de loading
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

  // --- RENDERIZAÇÃO CONDICIONAL (LOGIN) ---
  // Se não houver utilizador logado, mostra ecrã de login
  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  // --- RENDERIZAÇÃO PRINCIPAL (APP) ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">

      {/* CABEÇALHO (HEADER) */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo e Título */}
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white hidden sm:block">ERP Inventário</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white sm:hidden">ERP</span>
              {/* Spinner pequeno no topo se estiver a carregar em background */}
              {isLoading && <Loader className="w-4 h-4 text-blue-500 animate-spin ml-2" />}
            </div>

            {/* Área Direita: Pesquisa, Tema, Menu Utilizador */}
            <div className="flex items-center gap-2 md:gap-3">

              {/* Barra de Pesquisa Global */}
              <div className="relative hidden md:block w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="main-search"
                  type="text"
                  placeholder="Pesquisar..."
                  className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Botão de Tema (Dark/Light) */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                {settings.theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {/* Menu de Utilizador (Dropdown) */}
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

                {/* Dropdown Content */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BARRA DE NAVEGAÇÃO (TABS) */}
          <div className="flex overflow-x-auto space-x-2 md:space-x-4 pb-0 scrollbar-hide">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)} // Troca a vista atual
                className={`flex items-center px-2 py-2 md:px-3 md:py-3 border-b-2 text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${view === tab.id
                  // Estilo Ativo
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  // Estilo Inativo
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO PRINCIPAL (MAIN) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-4 md:py-8">

        {/* --- VISTA: DASHBOARD GERAL DE STOCK --- */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Filtros do Dashboard */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center">
              <div className="flex items-center text-gray-500 dark:text-gray-400 mr-2">
                <Filter className="w-5 h-5 mr-2" />
                <span className="font-medium text-sm md:text-base">Filtros:</span>
              </div>

              {/* Select de Categoria */}
              <div className="w-full sm:w-auto">
                <select
                  value={dashCategoryFilter}
                  onChange={(e) => setDashCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 text-sm min-w-[150px]"
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Select de Fornecedor */}
              <div className="w-full sm:w-auto">
                <select
                  value={dashSupplierFilter}
                  onChange={(e) => setDashSupplierFilter(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-2 text-sm min-w-[150px]"
                >
                  <option value="all">Todos os Fornecedores</option>
                  {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                </select>
              </div>
            </div>

            {/* Cartões de Estatísticas (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Valor em Stock */}
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor em Stock</p>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: settings.currency }).format(stats.totalValue)}
                    </h3>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              {/* Alertas de Stock Baixo */}
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Alertas de Stock</p>
                    <h3 className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.lowStockCount}</h3>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Barcode className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>

              {/* Total SKUs */}
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total SKUs</p>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalItems}</h3>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos Visuais do Dashboard */}
            <DashboardCharts products={dashboardFilteredProducts} />

            {/* Painel de Alertas de Stock */}
            {activeAlerts.length > 0 && (
              <div className="mt-6">
                <AlertsPanel
                  alerts={activeAlerts}
                  onDismiss={handleDismissAlert}
                  onDismissAll={handleDismissAllAlerts}
                />
              </div>
            )}

            {/* Ações Rápidas */}
            <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Ações Rápidas</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportInventory}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Inventário (PDF)
                </button>
                <button
                  onClick={handleExportSales}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Vendas (PDF)
                </button>
                {currentUser.role === 'ADMIN' && (
                  <button
                    onClick={handleCreateBackup}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Criar Backup
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- VISTA: ANÁLISE DE VENDAS (NOVO) --- */}
        {view === 'sales_stats' && (
          // Passamos products e users para cálculos avançados (margem, vendedor)
          <SalesDashboard
            sales={sales}
            users={users}
            products={products}
            currency={settings.currency}
          />
        )}

        {/* --- VISTA: LISTA DE PRODUTOS --- */}
        {view === 'list' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Catálogo de Produtos</h2>
              <div className="flex gap-2">
                {/* Botão Novo SKU (Apenas ADMIN) */}
                {currentUser.role === 'ADMIN' && (
                  <button
                    onClick={handleOpenCreate}
                    className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Novo SKU</span><span className="sm:hidden">Novo</span>
                  </button>
                )}
              </div>
            </div>
            {/* Tabela de Produtos */}
            <InventoryTable
              products={filteredProducts}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              userRole={currentUser.role} // Passamos a role para esconder/mostrar ações
            />
          </div>
        )}

        {/* --- VISTA: PONTO DE VENDA (POS) --- */}
        {view === 'sales' && (
          <SalesManager
            products={products}
            sales={sales}
            customers={customers}
            onNewSale={handleNewSale}
            settings={settings}
          />
        )}

        {/* --- VISTA: GESTÃO DE CLIENTES --- */}
        {view === 'customers' && (
          <CustomerManager
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            userRole={currentUser.role} // Passamos role para permissões
          />
        )}

        {/* --- VISTA: COMPRAS (ADMIN ONLY) --- */}
        {view === 'purchases' && currentUser.role === 'ADMIN' && (
          <PurchaseOrderManager
            products={products}
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            onCreateOrder={handleCreatePO}
            onReceiveOrder={handleReceivePO}
          />
        )}

        {/* --- VISTA: FORNECEDORES (ADMIN ONLY) --- */}
        {view === 'suppliers' && currentUser.role === 'ADMIN' && (
          <SupplierManager
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
            onEditSupplier={handleEditSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        )}

        {/* --- VISTA: UTILIZADORES (ADMIN ONLY) --- */}
        {view === 'users' && currentUser.role === 'ADMIN' && (
          <UserManager
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {/* --- VISTA: HISTÓRICO (ADMIN ONLY) --- */}
        {view === 'history' && currentUser.role === 'ADMIN' && (
          <HistoryLog history={history} onImport={handleImportHistory} />
        )}

        {/* --- VISTA: CONFIGURAÇÕES (ADMIN ONLY) --- */}
        {view === 'settings' && currentUser.role === 'ADMIN' && (
          <SettingsManager
            settings={settings}
            onSave={(newSettings) => setSettings(newSettings)}
          />
        )}

        {/* --- VISTA: PROMOÇÕES (ADMIN ONLY) --- */}
        {view === 'promotions' && currentUser.role === 'ADMIN' && (
          <PromotionManager
            promotions={promotions}
            onAdd={handleAddPromotion}
            onEdit={handleEditPromotion}
            onDelete={handleDeletePromotion}
          />
        )}
      </main>

      {/* --- MODAIS (RENDERIZADOS FORA DO FLUXO PRINCIPAL) --- */}
      {/* Modal de Criar/Editar Produto */}
      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          initialData={currentProduct}
          type={modalType}
          suppliers={suppliers}
        />
      )}

      {/* --- TOAST NOTIFICATIONS --- */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </div>
  );
};

// Exporta o componente para ser usado no index.tsx
export default App;