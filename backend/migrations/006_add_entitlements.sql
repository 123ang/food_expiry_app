-- Migration 006: Server-owned purchase entitlements
-- RevenueCat/Apple state is mirrored here; clients must not authorize cloud features themselves.

CREATE TABLE IF NOT EXISTS entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entitlement_key VARCHAR(50) NOT NULL CHECK (entitlement_key IN ('personal_lifetime', 'premium', 'family')),
    product_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'revenuecat',
    status VARCHAR(32) NOT NULL CHECK (status IN ('active', 'grace_period', 'billing_issue', 'expired', 'revoked')),
    environment VARCHAR(32) NOT NULL CHECK (environment IN ('sandbox', 'production')),
    original_transaction_id VARCHAR(255),
    expires_at TIMESTAMPTZ NULL,
    will_renew BOOLEAN NOT NULL DEFAULT false,
    purchased_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, entitlement_key, provider)
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user_status
  ON entitlements(user_id, status, environment);

CREATE INDEX IF NOT EXISTS idx_entitlements_expires_at
  ON entitlements(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS revenuecat_events (
    event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    app_user_id VARCHAR(255) NOT NULL,
    environment VARCHAR(32) NOT NULL CHECK (environment IN ('sandbox', 'production')),
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_pending
  ON revenuecat_events(received_at)
  WHERE processed_at IS NULL;
