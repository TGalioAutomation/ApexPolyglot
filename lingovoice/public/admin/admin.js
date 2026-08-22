'use strict';

const $ = (selector) => document.querySelector(selector);
const state = { overview: null, jobs: [], pollTimer: null };

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}
function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}
function formatTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value));
}
function notify(message, error = false) {
  const toast = $('#toast');
  toast.textContent = message; toast.classList.toggle('error', error); toast.classList.add('show');
  clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove('show'), 3500);
}
async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || `HTTP ${response.status}`), { status: response.status, data });
  return data;
}
function setConnection(ok, text) {
  const el = $('#liveState'); el.classList.toggle('error', !ok); el.querySelector('span').textContent = text;
}
function renderOverview(data) {
  state.overview = data;
  $('#updatedAt').textContent = formatTime(data.generatedAt);
  $('#audioFiles').textContent = new Intl.NumberFormat('vi-VN').format(data.audio.files || 0);
  $('#audioBytes').textContent = formatBytes(data.audio.bytes);
  $('#preparedAudio').textContent = new Intl.NumberFormat('vi-VN').format(data.audio.prepared.available || 0);
  $('#audioCoverage').textContent = `${data.catalog.audioTargets} nội dung mục tiêu`;
  const reports = data.data.reports || [];
  $('#vocabTotal').textContent = new Intl.NumberFormat('vi-VN').format(reports.reduce((sum, report) => sum + report.total, 0));
  $('#reviewedTotal').textContent = `${reports.reduce((sum, report) => sum + report.reviewed, 0)} đã kiểm duyệt`;
  $('#learnerTotal').textContent = new Intl.NumberFormat('vi-VN').format(data.learners.learners || 0);

  const voice = data.services.voice || {};
  const ai = data.services.ai || {};
  $('#serviceList').innerHTML = [
    ['Node server', 'Sẵn sàng', 'Control plane và API đang phản hồi', true],
    ['Kho audio', `${data.audio.prepared.available || 0} manifest`, `${data.audio.files || 0} WAV · chế độ prepared-only`, (data.audio.prepared.available || 0) > 0],
    ['OpenVox', voice.available ? 'Sẵn sàng' : 'Gián đoạn', voice.available ? `${voice.activeModel?.en || 'EN'} / ${voice.activeModel?.zh || 'ZH'}` : (voice.error || 'Không kết nối'), Boolean(voice.available)],
    ['AI nội dung', ai.configured ? 'Đã cấu hình' : 'Chưa cấu hình', ai.providers?.length ? ai.providers.join(', ') : 'Cần provider để tạo dữ liệu mới', Boolean(ai.configured)]
  ].map(([name, status, detail, ok]) => `<div class="service-row"><div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(detail)}</small></div><span class="state${ok ? '' : ' warn'}">${escapeHtml(status)}</span></div>`).join('');

  $('#datasetGrid').innerHTML = reports.map((report) => `<div class="dataset-card"><header><span>${report.language === 'zh' ? '中文' : 'English'}</span><strong>${report.total}</strong></header><p>${report.reviewed} reviewed · ${report.errors.length ? `${report.errors.length} lỗi` : 'schema hợp lệ'}</p><div class="level-strip">${Object.entries(report.levels).map(([level, count]) => `<span title="${level}: ${count}">${level} ${count}</span>`).join('')}</div></div>`).join('');
  renderJobs(data.jobs || []);
}
function renderJobs(jobs) {
  state.jobs = jobs;
  $('#jobCount').textContent = `${jobs.length} job`;
  const root = $('#jobList');
  if (!jobs.length) { root.innerHTML = '<p class="empty">Chưa có công việc.</p>'; return; }
  root.innerHTML = jobs.map((job) => {
    const current = Number(job.progress?.current || 0), total = Number(job.progress?.total || 0);
    const percent = total ? Math.min(100, Math.round(current / total * 100)) : (job.status === 'completed' ? 100 : 0);
    const detail = job.error || job.logs?.at(-1) || (total ? `${current}/${total}` : 'Đang chuẩn bị…');
    return `<div class="job-item"><div class="job-title"><strong>${escapeHtml(job.type)}</strong><small>${escapeHtml(job.id)}</small></div><div class="job-detail"><div class="progress" aria-label="Tiến độ ${percent}%"><i style="--progress:${percent}%"></i></div><small>${escapeHtml(detail)}</small></div><span class="job-status ${job.status === 'failed' ? 'failed' : ''}">${escapeHtml(job.status)}</span></div>`;
  }).join('');
}
async function loadOverview({ quiet = false } = {}) {
  try {
    const data = await api('/api/admin/overview'); renderOverview(data); setConnection(true, 'Đã đồng bộ');
    if (!quiet) notify('Đã cập nhật dashboard.');
    schedulePolling();
  } catch (error) { setConnection(false, 'Mất kết nối'); if (!quiet) notify(error.message, true); }
}
async function loadJobs() {
  try { const data = await api('/api/admin/jobs'); renderJobs(data.jobs || []); schedulePolling(); }
  catch (error) { setConnection(false, 'Mất kết nối'); }
}
function schedulePolling() {
  clearTimeout(state.pollTimer);
  if (document.hidden || !state.jobs.some((job) => ['queued', 'running'].includes(job.status))) return;
  state.pollTimer = setTimeout(loadJobs, 1500);
}
async function runJob(button, path, body, success) {
  button.disabled = true; button.setAttribute('aria-busy', 'true');
  try {
    const job = await api(path, { method: 'POST', body: JSON.stringify(body || {}) });
    state.jobs.unshift(job); renderJobs(state.jobs); notify(success); schedulePolling();
  } catch (error) { notify(error.status === 409 ? 'Đang có một job khác chạy. Hãy chờ hoàn tất.' : error.message, true); }
  finally { button.disabled = false; button.removeAttribute('aria-busy'); }
}
async function loadVocab() {
  const params = new URLSearchParams({ language: $('#vocabLanguage').value, level: $('#vocabLevel').value, query: $('#vocabQuery').value, limit: '150' });
  try {
    const data = await api(`/api/admin/vocab?${params}`);
    $('#vocabResultCount').textContent = `${data.total} mục`;
    $('#vocabRows').innerHTML = data.items.map((item) => `<tr><td data-label="Từ/cụm">${escapeHtml(item.term)}</td><td data-label="Nghĩa">${escapeHtml(item.meaning)}</td><td data-label="CEFR">${escapeHtml(item.cefr)}</td><td data-label="Ví dụ">${escapeHtml(item.example)}</td><td data-label="Kiểm duyệt"><button type="button" class="review-toggle" data-id="${escapeHtml(item.id)}" data-language="${escapeHtml(data.language)}" aria-pressed="${Boolean(item.reviewed)}">${item.reviewed ? 'Đã duyệt' : 'Chưa duyệt'}</button></td></tr>`).join('');
  } catch (error) { notify(error.message, true); }
}

