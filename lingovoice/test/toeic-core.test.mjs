// LingoVoice — unit test bộ sinh đề thi thử TOEIC cuối buổi (toeic-core.cjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import Toeic from '../public/toeic-core.cjs';

const VOCAB = [
  { id: 'en-b1-agenda', term: 'agenda', meaning: 'chương trình nghị sự', pos: 'noun', cefr: 'B1', freq: 1,
    example: 'The first item on the agenda is the budget review.', translation: 'Mục đầu tiên trong chương trình nghị sự là xem xét ngân sách.',
    collocations: ['on the agenda', 'set the agenda'] },
  { id: 'en-b1-insurance', term: 'insurance', meaning: 'bảo hiểm', pos: 'noun', cefr: 'B1', freq: 2,
    example: 'I need to buy health insurance before I travel abroad.', translation: 'Tôi cần mua bảo hiểm y tế trước khi đi du lịch nước ngoài.',
    collocations: ['health insurance', 'insurance policy'] },
  { id: 'en-a2-deadline', term: 'deadline', meaning: 'hạn chót', pos: 'noun', cefr: 'A2', freq: 1,
    example: 'We must meet the deadline for the report.', translation: 'Chúng ta phải kịp hạn chót nộp báo cáo.',
    collocations: ['meet the deadline', 'tight deadline'] },
  { id: 'en-a2-report', term: 'report', meaning: 'báo cáo', pos: 'noun', cefr: 'A2', freq: 1,
    example: 'She sent the report to her manager.', translation: 'Cô ấy gửi báo cáo cho quản lý.',
    collocations: ['write a report', 'final report'] },
  { id: 'en-b1-improve', term: 'improve', meaning: 'cải thiện', pos: 'verb', cefr: 'B1', freq: 1,
    example: 'I want to improve my English skills.', translation: 'Tôi muốn cải thiện kỹ năng tiếng Anh.',
    collocations: ['improve skills', 'improve quality'] },
  { id: 'en-b1-supply', term: 'supply', meaning: 'cung cấp, nguồn cung', pos: 'noun', cefr: 'B1', freq: 2,
    example: 'The supply of parts was delayed.', translation: 'Nguồn cung phụ tùng bị chậm.',
    collocations: ['supply chain', 'water supply'] }
];

function srsOf(state, extra = {}) {
  return { state, difficulty: 0.3, dueAt: null, reps: 1, ...extra };
}

test('50 đề × 3 mức thời lượng, đúng số câu tương ứng + đủ sàn câu nghe', () => {
  assert.equal(Toeic.FORM_COUNT, 50);
  assert.deepEqual(Toeic.DURATIONS.map((d) => d.min), [10, 15, 30]);
  for (let form = 1; form <= 50; form += 3) {
    for (const { min, questions } of Toeic.DURATIONS) {
      const t = Toeic.buildTest({ form, durationMin: min, vocab: VOCAB });
      assert.equal(t.questions.length, questions, `đề ${form}/${min} phút`);
      const listening = t.questions.filter((q) => q.kind === 'listening').length;
      assert.ok(listening >= 2, `đề ${form}/${min} phút cần ≥2 câu nghe, có ${listening}`);
    }
  }
});

test('đề deterministic: cùng form + dữ liệu -> cùng đề, khác form -> khác đề', () => {
  const srs = { 'en-a2-deadline': srsOf('learning') };
  const a = Toeic.buildTest({ form: 5, durationMin: 10, vocab: VOCAB, srsItems: srs, now: 1000 });
  const b = Toeic.buildTest({ form: 5, durationMin: 10, vocab: VOCAB, srsItems: srs, now: 1000 });
  const c = Toeic.buildTest({ form: 6, durationMin: 10, vocab: VOCAB, srsItems: srs, now: 1000 });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.questions, c.questions);
});

test('mọi câu hỏi có 4 lựa chọn phân biệt và đáp án hợp lệ', () => {
  for (let form = 1; form <= 50; form += 7) {
    const t = Toeic.buildTest({ form, durationMin: 15, vocab: VOCAB });
    for (const q of t.questions) {
      assert.equal(q.choices.length, 4, `${q.id} đủ 4 lựa chọn`);
      assert.equal(new Set(q.choices).size, 4, `${q.id} lựa chọn không trùng nhau`);
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, `${q.id} đáp án trong phạm vi`);
      assert.ok(q.choices[q.answer].length > 0, `${q.id} đáp án không rỗng`);
      assert.ok(['vocab', 'reading', 'listening'].includes(q.kind), `${q.id} kind hợp lệ`);
    }
  }
});

