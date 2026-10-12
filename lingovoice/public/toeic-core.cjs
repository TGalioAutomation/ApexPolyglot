/* LingoVoice — TOEIC mini-test core (UMD: browser + Node test)
 * Sinh đề thi thử cuối buổi 100% deterministic từ dữ liệu vocab + SRS của người học,
 * cùng triết lý placement.mjs: không dùng LLM — đề tái tạo được, chấm được ở client.
 *
 * Ngữ cảnh đề: 5 dạng câu phỏng theo TOEIC (Part 2/5), mô phỏng bằng dữ liệu sẵn có:
 *  - meaning     (kind vocab)     : chọn từ tiếng Anh theo nghĩa tiếng Việt
 *  - fill        (kind reading)   : điền từ còn thiếu vào câu mẫu (Part 5)
 *  - collocation (kind vocab)     : hoàn thành cụm từ ghép đúng
 *  - listen      (kind listening) : nghe audio từ vựng (pregen) rồi chọn nghĩa (Part 2)
 *  - translate   (kind reading)   : đọc câu tiếng Anh, chọn dịch đúng (Part 4/reading)
 *
 * Ưu tiên từ ĐÃ HỌC theo SRS: đang học > đến hạn ôn > chưa đến hạn > đã thành thạo.
 * Thiếu từ đã học thì bơm từ trong kho theo CEFR từ dễ lên — đề vẫn làm được với hồ sơ mới.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ToeicCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const FORM_COUNT = 50;
  const DURATIONS = [
    { min: 10, questions: 12 },
    { min: 15, questions: 18 },
    { min: 30, questions: 36 }
  ];
  const TYPE_KIND = {
    meaning: 'vocab',
    collocation: 'vocab',
    fill: 'reading',
    translate: 'reading',
    listen: 'listening'
  };
  const KINDS = ['vocab', 'reading', 'listening'];
  const TYPE_LABEL = {
    meaning: 'Chọn từ đúng nghĩa',
    fill: 'Điền từ còn thiếu',
    collocation: 'Hoàn thành cụm từ',
    listen: 'Nghe và chọn nghĩa',
    translate: 'Đọc và chọn dịch đúng'
  };
  // Trọng số dạng câu cơ bản — mỗi đề xáo nhẹ theo seed để 50 đề khác cảm giác
  const TYPE_WEIGHTS = { meaning: 0.24, fill: 0.24, collocation: 0.16, listen: 0.2, translate: 0.16 };
  const CEFR_RANK = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
  // Distractor cứu cánh khi kho từ quá ít — chỉ làm mồi chọn nhiễu, không làm đáp án
  const FALLBACK_DISTRACTORS = [
    'meeting', 'invoice', 'colleague', 'schedule', 'customer', 'shipment', 'receipt', 'department'
  ];

  // PRNG tất định — cùng (form, dữ liệu) luôn ra cùng đề
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function escapeRe(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function pickSeeded(rng, list) {
    return list[Math.floor(rng() * list.length) % list.length];
  }

  function shuffleSeeded(rng, list) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function durationOf(min) {
    return DURATIONS.find((d) => d.min === min) || DURATIONS[0];
  }

  // Làm sạch + khử trùng lặp theo term (bản in thường)
  function cleanVocab(vocab) {
    const seen = new Set();
    const out = [];
    for (const v of Array.isArray(vocab) ? vocab : []) {
      if (!v || typeof v.term !== 'string' || typeof v.meaning !== 'string') continue;
      const term = v.term.trim();
      if (!term || seen.has(term.toLowerCase())) continue;
      seen.add(term.toLowerCase());
      out.push({
        id: String(v.id || `w-${term.toLowerCase()}`),
        term,
        meaning: v.meaning.trim(),
        example: String(v.example || '').trim(),
        translation: String(v.translation || '').trim(),
        collocations: Array.isArray(v.collocations) ? v.collocations.filter((c) => typeof c === 'string' && c.trim()) : [],
        pos: String(v.pos || '').trim(),
        topic: String(v.topic || '').trim(),
        cefr: String(v.cefr || '').trim(),
        freq: Number.isFinite(v.freq) ? v.freq : 3
      });
    }
    return out;
  }

  // Mức ưu tiên luyện tập: càng nhỏ càng nên xuất hiện trong đề
  function priorityOf(srs, now) {
    if (!srs || srs.state === 'new') return 8;
    const difficult = (Number(srs.difficulty) || 0) >= 0.6;
    let base;
    if (srs.state === 'learning') base = 0;
    else if (srs.state === 'review') base = (srs.dueAt && srs.dueAt <= now) ? 1 : 2;
    else if (srs.state === 'mastered') base = 3;
    else base = 2;
    return base - (difficult ? 0.5 : 0);
  }

  // Chọn từ mục tiêu: từ đã học theo ưu tiên SRS, thiếu thì bơm từ kho theo CEFR dễ lên
  function chooseTargets(items, srsItems, count, now) {
    const srsOf = (item) => srsItems[item.id] || srsItems[item.term];
    const learned = items
      .filter((item) => { const s = srsOf(item); return s && s.state && s.state !== 'new'; })
      .map((item) => ({ item, p: priorityOf(srsOf(item), now) }))
      .sort((a, b) => a.p - b.p || a.item.term.localeCompare(b.item.term))
      .map((x) => x.item);
    const targets = learned.slice(0, count);
    if (targets.length < count) {
      const rest = items
        .filter((item) => !learned.includes(item))
        .sort((a, b) =>
          (CEFR_RANK[a.cefr] || 9) - (CEFR_RANK[b.cefr] || 9)
          || a.freq - b.freq
          || a.term.localeCompare(b.term));
      targets.push(...rest.slice(0, count - targets.length));
    }
    // Kho quá nhỏ: xoay vòng từ để đủ số câu (mỗi từ tối đa lặp 1 lần ở dạng khác)
    const baseLen = targets.length;
    let i = 0;
    while (targets.length < count && baseLen > 0) {
      targets.push(targets[i % baseLen]);
      i += 1;
    }
    return { targets, learnedCount: learned.length };
  }

  // Distractor theo trường (term hoặc nghĩa/việt): ưu tiên cùng từ loại, khác giá trị
  function distractorsFor(rng, pool, correct, field) {
    const value = (item) => String(item[field] || '').trim();
    const correctValue = value(correct);
    const samePos = pool.filter((item) => item !== correct && item.pos && item.pos === correct.pos && value(item) && value(item) !== correctValue);
    const others = pool.filter((item) => item !== correct && value(item) && value(item) !== correctValue);
    const picks = shuffleSeeded(rng, samePos).slice(0, 3);
    if (picks.length < 3) {
      for (const candidate of shuffleSeeded(rng, others)) {
        if (picks.length >= 3) break;
        if (!picks.some((p) => value(p) === value(candidate))) picks.push(candidate);
      }
    }
    return picks.map(value);
  }

  function padDistractors(rng, choices) {
    // Bảo chứng luôn đủ 4 lựa chọn phân biệt kể cả kho từ cạn
    for (const filler of shuffleSeeded(rng, FALLBACK_DISTRACTORS)) {
      if (choices.length >= 4) break;
      if (!choices.includes(filler)) choices.push(filler);
    }
    return choices;
  }

  function fitFill(item) {
    if (!item.example) return null;
    const re = new RegExp(`\\b${escapeRe(item.term)}\\b`, 'i');
    if (!re.test(item.example)) return null;
    return item.example.replace(re, '_____');
  }

  function fitCollocation(item) {
    for (const col of item.collocations) {
      const re = new RegExp(`\\b${escapeRe(item.term)}\\b`, 'i');
      if (re.test(col)) return col.replace(re, '_____');
    }
    return null;
  }

  // Xáo trộn lựa chọn, trả (choices, answerIndex)
  function assembleChoices(rng, correctValue, distractorValues) {
    const seen = new Set([String(correctValue)]);
    const unique = [];
    for (const value of distractorValues) {
      const key = String(value);
      if (!seen.has(key)) { seen.add(key); unique.push(value); }
    }
    const choices = padDistractors(rng, [correctValue, ...unique].slice(0, 4));
    const shuffled = shuffleSeeded(rng, choices);
    return { choices: shuffled, answer: shuffled.indexOf(correctValue) };
  }

  function buildQuestion(rng, index, form, item, pool, type) {
    let chosen = type;
    let question = null;
    const attempt = (t) => {
      if (t === 'meaning') {
        const { choices, answer } = assembleChoices(rng, item.term, distractorsFor(rng, pool, item, 'term'));
        return { prompt: `Từ nào mang nghĩa: “${item.meaning}”?`, choices, answer };
      }
      if (t === 'fill') {
        const blanked = fitFill(item);
        if (!blanked) return null;
        const { choices, answer } = assembleChoices(rng, item.term, distractorsFor(rng, pool, item, 'term'));
        return { prompt: blanked, choices, answer };
      }
      if (t === 'collocation') {
        const phrase = fitCollocation(item);
        if (!phrase) return null;
        const { choices, answer } = assembleChoices(rng, item.term, distractorsFor(rng, pool, item, 'term'));
        return { prompt: `Hoàn thành cụm từ: “${phrase}”`, choices, answer };
      }
      if (t === 'listen') {
        const { choices, answer } = assembleChoices(rng, item.meaning, distractorsFor(rng, pool, item, 'meaning'));
        return { prompt: 'Bấm nghe và chọn nghĩa đúng của từ bạn nghe được.', choices, answer, audioText: item.term };
      }
      if (t === 'translate') {
        if (!item.example || !item.translation) return null;
        const { choices, answer } = assembleChoices(rng, item.translation, distractorsFor(rng, pool, item, 'translation'));
        return { prompt: item.example, choices, answer };
      }
      return null;
    };
    question = attempt(chosen);
    if (!question) question = attempt('meaning'); // meaning luôn dựng được khi item hợp lệ
    if (!question) return null; // item rỗng nghĩa — bị chặn từ cleanVocab, thực tế không tới
    return {
      id: `t${form}-${index + 1}`,
      type: chosen,
      typeLabel: TYPE_LABEL[chosen],
      kind: TYPE_KIND[chosen],
      vocabId: item.id,
      term: item.term,
      meaning: item.meaning,
      example: item.example,
      translation: item.translation,
      prompt: question.prompt,
      choices: question.choices,
      answer: question.answer,
      ...(question.audioText ? { audioText: question.audioText } : {})
    };
  }

  /**
   * buildTest({ form, durationMin, vocab, srsItems, now })
   *  - form: 1..50 (mặc định 1)
   *  - durationMin: 10 | 15 | 30 (mặc định 10)
   *  - vocab: danh sách item vocab (term/meaning/example/translation/collocations/pos...)
   *  - srsItems: map vocabId -> { state, difficulty, dueAt, ... } của người học (tuỳ chọn)
   * Trả { form, durationMin, questions[], meta: { learnedCount, learnedUsed } }
   */
  function buildTest({ form, durationMin = 10, vocab = [], srsItems = {}, now = 0 } = {}) {
    const formNo = Math.min(FORM_COUNT, Math.max(1, Math.round(Number(form) || 1)));
    const duration = durationOf(durationMin);
    const count = duration.questions;
    const items = cleanVocab(vocab);
    const rng = mulberry32(formNo * 1013904223 + count * 69069 + 7);
    if (!items.length) return { form: formNo, durationMin: duration.min, questions: [], meta: { learnedCount: 0, learnedUsed: 0 } };

    const { targets, learnedCount } = chooseTargets(items, srsItems, count, now || 0);
    if (!targets.length) return { form: formNo, durationMin: duration.min, questions: [], meta: { learnedCount: 0, learnedUsed: 0 } };

    // Trọng số dạng câu xáo nhẹ theo đề — giữ tổng ~1 để phân bố ổn định
    const jitter = {};
    let weightSum = 0;
    for (const t of Object.keys(TYPE_WEIGHTS)) {
      jitter[t] = Math.max(0.05, TYPE_WEIGHTS[t] + (rng() - 0.5) * 0.1);
      weightSum += jitter[t];
    }
    for (const t of Object.keys(jitter)) jitter[t] /= weightSum;
    const weighted = () => {
      let r = rng();
      let type = 'meaning';
      for (const [t, w] of Object.entries(jitter)) {
        if (r < w) { type = t; break; }
        r -= w;
      }
      return type;
    };
    // Ưu tiên dạng chưa dùng cho từ này; kho quá nhỏ thì quay về dạng ít dùng nhất —
    // để một từ lặp nhiều lần không bị hỏi cùng một dạng liên tiếp.
    const pickType = (counts) => {
      for (let guard = 0; guard < 8; guard++) {
        const type = weighted();
        if (!counts.has(type)) return type;
      }
      const unused = Object.keys(TYPE_WEIGHTS).find((t) => !counts.has(t));
      if (unused) return unused;
      return Object.keys(TYPE_WEIGHTS)
        .sort((a, b) => (counts.get(a) || 0) - (counts.get(b) || 0))[0];
    };

    const typeCountByWord = new Map();
    const questions = [];
    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      const counts = typeCountByWord.get(item.id) || new Map();
      const type = pickType(counts);
      counts.set(type, (counts.get(type) || 0) + 1);
      typeCountByWord.set(item.id, counts);
      const q = buildQuestion(rng, i, formNo, item, items, type);
      if (q) questions.push(q);
    }
    // Bảo đảm sàn câu nghe — thẻ thời lượng quảng cáo "nghe + đọc + từ vựng", đề không được thiếu nghe.
    // Quota tất định ~22% (tối thiểu 2): chuyển các câu cuối chưa phải listen thành listen.
    const listenQuota = Math.min(questions.length, Math.max(2, Math.round(questions.length * 0.22)));
    let listening = questions.filter((q) => q.type === 'listen').length;
    for (let i = questions.length - 1; i >= 0 && listening < listenQuota; i--) {
      if (questions[i].type === 'listen') continue;
      const rebuilt = buildQuestion(rng, i, formNo, targets[i], items, 'listen');
      if (rebuilt) {
        questions[i] = rebuilt;
        listening += 1;
      }
    }
    return {
      form: formNo,
      durationMin: duration.min,
      questions,
      meta: { learnedCount, learnedUsed: Math.min(learnedCount, targets.length) }
    };
  }

  /**
   * scoreTest(questions, answers) — answers là mảng cùng chiều, mỗi phần tử là index chọn hoặc null.
   * Trả { total, correct, score, byKind, wrong: [...] }
   */
  function scoreTest(questions = [], answers = []) {
    const total = questions.length;
    let correct = 0;
    const byKind = Object.fromEntries(KINDS.map((k) => [k, { total: 0, correct: 0 }]));
    const wrong = [];
    questions.forEach((q, i) => {
      const chosen = answers[i];
      const bucket = byKind[q.kind] || byKind.vocab;
      bucket.total += 1;
      if (chosen === q.answer) {
        correct += 1;
      } else {
        wrong.push({
          vocabId: q.vocabId,
          term: q.term,
          meaning: q.meaning,
          translation: q.translation,
          example: q.example,
          chosenText: Number.isInteger(chosen) ? (q.choices[Number(chosen)] ?? null) : null,
          answerText: q.choices[q.answer]
        });
      }
    });
    return {
      total,
      correct,
      score: total ? Math.round((correct / total) * 100) : 0,
      byKind,
      wrong
    };
  }

  return {
    FORM_COUNT,
    DURATIONS,
    KINDS,
    TYPE_KIND,
    TYPE_LABEL,
    durationOf,
    buildTest,
    scoreTest,
    priorityOf,
    cleanVocab
  };
});
