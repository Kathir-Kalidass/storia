# Persona Specification

> Schema and architecture for Storia's composable persona system.
> Personas tune engine behavior for specific writing styles, genres, cultures, and audiences.

---

## 1. Persona Schema

Every persona is defined by a JSON file. The canonical schema:

```json
{
  "persona_id": "string",
  "name": "string",
  "version": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"],
  "goals": ["string"],
  "supported_genres": ["string"],
  "supported_languages": ["string"],
  "default_language": "string",

  "tone": {
    "formality": 0.0 to 1.0,
    "darkness": 0.0 to 1.0,
    "humor": 0.0 to 1.0,
    "emotional_intensity": 0.0 to 1.0,
    "poetic_density": 0.0 to 1.0,
    "descriptive_density": 0.0 to 1.0
  },

  "writing_style": {
    "sentence_length_target": "short | moderate | long | varied",
    "paragraph_density": "sparse | moderate | dense",
    "dialogue_ratio": 0.0 to 1.0,
    "narrative_distance": "close | medium | distant | omniscient",
    "show_vs_tell": 0.0 to 1.0,
    "metaphor_frequency": "rare | occasional | frequent | rich",
    "dialect_use": "none | light | moderate | heavy"
  },

  "verification_focus": {
    "priority_checks": ["string"],
    "ignored_checks": ["string"],
    "tolerance": {
      "continuity": "strict | moderate | relaxed",
      "timeline": "strict | moderate | relaxed",
      "voice": "strict | moderate | relaxed",
      "research": "strict | moderate | relaxed"
    },
    "minimum_confidence": 0.0 to 1.0
  },

  "engine_overrides": {
    "reason_modules": {
      "enabled": ["string"],
      "disabled": ["string"],
      "config": {}
    },
    "guide_modules": {
      "enabled": ["string"],
      "disabled": ["string"],
      "config": {}
    },
    "verify_modules": {
      "enabled": ["string"],
      "disabled": ["string"],
      "config": {}
    },
    "creative_capabilities": {
      "enabled": ["string"],
      "disabled": ["string"],
      "config": {}
    }
  },

  "memory_overrides": {
    "active_state_priority": ["string"],
    "archive_frequency": "aggressive | normal | lazy",
    "scene_cache_size": "int"
  },

  "workflow_preferences": {
    "preferred_workflows": ["string"],
    "default_workflow": "string"
  },

  "constraints": {
    "incompatible_personas": ["string"],
    "required_personas": ["string"],
    "max_sentence_length": "int",
    "min_sentence_length": "int",
    "banned_patterns": ["string"],
    "required_patterns": ["string"],
    "content_boundaries": ["string"]
  },

  "prompt_prefix": "string",
  "examples": {
    "opening_lines": ["string"],
    "dialogue_snippets": ["string"],
    "description_snippets": ["string"]
  },

  "metadata": {
    "author": "string",
    "created": "datetime",
    "updated": "datetime",
    "version_history": ["string"]
  }
}
```

---

## 2. Persona Categories

### 2.1 Literary Personas
| Persona | Tags | Focus |
|---|---|---|
| Poet | literary, lyrical | Imagery, rhythm, metaphor, compression |
| Novelist | literary, long-form | Structure, character arcs, pacing |
| Short Story Writer | literary, concise | Economy, impact, single-theme |
| Flash Fiction Writer | literary, micro | Extreme compression, twist endings |
| Essayist | literary, reflective | Voice, argument, personal insight |
| Memoir Writer | literary, personal | Authenticity, reflection, voice |
| Biographer | literary, research | Accuracy, narrative, context |
| Satirist | literary, humor | Irony, exaggeration, social commentary |
| Lyricist | literary, musical | Rhythm, rhyme, emotional directness |
| Children's Author | literary, simple | Clarity, wonder, moral framework |
| Fable Writer | literary, moral | Allegory, simplicity, lesson |
| Folktale Writer | literary, traditional | Patterns, archetypes, oral tradition |
| Legend Writer | literary, epic | Scale, heroism, mythic structure |

