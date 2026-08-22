CREATE TABLE IF NOT EXISTS learner_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_minutes integer NOT NULL DEFAULT 35 CHECK (daily_minutes BETWEEN 5 AND 240),
  correction_style text NOT NULL DEFAULT 'balanced',
  privacy_mode text NOT NULL DEFAULT 'standard',
  accessibility_prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS language_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language text NOT NULL CHECK (language IN ('en','zh-CN')),
  current_level integer CHECK (current_level BETWEEN 1 AND 7),
  target_level integer NOT NULL DEFAULT 7 CHECK (target_level BETWEEN 1 AND 7),
  allocation_pct integer NOT NULL DEFAULT 100 CHECK (allocation_pct BETWEEN 0 AND 100),
  baseline_status text NOT NULL DEFAULT 'pending' CHECK (baseline_status IN ('pending','preliminary','verified')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, language)
);

CREATE TABLE IF NOT EXISTS learner_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  goal_type text NOT NULL,
  description text NOT NULL CHECK (length(description) BETWEEN 1 AND 2000),
  target_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived','achieved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  course_version_id uuid,
  start_date date NOT NULL,
  target_date date NOT NULL,
  weekly_minutes integer NOT NULL DEFAULT 245 CHECK (weekly_minutes BETWEEN 60 AND 1680),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  plan_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS study_plans_active_uq ON study_plans (language_profile_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS daily_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  local_date date NOT NULL,
  plan_version integer NOT NULL DEFAULT 1,
  items_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision_ref text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (language_profile_id, local_date, plan_version)
);
