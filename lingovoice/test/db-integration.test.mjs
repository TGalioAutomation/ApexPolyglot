// Integration test PostgreSQL thật — CHỈ chạy khi có TEST_DATABASE_URL.
//   TEST_DATABASE_URL=postgres://lingovoice:lingovoice@localhost:5432/lingovoice node --test test/db-integration.test.mjs
// Không set env → tự skip, npm test vẫn xanh (xem docs/testing.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import pg from 'pg';
import { runMigrations } from '../db/migrate.mjs';
import { Store } from '../db/store.mjs';
import { hashPassword, verifyPassword, newSessionToken, tokenHash, sessionExpiry } from '../db/auth.mjs';
import { buildSyncSnapshot, loadMemoryFromStore, saveMemoryToStore } from '../db/memory-adapter.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

test('store: migration + auth + sync LWW trên PostgreSQL thật', async (t) => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return t.skip('Thiếu TEST_DATABASE_URL — bỏ qua integration DB');

  await runMigrations(url);
  const pool = new pg.Pool({ connectionString: url });
  const store = new Store(pool);
  const username = `it-${Date.now()}`;

  try {
    // users + password
    const created = await store.createUser({ username, passwordHash: hashPassword('password-123'), displayName: 'IT', ageGroup: 'teen' });
    assert.ok(created.id);
    assert.equal((await store.ping()).includes('PostgreSQL'), true);
    const found = await store.findUserByUsername(username.toUpperCase()); // không phân biệt hoa thường
    assert.equal(found.id, created.id);
    assert.equal(verifyPassword('password-123', found.password_hash), true);
    assert.equal(await store.findUserByUsername('khong-ton-tai-xyz'), null);

    // session
    const token = newSessionToken();
    await store.createSession({ userId: created.id, tokenHash: tokenHash(token), expiresAt: sessionExpiry() });
    const session = await store.findSessionByToken(tokenHash(token));
    assert.equal(session.user_id, created.id);
    assert.equal(await store.findSessionByToken(tokenHash('token-lừa')), null);
    await store.deleteSession(tokenHash(token));
    assert.equal(await store.findSessionByToken(tokenHash(token)), null);

    // profile patch
    await store.patchProfile(created.id, { goals: ['thi'], dailyMinutes: 20, enRatio: 0.8, day: 5, weakSkills: { en: 'listening' } });
    const profile = await store.getProfile(created.id);
    assert.deepEqual(profile.goals, ['thi']);
    assert.equal(profile.daily_minutes, 20);
    assert.equal(Number(profile.en_ratio), 0.8);
    assert.deepEqual(profile.extra.weakSkills, { en: 'listening' }); // phần lạ vào extra

    // SRS LWW: mới trước, cũ sau → cái cũ bị từ chối
    const base = { lang: 'en', vocabId: 'en-a1-deadline', term: 'en-a1-deadline', meaning: 'hạn chót' };
    const newer = { ...base, state: 'review', reps: 3, updatedAt: '2026-08-31T10:00:00.000Z' };
    const older = { ...base, state: 'learning', reps: 1, updatedAt: '2026-08-30T10:00:00.000Z' };
    assert.equal(await store.upsertSrsItem(created.id, newer), true);
    assert.equal(await store.upsertSrsItem(created.id, older), false); // stale
    const srs = await store.listSrsItems(created.id);
    assert.equal(srs.length, 1);
    assert.equal(srs[0].state, 'review');
    assert.equal(srs[0].reps, 3);
    // tới mới hơn vẫn lên
    assert.equal(await store.upsertSrsItem(created.id, { ...newer, reps: 4, updatedAt: '2026-08-31T11:00:00.000Z' }), true);

    // mistakes + notes + placement
    assert.equal(await store.insertMistakes(created.id, [{ lang: 'en', skill: 'writing', pattern: 'I am agree', correct: 'I agree' }]), 1);
    await store.addMemoryNote(created.id, 'Học viên sợ nói trước đám đông');
    await store.insertPlacement({ userId: created.id, lang: 'en', level: 3, overall: 55, skills: { listening: 50 }, weakest: 'listening' });

    // memory adapter shape khớp DEFAULT_MEMORY
    const mem = await loadMemoryFromStore(store, { id: created.id, username });
    assert.equal(mem.learnerId, username);
    assert.deepEqual(mem.profile.goals, ['thi']);
    assert.equal(mem.placement.en.level, 3);
    assert.equal(mem.notes[0].text, 'Học viên sợ nói trước đám đông');
    assert.equal(mem.recentMistakes[0].pattern, 'I am agree');
    assert.equal(mem.teacherProfile.personality, 'warm'); // mặc định khi chưa set

    // save qua adapter
    await saveMemoryToStore(store, { id: created.id, username }, { profile: { goals: ['cong-viec'], splitEn: 60 }, day: 7, notes: [{ text: 'tiến bộ nhanh' }] });
    const mem2 = await loadMemoryFromStore(store, { id: created.id, username });
    assert.deepEqual(mem2.profile.goals, ['cong-viec']);
    assert.equal(mem2.profile.splitEn, 60);
    assert.equal(mem2.day, 7);
    assert.equal(mem2.notes.at(-1).text, 'tiến bộ nhanh');

    // snapshot sync
    const snapshot = await buildSyncSnapshot(store, { id: created.id, username });
    assert.equal(snapshot.srs.length, 1);
    assert.equal(snapshot.mistakes.length, 1);
    assert.equal(snapshot.placements.en.level, 3);
  } finally {
    // dọn dữ liệu test (cascade toàn bộ)
    await pool.query('DELETE FROM users WHERE LOWER(username) LIKE $1', [`${username}`]);
    await pool.end();
  }
});

