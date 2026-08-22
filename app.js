const toast = document.querySelector('#toast');
const modal = document.querySelector('#lessonModal');
const coachInput = document.querySelector('#coachInput');
const coachReply = document.querySelector('#coachReply');
const speechStatus = document.querySelector('#speechStatus');
const sessionTitle = document.querySelector('#sessionTitle');
const sessionDescription = document.querySelector('#sessionDescription');
const promptText = document.querySelector('#promptText');
const readingCheck = document.querySelector('#readingCheck');
const readingQuestion = document.querySelector('#readingQuestion');
const readingAnswer = document.querySelector('#readingAnswer');
const assessmentModal = document.querySelector('#assessmentModal');
const assessmentChoices = document.querySelector('#assessmentChoices');
const assessmentOpenAnswer = document.querySelector('#assessmentOpenAnswer');
let activeLesson = 'english-listen';
let openvoxAudio;
let activeAssessment;
let assessmentIndex = 0;
let selectedAssessmentAnswer;
const assessmentAnswers = [];
const progressKey = 'lingopilot-progress';
const savedProgress = JSON.parse(localStorage.getItem(progressKey) || '{"sessions":0,"minutes":0}');
if (!savedProgress.startDate) { savedProgress.startDate = new Date().toISOString().slice(0, 10); localStorage.setItem(progressKey, JSON.stringify(savedProgress)); }
function currentDay() {
  const started = new Date(`${savedProgress.startDate}T00:00:00`);
  return Math.min(90, Math.max(1, Math.floor((Date.now() - started.getTime()) / 86400000) + 1));
}
function renderProgress() {
  const day = currentDay();
  const streak = savedProgress.sessions ? Math.min(day, savedProgress.sessions) : 0;
  document.querySelector('#dayBadge').textContent = `DAY ${day} / 90`;
  document.querySelector('#streakDays').textContent = `${streak} ngày`;
  document.querySelector('#streakStat').innerHTML = `${streak} <small>ngày</small>`;
  document.querySelector('#sessionCount').textContent = `${savedProgress.sessions} phiên`;
  document.querySelector('#studyHours').innerHTML = `${(savedProgress.minutes / 60).toFixed(1)} <small>giờ</small>`;
  document.querySelector('#currentLevel').innerHTML = `Chưa đủ <small>bằng chứng</small>`;
  document.querySelector('#levelFill').style.width = '0%';
  const phase = day <= 30 ? 0 : day <= 60 ? 1 : 2;
  document.querySelectorAll('.road-step').forEach((step, index) => { step.classList.toggle('done', index < phase); step.classList.toggle('current', index === phase); });
}
renderProgress();

