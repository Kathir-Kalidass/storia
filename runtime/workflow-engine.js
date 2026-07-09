// Storia Workflow Engine
// Lightweight pipeline runner that parses markdown workflow configs
// and executes steps sequentially with rollback/continue/stop/flag semantics.

const path = require('path');
const fs = require('fs');

class WorkflowEngine {
  constructor(options = {}) {
    this.workflowsDir = options.workflowsDir || path.join(__dirname, '..', 'workflows');
    this.engineRegistry = options.engineRegistry || {};
    this.cache = new Map();
  }

  // Load and parse a workflow config from markdown
  async loadConfig(workflowId) {
    if (this.cache.has(workflowId)) return this.cache.get(workflowId);

    const configPath = path.join(this.workflowsDir, 'configs', `${workflowId}.md`);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Workflow config not found: ${workflowId}`);
    }

    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = this._parseConfig(raw, workflowId);
    this.cache.set(workflowId, config);
    return config;
  }

  // Run a workflow pipeline
  async run(workflowId, params = {}) {
    const config = await this.loadConfig(workflowId);
    const result = {
      workflow_id: workflowId,
      success: true,
      steps: [],
      state: { ...params.initialState },
      error: null,
      rolled_back: false,
      warnings: []
    };

    let currentState = { ...params.initialState };
    let stepResults = [];
    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];
      const stepResult = {
        step: i + 1,
        engine: step.engine,
        method: step.method,
        status: 'pending'
      };

      try {
        const engine = this._resolveEngine(step.engine);
        if (!engine && step.onFailure === 'stop') {
          throw new Error(`Engine not available: ${step.engine}`);
        }

        if (!engine) {
          stepResult.status = 'skipped';
          stepResult.message = `Engine '${step.engine}' not loaded — skipping step`;
          result.warnings.push(stepResult.message);
          stepResults.push(stepResult);
          continue;
        }

        const method = typeof engine === 'function' ? engine : engine[step.method];
        if (!method) {
          throw new Error(`Method '${step.method}' not found on engine '${step.engine}'`);
        }

        const args = this._resolveArgs(step.args, params, currentState, stepResults);
        const output = await method.apply(engine, args);
        stepResult.status = 'completed';
        stepResult.output = output;

        // Auto-capture state when state-manager.load returns a state object
        if (step.engine === 'state-manager' && step.method === 'load' && output && typeof output === 'object') {
          currentState = { ...currentState, ...output };
        }
        if (step.capture) {
          currentState[step.capture] = output;
        }

      } catch (err) {
        stepResult.status = 'failed';
        stepResult.error = err.message;

        if (step.onFailure === 'stop') {
          result.success = false;
          result.error = `Step ${i + 1} (${step.engine}/${step.method}): ${err.message}`;
          stepResults.push(stepResult);
          break;
        }

        if (step.onFailure === 'rollback') {
          result.success = false;
          result.error = `Step ${i + 1} failed: ${err.message}. Pipeline rolled back.`;
          result.rolled_back = true;
          stepResults.push(stepResult);
          break;
        }

        if (step.onFailure === 'flag') {
          result.warnings.push(`Step ${i + 1} (${step.engine}/${step.method}): ${err.message}`);
          stepResult.status = 'flagged';
          stepResults.push(stepResult);
          continue;
        }

        // continue — proceed despite failure
        stepResult.status = 'continued';
        stepResults.push(stepResult);
        continue;
      }

      stepResults.push(stepResult);
    }

    result.steps = stepResults;
    result.state = currentState;
    return result;
  }

  // Parse a markdown workflow config into structured pipeline steps
  _parseConfig(raw, workflowId) {
    const config = {
      workflow_id: workflowId,
      title: '',
      intent: '',
      triggers: [],
      steps: []
    };

    // Extract title
    const titleMatch = raw.match(/^# Workflow \w+: (.+)$/m);
    if (titleMatch) config.title = titleMatch[1].trim();

    // Extract intent
    const section = this._extractSection(raw, 'Intent');
    if (section) config.intent = section.split('\n')[0].trim();

    // Extract triggers
    const trigSection = this._extractSection(raw, 'Triggers');
    if (trigSection) {
      const firstLine = trigSection.split('\n')[0].replace(/^- /, '');
      config.triggers = firstLine.split(', ').map(t => t.trim());
    }

    // Extract pipeline steps
    const pipelineSection = this._extractSection(raw, 'Pipeline');
    if (pipelineSection) {
      const stepLines = pipelineSection.split('\n').filter(l => /^\d+\./.test(l.trim()));
      for (const line of stepLines) {
        const step = this._parseStepLine(line.trim());
        if (step) config.steps.push(step);
      }
    }

    return config;
  }

  // Extract a section from markdown (between ## headings)
  _extractSection(raw, sectionName) {
    const match = raw.match(new RegExp(`^## ${sectionName}\\n([\\s\\S]+?)\\n## `, 'm'));
    if (match) return match[1].trim();
    // Fallback: section at end of file (no following heading)
    const endMatch = raw.match(new RegExp(`^## ${sectionName}\\n([\\s\\S]+)$`, 'm'));
    return endMatch ? endMatch[1].trim() : null;
  }

