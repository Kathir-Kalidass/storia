// Storia Prompt Engine
// Loads, composes, and serves prompt templates from the prompts/ directory.

const path = require('path');
const fs = require('fs');

class PromptEngine {
  constructor(options = {}) {
    this.promptsDir = options.promptsDir || path.join(__dirname, '..', 'prompts');
    this.cache = new Map();
  }

  // Load a prompt template by category and name
  load(category, name) {
    const cacheKey = `${category}/${name}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const filePath = path.join(this.promptsDir, category, `${name}.md`);
    if (!fs.existsSync(filePath)) {
      this.cache.set(cacheKey, null);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    this.cache.set(cacheKey, content);
    return content;
  }

  // Load a workflow prompt by workflow ID
  workflowPrompt(workflowId) {
    const name = this._workflowFileName(workflowId);
    return this.load('workflows', name);
  }

  // Load a system prompt by name
  systemPrompt(name) {
    return this.load('system', name);
  }

  // Load an engine prompt by name
  enginePrompt(name) {
    return this.load('engines', name);
  }

  // Load a persona prompt by name
  personaPrompt(name) {
    return this.load('personas', name);
  }

  // Compose a full prompt for a workflow execution
  composeWorkflowPrompt(workflowId, systemContext = {}, engineContext = {}) {
    const parts = [];

    // System prompt
    const system = this.systemPrompt('storia-agent');
    if (system) parts.push(system);

    // Narrative framework
    const framework = this.systemPrompt('narrative-framework');
    if (framework) parts.push(framework);

    // Workflow-specific prompt
    const workflow = this.workflowPrompt(workflowId);
    if (workflow) parts.push(workflow);

    // Engine guidance
    if (engineContext.engine) {
      const enginePrompt = this.enginePrompt(engineContext.engine);
      if (enginePrompt) parts.push(enginePrompt);
    }

    return parts.join('\n\n---\n\n');
  }

  // Compose a verification prompt
  composeVerifyPrompt(mode) {
    const verifyGuide = this.enginePrompt('verify-engine');
    const parts = [];
    if (verifyGuide) parts.push(verifyGuide);
    parts.push(`Verify mode: ${mode}`);
    return parts.join('\n\n');
  }

  // List all available prompts
  listPrompts() {
    if (!fs.existsSync(this.promptsDir)) return [];
    const result = [];
    const categories = fs.readdirSync(this.promptsDir);
    for (const category of categories) {
      const catDir = path.join(this.promptsDir, category);
      if (!fs.statSync(catDir).isDirectory()) continue;
      const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        result.push({
          category,
          name: file.replace(/\.md$/, ''),
          path: path.join(category, file)
        });
      }
    }
    return result;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  _workflowFileName(workflowId) {
    const names = {
      'W001': 'W001-start-story', 'W002': 'W002-continue-story',
      'W003': 'W003-plan-novel', 'W004': 'W004-build-character',
      'W005': 'W005-build-world', 'W006': 'W006-review-chapter',
      'W007': 'W007-fix-continuity', 'W008': 'W008-improve-dialogue',
      'W009': 'W009-improve-pacing', 'W010': 'W010-generate-ending',
      'W011': 'W011-rewrite-scene', 'W012': 'W012-convert-pov',
      'W013': 'W013-expand-scene', 'W014': 'W014-compress-scene',
      'W015': 'W015-create-series', 'W016': 'W016-prepare-publication'
    };
    return names[workflowId] || workflowId.toLowerCase();
  }
}

module.exports = PromptEngine;
