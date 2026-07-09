# Workflow Specification

> Canonical definitions for all Storia workflows.
> Each workflow defines: trigger, inputs, required state, personas, engines, outputs, memory updates, validation, error handling.

---

## Workflow Template

Every workflow follows this template:

```yaml
workflow_id: string
name: string
description: string
triggers: [string]           # User intent phrases that activate this workflow
capabilities: [string]       # Links to capability registry entries
required_state: [string]     # Story State sections required
optional_state: [string]     # Story State sections optionally used
default_personas:            # Default persona stack
  primary: string
  secondary: string
  style: string
  language: string
  audience: string
engines_used: [string]       # Engines invoked
execution_steps:             # Ordered execution plan
  - step_id: string
    engine: string
    action: string
    inputs: {}
    outputs: {}
    validation: {}
memory_updates:              # State changes expected
  - section: string
    type: create | update | delete | archive
validation_rules:            # Post-execution validation
  - check: string
    severity: critical | major | minor
error_handling:              # Failure recovery
  - failure: string
    recovery: string
output: string               # What the workflow produces
```

---

## Workflow Catalog

### W001 — Start New Story

| Field | Value |
|---|---|
| Triggers | "start a new story", "begin a novel", "new project", "write a story" |
| Capabilities | story-planning |
| Required State | None (initializes new state) |
| Default Personas | Primary: Novelist, Style: Literary |
| Engines Used | Runtime, Narrative Intelligence (Reason), Persona, Memory, Creative |

**Execution Steps:**
1. Initialize empty Story State with metadata from user
2. Load selected personas (from user genre/language preferences)
3. Reason: Story Architect — propose story structure
4. Reason: Genre Rule Engine — validate genre expectations
5. Creative: Title Generator — propose titles
6. Reason: Theme Planner — identify central themes
7. Present blueprint to user for approval
8. Commit initial state to Memory

**Memory Updates:**
- Create: Story Metadata, Story DNA (initial)
- Archive: none

**Validation:**
- Story Metadata complete
- Genre + persona compatibility checked

**Error Handling:**
- User cancels: clean up temporary state
- Genre not supported: suggest nearest supported genre

**Output:** Story Blueprint (architecture, themes, genre expectations, title suggestions)

---

### W002 — Continue Story

| Field | Value |
|---|---|
| Triggers | "continue the story", "write next chapter", "continue from scene", "resume writing" |
| Capabilities | chapter-writing |
| Required State | Story Metadata, Story DNA, Active Characters, Timeline, Plot State |
| Default Personas | Inherited from story metadata |
| Engines Used | Runtime, Narrative Intelligence (Reason + Guide + Synthesize), Memory, Research, Verification |

**Execution Steps:**
1. Load active Story State
2. Reason: Plot Planner — determine what comes next
3. Reason: Conflict Generator — escalate active conflicts
4. Guide: Scene Goal Manager — set scene objectives
5. Guide: Knowledge Boundary Map — establish character knowledge for scene
6. Guide: Story DNA — verify scene aligns with story identity
7. Research: Load context if historical/cultural setting
8. Optimize: Context Compactor — build minimal prompt
9. [LLM generates chapter/scene]
10. Synthesize: Extract state changes from generated text
11. Verify: Continuity Checker + Timeline Checker + Character Voice Lock
12. Verify: Emotional Arc Analyzer + Pacing Analyzer
13. Memory: Commit state changes
14. Present chapter + verification report

**Memory Updates:**
- Create: Scene record, Knowledge Events
- Update: Timeline, Character State, World State, Plot State, Reader Model

**Validation:**
- Confidence >= 0.95 for all auto-committed facts
- No continuity violations
- Character voice within tolerance

**Error Handling:**
- Low confidence extraction: flag for user review
- Continuity violation: block commit; suggest fix
- Timeline error: flag; suggest correction
- Character voice drift: flag with voice profile diff

**Output:** Chapter text + Verification report + State changes summary

---

### W003 — Plan Novel

| Field | Value |
|---|---|
| Triggers | "plan a novel", "outline a story", "create plot", "story structure" |
| Capabilities | story-planning |
| Required State | Story Metadata (minimal: genre, language, audience) |
| Default Personas | Primary: Novelist, Secondary: Plot Engineer |
| Engines Used | Runtime, Narrative Intelligence (Reason), Persona, Creative (partial) |

