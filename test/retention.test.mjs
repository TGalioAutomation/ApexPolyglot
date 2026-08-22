import assert from 'node:assert/strict';
import { runRetention } from '../dist/media/retention.js';
import pg from 'pg';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('DATABASE_URL not set — skipping retention tests');
  process.exit(0);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: dbUrl });

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

try {
  // seed fixtures
  const { rows: user } = await pool.query(
    `INSERT INTO users (primary_email, locale, timezone) VALUES ($1,'vi','Asia/Ho_Chi_Minh') RETURNING id`,
    [`retention-${Date.now()}@example.com`]
  );
  const userId = user[0].id;
  const { rows: tenant } = await pool.query(`INSERT INTO tenants (kind, name) VALUES ('personal', $1) RETURNING id`, [`rt-${Date.now()}`]);
  const tenantId = tenant[0].id;

  const runKey = Date.now();
  // transient, 25h old, no consent -> should expire (separate user WITHOUT consent)
  const { rows: noConsentUser } = await pool.query(
    `INSERT INTO users (primary_email, locale, timezone) VALUES ($1,'vi','Asia/Ho_Chi_Minh') RETURNING id`,
    [`retention-nc-${runKey}@example.com`]
  );
  const ncUserId = noConsentUser[0].id;
  await pool.query(`INSERT INTO tenants (kind, name) VALUES ('personal', $1)`, [`rt-nc-${runKey}`]);
  const ncTenant = (await pool.query(`SELECT id FROM tenants WHERE name = $1`, [`rt-nc-${runKey}`])).rows[0].id;
  const { rows: t1 } = await pool.query(
    `INSERT INTO media_objects (tenant_id, owner_user_id, purpose, storage_key, mime_type, bytes, retention_class, status, created_at)
     VALUES ($1,$2,'upload_tmp',$3,'audio/webm',100,'transient','active',$4) RETURNING id`,
    [ncTenant, ncUserId, `k1-${runKey}`, isoDaysAgo(1.1)]
  );
  // transient, 25h old, WITH audio_retention consent -> should NOT expire
  const { rows: t2 } = await pool.query(
    `INSERT INTO media_objects (tenant_id, owner_user_id, purpose, storage_key, mime_type, bytes, retention_class, status, created_at)
     VALUES ($1,$2,'speech_capture',$3,'audio/webm',100,'short','active',$4) RETURNING id`,
    [tenantId, userId, `k2-${runKey}`, isoDaysAgo(1.1)]
  );
  await pool.query(
    `INSERT INTO consents (tenant_id, user_id, type, policy_version, granted) VALUES ($1,$2,'audio_retention','p1',true)`,
    [tenantId, userId]
  );
  // short, 40d old -> should expire regardless
  const { rows: t3 } = await pool.query(
    `INSERT INTO media_objects (tenant_id, owner_user_id, purpose, storage_key, mime_type, bytes, retention_class, status, created_at)
     VALUES ($1,$2,'speech_capture',$3,'audio/webm',100,'short','active',$4) RETURNING id`,
    [tenantId, userId, `k3-${runKey}`, isoDaysAgo(40)]
  );
  // fresh transient -> should NOT expire yet
  const { rows: t4 } = await pool.query(
    `INSERT INTO media_objects (tenant_id, owner_user_id, purpose, storage_key, mime_type, bytes, retention_class, status, created_at)
     VALUES ($1,$2,'upload_tmp',$3,'audio/webm',100,'transient','active',now()) RETURNING id`,
    [tenantId, userId, `k4-${runKey}`]
  );

  const result = await runRetention(new Date());
  assert.equal(result.expired, 2, 'expected 2 objects expired (transient w/o consent + 40d short)');

  const status = async (id) => (await pool.query(`SELECT status FROM media_objects WHERE id = $1`, [id])).rows[0].status;
  assert.equal(await status(t1[0].id), 'expired');
  assert.equal(await status(t2[0].id), 'active', 'consented speech should survive');
  assert.equal(await status(t3[0].id), 'expired');
  assert.equal(await status(t4[0].id), 'active', 'fresh transient should survive');
  assert.equal(await status(t1[0].id) === 'expired' && await status(t3[0].id) === 'expired', true);

  console.log('retention (TADR-007/014) tests passed');
} finally {
  await pool.end();
}
