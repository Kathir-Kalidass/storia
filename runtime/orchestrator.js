// Storia Runtime Orchestrator
// Core engine that routes user intent to workflows, loads state, invokes engines, and returns results.

const path = require('path');
const fs = require('fs');

class StoriaOrchestrator {
  constructor(options = {}) {
    this.storiaDir = options.storiaDir || path.join(process.env.HOME || '', '.config', 'storia');
    this.stateManager = null;
    this.synthesizer = null;
    this.validator = null;
    this.diffEngine = null;
    this.optimizer = null;
    this.activeStoryId = null;
    this.sessionContext = {};
  }

  // Detect user intent from natural language request
  detectIntent(request) {
    const lower = request.toLowerCase();

    if (this._matchAny(lower, ['start new', 'begin a', 'new story', 'new novel', 'new project', 'write a story'])) {
      return { intent: 'start_new_story', workflow: 'W001', confidence: 0.95 };
    }
    if (this._matchAny(lower, ['continue', 'next chapter', 'resume', 'next scene', 'write next'])) {
      return { intent: 'continue_story', workflow: 'W002', confidence: 0.95 };
    }
    if (this._matchAny(lower, ['plan', 'outline', 'structure', 'plot a', 'story architecture'])) {
      return { intent: 'plan_novel', workflow: 'W003', confidence: 0.9 };
    }
    if (this._matchAny(lower, ['create character', 'create a character', 'design character', 'build character', 'character profile', 'new character'])) {
      return { intent: 'build_character', workflow: 'W004', confidence: 0.95 };
    }
    if (this._matchAny(lower, ['worldbuild', 'build world', 'create world', 'design world', 'kingdom', 'magic system'])) {
      return { intent: 'build_world', workflow: 'W005', confidence: 0.9 };
    }
    if (this._matchAny(lower, ['review', 'check chapter', 'analyze', 'feedback', 'read chapter'])) {
      return { intent: 'review_chapter', workflow: 'W006', confidence: 0.85 };
    }
    if (this._matchAny(lower, ['fix continuity', 'fix plot hole', 'continuity error', 'contradiction'])) {
      return { intent: 'fix_continuity', workflow: 'W007', confidence: 0.9 };
    }
    if (this._matchAny(lower, ['improve dialogue', 'fix dialogue', 'dialogue feels', 'better conversation'])) {
      return { intent: 'improve_dialogue', workflow: 'W008', confidence: 0.9 };
    }
    if (this._matchAny(lower, ['fix pacing', 'too slow', 'too fast', 'improve pacing'])) {
      return { intent: 'improve_pacing', workflow: 'W009', confidence: 0.85 };
    }
    if (this._matchAny(lower, ['ending', 'finale', 'conclude', 'finish story', 'write ending'])) {
      return { intent: 'generate_ending', workflow: 'W010', confidence: 0.9 };
    }
    if (this._matchAny(lower, ['rewrite', 'redraft', 'try again', 'rewrite scene'])) {
      return { intent: 'rewrite_scene', workflow: 'W011', confidence: 0.85 };
    }
    if (this._matchAny(lower, ['change pov', 'change perspective', 'convert pov', 'from another character'])) {
      return { intent: 'convert_pov', workflow: 'W012', confidence: 0.9 };
    }
    if (this._matchAny(lower, ['expand', 'add detail', 'lengthen', 'flesh out'])) {
      return { intent: 'expand_scene', workflow: 'W013', confidence: 0.85 };
    }
    if (this._matchAny(lower, ['compress', 'shorten', 'tighten', 'condense', 'make shorter'])) {
      return { intent: 'compress_scene', workflow: 'W014', confidence: 0.85 };
    }
    if (this._matchAny(lower, ['sequel', 'series', 'series bible', 'next book'])) {
      return { intent: 'create_series', workflow: 'W015', confidence: 0.9 };
    }
    if (this._matchAny(lower, ['publish', 'publication', 'ready to publish', 'prepare for publishing', 'final check'])) {
      return { intent: 'prepare_publication', workflow: 'W016', confidence: 0.9 };
    }

    return { intent: 'unknown', workflow: null, confidence: 0 };
  }

  // Main entry point: process a user request
  async process(request, storyId) {
    const intent = this.detectIntent(request);
    if (intent.confidence < 0.5) {
      return {
        success: false,
        error: 'unrecognized_intent',
        message: 'Could not determine what you want to do with Storia. Try: start a new story, continue the story, create a character, build a world, review chapter, fix continuity.',
        intent
      };
    }

    this.activeStoryId = storyId;

    if (!this.workflowEngine) {
      await this.initialize();
    }

    const workflowResult = await this.workflowEngine.run(intent.workflow, {
      storyId,
      initialState: { storyId }
    });

    return {
      success: workflowResult.success,
      intent,
      storyId,
      workflow: {
        id: intent.workflow,
        title: workflowResult.workflow_id,
        steps: workflowResult.steps,
        rolled_back: workflowResult.rolled_back,
        warnings: workflowResult.warnings
      },
      error: workflowResult.error
    };
  }