**Execution Steps:**
1. Load/initialize Story Metadata
2. Load personas
3. Reason: Story Architect — propose 3-act/5-act/7-act structure
4. Reason: Theme Planner — identify themes per act
5. Reason: Character Psychology — create character arcs aligned to structure
6. Reason: Plot Planner — scene-level sequence
7. Reason: Conflict Generator — conflicts per act
8. Reason: Foreshadowing Planner — setup/payoff map
9. Reason: Mystery Designer — if mystery/thriller genre
10. Creative: Title Generator
11. Present full novel plan
12. Commit to Memory

**Memory Updates:**
- Create: Story Metadata, Story DNA, Plot State (initial)
- Create: Character State (initial for main cast)

**Validation:**
- Act structure complete
- Character arcs have beginning/middle/end
- Theme present in each act
- No plot holes in outline

**Error Handling:**
- Incomplete plan: identify gaps, request user input
- Structural issues: flag and suggest alternatives

**Output:** Novel Plan (acts, chapters, character arcs, themes, conflicts, foreshadowing map)

---

### W004 — Build Character

| Field | Value |
|---|---|
| Triggers | "create a character", "design character", "build a persona", "character profile" |
| Capabilities | character-design |
| Required State | Story Metadata (genre, setting for context) |
| Default Personas | Primary: Character Psychologist, Secondary: Novelist |
| Engines Used | Runtime, Creative, Narrative Intelligence (Reason), Persona, Memory |

**Execution Steps:**
1. Load Story Metadata for context
2. Load personas
3. Creative: Character Creator — generate initial profile
4. Creative: Backstory Generator — create formative history
5. Reason: Character Psychology — map motivation, fear, flaw, growth
6. Guide: Character Voice Lock — establish voice profile
7. Creative: Dialogue Creator — generate sample dialogue
8. Creative: Relationship Architect — connections to existing characters
9. Present character profile
10. Commit to Memory

**Memory Updates:**
- Create: Character State (full profile)

**Validation:**
- Character has clear motivation, fear, flaw
- Voice profile is distinct from existing characters
- Backstory is consistent with world timeline
- Relationships reference valid existing characters

**Error Handling:**
- Duplicate archetype: flag similarity to existing character
- World inconsistency: flag and suggest alignment
- Incomplete profile: identify gaps

**Output:** Character Profile (identity, appearance, psychology, voice, backstory, relationships, arc)

---

### W005 — Build World

| Field | Value |
|---|---|
| Triggers | "build a world", "create a setting", "design world", "worldbuilding" |
| Capabilities | worldbuilding |
| Required State | Story Metadata (genre for context) |
| Default Personas | Primary: Fantasy Worldbuilder or Genre-appropriate |
| Engines Used | Runtime, Creative, Persona, Research, Memory |

**Execution Steps:**
1. Load Story Metadata for genre/context
2. Load personas (worldbuilding-focused)
3. Creative: World Creator — generate geography, climate, ecology
4. Creative: Kingdom Designer — political structures
5. Creative: Religion Designer — belief systems
6. Creative: Magic System Designer — if fantasy
7. Creative: Technology Designer — tech level
8. Creative: Culture Creator — customs and society
9. Research: historical/cultural parallels for authenticity
10. Present world bible
11. Commit to Memory

**Memory Updates:**
- Create: World State (full world database)

**Validation:**
- Internal consistency (magic rules, technology, ecology)
- No contradictions in world logic
- Appropriate scale for story length

**Error Handling:**
- Magic system undefined for fantasy: flag as critical
- Technology anachronism: flag and suggest correction
- Cultural insensitivity: flag and offer alternatives

**Output:** World Bible (geography, politics, religion, magic, technology, culture, history)

---

### W006 — Review Chapter

| Field | Value |
|---|---|
| Triggers | "review chapter", "check chapter", "analyze chapter", "feedback on chapter" |
| Capabilities | continuity, timeline |
| Required State | Full Story State, Chapter text |
| Default Personas | Inherited from story + add Developmental Editor |
| Engines Used | Runtime, Verification, Narrative Intelligence (Verify), Persona, Research |

**Execution Steps:**
1. Load Story State
2. Load personas (add verification-focused)
3. Verify: Continuity Checker — compare chapter against Story State
4. Verify: Timeline Checker — verify temporal consistency
5. Verify: Character Voice Lock — check dialogue authenticity
6. Verify: Emotional Arc Analyzer — map emotional beats
7. Verify: Pacing Analyzer — assess rhythm
8. Verify: Prose Rhythm Analyzer — sentence variety
9. Verify: Reader Cognitive Load — assess complexity
10. Verify: Theme Resonance Checker — align with Story DNA
11. Research: if historical/reference needed
12. Compile verification report

