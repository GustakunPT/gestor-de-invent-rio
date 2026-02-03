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

import React, { useMemo } from 'react';
import { Sale, User, Product } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import {
  TrendingUp, Users, ShoppingBag, CreditCard, Calendar,
  Clock, Award, DollarSign, Percent, Package
} from 'lucide-react';

// ============================================
// INTERFACE DE PROPS DO COMPONENTE
// ============================================
// Define os dados que o componente precisa receber do pai (App.tsx)

interface SalesDashboardProps {
  /** Lista de todas as vendas registadas no sistema */
  sales: Sale[];

  /** Lista de utilizadores (para identificar vendedores) */
  users: User[];

  /** Lista de produtos (para cálculo de margens) */
  products: Product[];

  /** Código da moeda (EUR, USD, etc.) */
  currency: string;
}

// ============================================
// PALETA DE CORES PARA GRÁFICOS
// ============================================
// Cores usadas nos gráficos circulares e de barras

const COLORS = [
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#F59E0B', // Amarelo/Laranja
  '#EF4444', // Vermelho
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
  '#14B8A6', // Teal
  '#F97316'  // Laranja
];

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Formata uma data para o formato português dd-MM-yyyy HH:mm
 * @param dateInput - Data em qualquer formato aceite por Date()
 * @returns String formatada ou '-' se inválida
 */
