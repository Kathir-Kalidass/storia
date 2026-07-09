/**
 * Storia Retry — exponential backoff with jitter for resilient operations
 *
 * Usage:
 *   const result = await retry(() => backend.load(storyId), {
 *     maxRetries: 3,
 *     baseDelay: 100,
 *     maxDelay: 5000
 *   });
 */

const { BackendError } = require('./errors');

class RetryError extends BackendError {
  constructor(message, options = {}) {
    super(message, { ...options, code: 'ERR_STORIA_RETRY_EXHAUSTED' });
  }
}

const defaultOptions = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 5000,
  factor: 2,
  jitter: true,
  retryable: (err) => {
    // Retry on network errors, timeouts, and transient backend errors
    if (err instanceof BackendError) return true;
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') return true;
    if (err.message && (
      err.message.includes('timeout') ||
      err.message.includes('econnrefused') ||
      err.message.includes('etimedout') ||
      err.message.includes('network')
    )) return true;
    return false;
  }
};

/**
 * Execute an async function with exponential backoff retry.
 * @param {Function} fn — async function to retry
 * @param {Object} [opts]
 * @param {number} [opts.maxRetries=3]
 * @param {number} [opts.baseDelay=100]
 * @param {number} [opts.maxDelay=5000]
 * @param {number} [opts.factor=2]
 * @param {boolean} [opts.jitter=true]
 * @param {Function} [opts.retryable] — function(err) => boolean
 * @param {Function} [opts.onRetry] — called before each retry with (error, attempt)
 * @returns {Promise<any>}
 */
async function retry(fn, opts = {}) {
  const config = { ...defaultOptions, ...opts };
  let lastError;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt >= config.maxRetries) break;
      if (!config.retryable(err)) throw err;

      const delay = _computeDelay(attempt, config);
      if (config.onRetry) config.onRetry(err, attempt + 1, delay);
      await _sleep(delay);
    }
  }

  throw new RetryError(`Operation failed after ${config.maxRetries} retries`, {
    cause: lastError,
    details: { maxRetries: config.maxRetries, lastError: lastError?.message }
  });
}

function _computeDelay(attempt, config) {
  const delay = Math.min(
    config.baseDelay * Math.pow(config.factor, attempt),
    config.maxDelay
  );
  if (config.jitter) {
    return Math.round(delay * (0.5 + Math.random() * 0.5));
  }
  return Math.round(delay);
}

function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { retry, RetryError, defaultOptions };
