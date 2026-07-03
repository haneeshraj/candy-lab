// Minimal leveled logger for the main process. Swap the sink here (e.g. for
// electron-log) without touching call sites.

type Level = 'debug' | 'info' | 'warn' | 'error'

const PREFIX = '[main]'

function write(level: Level, args: unknown[]): void {
  const method = level === 'debug' ? 'log' : level

  console[method](PREFIX, ...args)
}

export const logger = {
  debug: (...args: unknown[]): void => write('debug', args),
  info: (...args: unknown[]): void => write('info', args),
  warn: (...args: unknown[]): void => write('warn', args),
  error: (...args: unknown[]): void => write('error', args)
}
