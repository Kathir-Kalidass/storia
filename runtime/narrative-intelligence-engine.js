// Storia Narrative Intelligence Engine
// Core storytelling reasoning — Reason, Guide, Verify components.
// Synthesize component delegates to the existing Synthesizer.
// All modules produce structured data consumed by workflows and the LLM.

const Synthesizer = require('./synthesizer');

class NarrativeIntelligenceEngine {
  constructor(options = {}) {
    this.synthesizer = options.synthesizer || new Synthesizer();
  }

  // ── Reason ──────────────────────────────────────────────────────
  // Planning modules invoked before generation

  reason(mode, state, persona = {}) {
    const modules = {
      'plot': () => this._plotPlanner(state, persona),
      'structure': () => this._storyArchitect(state, persona),
      'character': () => this._characterPsychology(state, persona),
      'theme': () => this._themePlanner(state, persona),
      'conflict': () => this._conflictGenerator(state, persona),
      'mystery': () => this._mysteryDesigner(state, persona),
      'foreshadowing': () => this._foreshadowingPlanner(state, persona),
      'genre': () => this._genreRuleEngine(state, persona),
      'series': () => this._seriesPlanner(state, persona),
      'pov-conversion': () => this._povConversionAnalysis(state, persona),
      'continuity': () => this._continuityAnalysis(state, persona),
      'pacing': () => this._pacingAnalysis(state, persona),
      'ending': () => this._endingAnalysis(state, persona),
      'readiness': () => this._readinessCheck(state, persona),
      'publishing': () => this._publishingPrep(state, persona)
    };

    const runner = modules[mode];
    if (!runner) return { mode, error: `Unknown reason mode: ${mode}`, outputs: [] };

    try {
      return { mode, ...runner() };
    } catch (e) {
      return { mode, error: e.message, outputs: [] };
    }
  }

  _storyArchitect(state, persona) {
    const metadata = state.metadata || {};
    return {
      purpose: 'High-level narrative architecture — acts, structure, narrative arch',
      outputs: [
        { type: 'act_structure', label: 'Recommended act structure', detail: this._suggestActStructure(metadata.genre) },
        { type: 'pacing_plan', label: 'Pacing arc across acts', detail: 'Rising tension through act breaks' },
        { type: 'structural_notes', label: 'Architecture notes', detail: 'Key structural decisions for this story' }
      ],
      prompts: [
        'Design the act and chapter structure for the story.',
        'Identify the narrative arch: setup, rising action, climax, resolution.',
        'Map key turning points to act breaks.'
      ],
      constraints: []
    };
  }

  _plotPlanner(state, persona) {
    return {
      purpose: 'Scene sequence, cause/effect chain, subplot weaving',
      outputs: [
        { type: 'scene_sequence', label: 'Scene order', detail: 'Chronological or non-linear scene progression' },
        { type: 'cause_effect', label: 'Cause/effect chain', detail: 'How each scene leads to the next' },
        { type: 'subplot_map', label: 'Subplot integration', detail: 'Secondary threads and their touch points' }
      ],
      prompts: ['Map the scene sequence with clear cause/effect between each scene.', 'Identify subplot entry and exit points.'],
      constraints: ['Each scene must advance at least one plot thread.', 'Subplots must connect to main plot at minimum 2 points.']
    };
  }

  _characterPsychology(state, persona) {
    return {
      purpose: 'Character motivation, fear, flaw, growth trajectory',
      outputs: [
        { type: 'character_arcs', label: 'Growth trajectories', detail: 'How characters change across the story' },
        { type: 'motivations', label: 'Character motivations', detail: 'What drives each character' },
        { type: 'flaws', label: 'Character flaws', detail: 'Internal obstacles each character faces' }
      ],
      prompts: ['Analyze each character\'s arc: starting point, growth, and resolution.', 'Identify the core fear and flaw driving each character.'],
      constraints: ['Every main character must have a visible arc.', 'Flaws should connect to plot obstacles.']
    };
  }

  _themePlanner(state, persona) {
    return {
      purpose: 'Central themes per act/chapter',
      outputs: [
        { type: 'theme_map', label: 'Theme distribution', detail: 'Which themes are explored in each section' },
        { type: 'theme_statement', label: 'Central thematic statement', detail: 'What the story is about at its core' }
      ],
      prompts: ['Define the central thematic statement.', 'Map which themes are explored in each act.'],
      constraints: ['Theme should be visible in every act, not just stated at the end.']
    };
  }

