// Storia State Manager
// Manages Story State persistence: active state, archive, versioning, budgets, and concurrency.

const path = require('path');
const fs = require('fs');

const SECTION_BUDGETS = {
  metadata: { soft: 2048, hard: 3072 },
  dna: { soft: 5120, hard: 7168 },
  characters: { soft: 30720, hard: 40960 },
  world: { soft: 15360, hard: 20480 },
  timeline: { soft: 10240, hard: 12288 },
  reader: { soft: 10240, hard: 12288 },
  plot: { soft: 15360, hard: 20480 },
  scenes: { soft: 10240, hard: 15360 }
};

class StateManager {
  constructor(options = {}) {
    this.storiaDir = options.storiaDir;
    this.locks = new Map();
    this.cache = new Map();
  }

  async initialize() {
    if (!this.storiaDir) {
      this.storiaDir = path.join(process.env.HOME || '', '.config', 'storia');
    }
    if (!fs.existsSync(this.storiaDir)) {
      fs.mkdirSync(this.storiaDir, { recursive: true });
    }
  }

  // Load active state for a story
  async load(storyId) {
    if (this.cache.has(storyId)) {
      return this.cache.get(storyId);
    }

    const statePath = path.join(this.storiaDir, storyId, 'active.json');
    if (!fs.existsSync(statePath)) {
      return null;
    }

    const raw = fs.readFileSync(statePath, 'utf-8');
    const state = JSON.parse(raw);
    this.cache.set(storyId, state);
    return state;
  }

  // Write active state with versioning
  async write(storyId, state, reason = 'state_synthesized') {
    const storyDir = path.join(this.storiaDir, storyId);
    const activePath = path.join(storyDir, 'active.json');
    const versionsDir = path.join(storyDir, 'archive', 'revisions');

    if (!fs.existsSync(versionsDir)) {
      fs.mkdirSync(versionsDir, { recursive: true });
    }

    // Version the current state before overwriting
    if (fs.existsSync(activePath)) {
      const currentRaw = fs.readFileSync(activePath, 'utf-8');
      const currentState = JSON.parse(currentRaw);
      const version = this._nextVersion(currentState._version || '0.0.0');
      const versionFile = path.join(versionsDir, `v${version}.json`);

      state._version = version;
      state._parent = currentState._version || '0.0.0';

      const versionRecord = {
        version,
        parent: currentState._version || '0.0.0',
        timestamp: new Date().toISOString(),
        reason,
        checksum: this._checksum(currentRaw),
        size_bytes: currentRaw.length
      };
      fs.writeFileSync(versionFile, JSON.stringify(versionRecord, null, 2));
    } else {
      state._version = '1.0.0';
      state._parent = null;
    }

    state._updated_at = new Date().toISOString();

    // Enforce budgets
    const serialized = JSON.stringify(state);
    this._enforceBudgets(state, serialized, storyDir);

    fs.writeFileSync(activePath, serialized);
    this.cache.set(storyId, state);

    return state._version;
  }

  // Archive a scene from active cache to archive
  async archiveScene(storyId, sceneId) {
    const state = await this.load(storyId);
    if (!state || !state.scenes) return null;

    const storyDir = path.join(this.storiaDir, storyId);
    const archiveDir = path.join(storyDir, 'archive', 'scenes');
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

    // Find and archive the scene
    const scene = state.scenes.connected_scenes.find(s => s.scene_id === sceneId)
      || state.scenes.previous_scene;

    if (scene) {
      fs.writeFileSync(path.join(archiveDir, `${sceneId}.json`), JSON.stringify(scene, null, 2));
      state.scenes.connected_scenes = state.scenes.connected_scenes.filter(s => s.scene_id !== sceneId);
      if (state.scenes.previous_scene && state.scenes.previous_scene.scene_id === sceneId) {
        state.scenes.previous_scene = null;
      }
      await this.write(storyId, state, 'scene_archived');
    }

    return scene;
  }

  // Demote a scene from archive back to active
  async restoreScene(storyId, sceneId) {
    const storyDir = path.join(this.storiaDir, storyId);
    const archivePath = path.join(storyDir, 'archive', 'scenes', `${sceneId}.json`);

    if (!fs.existsSync(archivePath)) return null;

    const scene = JSON.parse(fs.readFileSync(archivePath, 'utf-8'));
    const state = await this.load(storyId);
    if (!state) return null;

    state.scenes.connected_scenes.push(scene);
    await this.write(storyId, state, 'scene_restored');

    return scene;
  }

  // List all stories in the registry
  async listStories() {
    if (!fs.existsSync(this.storiaDir)) return [];

    return fs.readdirSync(this.storiaDir)
      .filter(name => name.startsWith('story_'))
      .map(name => {
        const statePath = path.join(this.storiaDir, name, 'active.json');
        if (!fs.existsSync(statePath)) return null;
        try {
          const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
          return {
            story_id: name,
            title: state.metadata?.title || 'Untitled',
            genre: state.metadata?.genre || [],
            status: state.metadata?.status || 'unknown',
            updated_at: state._updated_at || state.metadata?.updated_at
          };
        } catch { return null; }
      })
      .filter(Boolean);
  }

  // Get budget report for active state
  getBudgetReport(state) {
    const raw = JSON.stringify(state);
    const totalBytes = Buffer.byteLength(raw, 'utf-8');
    const sections = {};

    for (const [key, budget] of Object.entries(SECTION_BUDGETS)) {
      const sectionRaw = JSON.stringify(state[key] || {});
      const size = Buffer.byteLength(sectionRaw, 'utf-8');
      sections[key] = {
        size,
        soft_limit: budget.soft,
        hard_limit: budget.hard,
        within_budget: size <= budget.soft,
        warning: size > budget.soft && size <= budget.hard,
        exceeded: size > budget.hard
      };
    }

    return {
      total_bytes: totalBytes,
      target: 102400,
      hard_ceiling: 129000,
      within_target: totalBytes <= 102400,
      sections
    };
  }

  _enforceBudgets(state, serialized, storyDir) {
    const budget = this.getBudgetReport(state);
    if (budget.total_bytes > 129000) {
      console.warn(`Story State exceeds hard ceiling (${budget.total_bytes} bytes). Triggering compaction.`);
      for (const [key, info] of Object.entries(budget.sections)) {
        if (info.exceeded && key !== 'metadata' && key !== 'dna') {
          if (key === 'characters') {
            const entries = Object.entries(state.characters || {});
            if (entries.length > 0) {
              const [oldestId] = entries.reduce((a, b) =>
                (a[1].scene_count || 0) < (b[1].scene_count || 0) ? a : b
              );
              const oldDir = path.join(storyDir, 'archive', 'characters');
              if (!fs.existsSync(oldDir)) fs.mkdirSync(oldDir, { recursive: true });
              fs.writeFileSync(path.join(oldDir, `${oldestId}.json`), JSON.stringify(state.characters[oldestId], null, 2));
              delete state.characters[oldestId];
            }
          }
        }
      }
    }
  }

  _nextVersion(current) {
    const parts = current.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    if (parts[2] >= 100) { parts[2] = 0; parts[1] = (parts[1] || 0) + 1; }
    if (parts[1] >= 100) { parts[1] = 0; parts[0] = (parts[0] || 0) + 1; }
    return parts.join('.');
  }

  _checksum(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'chk_' + Math.abs(hash).toString(36);
  }
}

module.exports = StateManager;
