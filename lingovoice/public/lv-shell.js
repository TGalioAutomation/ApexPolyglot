/* LingoVoice — Shell UI: stage theming, trạng thái hệ thống, tài khoản & đồng bộ.
 * Nạp sau learning.js. Chỉ dùng localStorage + window.LVApi, không đụng app.js/learning.js
 * để giữ hợp đồng DOM mà test phụ thuộc. Xem docs/ui-design.md.
 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const readJson = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  };

  /* ---------- 1. Theming theo stage tuổi (MASTER.md: đổi accent, không reset dữ liệu) ---------- */
  function applyStageTheme() {
    const profile = readJson('lv-profile', {});
    const age = ['preschool', 'child', 'teen', 'young-adult'].includes(profile.ageGroup)
      ? profile.ageGroup : 'young-adult';
    document.body.dataset.stage = age;
  }
  applyStageTheme();
  window.addEventListener('storage', applyStageTheme);

  /* ---------- 2. Empty state tab Hôm nay (chưa đặt mục tiêu) ---------- */
  function refreshTodayEmpty() {
    const box = $('todayEmpty');
    if (!box) return;
    const profile = readJson('lv-profile', {});
    const hasGoals = Array.isArray(profile.goals) && profile.goals.length > 0;
    box.hidden = hasGoals;
  }
  refreshTodayEmpty();

  /* ---------- 3. Banner lỗi toàn cục + thử lại ---------- */
  let lastErrorAt = 0;
  function showError(message) {
    const box = $('globalError');
    if (!box) return;
    const now = Date.now();
    if (now - lastErrorAt < 4000) return; // tránh spam
    lastErrorAt = now;
    $('globalErrorMessage').textContent = message || 'Đã có lỗi xảy ra. Bạn thử lại nhé.';
    box.hidden = false;
    clearTimeout(showError._t);
    showError._t = setTimeout(() => { box.hidden = true; }, 12000);
  }
  window.addEventListener('error', (event) => {
    if (event && event.message && /Script error/i.test(event.message)) return;
    if (event && event.filename && event.filename.includes('lv-shell')) return; // không tự báo lỗi của chính mình
    showError('Có lỗi nhỏ khi tải nội dung.');
  });
  document.addEventListener('click', (event) => {
    if (event.target && event.target.closest('#globalErrorRetry')) {
      window.location.reload();
    }
    if (event.target && event.target.closest('#globalErrorDismiss')) {
      const box = $('globalError');
      if (box) box.hidden = true;
    }
  });

  /* ---------- 4. Thẻ audio lỗi / offline — chỉ hiện khi được gọi chủ động ----------
   * app.js/learning.js đã tự xử lý fallback audio (voiceState.degraded + speechSynthesis),
   * nên lv-shell KHÔNG monkey-patch Audio.play nữa (chặn autoplay của trình duyệt là bình thường).
   * Thẻ này dành cho các module mới gọi LVShell.showAudioOffline() khi cần. */
  let audioOfflineShown = false;
  function showAudioOffline() {
    if (audioOfflineShown) return;
    audioOfflineShown = true;
    const box = $('audioOffline');
    if (box) box.hidden = false;
  }
  document.addEventListener('click', (event) => {
    if (event.target && event.target.closest('#audioOfflineDismiss')) {
      const box = $('audioOffline');
      if (box) box.hidden = true;
      audioOfflineShown = false;
    }
  });

  /* ---------- 5. Tài khoản & đồng bộ ---------- */
  const LAST_SYNC_KEY = 'lv-last-sync';

  function collectSyncPayload() {
    const profile = readJson('lv-profile', {});
    const srsState = readJson('lv-srs', { items: {} });
    const srs = [];
    for (const lang of ['en', 'zh']) {
      for (const [vocabId, it] of Object.entries(srsState.items && srsState.items[lang] || {})) {
        if (!it || typeof it !== 'object') continue;
        srs.push({
          lang, vocabId, term: vocabId, meaning: '',
          state: it.state || 'learning',
          intervalMs: 0,
          dueAt: it.dueAt ? new Date(it.dueAt).toISOString() : null,
          reps: Number(it.reps) || 0,
          consecutiveGood: 0,
          difficult: (Number(it.difficulty) || 0) >= 0.6,
          mastered: it.state === 'mastered',
          updatedAt: new Date().toISOString()
        });
      }
    }
    const mistakes = (readJson('lv-mistakes', []) || []).filter((m) => m && m.pattern).map((m) => ({
      lang: m.lang === 'zh' ? 'zh' : 'en',
      skill: String(m.skill || ''), pattern: String(m.pattern), correct: String(m.correct || ''),
      createdAt: m.at ? new Date(m.at).toISOString() : new Date().toISOString()
    }));
    return {
      srs,
      mistakes,
      profile: {
        goals: Array.isArray(profile.goals) ? profile.goals : [],
        dailyMinutes: profile.dailyMinutes,
        enRatio: Number.isFinite(profile.splitEn) ? profile.splitEn / 100 : undefined,
        ageGroup: profile.ageGroup
      },
      teacherProfile: readJson('lv-teacher-profile', null),
      progress: readJson('lingovoice-progress', null)
    };
  }

  function collectLegacyPayload() {
    const keys = ['lv-srs', 'lv-mistakes', 'lv-profile', 'lv-teacher-profile', 'lingovoice-progress', 'lv-days', 'lv-custom-vocab', 'lv-mined'];
    const payload = {};
    for (const key of keys) payload[key] = readJson(key, null);
    return payload;
  }

  function setAccountMessage(text, isError) {
    const el = $('accountMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!isError);
  }

  function renderAccountUI(user) {
    const loggedOut = $('accountLoggedOut');
    const loggedIn = $('accountLoggedIn');
    const status = $('accountStatus');
    if (!loggedOut || !loggedIn) return;
    if (user) {
      loggedOut.hidden = true;
      loggedIn.hidden = false;
      const when = localStorage.getItem(LAST_SYNC_KEY);
      status.textContent = `Đã đăng nhập: ${user.displayName || user.username}` + (when ? ` · Đồng bộ lúc ${when}` : ' · Chưa đồng bộ lần nào');
      status.dataset.state = 'ok';
    } else {
      loggedOut.hidden = false;
      loggedIn.hidden = true;
      status.textContent = 'Chưa đăng nhập — dữ liệu chỉ nằm trên máy này.';
      status.dataset.state = 'off';
    }
  }

  async function refreshAccount() {
    if (!window.LVApi) return;
    const result = await window.LVApi.me();
    renderAccountUI(result.ok ? result.data.user : null);
    return result.ok ? result.data.user : null;
  }

  async function syncNow() {
    const user = await refreshAccount();
    if (!user) { setAccountMessage('Bạn cần đăng nhập trước khi đồng bộ.', true); return; }
    setAccountMessage('Đang đồng bộ…');
    const result = await window.LVApi.push(collectSyncPayload());
    if (result.ok) {
      const when = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem(LAST_SYNC_KEY, when);
      renderAccountUI(user);
      setAccountMessage(`Đã đồng bộ ${result.data.accepted.srs} từ + ${result.data.accepted.mistakes} lỗi sai.`);
    } else {
      setAccountMessage(result.code === 'DB_UNAVAILABLE' ? 'Máy chủ chưa bật database.' : result.message, true);
      showError('Đồng bộ thất bại — thử lại khi có mạng.');
    }
  }

  async function pullThenMerge() {
    const result = await window.LVApi.pull();
    if (!result.ok) return false;
    const snapshot = result.data;
    const local = readJson('lv-srs', { items: {} });
    local.items = local.items || {};
    for (const item of snapshot.srs || []) {
      local.items[item.lang] = local.items[item.lang] || {};
      const existing = local.items[item.lang][item.vocabId || item.term];
      const serverTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
      const localTime = existing && existing._syncedAt ? existing._syncedAt : 0;
      if (!existing || serverTime >= localTime) {
        local.items[item.lang][item.vocabId || item.term] = {
          state: item.state, difficulty: item.difficult ? 0.7 : 0.3,
          dueAt: item.dueAt ? new Date(item.dueAt).getTime() : null,
          lastGrade: null, reps: item.reps || 0, _syncedAt: serverTime
        };
      }
    }
    try { localStorage.setItem('lv-srs', JSON.stringify(local)); } catch { /* đầy bộ nhớ */ }
    return true;
  }

  function bindAccountUI() {
    const form = $('accountForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = $('accountUser').value.trim();
      const password = $('accountPass').value;
      if (!username || !password) { setAccountMessage('Điền tên đăng nhập và mật khẩu.', true); return; }
      const wantRegister = event.submitter && event.submitter.id === 'registerBtn';
      setAccountMessage('Đang xử lý…');
      const result = wantRegister
        ? await window.LVApi.register({ username, password, displayName: readJson('lv-profile', {}).displayName || '' })
        : await window.LVApi.login({ username, password });
      if (!result.ok) {
        setAccountMessage(result.code === 'USERNAME_TAKEN' ? 'Tên này đã có người dùng.'
          : result.code === 'INVALID_CREDENTIALS' ? 'Sai tên đăng nhập hoặc mật khẩu.'
          : result.code === 'WEAK_PASSWORD' ? 'Mật khẩu cần ít nhất 8 ký tự.'
          : result.code === 'DB_UNAVAILABLE' ? 'Máy chủ chưa bật database.' : result.message, true);
        return;
      }
      setAccountMessage(wantRegister ? 'Đã tạo tài khoản — đang đưa dữ liệu máy này lên server…' : 'Đang đăng nhập…');
      await window.LVApi.push(collectSyncPayload()); // đăng ký xong đưa dữ liệu máy này lên ngay
      await pullThenMerge();
      refreshAccount();
    });

    document.addEventListener('click', async (event) => {
      if (event.target.closest('#syncNow')) { event.preventDefault(); await syncNow(); }
      if (event.target.closest('#importLocalBtn')) {
        event.preventDefault();
        const result = await window.LVApi.importLocal(collectLegacyPayload());
        if (result.ok) {
          const when = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          localStorage.setItem(LAST_SYNC_KEY, when);
          refreshAccount();
          setAccountMessage(`Đã nhập ${result.data.imported.srs} từ + ${result.data.imported.mistakes} lỗi sai từ máy này.`);
        } else setAccountMessage(result.message, true);
      }
      if (event.target.closest('#logoutBtn')) {
        event.preventDefault();
        await window.LVApi.logout();
        localStorage.removeItem(LAST_SYNC_KEY);
        renderAccountUI(null);
        setAccountMessage('Đã đăng xuất. Dữ liệu trên máy vẫn còn nguyên.');
      }
    });
  }
  bindAccountUI();
  refreshAccount();

  window.LVShell = { showError, showAudioOffline, syncNow, refreshAccount };
})();