  // Parse a single pipeline step line:
  // 1. **engine** → `method(args)` — description; on failure: behavior
  _parseStepLine(line) {
    const stepLine = line.replace(/^\d+\.\s*/, '').trim();

    const engineMatch = stepLine.match(/^\*\*(.+?)\*\*/);
    if (!engineMatch) return null;

    const engine = engineMatch[1].toLowerCase().replace(/\s+/g, '-');
    const rest = stepLine.slice(engineMatch[0].length);

    // Extract method: → `method(args)` or `method`
    const methodMatch = rest.match(/→\s*`(\w+)(?:\(([^)]*)\))?`/);
    if (!methodMatch) return null;

    const method = methodMatch[1];
    const argsRaw = methodMatch[2] || '';
    const args = this._parseArgs(argsRaw);

    // Extract pre-condition
    const preConditionMatch = rest.match(/pre-condition:\s*([^;]+?)(?:;|$)/);
    const preCondition = preConditionMatch ? preConditionMatch[1].trim() : null;

    // Extract on_failure
    const onFailureMatch = rest.match(/on failure:\s*(\w+)/);
    let onFailure = onFailureMatch ? onFailureMatch[1] : 'stop';
    // Normalize: warn → flag, fallback → continue, repeat → rollback
    if (onFailure === 'warn') onFailure = 'flag';
    if (onFailure === 'fallback') onFailure = 'continue';

    // Extract capture (the key to store output in result.state)
    const captureMatch = rest.match(/capture:\s*(\w+)/);
    const capture = captureMatch ? captureMatch[1] : null;

    return { engine, method, args, preCondition, onFailure, capture };
  }

  // Parse args string like "storyId, param2" into array of interpolated values
  _parseArgs(raw) {
    if (!raw.trim()) return [];
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Resolve an engine instance from the registry
  _resolveEngine(engineName) {
    // Normalize: "state-manager" -> "stateManager"
    const camelName = engineName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const directName = engineName.replace(/-/g, '_');

    return this.engineRegistry[engineName]
      || this.engineRegistry[camelName]
      || this.engineRegistry[directName]
      || null;
  }

  // Resolve argument values from params, state, and previous step outputs
  _resolveArgs(argNames, params, currentState, stepResults) {
    return argNames.map(name => {
      // Named parameters from params object
      if (params[name] !== undefined) return params[name];

      // 'state' keyword → return the current pipeline state
      if (name === 'state') return currentState;

      // Current state variables
      if (currentState[name] !== undefined) return currentState[name];

      // Step outputs: e.g. "step1" or "step1.output"
      if (name.startsWith('step')) {
        const idx = parseInt(name.replace('step', ''), 10) - 1;
        if (stepResults[idx]) return stepResults[idx].output;
      }

      // Literal strings that start with quotes
      if (name.startsWith("'") || name.startsWith('"')) {
        return name.slice(1, -1);
      }

      return name;
    });
  }

  // Clear the config cache
  clearCache() {
    this.cache.clear();
  }

  // Reload a specific config
  invalidate(workflowId) {
    this.cache.delete(workflowId);
  }
}

module.exports = WorkflowEngine;
