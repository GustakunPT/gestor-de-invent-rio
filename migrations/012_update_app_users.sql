-- ============================================
-- MIGRATION 012: UPDATE APP_USERS FOR TENANCY
-- ============================================
-- This migration links users to tenants and adds tenant admin role.

-- Add tenant_id to app_users
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Add tenant admin flag (can manage tenant settings)
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS is_tenant_admin BOOLEAN DEFAULT false;

-- Create index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_app_users_tenant ON app_users(tenant_id);

-- Add comments
COMMENT ON COLUMN app_users.tenant_id IS 'The tenant this user belongs to';
COMMENT ON COLUMN app_users.is_tenant_admin IS 'Whether this user can manage tenant settings and other users';
