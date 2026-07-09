# Story State Specification (SSS)

> Canonical data model for the Storia Narrative Intelligence Platform.
> Every engine, workflow, persona, and capability references this document.

## 1. Architecture Overview

Storia maintains a two-layer Story State:

```
┌─────────────────────────────────┐
│         ACTIVE STATE            │
│        (<100 KB target)          │
│  Current narrative context       │
├─────────────────────────────────┤
│        ARCHIVE STATE            │
│       (unlimited size)          │
│  Historical narrative data       │
└─────────────────────────────────┘
```

**Active State** — loaded on every invocation. Contains only information needed for the current generation task.

**Archive State** — persisted but not loaded by default. Accessed only when explicitly requested for deep context, historical review, or analysis.

## 2. Active State Sections

### 2.1 Story Metadata

| Field | Type | Budget | Description |
|---|---|---|---|
| `story_id` | string | — | Unique identifier |
| `title` | string | — | Story title |
| `genre` | string[] | — | Primary and secondary genres |
| `language` | string | — | Primary language code (e.g., `en`, `ta`, `hi`) |
| `secondary_languages` | string[] | — | Additional languages used in narration/dialogue |
| `themes` | string[] | — | Central themes |
| `target_audience` | string | — | Age/demographic target |
| `tone` | string | — | Overall narrative tone |
| `pov` | string | — | Point of view (first, third-limited, omniscient, etc.) |
| `narrative_style` | string | — | Literary, cinematic, poetic, etc. |
| `status` | enum | — | `planning`, `writing`, `revising`, `complete` |
| `current_chapter` | int | — | Chapter being written |
| `total_chapters` | int | — | Estimated chapter count |
| `word_count_target` | int | — | Target word count |
| `active_personas` | string[] | — | Currently loaded personas |
| `created_at` | datetime | — | Story creation timestamp |
| `updated_at` | datetime | — | Last state update timestamp |

**Budget: 2 KB**

### 2.2 Story DNA

Persistent identity that every chapter is checked against.

| Field | Type | Budget | Description |
|---|---|---|---|
| `core_themes` | string[] | — | 3-5 themes the story serves |
| `symbols` | map<string, string> | — | Symbol → meaning mapping |
| `motifs` | string[] | — | Recurring narrative motifs |
| `tone_profile` | object | — | Tone dimensions (darkness, humor, formality, etc.) |
| `writing_style` | object | — | Style parameters (sentence length target, dialogue ratio, etc.) |
| `narrative_distance` | string | — | Default psychic distance (close, medium, distant) |
| `genre_rules` | object[] | — | Active genre constraints |
| `forbidden_patterns` | string[] | — | Clichés or patterns to avoid |
| `promises_to_reader` | string[] | — | Explicit narrative promises made |

**Budget: 5 KB**

### 2.3 Character State

Only active characters (appearing in current or next 3 scenes).

| Field | Type | Budget | Description |
|---|---|---|---|
| `character_id` | string | — | Unique identifier |
| `name` | string | — | Full name |
| `aliases` | string[] | — | Alternative names/titles |
| `active` | bool | — | Currently active in narrative |
| `location` | string | — | Current location ID |
| `physical_state` | object | — | See §2.3.1 |
| `emotional_state` | object | — | See §2.3.2 |
| `relationships` | map<string, relationship> | — | Active relationship states |
| `knowledge` | object | — | Cached knowledge view (§4) |
| `voice_profile` | object | — | See §2.3.3 |
| `arc_progress` | float | — | 0.0 to 1.0 character arc completion |
| `active_goals` | string[] | — | Current character objectives |
| `active_conflicts` | string[] | — | Active conflict IDs involving this character |
| `inventory` | object[] | — | Items carried/owned |
| `scene_count` | int | — | Scenes appeared in (for reader load calc) |

#### 2.3.1 Physical State

