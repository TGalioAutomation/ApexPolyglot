// Test seed nội dung gốc (literal -> DB) + validate content-map — phần thuần không cần DB,
// phần PostgreSQL thật chỉ chạy khi có TEST_DATABASE_URL (giống db-integration.test.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeedRows, seedContent } from '../scripts/seed-content.mjs';
import {
  validateLessonInput, validateReadingInput, validateRoleplayInput,
  lessonRowsToApi, readingRowsToApi, roleplayRowsToApi, buildContentId, slugify
} from '../db/content-map.mjs';

test('buildSeedRows: trích đủ 3 loại từ literal, id ổn định theo lang (chạy 2 lần giống hệt)', () => {
  const a = buildSeedRows();
  const b = buildSeedRows();
  assert.ok(a.lessons.length >= 10);   // 2 ngôn ngữ × 5 chủ đề
  assert.ok(a.readings.length >= 4);
  assert.equal(a.roleplay.length, 6);
  assert.deepEqual(a, b);              // idempotent về dữ liệu

  const ids = (list) => list.map((r) => r.id);
  // lessons: id khác nhau giữa en/zh cho cùng chủ đề tương ứng
  const lessonIds = ids(a.lessons);
  assert.equal(new Set(lessonIds).size, lessonIds.length, 'id lesson không trùng');
  // readings giữ id gốc của frontend
  assert.ok(a.readings.some((r) => /^r-en-1/.test(r.id) && r.level === 1));
  // roleplay giữ id gốc
  assert.ok(a.roleplay.some((r) => r.id === 'restaurant' && r.lang === 'en'));
  // câu giữ id gốc + đủ text/vi
  for (const l of a.lessons) {
    for (const s of l.sentences) assert.ok(s.id && s.text && s.vi, `câu thiếu trường trong ${l.id}`);
  }
});

test('seedContent: upsert đúng loại/số lượng — fake store chứng minh không nhân bản', async () => {
  const calls = [];
  const seen = new Set();
  const fakeStore = {
    async upsertContent(type, row) {
      const key = `${type}:${row.id}`;
      if (seen.has(key)) throw new Error(`nhân bản ${key}`);
      seen.add(key);
      calls.push({ type, id: row.id, status: row.status });
    }
  };
  const stats = await seedContent(fakeStore, { logger: { log() {} } });
  assert.equal(stats.lessons, buildSeedRows().lessons.length);
  assert.equal(stats.readings, buildSeedRows().readings.length);
  assert.equal(stats.roleplay, 6);
  assert.ok(calls.every((c) => c.status === 'reviewed'));
});

test('validate CMS input: chặt theo loại, mã lỗi rõ ràng', () => {
  assert.equal(validateLessonInput({ topic: 'Chào', sentences: [{ text: 'Hi', vi: 'Chào' }] }).ok, true);
  assert.equal(validateLessonInput({ topic: 'Chào', sentences: [] }).error, 'SENTENCES_INVALID');
  assert.equal(validateLessonInput({ topic: '', sentences: [{ text: 'Hi', vi: 'x' }] }).error, 'TOPIC_REQUIRED');
  assert.equal(validateLessonInput({ topic: 't', sentences: [{ text: 'Hi' }] }).error, 'SENTENCE_INVALID');

  const okReading = validateReadingInput({
    title: 'A Trip', level: 2,
    paragraphs: ['P one', 'P two'],
    questions: [{ q: 'Q?', options: ['a', 'b', 'c'], answer: 2 }]
  });
  assert.equal(okReading.ok, true);
  assert.equal(okReading.value.questions[0].answer, 2);
  assert.equal(validateReadingInput({ title: 'T', level: 8, paragraphs: ['p'] }).error, 'LEVEL_INVALID');
  assert.equal(validateReadingInput({ title: 'T', level: 1, paragraphs: [] }).error, 'PARAGRAPHS_INVALID');
  assert.equal(validateReadingInput({ title: 'T', level: 1, paragraphs: ['p'], questions: [{ q: 'Q', options: ['a'], answer: 0 }] }).error, 'OPTIONS_INVALID');
  assert.equal(validateReadingInput({ title: 'T', level: 1, paragraphs: ['p'], questions: [{ q: 'Q', options: ['a', 'b'], answer: 5 }] }).error, 'ANSWER_INVALID');

  assert.equal(validateRoleplayInput({ title: 'Hotel', vi: 'Khách sạn' }).ok, true);
  assert.equal(validateRoleplayInput({ title: 'Hotel', vi: '' }).error, 'VI_TITLE_REQUIRED');
  const rp = validateRoleplayInput({ title: 'Hotel', vi: 'KS', persona: 'Lễ tân', opening: 'Welcome!', prompts: ['Check in', ''] });
  assert.equal(rp.ok, false); // prompt rỗng -> từ chối cả nháp
  assert.equal(validateRoleplayInput({ title: 'H', vi: 'v', prompts: Array(13).fill('x') }).error, 'PROMPTS_INVALID');
});

