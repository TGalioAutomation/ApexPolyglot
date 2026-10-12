import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { auditFile } from './scripts/audit-vocab.mjs';
import { collectContent, pregenAll } from './pregen.mjs';
import { CONTENT_TYPES, validLang, validateContentInput, rowToAdminItem, buildContentId } from './db/content-map.mjs';
import { generateReadingDraft, generateLessonDraft, generateRoleplayDraft } from './ai.mjs';
import { seedContent } from './scripts/seed-content.mjs';
import { cachedAudioStats, preparedAudioStats } from './voice.mjs';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const MAX_JOBS = 30;

function statusError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

function safeJob(job) {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt || null,
    finishedAt: job.finishedAt || null,
    progress: job.progress || null,
    result: job.result || null,
    error: job.error || null,
    logs: (job.logs || []).slice(-30)
  };
}

export class AdminService {
  constructor({ root, voiceStatus, aiStatus }) {
    this.root = root;
    this.voiceStatus = voiceStatus;
    this.aiStatus = aiStatus;
    this.store = null; // server gán sau khi initializeStore (roadmap #2: pregen quét cả nội dung DB)
    this.jobs = [];
    this.activeJob = null;
  }

  vocabPath(language) {
    const lang = language === 'zh' ? 'zh' : 'en';
    return join(this.root, 'data', `vocab-${lang}.json`);
  }

  async auditData() {
    const reports = await Promise.all(['en', 'zh'].map(async (language) => {
      try {
        return await auditFile(new URL(`./data/vocab-${language}.json`, `file://${this.root}/`), language);
      } catch (error) {
        return { language, total: 0, reviewed: 0, levels: Object.fromEntries(LEVELS.map((level) => [level, 0])), errors: [error.message] };
      }
    }));
    return { ok: reports.every((report) => report.errors.length === 0), reports, checkedAt: new Date().toISOString() };
  }

  async learnerStats() {
    const file = join(this.root, 'data', 'learner-memory.json');
    if (!existsSync(file)) return { learners: 0, updatedAt: null };
    try {
      const [data, info] = await Promise.all([readFile(file, 'utf8'), stat(file)]);
      return { learners: Object.keys(JSON.parse(data)).length, updatedAt: info.mtime.toISOString() };
    } catch (error) {
      return { learners: 0, updatedAt: null, error: error.message };
    }
  }

  async overview() {
    const catalog = await collectContent({ store: this.store });
    const byLanguage = catalog.reduce((counts, item) => {
      counts[item.lang] = (counts[item.lang] || 0) + 1;
      return counts;
    }, { en: 0, zh: 0 });
    const [data, audio, prepared, voice, learners] = await Promise.all([
      this.auditData(),
      cachedAudioStats(),
      preparedAudioStats(),
      this.voiceStatus(),
      this.learnerStats()
    ]);
    return {
      generatedAt: new Date().toISOString(),
      deliveryMode: 'prepared-only',
      services: { server: 'ready', voice, ai: this.aiStatus() },
      catalog: { audioTargets: catalog.length, byLanguage },
      audio: { ...audio, prepared },
      data,
      learners,
      jobs: this.listJobs()
    };
  }

  listJobs() {
    return this.jobs.slice(0, MAX_JOBS).map(safeJob);
  }

  getJob(id) {
    const job = this.jobs.find((item) => item.id === id);
    if (!job) throw statusError('job not found', 404);
    return safeJob(job);
  }

  startJob(type, runner) {
    if (this.activeJob && ['queued', 'running'].includes(this.activeJob.status)) {
      throw statusError(`job ${this.activeJob.id} is already running`, 409);
    }
    const job = {
      id: randomUUID(), type, status: 'queued', createdAt: new Date().toISOString(),
      progress: { current: 0, total: 0 }, logs: []
    };
    this.jobs.unshift(job);
    this.jobs = this.jobs.slice(0, MAX_JOBS);
    this.activeJob = job;
    queueMicrotask(async () => {
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      try {
        job.result = await runner(job);
        job.status = 'completed';
      } catch (error) {
        job.error = error.message;
        job.status = 'failed';
      } finally {
        job.finishedAt = new Date().toISOString();
        if (this.activeJob === job) this.activeJob = null;
      }
    });
    return safeJob(job);
  }

