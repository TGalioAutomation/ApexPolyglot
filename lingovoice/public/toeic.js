/* LingoVoice — Thi thử TOEIC cuối buổi (UI runner)
 * Nạp sau cùng; mượn lexical global của app.js/learning.js ($, store, vocabItems, recordActivity,
 * LV, LVApi, LVShell) và ToeicCore từ toeic-core.cjs. Chỉ sở hữu các phần tử #toeic*.
 * Kết quả: khách → localStorage `lv-toeic` (client-only); có tài khoản → POST /api/toeic/submit
 * (XP/phút/huy hiệu cộng ngay trên server, xem docs/api-spec.md §3b).
 */
(function () {
  'use strict';

  const Toe = window.ToeicCore;
  const KEY = 'lv-toeic';
  const KIND_LABEL = { vocab: 'Từ vựng', reading: 'Đọc hiểu', listening: 'Nghe' };
  const FORMS = Toe.FORM_COUNT;

  const state = {
    durationMin: 10,
    form: 1,
    test: null,
    answers: [],
    index: 0,
    startedAt: 0,
    totalSec: 0,
    remaining: 0,
    timerId: null,
    lastAnnounce: 0,
    submitArmed: false,
    quitArmed: false,
    serverHistory: null
  };

  const $ = (sel) => document.querySelector(sel);

  /* ---------- lịch sử ---------- */
  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }
  function saveLocal(entries) {
    try { localStorage.setItem(KEY, JSON.stringify(entries.slice(-60))); } catch { /* đầy bộ nhớ */ }
  }

  async function loadServerHistory(force = false) {
    if (!window.LVApi) return;
    if (state.serverHistory && !force) return;
    const result = await window.LVApi.toeicHistory();
    if (result.ok) state.serverHistory = result.data;
    else if (result.code === 'DB_UNAVAILABLE') state.serverHistory = { unavailable: true };
  }

  // Server là nguồn chuẩn khi đã đăng nhập; bài làm lúc khách còn trên máy hiển thị kèm nhãn.
  function mergedHistory() {
    const local = loadLocal();
    if (state.serverHistory && !state.serverHistory.unavailable) {
      const serverRows = state.serverHistory.history || [];
      return [...serverRows.map((h) => ({ ...h, source: 'server' })),
        ...local.filter((e) => !e.synced).map((e) => ({ ...e, source: 'local' }))];
    }
    return local.map((e) => ({ ...e, source: 'local' }));
  }

  /* ---------- home ---------- */
  function learnedCount() {
    const items = (store.srs.items || {}).en || {};
    return Object.values(items).filter((it) => it && it.state && it.state !== 'new').length;
  }

  function bestScoreByForm() {
    const best = {};
    for (const h of mergedHistory()) best[h.form] = Math.max(best[h.form] || 0, Number(h.score) || 0);
    return best;
  }

  function renderFormChips() {
    const wrap = $('#toeicForms');
    if (!wrap) return;
    wrap.replaceChildren();
    const best = bestScoreByForm();
    for (let f = 1; f <= FORMS; f++) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'toeic-form-chip' + (f === state.form ? ' selected' : '');
      chip.setAttribute('role', 'option');
      chip.setAttribute('aria-selected', String(f === state.form));
      const label = document.createElement('b');
      label.textContent = `Đề ${f}`;
      chip.append(label);
      if (best[f]) {
        const score = document.createElement('span');
        score.textContent = `điểm cao ${best[f]}%`;
        chip.append(score);
      }
      chip.addEventListener('click', () => {
        state.form = f;
        renderFormChips();
        $('#toeicStart')?.focus();
      });
      wrap.append(chip);
    }
  }

  function skillBar(kind, bucket) {
    const acc = bucket.total ? Math.round((bucket.correct / bucket.total) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'toeic-skill';
    const head = document.createElement('div');
    head.className = 'toeic-skill-head';
    const name = document.createElement('span');
    name.textContent = KIND_LABEL[kind];
    const val = document.createElement('b');
    val.textContent = bucket.total ? `${acc}% (${bucket.correct}/${bucket.total})` : 'chưa có dữ liệu';
    head.append(name, val);
    const track = document.createElement('div');
    track.className = 'toeic-skill-track';
    const fill = document.createElement('div');
    fill.className = 'toeic-skill-fill';
    fill.style.width = `${bucket.total ? acc : 0}%`;
    track.append(fill);
    row.append(head, track);
    return row;
  }

  function renderSkills() {
    const grid = $('#toeicSkillGrid');
    const statsRow = $('#toeicStatsRow');
    const empty = $('#toeicSkillsEmpty');
    if (!grid) return;
    const history = mergedHistory().slice().sort((a, b) => new Date(a.at) - new Date(b.at));
    const buckets = { vocab: { total: 0, correct: 0 }, reading: { total: 0, correct: 0 }, listening: { total: 0, correct: 0 } };
    for (const h of history) {
      for (const kind of Object.keys(buckets)) {
        const b = (h.byKind || {})[kind];
        if (b) {
          buckets[kind].total += Number(b.total) || 0;
          buckets[kind].correct += Number(b.correct) || 0;
        }
      }
    }
    const hasAny = history.length > 0;
    empty.hidden = hasAny;
    grid.hidden = !hasAny;
    statsRow.hidden = !hasAny;
    if (!hasAny) return;
    grid.replaceChildren(...Object.entries(buckets).map(([kind, b]) => skillBar(kind, b)));

    const scores = history.map((h) => Number(h.score) || 0);
    const avg = Math.round(scores.reduce((a, s) => a + s, 0) / scores.length);
    const best = Math.max(...scores);
    const minutes = history.reduce((a, h) => a + Math.round((Number(h.usedSec) || 0) / 60), 0);
    const recent = scores.slice(-5);
    const older = scores.slice(0, -5);
    const recentAvg = Math.round(recent.reduce((a, s) => a + s, 0) / recent.length);
    const trend = older.length
      ? (recentAvg >= Math.round(older.reduce((a, s) => a + s, 0) / older.length) ? 'tăng dần ▲' : 'đang giảm ▼')
      : '5 đề đầu tiên';
    const tile = (value, label) => {
      const el = document.createElement('div');
      el.className = 'sum-tile';
      const b = document.createElement('b');
      b.textContent = String(value);
      const s = document.createElement('span');
      s.textContent = label;
      el.append(b, s);
      return el;
    };
    statsRow.replaceChildren(
      tile(history.length, 'đề đã làm'),
      tile(`${avg}%`, 'điểm trung bình'),
      tile(`${best}%`, 'điểm cao nhất'),
      tile(`${minutes}′`, 'phút thi tích luỹ'),
      tile(trend, 'xu hướng gần đây')
    );
  }

  function renderHistory() {
    const list = $('#toeicHistoryList');
    const empty = $('#toeicHistoryEmpty');
    if (!list) return;
    const history = mergedHistory().slice().sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
    empty.hidden = history.length > 0;
    list.hidden = history.length === 0;
    list.replaceChildren();
    for (const h of history) {
      const li = document.createElement('li');
      li.className = 'toeic-history-row';
      const main = document.createElement('div');
      main.className = 'toeic-history-main';
      const title = document.createElement('b');
      title.textContent = `Đề ${h.form} · ${h.durationMin} phút`;
      const meta = document.createElement('span');
      const when = new Date(h.at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      meta.textContent = `${h.correct}/${h.total} câu · ${when}${h.source === 'local' ? ' · trên máy này' : ''}`;
      main.append(title, meta);
      const score = document.createElement('span');
      score.className = 'score-chip';
      score.textContent = `${h.score}%`;
      li.append(main, score);
      list.append(li);
    }
  }

  function showHome() {
    stopTimer();
    state.test = null;
    $('#toeicHome').hidden = false;
    $('#toeicRun').hidden = true;
    $('#toeicResult').hidden = true;
    const learned = learnedCount();
    $('#toeicLearnedChip').textContent = `${learned} từ đã học`;
    $('#toeicHomeNote').textContent = learned > 0
      ? `Đề lấy từ ${learned} từ bạn đã học — ưu tiên từ đang học và đến hạn ôn theo lịch SRS. Không dùng AI chấm: đáp án cố định, chấm ngay khi nộp.`
      : 'Bạn chưa có từ nào trong lịch học — đề sẽ lấy từ kho vựng chung từ dễ lên. Học vài từ trong tab Từ mới để đề bám sát bạn hơn.';
    loadServerHistory().then(() => { renderFormChips(); renderSkills(); renderHistory(); });
    renderFormChips(); // chip chọn đề phải hiện ngay cả khi mạng chậm
  }
  window.LVToeic = { showHome };

  /* ---------- chạy đề ---------- */
  function showPane(name) {
    $('#toeicHome').hidden = name !== 'home';
    $('#toeicRun').hidden = name !== 'run';
    $('#toeicResult').hidden = name !== 'result';
  }

  function startTest() {
    const vocab = vocabItems('en');
    if (!vocab.length) {
      LV.toast('Đang tải kho từ vựng — bạn thử lại sau vài giây nhé.', true);
      return;
    }
    const test = Toe.buildTest({
      form: state.form,
      durationMin: state.durationMin,
      vocab,
      srsItems: (store.srs.items || {}).en || {},
      now: Date.now()
    });
    if (!test.questions.length) {
      LV.toast('Chưa dựng được đề từ kho từ này — thử lại sau.', true);
      return;
    }
    state.test = test;
    state.answers = test.questions.map(() => null);
    state.index = 0;
    state.startedAt = Date.now();
    state.totalSec = test.durationMin * 60;
    state.remaining = state.totalSec;
    state.submitArmed = false;
    state.quitArmed = false;
    const q = Toe.durationOf(test.durationMin);
    $('#toeicRunForm').textContent = `Đề ${test.form}`;
    $('#toeicRunInfo').textContent = `${test.questions.length} câu · ${test.durationMin} phút · từ ${test.meta.learnedUsed} từ đã học`;
    showPane('run');
    renderQuestion();
    renderDots();
    updateTimerUi();
    startTimer();
    LV.toast(`Bắt đầu đề ${test.form} — ${test.questions.length} câu trong ${q.min} phút. Bắt làm thôi!`);
  }

  function startTimer() {
    stopTimer();
    state.timerId = setInterval(() => {
      state.remaining -= 1;
      updateTimerUi();
      if (state.remaining <= 0) {
        stopTimer();
        submitTest(true);
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  }

  function updateTimerUi() {
    const label = $('#toeicTimer');
    if (!label) return;
    const m = Math.max(0, Math.floor(state.remaining / 60));
    const s = Math.max(0, state.remaining % 60);
    label.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    $('#toeicTimeFill').style.width = `${Math.max(0, Math.min(100, (state.remaining / state.totalSec) * 100))}%`;
    $('#toeicTimerWrap').classList.toggle('warn', state.remaining <= 60 && state.remaining > 0);
    // screen reader: thông báo nhịp thưa, không đọc mỗi giây
    const sr = $('#toeicTimerSr');
    if (sr && (state.remaining === 300 || state.remaining === 60)) {
      sr.textContent = state.remaining === 300 ? 'Còn 5 phút.' : 'Còn 1 phút.';
    }
  }

  function renderQuestion() {
    const q = state.test.questions[state.index];
    const total = state.test.questions.length;
    $('#toeicQType').textContent = `Câu ${state.index + 1}/${total} · ${q.typeLabel}`;
    $('#toeicQPrompt').textContent = q.prompt;
    $('#toeicQPrompt').lang = 'en';
    const play = $('#toeicQPlay');
    play.hidden = q.type !== 'listen';
    play.classList.remove('playing');
    const choices = $('#toeicQChoices');
    choices.replaceChildren();
    q.choices.forEach((text, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toeic-choice' + (state.answers[state.index] === i ? ' selected' : '');
      const key = document.createElement('span');
      key.className = 'toeic-choice-key';
      key.textContent = String.fromCharCode(65 + i); // A B C D
      const value = document.createElement('span');
      value.textContent = text;
      btn.append(key, value);
      btn.addEventListener('click', () => {
        state.answers[state.index] = i;
        state.submitArmed = false;
        state.quitArmed = false;
        renderQuestion();
        renderDots();
        // chọn xong nhảy sang câu kế sau nhịp ngắn — vẫn quay lại được bằng Câu trước
        if (state.index < total - 1) setTimeout(() => {
          if (state.test && state.answers[state.index] === i) go(state.index + 1);
        }, 280);
      });
      choices.append(btn);
    });
    $('#toeicPrev').disabled = state.index === 0;
    $('#toeicNext').hidden = state.index >= total - 1;
    $('#toeicSkipNext').hidden = state.index >= total - 1;
    $('#toeicSubmitBtn').hidden = state.index < total - 1;
    $('#toeicSubmitBtn').textContent = 'Nộp bài';
    $('#toeicQuit').textContent = 'Bỏ dở buổi thi';
  }

  function go(index) {
    state.index = Math.max(0, Math.min(state.test.questions.length - 1, index));
    renderQuestion();
    renderDots();
  }

  function renderDots() {
    const dots = $('#toeicDots');
    if (!dots || !state.test) return;
    dots.replaceChildren();
    state.test.questions.forEach((q, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'toeic-dot' + (state.answers[i] !== null ? ' done' : '') + (i === state.index ? ' current' : '');
      dot.textContent = String(i + 1);
      dot.setAttribute('aria-label', `Câu ${i + 1}${state.answers[i] !== null ? ' — đã trả lời' : ' — chưa trả lời'}`);
      dot.addEventListener('click', () => go(i));
      dots.append(dot);
    });
  }

  /* ---------- nộp bài ---------- */
  function submitTest(auto = false) {
    if (!state.test) return;
    const unanswered = state.answers.filter((a) => a === null).length;
    if (!auto && unanswered > 0 && !state.submitArmed) {
      state.submitArmed = true;
      $('#toeicSubmitBtn').textContent = `Còn ${unanswered} câu trống — bấm nữa để nộp`;
      LV.toast(`Bạn còn ${unanswered} câu chưa trả lời — bấm “Nộp bài” lần nữa để nộp thật.`);
      return;
    }
    stopTimer();
    const usedSec = Math.max(1, Math.min(state.totalSec, Math.round((Date.now() - state.startedAt) / 1000)));
    const result = Toe.scoreTest(state.test.questions, state.answers);
    const minutes = Math.max(1, Math.round(usedSec / 60));
    const entry = {
      at: new Date().toISOString(),
      form: state.test.form,
      durationMin: state.test.durationMin,
      usedSec,
      total: result.total,
      correct: result.correct,
      score: result.score,
      byKind: result.byKind,
      synced: false
    };

    const attempts = state.test.questions.map((q, i) => ({
      kind: q.kind,
      itemRef: q.vocabId,
      correct: state.answers[i] === q.answer
    }));

    renderResult(entry, result, auto);

    (async () => {
      if (window.LVShell && window.LVShell.isLoggedIn && window.LVShell.isLoggedIn()) {
        const res = await window.LVApi.toeicSubmit({
          day: localDayKey(),
          form: entry.form,
          durationMin: entry.durationMin,
          usedSec,
          attempts
        });
        if (res.ok) {
          entry.synced = true;
          const entries = loadLocal().filter((e) => !(e.form === entry.form && e.at === entry.at));
          entries.push(entry);
          saveLocal(entries);
          if (window.LVShell.applySummary) window.LVShell.applySummary(res.data);
          state.serverHistory = null;
          await loadServerHistory(true);
          $('#toeicScoreSaved').textContent = 'Đã lưu vào tài khoản — XP và kỹ năng được tích lũy.';
        } else {
          pushLocal(entry);
          $('#toeicScoreSaved').textContent = res.code === 'DB_UNAVAILABLE'
            ? 'Máy chủ chưa bật database — kết quả đang lưu trên máy này.'
            : 'Chưa gửi được lên máy chủ — kết quả đã lưu trên máy này.';
        }
      } else {
        pushLocal(entry);
        // khách vãng lai: vẫn giữ streak/phút học ngày theo luồng chung
        try { recordActivity(minutes, 0); } catch { /* learning.js chưa sẵn sàng */ }
        $('#toeicScoreSaved').textContent = 'Đã lưu trên máy này — đăng nhập để tích lũy XP và lịch sử đầy đủ.';
      }
      renderSkills();
      renderHistory();
      renderFormChips();
    })();
  }

  function pushLocal(entry) {
    const entries = loadLocal();
    entries.push(entry);
    saveLocal(entries);
  }

  function localDayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function scoreLabel(score) {
    if (score >= 90) return 'Xuất sắc — chắc tay phần từ vựng đã học!';
    if (score >= 75) return 'Tốt — nền tảng vững, giữ nhịp ôn tập nhé.';
    if (score >= 50) return 'Khá — nên xem lại các câu sai bên dưới.';
    return 'Cần luyện thêm — các từ sai đã có trong phần xem lại.';
  }

  function renderResult(entry, result, auto) {
    showPane('result');
    $('#toeicResultTitle').textContent = `${auto ? 'Hết giờ — ' : ''}Hoàn thành đề ${entry.form} (${entry.durationMin} phút)`;
    $('#toeicScoreVal').textContent = String(result.score);
    const ring = $('#toeicScoreRing');
    const hue = result.score >= 75 ? 'var(--accent)' : result.score >= 50 ? 'var(--stage-accent)' : 'var(--destructive)';
    ring.style.setProperty('--toeic-ring', hue);
    // điểm 0 -> không vẽ arc (tránh vệt màu thừa nhìn như lỗi)
    ring.style.setProperty('--toeic-ring-pct', result.score > 0 ? `${Math.max(4, Math.round(result.score * 3.6))}deg` : '0deg');
    $('#toeicScoreLine').textContent = `Đúng ${result.correct}/${result.total} câu · ${scoreLabel(result.score)}`;
    const usedMin = Math.max(1, Math.round(entry.usedSec / 60));
    $('#toeicScoreTime').textContent = `Thời gian làm: ${usedMin} phút / ${entry.durationMin} phút`;
    $('#toeicScoreSaved').textContent = 'Đang lưu kết quả…';
    const skills = $('#toeicResultSkills');
    skills.replaceChildren(...Object.entries(result.byKind).map(([kind, b]) => skillBar(kind, b)));

    const reviewCard = $('#toeicReviewCard');
    const list = $('#toeicReviewList');
    list.replaceChildren();
    for (const w of result.wrong) {
      const li = document.createElement('li');
      li.className = 'toeic-review-row';
      const head = document.createElement('div');
      head.className = 'toeic-review-head';
      const term = document.createElement('b');
      term.textContent = w.term;
      term.lang = 'en';
      const meaning = document.createElement('span');
      meaning.textContent = w.meaning;
      head.append(term, meaning);
      const answer = document.createElement('p');
      answer.className = 'toeic-review-answer';
      answer.textContent = `Đáp án đúng: ${w.answerText}${w.chosenText && w.chosenText !== w.answerText ? ` — bạn chọn: ${w.chosenText}` : ' — bạn bỏ trống'}`;
      li.append(head, answer);
      if (w.example) {
        const ex = document.createElement('p');
        ex.className = 'toeic-review-example';
        ex.lang = 'en';
        ex.textContent = w.example;
        li.append(ex);
        const hear = document.createElement('button');
        hear.type = 'button';
        hear.className = 'btn ghost sm';
        hear.textContent = `Nghe “${w.term}”`;
        hear.addEventListener('click', () => LV.playText(w.term, 'en', { announceFallback: false }));
        li.append(hear);
      }
      list.append(li);
    }
    reviewCard.hidden = result.wrong.length === 0;
    state.test = null; // chặn nộp lại
  }

  /* ---------- sự kiện ---------- */
  function bind() {
    document.querySelectorAll('#toeicDuration button').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.durationMin = Number(btn.dataset.min) || 10;
        document.querySelectorAll('#toeicDuration button').forEach((b) => {
          const on = b === btn;
          b.classList.toggle('selected', on);
          b.setAttribute('aria-pressed', String(on));
        });
      });
    });
    $('#toeicRandom').addEventListener('click', () => {
      state.form = 1 + Math.floor(Math.random() * FORMS);
      renderFormChips();
      LV.toast(`Đã chọn đề ${state.form} — bấm “Bắt đầu thi thử”.`);
    });
    $('#toeicStart').addEventListener('click', startTest);
    $('#toeicPrev').addEventListener('click', () => go(state.index - 1));
    $('#toeicNext').addEventListener('click', () => go(state.index + 1));
    $('#toeicSkipNext').addEventListener('click', () => go(state.index + 1));
    $('#toeicSubmitBtn').addEventListener('click', () => submitTest(false));
    $('#toeicQuit').addEventListener('click', () => {
      if (!state.test) return;
      if (!state.quitArmed) {
        state.quitArmed = true;
        $('#toeicQuit').textContent = 'Bấm lần nữa để bỏ thật';
        setTimeout(() => { state.quitArmed = false; if ($('#toeicQuit')) $('#toeicQuit').textContent = 'Bỏ dở buổi thi'; }, 3000);
        return;
      }
      stopTimer();
      state.test = null;
      LV.toast('Đã bỏ dở buổi thi — kết quả không được lưu.', true);
      showHome();
    });
    $('#toeicQPlay').addEventListener('click', () => {
      const q = state.test?.questions[state.index];
      if (!q) return;
      $('#toeicQPlay').classList.add('playing');
      Promise.resolve(LV.playText(q.audioText, 'en', { announceFallback: false }))
        .finally(() => $('#toeicQPlay')?.classList.remove('playing'));
    });
    $('#toeicAgain').addEventListener('click', () => {
      state.form = (state.form % FORMS) + 1;
      showPane('home');
      showHome();
    });
    $('#toeicHomeBtn').addEventListener('click', () => { showPane('home'); showHome(); });
  }

  bind();
})();
