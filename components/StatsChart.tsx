import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Product } from '../types';

interface StatsChartProps {
  products: Product[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const StatsChart: React.FC<StatsChartProps> = ({ products }) => {
  const data = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    
    products.forEach(p => {
      if (!categoryCount[p.category]) {
        categoryCount[p.category] = 0;
      }
      categoryCount[p.category] += p.quantity;
    });

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      Quantidade: value
    })).sort((a, b) => b.Quantidade - a.Quantidade);
  }, [products]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} />
        <Tooltip 
          cursor={{ fill: 'transparent' }}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        />
        <Legend />
        <Bar dataKey="Quantidade" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};