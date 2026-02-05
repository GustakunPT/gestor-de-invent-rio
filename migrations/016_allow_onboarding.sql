-- ============================================
-- MIGRATION 016: ONBOARDING & RLS FIXES
-- ============================================

-- 1. Add owner_id to tenants table to track who created it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'owner_id') THEN
    ALTER TABLE tenants ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    CREATE INDEX idx_tenants_owner ON tenants(owner_id);
  END IF;
END $$;

-- 2. Trigger to automatically set owner_id on insert
CREATE OR REPLACE FUNCTION set_tenant_owner()
RETURNS TRIGGER AS $$
BEGIN
  NEW.owner_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_tenant_owner ON tenants;
CREATE TRIGGER trigger_set_tenant_owner
  BEFORE INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_owner();

-- 3. RLS POLICIES FOR TENANTS

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Tenant admins can update their tenant" ON tenants;

-- Policy: INSERT
CREATE POLICY "Enable insert for authenticated users only" ON tenants
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy: SELECT (Allow if Linked via app_users OR is Owner)
CREATE POLICY "Users can view their own or owned tenant" ON tenants
FOR SELECT
USING (
  id = get_current_tenant_id() 
  OR 
  owner_id = auth.uid()
);

-- Policy: UPDATE (Admins or Owner)
CREATE POLICY "Tenant admins or owner can update" ON tenants
FOR UPDATE
USING (
  (id = get_current_tenant_id() AND EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid()::TEXT AND is_tenant_admin = true))
  OR 
  owner_id = auth.uid()
);

-- 4. RLS POLICIES FOR SUBSCRIPTIONS

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON subscriptions;
CREATE POLICY "Enable insert for authenticated users" ON subscriptions
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 5. RLS POLICIES FOR APP_USERS

DROP POLICY IF EXISTS "Tenant isolation for app_users" ON app_users;
DROP POLICY IF EXISTS "Users can view themselves and tenant members" ON app_users;
CREATE POLICY "Users can view themselves and tenant members" ON app_users
FOR SELECT
USING (
  id = auth.uid()::text 
  OR 
  (tenant_id IS NOT NULL AND tenant_id = get_current_tenant_id())
);

DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
CREATE POLICY "Users can update own profile" ON app_users
FOR UPDATE
USING (id = auth.uid()::text); 

-- 6. Grant Permissions
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
