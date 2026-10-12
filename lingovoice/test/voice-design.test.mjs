import test from 'node:test';
import assert from 'node:assert/strict';
import { audioCacheKey, CO_LINH_VOICE_DESIGN, MODEL_BY_LANG, PREFERRED_VOICES } from '../voice.mjs';
import { normalizeTeacherProfile } from '../ai.mjs';

test('Cô Linh dùng voice design OpenVox tự nhiên mặc định', () => {
  assert.equal(CO_LINH_VOICE_DESIGN.version, 'co-linh-v2-natural');
  assert.equal(MODEL_BY_LANG.en, 'supertonic-3');
  assert.equal(PREFERRED_VOICES.en, 'F4');
  assert.equal(MODEL_BY_LANG.vi, 'supertonic-3');
  assert.equal(PREFERRED_VOICES.vi, 'F4');
  assert.equal(CO_LINH_VOICE_DESIGN.en.speed, 0.9);
  assert.equal(CO_LINH_VOICE_DESIGN.en.parameters.temperature, 0.62);
  assert.equal(CO_LINH_VOICE_DESIGN.en.parameters.exaggeration, 0.28);
});

test('profile thiếu cấu hình voice dùng voice design mới', () => {
  const profile = normalizeTeacherProfile({ personality: 'warm' });
  assert.equal(profile.voices.en, 'F4');
  assert.equal(profile.voices.zh, 'zf_xiaoxiao');
  assert.equal(profile.speed, 0.9);
});

test('cache key đổi theo voice design để loại audio cũ', () => {
  const request = { language: 'en', text: 'Hello! Let us practice together.', speed: 0.9 };
  const fresh = audioCacheKey({ ...request, model: 'supertonic-3', voice: 'F4' });
  const old = audioCacheKey({ ...request, model: 'supertonic-3', voice: 'F1' });
  assert.notEqual(fresh, old);
});
