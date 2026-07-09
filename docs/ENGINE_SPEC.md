# Engine Specification

> Canonical specification for all nine Storia engines.
> Every capability, workflow, and persona references this document.

---

## 1. Runtime Engine

### Purpose
Orchestration — intent detection, workflow routing, persona loading, state lifecycle management, and session coordination across all engines.

### Inputs
- User request (natural language)
- Active Story State (from Memory Engine)
- Capability Registry

### Outputs
- Selected workflow identifier
- Loaded persona configuration deltas
- Loaded Story State (active + optionally archive)
- Execution plan (engine invocation sequence)

### Responsibilities
1. **Intent Detection** — map user request to capability via Capability Registry
2. **Workflow Selection** — choose the appropriate workflow template
3. **Persona Selection** — resolve persona stack (primary + secondary + style + language + audience)
4. **State Loading** — load active state; load archive only if explicitly needed
5. **Pre-flight Validation** — verify required state exists before execution
6. **Engine Coordination** — invoke engines in sequence, pass intermediate results
7. **Error Handling** — route failures to appropriate recovery workflow
8. **Session Management** — track session context across multiple invocations

### State Changes
- Updates session metadata (current workflow, progress)
- Does not directly modify Story State

### Failure Cases
| Failure | Behavior |
|---|---|
| Unknown intent | Request clarification from user via LLM |
| Missing required state | Route to state initialization workflow |
| Persona conflict | Apply priority rules; flag to user if unresolvable |
| Engine timeout | Retry once; escalate to user if persistent |
| Workflow not found | Fall back to generic workflow; log missing mapping |

### Priority
Highest — all requests pass through Runtime first.

### Invocation Rules
- Every user request invokes Runtime
- Runtime must complete in <100ms before passing to next engine
- All engine errors route back through Runtime for recovery

---

## 2. Narrative Intelligence Engine

### Purpose
Core storytelling reasoning — planning before writing, guidance during writing, verification after writing, and state extraction from generated content.

### Components

#### Reason (8 modules)
| Module | Function |
|---|---|
| Story Architect | High-level structure, acts, narrative arch |
| Plot Planner | Scene sequence, cause/effect chain |
| Character Psychology | Motivation, fear, flaw, growth trajectory |
| Theme Planner | Central themes per act/chapter |
| Conflict Generator | Internal, interpersonal, societal, cosmic |
| Mystery Designer | Clue map, red herring layout, reveal timing |
| Foreshadowing Planner | Plant/payoff blueprint before writing begins |
| Genre Rule Engine | Genre-specific conventions and expectations |

#### Guide (16 modules)
| Module | Function |
|---|---|
| Character Memory | Persistent character state across context windows |
| Setup/Payoff Registry | Tracks every promise; alerts when payoff is due |
| Knowledge Boundary Map | Per-character knowledge; prevents info leaks |
| World State Tracker | Persistent world/universe state |
| Timeline Tracker | Internal chronology, time passage |
| Temporal Manager | Calendar, seasons, moon phases, travel duration |
| Physical State Manager | Injuries, fatigue, hunger, equipment, weather, magic status, poison, inventory |
| Scene Goal Manager | Each scene has a purpose; tracks what changed |
| Scene Purpose Validator | Why this scene? What changes? Can it be cut? |
| Dialogue Coach | Character voice, subtext, attribution variety |
| Conflict Escalation Engine | Emotional, physical, psychological, social escalation |
| Decision Consequence Tracker | Every choice ripples; tracks beliefs, suspicions, fallout |
| Character Voice Lock | Vocabulary, rhythm, dialect, humor per character |
| Suspense Curve Manager | Clue/revelation/red herring pacing |
| Story DNA | Persistent themes, tone, symbolism, motifs, style |

#### Verify (8 modules)
| Module | Function |
|---|---|
| Plot Hole Detector | Logical contradictions, broken cause/effect |
| Emotional Arc Analyzer | Reader emotional journey; flags flat stretches |
| Reader Cognitive Load | Alerts when names/threads exceed genre limits |
| Pacing Analyzer | Scene length, tension curve, action/reflection balance |
| Theme Resonance Checker | Does this chapter serve the declared themes? |
| Prose Rhythm Analyzer | Sentence variety, paragraph weight, dialogue ratio |
| Continuity Checker | Character, world, timeline, physical state consistency |
| Ending Satisfaction Analyzer | Promises fulfilled? Arcs complete? Mysteries answered? |

