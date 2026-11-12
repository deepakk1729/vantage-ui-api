/**
 * Lightweight zero-dependency logger.
 *
 * Level controlled via LOG_LEVEL env var: debug | info | warn | error (default: info).
 * Use `createLogger(scope)` to get a scoped logger that prefixes every line.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function currentLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  return (['debug', 'info', 'warn', 'error'].includes(raw) ? raw : 'info') as LogLevel;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel()];
}

function format(scope: string, level: LogLevel, message: string): string {
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] [${scope}] ${message}`;
}

export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

export function createLogger(scope: string): Logger {
  const emit = (level: LogLevel, message: string, meta?: unknown): void => {
    if (!shouldLog(level)) return;
    const line = format(scope, level, message);
    const sink = level === 'error' || level === 'warn' ? console.error : console.log;
    if (meta !== undefined) {
      sink(line, typeof meta === 'string' ? meta : JSON.stringify(meta));
    } else {
      sink(line);
    }
  };

  return {
    debug: (m, meta) => emit('debug', m, meta),
    info: (m, meta) => emit('info', m, meta),
    warn: (m, meta) => emit('warn', m, meta),
    error: (m, meta) => emit('error', m, meta),
  };
}