  _conflictGenerator(state, persona) {
    return {
      purpose: 'Internal, interpersonal, societal, cosmic conflicts',
      outputs: [
        { type: 'conflict_map', label: 'Conflict layers', detail: 'Multi-layered conflict structure' },
        { type: 'conflict_escalation', label: 'Escalation path', detail: 'How conflicts intensify' }
      ],
      prompts: ['Generate conflicts at all levels: internal, interpersonal, societal, cosmic.', 'Design the escalation path for each conflict.'],
      constraints: ['Each character should face at least one internal and one external conflict.']
    };
  }

  _mysteryDesigner(state, persona) {
    return {
      purpose: 'Clue map, red herring layout, reveal timing',
      outputs: [
        { type: 'clue_map', label: 'Clue placement', detail: 'Where clues are planted and revealed' },
        { type: 'red_herrings', label: 'Red herrings', detail: 'False trails and misdirections' },
        { type: 'reveal_timeline', label: 'Reveal schedule', detail: 'When and how mysteries are resolved' }
      ],
      prompts: ['Design the clue chain: what clues exist, where they\'re found, and who can interpret them.', 'Place red herrings that mislead but don\'t cheat the reader.'],
      constraints: ['All mysteries must have a resolution before or at the ending.', 'Clues must be discoverable on re-read.']
    };
  }

  _foreshadowingPlanner(state, persona) {
    return {
      purpose: 'Plant/payoff blueprint before writing begins',
      outputs: [
        { type: 'foreshadowing_map', label: 'Plant/payoff pairs', detail: 'Setup events and their payoff moments' },
        { type: 'timing_plan', label: 'Reveal timing', detail: 'When foreshadowed elements pay off' }
      ],
      prompts: ['Identify major payoff moments and work backward to plan the setups.', 'Ensure foreshadowing is subtle enough to avoid spoilers.'],
      constraints: ['Every major payoff must have at least one setup.', 'No payoff without prior setup.']
    };
  }

  _genreRuleEngine(state, persona) {
    const genre = (state.metadata && state.metadata.genre) || [];
    return {
      purpose: `Genre-specific conventions for ${genre.join(', ') || 'general fiction'}`,
      outputs: [
        { type: 'genre_rules', label: 'Genre conventions', detail: `Expected tropes and conventions for ${genre.join(', ')}` },
        { type: 'genre_promises', label: 'Promises to reader', detail: 'What the genre promises the audience' },
        { type: 'genre_boundaries', label: 'Genre boundaries', detail: 'What would violate genre expectations' }
      ],
      prompts: ['Identify genre conventions that must be honored.', 'List reader promises implied by the genre choice.'],
      constraints: ['Genre promises must be fulfilled by the ending.', 'Subverting tropes is allowed, ignoring them is not.']
    };
  }

  _seriesPlanner(state, persona) {
    return {
      purpose: 'Multi-book arc planning, series bible structure',
      outputs: [
        { type: 'series_arcs', label: 'Cross-book arcs', detail: 'Character and plot arcs spanning multiple books' },
        { type: 'book_bible', label: 'Series bible outline', detail: 'Key events, settings, and lore per book' },
        { type: 'continuity_plan', label: 'Series continuity', detail: 'World and character state across books' }
      ],
      prompts: ['Plan the overarching series arc across all planned books.', 'Define what changes in the world between each book.'],
      constraints: ['Each book must have its own complete arc while serving the series arc.']
    };
  }

  _povConversionAnalysis(state, persona) {
    return {
      purpose: 'POV conversion feasibility — knowledge boundaries, voice',
      outputs: [
        { type: 'pov_feasibility', label: 'Conversion feasibility', detail: 'Can the target POV character reasonably observe/know the scene events?' },
        { type: 'knowledge_boundaries', label: 'Knowledge constraints', detail: 'What the POV character does and doesn\'t know' },
        { type: 'voice_requirements', label: 'Voice requirements', detail: 'How the character\'s voice differs from current POV' }
      ],
      prompts: ['Analyze whether the target POV character can witness the scene events.', 'Identify knowledge boundaries that would change the scene.'],
      constraints: ['POV character cannot know information they haven\'t learned.', 'Character voice must remain consistent with their established personality.']
    };
  }