  startPregen(options = {}) {
    const speed = Math.min(1.15, Math.max(0.75, Number(options.speed) || 1));
    const safeVoice = (value) => typeof value === 'string' && /^[\w.-]{1,80}$/.test(value) ? value : undefined;
    return this.startJob('audio-pregen', async (job) => {
      const voice = await this.voiceStatus();
      const cacheOnly = !voice.available;
      if (cacheOnly) job.logs.push('OpenVox chưa sẵn sàng: chỉ lập chỉ mục các file WAV đã có.');
      return pregenAll({
        store: this.store,
        silent: true,
        voiceEn: safeVoice(options.voiceEn),
        voiceZh: safeVoice(options.voiceZh),
        speed,
        cacheOnly,
        onProgress: (progress) => { job.progress = progress; }
      });
    });
  }

  startAudit() {
    return this.startJob('data-audit', async (job) => {
      job.progress = { current: 0, total: 2 };
      const result = await this.auditData();
      job.progress = { current: 2, total: 2 };
      if (!result.ok) throw new Error(result.reports.flatMap((report) => report.errors).slice(0, 4).join('; '));
      return result;
    });
  }

  startVocabPreparation({ language, limit }) {
    const lang = language === 'zh' ? 'zh' : 'en';
    const safeLimit = Math.min(200, Math.max(1, Number(limit) || 20));
    return this.startJob('vocab-prepare', (job) => new Promise((resolve, reject) => {
      job.progress = { current: 0, total: safeLimit };
      const child = spawn(process.execPath, ['scripts/prep-vocab.mjs', '--lang', lang, '--limit', String(safeLimit)], {
        cwd: this.root,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      const capture = (chunk) => {
        const lines = String(chunk).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        job.logs.push(...lines);
        job.logs = job.logs.slice(-60);
        const latest = [...lines].reverse().map((line) => line.match(/\[(\d+)\/(\d+)\]/)).find(Boolean);
        if (latest) job.progress = { current: Number(latest[1]), total: Number(latest[2]) };
      };
      child.stdout.on('data', capture);
      child.stderr.on('data', capture);
      child.once('error', reject);
      child.once('exit', (code) => code === 0
        ? resolve({ language: lang, limit: safeLimit, message: 'Kho từ đã được chuẩn bị.' })
        : reject(new Error(`prep-vocab exited with code ${code}`)));
    }));
  }

  // ---- CMS nội dung (roadmap #2) ----
  requireStore() {
    if (!this.store) throw statusError('PostgreSQL chưa bật (thiếu DATABASE_URL).', 503, 'DB_UNAVAILABLE');
  }

  checkType(type) {
    if (!CONTENT_TYPES.includes(type)) throw statusError('type phải là lessons|readings|roleplay', 400, 'TYPE_INVALID');
    return type;
  }

  async toAdminItem(type, id) {
    const got = await this.store.getContent(type, id);
    if (!got) throw statusError('content item not found', 404, 'CONTENT_NOT_FOUND');
    const extras = type === 'lessons'
      ? { sentences: got.items.map((i) => ({ id: i.payload && i.payload.id, text: i.payload && i.payload.text, vi: i.payload && i.payload.vi, pinyin: i.payload && i.payload.pinyin })) }
      : {};
    return rowToAdminItem(type, got.row, extras);
  }

  async listContent({ type, language, status }) {
    this.requireStore();
    this.checkType(type);
    const lang = validLang(language);
    const st = ['draft', 'reviewed'].includes(status) ? status : null;
    const { rows, items } = await this.store.listContent(type, { lang, status: st });
    return {
      type,
      items: rows.map((row) => rowToAdminItem(type, row, {
        sentences: type === 'lessons'
          ? items.filter((i) => i.lesson_id === row.id).map((i) => ({ id: i.payload && i.payload.id, text: i.payload && i.payload.text, vi: i.payload && i.payload.vi, pinyin: i.payload && i.payload.pinyin }))
          : []
      }))
    };
  }

  // Tạo tay (không id) hoặc cập nhật (có id) — payload đã validate ở route
  async saveContent({ type, id, payload }) {
    this.requireStore();
    this.checkType(type);
    const check = validateContentInput(type, payload);
    if (!check.ok) throw statusError(check.error, 400, check.error);
    let rowId = id;
    let lang;
    let status = 'draft';
    if (id) {
      const got = await this.store.getContent(type, id);
      if (!got) throw statusError('content item not found', 404, 'CONTENT_NOT_FOUND');
      lang = got.row.lang;
      status = got.row.status;
    } else {
      lang = validLang(payload.lang);
      if (!lang) throw statusError('lang phải là en hoặc zh', 400, 'LANG_INVALID');
      rowId = await this.uniqueContentId(type, lang, type === 'lessons' ? check.value.topic : check.value.title);
    }
    await this.store.upsertContent(type, { id: rowId, lang, status, ...check.value });
    return this.toAdminItem(type, rowId);
  }

  async uniqueContentId(type, lang, base) {
    let id = buildContentId(type, lang, base);
    for (let i = 0; i < 4; i++) {
      if (!(await this.store.getContent(type, id))) return id;
      id = `${buildContentId(type, lang, base)}-${Math.random().toString(36).slice(2, 6)}`;
    }
    throw statusError('không cấp được id nội dung', 500, 'ID_ALLOC_FAILED');
  }

  async aiDraft({ type, language, level, topic, theme }) {
    this.requireStore();
    this.checkType(type);
    const lang = validLang(language);
    if (!lang) throw statusError('lang phải là en hoặc zh', 400, 'LANG_INVALID');
    const gens = { readings: generateReadingDraft, lessons: generateLessonDraft, roleplay: generateRoleplayDraft };
    let draft;
    try {
      draft = await gens[type]({ lang, level, topic, theme });
    } catch (error) {
      if (error.code === 'NO_AI') throw statusError('Chưa cấu hình AI.', 503, 'NO_AI');
      throw statusError(`AI lỗi: ${error.message}`, 502, 'AI_ERROR');
    }
    const id = await this.uniqueContentId(type, lang, type === 'lessons' ? draft.value.topic : draft.value.title);
    await this.store.upsertContent(type, { id, lang, status: 'draft', provider: draft.provider, model: draft.model, ...draft.value });
    return this.toAdminItem(type, id);
  }

  async reviewContent({ type, id, reviewed }) {
    this.requireStore();
    this.checkType(type);
    if (typeof id !== 'string' || !id.trim()) throw statusError('id is required', 400, 'ID_REQUIRED');
    if (typeof reviewed !== 'boolean') throw statusError('reviewed must be boolean', 400, 'REVIEWED_INVALID');
    const row = await this.store.setContentStatus(type, id, reviewed ? 'reviewed' : 'draft');
    if (!row) throw statusError('content item not found', 404, 'CONTENT_NOT_FOUND');
    return this.toAdminItem(type, id);
  }

  async deleteContentItem({ type, id }) {
    this.requireStore();
    this.checkType(type);
    if (typeof id !== 'string' || !id.trim()) throw statusError('id is required', 400, 'ID_REQUIRED');
    const ok = await this.store.deleteContent(type, id);
    if (!ok) throw statusError('content item not found', 404, 'CONTENT_NOT_FOUND');
    return { ok: true };
  }

  startContentSeed() {
    this.requireStore();
    return this.startJob('content-seed', async (job) => {
      job.progress = { current: 0, total: 3 };
      const stats = await seedContent(this.store, { logger: { log: (m) => { job.logs.push(m); job.logs = job.logs.slice(-60); } } });
      job.progress = { current: 3, total: 3 };
      return { message: 'Đã nạp nội dung gốc vào DB (reviewed).', stats };
    });
  }

  async listVocab({ language, query = '', level = '', limit = 100 }) {
    const lang = language === 'zh' ? 'zh' : 'en';
    const data = JSON.parse(await readFile(this.vocabPath(lang), 'utf8'));
    const term = String(query).trim().toLocaleLowerCase(lang === 'zh' ? 'zh-CN' : 'en-US');
    const cefr = LEVELS.includes(level) ? level : '';
    const safeLimit = Math.min(250, Math.max(1, Number(limit) || 100));
    const filtered = (data.items || []).filter((item) => {
      if (cefr && item.cefr !== cefr) return false;
      if (!term) return true;
      return `${item.term || ''} ${item.meaning || ''}`.toLocaleLowerCase(lang === 'zh' ? 'zh-CN' : 'en-US').includes(term);
    });
    return { language: lang, total: filtered.length, items: filtered.slice(0, safeLimit) };
  }

  async setVocabReviewed({ language, id, reviewed }) {
    const lang = language === 'zh' ? 'zh' : 'en';
    const safeId = typeof id === 'string' ? id.trim() : '';
    if (!safeId) throw statusError('id is required', 400, 'ID_REQUIRED');
    if (typeof reviewed !== 'boolean') throw statusError('reviewed must be boolean', 400, 'REVIEWED_INVALID');
    const file = this.vocabPath(lang);
    const data = JSON.parse(await readFile(file, 'utf8'));
    const item = (data.items || []).find((entry) => entry.id === safeId);
    if (!item) throw statusError('vocab item not found', 404);
    item.reviewed = reviewed;
    data.updatedAt = new Date().toISOString();
    const temp = `${file}.tmp`;
    await writeFile(temp, JSON.stringify(data, null, 2));
    await rename(temp, file);
    return { id: item.id, language: lang, reviewed: item.reviewed, updatedAt: data.updatedAt };
  }
}
