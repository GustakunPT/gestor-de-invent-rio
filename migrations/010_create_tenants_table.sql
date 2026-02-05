-- ============================================
-- MIGRATION 010: CREATE TENANTS TABLE
-- ============================================
-- This migration creates the core tenants table for multi-tenancy support.
-- Each tenant represents a separate company/organization using the system.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- URL-friendly identifier (e.g., 'gustavo-lda')
  
  -- Company Details
  nif TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  
  -- Settings (stored as JSON for flexibility)
  settings JSONB DEFAULT '{
    "taxRate": 23,
    "currency": "EUR",
    "theme": "light",
    "lowStockAlertEnabled": true,
    "expiryAlertDays": 30
  }'::jsonb,
  
  -- Subscription Info
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  max_users INTEGER DEFAULT 1,
  max_products INTEGER DEFAULT 100,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for slug lookup (used in URLs)
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Create index for active tenants
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tenant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tenants_updated_at ON tenants;
CREATE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_updated_at();

-- Add comment for documentation
COMMENT ON TABLE tenants IS 'Multi-tenant organizations using the inventory management system';
COMMENT ON COLUMN tenants.slug IS 'URL-friendly unique identifier for the tenant';
COMMENT ON COLUMN tenants.settings IS 'JSON object containing tenant-specific settings like tax rate, currency, theme';
COMMENT ON COLUMN tenants.plan IS 'Subscription plan: starter (1 user, 100 products), professional (5 users, 1000 products), enterprise (unlimited)';
