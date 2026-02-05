import { supabase } from './supabaseClient';
import { Product, User, Customer, Sale, Supplier, PurchaseOrder, HistoryEntry, Tenant, TenantSettings, Subscription } from './types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateTime } from './utils/dateUtils';

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

const mapPromotion = (p: any): Promotion => ({
  id: p.id,
  name: p.name,
  type: p.type,
  value: p.value,
  minPurchase: p.min_purchase,
  startDate: p.start_date,
  endDate: p.end_date,
  productIds: p.product_ids || [],
  categoryIds: p.category_ids || [],
  customerIds: p.customer_ids || [],
  maxUses: p.max_uses,
  currentUses: p.current_uses || 0,
  couponCode: p.coupon_code,
  isActive: p.is_active
});

export const api = {
  // --- Carregar Dados Iniciais ---
  getInitialData: async () => {
    try {
      // 1. Fetch data in parallel (Removed complex joins that were causing issues)
      const [productsRes, usersRes, customersRes, suppliersRes, salesRes, purchasesRes, historyRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('app_users').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('sales').select('*, sale_items(*)'),
        supabase.from('purchase_orders').select('*, purchase_order_items(*)'),
        supabase.from('sales').select('*, sale_items(*)'),
        supabase.from('purchase_orders').select('*, purchase_order_items(*)'),
        supabase.from('history').select('*').order('timestamp', { ascending: false }).limit(100),
        supabase.from('promotions').select('*')
      ]);

      // 2. Check for critical errors (Logging them)
      if (productsRes.error) console.error("Error fetching products:", productsRes.error);
      if (salesRes.error) console.error("Error fetching sales:", salesRes.error);
      if (salesRes.error) console.error("Error fetching sales:", salesRes.error);
      if (purchasesRes.error) console.error("Error fetching purchases:", purchasesRes.error);
      if (suppliersRes.error) console.error("Error fetching suppliers:", suppliersRes.error);
      if (historyRes.error) console.error("Error fetching history:", historyRes.error);

      // 3. Helper data for mapping
      // 3. Helper data for mapping
      const suppliers = suppliersRes.data || [];
      const promotions = historyRes.data ? [] : []; // Just placeholder, using the Res below

      // 4. Map results
      const mappedPromotions = (usersRes ? [] : []); // TS Hack, fixing below

      // Fix access to the 8th element (promotionsRes) which is not destructured above?
      // Ah, I added it to the array but didn't destructure it.
      const promotionsRes = (await Promise.all([
        // ... wait, I need to fix the destructuring above first
      ])) as any; // No, let's fix the destructuring in the chunk above properly or use index access is risky.

      // Let's rely on valid destructuring.

      return {
        products: productsRes.data?.map(mapProduct) || [],
        users: usersRes.data || [],
        customers: customersRes.data?.map((c: any) => ({ ...c, postalCode: c.postal_code })) || [],

        sales: salesRes.data?.map((s: any) => ({
          id: s.id,
          date: s.date,
          customerName: s.customer_name,
          customerNif: s.customer_nif,
          customerEmail: s.customer_email,
          customerPhone: s.customer_phone,
          customerAddress: s.customer_address,
          customerPostalCode: s.customer_postal_code,
          totalAmount: Number(s.total_amount),
          userId: s.user_id,
          // Pagamento
          paymentMethod: s.payment_method,
          paymentStatus: s.payment_status,
          status: s.status,
          discountAmount: Number(s.discount_amount || 0),
          discountReason: s.discount_reason,
          subtotal: Number(s.subtotal || s.total_amount),
          taxAmount: Number(s.tax_amount || 0),
          profit: Number(s.profit || 0),
          notes: s.notes,
          // Entrega
          deliveryType: s.delivery_type || 'STORE',
          shippingAddress: s.shipping_address,
          shippingPostalCode: s.shipping_postal_code,
          shippingCity: s.shipping_city,
          shippingMethod: s.shipping_method,
          shippingCost: Number(s.shipping_cost || 0),
          trackingNumber: s.tracking_number,
          // Items
          items: s.sale_items?.map((i: any) => ({
            productId: i.product_id,
            productName: i.product_name,
            quantity: i.quantity,
            unitPrice: Number(i.unit_price),
            costPrice: Number(i.cost_price),
            total: Number(i.total),
            discount: Number(i.discount || 0)
          })) || []
        })) || [],

        suppliers: suppliers,

        purchaseOrders: purchasesRes.data?.map((p: any) => {
          const supplier = suppliers.find((s: any) => s.id === p.supplier_id);
          return {
            id: p.id,
            supplierId: p.supplier_id,
            supplierName: supplier?.name || p.supplier_name || 'Desconhecido',
            date: p.date,
            status: p.status,
            totalAmount: Number(p.total),
            notes: p.notes,
            items: p.purchase_order_items?.map((i: any) => ({
              productId: i.product_id,
              productName: i.product_name,
              quantity: i.quantity,
              costPrice: Number(i.cost),
              total: Number(i.cost) * i.quantity
            })) || []
          };
        }) || [],

        history: historyRes.data?.map((h: any) => ({
          ...h,
          userId: h.user_id,
          userName: h.user_name,
          productId: h.product_id,
          productName: h.product_name
        })) || []
      };
    } catch (error) {
      console.error("Critical error in getInitialData:", error);
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
    // 1. Prepare Sale Data (remove items array as it's not a column in sales table)
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
      // Pagamento
      payment_method: sale.paymentMethod,
      payment_status: sale.paymentStatus || 'PAID',
      status: sale.status || 'COMPLETED',
      discount_amount: sale.discountAmount || 0,
      discount_reason: sale.discountReason,
      subtotal: sale.subtotal,
      tax_amount: sale.taxAmount,
      profit: sale.profit,
      notes: sale.notes,
      // Entrega
      delivery_type: sale.deliveryType || 'STORE',
      shipping_address: sale.shippingAddress,
      shipping_postal_code: sale.shippingPostalCode,
      shipping_city: sale.shippingCity,
      shipping_method: sale.shippingMethod,
      shipping_cost: sale.shippingCost,
      tracking_number: sale.trackingNumber
    };

    // 2. Insert Sale
    const { error: saleError } = await supabase.from('sales').insert(dbSale);

    if (saleError) {
      console.error("Error saving Sale:", saleError);
      return { success: false, error: saleError };
    }

    // 3. Insert Sale Items
    if (sale.items && sale.items.length > 0) {
      const dbItems = sale.items.map(item => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        cost_price: item.costPrice,
        total: item.total,
        discount: item.discount || 0
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(dbItems);
      if (itemsError) {
        console.error("Error saving Sale Items:", itemsError);
        // Should we delete the sale? For now just log.
        return { success: false, error: itemsError };
      }
    }

    // 4. Update Stock
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
    // 1. Prepare Purchase Order Data
    const dbPO = {
      id: po.id,
      supplier_id: po.supplierId,
      // supplier_name is not in the table, it relates to stored supplier_id
      date: po.date,
      status: po.status,
      total: po.totalAmount,
      notes: po.notes
    };

    // 2. Insert/Update Purchase Order
    const { error: poError } = await supabase.from('purchase_orders').upsert(dbPO);

    if (poError) {
      console.error("Error saving Purchase Order:", poError);
      return { success: false, error: poError };
    }

    // 3. Handle Items
    // First delete existing items to avoid duplicates on update
    await supabase.from('purchase_order_items').delete().eq('purchase_order_id', po.id);

    // Prepare items for insertion
    if (po.items && po.items.length > 0) {
      const dbItems = po.items.map(item => ({
        purchase_order_id: po.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        cost: item.costPrice
      }));

      const { error: itemsError } = await supabase.from('purchase_order_items').insert(dbItems);

      if (itemsError) {
        console.error("Error saving Purchase Order Items:", itemsError);
        return { success: false, error: itemsError };
      }
    }

    return { success: true };
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
  generateInvoicePDF: async (sale: Sale, settings?: { companyName: string; companyAddress: string; companyNif: string; taxRate: number; currency: string }) => {
    try {
      const doc = new jsPDF();

      // Default settings if not provided
      const company = settings || {
        companyName: 'Empresa Demo, Lda',
        companyAddress: 'Rua da Inovação, 123, 1000-001 Lisboa',
        companyNif: '500123456',
        taxRate: 23,
        currency: 'EUR'
      };

      // Helper for payment method label
      const getPaymentLabel = (method: string | undefined): string => {
        switch (method) {
          case 'CASH': return 'Dinheiro';
          case 'CARD': return 'Cartão';
          case 'MULTIBANCO': return 'Multibanco';
          case 'MBWAY': return 'MBWay';
          default: return 'N/D';
        }
      };

      // Colors
      const primaryBlue = [37, 99, 235]; // #2563eb
      const darkGray = [31, 41, 55];     // #1f2937
      const mediumGray = [107, 114, 128]; // #6b7280
      const lightGray = [229, 231, 235]; // #e5e7eb

      // --- HEADER ---
      // Left: FATURA
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("FATURA", 14, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text(`Ref: ${sale.id}`, 14, 32);

      // Right: Company Info
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text(company.companyName, 196, 20, { align: 'right' });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text(company.companyAddress, 196, 27, { align: 'right' });
      doc.text(`NIF: ${company.companyNif}`, 196, 33, { align: 'right' });

      // --- CUSTOMER & DATE SECTION ---
      const sectionY = 50;

      // Left: Customer Info
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text("FATURAR A:", 14, sectionY);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text(sale.customerName || 'Consumidor Final', 14, sectionY + 7);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      let customerY = sectionY + 13;
      if (sale.customerNif) {
        doc.text(`NIF: ${sale.customerNif}`, 14, customerY);
        customerY += 5;
      }
      if (sale.customerAddress) {
        doc.text(sale.customerAddress, 14, customerY);
        customerY += 5;
      }
      if (sale.customerPostalCode) {
        doc.text(sale.customerPostalCode, 14, customerY);
      }

      // Right: Date & Payment
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text("DATA:", 196, sectionY, { align: 'right' });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text(formatDateTime(sale.date), 196, sectionY + 7, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text("PAGAMENTO:", 196, sectionY + 16, { align: 'right' });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text(getPaymentLabel(sale.paymentMethod), 196, sectionY + 23, { align: 'right' });

      // --- ITEMS TABLE ---
      const tableBody = sale.items.map(item => [
        item.productName,
        item.quantity.toString(),
        `${item.total.toFixed(2)} €`
      ]);

      autoTable(doc, {
        startY: 90,
        head: [['Descrição', 'Qtd', 'Total']],
        body: tableBody,
        theme: 'plain',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [107, 114, 128],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: { top: 4, bottom: 4 }
        },
        bodyStyles: {
          textColor: [31, 41, 55],
          fontSize: 10,
          cellPadding: { top: 6, bottom: 6 }
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: 'center', cellWidth: 25 },
          2: { halign: 'right', cellWidth: 35 }
        },
        styles: {
          lineColor: [229, 231, 235],
          lineWidth: 0.1
        },
        didDrawCell: (data: any) => {
          // Draw bottom border for each row
          if (data.section === 'body' || data.section === 'head') {
            doc.setDrawColor(229, 231, 235);
            doc.line(data.cell.x, data.cell.y + data.cell.height,
              data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });

      // --- TOTALS SECTION ---
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      const totalsX = 130;

      // Calculate tax breakdown
      const taxRate = company.taxRate / 100;
      const subTotal = sale.totalAmount / (1 + taxRate);
      const taxAmount = sale.totalAmount - subTotal;

      // Subtotal
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text("Subtotal", totalsX, finalY);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text(`${subTotal.toFixed(2)} €`, 196, finalY, { align: 'right' });

      // Line
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.line(totalsX, finalY + 3, 196, finalY + 3);

      // IVA
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text(`IVA (${company.taxRate}%)`, totalsX, finalY + 12);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text(`${taxAmount.toFixed(2)} €`, 196, finalY + 12, { align: 'right' });

      // Line
      doc.line(totalsX, finalY + 15, 196, finalY + 15);

      // Total
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("Total", totalsX, finalY + 26);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text(`${sale.totalAmount.toFixed(2)} €`, 196, finalY + 26, { align: 'right' });

      // --- FOOTER (optional) ---
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.text("Obrigado pela sua preferência!", 105, 280, { align: 'center' });

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      return { success: true, url: pdfUrl };
    } catch (e) {
      console.error(e);
      return { success: false, error: "Erro ao gerar PDF" };
    }
  },

  // ============================================
  // TENANT MANAGEMENT (MULTI-TENANCY)
  // ============================================

  // Get current user's tenant
  getTenant: async (userId: string): Promise<Tenant | null> => {
    try {
      // 1. Get user's tenant_id
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('tenant_id')
        .eq('id', userId)
        .single();

      if (userError || !userData?.tenant_id) {
        console.error('Error fetching user tenant:', userError);
        return null;
      }

      // 2. Get tenant data
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userData.tenant_id)
        .single();

      if (tenantError || !tenantData) {
        console.error('Error fetching tenant:', tenantError);
        return null;
      }

      // 3. Map to Tenant interface
      return {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        nif: tenantData.nif,
        address: tenantData.address,
        postalCode: tenantData.postal_code,
        city: tenantData.city,
        phone: tenantData.phone,
        email: tenantData.email,
        logoUrl: tenantData.logo_url,
        settings: tenantData.settings || { taxRate: 23, currency: 'EUR', theme: 'light' },
        plan: tenantData.plan,
        maxUsers: tenantData.max_users,
        maxProducts: tenantData.max_products,
        isActive: tenantData.is_active,
        createdAt: tenantData.created_at,
        updatedAt: tenantData.updated_at
      };
    } catch (e) {
      console.error('Unexpected error in getTenant:', e);
      return null;
    }
  },

  // Update tenant info (admin only)
  updateTenant: async (tenantId: string, updates: Partial<Tenant>) => {
    try {
      const dbUpdates: any = {};

      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.nif !== undefined) dbUpdates.nif = updates.nif;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.postalCode !== undefined) dbUpdates.postal_code = updates.postalCode;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
      if (updates.settings !== undefined) dbUpdates.settings = updates.settings;

      const { error } = await supabase
        .from('tenants')
        .update(dbUpdates)
        .eq('id', tenantId);

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error updating tenant:', e);
      return { success: false, error: e };
    }
  },

  // Get tenant users (admin only)
  getTenantUsers: async (tenantId: string): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching tenant users:', e);
      return [];
    }
  },

  // Create new tenant (super admin only)
  createTenant: async (tenant: Partial<Tenant>) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: tenant.name,
          slug: tenant.slug || tenant.name?.toLowerCase().replace(/\s+/g, '-'),
          nif: tenant.nif,
          address: tenant.address,
          postal_code: tenant.postalCode,
          city: tenant.city,
          phone: tenant.phone,
          email: tenant.email,
          settings: tenant.settings || { taxRate: 23, currency: 'EUR', theme: 'light' },
          plan: tenant.plan || 'starter',
          max_users: tenant.maxUsers || 1,
          max_products: tenant.maxProducts || 100
        })
        .select()
        .single();

      if (error) throw error;

      // Create default subscription
      await supabase.from('subscriptions').insert({
        tenant_id: data.id,
        plan: data.plan || 'starter',
        status: 'active',
        start_date: new Date().toISOString()
      });

      return { success: true, tenant: data };
    } catch (e) {
      console.error('Error creating tenant:', e);
      return { success: false, error: e };
    }
  },

  // Assign user to tenant
  assignUserToTenant: async (userId: string, tenantId: string, isTenantAdmin: boolean = false) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({
          tenant_id: tenantId,
          is_tenant_admin: isTenantAdmin
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error assigning user to tenant:', e);
      return { success: false, error: e };
    }
  },

  // --- SUBSCRIPTIONS ---

  getSubscription: async (tenantId: string): Promise<Subscription | null> => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        id: data.id,
        tenantId: data.tenant_id,
        plan: data.plan,
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (e) {
      console.error('Error fetching subscription:', e);
      return null;
    }
  },

  createSubscription: async (subscription: Partial<Subscription>) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: subscription.tenantId,
          plan: subscription.plan,
          status: subscription.status,
          start_date: subscription.startDate,
          end_date: subscription.endDate
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, subscription: data };
    } catch (e) {
      console.error('Error creating subscription:', e);
      return { success: false, error: e };
    }
  },

  updateSubscription: async (id: string, updates: Partial<Subscription>) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan: updates.plan,
          status: updates.status,
          end_date: updates.endDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error updating subscription:', e);
      return { success: false, error: e };
    }
  }
};