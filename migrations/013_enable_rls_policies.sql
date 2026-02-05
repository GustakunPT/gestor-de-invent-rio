-- ============================================
-- MIGRATION 013: ENABLE ROW LEVEL SECURITY
-- ============================================
-- This migration enables RLS policies to ensure complete
-- data isolation between tenants.

-- ============================================
-- HELPER FUNCTION: Get current user's tenant_id
-- ============================================
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get tenant_id from the current authenticated user
  SELECT tenant_id INTO tenant_uuid
  FROM app_users
  WHERE id = auth.uid()::TEXT;
  
  RETURN tenant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PRODUCTS RLS
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for products" ON products;
CREATE POLICY "Tenant isolation for products" ON products
  FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================
-- CUSTOMERS RLS
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for customers" ON customers;
CREATE POLICY "Tenant isolation for customers" ON customers
  FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================
-- SUPPLIERS RLS
-- ============================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for suppliers" ON suppliers;
CREATE POLICY "Tenant isolation for suppliers" ON suppliers
  FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================
-- SALES RLS
-- ============================================
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for sales" ON sales;
CREATE POLICY "Tenant isolation for sales" ON sales
  FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================
-- SALE_ITEMS RLS (inherits from sales)
-- ============================================
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for sale_items" ON sale_items;
CREATE POLICY "Tenant isolation for sale_items" ON sale_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sales 
      WHERE sales.id = sale_items.sale_id 
      AND sales.tenant_id = get_current_tenant_id()
    )
  );

-- ============================================
-- PURCHASE_ORDERS RLS
-- ============================================
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for purchase_orders" ON purchase_orders;
CREATE POLICY "Tenant isolation for purchase_orders" ON purchase_orders
  FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================
-- PURCHASE_ORDER_ITEMS RLS (inherits from purchase_orders)
-- ============================================
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for purchase_order_items" ON purchase_order_items;
CREATE POLICY "Tenant isolation for purchase_order_items" ON purchase_order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders 
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id 
      AND purchase_orders.tenant_id = get_current_tenant_id()
    )
  );

-- ============================================
-- HISTORY RLS
-- ============================================
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for history" ON history;
CREATE POLICY "Tenant isolation for history" ON history
  FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================
-- APP_USERS RLS (users can only see their tenant's users)
-- ============================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for app_users" ON app_users;
CREATE POLICY "Tenant isolation for app_users" ON app_users
  FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================
-- TENANTS RLS (users can only see their own tenant)
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
CREATE POLICY "Users can view their own tenant" ON tenants
  FOR SELECT
  USING (id = get_current_tenant_id());

-- Tenant admins can update their tenant
DROP POLICY IF EXISTS "Tenant admins can update their tenant" ON tenants;
CREATE POLICY "Tenant admins can update their tenant" ON tenants
  FOR UPDATE
  USING (
    id = get_current_tenant_id() 
    AND EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid()::TEXT 
      AND is_tenant_admin = true
    )
  );

-- ============================================
-- PROMOTIONS RLS (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions') THEN
    ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Tenant isolation for promotions" ON promotions;
    EXECUTE 'CREATE POLICY "Tenant isolation for promotions" ON promotions
      FOR ALL
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id())';
  END IF;
END $$;
