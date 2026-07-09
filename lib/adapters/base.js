/**
 * Backend Adapter Base Class + Registry
 * Separate file to avoid circular dependency when backends auto-register.
 */

const { BackendNotFoundError } = require('../errors');

class BackendAdapter {
  get type() { throw new Error('BackendAdapter subclass must implement type'); }

  async load(storyId) { throw new Error('Not implemented'); }
  async save(storyId, state, reason) { throw new Error('Not implemented'); }
  async list() { throw new Error('Not implemented'); }
  async exists(storyId) { throw new Error('Not implemented'); }
  async delete(storyId) { throw new Error('Not implemented'); }
  async initialize(config) { throw new Error('Not implemented'); }
  async health() { throw new Error('Not implemented'); }
}

const REGISTRY = new Map();

function registerBackend(name, adapterClass) {
  REGISTRY.set(name, adapterClass);
}

function createBackend(name, config) {
  const AdapterClass = REGISTRY.get(name);
  if (!AdapterClass) throw new BackendNotFoundError(name);
  const instance = new AdapterClass();
  instance.initialize(config);
  return instance;
}

function listBackends() {
  return Array.from(REGISTRY.keys());
}

module.exports = { BackendAdapter, registerBackend, createBackend, listBackends };