const formatDateTime = (dateInput: string | Date | number): string => {
  const d = new Date(dateInput);

  // Verifica se a data é válida
  if (isNaN(d.getTime())) return '-';

  // Formata os componentes da data com padding de zeros
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

/**
 * Formata um valor monetário para o formato português
 * @param value - Valor numérico
 * @param currency - Código da moeda
 * @returns String formatada (ex: "1.234,56 €")
 */
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

  // DEBUG: Log para verificar se dados estão a chegar
  console.log('[SalesDashboard] Dados recebidos:', {
    salesCount: sales?.length || 0,
    usersCount: users?.length || 0,
    productsCount: products?.length || 0,
    currency
  });

  // ============================================
  // ESTADO VAZIO - Se não houver vendas
  // ============================================
  if (!sales || sales.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
          <TrendingUp className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Sem Dados de Vendas
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          Ainda não existem vendas registadas no sistema. Os gráficos e métricas aparecerão aqui assim que forem realizadas vendas.
        </p>
        <div className="flex gap-4">
          <div className="text-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{products?.length || 0}</p>
            <p className="text-xs text-gray-500">Produtos</p>
          </div>
          <div className="text-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{users?.length || 0}</p>
            <p className="text-xs text-gray-500">Utilizadores</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // CÁLCULOS E MÉTRICAS (MEMOIZADOS)
  // ============================================
  // useMemo evita recalcular em cada render se os dados não mudarem

  const metrics = useMemo(() => {

    // --- MÉTRICAS BÁSICAS ---

    // Receita total: soma de todas as vendas
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);

    // Total de vendas (transações)
    const totalSalesCount = sales.length;

    // Ticket médio: receita / nº vendas
    const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    // Lucro total estimado (se disponível nas vendas)
    const totalProfit = sales.reduce((acc, sale) => acc + (sale.profit || 0), 0);

    // Margem média
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // --- ESTATÍSTICAS POR PRODUTO ---
    // Mapa: productId -> { name, quantity, revenue, cost }
    const productStats: Record<string, {
      name: string;
      quantity: number;
      revenue: number;
      cost: number;
      profit: number;
    }> = {};

    // --- ESTATÍSTICAS POR VENDEDOR ---
    // Mapa: userId -> { name, revenue, count }
    const userStats: Record<string, {
      name: string;
      revenue: number;
      count: number;
      profit: number;
    }> = {};

    // --- FREQUÊNCIA DE VENDA ---
    // Mapa: productId -> Array de timestamps de venda
    const productSaleDates: Record<string, number[]> = {};

    // --- ESTATÍSTICAS POR MÉTODO DE PAGAMENTO ---
    const paymentStats: Record<string, { count: number; amount: number }> = {};

    // --- PROCESSAR CADA VENDA ---
    sales.forEach(sale => {

      // 1. Estatísticas por Vendedor
      const userName = users.find(u => u.id === sale.userId)?.name || 'Desconhecido';
      if (!userStats[sale.userId]) {
        userStats[sale.userId] = { name: userName, revenue: 0, count: 0, profit: 0 };
      }
      userStats[sale.userId].revenue += sale.totalAmount;
      userStats[sale.userId].count += 1;
      userStats[sale.userId].profit += sale.profit || 0;

      // 2. Estatísticas por Método de Pagamento
      const pm = sale.paymentMethod || 'CASH';
      if (!paymentStats[pm]) {
        paymentStats[pm] = { count: 0, amount: 0 };
      }
      paymentStats[pm].count += 1;
      paymentStats[pm].amount += sale.totalAmount;

      // 3. Estatísticas por Produto (itera cada item da venda)
      (sale.items || []).forEach(item => {
        if (!productStats[item.productId]) {
          // Buscar custo do produto para cálculo de margem
          const prod = products.find(p => p.id === item.productId);
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

        // Calcular custo e lucro do item
        const itemCost = (item.costPrice || 0) * item.quantity;
        productStats[item.productId].cost += itemCost;
        productStats[item.productId].profit += (item.total - itemCost);

        // 4. Recolher datas para cálculo de frequência
        if (!productSaleDates[item.productId]) {
          productSaleDates[item.productId] = [];
        }
        productSaleDates[item.productId].push(new Date(sale.date).getTime());
      });
    });

    // --- PROCESSAR TOP 5 PRODUTOS ---
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        ...p,
        margin: p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : '0'
      }));

    // --- PROCESSAR MELHOR VENDEDOR ---
    const topSeller = Object.values(userStats)
      .sort((a, b) => b.revenue - a.revenue)[0] || null;

    // --- LISTA DE VENDEDORES PARA GRÁFICO ---
    const userStatsList = Object.values(userStats)
      .sort((a, b) => b.revenue - a.revenue);

    // --- PROCESSAR VELOCIDADE DE VENDA (FREQUÊNCIA) ---
    // Calcula a média de dias entre vendas para cada produto
    const turnoverRates = Object.entries(productSaleDates).map(([prodId, dates]) => {
      // Precisa de pelo menos 2 vendas para calcular intervalo
      if (dates.length < 2) return null;

      // Ordenar cronologicamente
      dates.sort((a, b) => a - b);

      // Calcular soma dos intervalos
      let totalGap = 0;
      for (let i = 1; i < dates.length; i++) {
        totalGap += (dates[i] - dates[i - 1]);
      }

      // Média em milissegundos -> converter para dias
      const avgGapMs = totalGap / (dates.length - 1);
      const avgGapDays = avgGapMs / (1000 * 60 * 60 * 24);

      return {
        name: productStats[prodId].name,
        avgDays: avgGapDays,
        totalSales: dates.length
      };
    }).filter(Boolean) as { name: string; avgDays: number; totalSales: number }[];

    // Ordenar pelos que vendem mais rápido (menor tempo entre vendas)
    const fastestSelling = turnoverRates
      .sort((a, b) => a.avgDays - b.avgDays)
      .slice(0, 5);

    // --- PROCESSAR DADOS PARA GRÁFICO DE LINHA (Evolução Diária) ---
    const timeLineDataMap: Record<string, { revenue: number; count: number; profit: number }> = {};

    sales.forEach(s => {
      // Agrupar por dia (formato dd-MM-yyyy)
      const dateKey = formatDateTime(s.date).split(' ')[0];
      if (!timeLineDataMap[dateKey]) {
        timeLineDataMap[dateKey] = { revenue: 0, count: 0, profit: 0 };
      }
      timeLineDataMap[dateKey].revenue += s.totalAmount;
      timeLineDataMap[dateKey].count += 1;
      timeLineDataMap[dateKey].profit += s.profit || 0;
    });

    // Converter para array e ordenar por data
    const timeLineData = Object.entries(timeLineDataMap)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        count: data.count,
        profit: data.profit
      }))
      .sort((a, b) => {
        // Converter dd-MM-yyyy para Date para ordenação
        const [d1, m1, y1] = a.date.split('-').map(Number);
        const [d2, m2, y2] = b.date.split('-').map(Number);
        return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
      })
      .slice(-14); // Últimos 14 dias

    // --- PROCESSAR DADOS DE PAGAMENTO PARA GRÁFICO ---
    const paymentLabels: Record<string, string> = {
      'CASH': 'Dinheiro',
      'CARD': 'Cartão',
      'MBWAY': 'MBWay',
      'TRANSFER': 'Transferência',
      'CHECK': 'Cheque',
      'CREDIT': 'Crédito'
    };

    const paymentChartData = Object.entries(paymentStats).map(([method, data]) => ({
      name: paymentLabels[method] || method,
      value: data.amount,
      count: data.count
    }));

    // --- RETORNAR TODAS AS MÉTRICAS ---
    return {
      totalRevenue,
      totalSalesCount,
      averageTicket,
      totalProfit,
      avgMargin,
      topProducts,
      topSeller,
      fastestSelling,
      timeLineData,
      userStats: userStatsList,
      paymentChartData
    };
  }, [sales, users, products]); // Recalcula apenas quando estes mudam

  // ============================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ============================================

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ========================================
          SECÇÃO 1: KPIs PRINCIPAIS
          Cards com métricas resumidas
      ======================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card: Receita Total */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Receita Total
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(metrics.totalRevenue, currency)}
              </h3>
              {/* Indicador de margem */}
              <p className="text-xs text-gray-500 mt-1">
                Margem: <span className="text-green-600 font-medium">{metrics.avgMargin.toFixed(1)}%</span>
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Card: Lucro Total */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Lucro Estimado
              </p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(metrics.totalProfit, currency)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.totalSalesCount} transações
              </p>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Card: Ticket Médio */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Ticket Médio
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(metrics.averageTicket, currency)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Por transação
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Card: Top Vendedor */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Top Vendedor
              </p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate">
                {metrics.topSeller ? metrics.topSeller.name : 'N/A'}
              </h3>
              <p className="text-xs text-green-600 dark:text-green-400">
                {metrics.topSeller
                  ? `${formatCurrency(metrics.topSeller.revenue, currency)} (${metrics.topSeller.count} vendas)`
                  : '-'
                }
              </p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          SECÇÃO 2: GRÁFICOS PRINCIPAIS
          Evolução diária e Top Produtos
      ======================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfico: Evolução de Vendas (Últimos 14 dias) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-gray-500" />
            Evolução de Vendas
          </h3>

          {/* Container do gráfico com altura fixa */}
          <div className="h-72 w-full">
            {metrics.timeLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.timeLineData}>
                  {/* Grelha de fundo */}
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#374151"
                    opacity={0.1}
                  />
                  {/* Eixo X: Datas */}
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    fontSize={11}
                    stroke="#6B7280"
                  />
                  {/* Eixo Y: Valores */}
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={11}
                    stroke="#6B7280"
                    tickFormatter={(val) => `${val}€`}
                  />
                  {/* Tooltip ao passar o rato */}
                  <Tooltip
                    cursor={{ fill: '#f3f4f6', opacity: 0.4 }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}€`,
                      name === 'revenue' ? 'Receita' : name === 'profit' ? 'Lucro' : name
                    ]}
                    labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                  />
                  {/* Barra de receita */}
                  <Bar
                    dataKey="revenue"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    name="Receita"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Sem dados de vendas para exibir
              </div>
            )}
          </div>
        </div>

        {/* Gráfico: Top 5 Produtos por Receita */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Package className="w-5 h-5 mr-2 text-gray-500" />
            Top 5 Produtos (Receita)
          </h3>

          <div className="h-72 w-full">
            {metrics.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={metrics.topProducts}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    stroke="#374151"
                    opacity={0.1}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 11 }}
                    stroke="#6B7280"
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}€`,
                      name === 'revenue' ? 'Receita' : 'Lucro'
                    ]}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#10B981"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                    name="Receita"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Sem dados de produtos para exibir
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================
          SECÇÃO 3: ANÁLISE DETALHADA
          Vendedores, Métodos de Pagamento, Rotação
      ======================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Gráfico Circular: Performance por Vendedor */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-gray-500" />
            Vendas por Colaborador
          </h3>

          <div className="h-64">
            {metrics.userStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.userStats}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, percent }) =>
                      `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {metrics.userStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)}€`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Sem dados de vendedores
              </div>
            )}
          </div>
        </div>

        {/* Tabela: Velocidade de Venda (Rotação de Stock) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-500" />
            Velocidade de Venda
            <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              Média de dias entre vendas
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Vendas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Frequência
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Rotação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {metrics.fastestSelling.length > 0 ? (
                  metrics.fastestSelling.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300">
                        {item.totalSales}x
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                        A cada <span className="font-bold text-blue-600">{item.avgDays.toFixed(1)}</span> dias
                      </td>
                      <td className="px-4 py-3 text-right">
                        {/* Badge de rotação baseado na velocidade */}
                        <span className={`px-2 py-1 text-xs rounded-full ${item.avgDays < 2
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : item.avgDays < 7
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                          {item.avgDays < 2 ? 'Alta' : item.avgDays < 7 ? 'Média' : 'Baixa'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      Dados insuficientes para calcular frequência de vendas.
                      <br />
                      <span className="text-xs">São necessárias pelo menos 2 vendas do mesmo produto.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================
          SECÇÃO 4: MÉTODOS DE PAGAMENTO
      ======================================== */}
      {metrics.paymentChartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-gray-500" />
            Vendas por Método de Pagamento
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {metrics.paymentChartData.map((pm, idx) => (
              <div
                key={pm.name}
                className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 text-center"
                style={{ borderLeftColor: COLORS[idx % COLORS.length], borderLeftWidth: '4px' }}
              >
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {pm.name}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(pm.value, currency)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {pm.count} {pm.count === 1 ? 'transação' : 'transações'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Exportação padrão do componente
export default SalesDashboard;