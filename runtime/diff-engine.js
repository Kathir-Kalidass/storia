// Storia Diff Engine
// Computes structured diffs between Story State versions: added, modified, removed.

class DiffEngine {
  constructor() {
    this.diffs = [];
  }

  // Compute diff between two state snapshots
  compute(oldState, newState, options = {}) {
    const sceneId = options.sceneId || 'unknown';
    const diff = {
      version: newState._version || 'unknown',
      parent: oldState._version || 'unknown',
      scene_id: sceneId,
      timestamp: new Date().toISOString(),
      added: [],
      modified: [],
      removed: []
    };

    // Compare character state
    const oldChars = oldState.characters || {};
    const newChars = newState.characters || {};
    for (const [id, newChar] of Object.entries(newChars)) {
      const oldChar = oldChars[id];
      if (!oldChar) {
        diff.added.push({ path: `characters.${id}`, type: 'character' });
        continue;
      }

      // Location changes
      if (oldChar.location !== newChar.location) {
        diff.modified.push({
          path: `characters.${id}.location`,
          from: oldChar.location,
          to: newChar.location
        });
      }

      // Emotional state changes
      const oldEmo = oldChar.emotional_state?.primary_emotion;
      const newEmo = newChar.emotional_state?.primary_emotion;
      if (oldEmo && newEmo && oldEmo !== newEmo) {
        diff.modified.push({
          path: `characters.${id}.emotional_state.primary_emotion`,
          from: oldEmo,
          to: newEmo
        });
      }

      // Physical state changes
      const oldInjuries = oldChar.physical_state?.injuries?.length || 0;
      const newInjuries = newChar.physical_state?.injuries?.length || 0;
      if (newInjuries > oldInjuries) {
        diff.modified.push({
          path: `characters.${id}.physical_state.injuries`,
          from: `${oldInjuries} injuries`,
          to: `${newInjuries} injuries`
        });
      }

      // Arc progress
      if (oldChar.arc_progress !== newChar.arc_progress) {
        diff.modified.push({
          path: `characters.${id}.arc_progress`,
          from: oldChar.arc_progress,
          to: newChar.arc_progress
        });
      }
    }

    // Detect removed characters
    for (const id of Object.keys(oldChars)) {
      if (!newChars[id]) {
        diff.removed.push({ path: `characters.${id}`, type: 'character' });
      }
    }

    // Compare plot state
    const oldPlot = oldState.plot || {};
    const newPlot = newState.plot || {};

    if (oldPlot.main_plot_progress !== newPlot.main_plot_progress) {
      diff.modified.push({
        path: 'plot.main_plot_progress',
        from: oldPlot.main_plot_progress,
        to: newPlot.main_plot_progress
      });
    }

    // Detect new mysteries
    const oldMysteries = new Set((oldPlot.open_mysteries || []).map(m => m.id));
    for (const mystery of (newPlot.open_mysteries || [])) {
      if (!oldMysteries.has(mystery.id)) {
        diff.added.push({ path: `plot.open_mysteries.${mystery.id}`, type: 'mystery', detail: mystery.description });
      }
    }

    // Detect resolved mysteries
    const newMysteries = new Set((newPlot.open_mysteries || []).map(m => m.id));
    for (const mystery of (oldPlot.open_mysteries || [])) {
      if (!newMysteries.has(mystery.id)) {
        diff.removed.push({ path: `plot.open_mysteries.${mystery.id}`, type: 'resolved_mystery' });
      }
    }

    // Compare timeline
    const oldTime = oldState.timeline?.current_time;
    const newTime = newState.timeline?.current_time;
    if (oldTime && newTime && oldTime !== newTime) {
      diff.modified.push({
        path: 'timeline.current_time',
        from: oldTime,
        to: newTime
      });
    }

    // Compare reader model
    const oldQLen = (oldState.reader?.open_questions || []).length;
    const newQLen = (newState.reader?.open_questions || []).length;
    if (oldQLen !== newQLen) {
      diff.modified.push({
        path: 'reader.open_questions',
        from: `${oldQLen} questions`,
        to: `${newQLen} questions`
      });
    }

    // Compare scene count
    const oldSceneCount = oldPlot.scene_count || 0;
    const newSceneCount = newPlot.scene_count || 0;
    if (newSceneCount > oldSceneCount) {
      diff.added.push({
        path: `scenes.scene_${newSceneCount}`,
        type: 'new_scene',
        scene_count: newSceneCount
      });
    }

    this.diffs.push(diff);
    return diff;
  }

  // Get a human-readable summary of a diff
  summarize(diff) {
    const parts = [];
    if (diff.added.length > 0) {
      parts.push(`Added (${diff.added.length}): ${diff.added.map(a => a.path.split('.').pop()).join(', ')}`);
    }
    if (diff.modified.length > 0) {
      parts.push(`Modified (${diff.modified.length}): ${diff.modified.map(m => `${m.path}: ${m.from} → ${m.to}`).join(', ')}`);
    }
    if (diff.removed.length > 0) {
      parts.push(`Removed (${diff.removed.length}): ${diff.removed.map(r => r.path.split('.').pop()).join(', ')}`);
    }
    return parts.join('\n');
  }

  // Rollback state to a previous version
  rollback(currentState, diff) {
    const rolled = JSON.parse(JSON.stringify(currentState));

    for (const change of diff.added) {
      this._removePath(rolled, change.path);
    }
    for (const change of diff.modified) {
      this._setPath(rolled, change.path, change.from);
    }
    for (const change of diff.removed) {
      this._setPath(rolled, change.path, change.value || null);
    }

    rolled._version = this._bumpVersion(currentState._version);
    return rolled;
  }

  _removePath(obj, path) {
    const parts = path.split('.');
    const key = parts.pop();
    const parent = parts.reduce((o, p) => o?.[p], obj);
    if (parent && key in parent) delete parent[key];
  }

  _setPath(obj, path, value) {
    const parts = path.split('.');
    const key = parts.pop();
    const parent = parts.reduce((o, p) => o?.[p], obj);
    if (parent) parent[key] = value;
  }

  _bumpVersion(v) {
    const parts = v.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  }

  // Get diff history
  getHistory() {
    return [...this.diffs];
  }

  // Clear diff history
  clearHistory() {
    this.diffs = [];
  }
}

module.exports = DiffEngine;
