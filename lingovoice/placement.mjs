// LingoVoice — placement test: ngân hàng câu + scoring deterministic (LLM không chấm điểm)
export const PLACEMENT_KINDS = ['en', 'zh'];

const BANK = {
  en: [
    { id: 'en-p1', skill: 'reading', type: 'choice', prompt: 'Choose the best reply: “How are you?”', choices: ['I am fine, thanks.', 'It is Monday.', 'Three books.'], answer: 0 },
    { id: 'en-p2', skill: 'listening', type: 'listening', prompt: 'Listen and pick the correct meaning.', audioText: 'I usually have breakfast at seven.', choices: ['Tôi thường ăn sáng lúc bảy giờ.', 'Tôi thường ăn tối lúc bảy giờ.', 'Tôi không bao giờ ăn sáng.'], answer: 0 },
    { id: 'en-p3', skill: 'reading', type: 'choice', prompt: 'Complete: “She ___ English every day.”', choices: ['study', 'studies', 'studying'], answer: 1 },
    { id: 'en-p4', skill: 'reading', type: 'choice', prompt: '“If I had more time, I would learn Chinese.” means…', choices: ['Tôi đã học tiếng Trung.', 'Tôi sẽ học tiếng Trung nếu có thời gian.', 'Tôi ghét tiếng Trung.'], answer: 1 },
    { id: 'en-p5', skill: 'speaking', type: 'open', prompt: 'Introduce yourself in 2–3 sentences (type or speak).', minWords: 10, keywords: ['i', 'my', 'learn'] },
    { id: 'en-p6', skill: 'speaking', type: 'open', prompt: 'What do you do when you do not understand someone?', minWords: 12, keywords: ['could', 'repeat', 'understand'] }
  ],
  zh: [
    { id: 'zh-p1', skill: 'reading', type: 'choice', prompt: '“你好！” có nghĩa là gì?', choices: ['Xin chào!', 'Tạm biệt!', 'Cảm ơn!'], answer: 0 },
    { id: 'zh-p2', skill: 'listening', type: 'listening', prompt: 'Nghe và chọn đáp án đúng.', audioText: '我明天下午三点去图书馆。', choices: ['Hôm nay lúc 3 giờ', 'Ngày mai 3 giờ chiều', 'Ngày mai 3 giờ sáng'], answer: 1 },
    { id: 'zh-p3', skill: 'reading', type: 'choice', prompt: 'Chọn câu đúng “Tôi thích học tiếng Trung”.', choices: ['我喜欢学习中文。', '我学习喜欢中文。', '中文我学习。'], answer: 0 },
    { id: 'zh-p4', skill: 'reading', type: 'choice', prompt: '“小王今天很忙，但是晚上有时间。” Khi nào Tiểu Vương rảnh?', choices: ['Buổi sáng', 'Buổi chiều', 'Buổi tối'], answer: 2 },
    { id: 'zh-p5', skill: 'speaking', type: 'open', prompt: 'Giới thiệu tên và quê quán bằng tiếng Trung (gõ pinyin hoặc chữ Hán).', minWords: 4, keywords: ['我', '叫', '越南'] },
    { id: 'zh-p6', skill: 'speaking', type: 'open', prompt: 'Bạn nói gì khi muốn người khác nhắc lại chậm hơn?', minWords: 3, keywords: ['请', '再', '说'] }
  ]
};

const LEVELS = [25, 40, 55, 70, 82, 92]; // ranh giới L1..L7

export function publicQuestions(language) {
  return (BANK[language] || BANK.en).map((q) => {
    const safe = { id: q.id, skill: q.skill, type: q.type, prompt: q.prompt };
    if (q.choices) safe.choices = q.choices;
    if (q.type === 'listening') safe.audioText = q.audioText;
    return safe;
  });
}

export function scorePlacement(language, answers = []) {
  const bank = BANK[language] || BANK.en;
  const byId = new Map(answers.map((a) => [a.id, a.answer]));
  const dims = { listening: { e: 0, t: 0 }, reading: { e: 0, t: 0 }, speaking: { e: 0, t: 0 } };
  for (const q of bank) {
    const res = byId.get(q.id);
    const d = dims[q.skill];
    d.t += 1;
    let earned = 0;
    if (q.type === 'open') {
      const norm = String(res || '').toLowerCase();
      const words = norm.split(/\s+/).filter(Boolean).length;
      const hits = q.keywords.filter((k) => norm.includes(k)).length;
      earned = Math.min(1, (words >= q.minWords ? 0.6 : (words / q.minWords) * 0.6) + (hits / q.keywords.length) * 0.4);
    } else {
      earned = Number(res) === q.answer ? 1 : 0;
    }
    d.e += earned;
  }
  const skills = Object.fromEntries(Object.entries(dims).map(([k, v]) => [k, Math.round((v.e / v.t) * 100)]));
  const overall = Math.round(skills.listening * 0.3 + skills.reading * 0.35 + skills.speaking * 0.35);
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) { if (overall >= LEVELS[i]) level = i + 2; }
  return {
    overall,
    level,
    skills,
    weakest: Object.entries(skills).sort((a, b) => a[1] - b[1])[0][0],
    caveat: 'Điểm nói từ transcript chỉ là sơ bộ; phát âm/thanh điệu cần audio analyzer ở giai đoạn sau.'
  };
}
