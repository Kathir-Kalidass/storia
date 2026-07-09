/**
 * Plugin Registry — storia.use() system
 *
 * Plugins register personas, workflows, backends, telemetry, and lifecycle hooks.
 */

const { PluginError } = require('../errors');

class PluginRegistry {
  constructor() {
    this._plugins = new Map();
    this._personaPacks = new Map();
    this._workflowPacks = new Map();
  }

  register(plugin) {
    if (!plugin || !plugin.name) {
      throw new PluginError('Plugin must have a name');
    }
    if (this._plugins.has(plugin.name)) {
      throw new PluginError(`Plugin '${plugin.name}' is already registered`);
    }

    this._plugins.set(plugin.name, plugin);

    if (plugin.personas) {
      this._personaPacks.set(plugin.name, plugin.personas);
    }
    if (plugin.workflows) {
      this._workflowPacks.set(plugin.name, plugin.workflows);
    }

    return this;
  }

  get(name) {
    return this._plugins.get(name) || null;
  }

  list() {
    return Array.from(this._plugins.keys());
  }

  getPersonaPacks() {
    return Array.from(this._personaPacks.values());
  }

  getWorkflowPacks() {
    return Array.from(this._workflowPacks.values());
  }

  async runHook(hookName, ...args) {
    const results = [];
    for (const plugin of this._plugins.values()) {
      if (plugin.hooks && typeof plugin.hooks[hookName] === 'function') {
        try {
          results.push(await plugin.hooks[hookName](...args));
        } catch (err) {
          throw new PluginError(`Plugin '${plugin.name}' hook '${hookName}' failed: ${err.message}`, { cause: err });
        }
      }
    }
    return results;
  }

  clear() {
    this._plugins.clear();
    this._personaPacks.clear();
    this._workflowPacks.clear();
  }
}

module.exports = PluginRegistry;