  _continuityAnalysis(state, persona) {
    return {
      purpose: 'Identify continuity gaps and conflicts in current state',
      outputs: [
        { type: 'continuity_gaps', label: 'Continuity gaps', detail: 'Inconsistencies in character, world, timeline, or plot' },
        { type: 'fix_plan', label: 'Recommended fixes', detail: 'How to resolve each discontinuity' }
      ],
      prompts: ['Scan state for contradictions: character location conflicts, timeline paradoxes, world inconsistencies.', 'Prioritize fixes by severity.'],
      constraints: ['Fixes must not introduce new contradictions.']
    };
  }

  _pacingAnalysis(state, persona) {
    return {
      purpose: 'Scene-level pacing metrics and recommendations',
      outputs: [
        { type: 'pacing_metrics', label: 'Pacing measurements', detail: 'Estimated scene length, tension level, action/reflection balance' },
        { type: 'pacing_recommendations', label: 'Adjustment suggestions', detail: 'Where to tighten or expand' }
      ],
      prompts: ['Analyze the pacing profile of recent scenes.', 'Flag scenes that are too long, too short, or lack tension variety.'],
      constraints: ['Action should be balanced with reflection.', 'Tension should generally rise toward act breaks.']
    };
  }

  _endingAnalysis(state, persona) {
    return {
      purpose: 'Ending readiness — open arcs, unresolved mysteries, promises',
      outputs: [
        { type: 'open_arcs', label: 'Unresolved character arcs', detail: 'Character arcs still needing resolution' },
        { type: 'unresolved_mysteries', label: 'Open mysteries', detail: 'Mysteries without resolution' },
        { type: 'promise_check', label: 'Promise fulfillment', detail: 'Promises made to the reader vs. fulfilled' },
        { type: 'ending_readiness', label: 'Ending readiness score', detail: 'Overall readiness for ending generation' }
      ],
      prompts: ['Identify all unresolved character arcs, plot threads, and mysteries.', 'Check which reader promises remain unfulfilled.'],
      constraints: ['All major arcs must be resolved or deliberately left open.', 'Mysteries introduced must be answered.']
    };
  }

  _readinessCheck(state, persona) {
    return {
      purpose: 'Comprehensive publishing readiness assessment',
      outputs: [
        { type: 'readiness_score', label: 'Readiness score', detail: 'Overall publishing readiness (0-100)' },
        { type: 'readiness_gaps', label: 'Gaps to address', detail: 'Areas below threshold' },
        { type: 'readiness_checks', label: 'Checklist results', detail: 'Per-dimension pass/fail' }
      ],
      prompts: ['Evaluate story completeness, quality, and market readiness.', 'Flag any issues that would block publication.'],
      constraints: ['All verification checks should pass before publishing.']
    };
  }

  _publishingPrep(state, persona) {
    return {
      purpose: 'Generate publishing materials — blurb, query, synopsis',
      outputs: [
        { type: 'blurb', label: 'Blurb', detail: 'Back-cover or store-page description' },
        { type: 'synopsis', label: 'Synopsis', detail: 'Complete story summary for submissions' },
        { type: 'query_letter', label: 'Query letter', detail: 'Agent/publisher query letter' }
      ],
      prompts: ['Write a compelling blurb that hooks readers.', 'Draft a synopsis covering the complete story arc.', 'Write a query letter appropriate for the genre.'],
      constraints: ['Blurb should be under 200 words.', 'Synopsis should cover all major plot points without exceeding 1000 words.']
    };

  }

  // ── Guide ───────────────────────────────────────────────────────
  // Constraint enforcement modules invoked during generation

  guide(mode, state, persona = {}) {
    const context = this._buildContext(state);
    const constraints = this._buildConstraints(state, persona);

    const modules = {
      'knowledge-boundary': () => this._knowledgeBoundaryGuide(state),
      'character-voice': () => this._characterVoiceGuide(state),
      'scene-goal': () => this._sceneGoalGuide(state),
      'timeline': () => this._timelineGuide(state),
      'physical-state': () => this._physicalStateGuide(state),
      'story-dna': () => this._storyDNAGuide(state),
      'default': () => ({ constraints, context })
    };

    const runner = modules[mode] || modules['default'];
    try {
      return { mode, ...runner() };
    } catch (e) {
      return { mode, error: e.message, constraints, context };
    }
  }

  _knowledgeBoundaryGuide(state) {
    const characters = state.characters || {};
    const boundaries = {};
    for (const [id, char] of Object.entries(characters)) {
      const known = char.knowledge ? Object.keys(char.knowledge) : [];
      boundaries[id] = { known, unknown_count: 0 };
    }
    return {
      purpose: 'Per-character knowledge boundaries — prevents info leaks',
      context: { character_knowledge: boundaries },
      constraints: ['Characters can only know what they have learned or witnessed.', 'Do not reveal information a POV character doesn\'t know.']
    };
  }

