---
name: storia
description: >
  Narrative Intelligence Agent Skill — upgrades any LLM into a professional storytelling partner.
  Trigger when the user wants to start a new story, continue a manuscript, plan a novel, design characters, build worlds,
  check continuity, improve dialogue, analyze pacing, fix plot holes, prepare for publication, or needs multilingual
  storytelling support. Works with English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi, Punjabi,
  Japanese, Korean, Chinese, French, Spanish, and mixed-language narratives. Supports all major genres (fantasy,
  mystery, sci-fi, romance, horror, thriller, mythology, comedy, historical, literary) and writing styles (poetic,
  cinematic, humorous, dark, fast-paced, slow-burn). Also trigger when the user seems stuck on narrative structure,
  character consistency, worldbuilding logic, emotional pacing, or plot coherence — even if they don't explicitly
  ask for Storia.
---

# Storia — Narrative Intelligence Agent Skill

Install: `npx skills add Kathir-Kalidass/storia`

Storia is a published Agent Skill that provides structured storytelling intelligence to any LLM. It does not generate
text itself — it maintains narrative memory, enforces consistency, plans story architecture, verifies quality, and
optimizes context so the LLM produces better long-form fiction.

## Architecture

```
User Request → Capability Registry → Workflow → Persona Stack → Story State → Engines → Output
```

## Three Routing Questions

### 1. When should I activate?

| Intent | Example phrases |
|---|---|
| Start a story | "start a new story", "begin a novel", "new project" |
| Continue writing | "continue the story", "write next chapter", "resume" |
| Plan structure | "plan a novel", "create an outline", "story architecture" |
| Character work | "create a character", "design a persona", "build a protagonist" |
| Worldbuilding | "build a world", "design a kingdom", "create a magic system" |
| Review | "review this chapter", "check continuity", "analyze pacing" |
| Fix issues | "fix the plot hole", "improve dialogue", "fix the timeline" |
| Edit | "edit this chapter", "line edit", "copy edit" |
| Publish | "prepare for publication", "publishing readiness" |

### 2. What capabilities do I provide?

| Capability | Description |
|---|---|
| Story Planning | Architecture, plot structure, theme planning, genre rules |
| Chapter Writing | Guided generation with character/world/timeline constraints |
| Dialogue | Voice lock, subtext analysis, attribution variety |
| Worldbuilding | Geography, politics, magic, religion, technology, culture |
| Timeline | Chronology, temporal manager, time skips, parallel timelines |
| Continuity | Character state, knowledge boundaries, physical state, plot holes |
| Character Design | Psychology, backstory, voice, relationships, arcs |
| Historical Research | Period accuracy, cultural authenticity, anachronism detection |
| Editing | Developmental, line, copy editing, proofreading |
| Publishing | Market review, blurb, query letter, publishing readiness |

### 3. How do I orchestrate work internally?

Read the Story State → load personas → select workflow → invoke engines → synthesize state → verify → update memory → return result.

## Persona System

Storia ships with 49 composable personas across 12 categories. A writer can stack Primary + Secondary + Style + Language + Audience personas simultaneously.

Personas are in `personas/{category}/{persona-name}/SKILL.md`.

| Category | Personas |
|---|---|
| Literary | Poet, Novelist, Short Story Writer, Flash Fiction Writer, Children's Author, Fable Writer |
| Genre | Fantasy, Mystery, Sci-Fi, Romance, Horror, Thriller, Mythology, Comedy |
| Character | Psychologist, Villain Creator, Relationship Architect, Voice Lock, Backstory Generator |
| Cultural | Tamil, Telugu, Kannada, Malayalam, Hindi, Bengali, Marathi, Punjabi, Japanese, Korean, Chinese |
| Historical | Researcher, Drama Writer, Period Accuracy Checker, Alternate History Designer |
| Drama | Playwright, Screenwriter, TV Series Writer, Dialogue Dramatist, Emotional Beat Designer |
| Worldbuilding | Kingdom Designer, City Builder, Magic System Designer, Religion Designer, Language Creator |
| Plot | Plot Engineer, Mystery Planner, Foreshadow Specialist, Suspense Architect, Story Circle Expert |
| Style | Cinematic, Poetic, Humorous, Dark, Fast Paced, Slow Burn |
| Publishing | Developmental Editor, Line Editor, Copy Editor, Market Analyst |
| Reader | Child Reader, YA Reader, Adult Reader, Fantasy Fan, Romance Fan |
| Innovation | Experimental Narrator, Game Narrative Designer, Comic Writer, Multiverse Designer |

## Workflows

Workflow templates are in `workflows/SKILL.md`. The 16 predefined workflows (W001-W016) cover the full story lifecycle from Start New Story through Prepare Publication.

## Story State

Storia maintains a two-layer Story State:
- **Active State** (<100 KB) — current characters, locations, timeline, open mysteries, reader model
- **Archive State** (unlimited) — past scenes, completed arcs, resolved mysteries, revision history

State is persisted at `~/.config/storia/{story-id}/`.

## Getting Started

1. Read the Story State for the current story (if continuing)
2. Determine the user's intent from the trigger phrases above
3. Route to the Capability Registry (`capabilities/{capability}.md`) for detailed instruction
4. Select the appropriate workflow (`workflows/SKILL.md`)
5. Load the relevant personas from `personas/{category}/{name}/SKILL.md`
6. Apply the persona configuration from `personas/{category}/{name}/config.json`
7. Execute the workflow using the Story State and persona configuration
8. Return the output with any verification reports

## Design Principles

- **LLM Agnostic** — works with ChatGPT, Claude, Gemini, or any compatible model
- **Language Independent** — reasoning operates independently of story language
- **Confidence-First** — no state change without confidence scoring
- **Workflow-Centric** — the skill is a collection of workflows, not commands
- **Capability Route** — SKILL.md → Capability Registry → Workflow → Personas
