CREATE TABLE IF NOT EXISTS assessment_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL CHECK (language IN ('en','zh-CN')),
  kind text NOT NULL CHECK (kind IN ('placement','weekly','phase')),
  blueprint_version integer NOT NULL DEFAULT 1,
  rubric_version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','retired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id uuid NOT NULL REFERENCES assessment_definitions(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE SET NULL,
  modality text NOT NULL CHECK (modality IN ('listening','reading','speaking')),
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  content_json jsonb NOT NULL,
  answer_key_ref text
);

CREATE TABLE IF NOT EXISTS assessment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  definition_id uuid REFERENCES assessment_definitions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','finalized','abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  result_json jsonb,
  result_version integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES assessment_runs(id) ON DELETE CASCADE,
  item_id uuid REFERENCES assessment_items(id) ON DELETE SET NULL,
  client_attempt_id text NOT NULL,
  response_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  deterministic_score numeric NOT NULL DEFAULT 0,
  feedback_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (run_id, client_attempt_id)
);

CREATE TABLE IF NOT EXISTS learning_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  source_run_id uuid REFERENCES assessment_runs(id) ON DELETE SET NULL,
  skill_id uuid REFERENCES skills(id) ON DELETE SET NULL,
  reason_code text NOT NULL,
  task_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','expired','cancelled')),
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requirement_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES learning_requirements(id) ON DELETE CASCADE,
  skill_evidence_id uuid NOT NULL REFERENCES skill_evidence(id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  decision_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (requirement_id, skill_evidence_id)
);

CREATE TABLE IF NOT EXISTS learning_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL CHECK (language IN ('en','zh-CN')),
  type text NOT NULL CHECK (type IN ('word','phrase','grammar','mistake')),
  canonical_text text NOT NULL,
  context_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_items (
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES learning_items(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'new' CHECK (state IN ('new','learning','review','mastered')),
  stability numeric NOT NULL DEFAULT 0,
  difficulty numeric NOT NULL DEFAULT 0 CHECK (difficulty BETWEEN 0 AND 1),
  due_at timestamptz,
  last_grade numeric,
  revision integer NOT NULL DEFAULT 0,
  PRIMARY KEY (language_profile_id, item_id)
);

CREATE TABLE IF NOT EXISTS review_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES learning_items(id) ON DELETE CASCADE,
  grade numeric NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  algorithm_version integer NOT NULL DEFAULT 1
);
