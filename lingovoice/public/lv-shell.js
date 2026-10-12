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

  /* ---------- 4b. Điều hướng section tab Thiết lập ---------- */
  document.addEventListener('click', (event) => {
    const chip = event.target.closest('.setup-sections button');
    if (!chip) return;
    const target = document.getElementById(chip.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- 4c. Giao diện sáng/tối (token [data-theme]) ---------- */
  const THEME_KEY = 'lv-theme';
  function applyTheme() {
    let pref = 'system';
    try { pref = localStorage.getItem(THEME_KEY) || 'system'; } catch (e) {}
    const dark = pref === 'dark'
      || (pref === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    document.querySelectorAll('#themeSeg button').forEach((b) => {
      const active = b.dataset.themeOpt === pref;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
  }
  document.addEventListener('click', (event) => {
    const b = event.target.closest('#themeSeg button');
    if (!b) return;
    try { localStorage.setItem(THEME_KEY, b.dataset.themeOpt); } catch (e) {}
    applyTheme();
  });
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', applyTheme);
  }
  applyTheme();

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
    // Lỗi phải được screen reader đọc ngay (WCAG 3.3.1) — role=alert, thường thì status
    el.setAttribute('role', isError ? 'alert' : 'status');
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
    const user = result.ok ? result.data.user : null;
    renderAccountUI(user);
    gam.user = user;
    renderParentSection(user);
    if (user) {
      flushActivity(); // xả phần hoạt động pending của lần trước nếu còn
      refreshGamification();
    } else {
      renderGamification(null);
    }
    return user;
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
      const role = wantRegister && $('registerParent')?.checked ? 'parent' : 'learner';
      const result = wantRegister
        ? await window.LVApi.register({ username, password, displayName: readJson('lv-profile', {}).displayName || '', role })
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
        gam.user = null;
        renderGamification(null);
        renderParentSection(null);
        setAccountMessage('Đã đăng xuất. Dữ liệu trên máy vẫn còn nguyên.');
      }
    });
  }
  bindAccountUI();
  refreshAccount();

  /* ---------- 6. Gamification: XP · cấp độ · huy hiệu (roadmap #4) ----------
   * Client vẫn giữ streak/minutes cục bộ (lv-days) cho khách vãng lai; khi có
   * tài khoản, server là nguồn chuẩn — queue attempt + rollup phút/từ rồi xả theo lô. */
  const gam = { user: null, pending: { minutes: 0, words: 0 }, attempts: [], flushTimer: null };

  function localDayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function gamToast(message, warn = false) {
    const el = $('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('warn', warn);
    el.classList.add('show');
    clearTimeout(gamToast._t);
    gamToast._t = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function queueAttempt(raw = {}) {
    if (gam.attempts.length >= 400) return; // chặn phình vô hạn khi offline lâu
    gam.attempts.push({
      kind: ['vocab', 'listening', 'writing', 'speaking', 'reading', 'quiz'].includes(raw.kind) ? raw.kind : 'vocab',
      itemRef: typeof raw.itemRef === 'string' ? raw.itemRef.slice(0, 160) : null,
      correct: !!raw.correct,
      grade: Number.isFinite(raw.grade) ? Math.max(1, Math.min(5, Math.round(raw.grade))) : null,
      lang: raw.lang === 'zh' ? 'zh' : raw.lang === 'en' ? 'en' : null
    });
    scheduleFlush(15000);
  }

  function logActivity({ minutes = 0, words = 0 } = {}) {
    gam.pending.minutes += Number(minutes) || 0;
    gam.pending.words += Number(words) || 0;
    scheduleFlush(4000);
  }

  function scheduleFlush(delay) {
    if (gam.flushTimer) return;
    gam.flushTimer = setTimeout(async () => {
      gam.flushTimer = null;
      await flushActivity();
    }, delay);
  }

  async function flushActivity() {
    if (!gam.user || !window.LVApi) { gam.attempts.length = 0; gam.pending = { minutes: 0, words: 0 }; return; }
    if (!gam.pending.minutes && !gam.pending.words && !gam.attempts.length) return;
    const payload = {
      day: localDayKey(),
      minutes: Math.round(gam.pending.minutes),
      words: Math.round(gam.pending.words),
      attempts: gam.attempts.splice(0, gam.attempts.length)
    };
    gam.pending = { minutes: 0, words: 0 };
    const result = await window.LVApi.activity(payload);
    if (result.ok) applyGamification(result.data);
  }

  function applyGamification(summary) {
    renderGamification(summary);
    for (const badge of summary.newBadges || []) gamToast(`${badge.icon} Huy hiệu mới: ${badge.name}!`);
  }

  function renderGamification(summary) {
    gam.lastSummary = summary || null;
    const xpEl = $('xpTotalVal');
    if (!xpEl) return;
    const levelEl = $('levelName');
    const bar = $('levelBarFill');
    const row = $('badgeRow');
    if (!summary) {
      xpEl.textContent = '0';
      if (levelEl) levelEl.textContent = 'Đăng nhập để nhận XP';
      if (bar) bar.style.width = '0%';
      if (row) row.replaceChildren();
      return;
    }
    xpEl.textContent = String(summary.xp.total);
    if (levelEl) levelEl.textContent = `Cấp ${summary.level.level} · ${summary.level.name}`;
    if (bar) bar.style.width = `${Math.round((summary.level.progress || 0) * 100)}%`;
    if (row) {
      row.replaceChildren();
      for (const badge of summary.badges || []) {
        const chip = document.createElement('span');
        chip.className = 'badge' + (badge.earned ? ' earned' : ' locked');
        chip.textContent = `${badge.icon} ${badge.name}`;
        chip.title = `${badge.desc}${badge.earned ? ' — đã đạt' : ''}`;
        chip.setAttribute('aria-label', `${badge.name}: ${badge.desc}${badge.earned ? ' — đã đạt' : ' — chưa đạt'}`);
        row.append(chip);
      }
    }
    // Server là nguồn chuẩn của streak khi đã đăng nhập
    const streakEl = $('habitStreak');
    if (streakEl && summary.streak) streakEl.textContent = `${summary.streak.current} ngày liên tiếp`;
    // Đồng bộ 3 số habit với rollup server để không mâu thuẫn streak ở máy khác
    if (summary.activity) {
      const todayRow = (summary.days || []).find((d) => d.day === summary.day);
      const todayMin = $('habitTodayMin');
      const wordsWeek = $('habitWordsWeek');
      const missed = $('habitMissed');
      if (todayMin) todayMin.textContent = String(todayRow?.minutes || 0);
      if (wordsWeek) wordsWeek.textContent = String(summary.activity.words7d ?? 0);
      if (missed) missed.textContent = String(summary.activity.missedDays ?? 0);
    }
  }

  async function refreshGamification() {
    if (!gam.user || !window.LVApi) return;
    const result = await window.LVApi.summary(localDayKey());
    if (result.ok) applyGamification(result.data);
  }

  // Số habit nguồn server cho learning.js renderHabits ưu tiên dùng (tránh bị số local cũ
  // ghi đè sau khi initVocabData render lại). null = chưa đăng nhập/chưa có summary.
  function serverHabitStats() {
    const s = gam.lastSummary;
    if (!s || !s.activity || !s.streak) return null;
    return {
      streak: s.streak.current,
      todayMin: (s.days || []).find((d) => d.day === s.day)?.minutes || 0,
      wordsWeek: s.activity.words7d ?? 0,
      missed: s.activity.missedDays ?? 0,
      week: (s.days || []).slice(-7).map((d) => ({ minutes: d.minutes }))
    };
  }

  /* ---------- 7. Phụ huynh: mã liên kết + dashboard tiến độ (roadmap #4) ---------- */
  function shellModal(modal, open, preferredFocus) {
    if (!modal) return;
    if (open) {
      modal._opener = document.activeElement;
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => {
        const target = (preferredFocus && modal.querySelector(preferredFocus)) || modal.querySelector('button');
        target?.focus();
      });
    } else {
      modal.setAttribute('aria-hidden', 'true');
      if (!document.querySelector('.modal[aria-hidden="false"]')) document.body.classList.remove('modal-open');
      if (modal._opener && document.contains(modal._opener)) modal._opener.focus();
      modal._opener = null;
    }
  }

  function setParentMessage(text, isError) {
    const el = $('parentLinkMsg');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!isError);
    el.setAttribute('role', isError ? 'alert' : 'status');
  }

  function pcMetaText(child) {
    const parts = [`🔥 ${child.streak ?? 0} ngày`, `⭐ ${child.xp ?? 0} XP`, `${child.minutes7d ?? 0} phút / 7 ngày`];
    if (child.lastActiveDay && child.lastActiveDay !== localDayKey()) parts.push(`học gần nhất ${child.lastActiveDay}`);
    return parts.join(' · ');
  }

  function childRow(child, { withDash }) {
    const row = document.createElement('div');
    row.className = 'parent-child';
    const main = document.createElement('div');
    main.className = 'pc-main';
    const name = document.createElement('b');
    name.textContent = child.displayName || child.username;
    const meta = document.createElement('span');
    meta.className = 'pc-meta';
    meta.textContent = child.streak === undefined ? '' : pcMetaText(child);
    main.append(name, meta);
    const actions = document.createElement('div');
    actions.className = 'pc-actions';
    if (withDash) {
      const dash = document.createElement('button');
      dash.type = 'button';
      dash.className = 'btn ghost sm';
      dash.textContent = 'Xem tiến độ';
      dash.dataset.dash = child.id;
      actions.append(dash);
    }
    const unlink = document.createElement('button');
    unlink.type = 'button';
    unlink.className = 'btn ghost sm pc-unlink';
    unlink.textContent = 'Gỡ liên kết';
    unlink.dataset[withDash ? 'unlinkChild' : 'unlinkParent'] = child.id;
    actions.append(unlink);
    row.append(main, actions);
    return row;
  }

  function renderParentSection(user) {
    const parentBox = $('parentRoleBox');
    const childBox = $('childLinkBox');
    const guestHint = $('parentGuestHint');
    if (!parentBox || !childBox) return;
    const isParent = Boolean(user && user.role === 'parent');
    parentBox.hidden = !isParent;
    childBox.hidden = !(user && !isParent);
    if (guestHint) guestHint.hidden = Boolean(user);
    if (isParent) loadParentChildren();
    else if (user) loadParentLinks();
  }

  async function loadParentChildren() {
    if (!window.LVApi) return;
    const result = await window.LVApi.parentChildren(localDayKey());
    const list = $('parentChildrenList');
    if (!list) return;
    list.replaceChildren();
    if (!result.ok) return;
    if (!result.data.children.length) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = 'Chưa có con nào liên kết. Tạo mã ở trên rồi gửi cho con nhập trong mục Thêm → Phụ huynh.';
      list.append(empty);
      return;
    }
    for (const child of result.data.children) list.append(childRow(child, { withDash: true }));
  }

  async function loadParentLinks() {
    if (!window.LVApi) return;
    const result = await window.LVApi.parentLinks();
    const list = $('parentLinksList');
    if (!list) return;
    list.replaceChildren();
    if (!result.ok || !result.data.parents.length) return;
    const title = document.createElement('p');
    title.className = 'hint';
    title.textContent = 'Đang chia sẻ tiến độ với:';
    list.append(title);
    for (const parent of result.data.parents) list.append(childRow(parent, { withDash: false }));
  }

  const SKILL_LABELS = { vocab: 'Từ vựng', listening: 'Nghe', writing: 'Viết', speaking: 'Nói', reading: 'Đọc', quiz: 'Trắc nghiệm' };

  function pdStat(label, value) {
    const stat = document.createElement('div');
    stat.className = 'stat';
    const b = document.createElement('b');
    b.textContent = value;
    const span = document.createElement('span');
    span.textContent = label;
    stat.append(b, span);
    return stat;
  }

  function renderParentDash(data) {
    $('pdTitle').textContent = `Tiến độ của ${data.child.displayName}`;
    $('pdSub').textContent = `14 ngày gần nhất (đến ${data.day})`;
    const stats = $('pdStats');
    stats.replaceChildren();
    stats.append(
      pdStat('ngày liên tiếp', data.streak.current),
      pdStat('XP tuần này', data.xp.week),
      pdStat('từ đã học', data.srs.total),
      pdStat('từ thành thạo', data.srs.mastered),
      pdStat('từ cần ôn', data.srs.due),
      pdStat('phút / 7 ngày', data.activity.minutes7d)
    );

    const bars = $('pdBars');
    bars.replaceChildren();
    const max = Math.max(15, ...data.days.map((d) => d.minutes));
    data.days.forEach((d, i) => {
      const col = document.createElement('i');
      col.style.height = `${Math.max(5, Math.round((d.minutes / max) * 60))}px`;
      if (i === data.days.length - 1) col.classList.add('today');
      else if (d.minutes > 0) col.classList.add('done');
      col.title = `${d.day}: ${d.minutes} phút`;
      const lab = document.createElement('span');
      lab.textContent = i === data.days.length - 1 ? 'Hnay' : d.day.slice(8);
      col.append(lab);
      bars.append(col);
    });

    const skills = $('pdSkills');
    skills.replaceChildren();
    if (data.attempts.length) {
      for (const a of data.attempts) {
        const line = document.createElement('div');
        line.className = 'pd-line';
        line.textContent = `${SKILL_LABELS[a.kind] || a.kind}: ${a.correct}/${a.total} lượt đúng`;
        skills.append(line);
      }
    } else {
      const line = document.createElement('p');
      line.className = 'hint';
      line.textContent = 'Chưa có lượt luyện tập nào trong 14 ngày.';
      skills.append(line);
    }

    const mistakes = $('pdMistakes');
    mistakes.replaceChildren();
    if (data.topMistakes.length) {
      for (const m of data.topMistakes) {
        const line = document.createElement('div');
        line.className = 'pd-line';
        line.textContent = `“${m.pattern}”${m.correct ? ` → ${m.correct}` : ''} (${m.count} lần)`;
        mistakes.append(line);
      }
    } else {
      const line = document.createElement('p');
      line.className = 'hint';
      line.textContent = 'Không có lỗi sai nào đáng chú ý.';
      mistakes.append(line);
    }

    const badges = $('pdBadges');
    badges.replaceChildren();
    for (const badge of data.badges || []) {
      const chip = document.createElement('span');
      chip.className = 'badge earned';
      chip.textContent = `${badge.icon} ${badge.name}`;
      badges.append(chip);
    }
    if (!(data.badges || []).length) {
      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.textContent = 'Con chưa đạt huy hiệu nào — huy hiệu đầu tiên rất gần!';
      badges.append(hint);
    }

    const sugg = $('pdSuggestions');
    sugg.replaceChildren();
    for (const text of data.suggestions || []) {
      const li = document.createElement('li');
      li.textContent = text;
      sugg.append(li);
    }
  }

  async function openParentDash(childId) {
    if (!window.LVApi) return;
    // day theo múi giờ máy phụ huynh (thường trùng với con) — dashboard đếm streak đúng ngày "hôm nay" của con
    const result = await window.LVApi.parentDashboard(childId, localDayKey());
    if (!result.ok) { gamToast(result.message || 'Không tải được tiến độ.', true); return; }
    renderParentDash(result.data);
    shellModal($('parentDashModal'), true, '#pdClose');
  }

  function bindParentUI() {
    const inviteBtn = $('parentInviteBtn');
    if (!inviteBtn) return;
    inviteBtn.addEventListener('click', async () => {
      inviteBtn.disabled = true;
      const result = await window.LVApi.parentInvite();
      inviteBtn.disabled = false;
      const codeEl = $('parentInviteCode');
      const hintEl = $('parentInviteHint');
      const copyBtn = $('parentInviteCopy');
      if (!result.ok) { gamToast(result.message || 'Không tạo được mã.', true); return; }
      codeEl.hidden = false;
      codeEl.textContent = result.data.code;
      hintEl.hidden = false;
      hintEl.textContent = 'Mã dùng 1 lần, hết hạn sau 7 ngày. Gửi cho con để con tự nhập ở mục Thêm → Phụ huynh.';
      copyBtn.hidden = false;
      loadParentChildren();
    });
    $('parentInviteCopy').addEventListener('click', async () => {
      const code = $('parentInviteCode').textContent;
      try { await navigator.clipboard.writeText(code); gamToast(`Đã copy mã ${code}`); }
      catch { gamToast(`Mã của bạn: ${code}`); }
    });

    $('parentLinkBtn').addEventListener('click', async () => {
      const code = $('parentLinkCode').value.trim().toUpperCase();
      if (!code) { setParentMessage('Nhập mã 8 ký tự từ phụ huynh.', true); return; }
      setParentMessage('Đang liên kết…');
      const result = await window.LVApi.parentLink(code);
      if (!result.ok) {
        setParentMessage(result.code === 'INVITE_CODE_INVALID' ? 'Mã không đúng, đã dùng hoặc đã hết hạn.' : result.message, true);
        return;
      }
      $('parentLinkCode').value = '';
      setParentMessage(`Đã liên kết với ${result.data.parent.displayName || result.data.parent.username}.`);
      loadParentLinks();
    });

    document.addEventListener('click', async (event) => {
      const dash = event.target.closest('[data-dash]');
      if (dash) { openParentDash(dash.dataset.dash); return; }
      const unlinkChild = event.target.closest('[data-unlink-child]');
      if (unlinkChild) {
        await window.LVApi.parentUnlinkChild(unlinkChild.dataset.unlinkChild);
        gamToast('Đã gỡ liên kết với học viên.');
        loadParentChildren();
        return;
      }
      const unlinkParent = event.target.closest('[data-unlink-parent]');
      if (unlinkParent) {
        await window.LVApi.parentUnlink(unlinkParent.dataset.unlinkParent);
        gamToast('Đã ngừng chia sẻ tiến độ.');
        loadParentLinks();
        return;
      }
      if (event.target.closest('#pdClose')) { shellModal($('parentDashModal'), false); return; }
      const modal = event.target.closest('#parentDashModal');
      if (modal && event.target === modal) shellModal(modal, false);
    });
  }
  bindParentUI();

  window.LVShell = {
    showError, showAudioOffline, syncNow, refreshAccount,
    logActivity, queueAttempt, refreshGamification, habitStats: serverHabitStats,
    // Thi thử TOEIC: nộp bài trên server trả kèm summary — áp luôn để XP/huy hiệu lên tức thì
    isLoggedIn: () => !!gam.user,
    applySummary: applyGamification
  };
})();