const knowledgeContent = {
  vocabulary: {
    en: [
      {id:'en-v-confident',topic:'GIAO TIẾP HẰNG NGÀY',term:'confident',pronunciation:'/ˈkɒn.fɪ.dənt/',meaning:'tự tin',example:'I feel more confident when I practise every day.',translation:'Tôi tự tin hơn khi luyện tập mỗi ngày.',lang:'en-US'},
      {id:'en-v-improve',topic:'HỌC TẬP',term:'improve',pronunciation:'/ɪmˈpruːv/',meaning:'cải thiện',example:'Listening every morning will improve your pronunciation.',translation:'Nghe mỗi sáng sẽ cải thiện phát âm của bạn.',lang:'en-US'},
      {id:'en-v-schedule',topic:'CÔNG VIỆC',term:'schedule',pronunciation:'/ˈʃed.juːl/',meaning:'lịch trình',example:'My study schedule starts at eight o’clock.',translation:'Lịch học của tôi bắt đầu lúc tám giờ.',lang:'en-US'},
      {id:'en-v-explain',topic:'GIAO TIẾP',term:'explain',pronunciation:'/ɪkˈspleɪn/',meaning:'giải thích',example:'Could you explain that idea one more time?',translation:'Bạn có thể giải thích ý đó thêm một lần không?',lang:'en-US'},
      {id:'en-v-choice',topic:'QUYẾT ĐỊNH',term:'choice',pronunciation:'/tʃɔɪs/',meaning:'sự lựa chọn',example:'Learning two languages is an exciting choice.',translation:'Học hai ngôn ngữ là một lựa chọn thú vị.',lang:'en-US'},
      {id:'en-v-habit',topic:'THÓI QUEN',term:'habit',pronunciation:'/ˈhæb.ɪt/',meaning:'thói quen',example:'A small daily habit can create a big change.',translation:'Một thói quen nhỏ hằng ngày có thể tạo thay đổi lớn.',lang:'en-US'}
    ],
    zh: [
      {id:'zh-v-jianchi',topic:'学习习惯 · THÓI QUEN',term:'坚持',pronunciation:'jiānchí',meaning:'kiên trì, duy trì',example:'我每天坚持学习中文。',translation:'Tôi kiên trì học tiếng Trung mỗi ngày.',lang:'zh-CN'},
      {id:'zh-v-jihua',topic:'计划 · KẾ HOẠCH',term:'计划',pronunciation:'jìhuà',meaning:'kế hoạch; lên kế hoạch',example:'这是我的学习计划。',translation:'Đây là kế hoạch học tập của tôi.',lang:'zh-CN'},
      {id:'zh-v-lianxi',topic:'学习 · HỌC TẬP',term:'练习',pronunciation:'liànxí',meaning:'luyện tập',example:'我想练习说中文。',translation:'Tôi muốn luyện nói tiếng Trung.',lang:'zh-CN'},
      {id:'zh-v-mingbai',topic:'沟通 · GIAO TIẾP',term:'明白',pronunciation:'míngbai',meaning:'hiểu, rõ',example:'我明白你的意思。',translation:'Tôi hiểu ý của bạn.',lang:'zh-CN'},
      {id:'zh-v-jieshi',topic:'沟通 · GIAO TIẾP',term:'解释',pronunciation:'jiěshì',meaning:'giải thích',example:'请再解释一次。',translation:'Vui lòng giải thích thêm một lần.',lang:'zh-CN'},
      {id:'zh-v-jinbu',topic:'成长 · TIẾN BỘ',term:'进步',pronunciation:'jìnbù',meaning:'tiến bộ',example:'我的中文进步了很多。',translation:'Tiếng Trung của tôi đã tiến bộ rất nhiều.',lang:'zh-CN'}
    ]
  },
  grammar: {
    en: [
      {id:'en-g-present-simple',level:'ENGLISH · NỀN TẢNG',title:'Present simple — thói quen',rule:'Dùng hiện tại đơn cho thói quen và sự thật lặp lại.',formula:'S + V(s/es) + …',example:'She studies English every evening.',prompt:'Chọn từ đúng: “He ___ Chinese on Sundays.”',choices:['study','studies','studying'],answer:1,explanation:'Chủ ngữ “He” cần động từ thêm -s: studies.'},
      {id:'en-g-past-simple',level:'ENGLISH · KỂ CHUYỆN',title:'Past simple — việc đã kết thúc',rule:'Dùng quá khứ đơn cho hành động đã kết thúc tại một thời điểm trong quá khứ.',formula:'S + V2/ed + …',example:'We watched a short film yesterday.',prompt:'Chọn từ đúng: “Mai ___ the lesson last night.”',choices:['finishes','finished','has finish'],answer:1,explanation:'“Last night” là mốc quá khứ đã kết thúc nên dùng finished.'},
      {id:'en-g-condition',level:'ENGLISH · PHẢN XẠ',title:'First conditional — khả năng thật',rule:'Dùng để nói kết quả có thể xảy ra nếu điều kiện trong tương lai được đáp ứng.',formula:'If + present, will + V',example:'If I practise, I will speak more naturally.',prompt:'Chọn từ đúng: “If you listen carefully, you ___ the main idea.”',choices:['understand','will understand','understood'],answer:1,explanation:'Mệnh đề kết quả của first conditional dùng will + động từ nguyên mẫu.'}
    ],
    zh: [
      {id:'zh-g-shi',level:'中文 · 基础',title:'是 — câu định danh',rule:'Dùng 是 để nối chủ ngữ với danh từ hoặc thông tin định danh.',formula:'Chủ ngữ + 是 + danh từ',example:'我是越南人。',prompt:'Chọn từ đúng: “她 ___ 我的老师。”',choices:['很','是','有'],answer:1,explanation:'“Cô ấy là giáo viên của tôi” cần động từ định danh 是.'},
      {id:'zh-g-you',level:'中文 · 日常',title:'有 — diễn đạt sở hữu',rule:'Dùng 有 để nói ai đó có hoặc tồn tại một sự vật.',formula:'Chủ ngữ + 有 + tân ngữ',example:'我有一本中文书。',prompt:'Chọn từ đúng: “我们 ___ 两节中文课。”',choices:['是','在','有'],answer:2,explanation:'Câu nói “chúng tôi có hai tiết tiếng Trung” nên dùng 有.'},
      {id:'zh-g-le',level:'中文 · 变化',title:'了 — hành động hoàn thành',rule:'Đặt 了 sau động từ để biểu thị hành động đã hoàn thành trong ngữ cảnh cụ thể.',formula:'Chủ ngữ + động từ + 了 + tân ngữ',example:'我看了那本书。',prompt:'Chọn câu đúng cho “Tôi đã ăn cơm rồi.”',choices:['我吃饭了。','我了吃饭。','我吃了饭吗。'],answer:0,explanation:'了 đứng sau động từ hoặc cuối câu: 我吃饭了。'}
    ]
  }
};
const knowledgeProgressKey = 'lingopilot-knowledge-progress';
const emptyKnowledgeProgress = {knownVocabulary:[],reviewVocabulary:[],grammarPassed:[],attempts:0};
let knowledgeProgress;
try { knowledgeProgress = {...emptyKnowledgeProgress,...JSON.parse(localStorage.getItem(knowledgeProgressKey) || '{}')}; } catch { knowledgeProgress = {...emptyKnowledgeProgress}; }
for (const key of ['knownVocabulary','reviewVocabulary','grammarPassed']) if (!Array.isArray(knowledgeProgress[key])) knowledgeProgress[key] = [];
let knowledgeMode = 'vocabulary';
let knowledgeLanguage = 'en';
let vocabularyIndex = 0;
let grammarIndex = 0;

