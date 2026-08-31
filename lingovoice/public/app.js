/* LingoVoice frontend — voice-driven language learning */
'use strict';

/* ---------- Dữ liệu bài học ---------- */
const LESSONS = {
  en: [
    {
      topic: 'Chào hỏi',
      sentences: [
        { id: 'en-greet-1', text: "Good morning! How are you today?", vi: "Chào buổi sáng! Hôm nay bạn thế nào?" },
        { id: 'en-greet-2', text: "I'm fine, thank you. And you?", vi: "Tôi khỏe, cảm ơn. Còn bạn?" },
        { id: 'en-greet-3', text: "Nice to meet you.", vi: "Rất vui được gặp bạn." }
      ]
    },
    {
      topic: 'Cuộc sống hằng ngày',
      sentences: [
        { id: 'en-life-1', text: "I usually have breakfast at seven.", vi: "Tôi thường ăn sáng lúc bảy giờ." },
        { id: 'en-life-2', text: "She goes to work by bus.", vi: "Cô ấy đi làm bằng xe buýt." },
        { id: 'en-life-3', text: "I feel more confident when I practise every day.", vi: "Tôi tự tin hơn khi luyện tập mỗi ngày." }
      ]
    },
    {
      topic: 'Du lịch',
      sentences: [
        { id: 'en-travel-1', text: "Where is the train station?", vi: "Ga tàu ở đâu?" },
        { id: 'en-travel-2', text: "I'd like a ticket to Hanoi, please.", vi: "Tôi muốn một vé đi Hà Nội." },
        { id: 'en-travel-3', text: "How much does this cost?", vi: "Cái này giá bao nhiêu?" }
      ]
    },
    {
      topic: 'Công việc & học tập',
      sentences: [
        { id: 'en-work-1', text: "I have a meeting at ten o'clock.", vi: "Tôi có cuộc họp lúc mười giờ." },
        { id: 'en-work-2', text: "Could you explain that idea again?", vi: "Bạn có thể giải thích lại ý đó không?" },
        { id: 'en-work-3', text: "I'm learning Chinese this year.", vi: "Năm nay tôi đang học tiếng Trung." }
      ]
    },
    {
      topic: 'Quan điểm',
      sentences: [
        { id: 'en-opin-1', text: "I think this is a good idea.", vi: "Tôi nghĩ đây là một ý kiến hay." },
        { id: 'en-opin-2', text: "In my opinion, practice makes perfect.", vi: "Theo tôi, luyện tập tạo nên sự hoàn hảo." },
        { id: 'en-opin-3', text: "I agree with you completely.", vi: "Tôi hoàn toàn đồng ý với bạn." }
      ]
    }
  ],
  zh: [
    {
      topic: '问候 · Chào hỏi',
      sentences: [
        { id: 'zh-greet-1', text: "你好！你叫什么名字？", pinyin: "nǐ hǎo! nǐ jiào shénme míngzi?", vi: "Xin chào! Bạn tên là gì?" },
        { id: 'zh-greet-2', text: "我很好，谢谢。你呢？", pinyin: "wǒ hěn hǎo, xièxie. nǐ ne?", vi: "Tôi khỏe, cảm ơn. Còn bạn?" },
        { id: 'zh-greet-3', text: "很高兴认识你。", pinyin: "hěn gāoxìng rènshi nǐ", vi: "Rất vui được quen bạn." }
      ]
    },
    {
      topic: '日常生活 · Cuộc sống',
      sentences: [
        { id: 'zh-life-1', text: "我每天早上七点吃早饭。", pinyin: "wǒ měitiān zǎoshang qī diǎn chī zǎofàn", vi: "Tôi ăn sáng lúc bảy giờ mỗi ngày." },
        { id: 'zh-life-2', text: "她坐公交车上班。", pinyin: "tā zuò gōngjiāochē shàngbān", vi: "Cô ấy đi làm bằng xe buýt." },
        { id: 'zh-life-3', text: "我每天坚持学习中文。", pinyin: "wǒ měitiān jiānchí xuéxí zhōngwén", vi: "Tôi kiên trì học tiếng Trung mỗi ngày." }
      ]
    },
    {
      topic: '旅行 · Du lịch',
      sentences: [
        { id: 'zh-travel-1', text: "火车站在哪里？", pinyin: "huǒchēzhàn zài nǎlǐ?", vi: "Ga tàu ở đâu?" },
        { id: 'zh-travel-2', text: "我要买一张去河内的票。", pinyin: "wǒ yào mǎi yì zhāng qù hénèi de piào", vi: "Tôi muốn mua một vé đi Hà Nội." },
        { id: 'zh-travel-3', text: "这个多少钱？", pinyin: "zhège duōshao qián?", vi: "Cái này bao nhiêu tiền?" }
      ]
    },
    {
      topic: '工作学习 · Công việc',
      sentences: [
        { id: 'zh-work-1', text: "我十点有个会议。", pinyin: "wǒ shí diǎn yǒu ge huìyì", vi: "Tôi có cuộc họp lúc mười giờ." },
        { id: 'zh-work-2', text: "请你再说一遍。", pinyin: "qǐng nǐ zài shuō yí biàn", vi: "Bạn làm ơn nói lại lần nữa." },
        { id: 'zh-work-3', text: "我想学中文。", pinyin: "wǒ xiǎng xué zhōngwén", vi: "Tôi muốn học tiếng Trung." }
      ]
    },
    {
      topic: '意见 · Quan điểm',
      sentences: [
        { id: 'zh-opin-1', text: "我觉得这是个好主意。", pinyin: "wǒ juéde zhè shì ge hǎo zhǔyì", vi: "Tôi nghĩ đây là một ý kiến hay." },
        { id: 'zh-opin-2', text: "我认为熟能生巧。", pinyin: "wǒ rènwéi shú néng shēng qiǎo", vi: "Tôi cho rằng luyện tập tạo nên sự thành thạo." },
        { id: 'zh-opin-3', text: "我完全同意你。", pinyin: "wǒ wánquán tóngyì nǐ", vi: "Tôi hoàn toàn đồng ý với bạn." }
      ]
    }
  ]
};

const LANG_LABEL = { en: 'English', zh: '中文', vi: 'Tiếng Việt' };
const SPEECH_LANG = { en: 'en-US', zh: 'zh-CN', vi: 'vi-VN' };
const TEACHER_PROFILE_KEY = 'lv-teacher-profile';
const TEACHER_PERSONALITIES = ['warm', 'strict', 'energetic'];
// Profile mặc định của Cô Linh — khớp voice design OpenVox co-linh-v2-natural.
const DEFAULT_TEACHER_PROFILE = { personality: 'warm', voices: { en: 'F4', zh: 'zf_xiaoxiao' }, speed: 0.9 };

