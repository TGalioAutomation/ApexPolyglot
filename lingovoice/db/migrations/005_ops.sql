-- 005: Vận hành — job queue bền vững + index cache audio TTS
CREATE TABLE IF NOT EXISTS jobs (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL CHECK (type IN ('pregen','audit','vocab')),
  status     TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','error')),
  progress   INT NOT NULL DEFAULT 0,
  payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  result     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audio_cache (
  key            TEXT PRIMARY KEY,        -- SHA-256 (design|lang|model|voice|text|speed|params)
  language       TEXT NOT NULL,
  text           TEXT NOT NULL,
  model          TEXT,
  voice          TEXT,
  design_version TEXT,
  parameters     JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_path      TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