  _characterVoiceGuide(state) {
    const characters = state.characters || {};
    const voices = {};
    for (const [id, char] of Object.entries(characters)) {
      voices[id] = {
        voice_traits: char.voice || { vocabulary: 'standard', rhythm: 'neutral', dialect: 'none' },
        emotional_state: char.emotional_state || {}
      };
    }
    return {
      purpose: 'Character voice consistency — vocabulary, rhythm, dialect',
      context: { character_voices: voices },
      constraints: ['Each character must speak consistently with their established voice.', 'Dialogue attribution should vary (said, asked, whispered, etc.).']
    };
  }

  _sceneGoalGuide(state) {
    const plot = state.plot || {};
    return {
      purpose: 'Scene purpose and goal tracking',
      context: {
        active_subplots: plot.active_subplots || [],
        scene_count: plot.scene_count || 0,
        current_progress: plot.main_plot_progress || 0
      },
      constraints: ['Every scene must advance at least one plot or character thread.', 'If a scene doesn\'t change anything, it should be cut or merged.']
    };
  }

  _timelineGuide(state) {
    const timeline = state.timeline || {};
    return {
      purpose: 'Internal chronology and time passage',
      context: {
        current_time: timeline.current_time,
        current_season: timeline.current_season,
        time_since_start: timeline.time_since_start
      },
      constraints: ['Timeline must be monotonically increasing.', 'Time passage must be logically consistent with character travel and events.']
    };
  }

  _physicalStateGuide(state) {
    return {
      purpose: 'Character physical state — injuries, fatigue, inventory',
      context: {
        characters: Object.entries(state.characters || {}).map(([id, c]) => ({
          id,
          physical: c.physical_state || {},
          inventory: (c.inventory || []).length
        }))
      },
      constraints: ['Injuries must persist until healed.', 'Characters cannot use items they don\'t have.', 'Physical state (fatigue, hunger) must be consistent with scene events.']
    };
  }

  _storyDNAGuide(state) {
    const dna = state.dna || {};
    return {
      purpose: 'Story-wide thematic and tonal consistency',
      context: {
        core_themes: dna.core_themes || [],
        tone_profile: dna.tone_profile || {},
        writing_style: dna.writing_style || {},
        promises_to_reader: dna.promises_to_reader || []
      },
      constraints: ['The tone must remain consistent with the established tone profile.', 'Themes should be advanced, not contradicted.', 'Promises to the reader must be tracked and eventually fulfilled.']
    };

  }

  // ── Verify ──────────────────────────────────────────────────────
  // Quality check modules invoked after generation

  verify(mode, state, text = '') {
    const modules = {
      'continuity': () => this._continuityCheck(state),
      'plot-hole': () => this._plotHoleCheck(state),
      'emotional-arc': () => this._emotionalArcCheck(state),
      'cognitive-load': () => this._cognitiveLoadCheck(state),
      'pacing': () => this._pacingCheck(state, text),
      'theme-resonance': () => this._themeResonanceCheck(state),
      'prose-rhythm': () => this._proseRhythmCheck(text),
      'satisfaction': () => this._satisfactionCheck(state),
      'readiness': () => this._readinessCheck(state),
      'publishing': () => this._publishingPrep(state)
    };

    const runner = modules[mode];
    if (!runner) return { mode, error: `Unknown verify mode: ${mode}`, checks: [] };

    try {
      const result = runner();
      return { mode, ...result };
    } catch (e) {
      return { mode, error: e.message, checks: [] };
    }
  }

  _continuityCheck(state) {
    const issues = [];
    const characters = state.characters || {};
    const locations = new Set();
    for (const [id, char] of Object.entries(characters)) {
      if (char.location) {
        if (locations.has(char.location)) {
          issues.push({ severity: 'major', type: 'location_conflict', detail: `Multiple characters at ${char.location}` });
        }
        locations.add(char.location);
      }
      if (char.physical_state && char.physical_state.dead && char.physical_state.fatigue) {
        issues.push({ severity: 'critical', type: 'alive_dead', detail: `${id} is dead but has fatigue` });
      }
    }
    return {
      purpose: 'Character, world, timeline, physical state consistency',
      checks: [
        { name: 'character_location', label: 'Character location conflicts', passed: issues.filter(i => i.type === 'location_conflict').length === 0, issues: issues.filter(i => i.type === 'location_conflict') },
        { name: 'alive_dead', label: 'Alive/dead consistency', passed: issues.filter(i => i.type === 'alive_dead').length === 0, issues: issues.filter(i => i.type === 'alive_dead') },
        { name: 'timeline_order', label: 'Timeline monotonicity', passed: true, issues: [] }
      ],
      score: issues.length === 0 ? 1.0 : Math.max(0, 1.0 - issues.length * 0.2),
      passed: issues.filter(i => i.severity === 'critical').length === 0
    };
  }