function normalizeTeacherProfile(value = {}) {
  const personality = TEACHER_PERSONALITIES.includes(value.personality) ? value.personality : 'warm';
  const voices = {};
  for (const lang of ['en', 'zh']) {
    const voice = value.voices?.[lang];
    voices[lang] = typeof voice === 'string' && /^[\w.-]{1,80}$/.test(voice)
      ? voice
      : DEFAULT_TEACHER_PROFILE.voices[lang];
  }
  const speedValue = Number(value.speed);
  const speed = Number.isFinite(speedValue) ? Math.min(1.15, Math.max(0.75, speedValue)) : DEFAULT_TEACHER_PROFILE.speed;
  return { personality, voices, speed };
}

function getTeacherProfile() {
  try { return normalizeTeacherProfile(JSON.parse(localStorage.getItem(TEACHER_PROFILE_KEY) || '{}')); }
  catch { return { ...DEFAULT_TEACHER_PROFILE, voices: { ...DEFAULT_TEACHER_PROFILE.voices } }; }
}

function saveTeacherProfile(value) {
  const profile = normalizeTeacherProfile(value);
  localStorage.setItem(TEACHER_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

/* ---------- State ---------- */
let language = 'en';
let topicIndex = 0;
let voiceState = { available: true, degraded: false, mode: 'prepared-only', prepared: 0, statusText: '' };
let activeAudio = null;
let playingKey = null; // key định danh câu đang phát
let quiz = { sentence: null, options: [], correct: 0, total: 0, answered: false };
let quizRound = { done: 0, correct: 0, heard: [] };
const QUIZ_LEN = 5; // độ dài một bài luyện nghe (Focus Lesson Mode)
let progress = loadProgress();

function loadProgress() {
  const key = 'lingovoice-progress';
  try {
    return Object.assign({ known: [], quiz: { correct: 0, total: 0 }, listened: [] },
      JSON.parse(localStorage.getItem(key) || '{}'));
  } catch { return { known: [], quiz: { correct: 0, total: 0 }, listened: [] }; }
}
function saveProgress() {
  localStorage.setItem('lingovoice-progress', JSON.stringify(progress));
}

/* ---------- DOM helpers ---------- */
const $ = (sel) => document.querySelector(sel);

function allSentences(lang) {
  return LESSONS[lang].flatMap((t) => t.sentences.map((s) => ({ ...s, lang })));
}
function sentenceById(lang, id) {
  return allSentences(lang).find((s) => s.id === id);
}

/* ---------- Voice playback ---------- */
let currentAudioEl = null;

function showMiniPlayer(text) {
  const el = $('#miniPlayer');
  $('#miniPlayerText').textContent = text;
  el.hidden = false;
  clearTimeout(showMiniPlayer._t);
  showMiniPlayer._t = setTimeout(() => { el.hidden = true; }, 3600);
}

// Trả về Promise resolve khi phát xong (hoặc lỗi) để cho phép phát tuần tự.
// Chỉ lấy WAV đã được admin chuẩn bị. Thiếu file thì fallback giọng thiết bị,
// tuyệt đối không kích hoạt job sinh audio trong luồng người học.
function playText(text, lang, opts = {}) {
  stopAudio();
  const key = opts.key || null;
  playingKey = key;
  setPlayingState(key, true);

  const finish = () => setPlayingState(key, false);
  const browserFallback = (resolve, message = 'Đang dùng giọng đọc trên thiết bị.') => {
    if (!('speechSynthesis' in window)) { toast('Không có giọng đọc khả dụng.', true); finish(); resolve(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH_LANG[lang];
    const teacherProfile = opts.teacherVoice ? getTeacherProfile() : null;
    u.rate = Number(opts.speed || teacherProfile?.speed || 0.9);
    u.onend = () => { finish(); resolve(); };
    u.onerror = () => { finish(); resolve(); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    if (opts.announceFallback !== false) toast(message, true);
  };

  return new Promise((resolve) => {
    if (voiceState.available) {
      const teacherProfile = opts.teacherVoice ? getTeacherProfile() : null;
      fetch(opts.teacherVoice ? '/api/voice/teacher' : '/api/voice/prepared', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: lang,
          voice: opts.voice || teacherProfile?.voices?.[lang] || undefined,
          speed: opts.speed || teacherProfile?.speed || undefined
        })
        })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw Object.assign(new Error('voice unavailable'), { code: data.code, status: res.status });
          }
          const blob = await res.blob();
          if (!blob.size) throw new Error('empty audio');
          playBlob(blob, lang, finish, resolve);
        })
        .catch((error) => {
          if (error.code === 'AUDIO_NOT_PREPARED') {
            browserFallback(resolve, 'Audio này chưa được chuẩn bị — đang dùng giọng trên thiết bị.');
            return;
          }
          setVoiceDegraded(true);
          browserFallback(resolve, 'Không tải được kho audio — đang dùng giọng trên thiết bị.');
        });
    } else {
      browserFallback(resolve);
    }
  });
}

// Phát full WAV (cache) qua HTMLAudioElement
function playBlob(blob, lang, finish, resolve) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudioEl = audio;
  const cleanup = () => { finish(); URL.revokeObjectURL(url); resolve(); };
  audio.onended = cleanup;
  audio.onerror = cleanup;
  audio.play().then(() => showMiniPlayer(`Đang phát (${LANG_LABEL[lang]})…`)).catch(cleanup);
}

// ---- Web Audio: phát tăng dần từng chunk WAV (streaming) ----
let audioCtx = null;
const activeSources = new Set();