| Field | Type | Description |
|---|---|---|
| `injuries` | object[] | Injury ID, type, severity, body part, scene acquired, healed |
| `fatigue` | float | 0.0 (rested) to 1.0 (exhausted) |
| `hunger` | float | 0.0 (full) to 1.0 (starving) |
| `poison_status` | object[] | Poison ID, severity, antidote? |
| `disease_status` | object[] | Disease ID, stage, contagious? |
| `magical_status` | object[] | Active magical effects |
| `weather_exposure` | string | Current weather effects on character |
| `equipment` | object[] | Worn/carried equipment |
| `clothing` | object | Current attire |

#### 2.3.2 Emotional State

| Field | Type | Description |
|---|---|---|
| `primary_emotion` | string | Dominant emotion |
| `secondary_emotion` | string | Underlying emotion |
| `intensity` | float | 0.0 to 1.0 |
| `arc` | object[] | Emotional journey across recent scenes |
| `triggers` | map<string, string> | Trigger → emotional response mapping |

#### 2.3.3 Voice Profile

| Field | Type | Description |
|---|---|---|
| `vocabulary_tier` | string | Simple, moderate, advanced, archaic |
| `sentence_length` | string | Short, moderate, long, varied |
| `dialect_markers` | string[] | Regional/class dialect features |
| `humor_style` | string | None, dry, sarcastic, warm, dark |
| `education_level` | string | Informal, formal, academic, self-taught |
| `emotional_expression` | string | Reserved, expressive, volatile, calculated |
| `signature_phrases` | string[] | Phrases the character repeats |
| `speech_rhythm` | object | Pacing, pauses, interruptions patterns |
| `language_mix` | object | For multilingual characters: language switching patterns |

**Budget: 30 KB** (all active characters combined)

### 2.4 World State

Only active locations and relevant world context.

| Field | Type | Description |
|---|---|---|
| `active_locations` | map<string, location> | Currently relevant locations |
| `location_id` | string | Unique identifier |
| `name` | string | Location name |
| `type` | string | City, forest, dungeon, palace, etc. |
| `region` | string | Geographic/political region |
| `weather` | object | Current weather conditions |
| `time_of_day` | string | Current local time |
| `active_factions` | string[] | Factions present |
| `notable_npcs` | string[] | NPCs present |
| `atmosphere` | string | Mood/atmosphere description |
| `state_changes` | object[] | Recent changes to this location |

**Budget: 15 KB**

### 2.5 Timeline

Current temporal state of the narrative.

| Field | Type | Description |
|---|---|---|
| `current_time` | datetime | Story-internal current time |
| `calendar_system` | string | Calendar name/configuration |
| `current_season` | string | Season |
| `moon_phase` | string | Moon phase |
| `day_of_week` | string | For relevant calendars |
| `significant_dates` | object[] | Upcoming holidays, events, deadlines |
| `time_since_start` | duration | Time elapsed since story began |
| `temporal_anchors` | map<string, datetime> | Key events → their dates |
| `flashback_active` | bool | Is current scene a flashback? |
| `time_skip_active` | bool | Is current section a time skip? |

**Budget: 10 KB**

### 2.6 Reader Model

Predicted reader experience state.

| Field | Type | Description |
|---|---|---|
| `open_questions` | object[] | Questions the reader is expected to hold |
| `cognitive_load` | float | 0.0 to 1.0 — estimated reader memory burden |
| `suspense_level` | float | 0.0 to 1.0 |
| `surprise_level` | float | 0.0 to 1.0 |
| `emotional_curve` | object[] | Expected emotional journey |
| `expectations` | string[] | What the reader expects to happen |
| `satisfaction_score` | float | 0.0 to 1.0 (based on fulfilled promises) |
| `confusion_risk` | float | 0.0 to 1.0 — estimated confusion probability |

**Budget: 10 KB**

### 2.7 Plot State

Active plot and subplot status.

