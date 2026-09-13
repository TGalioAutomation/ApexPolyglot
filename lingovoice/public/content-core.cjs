/* LingoVoice — Content core (roadmap #2): gộp nội dung từ DB (API /api/content/*)
 * vào cấu trúc literal của frontend, an toàn khi dữ liệu lạ. UMD: browser + test Node.
 * Nguyên tắc: DB là nguồn chính khi trả nội dung hợp lệ; literal chỉ là fallback offline.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CONTENT_CORE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const CONTENT_TIMEOUT_MS = 2500;

  function validSentence(s) {
    return s && typeof s === 'object' && typeof s.text === 'string' && s.text.trim()
      && typeof s.vi === 'string' && s.vi.trim();
  }

  // lessons: [{topic, sentences:[{id,text,vi,pinyin?}]}] — bỏ chủ đề rỗng, cần >=1 chủ đề hợp lệ
  function sanitizeLessons(list) {
    if (!Array.isArray(list)) return null;
    const clean = [];
    for (const t of list) {
      if (!t || typeof t !== 'object' || typeof t.topic !== 'string' || !t.topic.trim()) continue;
      const raw = Array.isArray(t.sentences) ? t.sentences : [];
      const sentences = [];
      for (const s of raw) {
        if (!validSentence(s) || sentences.length >= 24) continue;
        const item = typeof s.id === 'string' && s.id ? { id: s.id } : { id: `s-${clean.length}-${sentences.length}` };
        item.text = s.text;
        item.vi = s.vi;
        if (typeof s.pinyin === 'string' && s.pinyin) item.pinyin = s.pinyin;
        sentences.push(item);
      }
      if (sentences.length) clean.push({ topic: t.topic, sentences });
    }
    return clean.length ? clean : null;
  }

  // readings: {"1":[{id,level,title,paragraphs,questions}], ...} — cần >=1 cấp có >=1 bài hợp lệ
  function sanitizeReadings(levels) {
    if (!levels || typeof levels !== 'object' || Array.isArray(levels)) return null;
    const clean = {};
    for (const [key, texts] of Object.entries(levels)) {
      if (!/^[1-7]$/.test(key) || !Array.isArray(texts)) continue;
      const items = texts.filter((t) => t && typeof t === 'object' && typeof t.title === 'string' && t.title.trim()
        && Array.isArray(t.paragraphs) && t.paragraphs.every((p) => typeof p === 'string' && p.trim()))
        .slice(0, 40)
        .map((t) => ({
          id: typeof t.id === 'string' && t.id ? t.id : `r-${key}-${t.title.length}`,
          level: Number(key),
          title: t.title,
          paragraphs: t.paragraphs.slice(0, 8),
          questions: (Array.isArray(t.questions) ? t.questions : []).filter((q) => q && typeof q.q === 'string' && Array.isArray(q.options)).slice(0, 10)
        }));
      if (items.length) clean[key] = items;
    }
    return Object.keys(clean).length ? clean : null;
  }

  // roleplay: [{id,title,vi}]
  function sanitizeRoleplay(list) {
    if (!Array.isArray(list)) return null;
    const clean = list.filter((s) => s && typeof s === 'object' && typeof s.id === 'string' && s.id
      && typeof s.title === 'string' && s.title.trim() && typeof s.vi === 'string' && s.vi.trim())
      .slice(0, 40)
      .map((s) => ({ id: s.id, title: s.title, vi: s.vi }));
    return clean.length ? clean : null;
  }

  // Áp vào literal (mutate in place vì các biến là const object/array ở frontend).
  // Trả true nếu đã thay thế; false -> giữ nguyên literal.
  function applyLessons(LESSONS, lang, fetched) {
    const clean = sanitizeLessons(fetched);
    if (!clean || !LESSONS[lang]) return false;
    LESSONS[lang] = clean;
    return true;
  }

  function applyReadings(READING_TEXTS, lang, fetched) {
    const clean = sanitizeReadings(fetched);
    if (!clean || !READING_TEXTS[lang]) return false;
    READING_TEXTS[lang] = clean;
    return true;
  }

  function applyRoleplay(ROLEPLAY_SCENARIOS, fetched) {
    const clean = sanitizeRoleplay(fetched);
    if (!clean) return false;
    ROLEPLAY_SCENARIOS.length = 0;
    ROLEPLAY_SCENARIOS.push(...clean);
    return true;
  }

  return { CONTENT_TIMEOUT_MS, sanitizeLessons, sanitizeReadings, sanitizeRoleplay, applyLessons, applyReadings, applyRoleplay, validSentence };
});