**Memory Updates:**
- None (read-only analysis)

**Validation:**
- All verification checks pass or are flagged

**Error Handling:**
- Check timeout on long chapters: break into sections

**Output:** Verification Report (issues by severity, continuity report, timeline check, suggestions)

---

### W007 — Fix Continuity

| Field | Value |
|---|---|
| Triggers | "fix continuity", "resolve contradiction", "continuity error", "fix plot hole" |
| Capabilities | continuity |
| Required State | Full Story State, Verification report |
| Default Personas | Inherited from story |
| Engines Used | Runtime, Narrative Intelligence (Verify + Synthesize), Memory, Verification |

**Execution Steps:**
1. Load Story State + Verification Report
2. Identify all continuity issues
3. For each issue:
   a. Determine root cause (state error, generation error, intentional change)
   b. If state error: propose state correction
   c. If generation error: propose rewrite suggestion
   d. If intentional change: update state to reflect new canonical fact
4. Apply corrections via Synthesizer (confidence-scored)
5. Re-verify after fixes
6. Present fix report

**Memory Updates:**
- Update: Affected state sections
- Diff: Record all corrections in revision history

**Validation:**
- All issues resolved or explicitly deferred
- Fixes don't introduce new contradictions

**Error Handling:**
- Root cause unclear: present options to user
- Fix chains (fixing A breaks B): cascade detection

**Output:** Continuity Fix Report (issues found, root causes, corrections applied, re-verification status)

---

### W008 — Improve Dialogue

| Field | Value |
|---|---|
| Triggers | "improve dialogue", "fix dialogue", "better conversation", "dialogue feels flat" |
| Capabilities | dialogue |
| Required State | Chapter/scene text, Character State |
| Default Personas | Primary: Dialogue Dramatist, Style: Cinematic |
| Engines Used | Runtime, Narrative Intelligence (Guide + Verify), Persona |

**Execution Steps:**
1. Load scene text + Character State (voice profiles)
2. Guide: Character Voice Lock — check each character's dialogue against voice profile
3. Guide: Dialogue Coach — evaluate subtext, beats, attribution variety
4. Verify: Identify flat exchanges, repetitive tags, missing subtext
5. Generate improvement suggestions per exchange
6. Present dialogue improvement report

**Memory Updates:**
- None (suggestion layer)

**Validation:**
- Each character's lines match their voice profile
- Dialogue has subtext (not just information exchange)
- Attribution variety adequate
- Beats and pauses natural

**Error Handling:**
- Voice profile missing: flag, suggest creation
- Style override: respect persona conflict resolution

**Output:** Dialogue Improvement Suggestions (per exchange: issue, suggestion, expected effect)

---

### W009 — Improve Pacing

| Field | Value |
|---|---|
| Triggers | "fix pacing", "too slow", "too fast", "improve pacing", "pacing feels off" |
| Capabilities | timeline |
| Required State | Chapter text, Scene Cache |
| Default Personas | Primary: Plot Engineer, Style: varies |
| Engines Used | Runtime, Narrative Intelligence (Verify), Persona |

**Execution Steps:**
1. Load chapter text + Scene Cache
2. Verify: Pacing Analyzer — scene lengths, tension curve, action/reflection ratio
3. Identify pacing issues (sags, rushes, imbalances)
4. Suggest restructuring per issue
5. Present pacing report

**Memory Updates:**
- None (suggestion layer)

**Validation:**
- Tension curve has appropriate peaks and valleys
- Action/reflection ratio matches genre expectations
- Scene lengths vary naturally

**Error Handling:**
- Genre-specific pacing rules from Genre Rule Engine

**Output:** Pacing Report (tension curve, scene length analysis, imbalance flags, suggestions)

---

### W010 — Generate Ending

| Field | Value |
|---|---|
| Triggers | "write the ending", "generate finale", "conclude the story", "ending" |
| Capabilities | chapter-writing |
| Required State | Full Story State (all sections), Completed plot |
| Default Personas | Inherited + Primary: Plot Engineer |
| Engines Used | Runtime, Narrative Intelligence (Reason + Guide + Verify + Synthesize), Creative, Memory |

**Execution Steps:**
1. Load full Story State
2. Verify: Ending Satisfaction Analyzer — check open promises, arcs, mysteries
3. Reason: Plot Planner — determine ending structure
4. Guide: Knowledge Boundary Map — ensure finale-relevant knowledge is known
5. Guide: Story DNA — verify ending aligns with themes
6. Creative: Ending Generator — propose ending approaches
7. [LLM generates ending]
8. Synthesize: Extract state changes
9. Verify: Full verification suite
10. Present ending + final verification report

