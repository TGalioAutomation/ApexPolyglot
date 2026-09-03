// LingoVoice — Store layer PostgreSQL (ADR-001)
// TOÀN BỘ truy vấn SQL đi qua class này. server.mjs và các module không tự tạo pool.
// Test inject một "store giả" cùng interface — npm test không cần PostgreSQL.
import pg from 'pg';
import { runMigrations } from './migrate.mjs';

const SCHEMA_PUBLIC = 'public';

export function normalizeUsername(raw) {
  return String(raw || '').trim().toLowerCase();
}

export class Store {
  // pool: pg.Pool thật, hoặc object giả có query() cho test
  constructor(pool) { this.pool = pool; }

  async query(text, params) { return this.pool.query(text, params); }

  async ping() {
    const { rows } = await this.query('SELECT version() AS v');
    return rows[0].v;
  }

  // ---- users ----
  async createUser({ username, passwordHash, displayName = '', role = 'learner', ageGroup = 'young-adult' }) {
    const { rows } = await this.query(
      `INSERT INTO users (username, display_name, password_hash, role, age_group)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, display_name, role, age_group, created_at`,
      [normalizeUsername(username), String(displayName || ''), passwordHash, role, ageGroup]
    );
    const user = rows[0];
    await this.query(
      `INSERT INTO learner_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [user.id]
    );
    return user;
  }

  async findUserByUsername(username) {
    const { rows } = await this.query(
      `SELECT id, username, display_name, role, age_group, password_hash, created_at
       FROM users WHERE LOWER(username) = $1`, [normalizeUsername(username)]
    );
    return rows[0] || null;
  }

  async findUserById(id) {
    const { rows } = await this.query(
      `SELECT id, username, display_name, role, age_group, created_at
       FROM users WHERE id = $1`, [id]
    );
    return rows[0] || null;
  }

  // ---- sessions ----
  async createSession({ userId, tokenHash, expiresAt }) {
    await this.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );
  }

  async findSessionByToken(tokenHash) {
    const { rows } = await this.query(
      `DELETE FROM sessions WHERE token_hash = $1 AND expires_at < now() RETURNING id`,
      [tokenHash]
    );
    if (rows.length) return null; // hết hạn — vừa dọn luôn
    const found = await this.query(
      `SELECT s.user_id, s.expires_at, u.username
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1`, [tokenHash]
    );
    return found.rows[0] || null;
  }

  async deleteSession(tokenHash) {
    await this.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
  }

  // ---- hồ sơ học viên ----
  async getProfile(userId) {
    const { rows } = await this.query(
      `SELECT * FROM learner_profiles WHERE user_id = $1`, [userId]
    );
    return rows[0] || null;
  }

  // Patch hồ sơ: trường có cột riêng map cột, phần còn lại vào extra (JSONB deep-ish merge)
  async patchProfile(userId, patch = {}) {
    const current = await this.getProfile(userId);
    if (!current) return null;
    const extra = { ...(current.extra || {}) };
    const sets = [];
    const params = [];
    let n = 1;
    const push = (col, value) => { sets.push(`${col} = $${n++}`); params.push(value); };

    if (Array.isArray(patch.goals)) push('goals', JSON.stringify(patch.goals));
    if (Number.isFinite(patch.dailyMinutes)) push('daily_minutes', Math.max(1, Math.min(240, Math.round(patch.dailyMinutes))));
    if (Number.isFinite(patch.enRatio)) push('en_ratio', Math.max(0, Math.min(1, patch.enRatio)));
    if (patch.teacherProfile && typeof patch.teacherProfile === 'object') push('teacher_profile', JSON.stringify(patch.teacherProfile));
    if (Number.isFinite(patch.day)) push('day', Math.max(1, Math.min(365, Math.round(patch.day))));
    if (patch.progress && typeof patch.progress === 'object') push('progress', JSON.stringify(patch.progress));
    for (const key of Object.keys(patch)) {
      if (!['goals', 'dailyMinutes', 'enRatio', 'teacherProfile', 'day', 'progress'].includes(key)) {
        extra[key] = patch[key];
      }
    }
    push('extra', JSON.stringify(extra));
    push('updated_at', new Date().toISOString());
    params.push(userId);
    await this.query(
      `UPDATE learner_profiles SET ${sets.join(', ')} WHERE user_id = $${n}`, params
    );
    return this.getProfile(userId);
  }

  // ---- placement ----
  async insertPlacement({ userId, lang, level, overall, skills = {}, weakest = null }) {
    const { rows } = await this.query(
      `INSERT INTO placements (user_id, lang, level, overall, skills, weakest)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, lang, level, overall, JSON.stringify(skills || {}), weakest]
    );
    return rows[0];
  }

  async latestPlacement(userId, lang) {
    const { rows } = await this.query(
      `SELECT level, overall, skills, weakest, taken_at FROM placements
       WHERE user_id = $1 AND lang = $2 ORDER BY taken_at DESC LIMIT 1`, [userId, lang]
    );
    return rows[0] || null;
  }

  // ---- SRS (LWW theo updated_at từng item — ADR-004) ----
  async upsertSrsItem(userId, item) {
    const { rowCount } = await this.query(
      `INSERT INTO srs_items (user_id, lang, vocab_id, term, meaning, state, interval_ms,
                              due_at, reps, consecutive_good, difficult, mastered, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (user_id, lang, LOWER(term)) DO UPDATE SET
         vocab_id         = EXCLUDED.vocab_id,
         meaning          = EXCLUDED.meaning,
         state            = EXCLUDED.state,
         interval_ms      = EXCLUDED.interval_ms,
         due_at           = EXCLUDED.due_at,
         reps             = EXCLUDED.reps,
         consecutive_good = EXCLUDED.consecutive_good,
         difficult        = EXCLUDED.difficult,
         mastered         = EXCLUDED.mastered,
         updated_at       = EXCLUDED.updated_at
       WHERE srs_items.updated_at <= EXCLUDED.updated_at`,
      [userId, item.lang, item.vocabId || null, item.term, item.meaning || '', item.state || 'learning',
       item.intervalMs ?? 60000, item.dueAt || null, item.reps ?? 0, item.consecutiveGood ?? 0,
       !!item.difficult, !!item.mastered, item.updatedAt || new Date().toISOString()]
    );
    return rowCount > 0;
  }

  async listSrsItems(userId) {
    const { rows } = await this.query(
      `SELECT lang, vocab_id, term, meaning, state, interval_ms, due_at, reps,
              consecutive_good, difficult, mastered, updated_at
       FROM srs_items WHERE user_id = $1 ORDER BY updated_at DESC`, [userId]
    );
    return rows.map(mapSrsRow);
  }

  // ---- lỗi sai (append-only) ----
  async insertMistakes(userId, items = []) {
    let count = 0;
    for (const m of items) {
      const { rowCount } = await this.query(
        `INSERT INTO mistakes (user_id, lang, skill, pattern, correct, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`, [userId, m.lang, m.skill || '', m.pattern, m.correct || '', m.createdAt || new Date().toISOString()]
      );
      count += rowCount;
    }
    return count;
  }

  async listMistakes(userId, limit = 100) {
    const { rows } = await this.query(
      `SELECT lang, skill, pattern, correct, created_at FROM mistakes
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [userId, Math.min(500, limit)]
    );
    return rows;
  }

  // ---- ghi nhớ giáo viên ----
  async addMemoryNote(userId, text) {
    const clean = String(text || '').trim().slice(0, 500);
    if (!clean) return null;
    const { rows } = await this.query(
      `INSERT INTO memory_notes (user_id, note) VALUES ($1, $2) RETURNING note, created_at`,
      [userId, clean]
    );
    return rows[0];
  }

  async listMemoryNotes(userId, limit = 50) {
    const { rows } = await this.query(
      `SELECT note, created_at FROM memory_notes WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`, [userId, Math.min(50, limit)]
    );
    return rows.reverse(); // cũ -> mới như memory.mjs
  }

  // ---- jobs (admin) ----
  async upsertJob(job) {
    await this.query(
      `INSERT INTO jobs (id, type, status, progress, payload, result, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6, now())
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, progress = EXCLUDED.progress,
         result = EXCLUDED.result, updated_at = now()`,
      [job.id, job.type, job.status, job.progress ?? 0, JSON.stringify(job.payload || {}), JSON.stringify(job.result || {})]
    );
  }

  async listJobs(limit = 30) {
    const { rows } = await this.query(
      `SELECT * FROM jobs ORDER BY updated_at DESC LIMIT $1`, [Math.min(100, limit)]
    );
    return rows;
  }

  // ---- gamification (roadmap #4) ----
  // Cộng dồn rollup ngày; day là khóa địa phương của người học (client gửi lên)
  async bumpDailyActivity(userId, day, { minutes = 0, words = 0, xp = 0, attempts = 0, correct = 0 } = {}) {
    const { rows } = await this.query(
      `INSERT INTO daily_activity (user_id, day, minutes, words, xp, attempts, correct)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, day) DO UPDATE SET
         minutes    = daily_activity.minutes + EXCLUDED.minutes,
         words      = daily_activity.words + EXCLUDED.words,
         xp         = daily_activity.xp + EXCLUDED.xp,
         attempts   = daily_activity.attempts + EXCLUDED.attempts,
         correct    = daily_activity.correct + EXCLUDED.correct,
         updated_at = now()
       RETURNING day::text AS day, minutes, words, xp, attempts, correct`,
      [userId, day, minutes, words, xp, attempts, correct]
    );
    return rows[0];
  }

  async listDailyActivity(userId, sinceDays = 400) {
    const { rows } = await this.query(
      `SELECT day::text AS day, minutes, words, xp, attempts, correct
       FROM daily_activity
       WHERE user_id = $1 AND day >= CURRENT_DATE - $2::int
       ORDER BY day ASC`,
      [userId, Math.min(400, Math.max(1, sinceDays))]
    );
    return rows;
  }

  async recordAttempts(userId, attempts = []) {
    let count = 0;
    for (const a of attempts) {
      const { rowCount } = await this.query(
        `INSERT INTO attempts (user_id, kind, item_ref, correct, grade, payload)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, a.kind, a.itemRef || null, typeof a.correct === 'boolean' ? a.correct : null,
         Number.isFinite(a.grade) ? a.grade : null, JSON.stringify({ lang: a.lang || null })]
      );
      count += rowCount;
    }
    return count;
  }

  async attemptsBreakdown(userId, days = 14) {
    const { rows } = await this.query(
      `SELECT kind, count(*)::int AS total, count(*) FILTER (WHERE correct)::int AS correct
       FROM attempts
       WHERE user_id = $1 AND created_at > now() - ($2::text || ' days')::interval
       GROUP BY kind ORDER BY total DESC`,
      [userId, String(Math.min(365, Math.max(1, days)))]
    );
    return rows;
  }

  async srsCounts(userId) {
    const { rows } = await this.query(
      `SELECT count(*)::int AS total, count(*) FILTER (WHERE mastered)::int AS mastered
       FROM srs_items WHERE user_id = $1`, [userId]
    );
    return rows[0] || { total: 0, mastered: 0 };
  }

  async srsDueCount(userId) {
    const { rows } = await this.query(
      `SELECT count(*)::int AS due FROM srs_items
       WHERE user_id = $1 AND NOT mastered AND (due_at IS NULL OR due_at <= now())`, [userId]
    );
    return rows[0]?.due || 0;
  }

  async addEarnedBadge(userId, badgeId) {
    const { rows } = await this.query(
      `INSERT INTO earned_badges (user_id, badge_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING earned_at`, [userId, badgeId]
    );
    return rows[0] || null; // null = đã có từ trước
  }

  async listEarnedBadges(userId) {
    const { rows } = await this.query(
      `SELECT badge_id, earned_at FROM earned_badges WHERE user_id = $1 ORDER BY earned_at ASC`, [userId]
    );
    return rows;
  }

  // ---- phụ huynh ----
  async createParentInvite(parentId, code, expiresAt) {
    await this.query(
      `INSERT INTO parent_invites (code, parent_id, expires_at) VALUES ($1, $2, $3)`,
      [code, parentId, expiresAt]
    );
    return { code, expiresAt };
  }

  // Con nhập mã: UPDATE có điều kiện (chưa dùng, chưa hết hạn) là nguyên tố — 2 trẻ
  // quét cùng mã thì chỉ một bên thắng. Trả về user phụ huynh hoặc null.
  async redeemParentInvite(childId, code) {
    const { rows } = await this.query(
      `UPDATE parent_invites SET child_id = $1, used_at = now()
       WHERE code = $2 AND child_id IS NULL AND expires_at > now()
       RETURNING parent_id`, [childId, String(code).toUpperCase()]
    );
    if (!rows.length) return null;
    const parentId = rows[0].parent_id;
    await this.query(
      `INSERT INTO parent_links (parent_id, child_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [parentId, childId]
    );
    return await this.findUserById(parentId);
  }

  async listParentInvites(parentId) {
    const { rows } = await this.query(
      `SELECT code, expires_at, used_at FROM parent_invites
       WHERE parent_id = $1 AND child_id IS NULL AND expires_at > now()
       ORDER BY created_at DESC LIMIT 5`, [parentId]
    );
    return rows;
  }

  async listChildrenForParent(parentId) {
    const { rows } = await this.query(
      `SELECT u.id, u.username, u.display_name, l.created_at AS linked_at
       FROM parent_links l JOIN users u ON u.id = l.child_id
       WHERE l.parent_id = $1 ORDER BY l.created_at ASC`, [parentId]
    );
    return rows;
  }

  async listParentsForChild(childId) {
    const { rows } = await this.query(
      `SELECT u.id, u.username, u.display_name, l.created_at AS linked_at
       FROM parent_links l JOIN users u ON u.id = l.parent_id
       WHERE l.child_id = $1 ORDER BY l.created_at ASC`, [childId]
    );
    return rows;
  }

  async isLinked(parentId, childId) {
    const { rowCount } = await this.query(
      `SELECT 1 FROM parent_links WHERE parent_id = $1 AND child_id = $2`, [parentId, childId]
    );
    return rowCount > 0;
  }

  async unlinkParentChild(parentId, childId) {
    const { rowCount } = await this.query(
      `DELETE FROM parent_links WHERE parent_id = $1 AND child_id = $2`, [parentId, childId]
    );
    return rowCount > 0;
  }

  async topMistakes(userId, days = 14, limit = 5) {
    const { rows } = await this.query(
      `SELECT pattern, max(correct) AS correct, count(*)::int AS count
       FROM mistakes
       WHERE user_id = $1 AND created_at > now() - ($2::text || ' days')::interval
       GROUP BY pattern ORDER BY count DESC, pattern ASC LIMIT $3`,
      [userId, String(Math.min(365, Math.max(1, days))), Math.min(20, limit)]
    );
    return rows;
  }
}

function mapSrsRow(row) {
  return {
    lang: row.lang,
    vocabId: row.vocab_id,
    term: row.term,
    meaning: row.meaning,
    state: row.state,
    intervalMs: Number(row.interval_ms),
    dueAt: row.due_at,
    reps: row.reps,
    consecutiveGood: row.consecutive_good,
    difficult: row.difficult,
    mastered: row.mastered,
    updatedAt: row.updated_at
  };
}

// Khởi động store từ env; trả null khi chưa cấu hình PostgreSQL (app vẫn chạy giảm tính năng)
export async function initializeStore({ connectionString, migrate = true, logger = console } = {}) {
  const url = connectionString || process.env.DATABASE_URL;
  if (!url) return null;
  const pool = new pg.Pool({ connectionString: url, max: 5 });
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    logger.error(`[db] không kết nối được PostgreSQL: ${error.message} — chạy chế độ không DB`);
    await pool.end().catch(() => {});
    return null;
  }
  const store = new Store(pool);
  if (migrate) await runMigrations(url, logger);
  logger.log('[db] PostgreSQL sẵn sàng');
  return store;
}

export { SCHEMA_PUBLIC };
