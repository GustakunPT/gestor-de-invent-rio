import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie
} from 'recharts';
import { Product } from '../types';

interface DashboardChartsProps {
  products: Product[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ products }) => {
  
  // Data for Bar Chart (Stock by Category)
  const categoryData = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    products.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + p.quantity;
    });
    return Object.entries(categoryCount)
      .map(([name, value]) => ({ name, Quantidade: value }))
      .sort((a, b) => b.Quantidade - a.Quantidade);
  }, [products]);

  // Data for Pie Chart (Value by Category)
  const valueData = useMemo(() => {
    const categoryValue: Record<string, number> = {};
    products.forEach(p => {
      categoryValue[p.category] = (categoryValue[p.category] || 0) + (p.price * p.quantity);
    });
    return Object.entries(categoryValue)
      .map(([name, value]) => ({ name, value }));
  }, [products]);

  // NEW: Top 5 Products by Value
  const topProductsData = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
      .slice(0, 5)
      .map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        value: p.price * p.quantity
      }));
  }, [products]);

  // NEW: Stock Status Distribution
  const statusData = useMemo(() => {
    let low = 0;
    let normal = 0;
    let out = 0;
    products.forEach(p => {
      if (p.quantity === 0) out++;
      else if (p.quantity <= p.minStock) low++;
      else normal++;
    });
    return [
      { name: 'Normal', value: normal, color: '#10b981' },
      { name: 'Baixo', value: low, color: '#f59e0b' },
      { name: 'Esgotado', value: out, color: '#ef4444' }
    ].filter(i => i.value > 0);
  }, [products]);

  // Mock Trend Data
  const trendData = [
    { name: 'Jan', MediaPreco: 400 },
    { name: 'Fev', MediaPreco: 420 },
    { name: 'Mar', MediaPreco: 410 },
    { name: 'Abr', MediaPreco: 450 },
    { name: 'Mai', MediaPreco: 460 },
    { name: 'Jun', MediaPreco: products.length > 0 ? products.reduce((acc, p) => acc + p.price, 0) / products.length : 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quantidade por Categoria */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock por Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#9ca3af" />
                <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#9ca3af" />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6', opacity: 0.1 }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                />
                <Bar dataKey="Quantidade" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição de Valor */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Valor em Stock (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={valueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {valueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estado do Inventário */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estado do Inventário</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

         {/* Top 5 Produtos por Valor */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 5 Produtos (Valor Total)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topProductsData}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.3} />
                <XAxis type="number" axisLine={false} tickLine={false} fontSize={12} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} fontSize={12} stroke="#9ca3af" />
                <Tooltip 
                   cursor={{ fill: '#f3f4f6', opacity: 0.1 }} 
                   contentStyle={{ borderRadius: '8px', border: 'none' }} 
                   formatter={(value: number) => `${value.toLocaleString()}€`}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#8b5cf6" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Tendência de Preço (Simulado) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tendência Média de Preços (Semestral)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#9ca3af" />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}€`} stroke="#9ca3af" />
              <Tooltip formatter={(value) => [`${value}€`, 'Preço Médio']} contentStyle={{ borderRadius: '8px', border: 'none' }} />
              <Legend />
              <Line type="monotone" dataKey="MediaPreco" name="Preço Médio" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};