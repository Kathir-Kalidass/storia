// Storia Optimizer
// Context compaction, cache promotion/archive, budget enforcement.
// Invoked by Runtime after every state write or when budget limits are exceeded.

const path = require('path');
const fs = require('fs');

const DEFAULT_BUDGETS = {
  total_target: 102400,
  hard_ceiling: 129000,
  sections: {
    metadata: { soft: 2048, hard: 3072, priority: 'critical' },
    dna: { soft: 5120, hard: 7168, priority: 'critical' },
    characters: { soft: 30720, hard: 40960, priority: 'high' },
    world: { soft: 15360, hard: 20480, priority: 'high' },
    timeline: { soft: 10240, hard: 12288, priority: 'medium' },
    reader: { soft: 10240, hard: 12288, priority: 'medium' },
    plot: { soft: 15360, hard: 20480, priority: 'medium' },
    scenes: { soft: 10240, hard: 15360, priority: 'low' }
  }
};

class Optimizer {
  constructor(options = {}) {
    this.budgets = options.budgets || DEFAULT_BUDGETS;
    this.compactionLog = [];
  }

  // Main entry: run the full optimization pipeline
  optimize(state, storyDir, options = {}) {
    const report = {
      timestamp: new Date().toISOString(),
      pre_optimization_size: 0,
      post_optimization_size: 0,
      bytes_saved: 0,
      sections_compacted: [],
      archive_promotions: [],
      warnings: []
    };

    const preRaw = JSON.stringify(state);
    report.pre_optimization_size = Buffer.byteLength(preRaw, 'utf-8');

    // 1. Compact context
    const compactResult = this.compactContext(state, options);
    report.sections_compacted = compactResult.compacted;

    // 2. Enforce budgets — archive if over hard limit
    if (options.enforceBudget !== false) {
      const budgetResult = this.enforceBudget(state, storyDir, options);
      report.archive_promotions = budgetResult.promoted;
      report.warnings = budgetResult.warnings;
    }

    const postRaw = JSON.stringify(state);
    report.post_optimization_size = Buffer.byteLength(postRaw, 'utf-8');
    report.bytes_saved = report.pre_optimization_size - report.post_optimization_size;

    this.compactionLog.push(report);
    return report;
  }

  // Compact the active state: shorten strings, remove redundancy, compress narrative fields
  compactContext(state, options = {}) {
    const compacted = [];

    // Compact character descriptions and backstories
    if (state.characters) {
      for (const [id, char] of Object.entries(state.characters)) {
        if (char.backstory && char.backstory.length > 500) {
          char.backstory = this._truncatePreservingFacts(char.backstory, 500);
          compacted.push(`characters.${id}.backstory`);
        }
        if (char.description && char.description.length > 300) {
          char.description = this._truncatePreservingFacts(char.description, 300);
          compacted.push(`characters.${id}.description`);
        }
        if (char.appearance && char.appearance.length > 200) {
          char.appearance = this._truncatePreservingFacts(char.appearance, 200);
          compacted.push(`characters.${id}.appearance`);
        }
      }
    }

    // Compact world descriptions
    if (state.world) {
      if (state.world.description && state.world.description.length > 500) {
        state.world.description = this._truncatePreservingFacts(state.world.description, 500);
        compacted.push('world.description');
      }
      if (state.world.active_locations) {
        for (const [locId, loc] of Object.entries(state.world.active_locations)) {
          if (loc.description && loc.description.length > 300) {
            loc.description = this._truncatePreservingFacts(loc.description, 300);
            compacted.push(`world.active_locations.${locId}.description`);
          }
        }
      }
    }

    // Compact reader model — keep only last N emotional curve points
    if (state.reader && state.reader.emotional_curve && state.reader.emotional_curve.length > 20) {
      state.reader.emotional_curve = state.reader.emotional_curve.slice(-20);
      compacted.push('reader.emotional_curve');
    }

    // Compact plot mysteries — remove verbose descriptions
    if (state.plot && state.plot.open_mysteries) {
      for (const mystery of state.plot.open_mysteries) {
        if (mystery.description && mystery.description.length > 200) {
          mystery.description = this._truncatePreservingFacts(mystery.description, 200);
          compacted.push('plot.open_mysteries.description');
        }
      }
    }

    // Compact scene connected_scenes — keep only essential fields
    if (state.scenes && state.scenes.connected_scenes) {
      for (const scene of state.scenes.connected_scenes) {
        if (scene.summary && scene.summary.length > 300) {
          scene.summary = this._truncatePreservingFacts(scene.summary, 300);
          compacted.push(`scenes.connected_scenes.${scene.scene_id}.summary`);
        }
      }
    }

    return { compacted };
  }