$('#refreshAll').addEventListener('click', () => loadOverview());
$('#runPregen').addEventListener('click', (event) => runJob(event.currentTarget, '/api/admin/jobs/pregen', { voiceEn: $('#voiceEn').value, voiceZh: $('#voiceZh').value, speed: Number($('#audioSpeed').value) }, 'Đã bắt đầu đảm bảo kho audio.'));
$('#runAudit').addEventListener('click', (event) => runJob(event.currentTarget, '/api/admin/jobs/audit', {}, 'Đã bắt đầu kiểm tra dữ liệu.'));
$('#runVocabPrep').addEventListener('click', (event) => runJob(event.currentTarget, '/api/admin/jobs/vocab', { language: $('#prepLanguage').value, limit: Number($('#prepLimit').value) }, 'Đã bắt đầu chuẩn bị từ vựng.'));
$('#vocabFilters').addEventListener('submit', (event) => { event.preventDefault(); loadVocab(); });
$('#vocabRows').addEventListener('click', async (event) => {
  const button = event.target.closest('.review-toggle'); if (!button) return;
  const reviewed = button.getAttribute('aria-pressed') !== 'true'; button.disabled = true;
  try {
    await api('/api/admin/vocab/review', { method: 'POST', body: JSON.stringify({ language: button.dataset.language, id: button.dataset.id, reviewed }) });
    button.setAttribute('aria-pressed', String(reviewed)); button.textContent = reviewed ? 'Đã duyệt' : 'Chưa duyệt'; notify('Đã cập nhật trạng thái kiểm duyệt.');
  } catch (error) { notify(error.message, true); }
  finally { button.disabled = false; }
});
document.addEventListener('visibilitychange', schedulePolling);

loadOverview({ quiet: true });
loadVocab();
