// Storia Persona Engine
// Loads persona configs from personas/{category}/{name}/config.json,
// composes multiple personas with priority rules, resolves conflicts,
// and produces configuration deltas for engine tuning.

const path = require('path');
const fs = require('fs');

const DEFAULT_CONFIG = {
  tone: { formality: 0.5, darkness: 0.3, humor: 0.3, emotional_intensity: 0.5, poetic_density: 0.3, descriptive_density: 0.5 },
  writing_style: { sentence_length_target: 'varied', paragraph_density: 'moderate', dialogue_ratio: 0.4, narrative_distance: 'close', show_vs_tell: 0.6, metaphor_frequency: 'occasional', dialect_use: 'light' },
  verification_focus: { priority_checks: [], ignored_checks: [], tolerance: {}, minimum_confidence: 0.7 },
  engine_overrides: { reason_modules: { enabled: [], disabled: [], config: {} }, guide_modules: { enabled: [], disabled: [], config: {} }, verify_modules: { enabled: [], disabled: [], config: {} }, creative_capabilities: { enabled: [], disabled: [], config: {} } },
  memory_overrides: { active_state_priority: [], archive_frequency: 'normal', scene_cache_size: 10 },
  workflow_preferences: { preferred_workflows: [], default_workflow: null },
  constraints: { incompatible_personas: [], required_personas: [], max_sentence_length: 80, min_sentence_length: 1, banned_patterns: [], required_patterns: [], content_boundaries: [] },
  prompt_prefix: null
};

class PersonaEngine {
  constructor(options = {}) {
    this.personasDir = options.personasDir || path.join(__dirname, '..', 'personas');
    this.cache = new Map();
  }

  // Resolve a persona stack into a single composed configuration
  resolve(personaStack, genre, language) {
    const stack = typeof personaStack === 'string'
      ? { primary: personaStack }
      : { primary: 'novelist', ...personaStack };

    const priorityOrder = ['primary', 'secondary', 'style', 'language', 'audience'];
    const configs = [];
    const loaded = [];

    // Load configs, then sort so highest priority merges LAST (overwrites lower)
    for (const role of priorityOrder) {
      const id = stack[role];
      if (!id) continue;
      const cfg = this.loadPersona(id);
      if (cfg) {
        configs.push({ role, id, config: cfg });
        loaded.push(id);
      }
    }
    // Reverse: lowest priority first, so highest priority (primary) overwrites last
    configs.reverse();

    if (configs.length === 0) {
      const fallback = this.loadPersona('novelist');
      if (fallback) configs.push({ role: 'primary', id: 'novelist', config: fallback });
    }

    const composed = this._compose(configs, priorityOrder, genre, language);

    return {
      persona_ids: loaded,
      stack,
      composed,
      delta: this._computeDelta(composed)
    };
  }

  // Load a single persona config by ID
  loadPersona(personaId) {
    if (this.cache.has(personaId)) return this.cache.get(personaId);

    const found = this._findPersona(personaId);
    if (!found) {
      console.warn(`Persona not found: ${personaId}`);
      this.cache.set(personaId, null);
      return null;
    }

    const configPath = path.join(found.dir, 'config.json');
    if (!fs.existsSync(configPath)) {
      this.cache.set(personaId, null);
      return null;
    }

    const raw = fs.readFileSync(configPath, 'utf-8');
    let config;
    try {
      config = JSON.parse(raw);
    } catch (e) {
      console.warn(`Invalid config for persona ${personaId}: ${e.message}`);
      this.cache.set(personaId, null);
      return null;
    }

    this.cache.set(personaId, config);
    return config;
  }