| Field | Type | Description |
|---|---|---|
| `main_plot_progress` | float | 0.0 to 1.0 |
| `active_subplots` | object[] | Currently advancing subplots |
| `open_mysteries` | object[] | Unresolved mysteries |
| `active_conflicts` | object[] | Currently escalating conflicts |
| `foreshadowing_pending` | object[] | Setups awaiting payoff |
| `foreshadowing_fulfilled` | object[] | Completed payoffs |
| `upcoming_twists` | object[] | Planned twists (writer visibility only) |
| `scene_count` | int | Total scenes written |
| `recent_turning_points` | string[] | Last 5 scene turning points |

**Budget: 15 KB**

### 2.8 Active Scene Cache

| Field | Type | Description |
|---|---|---|
| `current_scene` | object | Currently active scene |
| `previous_scene` | object | Immediately preceding scene |
| `connected_scenes` | object[] | Scenes connected by characters/location/conflict |
| `referenced_scenes` | object[] | Scenes referenced in current context |
| `recently_edited_scenes` | object[] | Last 3 edited scenes |

**Scene object:**

| Field | Type | Description |
|---|---|---|
| `scene_id` | string | Unique identifier |
| `chapter` | int | Chapter number |
| `sequence` | int | Scene number within chapter |
| `pov_character` | string | Point-of-view character ID |
| `location` | string | Location ID |
| `time` | datetime | Scene start time |
| `participants` | string[] | Character IDs present |
| `objective` | string | What the POV character wants |
| `conflict` | string | Core conflict of the scene |
| `turning_point` | string | What changes by scene end |
| `outcome` | string | Result of the conflict |
| `emotional_delta` | object | Emotional state change |
| `state_changes` | string[] | State facts that changed |
| `summary` | string | Compressed narrative memory (3-5 sentences) |

**Budget: 10 KB**

## 3. Archive State

Accessed only when explicitly requested.

| Section | Description |
|---|---|
| `past_scenes` | Full scene records beyond the active cache |
| `chapter_summaries` | One-paragraph summary per chapter |
| `completed_arcs` | Character arcs that have reached resolution |
| `resolved_mysteries` | Mysteries with solution records |
| `historical_revisions` | Full revision history for audit |
| `old_knowledge_events` | Knowledge events no longer needed in active cache |
| `seasonal_and_temporal_history` | Past weather, moon phases, holidays |

## 4. Knowledge Model

Event-sourced, four-type knowledge system.

### Knowledge Types

| Type | Description | Example |
|---|---|---|
| `public` | Known to everyone (or discoverable) | "The king is dead" |
| `private` | Known only to specific characters | "Alice hid the letter" |
| `secret` | Known to one character, hidden from others | "Victor is the spy" |
| `unknown` | Not yet known to any character | "The dagger is poisoned" |

### Knowledge Event

| Field | Type | Description |
|---|---|---|
| `event_id` | string | Unique event identifier |
| `scene_id` | string | Scene where knowledge was acquired |
| `timestamp` | datetime | Story-internal time |
| `character_id` | string | Character who acquired knowledge |
| `fact` | string | Canonical fact description |
| `fact_id` | string | Unique fact identifier |
| `from_type` | enum | Previous knowledge type |
| `to_type` | enum | New knowledge type |
| `source` | string | How the knowledge was acquired (witness, told, deduced, read) |
| `confidence` | float | 0.0 to 1.0 — extraction confidence |
| `reliability` | float | 0.0 to 1.0 — how reliable the source is |

### Query: Does Character X know Fact Y?

1. Check cached knowledge view. If present, return.
2. Replay events for `character_id` filtered to facts with `to_type != unknown`.
3. Cache result. Return.

**Default: unknown.** Only tracked when a knowledge event is recorded.

## 5. State Versioning & Revision Diff

### Version

| Field | Type | Description |
|---|---|---|
| `state_version` | string | Semantic version of the story state |
| `parent_version` | string | Previous state version |
| `created_at` | datetime | Version creation time |
| `reason` | string | What triggered this version (scene_written, revision, manual_edit) |
| `scene_id` | string | Scene that caused the state change (if applicable) |

### Revision Diff

Every state change produces a structured diff:

```json
{
  "version": "1.4.2",
  "parent": "1.4.1",
  "scene_id": "ch3-scene-12",
  "timestamp": "...",
  "added": [
    {"path": "characters.alice.knowledge.public.secret_door", "value": true}
  ],
  "modified": [
    {
      "path": "characters.bob.emotional_state.primary_emotion",
      "from": "anger",
      "to": "guilt"
    }
  ],
  "removed": [
    {"path": "mysteries.missing_key"}
  ]
}
```

Diffs enable:
- **Rollback** — revert to any previous state version
- **Audit** — full history of state changes
- **Continuity debugging** — trace when a fact changed
- **Intentional rewrite detection** — distinguish LLM error from author choice

## 6. Confidence Scoring

### Extraction Confidence

Every fact extracted by the State Synthesizer carries confidence:

| Range | Action |
|---|---|
| >= 0.95 | Auto-commit to canonical state |
| 0.70 — 0.94 | Commit with verification flag |
| < 0.70 | Require user review |

Confidence is derived from:
- Explicit vs. implied text
- Number of textual evidence points
- Consistency with existing state
- LLM self-assessment of extraction certainty

### State Integrity Confidence

Every state transitions through the Validator, which computes an integrity score:

| Score | State |
|---|---|
| 1.0 | All constraints pass |
| 0.5 — 0.99 | Non-critical constraint violations (flagged) |
| < 0.5 | Critical constraint violations (blocked until resolution) |

## 7. State Budgets & Enforcement

| Section | Soft Limit | Hard Limit | Action at Hard Limit |
|---|---|---|---|
| Story Metadata | 2 KB | 3 KB | Archive oldest metadata versions |
| Story DNA | 5 KB | 7 KB | Compress motif/symbol descriptions |
| Active Characters | 30 KB | 40 KB | Archive least-recently-active character |
| Active World | 15 KB | 20 KB | Archive least-recently-visited location |
| Timeline | 10 KB | 12 KB | Archive oldest temporal anchors |
| Reader Model | 10 KB | 12 KB | Compress emotional curve history |
| Plot State | 15 KB | 20 KB | Archive oldest subplot/completed payoffs |
| Active Scene Cache | 10 KB | 15 KB | LRU-evict to archive |

**Total Active Target: <100 KB | Hard Ceiling: 129 KB**

## 8. State Validator Constraints

### Hard Constraints (blocking)

- Character cannot be in two locations simultaneously
- Character cannot be both alive and dead
- Event timestamps must be monotonically increasing (within a timeline)
- Knowledge cannot exist before its acquisition event timestamp
- A character cannot learn the same fact from the same source twice
- Scene IDs must be unique
- Relationship edges must reference valid character IDs

### Soft Constraints (flagging)

- Injuries should not disappear without a recovery event
- Inventory should not contain duplicate unique items
- Character age should advance consistently with timeline
- Emotional state transitions should have a trigger event
- Faction relationships should be symmetric (if A wars with B, B wars with A)

## 9. State Access Patterns

| Pattern | Read Frequency | Write Frequency | Cache Priority |
|---|---|---|---|
| Current scene | Very high | Low | Highest |
| Active character voice profile | High | Low | High |
| Character knowledge (current scene) | High | Medium | High |
| Timeline (current time) | Very high | Low | Highest |
| Open mysteries | High | Medium | High |
| Active conflicts | High | Medium | High |
| Story DNA | Medium | Very low | High |
| Reader model | Medium | Medium | Medium |
| Previous scenes | Low | Very low | Adaptive |
| Archive | Very low | Low | Cold |

## 10. State File Format

State is persisted as JSON files in `~/.config/storia/{story_id}/`:

```
~/.config/storia/{story_id}/
├── active.json             # Current active state
├── archive/
│   ├── scenes/             # Archived scene records
│   ├── summaries/          # Chapter summaries
│   ├── revisions/          # State version history
│   └── knowledge/          # Archived knowledge events
├── state.lock              # Write lock for concurrent access
└── state.index             # Fast lookup index for archive
```

## Appendix A: Version History

| Version | Date | Changes |
|---|---|---|
| 0.1 | — | Initial specification |
