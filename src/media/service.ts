import { loadConfig } from '../config.js';
import { createHash } from 'node:crypto';
import { Pool } from 'pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const config = loadConfig();

let pool: Pool | null = null;
function getPool(): Pool {
  if (!config.databaseUrl) throw Object.assign(new Error('Database is not configured (DATABASE_URL)'), { statusCode: 503 });
  if (!pool) pool = new Pool({ connectionString: config.databaseUrl });
  return pool;
}

function s3Configured(): boolean {
  return Boolean(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
}

function getS3(): S3Client {
  if (!s3Configured()) throw Object.assign(new Error('S3 is not configured'), { statusCode: 503 });
  return new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY as string,
      secretAccessKey: process.env.S3_SECRET_KEY as string
    }
  });
}

export interface UploadIntent {
  mediaObjectId: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  purpose: string;
  expiresAt: string;
}

const RETENTION_CLASS: Record<string, 'transient' | 'short' | 'history'> = {
  speech_capture: 'short',
  upload_tmp: 'transient',
  content_audio: 'history'
};

export async function createUploadIntent(tenantId: string, ownerUserId: string, purpose: string, mimeType: string, bytes: number): Promise<UploadIntent> {
  if (!['speech_capture', 'upload_tmp', 'content_audio'].includes(purpose)) throw Object.assign(new Error('invalid purpose'), { statusCode: 422 });
  const s3 = getS3();
  const storageToken = createHash('sha256').update(`${tenantId}:${ownerUserId}:${purpose}:${Date.now()}:${Math.random()}`).digest('hex').slice(0, 24);
  const storageKey = `${tenantId}/${ownerUserId}/${storageToken}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: storageKey,
    ContentType: mimeType
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  const { rows } = await getPool().query(
    `INSERT INTO media_objects (tenant_id, owner_user_id, purpose, storage_key, mime_type, bytes, retention_class, status, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8) RETURNING id`,
    [tenantId, ownerUserId, purpose, storageKey, mimeType, bytes, RETENTION_CLASS[purpose] ?? 'short', expiresAt]
  );
  const mediaObjectId = rows[0].id as string;
  return {
    mediaObjectId,
    uploadUrl,
    requiredHeaders: { 'Content-Type': mimeType, 'Content-Length': String(bytes) },
    purpose,
    expiresAt: expiresAt.toISOString()
  };
}

export async function markUploaded(mediaObjectId: string): Promise<void> {
  await getPool().query(`UPDATE media_objects SET status='active' WHERE id = $1`, [mediaObjectId]);
}

export async function getMediaKey(mediaObjectId: string): Promise<string | null> {
  const { rows } = await getPool().query(`SELECT storage_key FROM media_objects WHERE id = $1`, [mediaObjectId]);
  return rows[0] ? (rows[0] as { storage_key: string }).storage_key : null;
}
