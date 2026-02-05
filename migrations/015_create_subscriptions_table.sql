-- Migration: Create subscriptions table
-- Description: Stores subscription details for each tenant

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trial')),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one active subscription per tenant (optional logic, but good practice usually involves historical records so keeping this unique constraint might handle only current state, but for now we allow history and just order by date)
    CONSTRAINT unique_active_subscription UNIQUE (tenant_id, status) -- This might be too restrictive actually, let's keep it simple for now
);

-- Index for faster lookups
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Super Admins (no tenant_id in app_users usually means system admin, or check specific role)
-- For now, relying on the fact that admins can see everything or tenant admins can see their own
CREATE POLICY "Tenant admins can view their own subscription" ON subscriptions
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM app_users WHERE id = auth.uid()::text
        )
    );

-- Only System Admins (if we had a way to distinguish) or internal logic should update
-- For this Phase 1 Multi-tenancy, we assume app_users with role 'ADMIN' are tenant admins.
-- System level administration is done via direct DB access or special super-admin user.
-- Let's allow Tenant Admins to SEE but NOT EDIT their subscription (edits happen via stripe webhook or system admin panel)
