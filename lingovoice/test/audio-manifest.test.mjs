// Unit test — manifest audio phải chống clobber khi pregen chạy song song lúc server sống.
// Bug cũ: persistAudioManifest ghi cả file từ RAM (mỗi tiến trình một bản RAM) →
// tiến trình ghi sau đè mất entry của tiến trình kia, mất vĩnh viễn (restart không chữa).
// pregen.mjs chạy là MỘT tiến trình riêng → test mô phỏng bằng bản sao module mới (query import).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// voice.mjs đọc LV_AUDIO_CACHE_DIR lúc import — phải set TRƯỚC khi import.
const cacheDir = await mkdtemp(join(tmpdir(), 'lv-audio-manifest-'));
process.env.LV_AUDIO_CACHE_DIR = cacheDir;
const voice = await import('../voice.mjs');
// Bản sao module độc lập RAM — đúng cơ chế `node pregen.mjs` chạy tách tiến trình.
const pregenLike = () => import(`../voice.mjs?instance=pregen-${Math.random().toString(36).slice(2)}`);

const req = (text) => ({ text, language: 'en' });
const readDiskEntries = async () => {
  const disk = JSON.parse(await readFile(voice.AUDIO_MANIFEST_FILE, 'utf8'));
  return Object.keys(disk.entries);
};

test.after(async () => { await rm(cacheDir, { recursive: true, force: true }); delete process.env.LV_AUDIO_CACHE_DIR; });

test('pregen chạy song song không đè mất entry của server đang sống', async () => {
  await voice.rememberPreparedAudio(req('server-only-entry'), { key: 'wav-server', model: 'm', voice: 'v' });
  const pregen = await pregenLike(); // RAM riêng, chỉ biết entry của mình
  await pregen.rememberPreparedAudio(req('pregen-only-entry'), { key: 'wav-pregen', model: 'm', voice: 'v' });
  const keys = await readDiskEntries();
  const serverKey = voice.preparedRequestKey(req('server-only-entry'));
  const pregenKey = voice.preparedRequestKey(req('pregen-only-entry'));
  assert.ok(keys.includes(serverKey), 'entry của server phải còn nguyên trên đĩa');
  assert.ok(keys.includes(pregenKey), 'entry của pregen phải được ghi thêm');
});

test('ghi đè ngoài vòng đời (file tay) cũng không bị xoá sạch khi server persist', async () => {
  // Người viết ngoài (vd. copy manifest vào volume) thêm entry sau khi server đã load RAM
  const external = JSON.parse(await readFile(voice.AUDIO_MANIFEST_FILE, 'utf8'));
  external.entries['external-key'] = { key: 'external-key', language: 'en', text: 'external' };
  await writeFile(voice.AUDIO_MANIFEST_FILE, JSON.stringify(external, null, 2));
  await voice.rememberPreparedAudio(req('server-next-entry'), { key: 'wav-next', model: 'm', voice: 'v' });
  const keys = await readDiskEntries();
  assert.ok(keys.includes('external-key'), 'persist phải đọc-merge từ đĩa trước khi ghi');
});

test('server đang sống đọc được entry pregen vừa ghi vào đĩa (refresh theo mtime)', async () => {
  const pregen = await pregenLike();
  const request = req('pregen-hot-reload');
  await pregen.rememberPreparedAudio(request, { key: 'wav-hot', model: 'm', voice: 'v' });
  await voice.writeCachedAudio('wav-hot', Buffer.from('RIFF'));
  const found = await voice.readPreparedAudio(request);
  assert.ok(found, 'manifest RAM của server phải gộp entry mới từ đĩa');
  assert.equal(found.entry.key, 'wav-hot');
  assert.equal((await found.audio).toString(), 'RIFF');
});