async function playStreamBody(stream, lang, finish, resolve) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  try { await audioCtx.resume(); } catch {}
  const reader = stream.getReader();
  let nextStart = audioCtx.currentTime + 0.05;
  let done = false;
  showMiniPlayer(`Đang phát (${LANG_LABEL[lang]}, streaming)…`);
  try {
    while (true) {
      const { done: d, value } = await reader.read();
      if (d) break;
      if (!value) continue;
      const ab = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
      try {
        const decoded = await audioCtx.decodeAudioData(ab);
        if (nextStart < audioCtx.currentTime) nextStart = audioCtx.currentTime + 0.02;
        const src = audioCtx.createBufferSource();
        src.buffer = decoded;
        src.connect(audioCtx.destination);
        src.start(nextStart);
        nextStart += decoded.duration;
        activeSources.add(src);
        src.onended = () => activeSources.delete(src);
      } catch { /* chunk không decode được -> bỏ qua */ }
    }
  } catch { /* đọc stream lỗi */ }
  try { reader.releaseLock(); } catch {}
  const wait = Math.max(300, (nextStart - audioCtx.currentTime) * 1000 + 200);
  setTimeout(() => { if (!done) { done = true; finish(); resolve(); } }, wait);
}

function stopAudio() {
  if (currentAudioEl) { currentAudioEl.pause(); currentAudioEl = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  activeSources.forEach((s) => { try { s.stop(); } catch {} });
  activeSources.clear();
  if (audioCtx && audioCtx.state !== 'closed') { try { audioCtx.suspend(); } catch {} }
  if (playingKey) setPlayingState(playingKey, false);
  playingKey = null;
}

function setVoiceDegraded(degraded) {
  if (voiceState.degraded === degraded) return;
  voiceState.degraded = degraded;
  renderVoiceStatus();
}

function setPlayingState(key, playing) {
  if (!key) return;
  document.querySelectorAll(`[data-key="${CSS.escape(key)}"]`).forEach((el) => {
    el.classList.toggle('playing', playing);
    if (playing) el.setAttribute('aria-label', 'Đang phát…');
    else el.setAttribute('aria-label', el.dataset.label || 'Nghe');
  });
}

/* ---------- Voice status ---------- */
// Mobile thu gọn chip thành chấm 48px (chữ ẩn cho screen reader) — nên phải gắn
// tooltip + aria-label + bấm vào hiện toast, người dùng mới hiểu chấm màu nghĩa là gì.
function renderVoiceStatus() {
  const el = $('#voiceStatus');
  const text = el.querySelector('.status-text');
  el.classList.remove('ok', 'degraded', 'broken');
  let message = '';
  if (voiceState.degraded) {
    el.classList.add('degraded');
    message = 'Kho audio gián đoạn · có giọng thiết bị';
  } else if (voiceState.available) {
    el.classList.add('ok');
    message = `Audio tạo sẵn · ${voiceState.prepared} mục`;
  } else {
    el.classList.add('broken');
    message = 'Chưa có giọng đọc';
  }
  text.textContent = message;
  el.title = message;
  el.setAttribute('aria-label', `Trạng thái âm thanh: ${message}. Chạm để đọc lại.`);
  voiceState.statusText = message;
}

async function initVoice() {
  $('#voiceStatus')?.addEventListener('click', () => {
    if (voiceState.statusText) toast(voiceState.statusText, voiceState.degraded);
  });
  try {
    const res = await fetch('/api/voice/status');
    const data = await res.json();
    voiceState.mode = data.deliveryMode || 'prepared-only';
    voiceState.prepared = Number(data.prepared?.available || 0);
    voiceState.available = voiceState.mode === 'prepared-only' || Boolean(data.available);
    renderVoiceStatus();
    if (voiceState.available) {
      toast(`Kho audio tạo sẵn: ${voiceState.prepared} mục sẵn sàng.`);
    } else {
      toast('Không thấy OpenVox — sẽ dùng giọng trình duyệt.', true);
    }
  } catch {
    voiceState.available = false;
    renderVoiceStatus();
  }
}

/* ---------- Toast ---------- */
function toast(message, warn = false) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.toggle('warn', warn);
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- Lessons rendering ---------- */
function renderTopicTabs() {
  const tabs = $('#topicTabs');
  tabs.replaceChildren();
  LESSONS[language].forEach((topic, i) => {
    const b = document.createElement('button');
    b.role = 'tab';
    b.type = 'button';
    b.setAttribute('aria-selected', String(i === topicIndex));
    b.textContent = topic.topic;
    b.addEventListener('click', () => { topicIndex = i; renderTopicTabs(); renderSentences(); updateTeacherContext(); });
    tabs.append(b);
  });
}

function renderSentences() {
  const topic = LESSONS[language][topicIndex];
  const list = $('#sentenceList');
  list.replaceChildren();
  topic.sentences.forEach((s) => {
    const li = document.createElement('li');
    const key = `${language}:${s.id}`;

    const main = document.createElement('div');
    main.className = 'sentence-main';
    const text = document.createElement('div');
    text.className = 'sentence-text';
    text.textContent = s.text;
    main.append(text);
    if (s.pinyin) {
      const py = document.createElement('div');
      py.className = 'sentence-pinyin';
      py.textContent = s.pinyin;
      main.append(py);
    }
    const trans = document.createElement('div');
    trans.className = 'sentence-translation hidden';
    trans.textContent = '◷ ' + s.vi;
    main.append(trans);

    const actions = document.createElement('div');
    actions.className = 'sentence-actions';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'icon-btn';
    playBtn.dataset.key = key;
    playBtn.dataset.label = 'Nghe';
    playBtn.setAttribute('aria-label', `Nghe: ${s.text}`);
    playBtn.innerHTML = svgIcon('play');
    playBtn.addEventListener('click', () => {
      trans.classList.toggle('hidden');
      playText(s.text, language, { key });
      setTeacherLastSentence(s);
      if (progress.listened.indexOf(s.id) === -1) { progress.listened.push(s.id); saveProgress(); }
      renderProgress();
    });

    const knownBtn = document.createElement('button');
    knownBtn.type = 'button';
    knownBtn.className = 'icon-btn' + (progress.known.includes(s.id) ? ' known' : '');
    knownBtn.dataset.label = 'Đánh dấu đã nhớ';
    knownBtn.setAttribute('aria-label', knownBtn.classList.contains('known') ? 'Bỏ đánh dấu đã nhớ' : 'Đánh dấu đã nhớ');
    knownBtn.innerHTML = svgIcon('check');
    knownBtn.addEventListener('click', () => {
      const idx = progress.known.indexOf(s.id);
      if (idx === -1) { progress.known.push(s.id); knownBtn.classList.add('known'); knownBtn.setAttribute('aria-label', 'Bỏ đánh dấu đã nhớ'); }
      else { progress.known.splice(idx, 1); knownBtn.classList.remove('known'); knownBtn.setAttribute('aria-label', 'Đánh dấu đã nhớ'); }
      saveProgress();
      renderProgress();
    });

    actions.append(playBtn, knownBtn);
    li.append(main, actions);
    list.append(li);
  });
}

function svgIcon(name) {
  if (name === 'play') return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  if (name === 'check') return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>';
  return '';
}

/* ---------- Progress ---------- */
function renderProgress() {
  const known = progress.known.length;
  const heard = progress.listened.length;
  $('#heroProgress').innerHTML = `
    <div class="stat"><b>${known}</b><span>câu đã nhớ</span></div>
    <div class="stat"><b>${heard}</b><span>câu đã nghe</span></div>
    <div class="stat"><b>${progress.quiz.correct}</b><span>câu trả lời đúng</span></div>`;
  $('#quizScore').textContent = `${progress.quiz.correct}/${progress.quiz.total}`;
}

/* ---------- Listening quiz ---------- */
function startQuiz() {
  const all = allSentences(language);
  if (!all.length) return;
  const sentence = all[Math.floor(Math.random() * all.length)];
  const correct = sentence.vi;
  const distractors = all.filter((s) => s.vi !== correct).map((s) => s.vi);
  const options = shuffle([correct, ...pick(distractors, 3)]);

  quiz = { sentence, options, correct, answered: false };
  teacherState.lastSentence = sentence.text;
  teacherState.lastSentenceLang = language;
  updateTeacherContext();
  $('#quizText').textContent = sentence.text;
  $('#quizText').hidden = false;
  $('#quizPlay').hidden = false;
  $('#quizPlay').classList.remove('playing');
  $('#quizPlay').querySelector('span').textContent = 'Nghe lại câu';
  $('#quizChoices').hidden = false;
  $('#quizFeedback').textContent = '';
  $('#quizFeedback').className = 'quiz-feedback';
  $('#quizNext').hidden = true;

  const box = $('#quizChoices');
  box.replaceChildren();
  options.forEach((option) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = option;
    b.addEventListener('click', () => answerQuiz(b, option));
    box.append(b);
  });
  playText(sentence.text, language, { announceFallback: false });
}