function saveKnowledgeProgress() {
  localStorage.setItem(knowledgeProgressKey, JSON.stringify(knowledgeProgress));
}
function toggleListItem(listName, id, enabled) {
  const values = new Set(knowledgeProgress[listName]);
  if (enabled) values.add(id); else values.delete(id);
  knowledgeProgress[listName] = [...values];
}
function renderKnowledgeSummary() {
  const knownInLanguage = knowledgeContent.vocabulary[knowledgeLanguage].filter((item) => knowledgeProgress.knownVocabulary.includes(item.id)).length;
  const grammarInLanguage = knowledgeContent.grammar[knowledgeLanguage].filter((item) => knowledgeProgress.grammarPassed.includes(item.id)).length;
  document.querySelector('#knowledgeMastered').textContent = knowledgeProgress.knownVocabulary.length + knowledgeProgress.grammarPassed.length;
  document.querySelector('#vocabularyKnownCount').textContent = knownInLanguage;
  document.querySelector('#grammarPassedCount').textContent = grammarInLanguage;
}
function renderVocabularyCard() {
  const deck = knowledgeContent.vocabulary[knowledgeLanguage];
  const item = deck[vocabularyIndex % deck.length];
  document.querySelector('#vocabularyTopic').textContent = item.topic;
  document.querySelector('#vocabularyTerm').textContent = item.term;
  document.querySelector('#vocabularyPronunciation').textContent = item.pronunciation;
  document.querySelector('#vocabularyMeaning').textContent = item.meaning;
  document.querySelector('#vocabularyExample').textContent = item.example;
  document.querySelector('#vocabularyTranslation').textContent = item.translation;
  document.querySelector('#vocabularyAnswer').hidden = true;
  document.querySelector('#vocabularyActions').hidden = true;
  const reveal = document.querySelector('#revealVocabulary');
  reveal.hidden = false; reveal.setAttribute('aria-expanded','false'); reveal.textContent = 'Hiện nghĩa & ví dụ';
  document.querySelector('#knowledgeStep').textContent = `Từ ${vocabularyIndex + 1} / ${deck.length}`;
  document.querySelector('#knowledgeProgressFill').style.transform = `scaleX(${(vocabularyIndex + 1) / deck.length})`;
  document.querySelector('#speakVocabulary').dataset.text = `${item.term}. ${item.example}`;
  document.querySelector('#speakVocabulary').dataset.lang = item.lang;
}
function renderGrammarCard() {
  const deck = knowledgeContent.grammar[knowledgeLanguage];
  const item = deck[grammarIndex % deck.length];
  document.querySelector('#grammarLevel').textContent = item.level;
  document.querySelector('#grammarCounter').textContent = `Mẫu ${grammarIndex + 1} / ${deck.length}`;
  document.querySelector('#grammarTitle').textContent = item.title;
  document.querySelector('#grammarRule').textContent = item.rule;
  document.querySelector('#grammarFormula').textContent = item.formula;
  document.querySelector('#grammarExample').textContent = item.example;
  document.querySelector('#grammarPrompt').textContent = item.prompt;
  document.querySelector('#grammarFeedback').textContent = 'Chọn một đáp án để kiểm tra.';
  document.querySelector('#grammarFeedback').className = 'grammar-feedback';
  document.querySelector('#nextGrammar').hidden = true;
  const choices = document.querySelector('#grammarChoices'); choices.replaceChildren();
  item.choices.forEach((choice, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = choice;
    button.addEventListener('click', () => answerGrammar(button,index,item)); choices.append(button);
  });
  document.querySelector('#knowledgeStep').textContent = `Mẫu ${grammarIndex + 1} / ${deck.length}`;
  document.querySelector('#knowledgeProgressFill').style.transform = `scaleX(${(grammarIndex + 1) / deck.length})`;
}
function answerGrammar(button, index, item) {
  knowledgeProgress.attempts += 1;
  if (index !== item.answer) {
    button.classList.add('incorrect'); button.disabled = true;
    document.querySelector('#grammarFeedback').textContent = 'Chưa đúng. Loại đáp án này và thử lại nhé.';
    document.querySelector('#grammarFeedback').className = 'grammar-feedback error';
    saveKnowledgeProgress(); return;
  }
  document.querySelectorAll('#grammarChoices button').forEach((choice,indexChoice) => { choice.disabled = true; choice.classList.toggle('correct',indexChoice === item.answer); });
  toggleListItem('grammarPassed',item.id,true); saveKnowledgeProgress(); renderKnowledgeSummary();
  document.querySelector('#grammarFeedback').textContent = `Đúng rồi. ${item.explanation}`;
  document.querySelector('#grammarFeedback').className = 'grammar-feedback success';
  document.querySelector('#nextGrammar').hidden = false;
  showToast('Đã ghi nhận một mẫu ngữ pháp.');
}
function renderKnowledge() {
  document.querySelectorAll('.knowledge-mode').forEach((button) => { const active=button.dataset.knowledgeMode===knowledgeMode; button.classList.toggle('active',active); button.setAttribute('aria-selected',String(active)); });
  document.querySelectorAll('.knowledge-language').forEach((button) => { const active=button.dataset.knowledgeLanguage===knowledgeLanguage; button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active)); });
  document.querySelector('#vocabularyPanel').hidden = knowledgeMode !== 'vocabulary';
  document.querySelector('#grammarPanel').hidden = knowledgeMode !== 'grammar';
  renderKnowledgeSummary();
  if (knowledgeMode === 'vocabulary') renderVocabularyCard(); else renderGrammarCard();
}
document.querySelectorAll('.knowledge-mode').forEach((button) => button.addEventListener('click', () => { knowledgeMode=button.dataset.knowledgeMode; renderKnowledge(); }));
document.querySelectorAll('.knowledge-language').forEach((button) => button.addEventListener('click', () => { knowledgeLanguage=button.dataset.knowledgeLanguage; vocabularyIndex=0; grammarIndex=0; renderKnowledge(); }));
document.querySelector('#revealVocabulary').addEventListener('click', (event) => {
  const answer = document.querySelector('#vocabularyAnswer');
  const actions = document.querySelector('#vocabularyActions');
  const willReveal = answer.hidden;
  answer.hidden = !willReveal;
  actions.hidden = !willReveal;
  event.currentTarget.setAttribute('aria-expanded', String(willReveal));
  event.currentTarget.textContent = willReveal ? 'Ẩn nghĩa & ví dụ' : 'Hiện nghĩa & ví dụ';
});
document.querySelector('#speakVocabulary').addEventListener('click', (event) => playWithOpenVox(event.currentTarget.dataset.text,event.currentTarget.dataset.lang));
document.querySelector('#reviewVocabulary').addEventListener('click', () => { const deck=knowledgeContent.vocabulary[knowledgeLanguage]; const item=deck[vocabularyIndex%deck.length]; toggleListItem('knownVocabulary',item.id,false); toggleListItem('reviewVocabulary',item.id,true); knowledgeProgress.attempts+=1; saveKnowledgeProgress(); vocabularyIndex=(vocabularyIndex+1)%deck.length; renderKnowledge(); showToast('Đã đưa từ này vào lượt ôn.'); });
document.querySelector('#knowVocabulary').addEventListener('click', () => { const deck=knowledgeContent.vocabulary[knowledgeLanguage]; const item=deck[vocabularyIndex%deck.length]; toggleListItem('knownVocabulary',item.id,true); toggleListItem('reviewVocabulary',item.id,false); knowledgeProgress.attempts+=1; saveKnowledgeProgress(); vocabularyIndex=(vocabularyIndex+1)%deck.length; renderKnowledge(); showToast('Đã ghi nhận từ bạn nhớ.'); });
document.querySelector('#nextGrammar').addEventListener('click', () => { grammarIndex=(grammarIndex+1)%knowledgeContent.grammar[knowledgeLanguage].length; renderGrammarCard(); });
renderKnowledge();