#### Synthesize
- Raw narrative → structured state extraction
- Confidence scoring for every extracted fact
- Relationship change detection
- Knowledge event generation
- Scene record creation

### Inputs
- User request (for Reason)
- Active Story State (for Guide)
- Generated narrative text (for Synthesize, Verify)
- Persona configuration deltas (for module tuning)

### Outputs
- Story plans, character profiles, plot outlines (Reason)
- Constrained context (Guide)
- Verification reports with issues and suggestions (Verify)
- State diff with confidence-scored facts (Synthesize)

### State Changes
- Reason: No direct state changes (produces plans)
- Guide: Reads state; does not modify
- Verify: No state changes (produces reports)
- Synthesize: Produces state diff for Memory Engine to apply

### Failure Cases
| Failure | Behavior |
|---|---|
| Low confidence extraction | Flag for user review; do not auto-commit |
| Contradictory verification results | Surface conflicting issues to user |
| Guide constraint violation | Block generation; explain constraint to LLM |
| Persona-module conflict | Apply persona priority; log warning |

### Priority
Operational — invoked by workflows, not directly by user.

### Invocation Rules
- Reason invoked when planning/generation is requested
- Guide invoked during generation for constraint enforcement
- Verify invoked after generation for quality checks
- Synthesize invoked after every generation or edit

---

## 3. Persona Engine

### Purpose
Dynamic composition of writer/reader personas that tune all engine behavior. Stateless — maps persona IDs to configuration deltas.

### Inputs
- Selected persona IDs (primary, secondary, style, language, audience)
- Story genre and language metadata

### Outputs
- Configuration deltas (module thresholds, style targets, verification focus, prompt prefixes, engine overrides)

### Responsibilities
1. **Persona Resolution** — load persona profiles from personas/ directory
2. **Composition** — merge multiple persona configs with priority rules
3. **Conflict Resolution** — when personas disagree on a setting, apply priority: Primary > Secondary > Style > Language > Audience
4. **Delta Generation** — produce minimal configuration changes relative to defaults
5. **Validation** — ensure composed persona set is coherent (no contradictory genre+style pairs)

### State Changes
None — purely a configuration mapping layer.

### Failure Cases
| Failure | Behavior |
|---|---|
| Persona not found | Fall back to default; log missing persona |
| Irreconcilable persona conflict | Flag to user; ask for priority override |
| Circular persona composition | Apply first-in-stack wins; log warning |
| Missing required persona fields | Apply defaults for missing fields |

### Priority
Configurational — called once per workflow start.

### Invocation Rules
- Called by Runtime during workflow initialization
- Persona deltas cached for the session duration
- User can change personas mid-session (triggers re-composition)

---

## 4. Creative Engine

### Purpose
Generate narrative elements — characters, worlds, kingdoms, magic, religions, creatures, technologies, scenes, conflicts, titles. Does not analyze or verify; only creates.

### Capabilities
| Capability | Function |
|---|---|
| Character Creator | Generate complete character profiles with psychology, voice, appearance, backstory |
| World Creator | Generate world geography, climate, ecology, civilizations |
| Kingdom Designer | Generate political entities, rulers, factions, economy |
| Magic System Designer | Generate magic rules, costs, limitations, schools |
| Religion Designer | Generate belief systems, deities, rituals, clergy |
| Creature Designer | Generate flora, fauna, monsters, ecosystems |
| Language Creator | Generate fictional languages, writing systems |
| Culture Creator | Generate customs, traditions, social structures |
| Technology Designer | Generate tech levels, inventions, resources |
| Scene Creator | Generate scene structure with conflict, turning point |
| Dialogue Creator | Generate personality-aware dialogue exchanges |
| Conflict Creator | Generate internal, interpersonal, societal, cosmic conflicts |
| Quest Creator | Generate objectives, obstacles, rewards, stakes |
| Mystery Creator | Generate clue chains, red herrings, reveals |
| Plot Twist Generator | Generate surprising but foreshadowable twists |
| Ending Generator | Generate emotionally and thematically satisfying endings |
| Title Generator | Generate genre-appropriate titles |

### Inputs
- Story genre, language, tone (from Story Metadata)
- Persona configuration deltas (for style tuning)
- Existing Story State (for coherence with established elements)

### Outputs
- Generated narrative elements in structured format
- Suggested state updates for Memory Engine

### State Changes
- Produces state suggestions (applied via Synthesizer confidence check)

