// LingoVoice — VoiceClient (OpenVox proxy) + bộ nhớ cache audio trên đĩa
// Cache giúp mọi audio của bài nghe/đọc được sinh TRƯỚC và phát lại tức thì,
// không phải gọi OpenVox mỗi lần người dùng bấm nghe.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
export const AUDIO_CACHE_DIR = join(ROOT, 'cache', 'audio');
export const AUDIO_MANIFEST_FILE = join(AUDIO_CACHE_DIR, 'manifest.json');

let manifestCache = null;
let manifestWriteQueue = Promise.resolve();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Voice design của Cô Linh: nữ, ấm, hội thoại tự nhiên và hơi chậm để học viên
// nghe rõ từng từ. Version nằm trong cache key để đổi thiết kế sẽ tự sinh WAV mới,
// không phát lại audio robot đã tạo trước đó.
export const CO_LINH_VOICE_DESIGN = {
  version: 'co-linh-v2-natural',
  en: {
    model: 'supertonic-3',
    voice: 'F4',
    speed: 0.9,
    parameters: { temperature: 0.62, top_p: 0.88, repetition_penalty: 1.05, cfg_weight: 1.35, exaggeration: 0.28 }
  },
  zh: {
    model: 'kokoro',
    voice: 'zf_xiaoxiao',
    speed: 0.9,
    parameters: { temperature: 0.62, top_p: 0.88, repetition_penalty: 1.05, cfg_weight: 1.35, exaggeration: 0.28 }
  },
  vi: {
    model: 'supertonic-3',
    voice: 'F4',
    speed: 0.9,
    parameters: { temperature: 0.62, top_p: 0.88, repetition_penalty: 1.05, cfg_weight: 1.35, exaggeration: 0.28 }
  }
};

function defaultVoiceDesign(language) {
  return CO_LINH_VOICE_DESIGN[language] || {};
}

function normalizeVoiceParameters(language, params = {}) {
  return { ...defaultVoiceDesign(language).parameters, ...params };
}

// Model theo ngôn ngữ (OpenVox có model hỗ trợ tiếng khác nhau):
//   - English -> supertonic-3 (giọng tự nhiên, nhiều voice)
//   - 中文     -> kokoro (có giọng tiếng Trung: zf_/zm_)
// Đổi bằng env OPENVOX_EN_MODEL / OPENVOX_ZH_MODEL.
export const MODEL_BY_LANG = {
  en: process.env.OPENVOX_EN_MODEL || CO_LINH_VOICE_DESIGN.en.model,
  zh: process.env.OPENVOX_ZH_MODEL || CO_LINH_VOICE_DESIGN.zh.model,
  vi: process.env.OPENVOX_VI_MODEL || CO_LINH_VOICE_DESIGN.vi.model
};
export const PREFERRED_VOICES = {
  en: process.env.OPENVOX_EN_VOICE || CO_LINH_VOICE_DESIGN.en.voice,
  zh: process.env.OPENVOX_ZH_VOICE || CO_LINH_VOICE_DESIGN.zh.voice,
  vi: process.env.OPENVOX_VI_VOICE || CO_LINH_VOICE_DESIGN.vi.voice
};
export const OPENVOX_API = (process.env.OPENVOX_API || 'http://127.0.0.1:8000/v1').replace(/\/$/, '');

