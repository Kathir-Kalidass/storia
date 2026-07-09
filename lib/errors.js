/**
 * Storia Error Hierarchy
 *
 * Every Storia operation throws typed errors. Consumers catch by type, not message.
 *
 * ```
 * StoriaError
 *   ├── ConfigError          — invalid configuration
 *   ├── StateError           — state corruption, missing state, version mismatch
 *   │   └── StateVersionError
 *   ├── ValidationError      — schema or constraint violations
 *   ├── BackendError         — storage backend failures
 *   │   └── BackendNotFoundError
 *   ├── PluginError          — plugin registration or execution failures
 *   ├── EngineError          — runtime engine failures
 *   │   ├── PipelineError    — workflow pipeline failures
 *   │   └── PersonaError     — persona composition failures
 *   └── WorkflowError        — workflow execution failures
 * ```
 */

class StoriaError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'ERR_STORIA_UNKNOWN';
    this.cause = options.cause || null;
    this.details = options.details || null;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      cause: this.cause ? this.cause.message : null,
      details: this.details,
      stack: this.stack
    };
  }
}

class ConfigError extends StoriaError {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || 'ERR_STORIA_CONFIG' });
  }
}

class StateError extends StoriaError {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || 'ERR_STORIA_STATE' });
  }
}

class StateVersionError extends StateError {
  constructor(expected, actual, options = {}) {
    super(`State version mismatch: expected ${expected}, got ${actual}`, {
      ...options,
      code: 'ERR_STORIA_STATE_VERSION',
      details: { expected, actual }
    });
  }
}

class ValidationError extends StoriaError {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || 'ERR_STORIA_VALIDATION' });
  }
}

class BackendError extends StoriaError {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || 'ERR_STORIA_BACKEND' });
  }
}

class BackendNotFoundError extends BackendError {
  constructor(name) {
    super(`Backend '${name}' not found`, {
      code: 'ERR_STORIA_BACKEND_NOT_FOUND',
      details: { name }
    });
  }
}

class PluginError extends StoriaError {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || 'ERR_STORIA_PLUGIN' });
  }
}

class EngineError extends StoriaError {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || 'ERR_STORIA_ENGINE' });
  }
}

class PipelineError extends EngineError {
  constructor(message, options = {}) {
    super(message, { ...options, code: 'ERR_STORIA_PIPELINE' });
  }
}

class PersonaError extends EngineError {
  constructor(message, options = {}) {
    super(message, { ...options, code: 'ERR_STORIA_PERSONA' });
  }
}

class WorkflowError extends StoriaError {
  constructor(message, options = {}) {
    super(message, { ...options, code: options.code || 'ERR_STORIA_WORKFLOW' });
  }
}

module.exports = {
  StoriaError,
  ConfigError,
  StateError,
  StateVersionError,
  ValidationError,
  BackendError,
  BackendNotFoundError,
  PluginError,
  EngineError,
  PipelineError,
  PersonaError,
  WorkflowError
};
