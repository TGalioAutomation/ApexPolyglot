import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';

const port = 4300 + Math.floor(Math.random() * 100);
const child = spawn(process.execPath, ['server.mjs'], {env: {...process.env, PORT: String(port), OPENAI_API_KEY: '', GEMINI_API_KEY: '', DEEPSEEK_API_KEY: ''}, stdio: ['ignore', 'pipe', 'pipe']});
let providerChild;
let mockProvider;
try {
  await once(child.stdout, 'data');
  const base = `http://127.0.0.1:${port}`;
  const home = await fetch(`${base}/`);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /LingoPilot/);

  const curriculum = await fetch(`${base}/curriculum.json`);
  assert.equal(curriculum.status, 200);
  assert.equal((await curriculum.json()).durationDays, 90);

  for (const privatePath of ['/.git/config', '/.env', '/server.mjs', '/package.json']) {
    const privateResponse = await fetch(`${base}${privatePath}`);
    assert.equal(privateResponse.status, 404, `${privatePath} must not be public`);
  }

  const health = await fetch(`${base}/healthz`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), {ok: true});

  const aiStatus = await fetch(`${base}/api/ai/status`);
  assert.equal(aiStatus.status, 200);
  assert.equal((await aiStatus.json()).active, 'demo');

  const assessmentStart = await fetch(`${base}/api/assessment/start`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({language:'en',kind:'placement'})});
  assert.equal(assessmentStart.status, 200);
  const assessment = await assessmentStart.json();
  assert.equal(assessment.questions.length, 6);
  assert.equal('answer' in assessment.questions[0], false);

  const assessmentSubmit = await fetch(`${base}/api/assessment/submit`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({language:'en',kind:'placement',answers:[{id:'en-meaning-1',answer:0},{id:'en-listen-1',answer:1},{id:'en-grammar-1',answer:1},{id:'en-reading-2',answer:1},{id:'en-speak-1',answer:'I am Minh and my goal is to learn English for work and travel every day'},{id:'en-speak-2',answer:'I do not understand. Could you please repeat that more slowly so I can understand you?'}]})});
  assert.equal(assessmentSubmit.status, 200);
  const assessmentResult = await assessmentSubmit.json();
  assert.equal(assessmentResult.overall, 100);
  assert.equal(assessmentResult.level, null);
  assert.equal(assessmentResult.estimatedLevel, 7);
  assert.equal(assessmentResult.evidenceStatus, 'preliminary');
  assert.match(assessmentResult.evidenceCaveat, /transcript/i);
  assert.equal(assessmentResult.plan.requirements.length, 3);
  assert.equal(assessmentResult.plan.provider, 'demo');

  const invalidAssessment = await fetch(`${base}/api/assessment/submit`, {method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  assert.equal(invalidAssessment.status, 400);

  const coach = await fetch(`${base}/api/coach`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({message: 'practice English', language: 'en'})});
  assert.equal(coach.status, 200);
  assert.match((await coach.json()).reply, /demo|3 câu/i);

  const lesson = await fetch(`${base}/api/lesson`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({language: 'zh', goal: 'speaking'})});
  assert.equal(lesson.status, 200);
  assert.equal((await lesson.json()).title, '我的一天');

  const invalid = await fetch(`${base}/api/coach`, {method: 'POST', headers: {'content-type': 'application/json'}, body: '{}'});
  assert.equal(invalid.status, 400);

  const mockPort = 4500 + Math.floor(Math.random() * 100);
  mockProvider = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body || '{}');
    const isGemini = request.url.includes('/models/');
    const userText = isGemini ? payload.contents?.[0]?.parts?.[0]?.text : payload.messages?.find((item) => item.role === 'user')?.content;
    const allInvalid = String(userText).includes('force all invalid');
    let content;
    if (allInvalid) content = '\u0000raw-or-invalid';
    else if (isGemini && String(userText).includes('micro-lesson')) content = JSON.stringify({title:7,prompt:'raw prompt',tip:'raw tip',unexpected:true});
    else if (isGemini && String(userText).includes('kết quả kiểm tra')) content = JSON.stringify({summary:'raw',requirements:[1,2,3,4].map((index) => ({title:`Raw ${index}`,minutes:99,successCriterion:'raw',unexpected:true})),nextCheckpoint:'raw',promotionRule:'raw',unexpected:true});
    else if (isGemini) content = '\u0000raw-or-invalid';
    else if (String(userText).includes('micro-lesson')) content = JSON.stringify({title:'Validated lesson',prompt:'Say three useful sentences.',tip:'Retry once after feedback.'});
    else if (String(userText).includes('kết quả kiểm tra')) content = JSON.stringify({summary:'Validated plan',requirements:[1,2,3].map((index) => ({title:`Task ${index}`,minutes:10,successCriterion:'Đạt 80% hai lượt'})),nextCheckpoint:'Sau 7 ngày',promotionRule:'Chỉ tăng Level khi đủ evidence.'});
    else content = 'Validated coach reply.';
    response.writeHead(200, {'content-type':'application/json'});
    response.end(JSON.stringify(isGemini ? {candidates:[{content:{parts:[{text:content}]}}]} : {choices:[{message:{content}}]}));
  });
  mockProvider.listen(mockPort, '127.0.0.1');
  await once(mockProvider, 'listening');

  const providerPort = 4700 + Math.floor(Math.random() * 100);
  providerChild = spawn(process.execPath, ['server.mjs'], {env: {...process.env, PORT:String(providerPort), AI_PROVIDER:'gemini', GEMINI_API_KEY:'test-gemini', GEMINI_API_BASE:`http://127.0.0.1:${mockPort}/v1beta`, DEEPSEEK_API_KEY:'test-deepseek', DEEPSEEK_API_BASE:`http://127.0.0.1:${mockPort}`, OPENAI_API_KEY:''}, stdio:['ignore','pipe','pipe']});
  await once(providerChild.stdout, 'data');
  const providerBase = `http://127.0.0.1:${providerPort}`;

  const validatedCoach = await (await fetch(`${providerBase}/api/coach`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:'practice English',language:'en'})})).json();
  assert.equal(validatedCoach.provider, 'deepseek');
  assert.equal(validatedCoach.reply, 'Validated coach reply.');
  const rejectedCoach = await (await fetch(`${providerBase}/api/coach`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:'force all invalid',language:'en'})})).json();
  assert.equal(rejectedCoach.provider, 'demo');
  assert.doesNotMatch(rejectedCoach.reply, /raw-or-invalid/);

  const validatedLesson = await (await fetch(`${providerBase}/api/lesson`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({language:'en',goal:'speaking'})})).json();
  assert.deepEqual(validatedLesson, {title:'Validated lesson',prompt:'Say three useful sentences.',tip:'Retry once after feedback.',provider:'deepseek'});
  const rejectedLesson = await (await fetch(`${providerBase}/api/lesson`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({language:'en',goal:'force all invalid'})})).json();
  assert.equal(rejectedLesson.provider, 'demo');
  assert.doesNotMatch(rejectedLesson.prompt, /raw-or-invalid/);
  const validatedAssessment = await (await fetch(`${providerBase}/api/assessment/submit`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({language:'en',kind:'placement',answers:[]})})).json();
  assert.equal(validatedAssessment.plan.provider, 'deepseek');
  assert.equal(validatedAssessment.plan.requirements.length, 3);
  assert.deepEqual(Object.keys(validatedAssessment.plan).sort(), ['nextCheckpoint','promotionRule','provider','requirements','summary']);
  const rejectedAssessment = await (await fetch(`${providerBase}/api/assessment/submit`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({language:'en',kind:'placement',goal:'force all invalid',answers:[]})})).json();
  assert.equal(rejectedAssessment.plan.provider, 'demo');
  assert.equal(rejectedAssessment.plan.requirements.length, 3);
  console.log('server integration tests passed');
} finally {
  providerChild?.kill('SIGTERM');
  mockProvider?.close();
  child.kill('SIGTERM');
}