// ---- Cache audio (key gồm ngôn ngữ + model + giọng + văn bản; speed khi != 1) ----
export function audioCacheKey({ language, text, model, voice, speed, params }) {
  const normalizedSpeed = Number(speed) || defaultVoiceDesign(language).speed || 1;
  const normalizedParams = normalizeVoiceParameters(language, params);
  return createHash('sha256')
    .update(`${CO_LINH_VOICE_DESIGN.version}|${language}|${model || ''}|${voice || ''}|${String(text || '').trim()}|${normalizedSpeed}|${JSON.stringify(normalizedParams)}`)
    .digest('hex');
}
export function audioCachePath(key) {
  return join(AUDIO_CACHE_DIR, `${key}.wav`);
}
export function preparedRequestKey({ language, text, model, voice, speed, params }) {
  const normalizedSpeed = Number(speed) || defaultVoiceDesign(language).speed || 1;
  const normalizedParams = normalizeVoiceParameters(language, params);
  return createHash('sha256')
    .update(`${CO_LINH_VOICE_DESIGN.version}|${language}|${String(model || '')}|${String(voice || '')}|${normalizedSpeed}|${JSON.stringify(normalizedParams)}|${String(text || '').trim()}`)
    .digest('hex');
}
export function hasCachedAudio(key) {
  return existsSync(audioCachePath(key));
}
export async function readCachedAudio(key) {
  return readFile(audioCachePath(key));
}
export async function writeCachedAudio(key, buffer) {
  await mkdir(AUDIO_CACHE_DIR, { recursive: true });
  await writeFile(audioCachePath(key), buffer);
}
async function loadAudioManifest() {
  if (manifestCache) return manifestCache;
  try {
    const parsed = JSON.parse(await readFile(AUDIO_MANIFEST_FILE, 'utf8'));
    manifestCache = parsed && typeof parsed === 'object' ? parsed : { version: 1, entries: {} };
  } catch {
    manifestCache = { version: 1, entries: {} };
  }
  if (!manifestCache.entries || typeof manifestCache.entries !== 'object') manifestCache.entries = {};
  return manifestCache;
}
async function persistAudioManifest() {
  await mkdir(AUDIO_CACHE_DIR, { recursive: true });
  const temp = `${AUDIO_MANIFEST_FILE}.tmp`;
  await writeFile(temp, JSON.stringify(manifestCache, null, 2));
  await rename(temp, AUDIO_MANIFEST_FILE);
}
export async function rememberPreparedAudio(request, resolved) {
  const requestKey = preparedRequestKey(request);
  const manifest = await loadAudioManifest();
  const current = manifest.entries[requestKey];
  if (current?.key === resolved.key && hasCachedAudio(resolved.key)) return current;
  const entry = {
    key: resolved.key,
    language: request.language,
    text: String(request.text || '').trim(),
    requestedModel: request.model || null,
    requestedVoice: request.voice || null,
    speed: Number(request.speed) || defaultVoiceDesign(request.language).speed || 1,
    designVersion: CO_LINH_VOICE_DESIGN.version,
    parameters: normalizeVoiceParameters(request.language, request.params),
    model: resolved.model || null,
    voice: resolved.voice || null,
    updatedAt: new Date().toISOString()
  };
  manifest.entries[requestKey] = entry;
  manifest.updatedAt = entry.updatedAt;
  manifestWriteQueue = manifestWriteQueue.then(persistAudioManifest, persistAudioManifest);
  await manifestWriteQueue;
  return entry;
}
export async function readPreparedAudio(request) {
  const manifest = await loadAudioManifest();
  const entry = manifest.entries[preparedRequestKey(request)];
  if (!entry || !hasCachedAudio(entry.key)) return null;
  return { entry, audio: await readCachedAudio(entry.key) };
}
export async function preparedAudioStats() {
  const manifest = await loadAudioManifest();
  const entries = Object.values(manifest.entries);
  return {
    entries: entries.length,
    available: entries.filter((entry) => entry?.key && hasCachedAudio(entry.key)).length,
    updatedAt: manifest.updatedAt || null
  };
}
export async function prepareCachedAudio({ text, language, voice, model, speed, params }) {
  const design = defaultVoiceDesign(language);
  const request = { text, language, voice, model, speed, params };
  const resolvedModel = model || MODEL_BY_LANG[language] || design.model;
  const resolvedVoice = voice || PREFERRED_VOICES[language] || design.voice;
  const resolvedSpeed = Number(speed) || design.speed || 1;
  if (!resolvedModel || !resolvedVoice) return null;
  const key = audioCacheKey({ language, text, model: resolvedModel, voice: resolvedVoice, speed: resolvedSpeed, params });
  if (!hasCachedAudio(key)) return null;
  await rememberPreparedAudio(request, { key, model: resolvedModel, voice: resolvedVoice });
  return { key, model: resolvedModel, language, voice: resolvedVoice, speed: resolvedSpeed, cached: true };
}
export async function cachedAudioStats() {
  if (!existsSync(AUDIO_CACHE_DIR)) return { files: 0, bytes: 0 };
  const { readdir, stat } = await import('node:fs/promises');
  const files = (await readdir(AUDIO_CACHE_DIR)).filter((file) => file.endsWith('.wav'));
  let bytes = 0;
  for (const f of files) { try { bytes += (await stat(join(AUDIO_CACHE_DIR, f))).size; } catch {} }
  return { files: files.length, bytes };
}

// ---- VoiceClient: khám phá model + synth (tuân hợp đồng OpenVox) ----
export class VoiceClient {
  constructor(apiBase = OPENVOX_API) {
    this.apiBase = apiBase;
    this.models = null;
    this.languagesCache = new Map();
    this.voicesCache = new Map();
    this.warmed = new Set();
  }