test('ưu tiên từ đã học: từ đang học xuất hiện trong đề, từ chưa học chỉ chèn bù', () => {
  const srs = {
    'en-a2-deadline': srsOf('learning'),
    'en-b1-agenda': srsOf('review', { dueAt: 500 }), // đến hạn ôn
    'en-b1-insurance': srsOf('review', { dueAt: 9e15 }) // chưa đến hạn
  };
  const t = Toeic.buildTest({ form: 2, durationMin: 10, vocab: VOCAB, srsItems: srs, now: 1000 });
  const terms = new Set(t.questions.map((q) => q.term));
  assert.ok(terms.has('deadline'), 'từ đang học phải có');
  assert.ok(terms.has('agenda'), 'từ đến hạn ôn phải có');
  assert.equal(t.meta.learnedCount, 3);
  assert.equal(t.meta.learnedUsed, 3);
});

test('không có SRS (hồ sơ mới): vẫn sinh đủ đề từ kho chung, không crash', () => {
  const t = Toeic.buildTest({ form: 9, durationMin: 10, vocab: VOCAB, srsItems: {}, now: 0 });
  assert.equal(t.questions.length, 12);
  assert.equal(t.meta.learnedCount, 0);
});

test('kho từ ít hơn số câu: xoay vòng từ, ưu tiên đổi dạng khi lặp', () => {
  const t = Toeic.buildTest({ form: 1, durationMin: 30, vocab: VOCAB.slice(0, 4), srsItems: {}, now: 0 });
  assert.equal(t.questions.length, 36, 'vẫn đủ 36 câu');
  const count = new Map();
  for (const q of t.questions) {
    const key = `${q.vocabId}#${q.type}`;
    count.set(key, (count.get(key) || 0) + 1);
  }
  // 4 từ × 5 dạng = 20 cặp duy nhất cho 36 câu -> cặp lặp tối đa 2 lần
  assert.ok([...count.values()].every((c) => c <= 2), 'không cào cắm một cặp từ+dạng quá 2 lần');
});

test('dạng câu đặc biệt: fill có chỗ trống, listen có audioText = term, translate là câu mẫu', () => {
  const t = Toeic.buildTest({ form: 3, durationMin: 30, vocab: VOCAB, srsItems: { 'en-b1-agenda': srsOf('learning') }, now: 0 });
  const fill = t.questions.filter((q) => q.type === 'fill');
  assert.ok(fill.length > 0, 'có câu điền từ');
  for (const q of fill) assert.ok(q.prompt.includes('_____'), 'câu fill chứa chỗ trống');
  for (const q of t.questions.filter((x) => x.type === 'listen')) {
    assert.equal(q.audioText, q.term, 'audio đọc đúng từ mục tiêu');
    assert.ok(q.choices.includes(q.meaning), 'lựa chọn chứa nghĩa đúng');
  }
  for (const q of t.questions.filter((x) => x.type === 'translate')) {
    assert.equal(q.prompt, q.example, 'translate dùng câu mẫu');
    assert.ok(q.choices.includes(q.translation), 'lựa chọn chứa bản dịch đúng');
  }
});

test('scoreTest: chấm đúng/sai/bỏ trống + gộp theo kỹ năng', () => {
  const t = Toeic.buildTest({ form: 4, durationMin: 10, vocab: VOCAB, srsItems: {}, now: 0 });
  const allRight = Toeic.scoreTest(t.questions, t.questions.map((q) => q.answer));
  assert.equal(allRight.correct, 12);
  assert.equal(allRight.score, 100);
  assert.equal(allRight.wrong.length, 0);

  const answers = t.questions.map((q, i) => (i === 0 ? null : i === 1 ? -1 + q.answer : q.answer));
  const mixed = Toeic.scoreTest(t.questions, answers); // câu 0 bỏ trống, câu 1 sai
  assert.equal(mixed.correct, 10);
  assert.equal(mixed.score, 83);
  assert.equal(mixed.wrong.length, 2);
  assert.ok(mixed.wrong.every((w) => w.answerText && w.term && w.meaning), 'câu sai có dữ liệu xem lại');
  const totalByKind = Object.values(mixed.byKind).reduce((a, b) => a + b.total, 0);
  assert.equal(totalByKind, 12, 'byKind phủ đủ số câu');
});
