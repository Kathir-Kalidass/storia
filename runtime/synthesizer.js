// Storia State Synthesizer
// Extracts structured state changes from generated narrative text with confidence scoring.

class Synthesizer {
  constructor() {
    this.extractors = {
      character: this._extractCharacterChanges.bind(this),
      location: this._extractLocationChanges.bind(this),
      knowledge: this._extractKnowledgeEvents.bind(this),
      timeline: this._extractTimelineAdvances.bind(this),
      emotion: this._extractEmotionalChanges.bind(this),
      relationship: this._extractRelationshipChanges.bind(this),
      physical: this._extractPhysicalChanges.bind(this)
    };
  }

  // Main entry: extract all state changes from narrative text
  synthesize(sceneText, sceneId, currentState) {
    const changes = {
      scene_id: sceneId,
      timestamp: new Date().toISOString(),
      character_updates: [],
      knowledge_events: [],
      location_changes: [],
      timeline_advances: [],
      emotional_changes: [],
      relationship_changes: [],
      physical_changes: [],
      new_mysteries: [],
      payoffs: [],
      reader_questions: []
    };

    for (const [key, extractor] of Object.entries(this.extractors)) {
      try {
        const result = extractor(sceneText, currentState);
        if (result) {
          Object.assign(changes, result);
        }
      } catch (err) {
        console.warn(`Synthesizer extractor ${key} failed:`, err.message);
      }
    }

    // Apply confidence scoring
    changes.character_updates = changes.character_updates.map(c => ({
      ...c,
      confidence: this._scoreConfidence(c)
    }));
    changes.knowledge_events = changes.knowledge_events.map(k => ({
      ...k,
      confidence: this._scoreConfidence(k)
    }));

    return changes;
  }

  // Analyze and score the confidence of an extracted fact
  _scoreConfidence(fact) {
    let score = 0.7; // base confidence

    // Explicit statements are more confident
    if (fact.explicit) score += 0.2;
    if (fact.repeated) score += 0.1;

    // Consistency with existing state raises confidence
    if (fact.consistent_with_state) score += 0.1;

    // Implied or inferred facts are less confident
    if (fact.inferred) score -= 0.15;
    if (fact.vague) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  // Extract character state changes from text
  _extractCharacterChanges(text, state) {
    const changes = [];
    const characterPatterns = [
      { pattern: /(\w+)\s+(felt|feels|feeling)\s+(\w+)/gi, type: 'emotion' },
      { pattern: /(\w+)\s+(moved|walked|ran|went|traveled|headed)\s+(to|toward|into)\s+(\w+(?:\s+\w+)?)/gi, type: 'location' },
    ];

    const knownCharacters = state?.characters ? Object.keys(state.characters) : [];

    for (const { pattern, type } of characterPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1];
        if (knownCharacters.length > 0 && !knownCharacters.includes(name)) continue;
        changes.push({
          type,
          character: name,
          value: match[0],
          explicit: true,
          source: match[0]
        });
      }
    }

