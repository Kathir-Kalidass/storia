/**
 * Storia — Narrative Intelligence SDK
 *
 * Three layers:
 *   Layer 1: High-level — `new Storia(); await storia.run(prompt);`
 *   Layer 2: App SDK    — config, backend, plugins, save/load/health
 *   Layer 3: Low-level  — raw Orchestrator access (framework authors)
 *
 * Usage:
 *   import { Storia } from 'storia';
 *   const storia = new Storia({ backend: 'memory' });
 *   const result = await storia.run({ prompt: 'A fantasy story' });
 */

const path = require('path');
const {
  ConfigError, StateError, BackendError, PluginError, EngineError, StoriaError
} = require('./errors');
const { createBackend, BackendAdapter, registerBackend } = require('./adapters/backend');
const PluginRegistry = require('./plugins/registry');

const PKG = require('../package.json');

class Storia {
  /**
   * @param {import('./interfaces').StoriaConfig} config
   */
  constructor(config = {}) {
    this._config = { backend: 'memory', ...config };
    this._initialized = false;
    this._backend = null;
    this._plugins = new PluginRegistry();
    this._orchestrator = null;
    this._logger = config.logger || _defaultLogger;
    this._telemetry = config.telemetry || null;
    this._correlationId = null;
    this._startTime = Date.now();
    this._metrics = { runs: 0, saves: 0, loads: 0, errors: 0 };
  }

  // ─── Layer 1: High-level (95% of users) ──────────────────────────

  /**
   * Run a narrative prompt with zero config.
   * @param {string|import('./interfaces').RunOptions} promptOrOptions
   * @returns {Promise<import('./interfaces').RunResult>}
   */
  async run(promptOrOptions) {
    const options = typeof promptOrOptions === 'string'
      ? { prompt: promptOrOptions }
      : promptOrOptions;

    if (!options || !options.prompt) {
      throw new ConfigError('run() requires a prompt string or RunOptions.prompt');
    }

    await this._ensureInitialized();

    const correlationId = this._generateId();
    this._correlationId = correlationId;
    const start = Date.now();

    try {
      this._logger.info('storia.run', {
        prompt: options.prompt.slice(0, 80),
        storyId: options.storyId,
        correlationId
      });

      await this._plugins.runHook('onBeforeRun', options);

      // Load or create story
      let storyId = options.storyId;
      if (!storyId) {
        storyId = await this._createStory(options);
      }

      // Detect intent and execute
      const intent = this._orchestrator.detectIntent(options.prompt);
      this._metrics.runs++;

      if (intent.confidence < 0.5) {
        return {
          success: false,
          storyId,
          intent,
          workflow: null,
          error: `Unrecognized intent: "${options.prompt.slice(0, 60)}"`,
          correlationId,
          durationMs: Date.now() - start
        };
      }

      const workflowResult = await this._orchestrator.process(options.prompt, storyId);

      const duration = Date.now() - start;

      const result = {
        success: workflowResult.success,
        storyId,
        intent: workflowResult.intent,
        workflow: workflowResult.workflow,
        story: workflowResult.success ? await this._backend.load(storyId) : null,
        error: workflowResult.error || null,
        correlationId,
        durationMs: duration
      };

      await this._plugins.runHook('onAfterRun', result);

      if (this._telemetry) {
        this._telemetry.track('storia.run', { success: result.success, duration });
      }

      return result;
    } catch (err) {
      this._metrics.errors++;
      this._logger.error('storia.run.failed', { error: err.message, correlationId });

      if (this._telemetry) {
        this._telemetry.track('storia.run.error', { error: err.code || err.name });
      }

      if (err instanceof StoriaError) throw err;
      throw new EngineError('Run failed', { cause: err, details: { correlationId } });
    }
  }

  // ─── Layer 2: Application SDK ──────────────────────────────────────

  /**
   * Load a story by ID into the current session.
   * @param {string} storyId
   * @returns {Promise<Object>}
   */
  async load(storyId) {
    await this._ensureInitialized();
    const state = await this._backend.load(storyId);
    if (!state) throw new StateError(`Story '${storyId}' not found`);
    this._metrics.loads++;
    return state;
  }

  /**
   * Save the current story state.
   * @param {string} storyId
   * @param {Object} [state]
   * @param {string} [reason]
   * @returns {Promise<void>}
   */
  async save(storyId, state, reason = 'manual') {
    await this._ensureInitialized();
    if (!storyId) throw new ConfigError('save() requires a storyId');
    const data = state || await this._backend.load(storyId);
    if (!data) throw new StateError(`Nothing to save — story '${storyId}' not found`);
    await this._backend.save(storyId, data, reason);
    this._metrics.saves++;
    this._logger.info('storia.save', { storyId, reason });
  }

