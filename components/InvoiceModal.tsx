import React, { useState } from 'react';
import { X, Printer, FileDown, Loader } from 'lucide-react';
import { Sale, AppSettings, PaymentMethod } from '../types';
import { api } from '../api';
import { formatDateTime } from '../utils/dateUtils';

// Helper to display payment method in Portuguese
const getPaymentMethodLabel = (method: PaymentMethod | undefined): string => {
  switch (method) {
    case 'CASH': return 'Dinheiro';
    case 'CARD': return 'Cartão';
    case 'MULTIBANCO': return 'Multibanco';
    case 'MBWAY': return 'MBWay';
    default: return 'N/D';
  }
};

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  settings: AppSettings;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, sale, settings }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    if (printContent) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Fatura</title>');
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write('</head><body >');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await api.generateInvoicePDF(sale);
      if (result.success && result.url) {
        // Open the generated PDF URL in a new tab
        window.open(result.url, '_blank');
      } else {
        alert("Erro: " + (result.error || "Falha ao gerar URL"));
      }
    } catch (e) {
      alert("Erro ao gerar PDF: " + e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Calculate tax breakdown
  const taxRate = settings.taxRate / 100;
  const subTotal = sale.totalAmount / (1 + taxRate);
  const taxAmount = sale.totalAmount - subTotal;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
          {/* Header Controls */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Fatura #{sale.id}</h3>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 flex items-center gap-1 text-sm font-medium disabled:opacity-50"
                title="Gerar PDF"
              >
                {isGeneratingPdf ? <Loader className="w-4 h-4 animate-spin" /> : <FileDown className="w-5 h-5" />}
                PDF
              </button>
              <button onClick={handlePrint} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2" title="Imprimir">
                <Printer className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-8 bg-white" id="invoice-content">
            <div className="border border-gray-200 p-8 rounded-lg">
              {/* Invoice Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">FATURA</h1>
                  <p className="text-sm text-gray-500 mt-1">Ref: {sale.id}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-blue-600">{settings.companyName}</h2>
                  <p className="text-sm text-gray-500">{settings.companyAddress}</p>
                  <p className="text-sm text-gray-500">NIF: {settings.companyNif}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-8 border-b border-gray-100 pb-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Faturar a:</p>
                    <p className="text-lg font-medium text-gray-900 mt-1">{sale.customerName}</p>
                    {sale.customerNif && <p className="text-sm text-gray-600">NIF: {sale.customerNif}</p>}

                    {(sale.customerAddress || sale.customerEmail) && (
                      <div className="mt-2 space-y-0.5">
                        {sale.customerAddress && <p className="text-sm text-gray-600">{sale.customerAddress}</p>}
                        {sale.customerPostalCode && <p className="text-sm text-gray-600">{sale.customerPostalCode}</p>}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Data:</p>
                      <p className="text-lg font-medium text-gray-900 mt-1">{formatDateTime(sale.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pagamento:</p>
                      <p className="text-lg font-medium text-blue-600 mt-1">{getPaymentMethodLabel(sale.paymentMethod)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <table className="min-w-full mb-8">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Descrição</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-600">Qtd</th>
                    <th className="text-right py-3 text-sm font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-4 text-sm text-gray-800">{item.productName}</td>
                      <td className="py-4 text-right text-sm text-gray-600">{item.quantity}</td>
                      <td className="py-4 text-right text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: settings.currency }).format(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: settings.currency }).format(subTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">IVA ({settings.taxRate}%)</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: settings.currency }).format(taxAmount)}
                    </span>
                  </div>
                  {sale.discountAmount && sale.discountAmount > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100 text-green-600">
                      <span className="flex flex-col">
                        <span>Desconto</span>
                        {sale.discountReason && <span className="text-xs text-green-500">{sale.discountReason}</span>}
                      </span>
                      <span className="font-medium">
                        -{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: settings.currency }).format(sale.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-4">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-blue-600">
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: settings.currency }).format(sale.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};