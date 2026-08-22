CREATE TABLE IF NOT EXISTS billing_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_customer_ref text NOT NULL,
  billing_email_ref text,
  tax_profile_ref text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_customer_ref)
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  currency text NOT NULL DEFAULT 'VND',
  amount_minor integer NOT NULL CHECK (amount_minor >= 0),
  interval text NOT NULL CHECK (interval IN ('day','week','month','year')),
  interval_count integer NOT NULL DEFAULT 1,
  provider_price_ref text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id uuid NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  price_id uuid NOT NULL REFERENCES prices(id),
  provider text NOT NULL,
  provider_subscription_ref text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('trialing','active','past_due','paused','canceled','ended')),
  current_period_start date,
  current_period_end date,
  cancel_at timestamptz,
  ended_at timestamptz,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id uuid NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('charge','refund','credit','dispute')),
  provider text NOT NULL,
  provider_transaction_ref text NOT NULL UNIQUE,
  amount_minor integer NOT NULL,
  currency text NOT NULL DEFAULT 'VND',
  status text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  original_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS entitlement_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  capability text NOT NULL,
  source_type text NOT NULL,
  source_id text,
  quantity integer NOT NULL DEFAULT 1,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  revoked_at timestamptz,
  reason_code text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entitlement_snapshots (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  capability text NOT NULL,
  effective_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_cutoff timestamptz,
  computed_at timestamptz NOT NULL DEFAULT now(),
  policy_version text NOT NULL,
  PRIMARY KEY (tenant_id, subject_type, subject_id, capability)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payload_hash text NOT NULL,
  payload_ref text,
  signature_status text NOT NULL DEFAULT 'pending' CHECK (signature_status IN ('pending','valid','invalid')),
  received_at timestamptz NOT NULL DEFAULT now(),
  processing_status text NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending','processed','failed','dlq')),
  processed_at timestamptz,
  error_code text,
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS webhook_processing_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event_id uuid NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  attempt integer NOT NULL,
  handler_version integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL,
  error_code text,
  result_hash text,
  UNIQUE (webhook_event_id, attempt)
);