  /**
   * Health check — returns status of all subsystems.
   * @returns {Promise<import('./interfaces').HealthReport>}
   */
  async health() {
    if (!this._initialized) await this._ensureInitialized();
    const backendHealth = this._backend ? await this._backend.health() : false;
    const enginesOk = this._orchestrator !== null;

    const status = backendHealth && enginesOk ? 'ok'
      : (!backendHealth || !enginesOk) ? 'degraded' : 'down';

    return {
      version: PKG.version,
      status,
      engines: {
        orchestrator: enginesOk,
        stateManager: !!this._orchestrator?.stateManager,
        validator: !!this._orchestrator?.validator
      },
      backend: {
        type: this._backend?.type || 'none',
        ready: backendHealth
      },
      plugins: this._plugins.list(),
      metrics: { ...this._metrics },
      uptime: this._formatUptime()
    };
  }

  /**
   * Export story state as JSON.
   * @param {string} storyId
   * @returns {Promise<Object>}
   */
  async export(storyId) {
    const state = await this.load(storyId);
    return {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      storiaVersion: PKG.version,
      story: state
    };
  }

  /**
   * Import a previously exported story.
   * @param {Object} exportData
   * @param {string} [newStoryId]  — optional new ID
   * @returns {Promise<string>} — the imported story ID
   */
  async import(exportData, newStoryId) {
    const story = exportData.story || exportData;
    if (!story.metadata?.story_id) {
      throw new ValidationError('Import data must contain a story with metadata.story_id');
    }
    const storyId = newStoryId || story.metadata.story_id;
    await this._ensureInitialized();
    await this._backend.save(storyId, story, 'import');
    return storyId;
  }

  /**
   * Register a plugin.
   * @param {import('./interfaces').Plugin} plugin
   * @returns {Storia}
   */
  use(plugin) {
    if (this._initialized) {
      throw new PluginError('Plugins must be registered before the first run() call');
    }

    this._plugins.register(plugin);

    // Handle plugin-provided backend
    if (plugin.backend) {
      if (!(plugin.backend.prototype instanceof BackendAdapter)) {
        throw new PluginError(`Plugin '${plugin.name}' backend must extend BackendAdapter`);
      }
      registerBackend(plugin.name, plugin.backend);
    }

    // Handle plugin-provided telemetry
    if (plugin.telemetry) {
      this._telemetry = plugin.telemetry;
    }

    return this;
  }

  // ─── Layer 3: Low-level Runtime Access ─────────────────────────────

  /**
   * Access the raw orchestrator. Only for framework authors.
   * @returns {Object}
   */
  get orchestrator() {
    return this._orchestrator;
  }

  /**
   * Access the plugin registry.
   * @returns {PluginRegistry}
   */
  get plugins() {
    return this._plugins;
  }

  /**
   * Access the current config (read-only).
   * @returns {Object}
   */
  get config() {
    return { ...this._config };
  }

  // ─── Internal ──────────────────────────────────────────────────────

  async _ensureInitialized() {
    if (this._initialized) return;
    await this._plugins.runHook('onBeforeInit', this._config);

    // Create backend
    const backendName = this._config.backend || 'memory';
    this._backend = createBackend(backendName, this._config);
    await this._backend.initialize(this._config);

    // Initialize orchestrator
    const StoriaOrchestrator = require('../runtime/orchestrator');
    this._orchestrator = new StoriaOrchestrator({
      storiaDir: this._config.storiaDir || path.join(process.cwd(), '.storia')
    });
    await this._orchestrator.initialize();

    // Register plugin persona packs
    for (const pack of this._plugins.getPersonaPacks()) {
      this._logger.info('storia.plugin.personas', { pack: pack.name, count: pack.personas?.length });
    }

    this._initialized = true;
    await this._plugins.runHook('onAfterInit', this._config);
  }

  async _createStory(options) {
    const title = options.metadata?.title || options.prompt.slice(0, 60);
    const genre = options.metadata?.genre || ['general'];
    const language = options.language || 'en';

    const storyId = await this._orchestrator.createStory(title, genre, language, {
      themes: options.metadata?.themes,
      personas: options.personas
    });

    // Save via backend by reading from orchestrator's state manager
    try {
      const state = await this._orchestrator.stateManager.load(storyId);
      if (state) {
        await this._backend.save(storyId, state, 'created');
      }
    } catch {
      // State will be created on first workflow execution
    }

    return storyId;
  }

  _generateId() {
    return 'run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  _formatUptime() {
    const ms = Date.now() - this._startTime;
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m ${s % 60}s`;
  }
}

const _defaultLogger = {
  info: (msg, data) => { /* noop */ },
  warn: (msg, data) => { /* noop */ },
  error: (msg, data) => { /* noop */ },
  debug: (msg, data) => { /* noop */ },
  trace: (msg, data) => { /* noop */ }
};

module.exports = Storia;
