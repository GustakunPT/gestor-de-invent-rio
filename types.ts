// ============================================
// TIPOS E INTERFACES DO SISTEMA ERP
// ============================================

// --- ENUMS E TIPOS UTILITÁRIOS ---

export enum ModalType {
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  NONE = 'NONE'
}

export type PaymentMethod = 'CASH' | 'CARD' | 'MBWAY' | 'MULTIBANCO';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'REFUNDED';
export type SaleStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'SHIPPED';
export type UserRole = 'ADMIN' | 'STAFF';
export type CustomerType = 'INDIVIDUAL' | 'COMPANY';
export type PurchaseOrderStatus = 'PENDENTE' | 'RECEBIDO' | 'CANCELADO';

// --- PRODUTO ---

export interface Product {
  id: string;
  sku: string;                    // Stock Keeping Unit / Código de barras
  name: string;
  category: string;
  quantity: number;
  minStock: number;               // Safety Stock
  maxStock: number;
  location: string;               // Warehouse Bin/Shelf
  serialNumber?: string;
  batchNumber?: string;
  price: number;                  // Preço de venda
  costPrice: number;              // Preço de custo (COGS)
  supplierId?: string;
  updatedAt: string;
  // Novos campos
  expirationDate?: string;        // Data de validade
  weight?: number;                // Peso (kg)
  dimensions?: string;            // Dimensões LxAxP
  barcode?: string;               // EAN-13
  taxRate?: number;               // IVA específico (6, 13, 23)
  isActive?: boolean;             // Produto ativo
  imageUrl?: string;              // URL imagem
  notes?: string;                 // Notas internas
  createdAt?: string;             // Data criação
}

export interface ProductFormData {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  location: string;
  serialNumber: string;
  batchNumber: string;
  price: number;
  costPrice: number;
  supplierId: string;
  // Novos campos
  expirationDate?: string;
  weight?: number;
  dimensions?: string;
  barcode?: string;
  taxRate?: number;
  isActive?: boolean;
  imageUrl?: string;
  notes?: string;
}

// --- UTILIZADORES ---

export interface User {
  id: string;                     // ID numérico (string)
  name: string;
  password: string;               // Hash da password
  role: UserRole;
  email?: string;
  phone?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

// --- CLIENTES ---

export interface Customer {
  id: string;
  name: string;
  nif: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  // Novos campos
  type?: CustomerType;            // Individual ou Empresa
  birthDate?: string;             // Data nascimento
  notes?: string;                 // Notas
  creditLimit?: number;           // Limite crédito
  currentDebt?: number;           // Dívida atual
  loyaltyPoints?: number;         // Pontos fidelização
  discountPercentage?: number;    // Desconto pessoal %
  isActive?: boolean;             // Cliente ativo
  createdAt?: string;             // Data registo
}

// --- HISTÓRICO ---

export type HistoryAction = 'CRIAR' | 'EDITAR' | 'APAGAR' | 'VENDA' | 'IMPORTAR' | 'COMPRA' | 'RECEBIMENTO' | 'CLIENTE' | 'PROMOCAO';

export interface HistoryEntry {
  id: string;
  userId: string;                 // Quem fez
  userName: string;
  productId: string;
  productName: string;
  action: HistoryAction;
  timestamp: string;
  details: string;
}

// --- VENDAS ---

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;             // Para cálculo de lucro
  total: number;
  discount?: number;              // Desconto no item
}

export interface Sale {
  id: string;
  customerId?: string;            // Referência ao cliente
  customerName: string;
  customerNif?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerPostalCode?: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  userId: string;                 // Vendido por
  // Pagamento
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  status?: SaleStatus;
  discountAmount?: number;        // Desconto total
  discountReason?: string;        // Motivo desconto
  notes?: string;                 // Observações
  // Entrega
  deliveryType?: 'STORE' | 'SHIPPING';  // Loja ou Envio
  shippingAddress?: string;       // Morada de envio (se diferente)
  shippingPostalCode?: string;    // Código postal de envio
  shippingCity?: string;          // Cidade de envio
  shippingMethod?: string;        // Método envio (CTT, DPD, etc)
  shippingCost?: number;          // Custo de envio
  trackingNumber?: string;        // Nº rastreio
  // Cálculos
  subtotal?: number;              // Antes de IVA
  taxAmount?: number;             // Valor IVA
  profit?: number;                // Lucro calculado
}

// --- FORNECEDORES ---

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  nif: string;
  // Novos campos
  website?: string;               // Website
  contactPerson?: string;         // Pessoa contacto
  paymentTerms?: string;          // Condições pagamento
  leadTime?: number;              // Prazo entrega (dias)
  rating?: number;                // Avaliação 1-5
  notes?: string;                 // Notas
  isActive?: boolean;             // Ativo
  iban?: string;                  // IBAN para pagamentos
  createdAt?: string;             // Data criação
}

// --- ENCOMENDAS A FORNECEDORES ---

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  expectedDate?: string;          // Data prevista entrega
  receivedDate?: string;          // Data recepção
  notes?: string;
}

// --- CONFIGURAÇÕES ---

export interface AppSettings {
  taxRate: number;                // Percentagem IVA padrão
  companyName: string;
  companyAddress: string;
  companyNif: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
  currency: string;
  theme: 'light' | 'dark';
  lowStockAlertEnabled?: boolean;
  expiryAlertDays?: number;       // Dias antes de alertar validade
}

// --- PROMOÇÕES ---

export type PromotionType = 'PERCENTAGE' | 'FIXED' | 'BUY_X_GET_Y';

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  value: number;                  // % ou valor fixo
  minPurchase?: number;           // Compra mínima
  startDate: string;
  endDate: string;
  productIds?: string[];          // Produtos específicos
  categoryIds?: string[];         // Categorias específicas
  customerIds?: string[];         // Clientes específicos
  maxUses?: number;               // Limite de usos
  currentUses: number;
  couponCode?: string;            // Código promocional
  isActive: boolean;
}

// --- ALERTAS DE STOCK ---

export type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING' | 'OVERSTOCK';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  createdAt: string;
  isRead: boolean;
  isDismissed: boolean;
}

// --- BACKUP ---

export interface BackupData {
  version: string;
  createdAt: string;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
  users: User[];
  settings: AppSettings;
  promotions?: Promotion[];
}