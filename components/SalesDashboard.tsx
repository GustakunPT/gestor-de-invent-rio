import React, { useMemo } from 'react';
import { Sale, User } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, CreditCard, Calendar, Clock, Award } from 'lucide-react';

interface SalesDashboardProps {
  sales: Sale[];
  users: User[]; // Necessário para identificar o nome do vendedor
  currency: string;
}

// Utilitário de formatação de data estrito: dd-MM-yyyy HH:mm
const formatDateTime = (dateInput: string | Date | number) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ sales, users, currency }) => {
  
  // --- Cálculos e Métricas ---
  const metrics = useMemo(() => {
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalSalesCount = sales.length;
    const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    // 1. Vendas por Artigo (Top 5)
    const productStats: Record<string, { name: string, quantity: number, revenue: number }> = {};
    
    // 2. Vendas por User
    const userStats: Record<string, { name: string, revenue: number, count: number }> = {};

    // 3. Frequência de Venda (Tempo entre vendas)
    // Mapa: ProductID -> Array de datas de venda (timestamps)
    const productSaleDates: Record<string, number[]> = {};

    sales.forEach(sale => {
      // Stats por User
      const userName = users.find(u => u.id === sale.userId)?.name || 'Desconhecido';
      if (!userStats[sale.userId]) {
        userStats[sale.userId] = { name: userName, revenue: 0, count: 0 };
      }
      userStats[sale.userId].revenue += sale.totalAmount;
      userStats[sale.userId].count += 1;

      // Stats por Produto
      sale.items.forEach(item => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue += item.total;

        // Recolher datas para cálculo de frequência
        if (!productSaleDates[item.productId]) productSaleDates[item.productId] = [];
        productSaleDates[item.productId].push(new Date(sale.date).getTime());
      });
    });

    // Processar Top Produtos
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Processar Melhor Vendedor
    const topSeller = Object.values(userStats).sort((a, b) => b.revenue - a.revenue)[0];

    // Processar Tempo Médio de Venda (Frequência)
    // Calcula a média de dias entre vendas para cada produto
    const turnoverRates = Object.entries(productSaleDates).map(([prodId, dates]) => {
      if (dates.length < 2) return null; // Precisa de pelo menos 2 vendas para calcular intervalo
      
      dates.sort((a, b) => a - b); // Ordenar cronologicamente
      let totalGap = 0;
      for (let i = 1; i < dates.length; i++) {
        totalGap += (dates[i] - dates[i-1]);
      }
      const avgGapMs = totalGap / (dates.length - 1);
      const avgGapDays = avgGapMs / (1000 * 60 * 60 * 24);
      
      return {
        name: productStats[prodId].name,
        avgDays: avgGapDays
      };
    }).filter(Boolean) as { name: string, avgDays: number }[];

    // Ordenar pelos que vendem mais rápido (menor tempo entre vendas)
    const fastestSelling = turnoverRates.sort((a, b) => a.avgDays - b.avgDays).slice(0, 5);

    // Gráfico de Linha (Vendas Cronológicas)
    const timeLineDataMap: Record<string, number> = {};
    sales.forEach(s => {
        const dateKey = formatDateTime(s.date).split(' ')[0]; // Agrupar por dia dd-MM-yyyy
        timeLineDataMap[dateKey] = (timeLineDataMap[dateKey] || 0) + s.totalAmount;
    });
    // Converter para array e ordenar (necessário converter dataKey de volta para ordenar corretamente)
    const timeLineData = Object.entries(timeLineDataMap)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => {
            const [d1, m1, y1] = a.date.split('-').map(Number);
            const [d2, m2, y2] = b.date.split('-').map(Number);
            return new Date(y1, m1-1, d1).getTime() - new Date(y2, m2-1, d2).getTime();
        })
        .slice(-10); // Últimos 10 dias ativos

    return { 
      totalRevenue, 
      totalSalesCount, 
      averageTicket, 
      topProducts, 
      topSeller,
      fastestSelling,
      timeLineData,
      userStats: Object.values(userStats)
    };
  }, [sales, users]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Receita Total</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(metrics.totalRevenue)}
              </h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ticket Médio</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(metrics.averageTicket)}
              </h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Card: Melhor Vendedor */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Vendedor</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate">
                {metrics.topSeller ? metrics.topSeller.name : '-'}
              </h3>
              <p className="text-xs text-green-600 dark:text-green-400">
                {metrics.topSeller ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(metrics.topSeller.revenue) : '0€'}
              </p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transações</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.totalSalesCount}</h3>
            </div>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Evolução Diária */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-gray-500" />
            Evolução de Vendas (Últimos dias)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.timeLineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} stroke="#6B7280" />
                <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#6B7280" tickFormatter={(val) => `${val}€`} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6', opacity: 0.4 }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(2)}€`, 'Vendas']}
                  labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Valor Vendido" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Top Produtos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2 text-gray-500" />
            Top 5 Produtos (Receita)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={metrics.topProducts}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#374151" opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11}} stroke="#6B7280" />
                <Tooltip 
                   formatter={(value: number) => [`${value.toFixed(2)}€`, 'Receita']}
                   contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. Secção Inferior: Performance de Vendedor e Velocidade de Venda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance por Vendedor (Pie Chart) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
             <Users className="w-5 h-5 mr-2 text-gray-500" />
             Vendas por Colaborador
           </h3>
           <div className="h-64">
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
                   label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                 >
                   {metrics.userStats.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip formatter={(value: number) => `${value.toFixed(2)}€`} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Frequência de Venda (Tempo de Stock) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
             <Clock className="w-5 h-5 mr-2 text-gray-500" />
             Velocidade de Venda (Top Frequência)
             <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
               Média de dias entre vendas do mesmo artigo
             </span>
           </h3>
           
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
               <thead>
                 <tr>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Freq. Média</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                 {metrics.fastestSelling.length > 0 ? metrics.fastestSelling.map((item, idx) => (
                   <tr key={idx}>
                     <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{item.name}</td>
                     <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                       A cada <span className="font-bold text-blue-600">{item.avgDays.toFixed(1)}</span> dias
                     </td>
                     <td className="px-4 py-3 text-right">
                       <span className={`px-2 py-1 text-xs rounded-full ${
                         item.avgDays < 2 ? 'bg-green-100 text-green-800' : 
                         item.avgDays < 7 ? 'bg-blue-100 text-blue-800' : 
                         'bg-gray-100 text-gray-800'
                       }`}>
                         {item.avgDays < 2 ? 'Alta Rotação' : item.avgDays < 7 ? 'Média Rotação' : 'Baixa Rotação'}
                       </span>
                     </td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                       Dados insuficientes para calcular frequência de vendas.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  );
};