function answerQuiz(btn, selected) {
  if (quiz.answered) return;
  quiz.answered = true;
  progress.quiz.total += 1;
  const isCorrect = selected === quiz.correct;
  if (isCorrect) progress.quiz.correct += 1;
  saveProgress();
  quizRound.done += 1;
  if (isCorrect) quizRound.correct += 1;
  quizRound.heard.push(quiz.sentence);

  $('#quizChoices').querySelectorAll('button').forEach((b) => {
    b.disabled = true;
    if (b.textContent === quiz.correct) b.classList.add('correct');
    else if (b === btn) b.classList.add('incorrect');
  });
  const fb = $('#quizFeedback');
  const explanation = quiz.sentence.vi ? ` (“${quiz.sentence.vi}”)` : '';
  fb.textContent = isCorrect
    ? `Đúng rồi! “${quiz.sentence.text}” = “${quiz.correct}”${explanation}`
    : `Chưa đúng. “${quiz.sentence.text}” = “${quiz.correct}”${explanation}`;
  fb.className = 'quiz-feedback ' + (isCorrect ? 'correct' : 'incorrect');
  const nextBtn = $('#quizNext');
  nextBtn.hidden = false;
  nextBtn.textContent = quizRound.done >= QUIZ_LEN ? 'Xem kết quả bài' : 'Câu tiếp theo →';
  delete nextBtn.dataset.action;
  renderProgress();
}

function handleQuizNext() {
  const btn = $('#quizNext');
  if (btn.dataset.action === 'finish') {
    // Kết thúc bài: thêm cụm đã nghe vào SRS để ôn
    quizRound.heard.forEach((s) => { try { window.srsRecord(s.id, language, 3); } catch {} });
    try { window.recordActivity(5, quizRound.heard.length); } catch {} // ghi nhận 5 phút luyện nghe
    quizRound = { done: 0, correct: 0, heard: [] };
    delete btn.dataset.action;
    btn.textContent = 'Câu tiếp theo →';
    startQuiz();
    return;
  }
  if (quizRound.done >= QUIZ_LEN) {
    const fb = $('#quizFeedback');
    fb.innerHTML = `Hoàn thành ${QUIZ_LEN} câu luyện nghe! Đúng <b>${quizRound.correct}/${quizRound.done}</b>. Các cụm đã nghe sẽ được thêm vào ôn tập.`;
    fb.className = 'quiz-feedback correct';
    btn.textContent = 'Ôn các cụm này + làm lại';
    btn.dataset.action = 'finish';
    btn.hidden = false;
    return;
  }
  startQuiz();
}

/* ---------- Utils ---------- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick(arr, n) { return shuffle(arr).slice(0, n); }

/* ---------- Giáo viên đồng hành ---------- */
const teacherState = { open: false, muted: false, lastSentence: null, lastSentenceLang: null, aiConfigured: null };

function teacherContext() {
  const topic = LESSONS[language][topicIndex];
  return {
    language,
    screen: quiz.sentence ? 'quiz' : 'lessons',
    topic: topic ? topic.topic : undefined,
    lastSentence: teacherState.lastSentence || undefined
  };
}

function updateTeacherContext() {
  const ctx = teacherContext();
  const label = LANG_LABEL[language];
  const screenLabel = ctx.screen === 'quiz' ? 'Luyện nghe' : 'Học & luyện tập';
  let text = `${label} · ${screenLabel}`;
  if (ctx.topic) text += ` · ${ctx.topic}`;
  if (ctx.lastSentence) text += ` — “${ctx.lastSentence}”`;
  $('#teacherContext').textContent = text;
}

function setTeacherLastSentence(s) {
  if (!s) return;
  teacherState.lastSentence = s.text;
  teacherState.lastSentenceLang = language;
  updateTeacherContext();
}

function setTeacherOpen(open) {
  teacherState.open = open;
  $('#teacherPanel').hidden = !open;
  $('#teacherBackdrop').hidden = !open;
  $('#teacherToggle').setAttribute('aria-expanded', String(open));
  if (open) {
    $('#teacherChat').scrollTop = $('#teacherChat').scrollHeight;
  } else {
    cancelTeacherSpeech();
    // trả focus về nút mở giáo viên (P0)
    $('#teacherToggle').focus();
  }
}

window.handleLingoVoiceBack = function handleLingoVoiceBack() {
  if (teacherState.open) {
    setTeacherOpen(false);
    return true;
  }
  const openModal = [...document.querySelectorAll('.modal')].find((modal) => modal.getAttribute('aria-hidden') === 'false');
  if (openModal) {
    openModal.setAttribute('aria-hidden', 'true');
    return true;
  }
  return false;
};