function showToast(message) {
  toast.textContent = message; toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2800);
}
const lessonContent = {
  'english-listen': {title:'Small talk, big confidence', description:'Nghe đoạn hội thoại ngắn và bắt nhịp câu trả lời tự nhiên.', prompt:'“Hey, how is your week going?” — “It’s going well. I’ve been learning something new every day.”', speech:'Hey, how is your week going? It’s going well. I’ve been learning something new every day.', lang:'en-US', mode:'listen'},
  'chinese-speak': {title:'介绍自己 — Giới thiệu bản thân', description:'Nghe mẫu, bắt chước thanh điệu và ghi âm câu giới thiệu.', prompt:'“你好！我叫 Minh。我来自越南。”', speech:'你好！我叫 Minh。我来自越南。', lang:'zh-CN', mode:'speak'},
  'mixed-read': {title:'The little things that matter', description:'Đọc đoạn ngắn, tìm ý chính và kiểm tra mức hiểu.', prompt:'“Small habits become powerful when we repeat them. Ten focused minutes today can change the confidence we feel tomorrow.”', speech:'Small habits become powerful when we repeat them. Ten focused minutes today can change the confidence we feel tomorrow.', lang:'en-US', mode:'read', question:'What can ten focused minutes change?', answer:'confidence'}
};
function loadLesson(id = 'english-listen') {
  activeLesson = id; const lesson = lessonContent[id] || lessonContent['english-listen'];
  sessionTitle.textContent = lesson.title; sessionDescription.textContent = lesson.description; promptText.textContent = lesson.prompt;
  readingCheck.hidden = lesson.mode !== 'read'; if (lesson.mode === 'read') readingQuestion.textContent = lesson.question;
  document.querySelectorAll('.practice-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === lesson.mode));
  speechStatus.textContent = lesson.mode === 'read' ? 'Đọc đoạn văn rồi trả lời câu hỏi.' : 'Sẵn sàng luyện nói';
}
function speak(text, lang = 'en-US') {
  if (!('speechSynthesis' in window)) return showToast('Trình duyệt chưa hỗ trợ phát audio.');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text); utterance.lang = lang; utterance.rate = .88;
  window.speechSynthesis.speak(utterance); speechStatus.textContent = 'Đang phát audio mẫu...';
  utterance.onend = () => { speechStatus.textContent = 'Bạn hãy thử nói lại câu này.'; };
}
async function playWithOpenVox(text, lang) {
  try {
    const response = await fetch('/api/voice', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text, language:lang})});
    if (!response.ok) throw new Error('OpenVox unavailable');
    const blob = await response.blob();
    if (openvoxAudio) { openvoxAudio.pause(); URL.revokeObjectURL(openvoxAudio.src); }
    openvoxAudio = new Audio(URL.createObjectURL(blob)); speechStatus.textContent = 'OpenVox đang phát giọng mẫu local...';
    await openvoxAudio.play(); openvoxAudio.onended = () => { speechStatus.textContent = 'Bạn hãy thử nói lại câu này.'; };
  } catch { speak(text, lang); showToast('OpenVox chưa sẵn sàng — đã dùng giọng đọc trình duyệt.'); }
}
document.querySelectorAll('[data-start]').forEach((button) => button.addEventListener('click', () => {
  loadLesson(button.dataset.lesson); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
}));
document.querySelector('#closeModal').addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); });
modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('open'); });
document.querySelector('#beginSession').addEventListener('click', () => {
  savedProgress.sessions += 1; savedProgress.minutes += 15; localStorage.setItem(progressKey, JSON.stringify(savedProgress));
  renderProgress(); modal.classList.remove('open'); showToast('Đã ghi nhận phiên học — cố lên, Minh!');
});
document.querySelector('#playPrompt').addEventListener('click', () => { const lesson = lessonContent[activeLesson]; playWithOpenVox(lesson.speech, lesson.lang); });

