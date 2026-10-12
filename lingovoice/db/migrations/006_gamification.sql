-- 006: Gamification + liên kết phụ huynh (roadmap #4)
-- daily_activity: rollup 1 dòng/user/ngày — streak, XP, dashboard phụ huynh tính từ đây cho rẻ.
CREATE TABLE IF NOT EXISTS daily_activity (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day        DATE NOT NULL,
  minutes    INT  NOT NULL DEFAULT 0,
  words      INT  NOT NULL DEFAULT 0,
  xp         INT  NOT NULL DEFAULT 0,
  attempts   INT  NOT NULL DEFAULT 0,
  correct    INT  NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);

-- earned_badges: chỉ lưu huy hiệu ĐÃ đạt — định nghĩa badge là code thuần (db/gamification.mjs)
CREATE TABLE IF NOT EXISTS earned_badges (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- Liên kết phụ huynh ↔ con: con TỰ nhập mã (không ai thấy gì ngoài tiến độ)
CREATE TABLE IF NOT EXISTS parent_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);
CREATE INDEX IF NOT EXISTS parent_links_parent_idx ON parent_links (parent_id);
CREATE INDEX IF NOT EXISTS parent_links_child_idx ON parent_links (child_id);

-- Mã mời 1 lần dùng, hết hạn 7 ngày; child_id NULL = chưa ai dùng
CREATE TABLE IF NOT EXISTS parent_invites (
  code       TEXT PRIMARY KEY,
  parent_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS parent_invites_parent_idx ON parent_invites (parent_id);
