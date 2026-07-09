/**
 * Storia Telemetry — events, counters, histograms, gauges, spans
 *
 * Lightweight in-process telemetry with an observer pattern for custom exporters.
 *
 * Usage:
 *   const t = new Telemetry({ service: 'storia' });
 *   t.track('storia.run', { success: true, duration: 150 });
 *   t.increment('runs.total');
 *   t.histogram('run.duration', 150);
 *   t.gauge('stories.active', 5);
 *
 *   // Export to custom backend
 *   t.on('event', (name, data) => pushToCloud(name, data));
 */

class Telemetry {
  /**
   * @param {Object} [opts]
   * @param {string} [opts.service='storia']
   * @param {boolean} [opts.enabled=true]
   */
  constructor(opts = {}) {
    this._service = opts.service || 'storia';
    this._enabled = opts.enabled !== false;
    this._listeners = { event: [], histogram: [], gauge: [], span: [] };
    this._counters = {};
    this._gauges = {};
    this._histograms = {};
    this._spans = new Map();
  }

  get enabled() { return this._enabled; }

  /**
   * Register a listener for telemetry events.
   * @param {'event'|'histogram'|'gauge'|'span'} type
   * @param {Function} fn
   * @returns {Function} — call to unsubscribe
   */
  on(type, fn) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(fn);
    return () => {
      this._listeners[type] = this._listeners[type].filter(f => f !== fn);
    };
  }

  _emit(type, data) {
    if (!this._enabled) return;
    for (const fn of (this._listeners[type] || [])) {
      try { fn(data); } catch { /* swallow observer errors */ }
    }
  }

  /**
   * Track an event with structured data.
   * @param {string} name
   * @param {Object} [data={}]
   */
  track(name, data = {}) {
    if (!this._enabled) return;
    const event = {
      type: 'event',
      service: this._service,
      name,
      timestamp: Date.now(),
      data
    };
    this._emit('event', event);
  }

  /**
   * Increment a counter by 1 (or by value).
   * @param {string} name
   * @param {number} [by=1]
   */
  increment(name, by = 1) {
    if (!this._enabled) return;
    this._counters[name] = (this._counters[name] || 0) + by;
    this._emit('gauge', { type: 'counter', name, value: this._counters[name] });
  }

  /**
   * Record a duration or value for distribution analysis.
   * @param {string} name
   * @param {number} value
   * @param {Object} [tags={}]
   */
  histogram(name, value, tags = {}) {
    if (!this._enabled) return;
    if (!this._histograms[name]) this._histograms[name] = [];
    this._histograms[name].push({ value, timestamp: Date.now(), tags });
    this._emit('histogram', { name, value, tags });
  }

  /**
   * Set a gauge (point-in-time value).
   * @param {string} name
   * @param {number} value
   */
  gauge(name, value) {
    if (!this._enabled) return;
    this._gauges[name] = value;
    this._emit('gauge', { type: 'gauge', name, value });
  }

  /**
   * Start a span for distributed tracing.
   * @param {string} name
   * @param {Object} [tags={}]
   * @returns {string} spanId
   */
  startSpan(name, tags = {}) {
    if (!this._enabled) return null;
    const spanId = 'span-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    this._spans.set(spanId, {
      name,
      tags,
      start: Date.now(),
      end: null,
      duration: null
    });
    this._emit('span', { type: 'span.start', spanId, name, tags, timestamp: Date.now() });
    return spanId;
  }

  /**
   * End a previously started span.
   * @param {string} spanId
   * @param {Object} [tags={}]
   * @returns {number|null} — duration in ms, or null if span not found
   */
  endSpan(spanId, tags = {}) {
    if (!this._enabled || !spanId) return null;
    const span = this._spans.get(spanId);
    if (!span) return null;
    const end = Date.now();
    span.end = end;
    span.duration = end - span.start;
    Object.assign(span.tags, tags);
    this._emit('span', {
      type: 'span.end',
      spanId,
      name: span.name,
      duration: span.duration,
      tags: span.tags,
      timestamp: end
    });
    return span.duration;
  }

  /**
   * Snapshot of all current counters and gauges.
   * @returns {Object}
   */
  snapshot() {
    return {
      counters: { ...this._counters },
      gauges: { ...this._gauges },
      histograms: Object.fromEntries(
        Object.entries(this._histograms).map(([k, v]) => [k, v.length])
      )
    };
  }

  /**
   * Reset all counters, gauges, and histograms.
   */
  reset() {
    this._counters = {};
    this._gauges = {};
    this._histograms = {};
    this._spans.clear();
  }
}

module.exports = { Telemetry };