**Memory Updates:**
- Update: Plot State (resolve all subplots, mark complete)
- Update: Story Metadata (status → complete)

**Validation:**
- All major promises fulfilled
- All character arcs completed
- All mysteries answered
- Emotional resolution achieved
- Themes reinforced

**Error Handling:**
- Unresolved threads: flag before generation
- Unsatisfying emotional arc: suggest adjustments

**Output:** Ending text + Ending Satisfaction Report (promises fulfilled, arcs completed, emotional resolution)

---

### W011 — Rewrite Scene

| Field | Value |
|---|---|
| Triggers | "rewrite scene", "redraft scene", "rewrite chapter", "try again" |
| Capabilities | chapter-writing |
| Required State | Scene text, Scene record, Story State |
| Default Personas | Inherited |
| Engines Used | Runtime, Narrative Intelligence (Reason + Guide + Synthesize), Verification, Memory |

**Execution Steps:**
1. Load scene text + Scene record + Story State
2. Reason: Scene Goal Manager — identify original scene objective
3. Reason: Character Psychology — character state entering scene
4. Guide: Knowledge Boundary Map — character knowledge at scene start
5. [User provides rewrite direction or Storia proposes]
6. [LLM regenerates scene]
7. Synthesize: Extract state changes (as diff from original)
8. Verify: Continuity + Timeline + Voice
9. Memory: Commit diff
10. Present rewritten scene + diff report

**Memory Updates:**
- Update: Scene record
- Diff: Record rewrite in revision history

**Validation:**
- New version doesn't contradict existing canonical state
- Character knowledge consistent
- Timeline consistent

**Error Handling:**
- Rewrite creates new contradictions: detect and flag
- Direction unclear: request clarification

**Output:** Rewritten scene + Diff report (what changed, what stayed the same)

---

### W012 — Convert POV

| Field | Value |
|---|---|
| Triggers | "change perspective", "convert POV", "rewrite from another character" |
| Capabilities | chapter-writing |
| Required State | Scene text, Scene record, Character State (new POV character) |
| Default Personas | Inherited |
| Engines Used | Runtime, Narrative Intelligence (Reason + Guide + Synthesize), Verification |

**Execution Steps:**
1. Load scene + Story State
2. Identify target POV character
3. Guide: Character Voice Lock — apply POV character's voice
4. Guide: Knowledge Boundary Map — only include POV character's knowledge
5. Guide: Character Psychology — filter events through POV character's perspective
6. [LLM regenerates scene from new POV]
7. Synthesize: Extract state changes
8. Verify: Knowledge boundary compliance
9. Verify: Character voice consistency with POV character
10. Present rewritten POV scene

**Memory Updates:**
- Update: Scene record (POV field)
- New knowledge events for POV character as needed

**Validation:**
- POV character doesn't know information outside their knowledge boundary
- POV character's voice is consistent
- Scene events remain the same (only perspective changes)

**Error Handling:**
- Knowledge leak: flag and correct
- Voice drift: adjust

**Output:** POV-converted scene + Knowledge boundary compliance report

---

### W013 — Expand Scene

| Field | Value |
|---|---|
| Triggers | "expand scene", "add more detail", "lengthen this", "flesh out" |
| Capabilities | chapter-writing |
| Required State | Scene text, Scene record, Story DNA |
| Default Personas | Inherited |
| Engines Used | Runtime, Narrative Intelligence (Guide + Verify) |

**Execution Steps:**
1. Load scene + Story DNA
2. Identify expansion opportunities (sensory detail, emotional depth, dialogue, action)
3. Guide: Story DNA — ensure expansion aligns with style
4. [LLM expands scene at marked points]
5. Synthesize: Extract new state changes
6. Verify: No continuity violations from new content
7. Present expanded scene

**Memory Updates:**
- Update: Scene record (new content)
- Potential new Knowledge Events from expanded interactions

