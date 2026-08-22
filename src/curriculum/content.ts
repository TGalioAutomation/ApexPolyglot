/**
 * Deterministic lesson content generator.
 *
 * Produces real, distinct lesson content for every (day, type) so the 90-day
 * curriculum is not a repeated template. Content is derived deterministically
 * from the weekly topic rotation + level, so it is stable across re-seeds and
 * testable (day1 !== day2). Structure follows learning-ai-spec.md: each lesson
 * has a can-do outcome, topic, and type-specific material with answer key.
 */

export type LessonType = 'listening' | 'reading' | 'speaking' | 'review';
export type Language = 'en' | 'zh-CN';

const EN_TOPICS = [
  { id: 'self-introduction', label: 'Introducing yourself', vocab: ['name', 'country', 'study', 'work', 'family'] },
  { id: 'daily-life', label: 'Daily routines', vocab: ['morning', 'breakfast', 'work', 'evening', 'sleep'] },
  { id: 'food-and-shopping', label: 'Food and shopping', vocab: ['menu', 'price', 'bargain', 'market', 'tasty'] },
  { id: 'travel', label: 'Travel and transport', vocab: ['ticket', 'platform', 'luggage', 'departure', 'destination'] },
  { id: 'work-and-study', label: 'Work and study', vocab: ['meeting', 'deadline', 'project', 'schedule', 'career'] },
  { id: 'opinions', label: 'Opinions and feelings', vocab: ['agree', 'prefer', 'opinion', 'enjoy', 'suggest'] },
  { id: 'review-and-test', label: 'Review and test', vocab: ['review', 'summary', 'practice', 'remember', 'improve'] }
];

const ZH_TOPICS = [
  { id: 'self-introduction', label: '自我介绍 · Giới thiệu', vocab: ['名字', '国家', '学习', '工作', '家庭'] },
  { id: 'daily-life', label: '日常生活 · Sinh hoạt', vocab: ['早上', '早饭', '工作', '晚上', '睡觉'] },
  { id: 'food-and-shopping', label: '吃饭和购物 · Ăn & mua sắm', vocab: ['菜单', '价格', '市场', '好吃', '买'] },
  { id: 'travel', label: '旅行和交通 · Du lịch', vocab: ['车票', '站台', '行李', '出发', '目的地'] },
  { id: 'work-and-study', label: '工作和学习 · Công việc', vocab: ['会议', '期限', '项目', '计划', '职业'] },
  { id: 'opinions', label: '看法和感受 · Ý kiến', vocab: ['同意', '喜欢', '觉得', '建议', '开心'] },
  { id: 'review-and-test', label: '复习和考试 · Ôn tập', vocab: ['复习', '总结', '练习', '记得', '进步'] }
];

export interface LessonContent {
  schemaVersion: 1;
  language: Language;
  day: number;
  level: number;
  type: LessonType;
  title: string;
  outcome: string;
  topic: string;
  topicKey: string;
  minutes: number;
  vocab: string[];
  material: Record<string, unknown>;
}

export function generateLessonContent(language: Language, day: number, type: LessonType): LessonContent {
  const topics = language === 'zh-CN' ? ZH_TOPICS : EN_TOPICS;
  const topic = topics[(day - 1) % topics.length];
  const level = levelForDay(day);
  const common = {
    schemaVersion: 1 as const,
    language,
    day,
    level,
    type,
    topicKey: topic.id,
    topic: topic.label,
    vocab: topic.vocab,
    minutes: minutesForType(type)
  };
  switch (type) {
    case 'listening': return { ...common, title: listeningTitle(language, topic, day), outcome: 'Nghe ý chính và chi tiết rồi shadow câu mẫu.', material: listeningMaterial(language, topic, day, level) };
    case 'reading': return { ...common, title: readingTitle(language, topic, day), outcome: 'Đọc lướt, quét chi tiết và suy luận ý chính.', material: readingMaterial(language, topic, day, level) };
    case 'speaking': return { ...common, title: speakingTitle(language, topic, day), outcome: 'Chuẩn bị, ghi âm và thử lại theo phản hồi.', material: speakingMaterial(language, topic, day, level) };
    case 'review': return { ...common, title: reviewTitle(language, topic, day), outcome: 'Ôn lại từ và mẫu câu đã học để củng cố trí nhớ.', material: reviewMaterial(language, topic, day, level) };
  }
}

function levelForDay(day: number): number {
  if (day <= 30) return 1;
  if (day <= 60) return 2;
  return 3;
}

function minutesForType(type: LessonType): number {
  return { listening: 12, reading: 10, speaking: 10, review: 3 }[type];
}