function appendTeacherMessage(role, text, opts = {}) {
  const chat = $('#teacherChat');
  const row = document.createElement('div');
  row.className = 'msg ' + (role === 'user' ? 'user' : 'teacher');
  const bubble = document.createElement('span');
  bubble.className = 'bubble';

  if (opts.thinking) {
    bubble.textContent = 'Cô đang suy nghĩ…';
    row.dataset.thinking = '1';
  } else if (opts.raw) {
    bubble.textContent = text;
  } else {
    // Tách các đoạn 【 câu mẫu 】 để hiển thị nút "Nghe"
    const parts = String(text).split(/【|】/);
    parts.forEach((part, i) => {
      if (i % 2 === 1) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'speak-chip';
        chip.dataset.label = 'Nghe câu mẫu';
        chip.setAttribute('aria-label', `Nghe câu mẫu: ${part}`);
        chip.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg> Nghe: ' + part;
        chip.addEventListener('click', () => playText(part, opts.lang || language, { announceFallback: false, teacherVoice: true }));
        bubble.appendChild(chip);
      } else if (part) {
        bubble.appendChild(document.createTextNode(part));
      }
    });
  }

  row.appendChild(bubble);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
  return row;
}

function removeThinking() {
  const chat = $('#teacherChat');
  chat.querySelectorAll('[data-thinking]').forEach((el) => el.remove());
}

async function sendTeacherMessage(text) {
  const msg = String(text || '').trim();
  if (!msg) return;
  appendTeacherMessage('user', msg, { raw: true });
  $('#teacherInput').value = '';
  setSendBusy(true);
  appendTeacherMessage('teacher', '', { thinking: true });
  try {
    const res = await fetch('/api/teacher/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, language, context: teacherContext(), assistantProfile: getTeacherProfile() })
    });
    const data = await res.json();
    removeThinking();
    if (!res.ok) {
      if (data.code === 'NO_AI') {
        appendTeacherMessage('teacher', 'Cô chưa thể trả lời tự nhiên vì chưa có khóa AI. Thêm DEEPSEEK_API_KEY vào lingovoice/.env rồi khởi động lại server nhé.', { raw: true });
      } else {
        appendTeacherMessage('teacher', data.error || 'Cô tạm thời không trả lời được, thử lại nhé.', { raw: true });
      }
      return;
    }
    appendTeacherMessage('teacher', data.reply, { lang: data.language || language });
    if (!teacherState.muted) speakTargetSegments(data.reply, data.language || language);
  } catch {
    removeThinking();
    appendTeacherMessage('teacher', 'Mất kết nối với máy chủ. Thử lại nhé.', { raw: true });
  } finally {
    setSendBusy(false);
  }
}

function setSendBusy(busy) {
  $('#teacherSend').disabled = busy;
  $('#teacherMic').disabled = busy;
  if (busy) $('#teacherSend').setAttribute('aria-label', 'Đang gửi');
  else $('#teacherSend').setAttribute('aria-label', 'Gửi');
}

/* ---------- Nhận giọng nói: Android native bridge + browser fallback ---------- */
const teacherSpeech = {
  active: false,
  usingNative: false,
  browser: null,
  draft: '',
  transcript: '',
  finalHandled: false
};

const SPEECH_ERROR_MESSAGES = {
  permission_denied: 'Cần quyền micro để nghe bạn. Hãy cấp quyền rồi thử lại.',
  no_match: 'Cô chưa nghe rõ. Bạn nói lại chậm hơn nhé.',
  speech_timeout: 'Cô chưa nghe thấy giọng nói. Bạn thử lại nhé.',
  network: 'Nhận giọng nói đang mất kết nối.',
  busy: 'Micro đang bận. Chờ một chút rồi thử lại.',
  rate_limited: 'Bạn đã thử quá nhanh. Chờ một chút nhé.',
  unavailable: 'Thiết bị chưa có dịch vụ nhận giọng nói.',
  audio: 'Không đọc được micro trên thiết bị.',
  server: 'Dịch vụ nhận giọng nói tạm thời chưa sẵn sàng.'
};

function setTeacherSpeechUi(active, message, state = 'listening') {
  teacherSpeech.active = active;
  const mic = $('#teacherMic');
  mic.setAttribute('aria-pressed', String(active));
  mic.setAttribute('aria-label', active ? 'Dừng nghe' : 'Nói với Cô Linh');
  if (message !== undefined) setCoLinhState(state, message);
}

function speechLanguage() {
  return language === 'zh' ? 'zh-CN' : 'en-US';
}

function startTeacherSpeech() {
  if (teacherSpeech.active) {
    stopTeacherSpeech();
    return;
  }
  teacherSpeech.draft = $('#teacherInput').value;
  teacherSpeech.transcript = '';
  teacherSpeech.finalHandled = false;
  setTeacherSpeechUi(true, 'Cô đang mở micro…');

  if (window.LingoVoiceSpeech && typeof window.LingoVoiceSpeech.postMessage === 'function') {
    teacherSpeech.usingNative = true;
    window.LingoVoiceSpeech.onmessage = handleNativeSpeechMessage;
    window.LingoVoiceSpeech.postMessage(JSON.stringify({ type: 'start', language: speechLanguage() }));
    return;
  }
  startBrowserSpeech();
}

function startBrowserSpeech() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    handleSpeechError('unavailable');
    return;
  }
  teacherSpeech.usingNative = false;
  const recognition = new Recognition();
  teacherSpeech.browser = recognition;
  recognition.lang = speechLanguage();
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => setTeacherSpeechUi(true, 'Cô đang nghe bạn nói…');
  recognition.onresult = (event) => {
    let transcript = '';
    let isFinal = false;
    for (let i = 0; i < event.results.length; i++) {
      transcript += `${event.results[i][0]?.transcript || ''} `;
      isFinal ||= event.results[i].isFinal;
    }
    updateSpeechTranscript(transcript.trim(), isFinal);
  };
  recognition.onerror = (event) => handleSpeechError({
    'not-allowed': 'permission_denied',
    'no-speech': 'speech_timeout',
    'audio-capture': 'audio',
    network: 'network',
    aborted: 'cancelled'
  }[event.error] || 'unknown');
  recognition.onend = () => {
    teacherSpeech.browser = null;
    if (teacherSpeech.active && !teacherSpeech.finalHandled) resetTeacherSpeechUi();
  };
  try { recognition.start(); }
  catch { handleSpeechError('busy'); }
}