  // Compose multiple persona configs with priority resolution
  _compose(configs, priorityOrder, genre, language) {
    const result = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    for (const { role, id, config } of configs) {
      this._mergeTone(result, config, role, priorityOrder);
      this._mergeWritingStyle(result, config, role, priorityOrder);
      this._mergeVerificationFocus(result, config, role, priorityOrder);
      this._mergeEngineOverrides(result, config, role, priorityOrder);
      this._mergeMemoryOverrides(result, config, role, priorityOrder);
      this._mergeWorkflowPrefs(result, config, role, priorityOrder);
      this._mergeConstraints(result, config, role, priorityOrder);
      this._mergePromptPrefix(result, config, role, priorityOrder);
    }

    // Filter by genre/language compatibility
    if (genre) {
      for (const { config } of configs) {
        const supported = config.supported_genres || [];
        if (supported.length > 0 && !supported.includes(genre)) {
          // Warn but don't block — genre mismatch is soft
        }
      }
    }

    return result;
  }

  // Merge tone: higher priority overwrites numeric values
  _mergeTone(result, config, role, priorityOrder) {
    if (!config.tone) return;
    for (const [key, value] of Object.entries(config.tone)) {
      if (typeof value === 'number') {
        result.tone[key] = value;
      }
    }
  }

  // Merge writing style: higher priority overwrites
  _mergeWritingStyle(result, config, role, priorityOrder) {
    if (!config.writing_style) return;
    const overrides = { sentence_length_target: 1, paragraph_density: 1, dialogue_ratio: 1, show_vs_tell: 1, metaphor_frequency: 1, dialect_use: 1 };
    for (const [key, value] of Object.entries(config.writing_style)) {
      if (overrides[key] || typeof value === 'number' || typeof value === 'string') {
        result.writing_style[key] = value;
      }
    }
    // narrative_distance only overrides if explicitly set (it's a string enum)
    if (config.writing_style.narrative_distance) {
      result.writing_style.narrative_distance = config.writing_style.narrative_distance;
    }
  }

  _mergeVerificationFocus(result, config, role, priorityOrder) {
    if (!config.verification_focus) return;
    const vf = config.verification_focus;
    if (vf.priority_checks) {
      result.verification_focus.priority_checks = this._mergeArrays(
        result.verification_focus.priority_checks, vf.priority_checks, role, priorityOrder
      );
    }
    if (vf.ignored_checks) {
      result.verification_focus.ignored_checks = this._mergeArrays(
        result.verification_focus.ignored_checks, vf.ignored_checks, role, priorityOrder
      );
    }
    if (vf.tolerance && typeof vf.tolerance === 'object') {
      result.verification_focus.tolerance = { ...result.verification_focus.tolerance, ...vf.tolerance };
    }
    if (vf.minimum_confidence !== undefined) {
      result.verification_focus.minimum_confidence = vf.minimum_confidence;
    }
  }

  _mergeEngineOverrides(result, config, role, priorityOrder) {
    if (!config.engine_overrides) return;
    for (const section of ['reason_modules', 'guide_modules', 'verify_modules', 'creative_capabilities']) {
      const override = config.engine_overrides[section];
      if (!override) continue;
      const target = result.engine_overrides[section];
      if (override.enabled) {
        target.enabled = this._mergeArrays(target.enabled, override.enabled, role, priorityOrder);
      }
      if (override.disabled) {
        target.disabled = this._mergeArrays(target.disabled, override.disabled, role, priorityOrder);
      }
      if (override.config && typeof override.config === 'object') {
        target.config = { ...target.config, ...override.config };
      }
    }
  }

  _mergeMemoryOverrides(result, config, role, priorityOrder) {
    if (!config.memory_overrides) return;
    if (config.memory_overrides.active_state_priority) {
      result.memory_overrides.active_state_priority = config.memory_overrides.active_state_priority;
    }
    if (config.memory_overrides.archive_frequency) {
      result.memory_overrides.archive_frequency = config.memory_overrides.archive_frequency;
    }
    if (config.memory_overrides.scene_cache_size) {
      result.memory_overrides.scene_cache_size = config.memory_overrides.scene_cache_size;
    }
  }

