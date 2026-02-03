import { supabase } from './supabaseClient';
import { Product, User, Customer, Sale, Supplier, PurchaseOrder, HistoryEntry } from './types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Mapeamento de dados (Base de dados -> App)
const mapProduct = (p: any): Product => ({
  id: p.id,
  sku: p.sku,
  name: p.name,
  category: p.category,
  quantity: p.quantity,
  minStock: p.min_stock,
  maxStock: p.max_stock,
  location: p.location,
  serialNumber: p.serial_number,
  batchNumber: p.batch_number,
  price: Number(p.price),
  costPrice: Number(p.cost_price),
  supplierId: p.supplier_id,
  updatedAt: p.updated_at
});

const mapToDbProduct = (p: Product) => ({
  id: p.id,
  sku: p.sku,
  name: p.name,
  category: p.category,
  quantity: p.quantity,
  min_stock: p.minStock,
  max_stock: p.maxStock,
  location: p.location,
  serial_number: p.serialNumber,
  batch_number: p.batchNumber,
  price: p.price,
  cost_price: p.costPrice,
  supplier_id: p.supplierId,
  updated_at: new Date().toISOString()
});

export const api = {
  // --- Carregar Dados Iniciais ---
  getInitialData: async () => {
    try {
      const [products, users, customers, suppliers, sales, purchases, history] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('app_users').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('purchase_orders').select('*'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(100)
      ]);

      return {
        products: products.data?.map(mapProduct) || [],
        users: users.data || [],
        customers: customers.data?.map((c: any) => ({...c, postalCode: c.postal_code})) || [],
        sales: sales.data?.map((s: any) => ({
             ...s, 
             customerName: s.customer_name, 
             customerNif: s.customer_nif,
             totalAmount: Number(s.total_amount),
             userId: s.user_id,
             items: s.items 
        })) || [],
        suppliers: suppliers.data || [],
        purchaseOrders: purchases.data?.map((p: any) => ({
            ...p, 
            supplierId: p.supplier_id, 
            supplierName: p.supplier_name,
            totalAmount: Number(p.total_amount)
        })) || [],
        history: history.data?.map((h: any) => ({
             ...h, 
             userId: h.user_id, 
             userName: h.user_name,
             productId: h.product_id,
             productName: h.product_name
        })) || []
      };
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      return { products: [], users: [], customers: [], sales: [], suppliers: [], purchaseOrders: [], history: [] };
    }
  },

  // --- Login ---
  login: async (id: string, password: string) => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', id)
      .eq('password', password)
      .single();

    if (error || !data) {
      return { success: false, message: 'ID ou Password incorretos.' };
    }
    return { success: true, user: data as User };
  },

  // --- Produtos ---
  saveProduct: async (product: Product) => {
    const dbData = mapToDbProduct(product);
    const { error } = await supabase.from('products').upsert(dbData);
    return { success: !error };
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return { success: !error };
  },

  // --- Vendas ---
  saveSale: async (sale: Sale) => {
    const dbSale = {
      id: sale.id,
      customer_name: sale.customerName,
      customer_nif: sale.customerNif,
      customer_email: sale.customerEmail,
      customer_phone: sale.customerPhone,
      customer_address: sale.customerAddress,
      customer_postal_code: sale.customerPostalCode,
      date: new Date().toISOString(),
      total_amount: sale.totalAmount,
      user_id: sale.userId,
      items: sale.items
    };

    // 1. Guardar Venda
    const { error: saleError } = await supabase.from('sales').insert(dbSale);
    if (saleError) return { success: false };

    // 2. Atualizar Stock
    for (const item of sale.items) {
        const { data: prod } = await supabase.from('products').select('quantity').eq('id', item.productId).single();
        if (prod) {
            await supabase.from('products').update({ quantity: prod.quantity - item.quantity }).eq('id', item.productId);
        }
    }
    return { success: true };
  },

  // --- Clientes ---
  saveCustomer: async (customer: Customer) => {
    // CORREÇÃO: Criar um objeto limpo apenas com as colunas que existem na DB
    const dbCust = { 
      id: customer.id,
      name: customer.name,
      nif: customer.nif,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      postal_code: customer.postalCode // Mapear camelCase para snake_case
    };
    
    const { error } = await supabase.from('customers').upsert(dbCust);
    
    if (error) {
      console.error("Erro ao guardar cliente:", error);
      return { success: false };
    }
    return { success: true };
  },

  deleteCustomer: async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    return { success: !error };
  },

  // --- Fornecedores ---
  saveSupplier: async (supplier: Supplier) => {
    const { error } = await supabase.from('suppliers').upsert(supplier);
    return { success: !error };
  },

  deleteSupplier: async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    return { success: !error };
  },

  // --- Utilizadores ---
  saveUser: async (user: User) => {
    const { error } = await supabase.from('app_users').upsert(user);
    return { success: !error };
  },

  deleteUser: async (id: string) => {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    return { success: !error };
  },

  // --- Encomendas ---
  savePurchaseOrder: async (po: PurchaseOrder) => {
    const dbPO = {
        id: po.id,
        supplier_id: po.supplierId,
        supplier_name: po.supplierName,
        date: po.date,
        status: po.status,
        items: po.items,
        total_amount: po.totalAmount
    };
    const { error } = await supabase.from('purchase_orders').upsert(dbPO);
    return { success: !error };
  },

  updatePurchaseOrderStatus: async (id: string, status: string) => {
    const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id);
    return { success: !error };
  },

  // --- Histórico ---
  saveHistoryEntry: async (entry: HistoryEntry) => {
    const dbEntry = {
        id: entry.id,
        user_id: entry.userId,
        user_name: entry.userName,
        product_id: entry.productId,
        product_name: entry.productName,
        action: entry.action,
        timestamp: new Date().toISOString(),
        details: entry.details
    };
    const { error } = await supabase.from('history').insert(dbEntry);
    return { success: !error };
  },

  // --- PDF Local ---
  generateInvoicePDF: async (sale: Sale) => {
    try {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("FATURA / RECIBO", 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Fatura Nº: ${sale.id}`, 14, 30);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')}`, 14, 35);
        
        doc.text("Cliente:", 14, 45);
        doc.setFont("helvetica", "bold");
        doc.text(`${sale.customerName}`, 14, 50);
        doc.setFont("helvetica", "normal");
        if(sale.customerNif) doc.text(`NIF: ${sale.customerNif}`, 14, 55);

        const tableBody = sale.items.map(item => [
            item.productName,
            item.quantity.toString(),
            `${item.unitPrice.toFixed(2)}€`,
            `${item.total.toFixed(2)}€`
        ]);

        autoTable(doc, {
            startY: 70,
            head: [['Produto', 'Qtd', 'Preço Unit', 'Total']],
            body: tableBody,
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`TOTAL: ${sale.totalAmount.toFixed(2)}€`, 150, finalY, { align: 'right' });

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        return { success: true, url: pdfUrl };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Erro ao gerar PDF" };
    }
  }
};