test('row -> API shape mirror literal frontend', () => {
  const lessons = lessonRowsToApi(
    [{ id: 'l1', title: 'Chào hỏi' }],
    [
      { lesson_id: 'l1', order_index: 1, payload: { id: 'b', text: 'Hi', vi: 'Chào' } },
      { lesson_id: 'l1', order_index: 0, payload: { id: 'a', text: 'Hello', vi: 'Xin chào', pinyin: 'həˈləʊ' } }
    ]
  );
  assert.deepEqual(lessons, [{ topic: 'Chào hỏi', sentences: [
    { id: 'a', text: 'Hello', vi: 'Xin chào', pinyin: 'həˈləʊ' },
    { id: 'b', text: 'Hi', vi: 'Chào' }
  ] }]);

  const levels = readingRowsToApi([{ id: 'r-1', level: '1', title: 'T', body: 'Đoạn 1\n\nĐoạn 2', metadata: { questions: [{ q: 'Q', options: ['a', 'b'], answer: 1 }] } }]);
  assert.equal(levels['1'][0].paragraphs.length, 2);
  assert.equal(levels['1'][0].questions[0].answer, 1);

  assert.deepEqual(roleplayRowsToApi([{ id: 'hotel', title: 'At the hotel', vi_title: 'Khách sạn' }]), [{ id: 'hotel', title: 'At the hotel', vi: 'Khách sạn' }]);
});

test('buildContentId/slugify: bỏ dấu, giữ chữ Hán, ổn định', () => {
  assert.equal(slugify('Chào hỏi'), 'chao-hoi');
  assert.equal(slugify('问候 · Chào hỏi'), '问候-chao-hoi');
  assert.equal(buildContentId('readings', 'en', 'A Trip to the Coast'), 'r-en-a-trip-to-the-coast');
  assert.equal(buildContentId('roleplay', 'zh', 'Ẩm thực'), 'rp-zh-am-thuc');
  assert.equal(buildContentId('lessons', 'en', '!!!'), 'l-en-x');
});

// ---- PostgreSQL thật ----
test('store content: migration + vòng đời draft/reviewed trên PostgreSQL thật', async (t) => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return t.skip('Thiếu TEST_DATABASE_URL — bỏ qua integration DB');
  const { runMigrations } = await import('../db/migrate.mjs');
  const { Store } = await import('../db/store.mjs');
  const pg = (await import('pg')).default;
  await runMigrations(url);
  const store = new Store(new pg.Pool({ connectionString: url }));
  try {
    await seedContent(store, { logger: { log() {} } });
    // API shape đọc lại đúng literal
    const { rows, items } = await store.listContent('lessons', { lang: 'en', status: 'reviewed' });
    assert.ok(rows.length >= 5);
    const api = lessonRowsToApi(rows, items);
    assert.ok(api.some((t) => t.topic === 'Chào hỏi' && t.sentences.some((s) => s.id === 'en-greet-1')));

    // vòng đời draft -> reviewed -> xóa
    const draft = await store.upsertContent('readings', {
      id: 'r-test-cms-draft', lang: 'en', status: 'draft',
      title: 'CMS Draft Test', level: 3, paragraphs: ['One'], questions: []
    });
    assert.equal(draft.status, 'draft');
    const notReviewed = await store.listContent('readings', { lang: 'en', status: 'reviewed' });
    assert.equal(notReviewed.rows.some((r) => r.id === 'r-test-cms-draft'), false, 'draft không lọt API đọc');
    const approved = await store.setContentStatus('readings', 'r-test-cms-draft', 'reviewed');
    assert.equal(approved.status, 'reviewed');
    const counts = await store.contentCounts();
    assert.ok(counts.readings.reviewed >= 1);
    assert.equal(await store.deleteContent('readings', 'r-test-cms-draft'), true);
    assert.equal(await store.getContent('readings', 'r-test-cms-draft'), null);

    // idempotent: seed lại không đổi số lượng
    const before = (await store.listContent('readings', { lang: 'en', status: 'reviewed' })).rows.length;
    await seedContent(store, { logger: { log() {} } });
    const after = (await store.listContent('readings', { lang: 'en', status: 'reviewed' })).rows.length;
    assert.equal(after, before);
  } finally {
    await store.pool.end();
  }
});