### Failure Cases
| Failure | Behavior |
|---|---|
| Generation violates existing state | Reject; suggest alternative coherent with state |
| Output exceeds style constraints | Re-generate with tighter constraints |
| Incomplete generation | Return partial result with gaps flagged |

### Priority
Creative — invoked when user requests generation of new story elements.

---

## 5. Memory Engine

### Purpose
Persist, retrieve, and manage Story State across sessions and invocations.

### Responsibilities
1. **Active State I/O** — read/write `active.json` for the current story
2. **Archive Management** — promote cold data to archive; demote hot data to active
3. **State Versioning** — create version snapshots on significant state changes
4. **Cache Management** — maintain adaptive scene cache priority
5. **Budget Enforcement** — monitor section sizes; trigger optimization when budgets exceeded
6. **Lock Management** — prevent concurrent write corruption via `state.lock`
7. **Index Management** — maintain `state.index` for fast archive lookups

### Inputs
- Story ID
- State section read/write requests from other engines
- Confidence-scored state diffs from Synthesizer

### Outputs
- Story State data (to requesting engines)
- Version history records
- Archive promotion/demotion events
- Budget reports

### State Changes
- Primary owner of all state mutations

### Failure Cases
| Failure | Behavior |
|---|---|
| State file corruption | Restore from latest version; log error |
| Budget exceeded | Archive oldest data in overflowing section |
| Lock contention | Queue writes; retry with exponential backoff |
| Version history full | Prune oldest versions (keep last 100) |

### Priority
Persistence — every write and read passes through Memory.

### Storage Layout
```
~/.config/storia/{story_id}/
├── active.json
├── archive/
│   ├── scenes/
│   ├── summaries/
│   ├── revisions/
│   └── knowledge/
├── state.lock
└── state.index
```

---

## 6. Research Engine

### Purpose
Contextual research for authentic storytelling. Automatically loads relevant historical, cultural, regional, and domain-specific knowledge when a story references specific contexts.

### Capabilities
| Capability | Function |
|---|---|
| Historical Research | Period-specific facts, events, figures, daily life |
| Culture Research | Customs, traditions, social norms, taboos |
| Region Research | Geography, climate, architecture, landmarks |
| Religion Research | Beliefs, practices, hierarchies, texts |
| Language Research | Vocabulary, grammar patterns, dialects, code-mixing norms |
| Profession Research | Occupations, tools, hierarchies, jargon |
| Weapon Research | Types, materials, tactics, historical periods |
| Architecture Research | Building styles, materials, layouts, periods |
| Fashion Research | Clothing, materials, styles across periods/cultures |
| Food Research | Cuisine, ingredients, eating customs, preservation |
| Custom Research | User-defined research topics |

### Inputs
- Story genre, setting, time period (from Story Metadata)
- Active location and cultural context (from World State)
- Character backgrounds (from Character State)

### Outputs
- Contextual research briefs
- Authenticity guidelines
- Anachronism warnings
- Cultural sensitivity notes

### State Changes
- Cache research results in archive for future reference
- Does not modify canonical Story State

### Failure Cases
| Failure | Behavior |
|---|---|
| No research data for requested context | Flag as unresearched; offer to accept or refine |
| Contradictory research sources | Present both perspectives with source notes |
| Culturally sensitive topic | Surface caution with context; let user decide |

### Priority
Support — invoked when story context requires external knowledge.

---

## 7. Verification Engine

### Purpose
Comprehensive quality and consistency verification across all narrative dimensions.

### Check Types
| Check | What It Verifies |
|---|---|
| Continuity | Character state, world state, timeline consistency with Story State |
| Timeline | Event ordering, time passage, temporal paradoxes |
| Knowledge | Character knowledge boundaries, information leaks |
| Character | Voice consistency, personality adherence, arc progression |
| Dialogue | Attribution variety, subtext presence, character voice lock |
| Emotion | Emotional arc progression, appropriate beats |
| Pacing | Scene length, tension curve, action/reflection balance |
| Logic | Cause/effect chains, internal consistency |
| Physics | World-appropriate physical law consistency |
| Magic Rules | Magic system constraint adherence |
| Culture | Cultural authenticity, sensitivity, consistency |
| History | Historical accuracy, anachronism detection |
| Grammar | Language correctness, style guide adherence |
| Tone | Tone consistency with Story DNA |
| Voice | Narrative voice consistency with chosen POV/style |
| Reader Experience | Cognitive load, suspense curve, satisfaction prediction |

### Inputs
- Generated narrative text
- Active Story State
- Story DNA
- Persona verification focus settings

