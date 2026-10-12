-- 007: Vòng đời nội dung (roadmap #2 Admin CMS) — draft/reviewed + nguồn AI cho 3 bảng content.
-- Bảng hiện còn rỗng (frontend vẫn đọc literal) nên ALTER an toàn; seed nạp nội dung gốc sau.
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'reviewed';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lessons_status_check') THEN
    ALTER TABLE lessons ADD CONSTRAINT lessons_status_check CHECK (status IN ('draft','reviewed'));
  END IF;
END $$;

ALTER TABLE readings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'reviewed';
ALTER TABLE readings ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'readings_status_check') THEN
    ALTER TABLE readings ADD CONSTRAINT readings_status_check CHECK (status IN ('draft','reviewed'));
  END IF;
END $$;

ALTER TABLE roleplay_scenarios ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'reviewed';
ALTER TABLE roleplay_scenarios ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE roleplay_scenarios ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE roleplay_scenarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE roleplay_scenarios ADD COLUMN IF NOT EXISTS vi_title TEXT NOT NULL DEFAULT '';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roleplay_scenarios_status_check') THEN
    ALTER TABLE roleplay_scenarios ADD CONSTRAINT roleplay_scenarios_status_check CHECK (status IN ('draft','reviewed'));
  END IF;
END $$;

-- lesson_items: thêm kind 'sentence' cho thư viện câu mẫu (payload {id,text,vi,pinyin})
ALTER TABLE lesson_items DROP CONSTRAINT IF EXISTS lesson_items_kind_check;
ALTER TABLE lesson_items ADD CONSTRAINT lesson_items_kind_check
  CHECK (kind IN ('vocab','quiz','listening','reading','shadow','sentence'));

CREATE INDEX IF NOT EXISTS lessons_status_idx ON lessons (status, lang);
CREATE INDEX IF NOT EXISTS readings_status_idx ON readings (status, lang);
CREATE INDEX IF NOT EXISTS roleplay_status_idx ON roleplay_scenarios (status, lang);
