import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;
    process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}
const port = Number(process.env.PORT || 4173);
const openvoxApi = (process.env.OPENVOX_API || 'http://127.0.0.1:8000/v1').replace(/\/$/, '');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const publicFiles = new Set(['/index.html', '/styles.css', '/style-overrides.css', '/app.js', '/curriculum.json']);
const tutorSystem = `Bạn là LingoPilot Coach, giáo viên tiếng Anh và tiếng Trung chuyên nghiệp cho người Việt. Dạy theo mục tiêu đo được, ưu tiên nghe, đọc, nói. Luôn: ghi nhận điểm làm tốt; sửa một lỗi quan trọng nhất; đưa mẫu đúng ở trình độ phù hợp; giải thích ngắn bằng tiếng Việt; yêu cầu học viên thử lại. Không tự cấp chứng chỉ, không thay đổi level nếu thiếu bằng chứng kiểm tra, không chấm phát âm chỉ từ transcript.`;
const badRequest = (message) => Object.assign(new Error(message), {statusCode:400});

const assessmentBank = {
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

function configuredProviders() {
  return [process.env.GEMINI_API_KEY && 'gemini', process.env.DEEPSEEK_API_KEY && 'deepseek', process.env.OPENAI_API_KEY && 'openai'].filter(Boolean);
}
function providerOrder() {
  const configured = configuredProviders();
  const preferred = (process.env.AI_PROVIDER || 'auto').toLowerCase();
  return preferred === 'auto' ? configured : [preferred, ...configured.filter((item) => item !== preferred)];
}
function extractJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}
function sanitizeTutorText(value) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  if (!clean || clean.length > 2000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(clean)) return null;
  if (/<script\b|javascript:|\b(?:api[_ -]?key|authorization)\s*[:=]/i.test(clean)) return null;
  return clean;
}
function sanitizeLesson(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const allowed = ['prompt', 'tip', 'title'];
  if (Object.keys(value).sort().join('|') !== allowed.join('|')) return null;
  const limits = {title:120, prompt:1000, tip:500};
  const clean = {};
  for (const key of allowed) {
    if (typeof value[key] !== 'string' || !value[key].trim() || value[key].length > limits[key]) return null;
    clean[key] = value[key].trim();
  }
  return clean;
}
async function callProvider(provider, {system = tutorSystem, user, json = false}) {
  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const apiBase = (process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
    const response = await fetch(`${apiBase}/models/${encodeURIComponent(model)}:generateContent`, {method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY}, body:JSON.stringify({system_instruction:{parts:[{text:system}]}, contents:[{role:'user',parts:[{text:user}]}], generationConfig:json ? {responseMimeType:'application/json'} : undefined})});
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const data = await response.json();
    return {text:data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '', provider, model};
  }
  if (provider === 'deepseek' && process.env.DEEPSEEK_API_KEY) {
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
    const response = await fetch(`${(process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com').replace(/\/$/,'')}/chat/completions`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.DEEPSEEK_API_KEY}`}, body:JSON.stringify({model,messages:[{role:'system',content:system},{role:'user',content:user}],thinking:{type:'disabled'},response_format:json?{type:'json_object'}:{type:'text'},max_tokens:json?1400:700})});
    if (!response.ok) throw new Error(`DeepSeek returned ${response.status}`);
    const data = await response.json();
    return {text:data.choices?.[0]?.message?.content || '', provider, model};
  }
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const response = await fetch('https://api.openai.com/v1/responses', {method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model,input:[{role:'system',content:[{type:'input_text',text:system}]},{role:'user',content:[{type:'input_text',text:user}]}]})});
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);
    const data = await response.json();
    return {text:data.output_text || '', provider, model};
  }
  throw new Error(`${provider} is not configured`);
}
async function runTutor(input, validator) {
  const errors = [];
  for (const provider of providerOrder()) {
    try {
      const result = await callProvider(provider, input);
      if (!validator) return result;
      const validated = validator(result.text);
      if (validated === null) throw new Error(`${provider} returned invalid output`);
      return {...result, validated};
    } catch (error) { errors.push(error.message); }
  }
  return {text:'', provider:'demo', model:'deterministic-fallback', errors};
}
async function openvoxJson(path, options = {}) {
  const response = await fetch(`${openvoxApi}${path}`, options);
  if (!response.ok) throw Object.assign(new Error(`OpenVox returned ${response.status}`), {statusCode: 503});
  return response.json();
}
async function discoverOpenVox(language) {
  const models = await openvoxJson('/models');
  const preferred = process.env.OPENVOX_MODEL || 'kokoro';
  const model = models.data?.find((item) => item.id === preferred) || models.data?.[0];
  if (!model) throw Object.assign(new Error('OpenVox has no models'), {statusCode: 503});
  await openvoxJson(`/models/${encodeURIComponent(model.id)}/load`, {method: 'POST'});
  const languages = await openvoxJson(`/models/${encodeURIComponent(model.id)}/languages`);
  const languageId = languages.data?.some((item) => item.id === language) ? language : (languages.data?.[0]?.id || language);
  const voices = await openvoxJson(`/models/${encodeURIComponent(model.id)}/voices?language=${encodeURIComponent(languageId)}`);
  const voice = voices.data?.find((item) => item.id === process.env.OPENVOX_VOICE) || voices.data?.[0];
  if (!voice) throw Object.assign(new Error(`OpenVox has no voices for ${languageId}`), {statusCode: 503});
  return {model: model.id, language: languageId, voice: voice.id};
}
async function openvoxSpeech(text, language) {
  const selected = await discoverOpenVox(language);
  const response = await fetch(`${openvoxApi}/audio/speech`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...selected, input: text, response_format: 'wav'})});
  if (!response.ok) throw Object.assign(new Error(`OpenVox speech returned ${response.status}`), {statusCode: 503});
  return {audio: Buffer.from(await response.arrayBuffer()), ...selected};
}
async function coachReply(message, language) {
  const result = await runTutor({user:`Ngôn ngữ đang học: ${language === 'zh' ? 'Chinese' : 'English'}. Tin nhắn học viên: ${message}`}, sanitizeTutorText);
  return {reply:result.validated || (language === 'zh' ? '很好! Hãy thử nói: “我叫 Minh，我来自越南。” Mình sẽ giúp bạn sửa thanh điệu.' : 'Mình đang chạy chế độ demo. Hãy nói 3 câu bằng tiếng Anh về kế hoạch ngày mai nhé.'), provider:result.provider};
}
async function lessonReply(language = 'en', goal = 'speaking') {
  const fallback = {title: language === 'zh' ? '我的一天' : 'A better day', prompt: language === 'zh' ? '请用中文说三句话介绍你的一天。' : 'Say three sentences about your day.', tip:'Nghe mẫu, nói lại, rồi tự sửa một lỗi.',provider:'demo'};
  const result = await runTutor({json:true,user:`Tạo micro-lesson 10 phút bằng ${language === 'zh' ? 'tiếng Trung giản thể' : 'tiếng Anh'} tập trung vào ${goal}. Trả JSON hợp lệ chỉ gồm title, prompt, tip.`}, (text) => {
    try { return sanitizeLesson(extractJson(text)); } catch { return null; }
  });
  return result.validated ? {...result.validated,provider:result.provider} : fallback;
}

function publicQuestion(question) {
  const {answer, minWords, keywords, ...safe} = question;
  return safe;
}
function scoreAssessment(language, answers = []) {
  const bank = assessmentBank[language] || assessmentBank.en;
  const byId = new Map(answers.map((item) => [item.id, item.answer]));
  const dimensions = {listening:{earned:0,total:0},reading:{earned:0,total:0},speaking:{earned:0,total:0}};
  const evidence = [];
  for (const question of bank) {
    const response = byId.get(question.id);
    const dimension = dimensions[question.skill]; dimension.total += 1;
    let earned = 0;
    if (question.type === 'open') {
      const normalized = String(response || '').toLowerCase();
      const words = normalized.split(/\s+/).filter(Boolean);
      const keywordHits = question.keywords.filter((keyword) => normalized.includes(keyword)).length;
      earned = Math.min(1, (words.length >= question.minWords ? .6 : words.length / question.minWords * .6) + (keywordHits / question.keywords.length) * .4);
    } else earned = Number(response) === question.answer ? 1 : 0;
    dimension.earned += earned;
    evidence.push({questionId:question.id,skill:question.skill,earned:Number(earned.toFixed(2))});
  }
  const skills = Object.fromEntries(Object.entries(dimensions).map(([name,value]) => [name,Math.round(value.earned/value.total*100)]));
  const overall = Math.round((skills.listening*.3)+(skills.reading*.35)+(skills.speaking*.35));
  const estimatedLevel = overall < 25 ? 1 : overall < 40 ? 2 : overall < 55 ? 3 : overall < 70 ? 4 : overall < 82 ? 5 : overall < 92 ? 6 : 7;
  return {
    overall,
    level:null,
    estimatedLevel,
    evidenceStatus:'preliminary',
    evidenceCaveat:'Điểm nói chỉ dựa trên nội dung transcript; chưa đo phát âm, độ trôi chảy hoặc thanh điệu từ audio.',
    skills,
    evidence
  };
}
function deterministicRequirements(result, language, kind) {
  const weakest = Object.entries(result.skills).sort((a,b) => a[1]-b[1])[0][0];
  const labels = {listening:'nghe',reading:'đọc',speaking:'nói'};
  return {
    summary:`Kết quả ${kind === 'placement' ? 'đầu vào' : 'giai đoạn'} sơ bộ: điểm bắt đầu ước lượng Level ${result.estimatedLevel}, ${result.overall}/100. Ưu tiên kỹ năng ${labels[weakest]}.`,
    requirements:[
      {title:`Luyện ${labels[weakest]} có chủ đích`,minutes:12,successCriterion:'Đạt ít nhất 80% trong 2 lượt liên tiếp'},
      {title:language === 'zh' ? 'Nói lại 5 câu có thanh điệu mục tiêu' : 'Shadowing 5 câu theo nhịp và trọng âm',minutes:10,successCriterion:'Hoàn thành ghi âm và một lượt sửa'},
      {title:'Ôn lỗi từ bài kiểm tra',minutes:8,successCriterion:'Sửa đúng tối thiểu 4/5 mục'}
    ],
    nextCheckpoint:kind === 'placement' ? 'Sau 7 ngày học có bằng chứng' : 'Sau 7–14 ngày hoặc khi đạt đủ tiêu chí',
    promotionRule:'AI chỉ đề xuất; level chỉ tăng khi đủ unit, retention, nghe/đọc và speaking checkpoint.'
  };
}
function sanitizeRequirements(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const allowedTop = ['nextCheckpoint', 'promotionRule', 'requirements', 'summary'];
  if (Object.keys(value).sort().join('|') !== allowedTop.join('|')) return null;
  const requirements = value.requirements;
  if (!Array.isArray(requirements) || requirements.length !== 3) return null;
  const cleanRequirements = requirements.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    if (Object.keys(item).sort().join('|') !== 'minutes|successCriterion|title') return null;
    if (typeof item.title !== 'string' || !item.title.trim() || item.title.length > 120) return null;
    if (!Number.isInteger(item.minutes) || item.minutes < 1 || item.minutes > 50) return null;
    if (typeof item.successCriterion !== 'string' || !item.successCriterion.trim() || item.successCriterion.length > 240) return null;
    return {title:item.title.trim(), minutes:item.minutes, successCriterion:item.successCriterion.trim()};
  });
  if (cleanRequirements.some((item) => item === null)) return null;
  for (const key of ['summary', 'nextCheckpoint', 'promotionRule']) {
    if (typeof value[key] !== 'string' || !value[key].trim() || value[key].length > 500) return null;
  }
  return {
    summary:value.summary.trim(),
    requirements:cleanRequirements,
    nextCheckpoint:value.nextCheckpoint.trim(),
    promotionRule:value.promotionRule.trim()
  };
}
async function assessmentFeedback(result, language, kind, goal) {
  const fallback = deterministicRequirements(result, language, kind);
  const prompt = `Hãy phân tích kết quả kiểm tra ngôn ngữ và tạo yêu cầu học. Dữ liệu: ${JSON.stringify({language,kind,goal,result})}. Trả JSON chỉ gồm summary, requirements (đúng 3 phần tử với title, minutes nguyên 1–50, successCriterion), nextCheckpoint, promotionRule. Đây chỉ là ước lượng; không công nhận hoặc thay đổi level.`;
  const ai = await runTutor({json:true,user:prompt}, (text) => {
    try { return sanitizeRequirements(extractJson(text)); } catch { return null; }
  });
  return ai.validated ? {...ai.validated,provider:ai.provider} : {...fallback,provider:'demo'};
}
const server = createServer(async (request, response) => {
  try {
    if (request.method === 'GET' && request.url === '/healthz') { response.writeHead(200, {'Content-Type':'application/json; charset=utf-8'}); return response.end('{"ok":true}'); }
    if (request.method === 'GET' && request.url === '/api/ai/status') { const providers=configuredProviders(); response.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); return response.end(JSON.stringify({configured:providers.length>0,preferred:process.env.AI_PROVIDER||'auto',providers,active:providerOrder()[0]||'demo'})); }
    if (request.method === 'POST' && request.url === '/api/assessment/start') { let body=''; for await (const chunk of request) body += chunk; const payload=JSON.parse(body||'{}'); const language=payload.language==='zh'?'zh':'en'; const kind=['placement','weekly','phase'].includes(payload.kind)?payload.kind:'placement'; const questions=assessmentBank[language].map(publicQuestion); response.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); return response.end(JSON.stringify({assessmentId:`${kind}-${language}-${Date.now()}`,language,kind,durationMinutes:kind==='placement'?8:10,questions,notice:'Điểm nói từ transcript chỉ là sơ bộ; phát âm/thanh điệu cần audio analyzer.'})); }
    if (request.method === 'POST' && request.url === '/api/assessment/submit') { let body=''; for await (const chunk of request) body += chunk; const payload=JSON.parse(body||'{}'); if(!Array.isArray(payload.answers)) throw badRequest('answers is required'); const language=payload.language==='zh'?'zh':'en'; const kind=['placement','weekly','phase'].includes(payload.kind)?payload.kind:'placement'; const result=scoreAssessment(language,payload.answers); const plan=await assessmentFeedback(result,language,kind,String(payload.goal||'giao tiếp tự tin').slice(0,300)); response.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); return response.end(JSON.stringify({...result,kind,language,plan})); }
    if (request.method === 'GET' && request.url === '/api/voice/status') { const selected = await discoverOpenVox('en'); response.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); return response.end(JSON.stringify({available:true, ...selected})); }
    if (request.method === 'POST' && request.url === '/api/coach') { let body=''; for await (const chunk of request) body += chunk; const payload=JSON.parse(body||'{}'); if(typeof payload.message!=='string'||!payload.message.trim()) throw new Error('message is required'); const result=await coachReply(payload.message.trim().slice(0,1200),payload.language); response.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); return response.end(JSON.stringify(result)); }
    if (request.method === 'POST' && request.url === '/api/lesson') { let body=''; for await (const chunk of request) body += chunk; const payload=JSON.parse(body||'{}'); const result=await lessonReply(payload.language, payload.goal); response.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); return response.end(JSON.stringify(result)); }
    if (request.method === 'POST' && request.url === '/api/voice') { let body=''; for await (const chunk of request) body += chunk; const payload=JSON.parse(body||'{}'); if(typeof payload.text!=='string'||!payload.text.trim()) throw new Error('text is required'); const result=await openvoxSpeech(payload.text.trim().slice(0,2000), payload.language === 'zh-CN' || payload.language === 'zh' ? 'zh' : 'en'); response.writeHead(200, {'Content-Type':'audio/wav','Cache-Control':'no-store','X-OpenVox-Model':result.model,'X-OpenVox-Voice':result.voice}); return response.end(result.audio); }
    const requested = normalize(request.url === '/' ? '/index.html' : request.url.split('?')[0]);
    if (!publicFiles.has(requested)) throw new Error('not public');
    const filePath = join(root, requested);
    const content=await readFile(filePath);
    response.writeHead(200,{'Content-Type':mime[extname(filePath)] || 'application/octet-stream','X-Content-Type-Options':'nosniff'});
    response.end(content);
  } catch (error) { const status=error.statusCode || (error.message==='message is required'||error.message==='text is required'?400:404); response.writeHead(status,{'Content-Type':'application/json; charset=utf-8'}); response.end(JSON.stringify({error:status===503?'OpenVox unavailable':status===400?error.message:'Not found'})); }
});
server.listen(port, () => console.log(`LingoPilot listening on http://localhost:${port}`));
