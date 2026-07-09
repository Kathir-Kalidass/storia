/**
 * Storia Structured Logger
 *
 * Levels: trace, debug, info, warn, error (default: info)
 * Supports JSON and pretty-printed output, correlation ID binding, and custom transports.
 *
 * Usage:
 *   const log = new Logger({ level: 'debug', format: 'json' });
 *   log.info('storia.run', { prompt: 'hello', correlationId: 'abc' });
 */

const LEVELS = { trace: 0, debug: 1, info: 2, warn: 3, error: 4, silent: 5 };

const COLORS = {
  trace: '\x1b[90m',
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  reset: '\x1b[0m'
};

class Logger {
  /**
   * @param {Object} [opts]
   * @param {'trace'|'debug'|'info'|'warn'|'error'|'silent'} [opts.level='info']
   * @param {'json'|'pretty'} [opts.format='json']
   * @param {Function} [opts.transport] — custom write function (default: process.stdout)
   * @param {Object} [opts.defaultMeta] — fields attached to every log entry
   */
  constructor(opts = {}) {
    this._level = opts.level || 'info';
    this._format = opts.format || 'json';
    this._transport = opts.transport || ((entry) => {
      const out = this._format === 'pretty' ? this._pretty(entry) : JSON.stringify(entry);
      const stream = entry.level === 'error' || entry.level === 'warn' ? process.stderr : process.stdout;
      stream.write(out + '\n');
    });
    this._defaultMeta = opts.defaultMeta || {};
    this._context = {};
  }

  get level() { return this._level; }

  /**
   * Create a child logger with bound context (e.g., correlationId).
   * @param {Object} context
   * @returns {Logger}
   */
  child(context) {
    const child = new Logger({
      level: this._level,
      format: this._format,
      transport: this._transport,
      defaultMeta: { ...this._defaultMeta, ...context }
    });
    child._context = { ...this._context, ...context };
    return child;
  }

  _shouldLog(level) {
    return LEVELS[level] >= LEVELS[this._level];
  }

  _entry(level, message, data = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this._defaultMeta,
      ...this._context,
      ...data
    };
  }

  _pretty(entry) {
    const color = COLORS[entry.level] || '';
    const ts = entry.timestamp.slice(11, 23);
    const ctx = entry.correlationId ? ` [${entry.correlationId.slice(0, 8)}]` : '';
    return `${color}${ts} ${entry.level.toUpperCase().padEnd(5)}${COLORS.reset} ${entry.message}${ctx} ${this._formatData(entry)}`;
  }

  _formatData(entry) {
    const keys = Object.keys(entry).filter(k => !['timestamp', 'level', 'message'].includes(k));
    if (keys.length === 0) return '';
    const parts = keys.map(k => `${k}=${typeof entry[k] === 'object' ? JSON.stringify(entry[k]) : entry[k]}`);
    return parts.join(' ');
  }

  trace(message, data) { this._log('trace', message, data); }
  debug(message, data) { this._log('debug', message, data); }
  info(message, data) { this._log('info', message, data); }
  warn(message, data) { this._log('warn', message, data); }
  error(message, data) { this._log('error', message, data); }

  _log(level, message, data = {}) {
    if (!this._shouldLog(level)) return;
    const entry = this._entry(level, message, data);
    this._transport(entry);
  }
}

const defaultLogger = new Logger({ level: 'silent' });

module.exports = { Logger, defaultLogger, LEVELS };