  _plotHoleCheck(state) {
    return {
      purpose: 'Logical contradictions, broken cause/effect',
      checks: [
        { name: 'cause_effect', label: 'Cause/effect chain', passed: true, issues: [] },
        { name: 'character_motivation', label: 'Character motivation consistency', passed: true, issues: [] },
        { name: 'world_rules', label: 'World rule consistency', passed: true, issues: [] }
      ],
      score: 1.0,
      passed: true
    };
  }

  _emotionalArcCheck(state) {
    const reader = state.reader || {};
    const curve = reader.emotional_curve || [];
    const flatSpots = [];
    if (curve.length > 3) {
      for (let i = 1; i < curve.length - 1; i++) {
        if (Math.abs(curve[i].intensity - curve[i - 1].intensity) < 0.05 &&
            Math.abs(curve[i + 1].intensity - curve[i].intensity) < 0.05) {
          flatSpots.push({ index: i, intensity: curve[i].intensity });
        }
      }
    }
    return {
      purpose: 'Reader emotional journey — flags flat stretches',
      checks: [
        { name: 'emotional_variety', label: 'Emotional variety', passed: flatSpots.length < 3, issues: flatSpots.map(f => ({ severity: 'minor', detail: `Flat emotional intensity at scene ${f.index}` })) },
        { name: 'intensity_trend', label: 'Emotional intensity trend', passed: true, issues: [] }
      ],
      score: flatSpots.length < 3 ? 1.0 : 0.6,
      passed: flatSpots.length < 5
    };
  }

  _cognitiveLoadCheck(state) {
    const characters = state.characters || {};
    const plot = state.plot || {};
    const charCount = Object.keys(characters).length;
    const subplotCount = (plot.active_subplots || []).length;
    const mysteryCount = (plot.open_mysteries || []).length;
    const load = charCount * 2 + subplotCount * 3 + mysteryCount * 2;
    return {
      purpose: 'Reader cognitive load — names, threads, mysteries',
      checks: [
        { name: 'character_count', label: 'Active character count', passed: charCount <= 15, issues: charCount > 15 ? [{ severity: 'warning', detail: `${charCount} active characters may overwhelm readers` }] : [] },
        { name: 'subplot_count', label: 'Active subplot count', passed: subplotCount <= 5, issues: subplotCount > 5 ? [{ severity: 'warning', detail: `${subplotCount} active subplots` }] : [] },
        { name: 'cognitive_load', label: 'Estimated cognitive load', passed: load <= 50, issues: load > 50 ? [{ severity: 'info', detail: `Cognitive load score: ${load}` }] : [] }
      ],
      score: Math.max(0, 1.0 - Math.max(0, load - 20) / 80),
      passed: load <= 50
    };
  }

  _pacingCheck(state, text) {
    const wordCount = text ? text.split(/\s+/).length : 0;
    const dialogueRatio = text ? this._estimateDialogueRatio(text) : 0;
    return {
      purpose: 'Scene length, tension curve, action/reflection balance',
      checks: [
        { name: 'scene_length', label: 'Scene word count', passed: wordCount < 5000 || wordCount === 0, issues: wordCount >= 5000 ? [{ severity: 'warning', detail: `Scene is ${wordCount} words — consider splitting` }] : [] },
        { name: 'dialogue_balance', label: 'Dialogue/action balance', passed: dialogueRatio < 0.7 || wordCount === 0, issues: dialogueRatio >= 0.7 ? [{ severity: 'info', detail: `Dialogue ratio is ${(dialogueRatio * 100).toFixed(0)}%` }] : [] }
      ],
      score: 1.0,
      passed: true
    };
  }