test('gamification: rollup ngày + huy hiệu + liên kết phụ huynh trên PostgreSQL thật', async (t) => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return t.skip('Thiếu TEST_DATABASE_URL — bỏ qua integration DB');

  await runMigrations(url);
  const pool = new pg.Pool({ connectionString: url });
  const store = new Store(pool);
  const stamp = Date.now();
  const childName = `it-kid-${stamp}`;
  const parentName = `it-parent-${stamp}`;

  try {
    const child = await store.createUser({ username: childName, passwordHash: hashPassword('password-123'), displayName: 'Kid' });
    const parent = await store.createUser({ username: parentName, passwordHash: hashPassword('password-123'), displayName: 'Parent', role: 'parent' });

    // rollup ngày: cộng dồn 2 lần cùng ngày
    const day = new Date().toISOString().slice(0, 10);
    const first = await store.bumpDailyActivity(child.id, day, { minutes: 10, words: 3, xp: 40, attempts: 4, correct: 3 });
    assert.equal(first.minutes, 10);
    const second = await store.bumpDailyActivity(child.id, day, { minutes: 5, xp: 7, attempts: 1, correct: 1 });
    assert.equal(second.minutes, 15);
    assert.equal(second.xp, 47);
    const rows = await store.listDailyActivity(child.id, 30);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].correct, 4);

    // attempts chi tiết + breakdown
    await store.recordAttempts(child.id, [
      { kind: 'vocab', itemRef: 'en-a1-deadline', correct: true, grade: 4, lang: 'en' },
      { kind: 'listening', itemRef: 'en-greet-1', correct: false, grade: 2, lang: 'en' }
    ]);
    const breakdown = await store.attemptsBreakdown(child.id, 14);
    assert.equal(breakdown.length, 2);
    assert.equal(breakdown[0].total, 1);

    // srs counts + due
    await store.upsertSrsItem(child.id, { lang: 'en', vocabId: 'en-a1-deadline', term: 'en-a1-deadline', meaning: 'hạn chót', state: 'mastered', mastered: true, dueAt: null, updatedAt: new Date().toISOString() });
    const counts = await store.srsCounts(child.id);
    assert.deepEqual({ total: counts.total, mastered: counts.mastered }, { total: 1, mastered: 1 });
    assert.equal(await store.srsDueCount(child.id), 0); // mastered không tính due

    // huy hiệu: thêm mới rồi trùng
    assert.ok(await store.addEarnedBadge(child.id, 'first-day'));
    assert.equal(await store.addEarnedBadge(child.id, 'first-day'), null);
    assert.equal((await store.listEarnedBadges(child.id)).length, 1);

    // liên kết phụ huynh: mã sai → null; đúng → parent; trùng link không nhân đôi
    await store.createParentInvite(parent.id, 'TESTCODE', new Date(Date.now() + 86400000));
    assert.equal(await store.redeemParentInvite(child.id, 'SAIMATKHAU'), null);
    const parentUser = await store.redeemParentInvite(child.id, 'testcode'); // uppercase trong store
    assert.equal(parentUser.id, parent.id);
    assert.equal(await store.isLinked(parent.id, child.id), true);
    assert.equal((await store.listChildrenForParent(parent.id)).length, 1);
    assert.equal((await store.listParentsForChild(child.id)).length, 1);
    assert.equal(await store.unlinkParentChild(parent.id, child.id), true);
    assert.equal(await store.isLinked(parent.id, child.id), false);
  } finally {
    await pool.query('DELETE FROM users WHERE LOWER(username) LIKE $1 OR LOWER(username) LIKE $2', [`${childName}`, `${parentName}`]);
    await pool.end();
  }
});

