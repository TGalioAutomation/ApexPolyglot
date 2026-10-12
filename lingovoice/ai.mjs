// LingoVoice — AI teacher adapter (DeepSeek / Gemini / OpenAI)
// Key chỉ nằm ở server (qua .env). Endpoint chat gọi module này.
import { CO_LINH_VOICE_DESIGN } from './voice.mjs';
import Pron from './public/pron-core.cjs';
const PROVIDER_KEYS = {
  gemini: 'GEMINI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  openai: 'OPENAI_API_KEY'
};

export function configuredProviders() {
  return Object.entries(PROVIDER_KEYS)
    .filter(([, env]) => process.env[env])
    .map(([name]) => name);
}

export function providerOrder() {
  const configured = configuredProviders();
  if (!configured.length) return [];
  const preferred = (process.env.AI_PROVIDER || 'auto').toLowerCase();
  if (preferred === 'auto' || !configured.includes(preferred)) return configured;
  return [preferred, ...configured.filter((p) => p !== preferred)];
}

async function callProvider(provider, { system, user, json = false }) {
  if (provider === 'deepseek') {
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    const base = (process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com').replace(/\/$/, '');
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        response_format: json ? { type: 'json_object' } : { type: 'text' },
        max_tokens: json ? 1000 : 700,
        temperature: 0.7,
        stream: false
      })
    });
    if (!res.ok) throw new Error(`DeepSeek returned ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('DeepSeek empty response');
    return { text: text.trim(), provider, model };
  }

  if (provider === 'gemini') {
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const base = (process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
    const res = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: json ? { responseMimeType: 'application/json' } : undefined
      })
    });
    if (!res.ok) throw new Error(`Gemini returned ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    if (!text) throw new Error('Gemini empty response');
    return { text: text.trim(), provider, model };
  }

  if (provider === 'openai') {
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const base = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        response_format: json ? { type: 'json_object' } : undefined,
        max_tokens: json ? 1000 : 700,
        temperature: 0.7
      })
    });
    if (!res.ok) throw new Error(`OpenAI returned ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('OpenAI empty response');
    return { text: text.trim(), provider, model };
  }

  throw new Error(`provider ${provider} not configured`);
}

export const TEACHER_PERSONALITIES = {
  warm: 'Ấm áp: kiên nhẫn, dịu dàng, ghi nhận nỗ lực trước khi sửa lỗi; không tâng bốc quá mức.',
  strict: 'Kỷ luật: nói thẳng lỗi quan trọng, đặt mục tiêu cụ thể và yêu cầu học viên thử lại; nghiêm túc nhưng luôn tôn trọng.',
  energetic: 'Năng lượng: nhịp trả lời nhanh, tích cực, tạo động lực hành động ngay; sinh động nhưng không dùng emoji hoặc cảm thán quá mức.'
};

export function normalizeTeacherProfile(value = {}) {
  const personality = Object.hasOwn(TEACHER_PERSONALITIES, value.personality) ? value.personality : 'warm';
  const voices = {};
  for (const lang of ['en', 'zh']) {
    const candidate = value.voices?.[lang];
    const fallback = CO_LINH_VOICE_DESIGN[lang]?.voice || null;
    // null là lựa chọn “không ép voice” hợp lệ từ UI; chỉ dùng design mới khi
    // profile chưa có trường voice (profile cũ hoặc profile tối giản).
    const hasPreference = Boolean(value.voices && Object.hasOwn(value.voices, lang));
    voices[lang] = typeof candidate === 'string' && /^[\w.-]{1,80}$/.test(candidate)
      ? candidate
      : hasPreference ? null : fallback;
  }
  const rawSpeed = Number(value.speed);
  const speed = Number.isFinite(rawSpeed) ? Math.min(1.15, Math.max(0.75, rawSpeed)) : 0.9;
  return { personality, voices, speed };
}

// System prompt cho "giáo viên đồng hành"
export function teacherSystem(profile = {}) {
  const safeProfile = normalizeTeacherProfile(profile);
  return `Bạn là cô giáo ngôn ngữ thân thiện đồng hành cùng học viên người Việt trong ứng dụng LingoVoice (học tiếng Anh và tiếng Trung).
TÍNH CÁCH ĐƯỢC HỌC VIÊN CHỌN: ${TEACHER_PERSONALITIES[safeProfile.personality]}
SỨ MỆNH: Luôn hướng học viên tới MỤC TIÊU cá nhân và giúp họ DÙNG, NÓI, NGHE THÔNG THẠO ngôn ngữ đang học — không chỉ dạy lý thuyết.
Nguyên tắc BẮT BUỘC:
- Trả lời NGẮN GỌN, tối đa 3–4 câu, không gạch đầu dòng dài, không dùng emoji.
- Nói tiếng Việt là chính; khi minh hoạ, đưa câu mẫu đúng ngôn ngữ đang học.
- Luôn bám theo BỘ NHỚ HỌC VIÊN được cung cấp (mục tiêu, level, điểm yếu, lỗi gần đây, từ đã học). Nếu mục tiêu chưa đặt, hãy khuyến khích đặt mục tiêu. Nếu có điểm yếu, ưu tiên luyện kỹ năng đó. Nếu có lỗi gần đây, nhắc học viên tránh lặp lại.
- Ưu tiên đưa câu để học viên NGHE và NÓI/VIẾT lại (output-first), sau đó mới giải thích.
- Phần LỚN quan trọng: luôn kết thúc phản hồi bằng ĐÚNG MỘT câu mẫu ngắn bằng ngôn ngữ đang học, bọc trong 【 câu mẫu 】. Đoạn trong 【 】 sẽ được đọc to bằng giọng máy, nên CHỈ chứa câu bằng ngôn ngữ đang học.
- Khi học viên hỏi nghĩa/phát âm/cách dùng: giải thích ngắn, khuyến khích nghe và thử lại.
- Chỉ dạy đúng ngôn ngữ/level/ngữ cảnh người học đang ở.
- Không tự nhận là chứng chỉ, không chấm điểm phát âm từ văn bản.
- Giọng điệu như giáo viên ngồi cạnh: tận tình, cụ thể, khích lệ.`;
}

// Gọi giáo viên; nếu chưa có key -> ném Error 'NO_AI'
export async function runTeacher({ system, user }) {
  const order = providerOrder();
  if (!order.length) {
    const err = new Error('NO_AI');
    err.code = 'NO_AI';
    throw err;
  }
  const errors = [];
  for (const provider of order) {
    try {
      return await callProvider(provider, { system, user });
    } catch (e) {
      errors.push(e.message);
    }
  }
  const err = new Error(`All AI providers failed: ${errors.join('; ')}`);
  err.code = 'AI_ERROR';
  throw err;
}

// ---- Structured generation (JSON + schema validator) ----
export function extractJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

// Chạy provider chế độ JSON; validator nhận object -> object hợp lệ hoặc null
export async function runStructured({ system, user, validator }) {
  const order = providerOrder();
  if (!order.length) {
    const err = new Error('NO_AI');
    err.code = 'NO_AI';
    throw err;
  }
  const errors = [];
  for (const provider of order) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await callProvider(provider, { system, user, json: true });
        const parsed = extractJson(result.text);
        const validated = validator(parsed);
        if (validated === null) throw new Error(`${provider} returned invalid JSON shape`);
        return { ...validated, provider, model: result.model };
      } catch (e) {
        errors.push(e.message);
        // JSON lệch schema thường là hụt một lần — thử lại ngay; lỗi mạng/provider chết thì sang provider kế
        if (!/JSON/i.test(e.message)) break;
      }
    }
  }
  const err = new Error(`All AI providers failed: ${errors.join('; ')}`);
  err.code = 'AI_ERROR';
  throw err;
}

function str(value, max) {
  return typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : null;
}

// ---- P0: sinh thẻ từ vựng (đầy đủ trường cho Vocabulary Studio) ----
export async function generateVocabCard(term, language) {
  const langName = language === 'zh' ? 'tiếng Trung giản thể' : 'tiếng Anh';
  const card = await runStructured({
    system: `Bạn là giáo viên tiếng ${langName} cho người Việt. Tạo thẻ từ vựng chất lượng cho app học.`,
    user: language === 'zh'
      ? `Tạo thẻ từ cho từ/cụm: "${term}". Trả JSON chỉ gồm: meaning (nghĩa tiếng Việt ngắn), example (câu ví dụ bằng tiếng Trung giản thể có chứa từ này, trình độ cơ bản-trung cấp), pinyin (phiên âm CÓ DẤU THANH của câu ví dụ), translation (dịch tiếng Việt câu ví dụ), topic (chủ đề ngắn), note (ghi chú measure word, tone pair hoặc cấu trúc ngắn khi phù hợp), freq (mức độ phổ biến: số nguyên 1-5, 1 là rất phổ biến, 5 là ít gặp).`
      : `Tạo thẻ từ cho từ/cụm: "${term}". Trả JSON chỉ gồm: meaning (nghĩa tiếng Việt ngắn), example (câu ví dụ tiếng Anh có chứa từ này, trình độ cơ bản-trung cấp), translation (dịch tiếng Việt câu ví dụ), topic (chủ đề ngắn), pos (từ loại, ví dụ noun/verb/adjective), ipa (phiên âm IPA có trọng âm), collocations (mảng đúng 2 cụm từ/cấu trúc thường dùng với từ này), freq (mức độ phổ biến: số nguyên 1-5, 1 là rất phổ biến, 5 là ít gặp), workplace (boolean: từ có thường dùng trong giao tiếp công việc không).`,
    validator: (obj) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
      if (language === 'zh') {
        if (Object.keys(obj).sort().join('|') !== 'example|freq|meaning|note|pinyin|topic|translation') return null;
        const clean = {};
        for (const k of ['example', 'meaning', 'note', 'pinyin', 'topic', 'translation']) {
          const v = str(obj[k], 400);
          if (!v) return null;
          clean[k] = v;
        }
        const freq = Number(obj.freq);
        if (!Number.isInteger(freq) || freq < 1 || freq > 5) return null;
        clean.freq = freq;
        return { ...clean, term: str(term, 120) };
      }
      if (Object.keys(obj).sort().join('|') !== 'collocations|example|freq|ipa|meaning|pos|topic|translation|workplace') return null;
      const clean = {};
      for (const k of ['example', 'ipa', 'meaning', 'pos', 'topic', 'translation']) {
        const v = str(obj[k], 400);
        if (!v) return null;
        clean[k] = v;
      }
      if (!Array.isArray(obj.collocations) || obj.collocations.length !== 2) return null;
      const cols = obj.collocations.map((c) => str(c, 120));
      if (cols.some((c) => !c)) return null;
      clean.collocations = cols;
      const freq = Number(obj.freq);
      if (!Number.isInteger(freq) || freq < 1 || freq > 5) return null;
      clean.freq = freq;
      clean.workplace = Boolean(obj.workplace);
      return { ...clean, term: str(term, 120) };
    }
  });
  return card;
}

// ---- CMS nội dung (roadmap #2): AI soạn nháp — validator tái dùng db/content-map.mjs ----
import { validateLessonInput, validateReadingInput, validateRoleplayInput } from './db/content-map.mjs';

function cmsValidator(validate) {
  return (obj) => {
    const result = validate(obj);
    return result.ok ? result.value : null;
  };
}

export async function generateReadingDraft({ lang, level }) {
  const langName = lang === 'zh' ? 'tiếng Trung giản thể' : 'tiếng Anh';
  const lv = Math.min(7, Math.max(1, Number(level) || 1));
  const card = await runStructured({
    system: `Bạn là giáo viên ${langName} soạn bài đọc cho người Việt. Nội dung gốc thú vị, ngôn ngữ đúng trình độ.`,
    user: `Soạn 1 bài đọc ${langName} trình độ ${lv}/7 (1 dễ - 7 khó). Trả JSON chỉ gồm: title (tiêu đề ${langName}), paragraphs (mảng 2-3 đoạn, mỗi đoạn 2-4 câu), questions (mảng 2-3 câu hỏi trắc nghiệm, mỗi câu có q (câu hỏi), options (mảng 3 lựa chọn ${langName}), answer (index 0-2 của đáp án đúng)).`,
    validator: cmsValidator(validateReadingInput)
  });
  const { provider, model, ...value } = card;
  return { value, provider, model };
}

export async function generateLessonDraft({ lang, topic }) {
  const langName = lang === 'zh' ? 'tiếng Trung giản thể' : 'tiếng Anh';
  const subject = typeof topic === 'string' && topic.trim() ? topic.trim() : 'chủ đề giao tiếp thường ngày';
  const card = await runStructured({
    system: `Bạn là giáo viên ${langName} cho người Việt, soạn thư viện câu mẫu thực dụng.`,
    user: `Soạn chủ đề "${subject}". Trả JSON chỉ gồm: topic (tên chủ đề TIẾNG VIỆT ngắn), sentences (mảng đúng 3 câu ${langName} thực dụng cho chủ đề này, mỗi câu có text (câu ${langName} tự nhiên), vi (nghĩa tiếng Việt)${lang === 'zh' ? ', pinyin (phiên âm có dấu thanh)' : ''}).`,
    validator: (obj) => {
      const result = validateLessonInput(obj);
      if (!result.ok) return null;
      if (result.value.sentences.length !== 3) return null;
      return result.value;
    }
  });
  const { provider, model, ...value } = card;
  return { value, provider, model };
}

export async function generateRoleplayDraft({ lang, theme }) {
  const langName = lang === 'zh' ? 'tiếng Trung giản thể' : 'tiếng Anh';
  const subject = typeof theme === 'string' && theme.trim() ? theme.trim() : 'tình huống giao tiếp thực dụng';
  const card = await runStructured({
    system: `Bạn là giáo viên ${langName} thiết kế kịch bản roleplay cho người Việt.`,
    user: `Thiết kế kịch bản roleplay: ${subject}. Trả JSON chỉ gồm: title (tên tình huống bằng ${langName}), vi (tên tình huống tiếng Việt), persona (1-2 câu mô tả vai đối thoại bằng tiếng Việt), opening (câu mở đầu của đối phương bằng ${langName}), prompts (mảng 4-6 gợi ý ý tưởng người học có thể nói, tiếng Việt).`,
    validator: cmsValidator(validateRoleplayInput)
  });
  const { provider, model, ...value } = card;
  return { value, provider, model };
}

// ---- P1: feedback bài viết ----
export async function writingFeedback({ text, prompt, language }) {
  const langName = language === 'zh' ? 'tiếng Trung' : 'tiếng Anh';
  const fb = await runStructured({
    system: `Bạn là giáo viên ${langName} chấm bài viết ngắn cho người Việt. Trả lời ngắn gọn, ấm áp.`,
    user: `Bài tập: ${prompt}\n\nBài làm của học viên: ${text}\n\nTrả JSON chỉ gồm: praise (1 điểm làm tốt, tối đa 1 câu tiếng Việt), fix (một lỗi quan trọng nhất ảnh hưởng giao tiếp), corrected (câu sửa lại hoàn chỉnh bằng ${langName}), why (giải thích ngắn bằng tiếng Việt), retry (gợi ý viết lại ngắn gọn).`,
    validator: (obj) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
      const keys = ['corrected', 'fix', 'praise', 'retry', 'why'];
      if (Object.keys(obj).sort().join('|') !== keys.join('|')) return null;
      const clean = {};
      for (const k of keys) {
        const v = str(obj[k], 500);
        if (!v) return null;
        clean[k] = v;
      }
      return clean;
    }
  });
  return fb;
}

// ---- P2: lượt roleplay ----
export async function roleplayTurn({ scenario, language, level, history }) {
  const langName = language === 'zh' ? 'tiếng Trung' : 'tiếng Anh';
  const prompt = history.length
    ? `Lịch sử hội thoại:\n${history.map((h) => `${h.role === 'teacher' ? 'Nhân viên' : 'Học viên'}: ${h.text}`).join('\n')}\n\nĐến lượt bạn trả lời học viên.`
    : `Hãy mở đầu cuộc hội thoại với học viên trong tình huống này.`;
  const turn = await runStructured({
    system: `Bạn đang đóng vai nhân vật trong tình huống: "${scenario.title}". Ngôn ngữ: ${langName}. Trình độ học viên: mức ${level} (1-7). Nói ngắn gọn đúng vai, tự nhiên. Trả lời bằng ${langName}, KHÔNG dùng tiếng Việt trong lời thoại.`,
    user: `${prompt}\n\nTrả JSON chỉ gồm: reply (lời thoại bằng ${langName}, 1-2 câu), hint (gợi ý cho học viên bằng tiếng Việt nếu cần, ngắn gọn).`,
    validator: (obj) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
      if (Object.keys(obj).sort().join('|') !== 'hint|reply') return null;
      const reply = str(obj.reply, 300);
      const hint = str(obj.hint, 300);
      if (!reply || !hint) return null;
      return { reply, hint };
    }
  });
  return turn;
}

// ---- P2: nhận xét cuối cuộc gọi thoại ----
export async function roleplayFeedback({ scenario, language, history }) {
  const langName = language === 'zh' ? 'tiếng Trung' : 'tiếng Anh';
  const lines = (history || []).slice(-20).map((h) => `${h.role === 'teacher' ? 'Nhân viên' : 'Học viên'}: ${h.text}`).join('\n') || '(chưa có lượt nào)';
  const fb = await runStructured({
    system: `Bạn là cô giáo ${langName} chấm một cuộc hội thoại ngắn của học viên người Việt trong tình huống "${scenario?.title || 'giao tiếp'}". Trả lời ngắn gọn, ấm áp, khích lệ.`,
    user: `Hội thoại:\n${lines}\n\nTrả JSON chỉ gồm: praise (1 điểm làm tốt bằng tiếng Việt, tối đa 1 câu), topFix (một lỗi/điều cần cải thiện quan trọng nhất bằng tiếng Việt), corrected (câu sửa đúng bằng ${langName} nếu có lỗi, nếu không thì chuỗi rỗng ""), next (bước luyện tiếp theo ngắn bằng tiếng Việt).`,
    validator: (obj) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
      if (Object.keys(obj).sort().join('|') !== 'corrected|next|praise|topFix') return null;
      const praise = str(obj.praise, 300);
      const topFix = str(obj.topFix, 300);
      const next = str(obj.next, 300);
      const corrected = typeof obj.corrected === 'string' && obj.corrected.length <= 300 ? obj.corrected.trim() : '';
      if (!praise || !topFix || !next) return null;
      return { praise, topFix, corrected, next };
    }
  });
  return fb;
}

// ---- P3: sửa lỗi phát âm (so transcript STT với câu mục tiêu) ----
// Chấm lại điểm từ diff từng từ bằng cùng bộ so của client (public/pron-core.cjs):
// score là số liệu máy tính, LLM không được tự bịa — nó chỉ viết praise/issues/drill.
const normPronWord = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export async function pronunciationFeedback({ target, heard, language, level, diff, ipa }) {
  const langName = language === 'zh' ? 'tiếng Trung' : 'tiếng Anh';
  const zhNote = language === 'zh'
    ? 'Với tiếng Trung: chú ý thanh điệu (tone) của từng chữ, các âm khởi đầu zh/ch/sh/r/z/c/s và âm cuối -n/-ng.'
    : 'Với tiếng Anh: chú ý âm cuối (ed/s), cặp âm dễ nhầm (sh/s, th/t, v/w, iː/ɪ) và trọng âm từ.';
  const diffList = (Array.isArray(diff) ? diff : []).filter((d) => d && typeof d === 'object' && typeof d.word === 'string' && d.word.trim());
  const badWords = new Set(diffList.filter((d) => d.status !== 'ok').map((d) => normPronWord(d.word)));
  const detScore = diffList.length ? Pron.score(diffList) : null;
  const diffTable = diffList.map((d) => {
    if (d.status === 'ok') return `- "${d.word}": người nghe hiểu ngay`;
    if (d.status === 'close' || d.status === 'wrong') return `- "${d.word}": nghe hơi khác (nghe thành "${d.heard || '?'}") nhưng người nghe VẪN NHẬN RA từ này — chỉ cần mẹo để nghe tự nhiên hơn`;
    if (d.status === 'miss') return `- "${d.word}": KHÔNG HIỂU — người nghe hiểu thành từ khác ("${d.heard || '?'}") hoặc không nhận ra được`;
    return `- "${d.word}": THIẾU — người nghe không nghe thấy từ này`;
  }).join('\n');
  const diffNote = diffList.length
    ? `\n\nMÁY ĐÃ SO TỪNG TỪ (kết quả tin cậy, dựa hoàn toàn vào đây để liệt kê lỗi):\n${diffTable}${ipa ? `\nPhiên âm IPA tham khảo: ${ipa}` : ''}\nChỉ được đưa issues cho các từ máy đánh SAI hoặc THIẾU — tuyệt đối không thêm từ khác, không đổi từ.`
    : '';
  const fb = await runStructured({
    system: `Bạn là giáo viên phát âm ${langName} cho người Việt. Học viên đọc một câu mục tiêu; hệ thống nhận dạng giọng nói (STT) ghi lại những gì nghe được. Tiêu chí chấm là TÍNH HIỂU ĐƯỢC (intelligibility): người nghe (người bản ngữ) CÓ HIỂU học viên nói gì hay không. Từ nghe hơi khác nhưng vẫn nhận ra là từ đó = accent, người nghe vẫn hiểu — hãy khích lệ, mẹo chỉ để nghe tự nhiên hơn, tuyệt đối không làm học viên nản. Từ nghe thành từ KHÁC hoặc không nhận ra được = người nghe sẽ hiểu nhầm/không hiểu — đây mới là lỗi cần sửa ngay với mẹo cụ thể (vị trí lưỡi/môi, âm cuối, thanh điệu). KHÔNG đòi hỏi phát âm chuẩn bản ngữ mới được khen. ${zhNote} Nếu nghe được trọn vẹn, khen và đưa câu khó hơn để luyện. Trình độ học viên: mức ${level} (1-7), mẹo phải phù hợp trình độ. KHÔNG bịa ra lỗi nếu không thấy chênh lệch rõ. Nếu được cung cấp bảng so từng từ của máy, TUYỆT ĐỐI dựa vào bảng đó để liệt kê từ lỗi — không tự suy luận lại, không bịa thêm từ khác.`,
    user: `Câu mục tiêu: "${target}"\nSTT nghe được: "${heard}"${diffNote}\n\nTrả JSON chỉ gồm: score (số nguyên 0-100: điểm phát âm ước lượng, 100 là khớp hoàn toàn), praise (1 điểm làm tốt bằng tiếng Việt, tối đa 1 câu), issues (mảng TỐI ĐA 4 từ, ưu tiên từ máy đánh KHÔNG HIỂU hoặc THIẾU; nếu còn slot và có từ chỉ ở mức VẪN NHẬN RA thì đưa mẹo nghe tự nhiên hơn; mỗi phần tử là object chỉ gồm: word (từ/Chữ Hán trong câu mục tiêu), heardAs (STT nghe thành gì; chuỗi rỗng "" nếu từ bị bỏ qua hẳn), tip (mẹo sửa 1 câu tiếng Việt — với từ vẫn hiểu thì mở đầu khẳng định người nghe vẫn hiểu rồi mới góp ý)). CHỈ đưa những từ máy đánh dấu chưa ở mức hiểu ngay — tuyệt đối không đưa từ mà STT nghe trùng nguyên văn; drill (1 câu luyện tiếp bằng ${langName} nhắm đúng các âm bị lỗi, kèm phiên âm IPA hoặc pinyin trong ngoặc nếu phù hợp, KHÔNG kèm nhãn mở đầu kiểu "Luyện tập:"/"Luyện tiếp:"). Nếu không có từ nào sai, issues là mảng rỗng []. QUAN TRỌNG: praise, tip phải là tiếng Việt TỰ NHIÊN, đúng chính tả, dễ hiểu cho người mới — không viết cụm chữ vô nghĩa, không ghép âm theo kiểu máy móc.`,
    validator: (obj) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
      if (Object.keys(obj).sort().join('|') !== 'drill|issues|praise|score') return null;
      const praise = str(obj.praise, 300);
      // Model đôi khi mở đầu drill bằng nhãn riêng → cắt để không bị "Luyện tiếp: Luyện tập: ..."
      const drillRaw = str(obj.drill, 300);
      const drill = drillRaw ? drillRaw.replace(/^\s*(luyện tập|luyện tiếp|luyện|practice|try)\s*:\s*/i, '') : null;
      const scoreNum = Number(obj.score);
      if (!praise || !drill || !Number.isInteger(scoreNum) || scoreNum < 0 || scoreNum > 100) return null;
      if (!Array.isArray(obj.issues) || obj.issues.length > 4) return null;
      const issues = obj.issues.map((it) => {
        if (!it || typeof it !== 'object' || Array.isArray(it)) return null;
        if (Object.keys(it).sort().join('|') !== 'heardAs|tip|word') return null;
        const word = str(it.word, 60);
        const tip = str(it.tip, 300);
        if (!word || !tip) return null;
        const heardAs = typeof it.heardAs === 'string' && it.heardAs.length <= 60 ? it.heardAs.trim() : null;
        if (heardAs === null) return null;
        return { word, heardAs, tip };
      }).filter((it) => it && normPronWord(it.heardAs) !== normPronWord(it.word)) // model đôi khi vẫn trả heardAs trùng từ mục tiêu — loại bỏ thay vì từ chối cả phản hồi
        .filter((it) => !diffList.length || badWords.has(normPronWord(it.word))); // có diff thì chỉ nhận từ máy đánh dấu sai/thiếu — lọc từ model bịa
      return { score: detScore !== null ? detScore : scoreNum, praise, issues, drill };
    }
  });
  return fb;
}
