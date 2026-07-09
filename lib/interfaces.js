/**
 * Storia SDK Interfaces — JSDoc type contracts
 *
 * These are not classes. They are documentation of the shapes the runtime expects.
 * Consumers implement these contracts to extend Storia.
 */

/**
 * @typedef {Object} StoriaConfig
 * @property {'memory'|'filesystem'|string} [backend='memory']
 * @property {string} [storiaDir] — filesystem path when backend='filesystem'
 * @property {Logger} [logger]
 * @property {Telemetry} [telemetry]
 * @property {Plugin[]} [plugins]
 * @property {Object} [state]
 * @property {string} [state.schemaVersion]
 * @property {Object} [validation]
 * @property {boolean} [validation.strict=false]
 * @property {Object} [workflow]
 * @property {number} [workflow.maxRetries=0]
 * @property {Object} [memory]
 * @property {number} [memory.cacheSize=50]
 */

/**
 * @typedef {Object} RunOptions
 * @property {string} prompt — the user's narrative request
 * @property {string} [storyId] — resume an existing story
 * @property {Object} [personas] — persona stack
 * @property {string} [personas.primary]
 * @property {string} [personas.secondary]
 * @property {string} [personas.style]
 * @property {string} [language='en']
 * @property {Object} [metadata]
 * @property {string} [metadata.title]
 * @property {string[]} [metadata.genre]
 * @property {string[]} [metadata.themes]
 */

/**
 * @typedef {Object} RunResult
 * @property {boolean} success
 * @property {string} storyId
 * @property {Object} intent — detected intent
 * @property {Object} workflow — workflow execution result
 * @property {Object} [story] — current story state snapshot
 * @property {string} [error] — error message if failed
 * @property {string} correlationId
 * @property {number} durationMs
 */

/**
 * @typedef {Object} HealthReport
 * @property {string} version
 * @property {'ok'|'degraded'|'down'} status
 * @property {Object} engines
 * @property {boolean} engines.orchestrator
 * @property {boolean} engines.stateManager
 * @property {boolean} engines.validator
 * @property {Object} backend
 * @property {string} backend.type
 * @property {boolean} backend.ready
 * @property {Object} [plugins]
 * @property {Object} [metrics]
 * @property {number} [metrics.storiesCount]
 * @property {number} [metrics.stateVersions]
 * @property {string} uptime
 */

// ─── Backend Adapter Contract ────────────────────────────────────────

/**
 * @typedef {Object} BackendAdapter
 *
 * Storage backend for Story State.
 * Implement this to add new persistence layers (SQLite, Postgres, S3, etc.).
 *
 * @property {function(string): Promise<Object|null>} load
 *   Load active state by storyId. Returns null if not found.
 *
 * @property {function(string, Object, string): Promise<void>} save
 *   Save active state. Args: storyId, state object, reason string.
 *
 * @property {function(string): Promise<string[]>} list
 *   List all story IDs.
 *
 * @property {function(string): Promise<boolean>} exists
 *   Check if a story exists.
 *
 * @property {function(string): Promise<void>} delete
 *   Delete a story and all its data.
 *
 * @property {function(Object): Promise<void>} initialize
 *   One-time setup. Receives the config object.
 *
 * @property {function(): Promise<boolean>} health
 *   Health check. Return true if backend is operational.
 *
 * @property {string} type
 *   Backend type identifier ('memory', 'filesystem', 'sqlite', etc.)
 */

// ─── Plugin Contract ─────────────────────────────────────────────────

/**
 * @typedef {Object} Plugin
 *
 * A Storia plugin extends functionality via hooks.
 * Plugins are registered via storia.use().
 *
 * @property {string} name — unique plugin name
 * @property {string} [version]
 * @property {Object} [personas] — persona pack to register
 * @property {Object} [workflows] — workflow pack to register
 * @property {Object} [backend] — custom backend adapter
 * @property {Object} [telemetry] — custom telemetry adapter
 * @property {Object} [hooks] — lifecycle hooks
 * @property {function(StoriaConfig): Promise<void>} [hooks.onBeforeInit]
 * @property {function(StoriaConfig): Promise<void>} [hooks.onAfterInit]
 * @property {function(RunOptions): Promise<void>} [hooks.onBeforeRun]
 * @property {function(RunResult): Promise<void>} [hooks.onAfterRun]
 * @property {function(Error): Promise<void>} [hooks.onError]
 * @property {function(): Promise<void>} [hooks.onShutdown]
 */

// ─── Logger Contract ─────────────────────────────────────────────────

/**
 * @typedef {Object} Logger
 *
 * @property {function(string, Object): void} info
 * @property {function(string, Object): void} warn
 * @property {function(string, Object): void} error
 * @property {function(string, Object): void} debug
 * @property {function(string, Object): void} trace
 */

// ─── Telemetry Contract ──────────────────────────────────────────────

/**
 * @typedef {Object} Telemetry
 *
 * @property {function(string, Object): void} track — track an event
 * @property {function(string, number, Object): void} histogram — record a duration/value
 * @property {function(string, number): void} gauge — set a gauge value
 * @property {function(string): void} increment — increment a counter
 */

// ─── Persona Pack Contract ────────────────────────────────────────────

/**
 * @typedef {Object} PersonaPack
 *
 * A bundle of personas registered by a plugin.
 *
 * @property {string} name — pack name (e.g., 'english-writing')
 * @property {string} version
 * @property {Array<{id: string, config: Object}>} personas
 */

// ─── Workflow Pack Contract ───────────────────────────────────────────

/**
 * @typedef {Object} WorkflowPack
 *
 * A bundle of workflows registered by a plugin.
 *
 * @property {string} name
 * @property {string} version
 * @property {Array<{id: string, config: Object, markdown?: string}>} workflows
 */

// ─── State Serializer Contract ────────────────────────────────────────

/**
 * @typedef {Object} StateSerializer
 *
 * @property {function(Object): string} serialize — state → string
 * @property {function(string): Object} deserialize — string → state
 * @property {function(Object): string} checksum — compute state checksum
 */

// ─── Validator Contract ───────────────────────────────────────────────

/**
 * @typedef {Object} Validator
 *
 * @property {function(Object): {valid: boolean, errors: Array}} validate
 *   Validate an object against a schema.
 *
 * @property {function(string, Object): {valid: boolean, errors: Array}} validateAgainst
 *   Validate against a named schema.
 */

module.exports = {};