**Validation:**
- Expansion doesn't contradict existing state
- Expansion respects pacing (doesn't over-detail)
- New content feels organic, not padded

**Error Handling:**
- Expansion creates pacing issue: flag
- Expansion adds contradictory facts: flag

**Output:** Expanded scene + Expansion report (what was added, why)

---

### W014 — Compress Scene

| Field | Value |
|---|---|
| Triggers | "compress", "shorten", "tighten", "make this shorter", "condense" |
| Capabilities | chapter-writing |
| Required State | Scene text, Scene record |
| Default Personas | Inherited |
| Engines Used | Runtime, Narrative Intelligence (Verify) |

**Execution Steps:**
1. Load scene
2. Identify compressible sections (overwritten description, repetitive dialogue)
3. Verify: Scene Purpose Validator — ensure compression preserves purpose
4. [LLM compresses scene]
5. Verify: Emotional beats preserved
6. Verify: Key plot points preserved
7. Present compressed scene

**Memory Updates:**
- Update: Scene record

**Validation:**
- Scene objective unchanged
- Critical plot points preserved
- Emotional beats preserved
- Character moments preserved

**Error Handling:**
- Over-compression (loses meaning): flag sections that need more space

**Output:** Compressed scene + Compression report (what was cut, what was preserved)

---

### W015 — Create Sequel / Series Bible

| Field | Value |
|---|---|
| Triggers | "plan a sequel", "series bible", "series planning", "next book" |
| Capabilities | story-planning |
| Required State | Full Story State (from completed book) |
| Default Personas | Primary: Novelist, Secondary: Character Growth Architect |
| Engines Used | Runtime, Narrative Intelligence (Reason), Creative, Memory |

**Execution Steps:**
1. Load completed Story State
2. Reason: Story Architect — identify unresolved threads for sequel
3. Reason: Character Psychology — project character arcs into next book
4. Reason: Conflict Generator — new conflicts post-resolution
5. Creative: Title Generator
6. Compile Series Bible
7. Present

**Memory Updates:**
- Archive: Completed book state
- Create: New Story State for sequel (inheriting core data)

**Validation:**
- Sequel has its own story arc (not just extension)
- Character growth continues naturally
- World state evolved since book 1

**Error Handling:**
- Sequel premise too similar to book 1: flag
- Character arcs fully complete: flag need for new arcs

**Output:** Series Bible (sequel blueprint, ongoing arcs, world changes, new conflicts)

---

### W016 — Prepare Publication

| Field | Value |
|---|---|
| Triggers | "prepare for publishing", "publish story", "ready for publication", "final check" |
| Capabilities | editing, publishing |
| Required State | Full narrative text, Full Story State, Story DNA |
| Default Personas | Add: Developmental Editor, Line Editor, Copy Editor, Proofreader |
| Engines Used | Runtime, Publishing, Verification, Memory |

**Execution Steps:**
1. Load full narrative + Story State
2. Publishing: Developmental Edit — structural feedback
3. Publishing: Line Edit — sentence-level polish
4. Publishing: Copy Edit — grammar and consistency
5. Publishing: Proofread — final error pass
6. Publishing: Market Review — genre compliance, comparable titles
7. Publishing: Genre Validation — meets genre expectations
8. Publishing: Publishing Readiness — comprehensive checklist
9. Compile publishing package
10. Creative: Blurb Generator
11. Creative: Synopsis Generator
12. Creative: Query Letter Generator (if applicable)

**Memory Updates:**
- Update: Story Metadata (status → publishing)

**Validation:**
- Publishing Readiness score >= 80
- No critical issues remaining
- Genre conventions met
- Market positioning clear

**Error Handling:**
- Low readiness score: flag specific blockers
- Genre violation: flag with explanation

**Output:** Publishing Package (edit reports, readiness score, blurb, synopsis, query letter, market analysis)

---

## Workflow Selection Matrix

| User Intent | Primary Workflow | Fallback |
|---|---|---|
| Start new | W001 — Start New Story | W003 — Plan Novel |
| Continue writing | W002 — Continue Story | — |
| Plan | W003 — Plan Novel | W001 — Start New Story |
| Character work | W004 — Build Character | W002 (incorporate character) |
| Worldbuilding | W005 — Build World | W002 (incorporate world) |
| Review | W006 — Review Chapter | — |
| Fix issues | W007 — Fix Continuity | W008 — Improve Dialogue, W009 — Improve Pacing |
| Dialogue | W008 — Improve Dialogue | W002 (with dialogue focus) |
| Pacing | W009 — Improve Pacing | W002 (with pacing adjustments) |
| Ending | W010 — Generate Ending | W002 (final chapter) |
| Rewrite | W011 — Rewrite Scene | W013 — Expand Scene, W014 — Compress Scene |
| POV change | W012 — Convert POV | W011 — Rewrite Scene |
| Expand | W013 — Expand Scene | W002 (continue with expansion) |
| Compress | W014 — Compress Scene | W006 (review for cuts) |
| Series | W015 — Create Series Bible | W003 — Plan Novel (for next book) |
| Publish | W016 — Prepare Publication | — |
