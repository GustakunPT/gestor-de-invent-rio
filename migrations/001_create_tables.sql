-- ============================================
-- CRIAÇÃO DE TABELAS - GESTOR DE INVENTÁRIO
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Cria todas as tabelas do zero

-- ============================================
-- 1. ATIVAR EXTENSÕES NECESSÁRIAS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. TABELA: suppliers (Fornecedores)
-- ============================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  phone VARCHAR(50),
  address TEXT,
  nif VARCHAR(20),
  website VARCHAR(255),
  contact_person VARCHAR(100),
  payment_terms VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- ============================================
-- 3. TABELA: products (Produtos)
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  max_stock INTEGER DEFAULT 100,
  location VARCHAR(100),
  serial_number VARCHAR(100),
  batch_number VARCHAR(100),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id),
  -- Novos campos
  expiration_date DATE,
  weight DECIMAL(10,3),
  dimensions VARCHAR(50),
  barcode VARCHAR(50),
  tax_rate INTEGER DEFAULT 23,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_expiration ON products(expiration_date);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

COMMENT ON COLUMN products.tax_rate IS 'Taxa de IVA: 6, 13 ou 23';
COMMENT ON COLUMN products.barcode IS 'Código de barras EAN-13';

-- ============================================
-- 4. TABELA: customers (Clientes)
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  nif VARCHAR(20),
  email VARCHAR(200),
  phone VARCHAR(50),
  address TEXT,
  postal_code VARCHAR(20),
  -- Novos campos
  type VARCHAR(20) DEFAULT 'INDIVIDUAL' CHECK (type IN ('INDIVIDUAL', 'COMPANY')),
  birth_date DATE,
  credit_limit DECIMAL(10,2) DEFAULT 0,
  current_debt DECIMAL(10,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_nif ON customers(nif);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

COMMENT ON COLUMN customers.type IS 'INDIVIDUAL ou COMPANY';
COMMENT ON COLUMN customers.loyalty_points IS 'Pontos acumulados do programa de fidelidade';

-- ============================================
-- 5. TABELA: app_users (Utilizadores)
-- ============================================

CREATE TABLE IF NOT EXISTS app_users (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),
  email VARCHAR(200),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON app_users(is_active);

-- Inserir utilizador admin padrão (password: 1234)
INSERT INTO app_users (id, name, password, role) 
VALUES ('1', 'Administrador', '1234', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. TABELA: sales (Vendas)
-- ============================================

CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(200),
  customer_nif VARCHAR(20),
  customer_email VARCHAR(200),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  customer_postal_code VARCHAR(20),
  date TIMESTAMPTZ DEFAULT NOW(),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  user_id VARCHAR(20) REFERENCES app_users(id),
  -- Novos campos
  payment_method VARCHAR(20) DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CARD', 'MBWAY', 'TRANSFER', 'CHECK', 'CREDIT')),
  payment_status VARCHAR(20) DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PENDING', 'PARTIAL', 'REFUNDED')),
  status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED', 'SHIPPED')),
  subtotal DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason VARCHAR(255),
  tax_amount DECIMAL(10,2),
  profit DECIMAL(10,2),
  notes TEXT,
  shipping_method VARCHAR(50),
  tracking_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

-- ============================================
-- 7. TABELA: sale_items (Itens da Venda)
-- ============================================

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id VARCHAR(50) REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- ============================================
-- 8. TABELA: purchase_orders (Encomendas)
-- ============================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(50) PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'RECEBIDO', 'CANCELADO')),
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- ============================================
-- 9. TABELA: purchase_order_items (Itens Encomenda)
-- ============================================

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id VARCHAR(50) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  cost DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_po_items_order ON purchase_order_items(purchase_order_id);

-- ============================================
-- 10. TABELA: history (Histórico/Auditoria)
-- ============================================

CREATE TABLE IF NOT EXISTS history (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(20),
  user_name VARCHAR(200),
  product_id VARCHAR(100),
  product_name VARCHAR(200),
  action VARCHAR(50) NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_action ON history(action);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp);

-- ============================================
-- 11. TABELA: promotions (Promoções)
-- ============================================

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED', 'BUY_X_GET_Y')),
  value DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  coupon_code VARCHAR(50) UNIQUE,
  min_purchase DECIMAL(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_coupon ON promotions(coupon_code);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);

COMMENT ON TABLE promotions IS 'Tabela de promoções e cupões de desconto';

-- ============================================
-- 12. TABELA: app_settings (Configurações)
-- ============================================

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  company_name VARCHAR(200) DEFAULT 'Minha Empresa',
  company_nif VARCHAR(20) DEFAULT '000000000',
  company_address TEXT DEFAULT '',
  company_email VARCHAR(200) DEFAULT '',
  company_phone VARCHAR(50) DEFAULT '',
  currency VARCHAR(10) DEFAULT 'EUR',
  iva_rate INTEGER DEFAULT 23,
  low_stock_threshold INTEGER DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO app_settings (id, company_name, currency)
VALUES (1, 'Minha Empresa', 'EUR')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 13. VIEWS ÚTEIS
-- ============================================

-- View: Resumo de vendas por mês
CREATE OR REPLACE VIEW v_sales_monthly AS
SELECT 
  DATE_TRUNC('month', date) AS month,
  COUNT(*) AS total_sales,
  SUM(total_amount) AS revenue,
  SUM(profit) AS total_profit,
  AVG(total_amount) AS avg_ticket
FROM sales
WHERE status = 'COMPLETED'
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- View: Produtos com stock baixo
CREATE OR REPLACE VIEW v_low_stock AS
SELECT 
  id, name, sku, quantity, min_stock,
  (min_stock - quantity) AS units_needed
FROM products
WHERE quantity <= min_stock AND is_active = true
ORDER BY (min_stock - quantity) DESC;

-- View: Top clientes por valor
CREATE OR REPLACE VIEW v_top_customers AS
SELECT 
  c.id, c.name, c.loyalty_points,
  COUNT(s.id) AS total_orders,
  COALESCE(SUM(s.total_amount), 0) AS total_spent
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id AND s.status = 'COMPLETED'
GROUP BY c.id, c.name, c.loyalty_points
ORDER BY total_spent DESC
LIMIT 100;

-- ============================================
-- 14. FUNÇÕES E TRIGGERS
-- ============================================

-- Função: Atualizar pontos de fidelidade
CREATE OR REPLACE FUNCTION update_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND NEW.customer_id IS NOT NULL THEN
    UPDATE customers 
    SET loyalty_points = loyalty_points + FLOOR(NEW.total_amount)
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar pontos
DROP TRIGGER IF EXISTS trg_update_loyalty ON sales;
CREATE TRIGGER trg_update_loyalty
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION update_loyalty_points();

-- Função: Atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================
-- 15. POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS (opcional - descomente se necessário)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FIM DA CRIAÇÃO DE TABELAS
-- ============================================

-- RESUMO DAS TABELAS CRIADAS:
-- 1. suppliers - Fornecedores
-- 2. products - Produtos
-- 3. customers - Clientes
-- 4. app_users - Utilizadores do sistema
-- 5. sales - Vendas
-- 6. sale_items - Itens das vendas
-- 7. purchase_orders - Encomendas a fornecedores
-- 8. purchase_order_items - Itens das encomendas
-- 9. history - Histórico/Auditoria
-- 10. promotions - Promoções e cupões
-- 11. app_settings - Configurações da empresa
