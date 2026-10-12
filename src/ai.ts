import { loadConfig } from './config.js';
import { deterministicRequirements, ScoreResult, Language, AssessmentKind } from './assessment.js';

export type ProviderName = 'gemini' | 'deepseek' | 'openai' | 'demo';

export interface ProviderResult {
  text: string;
  provider: ProviderName;
  model: string;
  errors?: string[];
  validated?: unknown;
}

const config = loadConfig();

export function configuredProviders(): ProviderName[] {
  return [
    process.env.GEMINI_API_KEY && 'gemini',
    process.env.DEEPSEEK_API_KEY && 'deepseek',
    process.env.OPENAI_API_KEY && 'openai'
  ].filter(Boolean) as ProviderName[];
}

export function providerOrder(): ProviderName[] {
  const configured = configuredProviders();
  const preferred = config.aiProvider;
  return preferred === 'auto' ? configured : [preferred, ...configured.filter((item) => item !== preferred)] as ProviderName[];
}

export function extractJson(text: string): unknown {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

export const tutorSystem = `Bạn là LingoPilot Coach, giáo viên tiếng Anh và tiếng Trung chuyên nghiệp cho người Việt. Dạy theo mục tiêu đo được, ưu tiên nghe, đọc, nói. Luôn: ghi nhận điểm làm tốt; sửa một lỗi quan trọng nhất; đưa mẫu đúng ở trình độ phù hợp; giải thích ngắn bằng tiếng Việt; yêu cầu học viên thử lại. Không tự cấp chứng chỉ, không thay đổi level nếu thiếu bằng chứng kiểm tra, không chấm phát âm chỉ từ transcript.`;

export function sanitizeTutorText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  if (!clean || clean.length > 2000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(clean)) return null;
  if (/<script\b|javascript:|\b(?:api[_ -]?key|authorization)\s*[:=]/i.test(clean)) return null;
  return clean;
}

interface LessonShape { title: string; prompt: string; tip: string }
export function sanitizeLesson(value: unknown): LessonShape | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const allowed = ['prompt', 'tip', 'title'];
  if (Object.keys(candidate).sort().join('|') !== allowed.join('|')) return null;
  const limits: Record<string, number> = { title: 120, prompt: 1000, tip: 500 };
  const clean: LessonShape = {} as LessonShape;
  for (const key of allowed) {
    if (typeof candidate[key] !== 'string' || !(candidate[key] as string).trim() || (candidate[key] as string).length > limits[key]) return null;
    clean[key as keyof LessonShape] = (candidate[key] as string).trim();
  }
  return clean;
}

export interface Requirement { title: string; minutes: number; successCriterion: string }
export interface RequirementsShape { summary: string; requirements: Requirement[]; nextCheckpoint: string; promotionRule: string }

export function sanitizeRequirements(value: unknown): RequirementsShape | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const allowedTop = ['nextCheckpoint', 'promotionRule', 'requirements', 'summary'];
  if (Object.keys(candidate).sort().join('|') !== allowedTop.join('|')) return null;
  const requirements = candidate.requirements;
  if (!Array.isArray(requirements) || requirements.length !== 3) return null;
  const cleanRequirements: (Requirement | null)[] = requirements.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const req = item as Record<string, unknown>;
    if (Object.keys(req).sort().join('|') !== 'minutes|successCriterion|title') return null;
    if (typeof req.title !== 'string' || !req.title.trim() || req.title.length > 120) return null;
    if (!Number.isInteger(req.minutes) || (req.minutes as number) < 1 || (req.minutes as number) > 50) return null;
    if (typeof req.successCriterion !== 'string' || !req.successCriterion.trim() || req.successCriterion.length > 240) return null;
    return { title: req.title.trim(), minutes: req.minutes as number, successCriterion: req.successCriterion.trim() };
  });
  if (cleanRequirements.some((item) => item === null)) return null;
  for (const key of ['summary', 'nextCheckpoint', 'promotionRule'] as const) {
    if (typeof candidate[key] !== 'string' || !(candidate[key] as string).trim() || (candidate[key] as string).length > 500) return null;
  }
  return {
    summary: (candidate.summary as string).trim(),
    requirements: cleanRequirements as Requirement[],
    nextCheckpoint: (candidate.nextCheckpoint as string).trim(),
    promotionRule: (candidate.promotionRule as string).trim()
  };
}

