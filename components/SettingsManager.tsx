import React from 'react';
import { Settings, Save, Building, Coins, FileSpreadsheet, Download } from 'lucide-react';
import { AppSettings, Sale, Product, Customer } from '../types';
import { api } from '../api';
import { generateSaftXml } from '../utils/saftGenerator';
import { useTenant } from '../contexts/TenantContext';

interface SettingsManagerProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = React.useState<AppSettings>(settings);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const { tenant } = useTenant();

  // SAFT State
  const [saftMonth, setSaftMonth] = React.useState(new Date().getMonth() + 1);
  const [saftYear, setSaftYear] = React.useState(new Date().getFullYear());

  const handleGenerateSaft = async () => {
    if (!tenant) return;

    try {
      // 1. Calculate Period
      const startDate = new Date(saftYear, saftMonth - 1, 1);
      const endDate = new Date(saftYear, saftMonth, 0); // Last day of month

      // 2. Fetch all necessary data
      // Note: In a real app we might need pagination or specific date-range queries
      // For this implementation we are fetching initialData which is already loaded
      // Ideally we would have api.getSalesByDateRange(start, end)
      const data = await api.getInitialData();

      // 3. Generate XML
      const xmlContent = generateSaftXml({
        company: tenant,
        sales: data.sales || [],
        products: data.products || [],
        customers: data.customers || [],
        startDate,
        endDate,
        fiscalYear: saftYear
      });

      // 4. Download File
      const blob = new Blob([xmlContent], { type: 'text/xml' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `SAFT_${tenant.nif || '999'}_${saftYear}_${saftMonth.toString().padStart(2, '0')}.xml`;
      link.click();
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error('Error generating SAFT:', error);
      alert('Erro ao gerar ficheiro SAFT. Verifique a consola para detalhes.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'taxRate' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
          <Settings className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configurações do Sistema</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Tax Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-500" />
              Fiscalidade e Moeda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Taxa de IVA Padrão (%)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="taxRate"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    className="block w-full pr-12 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    value={formData.taxRate}
                    onChange={handleChange}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Usado para calcular o IVA nas faturas de venda.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Símbolo da Moeda
                </label>
                <input
                  type="text"
                  name="currency"
                  className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  value={formData.currency}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-6"></div>

          {/* Company Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-500" />
              Dados da Empresa (para Faturação)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  name="companyName"
                  className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Morada Completa
                </label>
                <input
                  type="text"
                  name="companyAddress"
                  className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  value={formData.companyAddress}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NIF da Empresa
                </label>
                <input
                  type="text"
                  name="companyNif"
                  className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  value={formData.companyNif}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-6"></div>

          {/* SAFT Export Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              Exportação Legal (SAFT-PT)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gere o ficheiro XML obrigatório para a Autoridade Tributária. O ficheiro deve ser submetido até ao dia 5 do mês seguinte.
            </p>

            <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mês
                </label>
                <select
                  value={saftMonth}
                  onChange={(e) => setSaftMonth(parseInt(e.target.value))}
                  className="block w-40 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('pt-PT', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ano
                </label>
                <select
                  value={saftYear}
                  onChange={(e) => setSaftYear(parseInt(e.target.value))}
                  className="block w-24 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateSaft}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                title="Descarregar XML SAFT-PT 1.04"
              >
                <Download className="w-4 h-4" />
                Gerar SAFT
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-6"></div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Configurações
            </button>
          </div>

          {showSuccess && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Configurações atualizadas com sucesso!
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};