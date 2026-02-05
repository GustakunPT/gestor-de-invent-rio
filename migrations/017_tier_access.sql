-- ============================================
-- MIGRATION 017: 3-TIER ACCESS CONTROL (DEVELOPER, ADMIN, OPERATOR)
-- ============================================

-- 1. Helper Function to check if user is DEVELOPER
CREATE OR REPLACE FUNCTION is_developer()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM app_users
  WHERE id = auth.uid()::TEXT;
  
  RETURN user_role = 'DEVELOPER';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update RLS policies for Data Tables to allow Developer Access
-- We need to drop and re-create policies for all tenant-isolated tables
-- to include "OR is_developer()"

-- List of tables to update: products, customers, suppliers, sales, purchase_orders, history, promotions

-- --- PRODUCTS ---
DROP POLICY IF EXISTS "Tenant isolation for products" ON products;
CREATE POLICY "Tenant isolation for products" ON products
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_developer())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_developer());

-- --- CUSTOMERS ---
DROP POLICY IF EXISTS "Tenant isolation for customers" ON customers;
CREATE POLICY "Tenant isolation for customers" ON customers
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_developer())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_developer());

-- --- SUPPLIERS ---
DROP POLICY IF EXISTS "Tenant isolation for suppliers" ON suppliers;
CREATE POLICY "Tenant isolation for suppliers" ON suppliers
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_developer())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_developer());

-- --- SALES ---
DROP POLICY IF EXISTS "Tenant isolation for sales" ON sales;
CREATE POLICY "Tenant isolation for sales" ON sales
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_developer())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_developer());

-- --- SALE_ITEMS (Inherit Logic) ---
DROP POLICY IF EXISTS "Tenant isolation for sale_items" ON sale_items;
CREATE POLICY "Tenant isolation for sale_items" ON sale_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sales 
      WHERE sales.id = sale_items.sale_id 
      AND (sales.tenant_id = get_current_tenant_id() OR is_developer())
    )
  );

-- --- PURCHASE_ORDERS ---
DROP POLICY IF EXISTS "Tenant isolation for purchase_orders" ON purchase_orders;
CREATE POLICY "Tenant isolation for purchase_orders" ON purchase_orders
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_developer())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_developer());

-- --- PURCHASE_ORDER_ITEMS (Inherit Logic) ---
DROP POLICY IF EXISTS "Tenant isolation for purchase_order_items" ON purchase_order_items;
CREATE POLICY "Tenant isolation for purchase_order_items" ON purchase_order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders 
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id 
      AND (purchase_orders.tenant_id = get_current_tenant_id() OR is_developer())
    )
  );

-- --- HISTORY ---
DROP POLICY IF EXISTS "Tenant isolation for history" ON history;
CREATE POLICY "Tenant isolation for history" ON history
  FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_developer())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_developer());

-- --- PROMOTIONS ---
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions') THEN
    DROP POLICY IF EXISTS "Tenant isolation for promotions" ON promotions;
    EXECUTE 'CREATE POLICY "Tenant isolation for promotions" ON promotions
      FOR ALL
      USING (tenant_id = get_current_tenant_id() OR is_developer())
      WITH CHECK (tenant_id = get_current_tenant_id() OR is_developer())';
  END IF;
END $$;

-- 3. Update TENANTS Policies
-- Restrict creation to DEVELOPER only
-- Developer sees ALL tenants
-- Admins see OWN tenant

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tenants;
CREATE POLICY "Only developers can create tenants" ON tenants
FOR INSERT 
TO authenticated 
WITH CHECK (is_developer());

DROP POLICY IF EXISTS "Users can view their own or owned tenant" ON tenants;
CREATE POLICY "Developer sees all, Users see own" ON tenants
FOR SELECT
USING (
  is_developer() 
  OR 
  id = get_current_tenant_id() 
  OR 
  owner_id = auth.uid()
);

-- 4. Update APP_USERS Policies
-- Developer can see ALL users
-- Users see their tenant members

DROP POLICY IF EXISTS "Users can view themselves and tenant members" ON app_users;
CREATE POLICY "Access control for app_users" ON app_users
FOR SELECT
USING (
  is_developer()
  OR
  id = auth.uid()::text 
  OR 
  (tenant_id IS NOT NULL AND tenant_id = get_current_tenant_id())
);

-- Note: We assume 'OPERATOR' access is handled by "Staff" logic in the UI (UserRole = 'STAFF').
-- The database policies for Operators are the same as Admins (they see their tenant's data).
-- UI logic restricts what they can DO (delete, edit settings, etc).
