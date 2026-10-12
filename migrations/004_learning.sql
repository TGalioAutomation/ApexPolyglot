CREATE TABLE IF NOT EXISTS learning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  lesson_snapshot jsonb,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  meaningful_seconds integer NOT NULL DEFAULT 0 CHECK (meaningful_seconds >= 0)
);
CREATE INDEX IF NOT EXISTS learning_sessions_profile_idx ON learning_sessions (language_profile_id, started_at DESC);

CREATE TABLE IF NOT EXISTS attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE SET NULL,
  client_attempt_id text NOT NULL,
  response_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  score_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','graded','failed')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, client_attempt_id)
);

CREATE TABLE IF NOT EXISTS speech_attempts (
  attempt_id uuid PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE,
  media_object_id uuid,
  transcript text,
  asr_confidence numeric,
  analysis_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  analysis_version integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','analyzed','failed'))
);

CREATE TABLE IF NOT EXISTS media_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('speech_capture','content_audio','upload_tmp')),
  storage_key text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  bytes bigint NOT NULL CHECK (bytes >= 0),
  sha256 text,
  retention_class text NOT NULL DEFAULT 'transient' CHECK (retention_class IN ('transient','short','history')),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','deleted')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skill_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id text NOT NULL,
  measure numeric NOT NULL DEFAULT 0,
  weight numeric NOT NULL DEFAULT 1 CHECK (weight BETWEEN 0 AND 1),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  policy_version text NOT NULL,
  UNIQUE (source_type, source_id, skill_id)
);
CREATE INDEX IF NOT EXISTS skill_evidence_profile_idx ON skill_evidence (language_profile_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS skill_mastery (
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  recognition numeric NOT NULL DEFAULT 0 CHECK (recognition BETWEEN 0 AND 1),
  comprehension numeric NOT NULL DEFAULT 0 CHECK (comprehension BETWEEN 0 AND 1),
  production numeric NOT NULL DEFAULT 0 CHECK (production BETWEEN 0 AND 1),
  retention numeric NOT NULL DEFAULT 0 CHECK (retention BETWEEN 0 AND 1),
  confidence numeric NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (language_profile_id, skill_id)
);

CREATE TABLE IF NOT EXISTS daily_progress (
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  local_date date NOT NULL,
  meaningful_seconds integer NOT NULL DEFAULT 0 CHECK (meaningful_seconds >= 0),
  sessions_completed integer NOT NULL DEFAULT 0 CHECK (sessions_completed >= 0),
  goal_met boolean NOT NULL DEFAULT false,
  PRIMARY KEY (language_profile_id, local_date)
);

CREATE TABLE IF NOT EXISTS progress_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_profile_id uuid NOT NULL REFERENCES language_profiles(id) ON DELETE CASCADE,
  level integer NOT NULL CHECK (level BETWEEN 1 AND 7),
  dimensions_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_cutoff timestamptz,
  policy_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