function handleNativeSpeechMessage(event) {
  let payload;
  try { payload = JSON.parse(String(event.data || '{}')); }
  catch { handleSpeechError('unknown'); return; }
  if (payload.type === 'starting') setTeacherSpeechUi(true, 'Cô đang mở micro…');
  else if (payload.type === 'listening') setTeacherSpeechUi(true, 'Cô đang nghe bạn nói…');
  else if (payload.type === 'processing') setCoLinhState('thinking', 'Cô đang nhận dạng câu nói…');
  else if (payload.type === 'partial') updateSpeechTranscript(payload.transcript, false);
  else if (payload.type === 'result') updateSpeechTranscript(payload.transcript, true);
  else if (payload.type === 'error') {
    if (payload.code === 'unavailable' && (window.SpeechRecognition || window.webkitSpeechRecognition)) startBrowserSpeech();
    else handleSpeechError(payload.code);
  } else if (payload.type === 'end' && !teacherSpeech.finalHandled) resetTeacherSpeechUi();
}

function updateSpeechTranscript(value, isFinal) {
  const transcript = String(value || '').trim();
  if (!transcript) return;
  teacherSpeech.transcript = transcript;
  $('#teacherInput').value = transcript;
  if (!isFinal || teacherSpeech.finalHandled) return;
  teacherSpeech.finalHandled = true;
  resetTeacherSpeechUi(false);
  setCoLinhState('thinking', 'Cô đã nghe. Đang chuẩn bị trả lời…');
  sendTeacherMessage(transcript);
}

function stopTeacherSpeech() {
  if (!teacherSpeech.active) return;
  if (teacherSpeech.usingNative && window.LingoVoiceSpeech) {
    window.LingoVoiceSpeech.postMessage(JSON.stringify({ type: 'stop' }));
  } else if (teacherSpeech.browser) {
    teacherSpeech.browser.stop();
  }
  setCoLinhState('thinking', 'Cô đang nhận dạng câu nói…');
}

function cancelTeacherSpeech() {
  if (!teacherSpeech.active && !teacherSpeech.browser) return;
  if (teacherSpeech.usingNative && window.LingoVoiceSpeech) {
    window.LingoVoiceSpeech.postMessage(JSON.stringify({ type: 'cancel' }));
  } else if (teacherSpeech.browser) {
    teacherSpeech.browser.abort();
  }
  resetTeacherSpeechUi();
}

function resetTeacherSpeechUi(restoreDraft = true) {
  if (restoreDraft && !teacherSpeech.transcript) $('#teacherInput').value = teacherSpeech.draft;
  teacherSpeech.active = false;
  teacherSpeech.usingNative = false;
  teacherSpeech.browser = null;
  $('#teacherMic').setAttribute('aria-pressed', 'false');
  $('#teacherMic').setAttribute('aria-label', 'Nói với Cô Linh');
  if (!teacherSpeech.finalHandled) setCoLinhState('idle', 'Bạn có thể nói hoặc gõ tin nhắn.');
}

function handleSpeechError(code) {
  if (code === 'cancelled') { resetTeacherSpeechUi(); return; }
  teacherSpeech.active = false;
  teacherSpeech.browser = null;
  $('#teacherMic').setAttribute('aria-pressed', 'false');
  $('#teacherMic').setAttribute('aria-label', 'Thử nói lại với Cô Linh');
  const message = SPEECH_ERROR_MESSAGES[code] || 'Không nhận được giọng nói. Bạn thử lại nhé.';
  setCoLinhState('error', message);
  toast(message);
}

function normalizeListenLanguage(lang) {
  const value = String(lang || SPEECH_LANG[language] || 'en-US').toLowerCase();
  if (value.startsWith('zh')) return 'zh-CN';
  if (value.startsWith('vi')) return 'vi-VN';
  return 'en-US';
}

function mapBrowserSpeechError(code) {
  return {
    'not-allowed': 'permission_denied',
    'service-not-allowed': 'permission_denied',
    'no-speech': 'speech_timeout',
    'audio-capture': 'audio',
    network: 'network',
    aborted: 'cancelled'
  }[code] || 'unknown';
}

function browserSpeechSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function listenOnceWithBrowser(lang, callbacks = {}) {
  return new Promise((resolve) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      callbacks.onError?.('unavailable');
      callbacks.onEnd?.(null, 'unavailable');
      resolve(null);
      return;
    }
    const recognition = new Recognition();
    let settled = false;
    const timeoutMs = Math.max(0, Number(callbacks.timeoutMs || 0));
    let timer = null;
    const finish = (transcript, errorCode) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (errorCode && errorCode !== 'cancelled') callbacks.onError?.(errorCode);
      callbacks.onEnd?.(transcript || null, errorCode || null);
      resolve(transcript || null);
    };
    recognition.lang = lang;
    recognition.interimResults = Boolean(callbacks.interim);
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    callbacks.onReady?.({
      stop: () => { try { recognition.stop(); } catch {} },
      cancel: () => { try { recognition.abort(); } catch {} }
    });
    recognition.onstart = () => callbacks.onListening?.();
    recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;
      for (let i = 0; i < event.results.length; i++) {
        transcript += `${event.results[i][0]?.transcript || ''} `;
        isFinal ||= event.results[i].isFinal;
      }
      const clean = transcript.trim();
      if (clean && !isFinal) callbacks.onPartial?.(clean);
      if (clean && (isFinal || !callbacks.interim)) finish(clean);
    };
    recognition.onerror = (event) => finish(null, mapBrowserSpeechError(event.error));
    recognition.onend = () => finish(null);
    try {
      callbacks.onStart?.();
      recognition.start();
      if (timeoutMs) timer = setTimeout(() => { try { recognition.stop(); } catch {} }, timeoutMs);
    } catch {
      finish(null, 'busy');
    }
  });
}