test('gamification: luồng API phụ huynh ↔ con end-to-end qua HTTP', async (t) => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return t.skip('Thiếu TEST_DATABASE_URL — bỏ qua integration DB');

  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
  const port = 4199;
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), DATABASE_URL: url, OPENVOX_API: 'http://127.0.0.1:9', PREGEN_DISABLED: '1', MIGRATE_ON_START: '1' },
    stdio: 'ignore'
  });
  const wait = async () => {
    for (let i = 0; i < 100; i++) {
      try { await fetch(`http://127.0.0.1:${port}/healthz`); return; }
      catch { await new Promise((r) => setTimeout(r, 150)); }
    }
    throw new Error('server test không lên được (port 4199 bận?)');
  };
  await wait();

  const call = async (method, path, body, cookie) => {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const setCookie = res.headers.get('set-cookie');
    return {
      status: res.status,
      body: await res.json().catch(() => ({})),
      cookie: setCookie ? setCookie.split(';')[0] : cookie
    };
  };
  const stamp = Date.now();

  try {
    // đăng ký parent + con
    const parent = await call('POST', '/api/auth/register', { username: `e2e-parent-${stamp}`, password: 'password-123', role: 'parent' });
    assert.equal(parent.status, 201);
    assert.equal(parent.body.user.role, 'parent');
    const kid = await call('POST', '/api/auth/register', { username: `e2e-kid-${stamp}`, password: 'password-123' });
    assert.equal(kid.status, 201);

    // con không tạo được mã mời
    const forbidden = await call('POST', '/api/parent/invite', {}, kid.cookie);
    assert.equal(forbidden.status, 403);
    assert.equal(forbidden.body.code, 'ROLE_REQUIRED');

    // parent tạo mã → con nhập sai → nhập đúng
    const invite = await call('POST', '/api/parent/invite', {}, parent.cookie);
    assert.equal(invite.status, 201);
    assert.match(invite.body.code, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
    const bad = await call('POST', '/api/parent/link', { code: 'SAIMATKHAU' }, kid.cookie);
    assert.equal(bad.status, 400); // sai định dạng (10 ký tự, có I/A/U…)
    assert.equal(bad.body.code, 'INVITE_CODE_INVALID');
    const ghost = await call('POST', '/api/parent/link', { code: 'ZZZZZZZZ' }, kid.cookie);
    assert.equal(ghost.status, 404); // đúng định dạng nhưng không tồn tại/hết hạn
    const linked = await call('POST', '/api/parent/link', { code: invite.body.code.toLowerCase() }, kid.cookie);
    assert.equal(linked.status, 200);
    const reuse = await call('POST', '/api/parent/link', { code: invite.body.code }, kid.cookie);
    assert.equal(reuse.status, 404); // mã chỉ dùng 1 lần

    // con ghi hoạt động → XP + huy hiệu đầu tiên
    const activity = await call('POST', '/api/activity', {
      minutes: 12, words: 3,
      attempts: [
        { kind: 'vocab', itemRef: 'en-a1-deadline', correct: true, grade: 4, lang: 'en' },
        { kind: 'listening', itemRef: 'en-greet-1', correct: false, grade: 2, lang: 'en' }
      ]
    }, kid.cookie);
    assert.equal(activity.status, 200);
    assert.equal(activity.body.added.xp, 10 + 2 + 9 + 12);
    assert.equal(activity.body.streak.current >= 1, true);
    const firstDay = activity.body.badges.find((b) => b.id === 'first-day');
    assert.equal(firstDay.earned, true);

    const summary = await call('GET', '/api/gamification/summary', undefined, kid.cookie);
    assert.equal(summary.status, 200);
    assert.equal(summary.body.xp.total, activity.body.xp.total);

    // parent nhìn thấy con + dashboard
    const children = await call('GET', '/api/parent/children', undefined, parent.cookie);
    assert.equal(children.status, 200);
    assert.equal(children.body.children.length, 1);
    const childId = children.body.children[0].id;
    const dash = await call('GET', `/api/parent/children/${childId}/dashboard`, undefined, parent.cookie);
    assert.equal(dash.status, 200);
    assert.equal(dash.body.child.id, childId);
    assert.ok(dash.body.suggestions.length >= 1);
    assert.equal(dash.body.srs.due !== undefined, true);
    assert.equal(dash.body.days.length >= 1, true);

    // parent gỡ liên kết → dashboard 404
    const unlinked = await call('DELETE', `/api/parent/children/${childId}`, undefined, parent.cookie);
    assert.equal(unlinked.status, 200);
    const dashAfter = await call('GET', `/api/parent/children/${childId}/dashboard`, undefined, parent.cookie);
    assert.equal(dashAfter.status, 404);

    // summary không có session → 401
    const anon = await call('GET', '/api/gamification/summary');
    assert.equal(anon.status, 401);
  } finally {
    child.kill();
    // dọn user test
    const { Client } = pg;
    const client = new Client({ connectionString: url });
    await client.connect();
    await client.query('DELETE FROM users WHERE LOWER(username) LIKE $1 OR LOWER(username) LIKE $2', [`e2e-parent-${stamp}`, `e2e-kid-${stamp}`]);
    await client.end();
  }
});
