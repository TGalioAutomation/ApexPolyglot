-- 002: Dữ liệu học — hồ sơ, placement, SRS, lỗi sai, ghi nhớ giáo viên
CREATE TABLE IF NOT EXISTS learner_profiles (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  goals              JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_minutes      INT   NOT NULL DEFAULT 15,
  en_ratio           NUMERIC(3,2) NOT NULL DEFAULT 0.70,
  teacher_profile    JSONB NOT NULL DEFAULT '{}'::jsonb,
  day                INT   NOT NULL DEFAULT 1,
  journey_started_at TIMESTAMPTZ,
  progress           JSONB NOT NULL DEFAULT '{}'::jsonb,
  extra              JSONB NOT NULL DEFAULT '{}'::jsonb, -- phần patch legacy không map cột
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS placements (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lang     TEXT NOT NULL CHECK (lang IN ('en','zh')),
  level    INT CHECK (level BETWEEN 1 AND 7),
  overall  INT CHECK (overall BETWEEN 0 AND 100),
  skills   JSONB NOT NULL DEFAULT '{}'::jsonb,
  weakest  TEXT,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS placements_user_lang_idx ON placements (user_id, lang, taken_at DESC);

CREATE TABLE IF NOT EXISTS srs_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lang             TEXT NOT NULL CHECK (lang IN ('en','zh')),
  vocab_id         TEXT,
  term             TEXT NOT NULL,
  meaning          TEXT NOT NULL DEFAULT '',
  state            TEXT NOT NULL DEFAULT 'learning'
                   CHECK (state IN ('learning','difficult','review','mastered')),
  interval_ms      BIGINT NOT NULL DEFAULT 60000,
  due_at           TIMESTAMPTZ,
  reps             INT NOT NULL DEFAULT 0,
  consecutive_good INT NOT NULL DEFAULT 0,
  difficult        BOOLEAN NOT NULL DEFAULT FALSE,
  mastered         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Khóa nghiệp vụ phục vụ upsert đồng bộ (LWW theo updated_at)
CREATE UNIQUE INDEX IF NOT EXISTS srs_user_lang_term_idx
  ON srs_items (user_id, lang, LOWER(term));
CREATE INDEX IF NOT EXISTS srs_due_idx ON srs_items (user_id, due_at);

CREATE TABLE IF NOT EXISTS mistakes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lang       TEXT NOT NULL CHECK (lang IN ('en','zh')),
  skill      TEXT NOT NULL DEFAULT '',
  pattern    TEXT NOT NULL,
  correct    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mistakes_user_idx ON mistakes (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS memory_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note       TEXT NOT NULL CHECK (char_length(note) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memory_notes_user_idx ON memory_notes (user_id, created_at DESC);
