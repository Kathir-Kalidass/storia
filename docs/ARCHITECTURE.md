# Storia Architecture

> Narrative Intelligence Platform — published as an Agent Skill.

## Layer Architecture

```
┌──────────────────────────────────────────────────────┐
│                   CAPABILITY REGISTRY                 │
│  story-planning  chapter-writing  dialogue  verify   │
│  worldbuilding   character-design  research  publish │
└─────────┬──────────┬──────────┬──────────┬──────────┘
          │          │          │          │
┌─────────▼──────────▼──────────▼──────────▼──────────┐
│                   WORKFLOW ENGINE                    │
│  Intent → Workflow → Personas → State → Execute     │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                   NARRATIVE INTELLIGENCE              │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐  │
│  │ REASON │  │ GUIDE  │  │ VERIFY │  │SYNTHESIZE│  │
│  │    8   │  │   16   │  │    8   │  │  extract │  │
│  │modules │  │ modules│  │modules │  │  state   │  │
│  └────────┘  └────────┘  └────────┘  └──────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                   RUNTIME SERVICES                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Optimizer   │  │  Validator   │  │  Diff      │ │
│  │  compress    │  │ integrity    │  │  Engine    │ │
│  │  compact     │  │ constraints  │  │  revisions │ │
│  │  cache       │  │              │  │            │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                     STORY STATE                       │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │    ACTIVE        │  │       ARCHIVE            │ │
│  │   <100 KB        │  │      unlimited           │ │
│  │   Hot narrative  │  │   Cold historical data   │ │
│  │   context        │  │                          │ │
│  └──────────────────┘  └──────────────────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  ENGINE LAYER                         │
│  ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐ │
│  │Creative││ Research││ Memory ││Persona ││Publish │ │
│  │ generate││ research││ persist││ compose││ release│ │
│  └────────┘└────────┘└────────┘└────────┘└────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                   LLM PROVIDER                        │
│           ChatGPT · Claude · Gemini                  │
└──────────────────────────────────────────────────────┘
```

## Nine Engines

### 1. Runtime Engine
**Purpose:** Orchestration — intent detection, workflow routing, persona loading, state lifecycle.

**Inputs:** User request + Active Story State
**Outputs:** Routed workflow + loaded personas + loaded state
**State Changes:** Session management, workflow progress tracking
**Failure Cases:** Unknown intent, missing required state, persona conflict

### 2. Narrative Intelligence
**Purpose:** Storytelling reasoning, guidance, verification, and extraction.

| Component | Role |
|---|---|
| Reason | 8 modules: Story Architect, Plot Planner, Character Psychology, Theme Planner, Conflict Generator, Mystery Designer, Foreshadowing Planner, Genre Rule Engine |
| Guide | 16 modules: Character Memory, Setup/Payoff, Knowledge Boundary, World State, Timeline, Temporal Manager, Physical State, Scene Goal, Scene Validator, Dialogue Coach, Conflict Escalation, Decision Consequence, Voice Lock, Suspense Curve, Story DNA |
| Verify | 8 modules: Plot Hole, Emotional Arc, Cognitive Load, Pacing, Theme Resonance, Prose Rhythm, Continuity, Ending Satisfaction |
| Synthesize | Raw narrative → structured state extraction with confidence scoring |

### 3. Persona Engine
**Purpose:** Dynamic composition of writer/reader personas that tune module behavior.

**Inputs:** Selected persona IDs
**Outputs:** Configuration delta (module thresholds, style targets, verification focus)
**State Changes:** None (stateless mapping from persona config)
**Composition:** Primary + Secondary + Style + Language + Audience

### 4. Creative Engine
**Purpose:** Generate narrative elements rather than analyzing them.

**Capabilities:** Character Creator, World Creator, Kingdom Designer, Magic System Designer, Religion Designer, Creature Creator, Language Creator, Culture Creator, Technology Designer, Scene Creator, Dialogue Creator, Conflict Creator, Quest Creator, Mystery Creator, Plot Twist Generator, Ending Generator, Title Generator

### 5. Memory Engine
**Purpose:** Persist, retrieve, and manage Story State across sessions.

**Responsibilities:** Active state I/O, archive promotion/demotion, state versioning, cache management, budget enforcement

### 6. Research Engine
**Purpose:** Contextual research for authentic storytelling.

**Capabilities:** Historical, cultural, regional, religious, language, profession, weapon, architecture, fashion, food research

### 7. Verification Engine
**Purpose:** Quality and consistency verification across all dimensions.

