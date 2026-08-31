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
    importLocal: (payload) => call('POST', '/api/sync/import-local', payload)
  };
})();
