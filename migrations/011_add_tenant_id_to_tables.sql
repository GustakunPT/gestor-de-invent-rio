-- ============================================
-- MIGRATION 011: ADD TENANT_ID TO ALL TABLES
-- ============================================
-- This migration adds tenant_id foreign key to all data tables
-- to enable multi-tenant data isolation.

-- ============================================
-- PRODUCTS TABLE
-- ============================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);

-- ============================================
-- SUPPLIERS TABLE
-- ============================================
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);

-- ============================================
-- SALES TABLE
-- ============================================
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sales_tenant ON sales(tenant_id);

-- ============================================
-- PURCHASE ORDERS TABLE
-- ============================================
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchase_orders(tenant_id);

-- ============================================
-- HISTORY TABLE
-- ============================================
ALTER TABLE history 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_history_tenant ON history(tenant_id);

-- ============================================
-- PROMOTIONS TABLE (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions') THEN
    ALTER TABLE promotions 
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_promotions_tenant ON promotions(tenant_id);
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN products.tenant_id IS 'Reference to the tenant that owns this product';
COMMENT ON COLUMN customers.tenant_id IS 'Reference to the tenant that owns this customer';
COMMENT ON COLUMN suppliers.tenant_id IS 'Reference to the tenant that owns this supplier';
COMMENT ON COLUMN sales.tenant_id IS 'Reference to the tenant that owns this sale';
COMMENT ON COLUMN purchase_orders.tenant_id IS 'Reference to the tenant that owns this purchase order';
COMMENT ON COLUMN history.tenant_id IS 'Reference to the tenant that owns this history entry';