let recognition;
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {
  recognition = new Recognition(); recognition.lang = 'en-US'; recognition.interimResults = false;
  recognition.onstart = () => { speechStatus.textContent = 'Đang nghe bạn nói...'; document.querySelector('#recordPrompt').classList.add('recording'); };
  recognition.onresult = (event) => { const transcript = event.results[0][0].transcript; speechStatus.textContent = `Bạn nói: “${transcript}”`; showToast('Đã nhận diện giọng nói.'); };
  recognition.onerror = () => { speechStatus.textContent = 'Không nhận diện được. Hãy thử lại ở nơi yên tĩnh.'; };
  recognition.onend = () => document.querySelector('#recordPrompt').classList.remove('recording');
}
document.querySelector('#recordPrompt').addEventListener('click', () => {
  if (!recognition) return showToast('Trình duyệt này chưa hỗ trợ ghi âm trực tiếp.'); recognition.lang = lessonContent[activeLesson].lang; recognition.start();
});
document.querySelectorAll('.practice-tab').forEach((tab) => tab.addEventListener('click', () => {
  const lesson = lessonContent[activeLesson];
  if (tab.dataset.mode === 'read') { readingCheck.hidden = false; speechStatus.textContent = 'Đọc đoạn văn rồi trả lời câu hỏi.'; }
  else { readingCheck.hidden = true; speechStatus.textContent = tab.dataset.mode === 'listen' ? 'Bấm “Nghe mẫu” để bắt đầu.' : 'Bấm “Ghi âm” rồi nói lại câu mẫu.'; }
  document.querySelectorAll('.practice-tab').forEach((item) => item.classList.toggle('active', item === tab));
  if (tab.dataset.mode === 'listen') playWithOpenVox(lesson.speech, lesson.lang);
}));
document.querySelector('#checkAnswer').addEventListener('click', () => {
  const answer = readingAnswer.value.trim().toLowerCase();
  if (!answer) return showToast('Viết một câu trả lời trước nhé.');
  const correct = answer.includes(lessonContent[activeLesson].answer);
  speechStatus.textContent = correct ? 'Chính xác! Bạn đã nắm được ý chính.' : 'Gần đúng. Gợi ý: confidence / sự tự tin.';
  showToast(correct ? 'Đúng rồi — +10 XP' : 'Hãy đọc lại đoạn văn một lần nữa.');
});

