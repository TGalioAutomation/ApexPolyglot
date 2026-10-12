import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function loadEnvFile(envPath: string): void {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;
    process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

export interface AppConfig {
  port: number;
  openvoxApi: string;
  aiProvider: string;
  databaseUrl?: string;
}

export function loadConfig(envPath = join(root, '.env')): AppConfig {
  loadEnvFile(envPath);
  return {
    port: Number(process.env.PORT || 4173),
    openvoxApi: (process.env.OPENVOX_API || 'http://127.0.0.1:8000/v1').replace(/\/$/, ''),
    aiProvider: (process.env.AI_PROVIDER || 'auto').toLowerCase(),
    databaseUrl: process.env.DATABASE_URL || undefined
  };
}

export { root };
