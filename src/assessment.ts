export type Language = 'en' | 'zh';
export type AssessmentKind = 'placement' | 'weekly' | 'phase';
export type Skill = 'listening' | 'reading' | 'speaking';

export interface ChoiceQuestion {
  id: string;
  skill: Skill;
  type: 'choice' | 'listening';
  prompt: string;
  choices: string[];
  answer: number;
  audioText?: string;
}

export interface OpenQuestion {
  id: string;
  skill: Skill;
  type: 'open';
  prompt: string;
  minWords: number;
  keywords: string[];
}

export type Question = ChoiceQuestion | OpenQuestion;

export interface PublicQuestion {
  id: string;
  skill: Skill;
  type: string;
  prompt: string;
  choices?: string[];
  audioText?: string;
}

export interface AnswerInput {
  id: string;
  answer: number | string;
}

export interface ScoreResult {
  overall: number;
  level: null;
  estimatedLevel: number;
  evidenceStatus: 'preliminary';
  evidenceCaveat: string;
  skills: Record<Skill, number>;
  evidence: { questionId: string; skill: Skill; earned: number }[];
}

const bank: Record<Language, Question[]> = {
  en: [
    {id:'en-meaning-1', skill:'reading', type:'choice', prompt:'Choose the best reply: “How was your weekend?”', choices:['It was relaxing, thanks.','At seven o’clock.','Two tickets, please.'], answer:0},
    {id:'en-listen-1', skill:'listening', type:'listening', prompt:'Nghe và chọn ý đúng.', audioText:'The meeting has been moved from Tuesday morning to Wednesday afternoon.', choices:['The meeting is Tuesday morning.','The meeting is Wednesday afternoon.','The meeting was cancelled.'], answer:1},
    {id:'en-grammar-1', skill:'reading', type:'choice', prompt:'Complete: “If I had more time, I ___ Chinese too.”', choices:['study','would study','studied yesterday'], answer:1},
    {id:'en-reading-2', skill:'reading', type:'choice', prompt:'“Mai missed the bus, so she joined the meeting from a café.” Why was Mai at the café?', choices:['She works there.','She missed the bus.','The meeting was cancelled.'], answer:1},
    {id:'en-speak-1', skill:'speaking', type:'open', prompt:'Viết transcript hoặc nói 2–3 câu giới thiệu bản thân và mục tiêu học tiếng Anh.', minWords:12, keywords:['i','my','learn']},
    {id:'en-speak-2', skill:'speaking', type:'open', prompt:'Viết transcript hoặc nói cách bạn xử lý khi không hiểu người đối thoại.', minWords:14, keywords:['could','repeat','understand']}
  ],
  zh: [
    {id:'zh-meaning-1', skill:'reading', type:'choice', prompt:'“你叫什么名字？” có nghĩa là gì?', choices:['Bạn tên là gì?','Bạn đi đâu?','Bạn bao nhiêu tuổi?'], answer:0},
    {id:'zh-listen-1', skill:'listening', type:'listening', prompt:'Nghe và chọn thông tin đúng.', audioText:'我明天下午三点去图书馆。', choices:['Hôm nay lúc 3 giờ','Ngày mai lúc 3 giờ chiều','Ngày mai lúc 3 giờ sáng'], answer:1},
    {id:'zh-order-1', skill:'reading', type:'choice', prompt:'Chọn câu đúng để nói “Tôi thích học tiếng Trung”.', choices:['我学习喜欢中文。','我喜欢学习中文。','中文我学习吗。'], answer:1},
    {id:'zh-reading-2', skill:'reading', type:'choice', prompt:'“小王今天很忙，但是晚上有时间。” Khi nào Tiểu Vương có thời gian?', choices:['Buổi sáng','Buổi chiều','Buổi tối'], answer:2},
    {id:'zh-speak-1', skill:'speaking', type:'open', prompt:'Viết pinyin/chữ Hán hoặc nói 2–3 câu giới thiệu tên và quê quán.', minWords:5, keywords:['我','叫','越南']},
    {id:'zh-speak-2', skill:'speaking', type:'open', prompt:'Viết pinyin/chữ Hán hoặc nói yêu cầu người khác nhắc lại chậm hơn.', minWords:4, keywords:['请','再','说']}
  ]
};