    return { character_updates: changes };
  }

  // Extract knowledge events (who learned what)
  _extractKnowledgeEvents(text, state) {
    const events = [];
    const knowledgePatterns = [
      { pattern: /(\w+)\s+(learned|discovered|realized|noticed|saw|heard|found out)\s+(that\s+)?(.+?)[.!?]/gi, type: 'learned' },
      { pattern: /(\w+)\s+(didn't know|had no idea|was unaware)\s+(that\s+)?(.+?)[.!?]/gi, type: 'still_unknown' },
      { pattern: /(\w+)\s+(told|informed|revealed to|showed)\s+(\w+)\s+(that\s+)?(.+?)[.!?]/gi, type: 'told' },
    ];

    for (const { pattern, type } of knowledgePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (type === 'told') {
          events.push({
            fact: match[5],
            source_character: match[1],
            target_character: match[3],
            from_type: 'private',
            to_type: 'private',
            source: 'told',
            reliability: 0.7,
            explicit: true
          });
        } else if (type === 'learned') {
          events.push({
            fact: match[4],
            character: match[1],
            from_type: 'unknown',
            to_type: 'private',
            source: 'witnessed',
            reliability: 0.8,
            explicit: true
          });
        }
      }
    }

    return { knowledge_events: events };
  }

  // Extract location changes
  _extractLocationChanges(text, state) {
    const changes = [];
    const locationPattern = /(\w+)\s+(entered|arrived at|left|returned to|reached)\s+(.+?)[.!?,;]/gi;
    let match;

    while ((match = locationPattern.exec(text)) !== null) {
      changes.push({
        character: match[1],
        action: match[2],
        location: match[3].trim(),
        explicit: true
      });
    }

    return { location_changes: changes };
  }

  // Extract timeline advances
  _extractTimelineAdvances(text, state) {
    const advances = [];
    const timePatterns = [
      { pattern: /(hours?|days?|weeks?|months?|years?)\s+(passed|later|earlier|before|after)/gi, type: 'duration' },
      { pattern: /(morning|afternoon|evening|night|dawn|dusk)\s+(came|arrived|fell|approached)/gi, type: 'time_of_day' },
      { pattern: /the\s+(next|following)\s+(day|morning|afternoon|evening|night|week|month)/gi, type: 'time_skip' },
    ];

    for (const { pattern, type } of timePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        advances.push({
          type,
          value: match[0],
          explicit: true
        });
      }
    }

    return { timeline_advances: advances };
  }

  // Extract emotional changes
  _extractEmotionalChanges(text, state) {
    const changes = [];
    const emotionPattern = /(\w+)\s+(felt|feels|was feeling|became|grew)\s+(\w+(?:\s+\w+)?)/gi;
    let match;

    while ((match = emotionPattern.exec(text)) !== null) {
      changes.push({
        character: match[1],
        emotion: match[3],
        explicit: true
      });
    }

    return { emotional_changes: changes };
  }

  // Extract relationship changes
  _extractRelationshipChanges(text, state) {
    const changes = [];
    const relPatterns = [
      { pattern: /(\w+)\s+(trusted|distrusted|hated|loved|feared|respected|despised)\s+(\w+)/gi, type: 'sentiment' },
      { pattern: /(\w+)\s+(became|grew)\s+(closer|distant|colder|warmer)\s+(to|with)\s+(\w+)/gi, type: 'distance' },
    ];

    for (const { pattern, type } of relPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (type === 'sentiment') {
          changes.push({
            character_a: match[1],
            sentiment: match[2],
            character_b: match[3],
            type,
            explicit: true
          });
        } else {
          changes.push({
            character_a: match[1],
            change: match[3],
            character_b: match[5],
            type,
            explicit: true
          });
        }
      }
    }

    return { relationship_changes: changes };
  }

  // Extract physical state changes
  _extractPhysicalChanges(text, state) {
    const changes = [];
    const physicalPatterns = [
      { pattern: /(\w+)\s+(was|were)\s+(injured|wounded|hurt|bleeding|poisoned|sick|exhausted)/gi, type: 'injury' },
      { pattern: /(\w+)\s+(picked up|grabbed|took|found|acquired)\s+(?:a|an|the)\s+(.+?)[.!?,;]/gi, type: 'inventory_add' },
    ];

    for (const { pattern, type } of physicalPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (type === 'injury') {
          changes.push({
            character: match[1],
            condition: match[3],
            type: 'new_injury',
            explicit: true
          });
        } else if (type === 'inventory_add') {
          changes.push({
            character: match[1],
            item: match[3].trim(),
            action: 'acquired',
            type: 'inventory',
            explicit: true
          });
        }
      }
    }

    return { physical_changes: changes };
  }

  // Merge synthesis results into existing state
  mergeIntoState(changes, state) {
    const merged = JSON.parse(JSON.stringify(state));
    const staged = { auto_commit: [], flagged: [], rejected: [] };

    // Process character updates
    for (const update of changes.character_updates) {
      const name = update.character;
      if (!merged.characters[name]) continue;

      if (update.confidence >= 0.95) {
        staged.auto_commit.push(update);
        if (update.type === 'location') {
          merged.characters[name].location = update.value;
        }
      } else if (update.confidence >= 0.70) {
        staged.flagged.push(update);
      } else {
        staged.rejected.push(update);
      }
    }

    // Process knowledge events
    for (const event of changes.knowledge_events) {
      event.confidence = event.confidence || this._scoreConfidence(event);
      if (event.confidence >= 0.95) {
        staged.auto_commit.push(event);
      } else if (event.confidence >= 0.70) {
        staged.flagged.push(event);
      } else {
        staged.rejected.push(event);
      }
    }

    return {
      merged_state: staged.auto_commit.length > 0 ? merged : state,
      staged,
      commit_count: staged.auto_commit.length,
      flag_count: staged.flagged.length,
      reject_count: staged.rejected.length
    };
  }
}

module.exports = Synthesizer;
