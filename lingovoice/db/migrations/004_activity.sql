-- 004: Hoạt động học — buổi học + lượt làm (nền analytics + gamification roadmap #4)
CREATE TABLE IF NOT EXISTS learning_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lang       TEXT CHECK (lang IN ('en','zh')),
  skill      TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at   TIMESTAMPTZ,
  stats      JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS learning_sessions_user_idx ON learning_sessions (user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS attempts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES learning_sessions(id) ON DELETE SET NULL,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  item_ref   TEXT,
  correct    BOOLEAN,
  grade      INT,
  payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attempts_user_idx ON attempts (user_id, created_at DESC);