### 2.2 Genre Personas
| Persona | Tags | Focus |
|---|---|---|
| Fantasy Writer | genre, fantasy | Worldbuilding, magic, quests |
| Dark Fantasy | genre, dark | Moral ambiguity, horror elements |
| Epic Fantasy | genre, epic | Large cast, political scope, prophecy |
| Urban Fantasy | genre, modern | Magic in contemporary settings |
| High Fantasy | genre, high | Alternate worlds, grand stakes |
| Sci-Fi Writer | genre, sci-fi | Technology, society, speculation |
| Hard Sci-Fi | genre, hard | Scientific accuracy, plausibility |
| Space Opera | genre, space | Large scale, adventure, politics |
| Cyberpunk | genre, cyber | Technology, dystopia, identity |
| Mystery Writer | genre, mystery | Clues, red herrings, deduction |
| Detective Writer | genre, detective | Investigation, procedure, suspects |
| Crime Writer | genre, crime | Morality, consequence, underworld |
| Psychological Thriller | genre, thriller | Tension, unreliable, mind games |
| Political Thriller | genre, political | Power, conspiracy, stakes |
| Spy Thriller | genre, spy | Espionage, tradecraft, deception |
| Horror Writer | genre, horror | Fear, dread, atmosphere |
| Gothic Horror | genre, gothic | Atmosphere, decay, romance |
| Cosmic Horror | genre, cosmic | Insignificance, unknown, dread |
| Romance Author | genre, romance | Emotion, chemistry, progression |
| Historical Romance | genre, historical | Period detail, forbidden love |
| Comedy Writer | genre, humor | Timing, wit, setup-payoff |
| Slice of Life | genre, gentle | Everyday moments, observation |
| Adventure Writer | genre, action | Movement, discovery, stakes |
| Dystopian Writer | genre, dystopia | Society, oppression, resistance |
| Mythology Writer | genre, mythic | Archetypes, gods, epic scale |
| Magical Realism | genre, magical | Mundane magic, cultural roots |

### 2.3 Character Design Personas
| Persona | Tags | Focus |
|---|---|---|
| Character Psychologist | character, depth | Motivation, fear, flaw, growth |
| Character Therapist | character, healing | Arc, resolution, catharsis |
| Character Growth Architect | character, arc | Transformation, milestones |
| Anti-Hero Designer | character, complex | Moral ambiguity, edge, redemption |
| Villain Creator | character, antagonist | Sympathy, menace, logic, backstory |
| Morally Grey Builder | character, nuance | Difficult choices, ambiguity |
| Relationship Architect | character, social | Dynamics, chemistry, conflict |
| Family Dynamics Expert | character, family | Generational patterns, loyalty |
| Dialogue Personality Designer | character, voice | Unique speech patterns |
| Backstory Generator | character, history | Formative events, secrets |
| Character Arc Planner | character, journey | Beginning → middle → end |
| Character Consistency Manager | character, tracking | Voice, behavior, knowledge lock |

### 2.4 Cultural Personas
| Persona | Tags | Focus |
|---|---|---|
| Tamil Storyteller | culture, tamil | Tamil narrative traditions, code-mixing |
| Telugu Storyteller | culture, telugu | Telugu literary forms |
| Kannada Storyteller | culture, kannada | Kannada storytelling heritage |
| Malayalam Storyteller | culture, malayalam | Malayalam narrative styles |
| Hindi Storyteller | culture, hindi | Hindi literary traditions |
| Bengali Storyteller | culture, bengali | Bengali literary heritage |
| Marathi Storyteller | culture, marathi | Marathi narrative forms |
| Punjabi Storyteller | culture, punjabi | Punjabi oral traditions |
| Japanese Storyteller | culture, japanese | Monogatari, haiku, wabi-sabi |
| Korean Storyteller | culture, korean | K-drama pacing, han |
| Chinese Storyteller | culture, chinese | Wuxia, xianxia, classical forms |
| African Folklore Expert | culture, african | Oral traditions, proverbs, archetypes |
| Celtic Storyteller | culture, celtic | Myth cycles, bardic traditions |
| Norse Myth Expert | culture, norse | Sagas, eddas, runes |
| Greek Myth Expert | culture, greek | Epics, tragedies, gods |
| Indigenous Oral Tradition | culture, indigenous | Storytelling protocols, land connection |

