CREATE TABLE IF NOT EXISTS tutor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_profile_id uuid REFERENCES language_profiles(id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('guided','roleplay','free_talk','challenge','replay')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended','abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  summary_ref text
);

CREATE TABLE IF NOT EXISTS tutor_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES tutor_conversations(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  role text NOT NULL CHECK (role IN ('user','tutor')),
  content_ref text,
  safety_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, sequence)
);

CREATE TABLE IF NOT EXISTS ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  purpose text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  prompt_version text,
  schema_version integer,
  input_hash text,
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded','failed','rejected')),
  latency_ms integer,
  token_usage_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_minor integer NOT NULL DEFAULT 0,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  template_ref text NOT NULL,
  schema_ref text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','retired')),
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (purpose, version)
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  topic text NOT NULL,
  schema_version integer NOT NULL DEFAULT 1,
  aggregate_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE IF NOT EXISTS job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  dedupe_key text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','running','succeeded','failed')),
  attempt integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  UNIQUE (job_type, dedupe_key)
);

CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES users(id) ON DELETE SET NULL,
  resource_type text NOT NULL,
  resource_id text,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved','dismissed')),
  resolved_at timestamptz
);
