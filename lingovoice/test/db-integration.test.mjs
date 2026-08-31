// Integration test PostgreSQL thật — CHỈ chạy khi có TEST_DATABASE_URL.
//   TEST_DATABASE_URL=postgres://lingovoice:lingovoice@localhost:5432/lingovoice node --test test/db-integration.test.mjs
// Không set env → tự skip, npm test vẫn xanh (xem docs/testing.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { runMigrations } from '../db/migrate.mjs';
import { Store } from '../db/store.mjs';
import { hashPassword, verifyPassword, newSessionToken, tokenHash, sessionExpiry } from '../db/auth.mjs';
import { buildSyncSnapshot, loadMemoryFromStore, saveMemoryToStore } from '../db/memory-adapter.mjs';

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
