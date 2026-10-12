/* LingoVoice — API client cho tài khoản & đồng bộ (dùng chung, không phụ thuộc framework)
 * Gắn lên window.LVApi. Mọi hàm trả { ok, status, data | code, message }.
 */
(function () {
  'use strict';

  async function call(method, path, body) {
    try {
      const response = await fetch(path, {
        method,
        credentials: 'same-origin',
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
      const isJson = (response.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await response.json().catch(() => ({})) : {};
      if (!response.ok) {
        return { ok: false, status: response.status, code: data.code || `HTTP_${response.status}`, message: data.error || 'Lỗi không xác định' };
      }
      return { ok: true, status: response.status, data };
    } catch (error) {
      return { ok: false, status: 0, code: 'NETWORK', message: 'Không kết nối được máy chủ.' };
    }
  }

  window.LVApi = {
    register: (payload) => call('POST', '/api/auth/register', payload),
    login: (payload) => call('POST', '/api/auth/login', payload),
    logout: () => call('POST', '/api/auth/logout', {}),
    me: () => call('GET', '/api/auth/me'),
    push: (payload) => call('POST', '/api/sync/push', payload),
    pull: () => call('GET', '/api/sync/pull'),
    importLocal: (payload) => call('POST', '/api/sync/import-local', payload),
    // Gamification (roadmap #4)
    activity: (payload) => call('POST', '/api/activity', payload),
    summary: (day) => call('GET', '/api/gamification/summary' + (day ? `?day=${encodeURIComponent(day)}` : '')),
    // Thi thử TOEIC cuối buổi
    toeicSubmit: (payload) => call('POST', '/api/toeic/submit', payload),
    toeicHistory: () => call('GET', '/api/toeic/history'),
    parentInvite: () => call('POST', '/api/parent/invite', {}),
    parentChildren: (day) => call('GET', '/api/parent/children' + (day ? `?day=${encodeURIComponent(day)}` : '')),
    parentDashboard: (childId, day) => call('GET', `/api/parent/children/${encodeURIComponent(childId)}/dashboard` + (day ? `?day=${encodeURIComponent(day)}` : '')),
    parentUnlinkChild: (childId) => call('DELETE', `/api/parent/children/${encodeURIComponent(childId)}`),
    parentLink: (code) => call('POST', '/api/parent/link', { code }),
    parentLinks: () => call('GET', '/api/parent/links'),
    parentUnlink: (parentId) => call('DELETE', `/api/parent/link/${encodeURIComponent(parentId)}`)
  };
})();