  _mergeWorkflowPrefs(result, config, role, priorityOrder) {
    if (!config.workflow_preferences) return;
    if (config.workflow_preferences.preferred_workflows) {
      result.workflow_preferences.preferred_workflows = this._mergeArrays(
        result.workflow_preferences.preferred_workflows, config.workflow_preferences.preferred_workflows, role, priorityOrder
      );
    }
    if (config.workflow_preferences.default_workflow) {
      result.workflow_preferences.default_workflow = config.workflow_preferences.default_workflow;
    }
  }

  _mergeConstraints(result, config, role, priorityOrder) {
    if (!config.constraints) return;
    for (const key of ['incompatible_personas', 'required_personas', 'banned_patterns', 'required_patterns', 'content_boundaries']) {
      if (config.constraints[key]) {
        result.constraints[key] = this._mergeArrays(result.constraints[key], config.constraints[key], role, priorityOrder);
      }
    }
    if (config.constraints.max_sentence_length !== undefined) {
      result.constraints.max_sentence_length = Math.min(result.constraints.max_sentence_length, config.constraints.max_sentence_length);
    }
  }

  _mergePromptPrefix(result, config, role, priorityOrder) {
    if (config.prompt_prefix) {
      result.prompt_prefix = result.prompt_prefix
        ? `${result.prompt_prefix}\n\n${config.prompt_prefix}`
        : config.prompt_prefix;
    }
  }

  // Merge arrays: deduplicated union. Highest-priority persona merges last so its items are included.
  _mergeArrays(base, incoming, role, priorityOrder) {
    const seen = new Set(base);
    const merged = [...base];
    for (const item of incoming) {
      if (!seen.has(item)) {
        merged.push(item);
        seen.add(item);
      }
    }
    return merged;
  }

  // Compute delta between composed config and defaults
  _computeDelta(composed) {
    const delta = {};
    for (const [section, values] of Object.entries(composed)) {
      if (section === 'prompt_prefix' && values) {
        delta[section] = values;
        continue;
      }
      const defaults = DEFAULT_CONFIG[section];
      if (!defaults) { delta[section] = values; continue; }
      const sectionDelta = {};
      for (const [key, value] of Object.entries(values)) {
        const defaultVal = defaults[key];
        if (JSON.stringify(value) !== JSON.stringify(defaultVal)) {
          sectionDelta[key] = value;
        }
      }
      if (Object.keys(sectionDelta).length > 0) {
        delta[section] = sectionDelta;
      }
    }
    return delta;
  }

  // Find a persona by ID across all category directories
  _findPersona(personaId) {
    if (!fs.existsSync(this.personasDir)) return null;

    const categories = fs.readdirSync(this.personasDir);
    for (const category of categories) {
      const categoryDir = path.join(this.personasDir, category);
      if (!fs.statSync(categoryDir).isDirectory()) continue;
      const personaDir = path.join(categoryDir, personaId);
      if (fs.existsSync(personaDir) && fs.statSync(personaDir).isDirectory()) {
        return { category, dir: personaDir };
      }
    }
    return null;
  }

  // List all available personas
  listPersonas() {
    if (!fs.existsSync(this.personasDir)) return [];
    const result = [];
    const categories = fs.readdirSync(this.personasDir);
    for (const category of categories) {
      const categoryDir = path.join(this.personasDir, category);
      if (!fs.statSync(categoryDir).isDirectory()) continue;
      const entries = fs.readdirSync(categoryDir);
      for (const entry of entries) {
        const configPath = path.join(categoryDir, entry, 'config.json');
        if (fs.existsSync(configPath)) {
          try {
            const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            result.push({
              id: cfg.persona_id || entry,
              name: cfg.name || entry,
              category,
              tags: cfg.tags || [],
              supported_genres: cfg.supported_genres || [],
              supported_languages: cfg.supported_languages || []
            });
          } catch {}
        }
      }
    }
    return result;
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = PersonaEngine;
