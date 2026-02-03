export interface Product {
  id: string;
  sku: string; // Stock Keeping Unit
  name: string;
  category: string;
  quantity: number;
  minStock: number; // Safety Stock
  maxStock: number;
  location: string; // Warehouse Bin/Shelf
  serialNumber?: string; // New Field
  batchNumber?: string; // New Field
  price: number;
  costPrice: number; // For COGS calculation
  supplierId?: string;
  updatedAt: string;
}

export interface ProductFormData {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  location: string;
  serialNumber: string; // New Field
  batchNumber: string; // New Field
  price: number;
  costPrice: number;
  supplierId: string;
}

export enum ModalType {
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  NONE = 'NONE'
}

export interface User {
  id: string; // Numeric string (e.g. "1001")
  name: string;
  password: string; // Simple password for the mock
  role: 'ADMIN' | 'STAFF';
}

export interface Customer {
  id: string;
  name: string;
  nif: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
}

export interface HistoryEntry {
  id: string;
  userId: string; // Who did it
  userName: string;
  productId: string;
  productName: string;
  action: 'CRIAR' | 'EDITAR' | 'APAGAR' | 'VENDA' | 'IMPORTAR' | 'COMPRA' | 'RECEBIMENTO' | 'CLIENTE';
  timestamp: string;
  details: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  customerName: string;
  customerNif?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerPostalCode?: string; // New Field
  date: string;
  items: SaleItem[];
  totalAmount: number;
  userId: string; // Sold by
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  nif: string;
}

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
  status: 'PENDENTE' | 'RECEBIDO';
  items: PurchaseOrderItem[];
  totalAmount: number;
}

export interface AppSettings {
  taxRate: number; // Percentage (e.g., 23 for 23%)
  companyName: string;
  companyAddress: string;
  companyNif: string;
  currency: string;
  theme: 'light' | 'dark';
}