const fallbackResponses = ['Tuyệt vời! Hãy nói 3 câu bằng tiếng Anh về kế hoạch ngày mai nhé. Mình sẽ sửa ngữ pháp sau.', '很好! Hãy thử nói: “我叫 Minh，我来自越南。” Mình sẽ giúp bạn sửa thanh điệu.', 'Mình đề xuất bắt đầu bằng 5 phút nói. Hãy chọn một chủ đề: công việc, du lịch hoặc gia đình.'];
async function sendCoachMessage(text = coachInput.value.trim()) {
  if (!text) return; coachInput.value = ''; coachReply.hidden = false; coachReply.textContent = 'Coach đang suy nghĩ...';
  try {
    const response = await fetch('/api/coach', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:text, language:text.includes('中文') ? 'zh' : 'en'})});
    if (!response.ok) throw new Error('coach unavailable'); const data = await response.json(); coachReply.textContent = data.reply;
  } catch { window.setTimeout(() => { coachReply.textContent = text.includes('中文') ? fallbackResponses[1] : fallbackResponses[Math.floor(Math.random() * 2)]; }, 350); }
}
document.querySelector('#sendCoach').addEventListener('click', () => sendCoachMessage());
coachInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') sendCoachMessage(); });
document.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => sendCoachMessage(button.dataset.prompt)));
document.querySelector('#generateLesson').addEventListener('click', async () => {
  coachReply.hidden = false; coachReply.textContent = 'AI đang thiết kế bài 10 phút cho bạn...';
  try { const response = await fetch('/api/lesson', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({language:'en', goal:'speaking'})}); if (!response.ok) throw new Error('lesson unavailable'); const lesson = await response.json(); coachReply.textContent = `${lesson.title}: ${lesson.prompt} ${lesson.tip}`; }
  catch { coachReply.textContent = 'A better day: Say three sentences about your day. Nghe mẫu, nói lại, rồi tự sửa một lỗi.'; }
});
document.querySelector('.search-btn').addEventListener('click', () => showToast('Tìm kiếm bài học sẽ có trong bản V1.'));
document.querySelector('.notification').addEventListener('click', () => showToast('Bạn đã hoàn thành 2 bài học hôm nay.'));