### 2.5 Historical Personas
| Persona | Tags | Focus |
|---|---|---|
| Historical Researcher | history, accuracy | Facts, dates, period details |
| Historical Drama Writer | history, drama | Tension within historical constraints |
| Period Accuracy Checker | history, review | Anachronism detection |
| Ancient Civilizations Expert | history, ancient | Daily life, politics, technology |
| Medieval Historian | history, medieval | Feudalism, religion, warfare |
| Alternate History Designer | history, speculative | Branching points, plausibility |

### 2.6 Drama Personas
| Persona | Tags | Focus |
|---|---|---|
| Playwright | drama, stage | Dialogue, acts, blocking |
| Screenwriter | drama, screen | Visual, scene transitions, pacing |
| TV Series Writer | drama, serial | Episode arcs, season structure |
| Web Series Writer | drama, digital | Short episodes, hook retention |
| Dialogue Dramatist | drama, speech | Subtext, voice, tension, beats |
| Monologue Specialist | drama, solo | Voice, revelation, catharsis |
| Emotional Beat Designer | drama, feeling | Reader emotion, timing |

### 2.7 Worldbuilding Personas
| Persona | Tags | Focus |
|---|---|---|
| Kingdom Designer | world, politics | Rulers, factions, borders, economy |
| City Builder | world, urban | Districts, culture, daily life |
| Civilization Architect | world, society | History, technology, worldview |
| Magic System Designer | world, magic | Rules, costs, limitations, schools |
| Political System Designer | world, politics | Governance, power, corruption |
| Religion Designer | world, faith | Deities, rituals, clergy, schisms |
| Economy Designer | world, trade | Resources, currency, class |
| Ecology Designer | world, nature | Biomes, creatures, balance |
| Language Creator | world, linguistics | Vocabulary, grammar, writing |
| Technology Designer | world, tech | Inventions, energy, limits |
| Geography Designer | world, terrain | Maps, climate, natural resources |

### 2.8 Plot Personas
| Persona | Tags | Focus |
|---|---|---|
| Plot Engineer | plot, structure | Cause-effect, pacing, twists |
| Plot Twist Designer | plot, surprise | Setup, misdirection, reveal |
| Mystery Planner | plot, puzzle | Clues, red herrings, solution |
| Foreshadow Specialist | plot, setup | Plant, payoff, subtlety |
| Suspense Architect | plot, tension | Release, stakes, information control |
| Story Circle Expert | plot, narrative | Eight-sequence structure |
| Non-linear Narrative Designer | plot, time | Flashbacks, parallel timelines |

### 2.9 Style Personas
| Persona | Tags | Focus |
|---|---|---|
| Hemingway Style | style, minimal | Sparse, direct, understated |
| Tolkien Inspired | style, epic | Descriptions, history, scope |
| Modern Minimalist | style, clean | Short sentences, white space |
| Cinematic | style, visual | Scene framing, movement |
| Literary | style, literary | Layered, symbolic, crafted |
| Poetic | style, lyrical | Rhythm, imagery, compression |
| Humorous | style, comedy | Wit, timing, voice |
| Dark | style, noir | Atmosphere, grit, tension |
| Philosophical | style, reflective | Questions, themes, depth |
| Fast Paced | style, quick | Short scenes, high stakes |
| Slow Burn | style, gradual | Mood building, character focus |

### 2.10 Publishing Personas
| Persona | Tags | Focus |
|---|---|---|
| Developmental Editor | publish, structure | Plot, pacing, character arcs |
| Line Editor | publish, polish | Sentence flow, word choice |
| Copy Editor | publish, accuracy | Grammar, consistency, style |
| Proofreader | publish, final | Typos, formatting, details |
| Market Analyst | publish, market | Genre trends, comparable titles |
| Bestseller Consultant | publish, success | Hook, pacing, marketability |

### 2.11 Reader Personas
| Persona | Tags | Focus |
|---|---|---|
| Child Reader | reader, young | Simple vocabulary, clear morals |
| Teen Reader | reader, ya | Identity, relationships, stakes |
| YA Reader | reader, ya | Coming-of-age, voice, pace |
| Adult Reader | reader, mature | Complexity, themes, subtlety |
| Academic Reader | reader, critical | Analysis, symbolism, craft |
| Fantasy Fan | reader, genre | Worldbuilding, magic, quests |
| Romance Fan | reader, genre | Chemistry, tension, payoff |