function listenOnceWithNative(lang, callbacks = {}) {
  return new Promise((resolve) => {
    const bridge = window.LingoVoiceSpeech;
    if (!bridge || typeof bridge.postMessage !== 'function') {
      listenOnceWithBrowser(lang, callbacks).then(resolve);
      return;
    }
    const previousHandler = bridge.onmessage;
    let settled = false;
    const timeoutMs = Math.max(0, Number(callbacks.timeoutMs || 0));
    let timer = null;
    const finish = (transcript, errorCode) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      bridge.onmessage = previousHandler || null;
      if (errorCode && errorCode !== 'cancelled') callbacks.onError?.(errorCode);
      callbacks.onEnd?.(transcript || null, errorCode || null);
      resolve(transcript || null);
    };
    const fallbackToBrowser = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      bridge.onmessage = previousHandler || null;
      listenOnceWithBrowser(lang, callbacks).then(resolve);
    };
    bridge.onmessage = (event) => {
      let payload;
      try { payload = JSON.parse(String(event.data || '{}')); }
      catch { finish(null, 'unknown'); return; }
      if (payload.type === 'starting') callbacks.onStart?.();
      else if (payload.type === 'listening') callbacks.onListening?.();
      else if (payload.type === 'processing') callbacks.onProcessing?.();
      else if (payload.type === 'partial') callbacks.onPartial?.(payload.transcript || '');
      else if (payload.type === 'result') finish(String(payload.transcript || '').trim());
      else if (payload.type === 'error') {
        if (payload.code === 'unavailable' && browserSpeechSupported()) fallbackToBrowser();
        else finish(null, payload.code || 'unknown');
      } else if (payload.type === 'end') finish(null);
    };
    callbacks.onReady?.({
      stop: () => { try { bridge.postMessage(JSON.stringify({ type: 'stop' })); } catch {} },
      cancel: () => { try { bridge.postMessage(JSON.stringify({ type: 'cancel' })); } catch {} }
    });
    try {
      callbacks.onStart?.();
      bridge.postMessage(JSON.stringify({ type: 'start', language: lang }));
      if (timeoutMs) {
        timer = setTimeout(() => {
          try { bridge.postMessage(JSON.stringify({ type: 'stop' })); } catch {}
        }, timeoutMs);
      }
    } catch {
      fallbackToBrowser();
    }
  });
}

function listenOnce(options = {}) {
  const lang = normalizeListenLanguage(options.language);
  if (window.LingoVoiceSpeech && typeof window.LingoVoiceSpeech.postMessage === 'function') {
    return listenOnceWithNative(lang, options);
  }
  return listenOnceWithBrowser(lang, options);
}

// Fallback cuối cùng khi OpenVox không khả dụng; luồng chính của Cô Linh dùng
// /api/voice/teacher để giữ một chất giọng thống nhất cho cả tiếng Việt và câu mẫu.
async function speakBrowserVI(text) {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  const vi = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('vi')) || null;
  if (!vi && !voices.length) return;
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    u.rate = 0.95;
    if (vi) u.voice = vi;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

// Trích câu ngôn ngữ đích làm câu mẫu (khi phản hồi thiếu 【 】)
function extractTargetSentence(reply, lang) {
  const r = String(reply);
  if (lang === 'zh') {
    const runs = r.match(/[\u4e00-\u9fff][\u4e00-\u9fff，。！？]{2,30}/g);
    return runs ? runs[0] : null;
  }
  const sentences = r.match(/[A-Za-z][^.!?\n]{3,}[.!?]/g) || [];
  const good = sentences.find((s) => { const n = s.split(/\s+/).length; return n >= 3 && n <= 14; });
  return good || null;
}

// Nói ĐẦY ĐỦ phản hồi cô giáo bằng OpenVox: phần tiếng Việt dùng vi, câu mẫu
// dùng đúng ngôn ngữ đang học. Nếu server TTS lỗi, playText tự fallback browser.
// Nếu thiếu 【 】, tự trích câu ngôn ngữ đích để vẫn đọc to được (voice conversation).
async function speakTeacherReply(reply, lang) {
  const parts = String(reply).split(/【|】/);
  let spokeTarget = false;
  document.body.classList.add('co-speaking');
  setCoLinhState('speaking', 'Cô đang đọc câu mẫu…');
  try {
    for (let i = 0; i < parts.length; i++) {
      const part = (parts[i] || '').trim();
      if (!part) continue;
      if (i % 2 === 1) { await playText(part, lang, { announceFallback: false, teacherVoice: true }); spokeTarget = true; }
      else await playText(part, 'vi', { announceFallback: false, teacherVoice: true });
    }
    if (!spokeTarget) {
      const fallback = extractTargetSentence(reply, lang);
      if (fallback) await playText(fallback, lang, { announceFallback: false, teacherVoice: true });
    }
  } finally {
    document.body.classList.remove('co-speaking');
    setCoLinhState('idle', 'Cô đã trả lời xong. Đến lượt bạn nhé!');
  }
}

async function speakTargetSegments(reply, lang) {
  return speakTeacherReply(reply, lang);
}

function teacherInit() {
  $('#teacherToggle').addEventListener('click', () => setTeacherOpen(!teacherState.open));
  $('#teacherClose').addEventListener('click', () => setTeacherOpen(false));
  $('#teacherBackdrop').addEventListener('click', () => setTeacherOpen(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && teacherState.open) setTeacherOpen(false); });

  $('#teacherSend').addEventListener('click', () => sendTeacherMessage($('#teacherInput').value));
  $('#teacherMic').addEventListener('click', startTeacherSpeech);
  $('#teacherInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendTeacherMessage($('#teacherInput').value); });
  document.querySelectorAll('#teacherPrompts .chip').forEach((chip) => {
    chip.addEventListener('click', () => sendTeacherMessage(chip.dataset.prompt));
  });

  $('#teacherMute').addEventListener('click', () => {
    teacherState.muted = !teacherState.muted;
    $('#teacherMute').setAttribute('aria-pressed', String(teacherState.muted));
    $('#teacherMuteLabel').textContent = teacherState.muted ? 'Đọc to: tắt' : 'Đọc to: bật';
  });

  // Trạng thái AI
  try {
    fetch('/api/teacher/status')
      .then((r) => r.json())
      .then((s) => {
        teacherState.aiConfigured = Boolean(s.configured);
        const el = $('#teacherAiStatus');
        if (s.configured) { el.textContent = `AI: ${s.active}`; el.className = 'teacher-ai-status ok'; }
        else { el.textContent = 'Cần key AI'; el.className = 'teacher-ai-status bad'; }
      })
      .catch(() => {});
  } catch {}

  updateTeacherContext();
}

