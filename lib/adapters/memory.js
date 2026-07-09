/**
 * Memory Backend — ephemeral state, no persistence.
 * Default backend. Useful for demos, testing, and single-session use.
 */

const { BackendAdapter, registerBackend } = require('./base');

class MemoryBackend extends BackendAdapter {
  constructor() {
    super();
    this._store = new Map();
    this._ready = false;
  }

  get type() { return 'memory'; }

  async initialize(config = {}) {
    this._ready = true;
  }

  async load(storyId) {
    const data = this._store.get(storyId);
    return data ? JSON.parse(JSON.stringify(data)) : null;
  }

  async save(storyId, state, reason = 'manual') {
    this._store.set(storyId, JSON.parse(JSON.stringify(state)));
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