### 2.12 Innovation Personas
| Persona | Tags | Focus |
|---|---|---|
| Experimental Narrator | innovation, form | Structure, voice, format |
| Second Person Expert | innovation, pov | Immersion, direct address |
| Interactive Fiction Designer | innovation, game | Choice, branching, feedback |
| Game Narrative Designer | innovation, game | Quest, dialogue tree, lore |
| Comic Writer | innovation, visual | Panels, pacing, captions |
| Manga Writer | innovation, manga | Pages, flow, cultural form |
| Multiverse Designer | innovation, parallel | Timelines, variants, convergence |
| Time Travel Architect | innovation, time | Rules, paradoxes, consistency |
| Dream Logic Specialist | innovation, surreal | Symbolism, transition, emotion |

---

## 3. Persona Composition Rules

### 3.1 Stacking Order

Primary + Secondary + Style + Language + Audience

Each slot has a default if not specified:
- Primary: Novelist (default)
- Secondary: none
- Style: Literary (default)
- Language: English (default, from story metadata)
- Audience: Adult Reader (default, from story metadata)

### 3.2 Priority Rules

When stacked personas disagree on a setting:

| Rule | Winner |
|---|---|
| Primary defines genre | Primary |
| Primary defines goals | Primary |
| Style defines prose | Style |
| Language defines language behavior | Language |
| Audience defines complexity | Audience |
| Secondary enriches but does not override | Secondary defers to Primary |
| Unresolved conflicts | Primary wins; log warning |

### 3.3 Compatibility Constraints

- Incompatible persona pairs are defined in each persona's `constraints.incompatible_personas`
- E.g., "Fast Paced" + "Slow Burn" are incompatible
- E.g., "Children's Author" + "Cosmic Horror" are incompatible
- E.g., "Mystery Writer" + "Suspense Architect" are compatible (enhance each other)

### 3.4 Persona Resolution

Runtime resolves the persona stack as follows:

1. Load each persona file from `personas/{category}/{persona_id}.json`
2. Validate all personas exist and are loadable
3. Check compatibility constraints
4. Apply override priority (Primary > Style > Language > Audience > Secondary)
5. Merge configuration deltas into a unified config
6. Cache the resolved config for session duration
7. Return the delta to Runtime

---

## 4. Persona File Organization

```
personas/
├── literary/
│   ├── poet.json
│   ├── novelist.json
│   ├── short-story-writer.json
│   └── ...
├── genre/
│   ├── fantasy-writer.json
│   ├── mystery-writer.json
│   └── ...
├── character/
│   ├── character-psychologist.json
│   ├── villain-creator.json
│   └── ...
├── cultural/
│   ├── tamil-storyteller.json
│   ├── japanese-storyteller.json
│   └── ...
├── historical/
│   ├── historical-researcher.json
│   ├── medieval-historian.json
│   └── ...
├── drama/
│   ├── playwright.json
│   ├── screenwriter.json
│   └── ...
├── worldbuilding/
│   ├── kingdom-designer.json
│   ├── magic-system-designer.json
│   └── ...
├── plot/
│   ├── plot-engineer.json
│   ├── mystery-planner.json
│   └── ...
├── style/
│   ├── hemingway.json
│   ├── cinematic.json
│   └── ...
├── publishing/
│   ├── developmental-editor.json
│   ├── market-analyst.json
│   └── ...
├── reader/
│   ├── child-reader.json
│   ├── ya-reader.json
│   └── ...
└── innovation/
    ├── experimental-narrator.json
    ├── game-narrative-designer.json
    └── ...
```

---

## 5. Persona Development Workflow

1. **Define schema** — done (this document)
2. **Build tooling** — create persona validator and composition engine
3. **Ship core set** — 10 personas for v0.1 (Poet, Novelist, Mystery Writer, Fantasy Worldbuilder, Romance Author, Horror Writer, Screenwriter, Historical Drama Writer, Character Psychologist, Tamil Storyteller)
4. **Community system** — allow custom persona creation and sharing
5. **Grow library** — expand to 100+ across all categories
