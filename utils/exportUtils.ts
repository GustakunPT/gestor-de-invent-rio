import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Sale, Customer, AppSettings } from '../types';

/**
 * Exporta dados para CSV
 */
export const exportToCsv = <T extends Record<string, any>>(
    data: T[],
    filename: string,
    headers: { key: keyof T; label: string }[]
) => {
    const headerRow = headers.map(h => h.label).join(';');
    const dataRows = data.map(row =>
        headers.map(h => {
            const value = row[h.key];
            // Escapar vírgulas e aspas
            if (typeof value === 'string' && (value.includes(';') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
        }).join(';')
    );

    const csvContent = [headerRow, ...dataRows].join('\n');

    // BOM para UTF-8
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
};

/**
 * Exporta inventário para PDF
 */
export const exportProductsToPdf = (products: Product[], settings: AppSettings) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName, 14, 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Inventário', 14, 28);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 14, 35);
    doc.text(`Total de Produtos: ${products.length}`, 14, 41);

    // Estatísticas
    const totalValue = products.reduce((a, p) => a + (p.price * p.quantity), 0);
    const lowStock = products.filter(p => p.quantity <= p.minStock).length;

    doc.text(`Valor Total em Stock: ${totalValue.toFixed(2)}€`, 100, 35);
    doc.text(`Produtos com Stock Baixo: ${lowStock}`, 100, 41);

    // Tabela
    autoTable(doc, {
        startY: 50,
        head: [['SKU', 'Produto', 'Categoria', 'Stock', 'Mín', 'Preço', 'Valor Stock']],
        body: products.map(p => [
            p.sku || '-',
            p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name,
            p.category,
            p.quantity.toString(),
            p.minStock.toString(),
            `${p.price.toFixed(2)}€`,
            `${(p.price * p.quantity).toFixed(2)}€`
        ]),
        foot: [[
            '', '', 'TOTAL:',
            products.reduce((a, p) => a + p.quantity, 0).toString(),
            '',
            '',
            `${totalValue.toFixed(2)}€`
        ]],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] }
    });

    doc.save(`inventario_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Exporta relatório de vendas para PDF
 */
export const exportSalesReport = (
    sales: Sale[],
    startDate: Date,
    endDate: Date,
    settings: AppSettings
) => {
    const doc = new jsPDF();

    // Filtrar vendas por período
    const filteredSales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= startDate && saleDate <= endDate;
    });

    const totalRevenue = filteredSales.reduce((a, s) => a + s.totalAmount, 0);
    const totalProfit = filteredSales.reduce((a, s) => a + (s.profit || 0), 0);
    const avgTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName, 14, 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Vendas', 14, 28);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Período: ${startDate.toLocaleDateString('pt-PT')} a ${endDate.toLocaleDateString('pt-PT')}`, 14, 35);

    // KPIs
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(`Total de Vendas: ${filteredSales.length}`, 14, 48);
    doc.text(`Receita Total: ${totalRevenue.toFixed(2)}€`, 14, 55);
    doc.text(`Lucro Estimado: ${totalProfit.toFixed(2)}€`, 100, 48);
    doc.text(`Ticket Médio: ${avgTicket.toFixed(2)}€`, 100, 55);

    // Tabela
    autoTable(doc, {
        startY: 65,
        head: [['ID', 'Data', 'Cliente', 'Itens', 'Total', 'Pagamento']],
        body: filteredSales.map(s => [
            s.id.slice(-8),
            new Date(s.date).toLocaleDateString('pt-PT'),
            s.customerName.length > 25 ? s.customerName.substring(0, 25) + '...' : s.customerName,
            s.items.length.toString(),
            `${s.totalAmount.toFixed(2)}€`,
            s.paymentMethod || 'N/A'
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94], textColor: 255 }
    });

    doc.save(`vendas_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`);
};

/**
 * Exporta lista de clientes para PDF
 */
export const exportCustomersToPdf = (customers: Customer[], settings: AppSettings) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName, 14, 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Lista de Clientes', 14, 28);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Total: ${customers.length} clientes`, 14, 35);

    autoTable(doc, {
        startY: 45,
        head: [['Nome', 'NIF', 'Email', 'Telefone', 'Morada']],
        body: customers.map(c => [
            c.name,
            c.nif || '-',
            c.email || '-',
            c.phone || '-',
            c.address ? (c.address.length > 30 ? c.address.substring(0, 30) + '...' : c.address) : '-'
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246], textColor: 255 }
    });

    doc.save(`clientes_${new Date().toISOString().split('T')[0]}.pdf`);
};
