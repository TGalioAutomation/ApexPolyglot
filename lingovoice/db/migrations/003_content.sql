-- 003: Nội dung học — nền cho roadmap #2 (Admin CMS). Frontend hiện vẫn đọc literal.
CREATE TABLE IF NOT EXISTS vocab_items (
  id           TEXT PRIMARY KEY,           -- en-a1-term | zh-hsk1-词
  lang         TEXT NOT NULL CHECK (lang IN ('en','zh')),
  term         TEXT NOT NULL,
  pos          TEXT,
  ipa          TEXT,
  pinyin       TEXT,
  meaning      TEXT NOT NULL DEFAULT '',
  example      TEXT NOT NULL DEFAULT '',
  translation  TEXT NOT NULL DEFAULT '',
  collocations JSONB NOT NULL DEFAULT '[]'::jsonb,
  freq         INT CHECK (freq BETWEEN 1 AND 5),
  workplace    BOOLEAN NOT NULL DEFAULT FALSE,
  topic        TEXT,
  cefr         TEXT CHECK (cefr IN ('A1','A2','B1','B2','C1','C2')),
  reviewed     BOOLEAN NOT NULL DEFAULT FALSE,
  provider     TEXT,
  model        TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vocab_lang_idx ON vocab_items (lang, reviewed);

CREATE TABLE IF NOT EXISTS lessons (
  id          TEXT PRIMARY KEY,
  lang        TEXT NOT NULL CHECK (lang IN ('en','zh')),
  stage       TEXT NOT NULL CHECK (stage IN ('preschool','child','teen','young-adult')),
  title       TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS lesson_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('vocab','quiz','listening','reading','shadow')),
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  audio_text  TEXT,
  order_index INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS lesson_items_lesson_idx ON lesson_items (lesson_id, order_index);

CREATE TABLE IF NOT EXISTS readings (
  id       TEXT PRIMARY KEY,
  lang     TEXT NOT NULL CHECK (lang IN ('en','zh')),
  level    TEXT NOT NULL,
  title    TEXT NOT NULL,
  body     TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS roleplay_scenarios (
  id      TEXT PRIMARY KEY,
  lang    TEXT NOT NULL CHECK (lang IN ('en','zh')),
  stage   TEXT NOT NULL CHECK (stage IN ('preschool','child','teen','young-adult')),
  title   TEXT NOT NULL,
  persona TEXT NOT NULL DEFAULT '',
  opening TEXT NOT NULL DEFAULT '',
  prompts JSONB NOT NULL DEFAULT '[]'::jsonb
);