const allSkills: Skill[] = ['listening', 'reading', 'speaking'];

export function questionsFor(language: Language): Question[] {
  return bank[language] || bank.en;
}

export function publicQuestions(language: Language): PublicQuestion[] {
  return questionsFor(language).map((question) => {
    const safe: PublicQuestion = { id: question.id, skill: question.skill, type: question.type, prompt: question.prompt };
    if (question.type !== 'open') safe.choices = question.choices;
    if (question.type === 'listening') safe.audioText = question.audioText;
    return safe;
  });
}

export function scoreAssessment(language: Language, answers: AnswerInput[] = []): ScoreResult {
  const bankForLanguage = bank[language] || bank.en;
  const byId = new Map(answers.map((item) => [item.id, item.answer]));
  const dimensions: Record<Skill, { earned: number; total: number }> = {
    listening: { earned: 0, total: 0 }, reading: { earned: 0, total: 0 }, speaking: { earned: 0, total: 0 }
  };
  const evidence: ScoreResult['evidence'] = [];
  for (const question of bankForLanguage) {
    const response = byId.get(question.id);
    const dimension = dimensions[question.skill];
    dimension.total += 1;
    let earned = 0;
    if (question.type === 'open') {
      const normalized = String(response || '').toLowerCase();
      const words = normalized.split(/\s+/).filter(Boolean);
      const keywordHits = question.keywords.filter((keyword) => normalized.includes(keyword)).length;
      earned = Math.min(1, (words.length >= question.minWords ? 0.6 : words.length / question.minWords * 0.6) + (keywordHits / question.keywords.length) * 0.4);
    } else {
      earned = Number(response) === question.answer ? 1 : 0;
    }
    dimension.earned += earned;
    evidence.push({ questionId: question.id, skill: question.skill, earned: Number(earned.toFixed(2)) });
  }
  const skills = Object.fromEntries(allSkills.map((name) => [name, Math.round(dimensions[name].earned / dimensions[name].total * 100)])) as Record<Skill, number>;
  const overall = Math.round((skills.listening * 0.3) + (skills.reading * 0.35) + (skills.speaking * 0.35));
  const estimatedLevel = overall < 25 ? 1 : overall < 40 ? 2 : overall < 55 ? 3 : overall < 70 ? 4 : overall < 82 ? 5 : overall < 92 ? 6 : 7;
  return {
    overall,
    level: null,
    estimatedLevel,
    evidenceStatus: 'preliminary',
    evidenceCaveat: 'Điểm nói chỉ dựa trên nội dung transcript; chưa đo phát âm, độ trôi chảy hoặc thanh điệu từ audio.',
    skills,
    evidence
  };
}

export function deterministicRequirements(result: ScoreResult, language: Language, kind: AssessmentKind) {
  const weakest = Object.entries(result.skills).sort((a, b) => a[1] - b[1])[0][0] as Skill;
  const labels: Record<Skill, string> = { listening: 'nghe', reading: 'đọc', speaking: 'nói' };
  return {
    summary: `Kết quả ${kind === 'placement' ? 'đầu vào' : 'giai đoạn'} sơ bộ: điểm bắt đầu ước lượng Level ${result.estimatedLevel}, ${result.overall}/100. Ưu tiên kỹ năng ${labels[weakest]}.`,
    requirements: [
      { title: `Luyện ${labels[weakest]} có chủ đích`, minutes: 12, successCriterion: 'Đạt ít nhất 80% trong 2 lượt liên tiếp' },
      { title: language === 'zh' ? 'Nói lại 5 câu có thanh điệu mục tiêu' : 'Shadowing 5 câu theo nhịp và trọng âm', minutes: 10, successCriterion: 'Hoàn thành ghi âm và một lượt sửa' },
      { title: 'Ôn lỗi từ bài kiểm tra', minutes: 8, successCriterion: 'Sửa đúng tối thiểu 4/5 mục' }
    ],
    nextCheckpoint: kind === 'placement' ? 'Sau 7 ngày học có bằng chứng' : 'Sau 7–14 ngày hoặc khi đạt đủ tiêu chí',
    promotionRule: 'AI chỉ đề xuất; level chỉ tăng khi đủ unit, retention, nghe/đọc và speaking checkpoint.'
  };
}