  // Enforce budget limits — archive cold data when over hard ceiling
  enforceBudget(state, storyDir, options = {}) {
    const promoted = [];
    const warnings = [];
    const raw = JSON.stringify(state);
    const totalBytes = Buffer.byteLength(raw, 'utf-8');

    if (totalBytes <= this.budgets.total_target) {
      return { promoted, warnings };
    }

    if (totalBytes > this.budgets.hard_ceiling) {
      warnings.push(`State exceeds hard ceiling (${totalBytes} bytes > ${this.budgets.hard_ceiling}). Archiving cold data.`);
    } else {
      warnings.push(`State exceeds target (${totalBytes} bytes > ${this.budgets.total_target}). Selective compaction recommended.`);
    }

    // Archive low-priority sections if over hard ceiling
    if (totalBytes > this.budgets.hard_ceiling) {
      const sectionOrder = ['scenes', 'reader', 'plot', 'timeline', 'world', 'characters'];

      for (const section of sectionOrder) {
        if (totalBytes <= this.budgets.total_target) break;
        if (!state[section]) continue;

        const result = this._archiveSection(state, storyDir, section, options);
        promoted.push(...result.promoted);
        if (result.bytesFreed) {
          const newRaw = JSON.stringify(state);
          const newBytes = Buffer.byteLength(newRaw, 'utf-8');
          // Recalculate after each section
        }
      }
    }

    return { promoted, warnings };
  }

  // Archive a specific section of state
  _archiveSection(state, storyDir, section, options) {
    const result = { promoted: [], bytesFreed: 0 };

    if (section === 'scenes' && state.scenes) {
      const scenesToArchive = state.scenes.connected_scenes || [];
      const archiveDir = path.join(storyDir, 'archive', 'scenes');
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

      // Archive oldest scenes first
      const toRemove = scenesToArchive.slice(0, Math.max(0, scenesToArchive.length - 3));
      for (const scene of toRemove) {
        fs.writeFileSync(
          path.join(archiveDir, `${scene.scene_id || 'scene_' + Date.now()}.json`),
          JSON.stringify(scene, null, 2)
        );
        result.promoted.push(`scenes.${scene.scene_id}`);
      }
      state.scenes.connected_scenes = scenesToArchive.slice(-3);
      result.bytesFreed = JSON.stringify(toRemove).length;

    } else if (section === 'reader' && state.reader) {
      if (state.reader.emotional_curve && state.reader.emotional_curve.length > 10) {
        const archiveDir = path.join(storyDir, 'archive', 'summaries');
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
        const archived = state.reader.emotional_curve.slice(0, -10);
        fs.writeFileSync(
          path.join(archiveDir, 'emotional_curve_archive.json'),
          JSON.stringify(archived, null, 2)
        );
        result.promoted.push('reader.emotional_curve');
        state.reader.emotional_curve = state.reader.emotional_curve.slice(-10);
        result.bytesFreed = JSON.stringify(archived).length;
      }

    } else if (section === 'plot' && state.plot) {
      if (state.plot.active_subplots && state.plot.active_subplots.length > 5) {
        const archiveDir = path.join(storyDir, 'archive', 'summaries');
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
        const archived = state.plot.active_subplots.slice(0, -5);
        fs.writeFileSync(
          path.join(archiveDir, 'completed_subplots.json'),
          JSON.stringify(archived, null, 2)
        );
        result.promoted.push('plot.active_subplots');
        state.plot.active_subplots = state.plot.active_subplots.slice(-5);
        result.bytesFreed = JSON.stringify(archived).length;
      }

    } else if (section === 'characters' && state.characters) {
      const entries = Object.entries(state.characters);
      if (entries.length > 10) {
        const archiveDir = path.join(storyDir, 'archive', 'knowledge');
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
        const sorted = entries.sort((a, b) => (a[1].scene_count || 0) - (b[1].scene_count || 0));
        const toRemove = sorted.slice(0, entries.length - 10);
        for (const [id, char] of toRemove) {
          fs.writeFileSync(path.join(archiveDir, `${id}.json`), JSON.stringify(char, null, 2));
          delete state.characters[id];
          result.promoted.push(`characters.${id}`);
          result.bytesFreed += JSON.stringify(char).length;
        }
      }
    }

    return result;
  }

