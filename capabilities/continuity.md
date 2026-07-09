# Capability: Continuity

## Description
Detects, diagnoses, and repairs narrative contradictions across character state, world state, timeline, knowledge boundaries, and plot logic. Ensures every chapter is consistent with the entire canonical Story State.

## Activation Triggers
"review chapter", "check chapter", "analyze chapter", "feedback on chapter", "fix continuity", "resolve contradiction", "continuity error", "fix plot hole"

## Supported Workflows
W006 — Review Chapter, W007 — Fix Continuity

## Preferred Personas
Primary: Novelist (inherited). Secondary: Character Consistency Manager, Plot Engineer. For review: add Developmental Editor.

## Engines Invoked
Runtime Engine — routing and persona loading. Narrative Intelligence (Verify + Synthesize) — Continuity Checker, Plot Hole Detector, Knowledge Boundary Map, Character Voice Lock. Verification Engine — Continuity check (character, world, timeline), Knowledge check, Logic check, Timeline check. Memory Engine — commit corrective state diffs. Utilities Engine — Diff Engine for revision recording.

## Input Requirements
Full Story State (all sections), chapter text, Verification Report (for W007). For W006: chapter text and full Story State. For W007: Verification Report plus full Story State.

## Output
For W006: Verification Report with issues by severity (critical, major, minor, suggestion), continuity report, timeline check, and improvement suggestions. For W007: Continuity Fix Report listing issues found, root causes determined (state error / generation error / intentional change), corrections applied, and re-verification status.

## Constraints
No state modification in review mode (W006). Fix mode (W007) applies corrections through Synthesizer with confidence scoring. Fix chains detected — correcting one issue must not introduce new contradictions. Root cause analysis distinguishes LLM error from intentional author choice.