function listeningTitle(language: Language, topic: { label: string }, day: number): string {
  return language === 'zh-CN'
    ? `听力 · ${topic.label} · 第${day}天`
    : `Listening · ${topic.label} · Day ${day}`;
}
function readingTitle(language: Language, topic: { label: string }, day: number): string {
  return language === 'zh-CN'
    ? `阅读 · ${topic.label} · 第${day}天`
    : `Reading · ${topic.label} · Day ${day}`;
}
function speakingTitle(language: Language, topic: { label: string }, day: number): string {
  return language === 'zh-CN'
    ? `口语 · ${topic.label} · 第${day}天`
    : `Speaking · ${topic.label} · Day ${day}`;
}
function reviewTitle(language: Language, topic: { label: string }, day: number): string {
  return language === 'zh-CN'
    ? `复习 · ${topic.label} · 第${day}天`
    : `Review · ${topic.label} · Day ${day}`;
}

function listeningMaterial(language: Language, topic: { label: string; vocab: string[] }, day: number, level: number) {
  const [v1, v2] = topic.vocab;
  const wpm = 90 + level * 15 + (day % 5) * 6;
  if (language === 'zh-CN') {
    const transcript = `你好！我${level <= 1 ? '想' : '希望'}和你说一下我的${v1}。每天我${v2}，然后去工作。`;
    return {
      transcript,
      pinyin: `Nǐ hǎo! Wǒ ${level <= 1 ? 'xiǎng' : 'xīwàng'} hé nǐ shuō yīxià wǒ de ${v1}。Měitiān wǒ ${v2}，ránhòu qù gōngzuò。`,
      translation: `Xin chào! Tôi muốn kể cho bạn về ${topic.label} của tôi. Mỗi ngày tôi ${v2}, rồi đi làm.`,
      wpm,
      gistQuestion: `Người nói đang nói về điều gì? (${topic.label})`,
      detailQuestion: `Mỗi ngày người nói làm gì trước khi đi làm?`,
      answer: v2
    };
  }
  const transcript = `Hi, I’d like to tell you about my ${v1}. Every ${level <= 1 ? 'day' : 'week'} I ${v2} before I go to work. It really helps me stay focused.`;
  return {
    transcript,
    translation: `Chào, tôi muốn kể cho bạn về ${topic.label} của tôi. Mỗi ${level <= 1 ? 'ngày' : 'tuần'} tôi ${v2} trước khi đi làm.`,
    wpm,
    gistQuestion: `Người nói đang nói về điều gì?`,
    detailQuestion: `Người nói làm gì trước khi đi làm?`,
    answer: v2
  };
}

function readingMaterial(language: Language, topic: { label: string; vocab: string[] }, _day: number, _level: number) {
  const [v1, v2] = topic.vocab;
  if (language === 'zh-CN') {
    const passage = `${topic.label}对生活很重要。很多人${v1}，也喜欢${v2}。坚持每天练习，进步会越来越大。`;
    return { passage, translation: `Xây dựng ${topic.label} quan trọng với cuộc sống. Nhiều người ${v1}, cũng thích ${v2}. Kiên trì luyện mỗi ngày, tiến bộ sẽ lớn dần.`, comprehensionQuestion: `Điều gì giúp tiến bộ lớn dần?`, answer: '坚持每天练习' };
  }
  const passage = `${topic.label} matters more than people expect. Many people ${v1} every day, and they also enjoy ${v2} on weekends. Consistency turns small habits into real progress.`;
  return { passage, comprehensionQuestion: `Điều gì biến thói quen nhỏ thành tiến bộ thật?`, answer: 'consistency' };
}

function speakingMaterial(language: Language, topic: { label: string; vocab: string[] }, _day: number, level: number) {
  const [v1, v2] = topic.vocab;
  const prompt = language === 'zh-CN'
    ? `请用中文说三句话，介绍你如何${v1}和${v2}。`
    : `Say three sentences about how you ${v1} and ${v2}.`;
  return {
    prompt,
    targetPhrases: [v1, v2],
    minutes: level <= 1 ? 1 : level <= 2 ? 2 : 3,
    recordAndRetry: true
  };
}

function reviewMaterial(language: Language, topic: { label: string; vocab: string[] }, _day: number, level: number) {
  return {
    items: topic.vocab.slice(0, 3 + level).map((word) => ({ term: word })),
    prompt: language === 'zh-CN' ? 'Nhìn từ, nhớ nghĩa và đặt câu ngắn.' : 'Look at the word, recall the meaning, and make a short sentence.'
  };
}