  // Load all engines with their dependencies
  async initialize() {
    const StateManager = require('./state-manager');
    const Synthesizer = require('./synthesizer');
    const Validator = require('./validator');
    const DiffEngine = require('./diff-engine');
    const Optimizer = require('./optimizer');
    const WorkflowEngine = require('./workflow-engine');
    const PersonaEngine = require('./persona-engine');
    const NarrativeIntelligenceEngine = require('./narrative-intelligence-engine');

    this.stateManager = new StateManager({ storiaDir: this.storiaDir });
    this.synthesizer = new Synthesizer();
    this.validator = new Validator();
    this.diffEngine = new DiffEngine();
    this.optimizer = new Optimizer();
    this.personaEngine = new PersonaEngine();
    this.niEngine = new NarrativeIntelligenceEngine({ synthesizer: this.synthesizer });
    this.workflowEngine = new WorkflowEngine({
      engineRegistry: {
        'orchestrator': this,
        'state-manager': this.stateManager,
        'stateManager': this.stateManager,
        'synthesizer': this.synthesizer,
        'validator': this.validator,
        'diff-engine': this.diffEngine,
        'diffEngine': this.diffEngine,
        'optimizer': this.optimizer,
        'persona-engine': this.personaEngine,
        'personaEngine': this.personaEngine,
        'narrative-intelligence': this.niEngine,
        'narrativeIntelligence': this.niEngine,
        'creative': this.niEngine
      }
    });

    await this.stateManager.initialize();
    return this;
  }

  // Create a new story state
  async createStory(title, genre, language, options = {}) {
    const storyId = this._generateId();
    const statePath = path.join(this.storiaDir, storyId);

    fs.mkdirSync(statePath, { recursive: true });
    fs.mkdirSync(path.join(statePath, 'archive', 'scenes'), { recursive: true });
    fs.mkdirSync(path.join(statePath, 'archive', 'summaries'), { recursive: true });
    fs.mkdirSync(path.join(statePath, 'archive', 'revisions'), { recursive: true });
    fs.mkdirSync(path.join(statePath, 'archive', 'knowledge'), { recursive: true });

    const metadata = {
      story_id: storyId,
      title,
      genre: Array.isArray(genre) ? genre : [genre],
      language: language || 'en',
      secondary_languages: options.secondaryLanguages || [],
      themes: options.themes || [],
      target_audience: options.audience || 'general',
      tone: options.tone || 'neutral',
      pov: options.pov || 'third-limited',
      narrative_style: options.style || 'literary',
      status: 'planning',
      current_chapter: 0,
      total_chapters: options.totalChapters || 0,
      word_count_target: options.wordCount || 0,
      active_personas: options.personas || { primary: 'novelist' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const storyDNA = {
      core_themes: options.themes || [],
      symbols: {},
      motifs: [],
      tone_profile: {
        formality: 0.5,
        darkness: 0.3,
        humor: 0.3,
        emotional_intensity: 0.5,
        poetic_density: 0.3
      },
      writing_style: {
        sentence_length_target: 'varied',
        dialogue_ratio: 0.4,
        narrative_distance: 'close',
        show_vs_tell: 0.6
      },
      genre_rules: [],
      forbidden_patterns: [],
      promises_to_reader: []
    };

    const activeState = {
      _version: '1.0.0',
      metadata,
      dna: storyDNA,
      characters: {},
      world: { active_locations: {} },
      timeline: {
        current_time: null,
        current_season: 'spring',
        time_since_start: 0
      },
      reader: {
        open_questions: [],
        cognitive_load: 0,
        suspense_level: 0,
        emotional_curve: []
      },
      plot: {
        main_plot_progress: 0,
        active_subplots: [],
        open_mysteries: [],
        active_conflicts: [],
        foreshadowing_pending: [],
        scene_count: 0
      },
      scenes: { current_scene: null, previous_scene: null, connected_scenes: [] }
    };

    fs.writeFileSync(path.join(statePath, 'active.json'), JSON.stringify(activeState, null, 2));
    this.activeStoryId = storyId;
    return storyId;
  }

  _matchAny(text, patterns) {
    return patterns.some(p => text.includes(p));
  }

  _generateId() {
    return 'story_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }
}

module.exports = StoriaOrchestrator;
