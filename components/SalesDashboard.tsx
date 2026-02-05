// ============================================
// COMPONENTE: SALES DASHBOARD (Análise de Vendas)
// ============================================
// Este componente exibe métricas avançadas de vendas incluindo:
// - KPIs principais (receita, ticket médio, top vendedor, transações)
// - Gráfico de evolução diária
// - Top 5 produtos por receita
// - Performance por vendedor (gráfico circular)
// - Velocidade de venda (frequência de rotação)
// ============================================

import React, { useMemo, useState } from 'react';
import { Sale, User, Product } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import {
  TrendingUp, Users, ShoppingBag, CreditCard, Calendar,
  Clock, Award, DollarSign, Percent, Package, Filter, X, Search
} from 'lucide-react';

// ============================================
// INTERFACE DE PROPS DO COMPONENTE
// ============================================
interface SalesDashboardProps {
  sales: Sale[];
  users: User[];
  products: Product[];
  currency: string;
}

// ============================================
// PALETA DE CORES
// ============================================
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================
const formatDateTime = (dateInput: string | Date | number): string => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const formatCurrency = (value: number, currency: string): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency
  }).format(value);
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  sales,
  users,
  products,
  currency
}) => {
  // Custom Tooltip Component (PowerBI Style)
  const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 min-w-[200px] z-50">
          <p className="font-bold text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            {label}
          </p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {entry.name}:
                  </span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatter ? formatter(entry.value) : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  // Estados de Filtro
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar Vendas
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Filtro de Data
      if (dateRange.start) {
        if (new Date(sale.date) < new Date(dateRange.start)) return false;
      }
      if (dateRange.end) {
        // Ajustar para o final do dia
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (new Date(sale.date) > endDate) return false;
      }

      // Filtro de Pagamento
      if (paymentFilter !== 'all' && sale.paymentMethod !== paymentFilter) return false;

      // Filtro de Utilizador
      if (userFilter !== 'all' && sale.userId !== userFilter) return false;

      return true;
    });
  }, [sales, dateRange, paymentFilter, userFilter]);

  // Função para limpar filtros
  const clearFilters = () => {
    setDateRange({ start: '', end: '' });
    setPaymentFilter('all');
    setUserFilter('all');
  };

  const hasActiveFilters = dateRange.start || dateRange.end || paymentFilter !== 'all' || userFilter !== 'all';

  // Métricas calculadas com base nas vendas FILTRADAS
  const metrics = useMemo(() => {
    const dataToUse = filteredSales;

    // --- MÉTRICAS BÁSICAS ---
    const totalRevenue = dataToUse.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalSalesCount = dataToUse.length;
    const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
    const totalProfit = dataToUse.reduce((acc, sale) => acc + (sale.profit || 0), 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // --- ESTATÍSTICAS POR PRODUTO ---
    const productStats: Record<string, {
      name: string;
      quantity: number;
      revenue: number;
      cost: number;
      profit: number;
    }> = {};

    // --- ESTATÍSTICAS POR VENDEDOR ---
    const userStats: Record<string, {
      name: string;
      revenue: number;
      count: number;
      profit: number;
    }> = {};

    // --- FREQUÊNCIA DE VENDA ---
    const productSaleDates: Record<string, number[]> = {};

    // --- ESTATÍSTICAS POR MÉTODO DE PAGAMENTO ---
    const paymentStats: Record<string, { count: number; amount: number }> = {};

    // --- PROCESSAR CADA VENDA ---
    dataToUse.forEach(sale => {
      // 1. Por Vendedor
      const userName = users.find(u => u.id === sale.userId)?.name || 'Desconhecido';
      if (!userStats[sale.userId]) {
        userStats[sale.userId] = { name: userName, revenue: 0, count: 0, profit: 0 };
      }
      userStats[sale.userId].revenue += sale.totalAmount;
      userStats[sale.userId].count += 1;
      userStats[sale.userId].profit += sale.profit || 0;

      // 2. Por Pagamento
      const pm = sale.paymentMethod || 'CASH';
      if (!paymentStats[pm]) {
        paymentStats[pm] = { count: 0, amount: 0 };
      }
      paymentStats[pm].count += 1;
      paymentStats[pm].amount += sale.totalAmount;

      // 3. Por Produto
      (sale.items || []).forEach(item => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0
          };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue += item.total;
        const itemCost = (item.costPrice || 0) * item.quantity;
        productStats[item.productId].cost += itemCost;
        productStats[item.productId].profit += (item.total - itemCost);

        if (!productSaleDates[item.productId]) {
          productSaleDates[item.productId] = [];
        }
        productSaleDates[item.productId].push(new Date(sale.date).getTime());
      });
    });

    // --- PROCESSAR RESULTADOS ---
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        ...p,
        margin: p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : '0'
      }));

    const topSeller = Object.values(userStats)
      .sort((a, b) => b.revenue - a.revenue)[0] || null;

    const userStatsList = Object.values(userStats)
      .sort((a, b) => b.revenue - a.revenue);

    const turnoverRates = Object.entries(productSaleDates).map(([prodId, dates]) => {
      if (dates.length < 2) return null;
      dates.sort((a, b) => a - b);
      let totalGap = 0;
      for (let i = 1; i < dates.length; i++) {
        totalGap += (dates[i] - dates[i - 1]);
      }
      const avgGapMs = totalGap / (dates.length - 1);
      const avgGapDays = avgGapMs / (1000 * 60 * 60 * 24);
      return {
        name: productStats[prodId].name,
        avgDays: avgGapDays,
        totalSales: dates.length
      };
    }).filter(Boolean) as { name: string; avgDays: number; totalSales: number }[];

    const fastestSelling = turnoverRates
      .sort((a, b) => a.avgDays - b.avgDays)
      .slice(0, 5);

    // --- DADOS TEMPORAIS ---
    const timeLineDataMap: Record<string, { revenue: number; count: number; profit: number }> = {};
    dataToUse.forEach(s => {
      const dateKey = formatDateTime(s.date).split(' ')[0];
      if (!timeLineDataMap[dateKey]) {
        timeLineDataMap[dateKey] = { revenue: 0, count: 0, profit: 0 };
      }
      timeLineDataMap[dateKey].revenue += s.totalAmount;
      timeLineDataMap[dateKey].count += 1;
      timeLineDataMap[dateKey].profit += s.profit || 0;
    });

    const timeLineData = Object.entries(timeLineDataMap)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        count: data.count,
        profit: data.profit
      }))
      .sort((a, b) => {
        const [d1, m1, y1] = a.date.split('-').map(Number);
        const [d2, m2, y2] = b.date.split('-').map(Number);
        return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
      })
      .slice(-14);

    const paymentLabels: Record<string, string> = {
      'CASH': 'Dinheiro', 'CARD': 'Cartão', 'MBWAY': 'MBWay',
      'TRANSFER': 'Transferência', 'CHECK': 'Cheque', 'CREDIT': 'Crédito'
    };
    const paymentChartData = Object.entries(paymentStats).map(([method, data]) => ({
      name: paymentLabels[method] || method,
      value: data.amount,
      count: data.count
    }));

    return {
      totalRevenue, totalSalesCount, averageTicket, totalProfit, avgMargin,
      topProducts, topSeller, fastestSelling, timeLineData, userStats: userStatsList, paymentChartData
    };
  }, [filteredSales, users, products]); // Depende de filteredSales agora

  // ESTADO VAZIO INICIAL (Sem vendas nenhumas no sistema todo)
  if (!sales || sales.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12">
        {/* Conteúdo vazio original */}
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
          <TrendingUp className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sem Dados de Vendas</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          Ainda não existem vendas registadas no sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* BARRA DE FILTROS */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Análise de Vendas
            </h2>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                Filtros Ativos
              </span>
            )}
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
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
                {[dateRange.start, dateRange.end, paymentFilter !== 'all', userFilter !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* INPUTS DE FILTRO */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-slideDown">

            {/* Data Início */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">De</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Até</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vendedor */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Vendedor</label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Pagamento */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pagamento</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="CASH">Dinheiro</option>
                <option value="CARD">Cartão</option>
                <option value="MBWAY">MBWay</option>
                <option value="TRANSFER">Transferência</option>
              </select>
            </div>

            {/* Limpar Filtros */}
            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {filteredSales.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum resultado encontrado</h3>
          <p className="text-gray-500 dark:text-gray-400">Tente ajustar os filtros para ver dados.</p>
          <button onClick={clearFilters} className="mt-4 text-blue-600 hover:underline">Limpar filtros</button>
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card: Receita Total */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Receita Filtro</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(metrics.totalRevenue, currency)}</h3>
                  <p className="text-xs text-gray-500 mt-1">Margem: <span className="text-green-600 font-medium">{metrics.avgMargin.toFixed(1)}%</span></p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
              </div>
            </div>

            {/* Card: Lucro Total */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lucro Filtro</p>
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(metrics.totalProfit, currency)}</h3>
                  <p className="text-xs text-gray-500 mt-1">{metrics.totalSalesCount} transações</p>
                </div>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
              </div>
            </div>

            {/* Card: Ticket Médio */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ticket Médio</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(metrics.averageTicket, currency)}</h3>
                  <p className="text-xs text-gray-500 mt-1">Por transação</p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
              </div>
            </div>

            {/* Card: Top Vendedor */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Vendedor</p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate">{metrics.topSeller ? metrics.topSeller.name : 'N/A'}</h3>
                  <p className="text-xs text-green-600 dark:text-green-400">{metrics.topSeller ? `${formatCurrency(metrics.topSeller.revenue, currency)} (${metrics.topSeller.count})` : '-'}</p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><Award className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
              </div>
            </div>
          </div>

          {/* GRÁFICOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolução */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center"><Calendar className="w-5 h-5 mr-2 text-gray-500" />Evolução de Vendas</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.timeLineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={11} stroke="#6B7280" />
                    <YAxis axisLine={false} tickLine={false} fontSize={11} stroke="#6B7280" tickFormatter={(val) => `${val}€`} />
                    <Tooltip content={<CustomTooltip formatter={(value: number) => `${value.toFixed(2)}€`} />} cursor={{ fill: '#f3f4f6', opacity: 0.1 }} />
                    <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Produtos */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center"><Package className="w-5 h-5 mr-2 text-gray-500" />Top 5 Produtos</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={metrics.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#374151" opacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="#6B7280" />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(2)}€`, 'Receita']} contentStyle={{ borderRadius: '8px' }} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SECÇÃO 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vendedores - Pizza */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-gray-500" />Por Colaborador</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics.userStats} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                      {metrics.userStats.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}€`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Velocidade de Venda */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-gray-500" />Velocidade de Venda</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vendas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Frequência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {metrics.fastestSelling.length > 0 ? (
                      metrics.fastestSelling.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">{item.totalSales}x</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">A cada <span className="font-bold text-blue-600">{item.avgDays.toFixed(1)}</span> dias</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">Dados insuficientes</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesDashboard;