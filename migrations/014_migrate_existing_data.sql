-- ============================================
-- MIGRATION 014: MIGRATE EXISTING DATA
-- ============================================
-- This migration creates a default tenant and assigns
-- all existing data to it.

-- ============================================
-- STEP 1: Create Default Tenant
-- ============================================
INSERT INTO tenants (id, name, slug, nif, address, phone, email, plan, max_users, max_products)
VALUES (
  'a0000000-0000-0000-0000-000000000001',  -- Fixed UUID for easy reference
  'Empresa Principal',
  'empresa-principal',
  '500123456',  -- Update with your real NIF
  'Rua da Inovação, 123, 1000-001 Lisboa',  -- Update with your real address
  '',
  '',
  'enterprise',  -- Give full access to migrated data
  999,
  999999
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: Assign All Existing Data to Default Tenant
-- ============================================

-- Products
UPDATE products 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- Customers
UPDATE customers 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- Suppliers
UPDATE suppliers 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- Sales
UPDATE sales 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- Purchase Orders
UPDATE purchase_orders 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- History
UPDATE history 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- Promotions (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions') THEN
    EXECUTE 'UPDATE promotions SET tenant_id = ''a0000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL';
  END IF;
END $$;

-- ============================================
-- STEP 3: Assign All Existing Users to Default Tenant
-- ============================================
UPDATE app_users 
SET 
  tenant_id = 'a0000000-0000-0000-0000-000000000001',
  is_tenant_admin = CASE WHEN role = 'ADMIN' THEN true ELSE false END
WHERE tenant_id IS NULL;

-- ============================================
-- STEP 4: Make tenant_id NOT NULL (after migration)
-- ============================================
-- Uncomment these after verifying the migration was successful:

-- ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE customers ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE suppliers ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE sales ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE purchase_orders ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE history ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE app_users ALTER COLUMN tenant_id SET NOT NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration:

-- SELECT 'products' as table_name, COUNT(*) as total, COUNT(tenant_id) as with_tenant FROM products
-- UNION ALL
-- SELECT 'customers', COUNT(*), COUNT(tenant_id) FROM customers
-- UNION ALL
-- SELECT 'suppliers', COUNT(*), COUNT(tenant_id) FROM suppliers
-- UNION ALL
-- SELECT 'sales', COUNT(*), COUNT(tenant_id) FROM sales
-- UNION ALL
-- SELECT 'purchase_orders', COUNT(*), COUNT(tenant_id) FROM purchase_orders
-- UNION ALL
-- SELECT 'app_users', COUNT(*), COUNT(tenant_id) FROM app_users;
