// Unit test gamification thuần function (không cần DB) — roadmap #4
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeActivityPayload, xpForActivity, computeStreaks, shiftDayKey,
  levelOf, LEVELS, BADGES, newlyEarnedBadges, badgeStats,
  newInviteCode, validInviteCode, parentSuggestions, utcDayKey
} from '../db/gamification.mjs';
import { validRegisterRole } from '../db/sync.mjs';

const TODAY = '2026-09-04';

test('activity: chuẩn hóa payload + kẹp giới hạn', () => {
  const out = normalizeActivityPayload({
    day: '2026-09-03',
    minutes: 9999,
    words: -5,
    attempts: [
      { kind: 'listening', itemRef: 'en-greet-1', correct: true, grade: 5, lang: 'en' },
      { kind: 'hack', correct: 'yes', grade: 99 },
      null,
      { lang: 'fr' }
    ]
  }, { todayKey: TODAY });
  assert.equal(out.day, '2026-09-03');
  assert.equal(out.minutes, 240);
  assert.equal(out.words, 0);
  assert.equal(out.attempts.length, 3);
  assert.deepEqual(out.attempts[0], { kind: 'listening', itemRef: 'en-greet-1', correct: true, grade: 5, lang: 'en' });
  assert.equal(out.attempts[1].kind, 'vocab'); // kind lạ → vocab
  assert.equal(out.attempts[1].correct, null);
  assert.equal(out.attempts[1].grade, 5); // kẹp 1..5
  assert.equal(out.attempts[2].lang, null);
});

test('activity: chặn ngày tương lai và ngày quá cũ, rỗng an toàn', () => {
  assert.equal(normalizeActivityPayload({ day: '2026-09-07' }, { todayKey: TODAY }).day, TODAY);
  assert.equal(normalizeActivityPayload({ day: '2020-01-01' }, { todayKey: TODAY }).day, TODAY);
  assert.equal(normalizeActivityPayload({ day: 'không phải ngày' }, { todayKey: TODAY }).day, TODAY);
  const empty = normalizeActivityPayload({}, { todayKey: TODAY });
  assert.equal(empty.day, TODAY);
  assert.equal(empty.minutes, 0);
  assert.deepEqual(empty.attempts, []);
  // múi giờ trước UTC tối đa +1 ngày
  assert.equal(normalizeActivityPayload({ day: '2026-09-05' }, { todayKey: TODAY }).day, '2026-09-05');
});

test('xp: đúng thưởng nhiều, sai vẫn có, phút trần 60', () => {
  assert.equal(xpForActivity({ attempts: [{ correct: true }, { correct: true }, { correct: false }] }), 22);
  assert.equal(xpForActivity({ minutes: 120, words: 2 }), 66); // min(120,60) + 2*3
  assert.equal(xpForActivity({ minutes: 30, words: 10, attempts: [] }), 60);
  assert.equal(xpForActivity({}), 0);
});

test('streak: current cho phép hôm nay chưa học, longest chạy đúng', () => {
  const days = ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-03'];
  assert.deepEqual(computeStreaks(days, '2026-09-04'), { current: 1, longest: 3 });
  assert.deepEqual(computeStreaks(days, '2026-09-01'), { current: 3, longest: 3 }); // đếm ngược từ ngày cuối có học
  assert.deepEqual(computeStreaks([], TODAY), { current: 0, longest: 0 });
  assert.deepEqual(computeStreaks([TODAY], TODAY), { current: 1, longest: 1 });
});

test('shiftDayKey: cộng trừ qua biên tháng', () => {
  assert.equal(shiftDayKey('2026-09-01', -1), '2026-08-31');
  assert.equal(shiftDayKey('2026-08-31', 1), '2026-09-01');
  assert.equal(shiftDayKey('2026-12-31', 1), '2027-01-01');
});

test('level: đúng bậc + tiến độ 0..1, trần không next', () => {
  assert.equal(levelOf(0).name, 'Hạt giống');
  assert.equal(levelOf(0).level, 1);
  assert.equal(levelOf(150).name, 'Mầm non');
  assert.ok(levelOf(150).progress > 0 && levelOf(150).progress < 1);
  assert.equal(levelOf(99999).name, LEVELS.at(-1).name);
  assert.equal(levelOf(99999).progress, 1);
  assert.equal(levelOf(99999).nextLevelXp, null);
});

test('badge: phát đúng điều kiện, không trùng đã đạt', () => {
  const stats = badgeStats({
    activityRows: [{ correct: 55, xp: 600 }, { correct: 0, xp: 0 }],
    streak: 7, srsTotal: 12, srsMastered: 10
  });
  assert.equal(stats.daysActive, 2);
  assert.equal(stats.totalCorrect, 55);
  assert.equal(stats.totalXp, 600);
  const earned = new Set(['first-day', 'streak-7']);
  const fresh = newlyEarnedBadges(stats, earned);
  const ids = fresh.map((b) => b.id).sort();
  assert.ok(ids.includes('words-10'));
  assert.ok(ids.includes('correct-50'));
  assert.ok(ids.includes('xp-500'));
  assert.ok(ids.includes('master-10'));
  assert.ok(!ids.includes('first-day')); // đã có từ trước
  assert.ok(!ids.includes('streak-30'));
  assert.equal(BADGES.length >= 8, true);
});

test('invite code: 8 ký tự, không chứa 0/O/1/I/L, validate đúng', () => {
  for (let i = 0; i < 50; i++) {
    const code = newInviteCode();
    assert.match(code, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
  }
  assert.equal(validInviteCode(newInviteCode()), true);
  assert.equal(validInviteCode('oooo1111'), false);
  assert.equal(validInviteCode('abc'), false);
  assert.equal(validInviteCode(null), false);
});

test('gợi ý phụ huynh: rule-based theo dữ liệu', () => {
  const s = parentSuggestions({
    missedDays: 4, dueCount: 6,
    topMistakes: [{ pattern: 'I am agree', correct: 'I agree', count: 3 }],
    minutes7d: 10, dailyMinutes: 25, streak: 0
  });
  assert.equal(s.length >= 3, true);
  assert.ok(s[0].includes('4 ngày'));
  assert.ok(s.some((x) => x.includes('I am agree')));
  assert.ok(s.some((x) => x.includes('ôn')));
  const praise = parentSuggestions({ missedDays: 0, dueCount: 0, topMistakes: [], minutes7d: 300, dailyMinutes: 25, streak: 7 });
  assert.ok(praise.some((x) => x.includes('7 ngày')));
  assert.equal(parentSuggestions({}).length, 1);
});

test('register: role chỉ learner|parent', () => {
  assert.equal(validRegisterRole('parent'), 'parent');
  assert.equal(validRegisterRole('learner'), 'learner');
  assert.equal(validRegisterRole('admin'), 'learner');
  assert.equal(validRegisterRole(undefined), 'learner');
});

test('utcDayKey: dạng YYYY-MM-DD', () => {
  assert.match(utcDayKey(), /^\d{4}-\d{2}-\d{2}$/);
});