function renderTeacherRequirements(result) {
  document.querySelector('#assessmentLevel').textContent = `Ước lượng Level ${result.estimatedLevel} · ${result.overall}/100 · chưa xác minh`;
  const list = document.querySelector('#teacherRequirements');
  list.replaceChildren();
  for (const requirement of result.plan.requirements.slice(0, 3)) {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = `${requirement.title} · ${requirement.minutes} phút`;
    const detail = document.createElement('span');
    detail.textContent = ` — ${requirement.successCriterion}`;
    item.append(title, detail); list.append(item);
  }
  document.querySelector('#aiProviderStatus').textContent = `Giáo viên: ${result.plan.provider} · ${result.plan.nextCheckpoint}`;
  localStorage.setItem('lingopilot-last-assessment', JSON.stringify(result));
}
function renderAssessmentQuestion() {
  const question = activeAssessment.questions[assessmentIndex];
  selectedAssessmentAnswer = undefined;
  document.querySelector('#assessmentStep').textContent = `Câu ${assessmentIndex + 1} / ${activeAssessment.questions.length}`;
  document.querySelector('#assessmentProgress').style.width = `${((assessmentIndex + 1) / activeAssessment.questions.length) * 100}%`;
  document.querySelector('#assessmentKind').textContent = activeAssessment.kind === 'placement' ? 'PLACEMENT TEST' : 'STAGE CHECKPOINT';
  document.querySelector('#assessmentTitle').textContent = `${activeAssessment.kind === 'placement' ? 'Kiểm tra đầu vào' : 'Kiểm tra giai đoạn'} ${activeAssessment.language === 'zh' ? '中文' : 'English'}`;
  document.querySelector('#assessmentPrompt').textContent = question.prompt;
  document.querySelector('#assessmentNotice').textContent = activeAssessment.notice;
  const listen = document.querySelector('#listenAssessment');
  listen.hidden = question.type !== 'listening'; listen.dataset.text = question.audioText || '';
  assessmentChoices.replaceChildren(); assessmentOpenAnswer.value = '';
  assessmentOpenAnswer.hidden = question.type !== 'open';
  if (question.choices) question.choices.forEach((choice, index) => {
    const button = document.createElement('button'); button.className = 'assessment-choice'; button.textContent = choice;
    button.addEventListener('click', () => { selectedAssessmentAnswer = index; assessmentChoices.querySelectorAll('button').forEach((item) => item.classList.toggle('selected', item === button)); });
    assessmentChoices.append(button);
  });
  const next = document.querySelector('#nextAssessment'); delete next.dataset.action; next.disabled = false; next.textContent = assessmentIndex === activeAssessment.questions.length - 1 ? 'Nộp bài và nhận kế hoạch →' : 'Câu tiếp theo →';
}
async function startAssessment(language, kind) {
  try {
    const response = await fetch('/api/assessment/start', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language,kind})});
    if (!response.ok) throw new Error('assessment unavailable');
    activeAssessment = await response.json(); assessmentIndex = 0; assessmentAnswers.length = 0;
    renderAssessmentQuestion(); assessmentModal.classList.add('open'); assessmentModal.setAttribute('aria-hidden','false');
  } catch { showToast('Chưa tải được bài kiểm tra. Hãy thử lại.'); }
}
async function submitAssessment() {
  const next = document.querySelector('#nextAssessment'); next.disabled = true; next.textContent = 'AI giáo viên đang phân tích...';
  try {
    const response = await fetch('/api/assessment/submit', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:activeAssessment.language,kind:activeAssessment.kind,goal:'Đạt Level 7 bằng bằng chứng nghe, đọc và nói trong lộ trình 90 ngày',answers:assessmentAnswers})});
    if (!response.ok) throw new Error('submit unavailable'); const result = await response.json(); renderTeacherRequirements(result);
    assessmentChoices.replaceChildren(); assessmentOpenAnswer.hidden = true; document.querySelector('#listenAssessment').hidden = true;
    document.querySelector('#assessmentStep').textContent = 'Hoàn thành'; document.querySelector('#assessmentProgress').style.width = '100%';
    document.querySelector('#assessmentTitle').textContent = result.plan.summary; document.querySelector('#assessmentPrompt').textContent = 'Kế hoạch bắt buộc tiếp theo đã được cập nhật trên dashboard.';
    const resultBox = document.createElement('div'); resultBox.className = 'assessment-result';
    const score = document.createElement('strong'); score.textContent = `${result.overall}/100 · ước lượng Level ${result.estimatedLevel} · chưa xác minh`; resultBox.append(score);
    for (const [skill,value] of Object.entries(result.skills)) { const row=document.createElement('div'); row.className='skill-score'; const label=document.createElement('span'); label.textContent={listening:'Nghe',reading:'Đọc',speaking:'Nói'}[skill]; const number=document.createElement('b'); number.textContent=`${value}%`; row.append(label,number); resultBox.append(row); }
    assessmentChoices.append(resultBox); document.querySelector('#assessmentNotice').textContent = result.plan.promotionRule;
    next.disabled = false; next.dataset.action = 'close'; next.textContent = 'Đóng và bắt đầu kế hoạch';
  } catch { next.disabled = false; next.textContent = 'Thử nộp lại'; showToast('Chưa phân tích được kết quả. Dữ liệu vẫn còn trong màn hình.'); }
}
document.querySelectorAll('.assessment-start').forEach((button) => button.addEventListener('click', () => startAssessment(button.dataset.language,button.dataset.kind)));
document.querySelector('#closeAssessment').addEventListener('click', () => { assessmentModal.classList.remove('open'); assessmentModal.setAttribute('aria-hidden','true'); });
assessmentModal.addEventListener('click', (event) => { if (event.target === assessmentModal) assessmentModal.classList.remove('open'); });
document.querySelector('#listenAssessment').addEventListener('click', (event) => playWithOpenVox(event.currentTarget.dataset.text,activeAssessment.language === 'zh' ? 'zh-CN' : 'en-US'));
document.querySelector('#nextAssessment').addEventListener('click', async () => {
  if (document.querySelector('#nextAssessment').dataset.action === 'close') { assessmentModal.classList.remove('open'); assessmentModal.setAttribute('aria-hidden','true'); document.querySelector('#assessment').scrollIntoView({behavior:'smooth'}); return; }
  if (!activeAssessment) return; const question = activeAssessment.questions[assessmentIndex]; const answer = question.type === 'open' ? assessmentOpenAnswer.value.trim() : selectedAssessmentAnswer;
  if (answer === '' || answer === undefined) return showToast('Hãy trả lời câu hỏi trước khi tiếp tục.');
  assessmentAnswers.push({id:question.id,answer});
  if (assessmentIndex < activeAssessment.questions.length - 1) { assessmentIndex += 1; renderAssessmentQuestion(); } else await submitAssessment();
});
try { const prior=JSON.parse(localStorage.getItem('lingopilot-last-assessment')||'null'); if(prior) renderTeacherRequirements(prior); } catch {}
fetch('/api/ai/status').then((response)=>response.json()).then((status)=>{ document.querySelector('#aiProviderStatus').textContent=status.configured?`Giáo viên AI: ${status.active} (key chỉ ở server)`:'Chế độ demo · thêm GEMINI_API_KEY hoặc DEEPSEEK_API_KEY ở server'; }).catch(()=>{});
