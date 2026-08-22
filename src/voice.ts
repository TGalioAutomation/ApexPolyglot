import { loadConfig } from './config.js';

const config = loadConfig();

export interface OpenVoxSelection { model: string; language: string; voice: string }
export interface OpenVoxSpeech { audio: Buffer; model: string; language: string; voice: string }

class OpenVoxError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.statusCode = 503;
  }
}

async function openvoxJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${config.openvoxApi}${path}`, options);
  if (!response.ok) throw new OpenVoxError(`OpenVox returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function discoverOpenVox(language: string): Promise<OpenVoxSelection> {
  const models = await openvoxJson<{ data?: { id: string }[] }>('/models');
  const preferred = process.env.OPENVOX_MODEL || 'kokoro';
  const model = models.data?.find((item) => item.id === preferred) || models.data?.[0];
  if (!model) throw new OpenVoxError('OpenVox has no models');
  await openvoxJson(`/models/${encodeURIComponent(model.id)}/load`, { method: 'POST' });
  const languages = await openvoxJson<{ data?: { id: string }[] }>(`/models/${encodeURIComponent(model.id)}/languages`);
  const languageId = languages.data?.some((item) => item.id === language) ? language : (languages.data?.[0]?.id || language);
  const voices = await openvoxJson<{ data?: { id: string }[] }>(`/models/${encodeURIComponent(model.id)}/voices?language=${encodeURIComponent(languageId)}`);
  const voice = voices.data?.find((item) => item.id === process.env.OPENVOX_VOICE) || voices.data?.[0];
  if (!voice) throw new OpenVoxError(`OpenVox has no voices for ${languageId}`);
  return { model: model.id, language: languageId, voice: voice.id };
}

export async function openvoxSpeech(text: string, language: string): Promise<OpenVoxSpeech> {
  const selected = await discoverOpenVox(language);
  const response = await fetch(`${config.openvoxApi}/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...selected, input: text, response_format: 'wav' })
  });
  if (!response.ok) throw new OpenVoxError(`OpenVox speech returned ${response.status}`);
  return { audio: Buffer.from(await response.arrayBuffer()), ...selected };
}
