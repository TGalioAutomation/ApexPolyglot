import { randomUUID } from 'node:crypto';

type Level = 'info' | 'warn' | 'error' | 'debug';
type LogFields = Record<string, unknown>;

interface LogEntry extends LogFields {
  ts: string;
  level: Level;
  msg: string;
  trace_id?: string;
}

export interface Logger {
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  debug(msg: string, fields?: LogFields): void;
  child(fields: LogFields): Logger;
}

function write(level: Level, msg: string, fields: LogFields = {}, traceId?: string): void {
  const entry: LogEntry = { ts: new Date().toISOString(), level, msg, ...fields };
  if (traceId) entry.trace_id = traceId;
  // Never log secrets or raw user content; callers must pass already-scrubbed fields.
  const line = JSON.stringify(entry);
  if (level === 'error') process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}

export function createLogger(base: LogFields = {}, traceId?: string): Logger {
  return {
    info: (msg, fields = {}) => write('info', msg, { ...base, ...fields }, traceId ?? base.trace_id as string),
    warn: (msg, fields = {}) => write('warn', msg, { ...base, ...fields }, traceId ?? base.trace_id as string),
    error: (msg, fields = {}) => write('error', msg, { ...base, ...fields }, traceId ?? base.trace_id as string),
    debug: (msg, fields = {}) => write('debug', msg, { ...base, ...fields }, traceId ?? base.trace_id as string),
    child: (fields) => createLogger({ ...base, ...fields }, traceId)
  };
}

export function newRequestLogger(): Logger {
  return createLogger({}, randomUUID());
}

export const requestLog = newRequestLogger();