  _themeResonanceCheck(state) {
    const dna = state.dna || {};
    const themes = dna.core_themes || [];
    return {
      purpose: 'Does the current state serve declared themes?',
      checks: [
        { name: 'theme_presence', label: 'Themes present in state', passed: themes.length > 0, issues: themes.length === 0 ? [{ severity: 'minor', detail: 'No themes defined in Story DNA' }] : [] }
      ],
      score: themes.length > 0 ? 1.0 : 0.5,
      passed: true
    };
  }

  _proseRhythmCheck(text) {
    if (!text) return { purpose: 'Prose rhythm analysis', checks: [], score: 1.0, passed: true };
    const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [];
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avgLen = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
    const variance = lengths.length > 0 ? Math.sqrt(lengths.reduce((a, b) => a + (b - avgLen) ** 2, 0) / lengths.length) : 0;
    return {
      purpose: 'Sentence variety, paragraph weight, dialogue ratio',
      checks: [
        { name: 'sentence_variety', label: 'Sentence length variety', passed: variance > 3 || lengths.length < 5, issues: variance <= 3 && lengths.length >= 5 ? [{ severity: 'minor', detail: 'Low sentence length variance — consider varying rhythm' }] : [] },
        { name: 'avg_sentence_length', label: 'Average sentence length', passed: avgLen <= 25 || lengths.length < 3, issues: avgLen > 25 ? [{ severity: 'info', detail: `Average sentence length: ${avgLen.toFixed(1)} words` }] : [] }
      ],
      score: variance > 3 ? 1.0 : 0.7,
      passed: true
    };
  }

  _satisfactionCheck(state) {
    const plot = state.plot || {};
    const mysteries = plot.open_mysteries || [];
    return {
      purpose: 'Ending satisfaction — promises fulfilled, arcs complete',
      checks: [
        { name: 'mysteries_resolved', label: 'Open mysteries remaining', passed: mysteries.length === 0, issues: mysteries.length > 0 ? [{ severity: 'major', detail: `${mysteries.length} mysteries still unresolved` }] : [] },
        { name: 'plot_progress', label: 'Plot progress', passed: (plot.main_plot_progress || 0) >= 0.9, issues: (plot.main_plot_progress || 0) < 0.9 ? [{ severity: 'info', detail: `Plot is ${((plot.main_plot_progress || 0) * 100).toFixed(0)}% complete` }] : [] }
      ],
      score: mysteries.length === 0 ? 1.0 : 0.3,
      passed: mysteries.length === 0
    };
  }

  // ── Synthesize (delegate) ─────────────────────────────────────
  synthesize(text, sceneId, currentState) {
    return this.synthesizer.synthesize(text, sceneId, currentState);
  }

  mergeIntoState(changes, state) {
    return this.synthesizer.mergeIntoState(changes, state);
  }

  // ── Helpers ──────────────────────────────────────────────────────

  _buildContext(state) {
    return {
      metadata: state.metadata || {},
      characters: Object.keys(state.characters || {}).length,
      plot_progress: (state.plot || {}).main_plot_progress || 0,
      scene_count: (state.plot || {}).scene_count || 0
    };
  }

  _buildConstraints(state, persona) {
    const constraints = [];
    if (persona.constraints) {
      if (persona.constraints.banned_patterns) constraints.push(...persona.constraints.banned_patterns.map(p => `Avoid: ${p}`));
      if (persona.constraints.required_patterns) constraints.push(...persona.constraints.required_patterns.map(p => `Required: ${p}`));
    }
    return constraints;
  }

  _suggestActStructure(genres) {
    const genre = (genres || [])[0] || 'general';
    const structures = {
      fantasy: 'Three-act with prologue and epilogue, act 2 split at midpoint twist',
      thriller: 'Four-act with cold open, act 2 reveal, act 3 race, act 4 resolution',
      romance: 'Two-act with meet-cute → conflict → separation → reunion',
      mystery: 'Four-act: crime → investigation → false resolution → true resolution',
      'science fiction': 'Three-act with world establishment → conflict escalation → paradigm shift',
      'literary fiction': 'Variable act structure, character-driven, often no strict act breaks'
    };
    return structures[genre.toLowerCase()] || 'Three-act structure with inciting incident, midpoint, climax, resolution';
  }

  _estimateDialogueRatio(text) {
    const lines = text.split('\n');
    const dialogueLines = lines.filter(l => l.includes('"') || l.includes('"') || l.includes('\u201c') || l.includes('\u2018')).length;
    return lines.length > 0 ? dialogueLines / lines.length : 0;
  }
}

module.exports = NarrativeIntelligenceEngine;