**Check types:** Continuity, Timeline, Knowledge, Character, Dialogue, Emotion, Pacing, Logic, Physics, Magic Rules, Culture, History, Grammar, Tone, Voice, Reader Experience

### 8. Publishing Engine
**Purpose:** Prepare stories for publication.

**Capabilities:** Development Editing, Line Editing, Copy Editing, Proofreading, Market Review, Genre Validation, Publishing Readiness, Series Consistency, Book Bible, Synopsis, Query Letter, Blurb, Marketing

### 9. Utilities
**Purpose:** Supporting infrastructure.

**Capabilities:** State Compression, Prompt Compression, Memory Merge, Scene Merge, Conflict Resolution, Diff Engine, Export, Import, Archive, Recovery

## Workflow Execution Model

```
User Request
    │
    ▼
Intent Detection ─── Capability Registry
    │
    ▼
Workflow Selection
    │
    ▼
Persona Selection ─── Persona Engine → config deltas
    │
    ▼
Load Story State ─── Memory Engine → active state
    │
    ▼
Pre-execution Validation ─── State Validator
    │
    ▼
Execute Workflow
    ├── Narrative Intelligence (Reason / Guide / Verify)
    ├── Creative Engine (if generation needed)
    ├── Research Engine (if context needed)
    │
    ▼
State Synthesizer ─── Extract state from generated content
    │
    ▼
Post-execution Validation ─── State Validator + Diff Engine
    │
    ▼
Memory Update ─── Commit state, archive if budget exceeded
    │
    ▼
Optimizer ─── Compact, cache, prepare next context
    │
    ▼
Output ─── Result + updated state + verification report
```

## Package Structure

```
storia/
├── SKILL.md                       ← LLM activation surface (written last)
├── capabilities/                  ← Capability Registry
│   ├── story-planning.md
│   ├── chapter-writing.md
│   ├── dialogue.md
│   ├── worldbuilding.md
│   ├── timeline.md
│   ├── continuity.md
│   ├── character-design.md
│   ├── historical-research.md
│   ├── editing.md
│   └── publishing.md
├── personas/                      ← 100+ composable profiles
│   ├── literary/
│   ├── genre/
│   ├── character/
│   ├── cultural/
│   ├── historical/
│   ├── drama/
│   ├── worldbuilding/
│   ├── plot/
│   ├── style/
│   ├── publishing/
│   ├── reader/
│   └── innovation/
├── workflows/                     ← Orchestration templates
├── runtime/                       ← Runtime Engine
│   ├── orchestrator.js
│   ├── intent.js
│   ├── router.js
│   └── session.js
├── schemas/                       ← Canonical JSON Schemas
│   ├── story.json
│   ├── character.json
│   ├── scene.json
│   ├── knowledge.json
│   └── diff.json
├── memory/                        ← Memory Engine
│   ├── store.js
│   ├── archive.js
│   ├── cache.js
│   └── index.js
├── prompts/                       ← Prompt templates per engine
├── examples/                      ← End-to-end workflow examples
├── docs/                          ← Foundation specification
│   ├── SSS.md
│   ├── ARCHITECTURE.md
│   ├── ENGINE_SPEC.md
│   ├── PERSONA_SPEC.md
│   ├── WORKFLOW_SPEC.md
│   ├── MEMORY_SPEC.md
│   └── SCHEMA_SPEC.md
└── assets/
```

## Capability Packs

| Pack | Contents | Size Estimate |
|---|---|---|
| Core | Runtime, Memory, State, Verification | Required |
| Writing | Poetry, Novel, Screenplay, Drama, Short Stories | ~2 MB |
| Worldbuilding | Geography, Politics, Economy, Religion, Magic | ~3 MB |
| Character | Psychology, Dialogue, Relationships, Backstories, Growth | ~2 MB |
| History | Ancient, Medieval, Colonial, Modern, Alternate | ~4 MB |
| Culture | India, Europe, East Asia, Middle East, Africa, Indigenous | ~5 MB |
| Publishing | Editing, Market Analysis, Beta Reading, Proofreading, Release | ~2 MB |

## Design Principles

1. **LLM Agnostic** — works with ChatGPT, Claude, Gemini, or any NPX-compatible model
2. **Language Independent** — reasoning operates independently of story language
3. **Stateless Core + Persistent Memory** — LLM generates, Storia manages state
4. **Modular** — every capability is independently invocable and composable
5. **Confidence-First** — no state change without confidence scoring
6. **Workflow-Centric** — the skill is a collection of workflows, not commands
7. **Capability Route** — SKILL.md → Capability Registry → Workflow, not direct file scanning
