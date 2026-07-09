# Capability: Chapter Writing

## Description
Generates and revises narrative prose at the chapter and scene level. Supports continuation, rewriting, POV conversion, expansion, compression, and ending generation with full Story State awareness and post-generation verification.

## Activation Triggers
"continue the story", "write next chapter", "continue from scene", "resume writing", "write the ending", "generate finale", "rewrite scene", "redraft scene", "change perspective", "convert POV", "expand scene", "add more detail", "shorten", "tighten", "condense"

## Supported Workflows
W002 — Continue Story, W010 — Generate Ending, W011 — Rewrite Scene, W012 — Convert POV, W013 — Expand Scene, W014 — Compress Scene

## Preferred Personas
Primary: Inherited from story metadata (default Novelist). Secondary: Plot Engineer (for W010), Character Growth Architect (for W012). Style: Inherited from story.

## Engines Invoked
Runtime Engine — routing and session management. Narrative Intelligence (Reason + Guide + Synthesize) — Plot Planner, Conflict Generator, Scene Goal Manager, Knowledge Boundary Map, Story DNA, Character Voice Lock, Character Psychology. Creative Engine — Ending Generator (W010). Verification Engine — Continuity, Timeline, Character Voice, Emotional Arc, Pacing checks. Memory Engine — state commit and versioning. Research Engine — contextual research for authentic settings.

## Input Requirements
Story Metadata, Story DNA, Active Characters, Timeline, Plot State, Active Scene Cache. For W010: full Story State with completed plot. For W011/W012/W013/W014: scene text and scene record.

## Output
Generated chapter or scene text plus Verification Report (continuity, timeline, voice, pacing) and State Changes summary (diffs, knowledge events, character updates).

## Constraints
Confidence >= 0.95 for auto-committed state facts. Continuity violations block commit. Character voice drift flagged with diff. Rewrites must not contradict existing canonical state.
