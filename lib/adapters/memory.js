/**
 * Memory Backend — ephemeral state, no persistence.
 * Default backend. Useful for demos, testing, and single-session use.
 */

const { BackendAdapter, registerBackend } = require('./base');
const { computeChecksum, verifyChecksum, validateStateSize } = require('../security');
const { BackendError } = require('../errors');

class MemoryBackend extends BackendAdapter {
  constructor() {
    super();
    this._store = new Map();
    this._checksums = new Map();
    this._ready = false;
  }

  get type() { return 'memory'; }

  async initialize(config = {}) {
    this._ready = true;
  }

  async load(storyId) {
    const raw = this._store.get(storyId);
    if (!raw) return null;
    const expected = this._checksums.get(storyId);
    if (expected) {
      const actual = computeChecksum(raw);
      if (actual !== expected) {
        throw new BackendError(
          `Story '${storyId}' checksum mismatch: data may be corrupted`,
          { details: { expected, actual } }
        );
      }
    }
    return JSON.parse(JSON.stringify(raw));
  }

  async save(storyId, state, reason = 'manual') {
    validateStateSize(state);
    const clone = JSON.parse(JSON.stringify(state));
    this._store.set(storyId, clone);
    this._checksums.set(storyId, computeChecksum(clone));
  }

  async list() {
    return Array.from(this._store.keys());
  }

  async exists(storyId) {
    return this._store.has(storyId);
  }

  async delete(storyId) {
    this._store.delete(storyId);
  }

  async health() {
    return this._ready;
  }
}

registerBackend('memory', MemoryBackend);
module.exports = MemoryBackend;