### Outputs
- Verification report with:
  - Issues found (severity: critical, major, minor, suggestion)
  - Location references (scene ID, paragraph)
  - Explanation of the issue
  - Suggested fix
  - Pass/fail per check dimension
- Overall quality score

### State Changes
- None (read-only analysis)

### Failure Cases
| Failure | Behavior |
|---|---|
| Check timeout on long text | Break into sections; verify incrementally |
| Contradictory check results | Surface all; let user prioritize |
| False positive rate too high | Log; adjust sensitivity via persona config |

### Priority
Quality — runs after every generation or edit.

---

## 8. Publishing Engine

### Purpose
Prepare stories for publication across formats, markets, and audiences.

### Capabilities
| Capability | Function |
|---|---|
| Development Editing | Structural feedback, plot pacing, character arc suggestions |
| Line Editing | Sentence-level clarity, flow, word choice |
| Copy Editing | Grammar, punctuation, consistency, style guide |
| Proofreading | Final error check before publication |
| Market Review | Genre convention compliance, market positioning |
| Genre Validation | Does the story meet genre expectations? |
| Publishing Readiness | Complete checklist across all dimensions |
| Series Consistency | Cross-book continuity for series |
| Book Bible | Comprehensive reference document for series |
| Synopsis | Compelling story summary for submissions |
| Query Letter | Agent/publisher query letter generation |
| Blurb | Back-cover or store-page description |
| Marketing | Target audience, comparable titles, hook |

### Inputs
- Completed narrative text
- Full Story State
- Story DNA
- Genre and audience metadata

### Outputs
- Edit suggestions with priority levels
- Publishing readiness score (0-100)
- Marketing materials (blurb, query, synopsis)
- Format-specific export (markdown, screenplay, script)

### State Changes
- May update Story Metadata (status to `complete`, `published`)

### Failure Cases
| Failure | Behavior |
|---|---|
| Incomplete story for publishing review | Report completion gaps; block publishing check |
| Genre convention violations | Flag with severity; let author choose |
| Market mismatch | Suggest positioning adjustments |

### Priority
Final — invoked when story is ready for publication.

---

## 9. Utilities Engine

### Purpose
Supporting infrastructure for state management, compression, export, and recovery.

### Capabilities
| Capability | Function |
|---|---|
| State Compression | Compress active state to minimize token usage |
| Prompt Compression | Compress context prompts while preserving narrative facts |
| Memory Merge | Merge multiple memory sources into consistent state |
| Scene Merge | Combine overlapping or fragmented scene records |
| Conflict Resolution | Resolve contradictory state entries |
| Diff Engine | Generate structured diffs between state versions |
| Export | Export story to various formats (markdown, JSON, plain text) |
| Import | Import story from external formats |
| Archive | Move cold state from active to archive |
| Recovery | Restore state from latest clean version after corruption |

### Inputs
- State data, prompts, or narrative text (varies by capability)

### Outputs
- Compressed/merged/resolved output
- Export files
- Recovery confirmation

### State Changes
- Archive: promotes cold state
- Recovery: may overwrite corrupted state
- Others: no state changes

### Failure Cases
| Failure | Behavior |
|---|---|
| Compression ratio below target | Log; accept lower ratio |
| Merge conflict unresolvable | Surface to user for manual resolution |
| Recovery without clean backup | Report data loss extent; rebuild what's possible |

### Priority
Infrastructure — invoked by Runtime or Memory as needed.

---

## Engine Invocation Matrix

| Engine | Invoked By | Invokes | Can Run Standalone? |
|---|---|---|---|
| Runtime | User request | All engines | No (orchestrator) |
| Narrative Intelligence | Runtime, Workflows | Memory, Synthesizer | Yes |
| Persona | Runtime | None | No (config only) |
| Creative | Workflows | Memory | Yes |
| Memory | All engines | Utilities | Yes |
| Research | Workflows, Creative | Memory | Yes |
| Verification | Workflows | Memory | Yes |
| Publishing | Workflows | Memory, Creative | Yes |
| Utilities | Memory, Runtime | None | Yes |

## Engine Communication Protocol

All engines communicate via the Story State and structured messages:

1. **Read** — engines request state sections from Memory Engine
2. **Write** — engines propose state changes via Synthesizer (confidence-scored)
3. **Signal** — engines emit events (generation_complete, verification_failed, budget_exceeded)
4. **Log** — engines write to session log for debugging and audit

No direct engine-to-engine calls. All communication passes through Runtime orchestration or Memory persistence.
