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
  ConfigError, StateError, BackendError, PluginError, EngineError, StoriaError, ValidationError
} = require('./errors');
const { createBackend, BackendAdapter, registerBackend } = require('./adapters/backend');
const PluginRegistry = require('./plugins/registry');
const {
  validateRunOptions, validateStoryId, validateConfig, validateExportData, validatePluginName
} = require('./security');
const { Logger } = require('./logger');
const { Telemetry } = require('./telemetry');
const { retry } = require('./retry');

const PKG = require('../package.json');

class Storia {
  /**
   * @param {import('./interfaces').StoriaConfig} config
   */
  constructor(config = {}) {
    this._config = { backend: 'memory', ...validateConfig(config) };
    this._initialized = false;
    this._backend = null;
    this._plugins = new PluginRegistry();
    this._orchestrator = null;
    this._logger = config.logger instanceof Logger
      ? config.logger
      : new Logger({ level: config.logLevel || 'silent', defaultMeta: { service: 'storia' } });
    this._telemetry = config.telemetry instanceof Telemetry
      ? config.telemetry
      : new Telemetry({ service: 'storia', enabled: config.telemetry !== false });
    this._correlationId = null;
    this._startTime = Date.now();
    this._metrics = { runs: 0, saves: 0, loads: 0, errors: 0 };
    this._retryOpts = config.retry || {};
  }

  // ─── Layer 1: High-level (95% of users) ──────────────────────────