  async json(path, options = {}, retries = 4) {
    let lastError;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(`${this.apiBase}${path}`, options);
        if (res.status === 429) {
          lastError = new Error('OpenVox rate limited (429)');
          await sleep(700 * (attempt + 1));
          continue;
        }
        if (res.status === 503) throw Object.assign(new Error('OpenVox unavailable'), { statusCode: 503 });
        if (!res.ok) throw new Error(`${path} returned ${res.status}`);
        return await res.json();
      } catch (error) {
        lastError = error;
        if (typeof lastError.statusCode !== 'number') lastError.statusCode = 503;
        await sleep(300 * (attempt + 1));
      }
    }
    throw lastError;
  }

  async discoverModels() {
    if (!this.models) {
      const data = await this.json('/models');
      this.models = (data.data || []).map((m) => ({
        id: m.id,
        name: m.display_name || m.id,
        streaming: Boolean(m.supports_streaming),
        voices: m.voice_count ?? 0
      }));
    }
    return this.models;
  }

  async warm(model) {
    if (this.warmed.has(model)) return;
    await this.json(`/models/${encodeURIComponent(model)}/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    this.warmed.add(model);
  }

  async languages(model) {
    if (!this.languagesCache.has(model)) {
      const data = await this.json(`/models/${encodeURIComponent(model)}/languages`);
      this.languagesCache.set(model, (data.data || []).map((l) => ({ id: l.id, name: l.name })));
    }
    return this.languagesCache.get(model);
  }

  async voices(model, language) {
    const key = `${model}|${language}`;
    if (!this.voicesCache.has(key)) {
      const data = await this.json(`/models/${encodeURIComponent(model)}/voices?language=${encodeURIComponent(language)}`);
      this.voicesCache.set(key, (data.data || []).map((v) => v.id));
    }
    return this.voicesCache.get(key);
  }

  async resolveModel(requested) {
    const models = await this.discoverModels();
    if (!models.length) throw Object.assign(new Error('OpenVox has no models'), { statusCode: 503 });
    return models.some((m) => m.id === requested) ? requested : models[0].id;
  }

  // Chọn model hỗ trợ ngôn ngữ: ưu tiên requested -> model mặc định theo ngôn ngữ -> model đầu tiên có ngôn ngữ đó
  async resolveModelFor(language, requested) {
    const models = await this.discoverModels();
    if (!models.length) throw Object.assign(new Error('OpenVox has no models'), { statusCode: 503 });
    const ids = models.map((m) => m.id);
    const supports = async (id) => (await this.languages(id)).some((l) => l.id === language);
    if (requested && ids.includes(requested) && await supports(requested)) return requested;
    const defaultId = MODEL_BY_LANG[language];
    if (defaultId && ids.includes(defaultId) && await supports(defaultId)) return defaultId;
    for (const id of ids) { if (await supports(id)) return id; }
    throw Object.assign(new Error(`No OpenVox model supports language "${language}"`), { statusCode: 503 });
  }

  async resolveVoice(model, language, requested) {
    const voices = await this.voices(model, language);
    if (!voices.length) throw Object.assign(new Error(`No voices for ${model}/${language}`), { statusCode: 503 });
    if (requested && voices.includes(requested)) return requested;
    const preferred = PREFERRED_VOICES[language];
    if (preferred && voices.includes(preferred)) return preferred;
    return voices[0];
  }

  // Sinh audio qua OpenVox (không cache). speakWithCache() sẽ kiểm tra cache trước.
  async synthesize({ text, language, voice, model, speed, params = {} }) {
    const modelId = await this.resolveModelFor(language, model); // model đúng ngôn ngữ
    await this.warm(modelId);
    const langs = await this.languages(modelId);
    if (!langs.some((l) => l.id === language)) {
      throw Object.assign(new Error(`Model ${modelId} does not support language "${language}"`), { statusCode: 400 });
    }
    const chosenVoice = await this.resolveVoice(modelId, language, voice);
    const body = {
      model: modelId,
      input: text,
      language,
      voice: chosenVoice,
      response_format: 'wav',
      parameters: {
        speed: Number(speed) || defaultVoiceDesign(language).speed || 1.0,
        temperature: params.temperature !== undefined ? Number(params.temperature) : normalizeVoiceParameters(language).temperature,
        top_p: params.top_p !== undefined ? Number(params.top_p) : normalizeVoiceParameters(language).top_p
      }
    };
    for (const k of ['repetition_penalty', 'cfg_weight', 'exaggeration']) {
      const value = normalizeVoiceParameters(language, params)[k];
      if (value !== undefined) body.parameters[k] = Number(value);
    }
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(`${this.apiBase}/audio/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.status === 429) { await sleep(800 * (attempt + 1)); continue; }
      break;
    }
    if (!response.ok) throw Object.assign(new Error(`OpenVox speech returned ${response.status}`), { statusCode: 503 });
    const audio = Buffer.from(await response.arrayBuffer());
    if (!audio.length) throw new Error('OpenVox returned empty audio');
    return { audio, model: modelId, language, voice: chosenVoice };
  }

  // Stream TTS: mở SSE của OpenVox, trả về ReadableStream để proxy từng chunk.
  // (theo hợp đồng: POST /audio/speech với stream:true, không kèm response_format)
  async synthesizeStream({ text, language, voice, model, speed, params = {} }) {
    const modelId = await this.resolveModelFor(language, model);
    await this.warm(modelId);
    const langs = await this.languages(modelId);
    if (!langs.some((l) => l.id === language)) {
      throw Object.assign(new Error(`Model ${modelId} does not support language "${language}"`), { statusCode: 400 });
    }
    const chosenVoice = await this.resolveVoice(modelId, language, voice);
    const body = {
      model: modelId,
      input: text,
      language,
      voice: chosenVoice,
      stream: true,
      parameters: { speed: Number(speed) || defaultVoiceDesign(language).speed || 1.0, ...normalizeVoiceParameters(language, params) }
    };
    const response = await fetch(`${this.apiBase}/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw Object.assign(new Error(`OpenVox stream returned ${response.status}`), { statusCode: 503 });
    return { stream: response.body, model: modelId, voice: chosenVoice };
  }

  async status() {
    let models = [];
    let error = null;
    try {
      models = await this.discoverModels();
      const enModel = await this.resolveModelFor('en', null).catch(() => null);
      const zhModel = await this.resolveModelFor('zh', null).catch(() => null);
      const enVoice = enModel ? await this.resolveVoice(enModel, 'en', null).catch(() => null) : null;
      const zhVoice = zhModel ? await this.resolveVoice(zhModel, 'zh', null).catch(() => null) : null;
      return {
        available: true,
        api: this.apiBase,
        activeModel: { en: enModel, zh: zhModel },
        defaultVoices: { en: enVoice, zh: zhVoice },
        models,
        cache: await cachedAudioStats()
      };
    } catch (e) {
      error = e.message;
    }
    return { available: false, api: this.apiBase, models, error };
  }

  async options() {
    const result = {};
    for (const language of ['en', 'zh']) {
      const model = await this.resolveModelFor(language, null);
      const voices = await this.voices(model, language);
      const defaultVoice = await this.resolveVoice(model, language, null);
      result[language] = { model, defaultVoice, voices };
    }
    return result;
  }
}

// Kiểm tra cache trước; chỉ gọi OpenVox khi thiếu -> lưu lại để lần sau tức thì.
// Key cache gồm ngôn ngữ + model + giọng + văn bản để đổi model/giọng là sinh mới.
export async function speakWithCache(client, { text, language, voice, model, speed, params }) {
  const request = { text, language, voice, model, speed, params };
  // Backfill manifest không cần OpenVox: cache mặc định có key deterministic từ env.
  // Nhờ đó admin vẫn kích hoạt được WAV đã có khi dịch vụ synth đang tạm dừng.
  const prepared = await prepareCachedAudio(request);
  if (prepared) {
    return { ...prepared, audio: await readCachedAudio(prepared.key), cached: true };
  }
  const modelId = await client.resolveModelFor(language, model);
  const chosenVoice = await client.resolveVoice(modelId, language, voice);
  const key = audioCacheKey({ language, text, model: modelId, voice: chosenVoice, speed, params });
  if (hasCachedAudio(key)) {
    const audio = await readCachedAudio(key);
    await rememberPreparedAudio(request, { key, model: modelId, voice: chosenVoice });
    return { audio, cached: true, key, model: modelId, language, voice: chosenVoice };
  }
  const result = await client.synthesize({ text, language, voice: chosenVoice, model: modelId, speed, params });
  await writeCachedAudio(key, result.audio);
  await rememberPreparedAudio(request, { key, model: result.model, voice: result.voice });
  return { ...result, cached: false, key };
}
