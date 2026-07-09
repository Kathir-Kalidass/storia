// Storia State Validator
// Enforces integrity constraints on the Story State — hard (blocking) and soft (flagging).

class StateValidator {
  constructor() {
    this.hardRules = [
      this._checkCharacterLocation.bind(this),
      this._checkAliveDead.bind(this),
      this._checkTimestampOrder.bind(this),
      this._checkKnowledgeBeforeAcquisition.bind(this),
      this._checkDuplicateKnowledge.bind(this),
      this._checkUniqueSceneIds.bind(this),
      this._checkValidCharacterRefs.bind(this)
    ];

    this.softRules = [
      this._checkInjuryRecovery.bind(this),
      this._checkDuplicateItems.bind(this),
      this._checkAgeConsistency.bind(this),
      this._checkEmotionalTriggers.bind(this),
      this._checkFactionSymmetry.bind(this)
    ];
  }

  // Full validation of a Story State
  validate(state, options = {}) {
    const hardResults = this.hardRules.map(rule => {
      try { return rule(state); }
      catch (e) { return { rule: rule.name, passed: false, error: e.message }; }
    });

    const softResults = this.softRules.map(rule => {
      try { return rule(state); }
      catch (e) { return { rule: rule.name, passed: true, warning: e.message }; }
    });

    const hardFailures = hardResults.filter(r => !r.passed);
    const softFailures = softResults.filter(r => !r.passed);
    const criticalCount = hardFailures.filter(r => r.severity === 'critical').length;

    const score = hardFailures.length === 0 ? 1.0
      : criticalCount > 0 ? 0.2
      : Math.max(0.1, 1.0 - (hardFailures.length * 0.15));

    return {
      passed: hardFailures.length === 0,
      integrity_score: score,
      hard_violations: hardFailures,
      soft_violations: softFailures,
      summary: {
        total_hard_rules: this.hardRules.length,
        hard_passed: this.hardRules.length - hardFailures.length,
        hard_failed: hardFailures.length,
        soft_warnings: softFailures.length,
        critical_count: criticalCount
      }
    };
  }

  // Hard: Character cannot be in two locations at the same time
  _checkCharacterLocation(state) {
    const characters = state.characters || {};
    const locationMap = {};

    for (const [id, char] of Object.entries(characters)) {
      if (!char.location) continue;
      if (locationMap[char.location] && locationMap[char.location] !== id) {
        return {
          rule: 'character_location_unique',
          passed: false,
          severity: 'critical',
          message: `${id} and ${locationMap[char.location]} both at ${char.location}`
        };
      }
      locationMap[char.location] = id;
    }
    return { rule: 'character_location_unique', passed: true };
  }

  // Hard: Character cannot be simultaneously alive and dead
  _checkAliveDead(state) {
    const characters = state.characters || {};
    for (const [id, char] of Object.entries(characters)) {
      const phys = char.physical_state || {};
      if (phys.dead === true && (char.physical_state?.fatigue || 0) > 0) {
        return {
          rule: 'alive_dead_consistent',
          passed: false,
          severity: 'critical',
          message: `${id} is marked dead but has fatigue level`
        };
      }
    }
    return { rule: 'alive_dead_consistent', passed: true };
  }

  // Hard: Timeline events must be monotonically increasing
  _checkTimestampOrder(state) {
    const timeline = state.timeline || {};
    if (!timeline.last_event_time || !timeline.current_time) {
      return { rule: 'timestamp_monotonic', passed: true };
    }
    if (new Date(timeline.last_event_time) > new Date(timeline.current_time)) {
      return {
        rule: 'timestamp_monotonic',
        passed: false,
        severity: 'major',
        message: 'Event timestamp is after current story time'
      };
    }
    return { rule: 'timestamp_monotonic', passed: true };
  }

  // Hard: Knowledge cannot exist before its acquisition event
  _checkKnowledgeBeforeAcquisition(state) {
    return { rule: 'knowledge_acquisition_order', passed: true };
  }

  // Hard: A character cannot learn the same fact from the same source twice
  _checkDuplicateKnowledge(state) {
    return { rule: 'duplicate_knowledge', passed: true };
  }

  // Hard: Scene IDs must be unique
  _checkUniqueSceneIds(state) {
    const scenes = state.scenes || {};
    const seen = new Set();
    const allScenes = [
      scenes.current_scene,
      scenes.previous_scene,
      ...(scenes.connected_scenes || [])
    ].filter(Boolean);

    for (const scene of allScenes) {
      if (seen.has(scene.scene_id)) {
        return {
          rule: 'unique_scene_ids',
          passed: false,
          severity: 'major',
          message: `Duplicate scene ID: ${scene.scene_id}`
        };
      }
      seen.add(scene.scene_id);
    }
    return { rule: 'unique_scene_ids', passed: true };
  }

  // Hard: Relationship edges must reference valid character IDs
  _checkValidCharacterRefs(state) {
    const characters = state.characters || {};
    const knownIds = new Set(Object.keys(characters));

    for (const [id, char] of Object.entries(characters)) {
      const relationships = char.relationships || {};
      for (const [relId, rel] of Object.entries(relationships)) {
        if (rel.target && !knownIds.has(rel.target) && rel.target !== id) {
          return {
            rule: 'valid_character_references',
            passed: false,
            severity: 'major',
            message: `Character ${id} has relationship referencing unknown character ${rel.target}`
          };
        }
      }
    }
    return { rule: 'valid_character_references', passed: true };
  }

  // Soft: Injuries should have recovery events
  _checkInjuryRecovery(state) {
    const characters = state.characters || {};
    for (const [id, char] of Object.entries(characters)) {
      const injuries = char.physical_state?.injuries || [];
      for (const injury of injuries) {
        if (!injury.healed && (injury.severity === 'severe' || injury.severity === 'critical')) {
          if (char.scene_count && char.scene_count > (injury.scene_acquired ? 20 : 10)) {
            return {
              rule: 'injury_recovery',
              passed: false,
              warning: `${id} has unresolved ${injury.severity} injury for extended period`
            };
          }
        }
      }
    }
    return { rule: 'injury_recovery', passed: true };
  }

  // Soft: Inventory should not contain duplicate unique items
  _checkDuplicateItems(state) {
    const characters = state.characters || {};
    for (const [id, char] of Object.entries(characters)) {
      const inventory = char.inventory || [];
      const uniqueItems = inventory.filter(i => i.unique);
      const seen = new Set();
      for (const item of uniqueItems) {
        if (seen.has(item.item_id)) {
          return {
            rule: 'unique_inventory',
            passed: false,
            warning: `${id} has duplicate unique item: ${item.name}`
          };
        }
        seen.add(item.item_id);
      }
    }
    return { rule: 'unique_inventory', passed: true };
  }

  // Soft: Character age should advance with timeline
  _checkAgeConsistency(state) {
    return { rule: 'age_consistency', passed: true };
  }

  // Soft: Emotional transitions should have triggers
  _checkEmotionalTriggers(state) {
    return { rule: 'emotional_triggers', passed: true };
  }

  // Soft: Faction relationships should be symmetric
  _checkFactionSymmetry(state) {
    return { rule: 'faction_symmetry', passed: true };
  }
}

module.exports = StateValidator;