  // Get a compaction report for the current state
  getCompactionReport(state) {
    const raw = JSON.stringify(state);
    const totalBytes = Buffer.byteLength(raw, 'utf-8');
    const sections = {};

    for (const [key, budget] of Object.entries(this.budgets.sections)) {
      const sectionRaw = JSON.stringify(state[key] || {});
      const size = Buffer.byteLength(sectionRaw, 'utf-8');
      sections[key] = {
        size,
        soft_limit: budget.soft,
        hard_limit: budget.hard,
        priority: budget.priority,
        within_budget: size <= budget.soft,
        warning: size > budget.soft && size <= budget.hard,
        exceeded: size > budget.hard,
        compaction_candidates: this._findCompactionCandidates(state, key)
      };
    }

    return {
      total_bytes: totalBytes,
      target: this.budgets.total_target,
      hard_ceiling: this.budgets.hard_ceiling,
      within_target: totalBytes <= this.budgets.total_target,
      sections,
      can_compact: totalBytes > this.budgets.total_target * 0.8,
      needs_archival: totalBytes > this.budgets.hard_ceiling
    };
  }

  // Identify compaction candidates within a section
  _findCompactionCandidates(state, section) {
    const candidates = [];

    if (section === 'characters' && state.characters) {
      for (const [id, char] of Object.entries(state.characters)) {
        if (char.backstory && char.backstory.length > 500) {
          candidates.push({ path: `characters.${id}.backstory`, current_size: char.backstory.length });
        }
        if (char.description && char.description.length > 300) {
          candidates.push({ path: `characters.${id}.description`, current_size: char.description.length });
        }
      }
    }

    if (section === 'reader' && state.reader) {
      const curveLen = (state.reader.emotional_curve || []).length;
      if (curveLen > 20) {
        candidates.push({ path: 'reader.emotional_curve', current_size: curveLen, suggested: 20 });
      }
    }

    if (section === 'scenes' && state.scenes) {
      const sceneCount = (state.scenes.connected_scenes || []).length;
      if (sceneCount > 5) {
        candidates.push({ path: 'scenes.connected_scenes', current_size: sceneCount, suggested: 5 });
      }
    }

    return candidates;
  }

  // Truncate a string while preserving key narrative facts
  _truncatePreservingFacts(text, maxLen) {
    if (text.length <= maxLen) return text;
    const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
    let result = '';
    for (const sentence of sentences) {
      if ((result + sentence).length > maxLen - 3) break;
      result += sentence;
    }
    if (result.length < text.length) result += '...';
    return result || text.slice(0, maxLen - 3) + '...';
  }

  // Get optimizer log
  getHistory() {
    return [...this.compactionLog];
  }

  // Clear optimizer log
  clearHistory() {
    this.compactionLog = [];
  }
}

module.exports = Optimizer;
