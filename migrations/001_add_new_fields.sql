-- ============================================
-- MIGRAÇÃO SUPABASE - GESTOR DE INVENTÁRIO
-- ============================================
-- Execute estes scripts no SQL Editor do Supabase
-- Ordem: 1. Produtos, 2. Clientes, 3. Vendas, 4. Promoções

-- ============================================
-- 1. TABELA: products - Novos campos
-- ============================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS expiration_date DATE,
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS dimensions VARCHAR(50),
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS tax_rate INTEGER DEFAULT 23,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_expiration ON products(expiration_date);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

COMMENT ON COLUMN products.expiration_date IS 'Data de validade do produto';
COMMENT ON COLUMN products.tax_rate IS 'Taxa de IVA: 6, 13 ou 23';
COMMENT ON COLUMN products.barcode IS 'Código de barras EAN-13';

-- ============================================
-- 2. TABELA: customers - Novos campos
-- ============================================

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'INDIVIDUAL',
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_debt DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Constraint para tipo de cliente
ALTER TABLE customers 
ADD CONSTRAINT chk_customer_type 
CHECK (type IN ('INDIVIDUAL', 'COMPANY'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

COMMENT ON COLUMN customers.type IS 'INDIVIDUAL ou COMPANY';
COMMENT ON COLUMN customers.loyalty_points IS 'Pontos acumulados do programa de fidelidade';

-- ============================================
-- 3. TABELA: sales - Novos campos
-- ============================================

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'CASH',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PAID',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'COMPLETED',
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS profit DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);

-- Constraints
ALTER TABLE sales 
ADD CONSTRAINT chk_payment_method 
CHECK (payment_method IN ('CASH', 'CARD', 'MBWAY', 'TRANSFER', 'CHECK', 'CREDIT'));

ALTER TABLE sales 
ADD CONSTRAINT chk_payment_status 
CHECK (payment_status IN ('PAID', 'PENDING', 'PARTIAL', 'REFUNDED'));

ALTER TABLE sales 
ADD CONSTRAINT chk_sale_status 
CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED', 'SHIPPED'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);

-- ============================================
-- 4. TABELA: promotions - Nova tabela
-- ============================================

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_promotions_coupon ON promotions(coupon_code);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);

COMMENT ON TABLE promotions IS 'Tabela de promoções e cupões de desconto';

-- ============================================
-- 5. TABELA: sale_items - Atualização
-- ============================================

ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;

-- ============================================
-- 6. VIEWS ÚTEIS
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
  SUM(s.total_amount) AS total_spent
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id
WHERE s.status = 'COMPLETED'
GROUP BY c.id, c.name, c.loyalty_points
ORDER BY total_spent DESC
LIMIT 100;

-- ============================================
-- 7. FUNÇÕES ÚTEIS
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
AFTER INSERT OR UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION update_loyalty_points();

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