/* ---------- Nhân vật 2D "Cô Linh" ---------- */
function coLinhSVG() {
  return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cô Linh, giáo viên AI">
  <path class="hair-back" d="M38 52 C30 90 34 118 60 118 C86 118 90 90 82 52 Z" fill="#4A2E23"/>
  <rect x="52" y="84" width="16" height="14" rx="4" fill="#E8B48C"/>
  <path d="M30 118 Q28 150 60 150 Q92 150 90 118 L82 104 L38 104 Z" fill="#4F46E5"/>
  <path d="M48 104 L60 116 L72 104 L72 118 L60 128 L48 118 Z" fill="#818CF8"/>
  <g class="arms">
    <path class="arm arm-left" d="M39 112 Q25 120 28 137" fill="none" stroke="#E8B48C" stroke-width="8" stroke-linecap="round"/>
    <path class="arm arm-right" d="M81 112 Q95 120 92 137" fill="none" stroke="#E8B48C" stroke-width="8" stroke-linecap="round"/>
    <circle class="hand hand-left" cx="28" cy="139" r="5" fill="#F3C79B"/>
    <circle class="hand hand-right" cx="92" cy="139" r="5" fill="#F3C79B"/>
  </g>
  <circle cx="60" cy="134" r="6" fill="#FFFFFF" opacity="0.9"/>
  <path d="M56.5 134 l2.2 2.2 4.4 -5" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <g class="head">
    <circle cx="60" cy="52" r="30" fill="#F3C79B"/>
    <circle cx="44" cy="63" r="5" fill="#F9A8D4" opacity="0.5"/>
    <circle cx="76" cy="63" r="5" fill="#F9A8D4" opacity="0.5"/>
    <path d="M30 50 C30 26 44 18 60 18 C76 18 90 26 90 50 C90 40 82 34 74 36 C70 28 50 28 46 36 C38 34 30 40 30 50 Z" fill="#4A2E23"/>
    <circle cx="89" cy="29" r="10" fill="#4A2E23"/>
    <path d="M43 44 Q48 41 52 44" fill="none" stroke="#6B4226" stroke-width="2" stroke-linecap="round"/>
    <path d="M68 44 Q72 41 77 44" fill="none" stroke="#6B4226" stroke-width="2" stroke-linecap="round"/>
    <g class="eyes">
      <ellipse cx="48" cy="53" rx="4.2" ry="5" fill="#3B2A20"/>
      <circle cx="49.3" cy="51.5" r="1.4" fill="#fff"/>
      <ellipse cx="72" cy="53" rx="4.2" ry="5" fill="#3B2A20"/>
      <circle cx="73.3" cy="51.5" r="1.4" fill="#fff"/>
    </g>
    <path d="M58 57 q1.2 3 3.2 3" fill="none" stroke="#D99E6F" stroke-width="1.6" stroke-linecap="round"/>
    <path class="mouth" d="M54 65 Q60 71 66 65 Q60 67.5 54 65 Z" fill="#C96F5B"/>
  </g>
</svg>`;
}
function initCoLinh() {
  document.querySelectorAll('.co-avatar').forEach((el) => { if (!el.querySelector('svg')) el.innerHTML = coLinhSVG(); });
}

const CO_LINH_STATES = {
  idle: 'Sẵn sàng trò chuyện',
  listening: 'Đang lắng nghe bạn',
  thinking: 'Đang suy nghĩ',
  speaking: 'Đang trả lời',
  error: 'Cần bạn thử lại'
};

function setCoLinhState(state = 'idle', message) {
  const safeState = Object.hasOwn(CO_LINH_STATES, state) ? state : 'idle';
  document.querySelectorAll('.co-avatar').forEach((el) => { el.dataset.state = safeState; });
  const stage = document.getElementById('coStage');
  if (stage) stage.dataset.state = safeState;
  const label = document.getElementById('coStateLabel');
  if (label) label.textContent = CO_LINH_STATES[safeState];
  const status = document.getElementById('coStatus');
  if (status && message !== undefined) status.textContent = message || '';
}

/* ---------- Init ---------- */
function setLanguage(lang) {
  language = lang;
  $('#langEn').setAttribute('aria-pressed', String(lang === 'en'));
  $('#langZh').setAttribute('aria-pressed', String(lang === 'zh'));
  $('#quizLangLabel').textContent = LANG_LABEL[lang];
  $('#heroEyebrow').textContent = lang === 'en' ? 'LISTEN · UNDERSTAND · SPEAK' : '听 · 懂 · 说';
  topicIndex = 0;
  renderTopicTabs();
  renderSentences();
  renderProgress();
  updateTeacherContext();
}

function init() {
  $('#langEn').addEventListener('click', () => setLanguage('en'));
  $('#langZh').addEventListener('click', () => setLanguage('zh'));

  $('#randomPlay').addEventListener('click', () => {
    const all = allSentences(language);
    const s = all[Math.floor(Math.random() * all.length)];
    playText(s.text, language, { key: `${language}:${s.id}` });
    setTeacherLastSentence(s);
    if (progress.listened.indexOf(s.id) === -1) { progress.listened.push(s.id); saveProgress(); renderProgress(); }
  });

  $('#quizStart').addEventListener('click', () => {
    if (window.switchTab) window.switchTab('listening');
    startQuiz();
  });
  $('#quizPlay').addEventListener('click', () => {
    if (!quiz.sentence) { startQuiz(); return; } // Prompt 4: bấm nghe khi chưa có câu -> tự tạo
    playText(quiz.sentence.text, language, { announceFallback: false });
  });
  $('#quizNext').addEventListener('click', handleQuizNext);

  $('#playAllTopic').addEventListener('click', () => playTopicSequential());

  window.addEventListener('beforeunload', stopAudio);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAudio(); });

  teacherInit();
  initCoLinh();
  initVoice();
  setLanguage('en');
}

async function playTopicSequential() {
  const topic = LESSONS[language][topicIndex];
  for (const s of topic.sentences) {
    await playText(s.text, language, { key: `${language}:${s.id}`, announceFallback: false });
  }
  toast('Đã phát xong chủ đề.');
}

init();

// Export API chung cho learning.js (load sau file này)
window.LV = {
  get language() { return language; },
  setLanguage,
  allSentences,
  playText,
  listenOnce,
  speakTargetSegments,
  speakTeacherReply,
  speakBrowserVI,
  LANG_LABEL,
  SPEECH_LANG,
  toast,
  updateTeacherContext,
  setTeacherLastSentence,
  setCoLinhState,
  getTeacherProfile,
  saveTeacherProfile,
  get quiz() { return quiz; },
  progress,
  saveProgress,
  renderProgress
};
