/**
 * Backend Adapter — convenience re-export with auto-registered built-ins.
 */

const {
  BackendAdapter, registerBackend, createBackend, listBackends
} = require('./base');

// Auto-register built-in backends
require('./memory');
require('./filesystem');

module.exports = { BackendAdapter, registerBackend, createBackend, listBackends };
