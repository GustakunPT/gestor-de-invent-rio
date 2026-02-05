-- Allow authenticated users to create tenants (Onboarding)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tenants;
CREATE POLICY "Enable insert for authenticated users only" ON tenants
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to create subscriptions (for their own tenant)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON subscriptions;
CREATE POLICY "Enable insert for authenticated users" ON subscriptions
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow users to update their own tenant_id during onboarding
DROP POLICY IF EXISTS "Tenant isolation for app_users" ON app_users;

-- Re-create app_users policies
-- 1. View: Users can see themselves and users in their tenant
DROP POLICY IF EXISTS "Users can view themselves and tenant members" ON app_users;
CREATE POLICY "Users can view themselves and tenant members" ON app_users
FOR SELECT
USING (
  id = auth.uid()::text 
  OR 
  (tenant_id IS NOT NULL AND tenant_id = get_current_tenant_id())
);

-- 2. Update: Users can update their own profile (including setting tenant_id if null)
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
CREATE POLICY "Users can update own profile" ON app_users
FOR UPDATE
USING (id = auth.uid()::text); 

-- Ensure createTenant function in API works by granting permissions
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