async function callProvider(provider: ProviderName, options: { system?: string; user: string; json?: boolean }): Promise<ProviderResult> {
  const system = options.system ?? tutorSystem;
  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const apiBase = (process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
    const response = await fetch(`${apiBase}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: options.user }] }],
        generationConfig: options.json ? { responseMimeType: 'application/json' } : undefined
      })
    });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return { text: data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '', provider, model };
  }
  if (provider === 'deepseek' && process.env.DEEPSEEK_API_KEY) {
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
    const response = await fetch(`${(process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com').replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: options.user }],
        response_format: options.json ? { type: 'json_object' } : { type: 'text' },
        max_tokens: options.json ? 1400 : 700
      })
    });
    if (!response.ok) throw new Error(`DeepSeek returned ${response.status}`);
    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    return { text: data.choices?.[0]?.message?.content || '', provider, model };
  }
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: system }] },
          { role: 'user', content: [{ type: 'input_text', text: options.user }] }
        ]
      })
    });
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);
    const data = await response.json() as { output_text?: string };
    return { text: data.output_text || '', provider, model };
  }
  throw new Error(`${provider} is not configured`);
}

export interface TutorOptions { system?: string; user: string; json?: boolean; validator?: (text: string) => unknown }
export async function runTutor(options: TutorOptions): Promise<ProviderResult> {
  const errors: string[] = [];
  for (const provider of providerOrder()) {
    try {
      const result = await callProvider(provider, { system: options.system, user: options.user, json: options.json });
      if (!options.validator) return result;
      const validated = options.validator(result.text);
      if (validated === null) throw new Error(`${provider} returned invalid output`);
      return { ...result, validated };
    } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
  }
  return { text: '', provider: 'demo', model: 'deterministic-fallback', errors };
}

export async function coachReply(message: string, language: Language) {
  const result = await runTutor({
    user: `Ngôn ngữ đang học: ${language === 'zh' ? 'Chinese' : 'English'}. Tin nhắn học viên: ${message}`,
    validator: sanitizeTutorText
  });
  return {
    reply: result.validated || (language === 'zh' ? '很好! Hãy thử nói: “我叫 Minh，我来自越南。” Mình sẽ giúp bạn sửa thanh điệu.' : 'Mình đang chạy chế độ demo. Hãy nói 3 câu bằng tiếng Anh về kế hoạch ngày mai nhé.'),
    provider: result.provider
  };
}

export async function lessonReply(language: Language = 'en', goal = 'speaking') {
  const fallback = { title: language === 'zh' ? '我的一天' : 'A better day', prompt: language === 'zh' ? '请用中文说三句话介绍你的一天。' : 'Say three sentences about your day.', tip: 'Nghe mẫu, nói lại, rồi tự sửa một lỗi.', provider: 'demo' as const };
  const result = await runTutor({
    json: true,
    user: `Tạo micro-lesson 10 phút bằng ${language === 'zh' ? 'tiếng Trung giản thể' : 'tiếng Anh'} tập trung vào ${goal}. Trả JSON hợp lệ chỉ gồm title, prompt, tip.`,
    validator: (text: string) => {
      try { return sanitizeLesson(extractJson(text)); } catch { return null; }
    }
  });
  return result.validated ? { ...(result.validated as LessonShape), provider: result.provider } : fallback;
}

export async function assessmentFeedback(result: ScoreResult, language: Language, kind: AssessmentKind, goal: string) {
  const fallback = deterministicRequirements(result, language, kind);
  const prompt = `Hãy phân tích kết quả kiểm tra ngôn ngữ và tạo yêu cầu học. Dữ liệu: ${JSON.stringify({ language, kind, goal, result })}. Trả JSON chỉ gồm summary, requirements (đúng 3 phần tử với title, minutes nguyên 1–50, successCriterion), nextCheckpoint, promotionRule. Đây chỉ là ước lượng; không công nhận hoặc thay đổi level.`;
  const ai = await runTutor({
    json: true,
    user: prompt,
    validator: (text: string) => {
      try { return sanitizeRequirements(extractJson(text)); } catch { return null; }
    }
  });
  return ai.validated ? { ...(ai.validated as RequirementsShape), provider: ai.provider } : { ...fallback, provider: 'demo' as const };
}
