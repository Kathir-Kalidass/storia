/**
 * Storia — Public Exports
 *
 * CJS entry point. ESM consumers import via 'storia' (package.json exports).
 */

const Storia = require('./storia');

// ─── Errors ──────────────────────────────────────────────────────────
const Errors = require('./errors');

// ─── Backend Adapters ─────────────────────────────────────────────────
const BackendAdapters = require('./adapters/base');
const MemoryBackend = require('./adapters/memory');
const FilesystemBackend = require('./adapters/filesystem');

// ─── Plugin System ────────────────────────────────────────────────────
const PluginRegistry = require('./plugins/registry');

module.exports = {
  Storia,
  Errors,
  BackendAdapters,
  MemoryBackend,
  FilesystemBackend,
  PluginRegistry
};
