-- 001: Danh tính — users + sessions (ADR-002)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'learner'
                CHECK (role IN ('learner','parent','teacher','admin')),
  age_group     TEXT NOT NULL DEFAULT 'young-adult'
                CHECK (age_group IN ('preschool','child','teen','young-adult')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- username so khớp không phân biệt hoa thường, không cần extension citext
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username));

CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,          -- SHA-256 của token, không lưu token thô
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
