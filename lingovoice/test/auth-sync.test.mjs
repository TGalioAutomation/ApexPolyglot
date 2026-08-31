// Unit test auth + sync (không cần PostgreSQL — db/auth.mjs và db/sync.mjs là thuần)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword, verifyPassword, passwordStrengthOk,
  newSessionToken, tokenHash, sessionExpiry,
  sessionCookie, clearSessionCookie, parseSessionCookie, publicUser
} from '../db/auth.mjs';
import { normalizeSyncPayload, mapLegacyLocalState, validAgeGroup } from '../db/sync.mjs';

test('auth: scrypt hash + verify roundtrip', () => {
  const hash = hashPassword('mat-khau-123');
  assert.match(hash, /^scrypt\$16384\$8\$1\$/);
  assert.equal(verifyPassword('mat-khau-123', hash), true);
  assert.equal(verifyPassword('sai-roi', hash), false);
  assert.equal(verifyPassword('mat-khau-123', 'scrypt$abc'), false);
  assert.equal(verifyPassword('mat-khau-123', ''), false);
});

test('auth: salt khác nhau giữa 2 lần hash cùng password', () => {
  assert.notEqual(hashPassword('abc-12345'), hashPassword('abc-12345'));
});

test('auth: chính sách mật khẩu', () => {
  assert.equal(passwordStrengthOk('12345678'), true);
  assert.equal(passwordStrengthOk('ngan'), false);
  assert.equal(passwordStrengthOk(null), false);
  assert.equal(passwordStrengthOk('x'.repeat(129)), false);
});

test('auth: token + hash + cookie', () => {
  const a = newSessionToken();
  const b = newSessionToken();
  assert.notEqual(a, b);
  assert.equal(tokenHash(a), tokenHash(a));
  assert.notEqual(tokenHash(a), tokenHash(b));
  const cookie = sessionCookie(a);
  assert.match(cookie, /^lv_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  const request = { headers: { cookie: `other=1; ${cookie}` } };
  assert.equal(parseSessionCookie(request), a);
  assert.equal(parseSessionCookie({ headers: {} }), null);
  assert.match(clearSessionCookie(), /Max-Age=0/);
  assert.ok(sessionExpiry() > new Date());
});

test('auth: publicUser chỉ lộ trường an toàn', () => {
  const user = publicUser({ id: 'u1', username: 'lan', display_name: 'Lan', role: 'learner', age_group: 'teen', password_hash: 'secret' });
  assert.deepEqual(user, { id: 'u1', username: 'lan', displayName: 'Lan', role: 'learner', ageGroup: 'teen' });
  assert.equal(publicUser(null), null);
});

test('sync: normalize payload chuẩn', () => {
  const out = normalizeSyncPayload({
    srs: [
      { lang: 'en', term: ' deadline ', state: 'review', intervalMs: 86400000, dueAt: '2026-09-01T00:00:00Z', reps: 3, consecutiveGood: 2, updatedAt: '2026-08-31T02:00:00Z' },
      { lang: 'fr', term: 'bỏ vì sai ngôn ngữ' },
      { lang: 'en', term: '' },
      null
    ],
    mistakes: [
      { lang: 'en', skill: 'writing', pattern: ' I am agree ', correct: 'I agree', createdAt: 1756598400000 },
      { lang: 'en', pattern: '   ' }
    ],
    profile: { goals: ['cong-viec', 'goal-lạ'], dailyMinutes: 20, splitEn: 70, day: 9 },
    teacherProfile: { personality: 'strict' },
    progress: { en: { learned: 4 } }
  });
  assert.equal(out.srs.length, 1);
  assert.equal(out.srs[0].term, 'deadline');
  assert.equal(out.srs[0].dueAt, '2026-09-01T00:00:00.000Z'); // ISO chuẩn hóa qua Date
  assert.equal(out.mistakes.length, 1);
  assert.equal(out.mistakes[0].pattern, 'I am agree');
  assert.match(out.mistakes[0].createdAt, /^20\d\d-/); // ms epoch → ISO
  assert.deepEqual(out.profilePatch.goals, ['cong-viec']);
  assert.equal(out.profilePatch.dailyMinutes, 20);
  assert.equal(out.profilePatch.enRatio, 0.7);
  assert.equal(out.profilePatch.day, 9);
  assert.deepEqual(out.profilePatch.teacherProfile, { personality: 'strict' });
});

test('sync: normalize payload rỗng/thiếu an toàn', () => {
  const out = normalizeSyncPayload({});
  assert.deepEqual(out, { srs: [], mistakes: [], profilePatch: {} });
  const junk = normalizeSyncPayload({ srs: 'không phải mảng', mistakes: 42 });
  assert.deepEqual(junk.srs, []);
  assert.deepEqual(junk.mistakes, []);
});

test('sync: map dữ liệu localStorage legacy', () => {
  const mapped = mapLegacyLocalState({
    'lv-srs': { items: { en: {
      'en-a1-deadline': { state: 'review', difficulty: 0.7, dueAt: 1756598400000, lastGrade: 4, reps: 3 },
      'en-a1-meeting': { state: 'new', difficulty: 0.2, dueAt: null, lastGrade: null, reps: 0 }
    }, zh: {} } },
    'lv-mistakes': [{ id: 'm-1', lang: 'en', skill: 'listening', pattern: 'Dictation sai', correct: 'deadline', status: 'new', at: 1756598400000 }],
    'lv-profile': { displayName: 'Lan', goals: ['thi'], dailyMinutes: 30, splitEn: 50, ageGroup: 'teen', placement: { en: { level: 3, overall: 55, skills: { listening: 50 }, weakest: 'listening' } } },
    'lv-teacher-profile': { personality: 'energetic', voices: { en: 'F4' }, speed: 1.0 },
    'lingovoice-progress': { known: ['a'], quiz: { correct: 2, total: 5 }, listened: ['x'] },
    'lv-days': { '2026-08-30': true }
  });
  assert.equal(mapped.srs.length, 2);
  assert.equal(mapped.srs[0].vocabId, 'en-a1-deadline');
  assert.equal(mapped.srs[0].term, 'en-a1-deadline'); // legacy dùng vocabId làm khóa
  assert.equal(mapped.srs[0].difficult, true);
  assert.match(mapped.srs[0].dueAt, /^20\d\d-/);
  assert.equal(mapped.srs[1].difficult, false);
  assert.equal(mapped.mistakes.length, 1);
  assert.equal(mapped.profile.dailyMinutes, 30);
  assert.equal(mapped.profile.splitEn, 50);
  assert.equal(mapped.profile.ageGroup, 'teen');
  assert.equal(mapped.profile.placement.en.level, 3);
  assert.equal(mapped.teacherProfile.personality, 'energetic');
  assert.deepEqual(mapped.progress.legacyProgress.known, ['a']);
  assert.ok(mapped.days.days['2026-08-30']);
});

test('sync: legacy rỗng/hỏng không nổ', () => {
  const mapped = mapLegacyLocalState({});
  assert.deepEqual(mapped.srs, []);
  assert.deepEqual(mapped.mistakes, []);
  assert.equal(mapped.profile.splitEn, 60);
  const broken = mapLegacyLocalState({ 'lv-srs': null, 'lv-mistakes': 'x', 'lv-profile': null });
  assert.deepEqual(broken.srs, []);
  assert.deepEqual(broken.mistakes, []);
});

test('sync: ageGroup hợp lệ', () => {
  assert.equal(validAgeGroup('child'), 'child');
  assert.equal(validAgeGroup('người ngoài hành tinh'), 'young-adult');
});