  /**
   * Run a narrative prompt with zero config.
   * @param {string|import('./interfaces').RunOptions} promptOrOptions
   * @returns {Promise<import('./interfaces').RunResult>}
   */
  async run(promptOrOptions) {
    const rawOptions = typeof promptOrOptions === 'string'
      ? { prompt: promptOrOptions }
      : promptOrOptions;

    const options = validateRunOptions(rawOptions);

    await this._ensureInitialized();

    const correlationId = this._generateId();
    this._correlationId = correlationId;
    const log = this._logger.child({ correlationId });
    const start = Date.now();
    const spanId = this._telemetry.startSpan('storia.run');

    try {
      log.info('storia.run', {
        prompt: options.prompt.slice(0, 80),
        storyId: options.storyId
      });

      this._telemetry.increment('runs.total');
      await this._plugins.runHook('onBeforeRun', options);

      // Load existing story or create new one
      let storyId = options.storyId;
      let isNewStory = false;
      if (!storyId) {
        storyId = await this._createStory(options);
        isNewStory = true;
      }

      // Detect intent
      const intent = this._orchestrator.detectIntent(options.prompt);
      this._metrics.runs++;

      if (intent.confidence < 0.5) {
        this._telemetry.increment('runs.low_confidence');
        this._telemetry.endSpan(spanId, { success: false, reason: 'low_confidence' });
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

      // For new stories, skip the workflow pipeline (story already created by _createStory).
      // For existing stories, run the workflow to process the narrative request.
      let workflowResult = null;
      let storyState = null;

      if (!isNewStory) {
        workflowResult = await this._orchestrator.process(options.prompt, storyId);

        // Sync state from orchestrator to backend
        if (workflowResult.success) {
          try {
            storyState = await this._orchestrator.stateManager.load(storyId);
            if (storyState) {
              await this._backend.save(storyId, storyState, 'synced');
            }
          } catch {
            storyState = await this._backend.load(storyId);
          }
        }
      } else {
        // New story — load the created state from backend
        storyState = await this._backend.load(storyId);
      }

      const duration = Date.now() - start;

      const result = {
        success: storyState !== null,
        storyId,
        intent,
        workflow: workflowResult?.workflow || null,
        story: storyState || null,
        error: workflowResult?.error || null,
        correlationId,
        durationMs: duration
      };

      await this._plugins.runHook('onAfterRun', result);

      this._telemetry.track('storia.run', { success: result.success, duration });
      this._telemetry.histogram('run.duration', duration, { success: result.success });
      this._telemetry.endSpan(spanId, { success: result.success });

      log.info('storia.run.complete', {
        storyId,
        success: result.success,
        duration,
        intent: intent?.intent,
        isNewStory
      });

      return result;
    } catch (err) {
      this._metrics.errors++;
      this._telemetry.increment('runs.errors');
      this._telemetry.endSpan(spanId, { success: false, error: err.message });
      log.error('storia.run.failed', { error: err.message });

      this._telemetry.track('storia.run.error', { error: err.code || err.name });

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
    validateStoryId(storyId);
    await this._ensureInitialized();
    const state = await retry(() => this._backend.load(storyId), this._retryOpts);
    if (!state) throw new StateError(`Story '${storyId}' not found`);
    this._metrics.loads++;
    this._telemetry.increment('loads.total');
    this._logger.info('storia.load', { storyId });
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
    validateStoryId(storyId);
    await this._ensureInitialized();
    const data = state || await retry(() => this._backend.load(storyId), this._retryOpts);
    if (!data) throw new StateError(`Nothing to save — story '${storyId}' not found`);
    await retry(() => this._backend.save(storyId, data, reason), this._retryOpts);
    this._metrics.saves++;
    this._telemetry.increment('saves.total');
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
      metrics: { ...this._metrics, telemetry: this._telemetry.snapshot() },
      logger: { level: this._logger.level },
      uptime: this._formatUptime()
    };
  }

  /**
   * Export story state as JSON.
   * @param {string} storyId
   * @returns {Promise<Object>}
   */
  async export(storyId) {
    validateStoryId(storyId);
    const log = this._logger.child({ storyId });
    const state = await this.load(storyId);
    log.info('storia.export');
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
    const data = validateExportData(exportData);
    const story = data.story || data;
    const storyId = newStoryId || story.metadata.story_id;
    if (newStoryId) validateStoryId(newStoryId);
    await this._ensureInitialized();
    await retry(() => this._backend.save(storyId, story, 'import'), this._retryOpts);
    this._telemetry.increment('imports.total');
    this._logger.info('storia.import', { storyId, newStoryId });
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

    validatePluginName(plugin.name);
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
    const spanId = this._telemetry.startSpan('storia.init');
    this._logger.info('storia.init.start');

    await this._plugins.runHook('onBeforeInit', this._config);

    // Create backend
    const backendName = this._config.backend || 'memory';
    this._backend = createBackend(backendName, this._config);
    await this._backend.initialize(this._config);
    this._logger.info('storia.init.backend', { type: backendName });

    // Initialize orchestrator
    const StoriaOrchestrator = require('../runtime/orchestrator');
    this._orchestrator = new StoriaOrchestrator({
      storiaDir: this._config.storiaDir || path.join(process.cwd(), '.storia')
    });
    await this._orchestrator.initialize();
    this._logger.info('storia.init.orchestrator');

    // Register plugin persona packs
    for (const pack of this._plugins.getPersonaPacks()) {
      this._logger.info('storia.plugin.personas', { pack: pack.name, count: pack.personas?.length });
    }

    this._initialized = true;
    this._telemetry.endSpan(spanId, { success: true });
    this._telemetry.track('storia.init', { backend: backendName });
    this._logger.info('storia.init.complete', { backend: backendName });

    await this._plugins.runHook('onAfterInit', this._config);
  }

  async _createStory(options) {
    const title = options.metadata?.title || options.prompt.slice(0, 60);
    const genre = options.metadata?.genre || ['general'];
    const language = options.language || 'en';
    const spanId = this._telemetry.startSpan('storia.create_story');
    this._telemetry.increment('stories.created');

    const storyId = await this._orchestrator.createStory(title, genre, language, {
      themes: options.metadata?.themes,
      personas: options.personas
    });

    // Save via backend by reading from orchestrator's state manager
    try {
      const state = await this._orchestrator.stateManager.load(storyId);
      if (state) {
        await retry(() => this._backend.save(storyId, state, 'created'), this._retryOpts);
      }
    } catch {
      // State will be created on first workflow execution
    }

    this._telemetry.endSpan(spanId, { storyId });
    this._logger.info('storia.create_story', { storyId, title: title.slice(0, 40) });
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

module.exports = Storia;
