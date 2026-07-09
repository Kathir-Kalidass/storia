# Capability: Timeline

## Description
Manages narrative chronology including calendar systems, seasonal progression, temporal anchoring of events, and time skip handling. Analyzes pacing by evaluating scene length distribution, tension curves, and action-to-reflection ratios across chapters.

## Activation Triggers
"fix pacing", "too slow", "too fast", "improve pacing", "pacing feels off", "check timeline", "temporal consistency", "time skip"

## Supported Workflows
W006 — Review Chapter, W009 — Improve Pacing

## Preferred Personas
Primary: Plot Engineer. Secondary: Suspense Architect, Non-linear Narrative Designer (if applicable). Style: varies by story.

## Engines Invoked
Runtime Engine — workflow routing. Narrative Intelligence (Guide + Verify) — Timeline Tracker, Temporal Manager, Suspense Curve Manager. Verification Engine — Timeline check (event ordering, time passage, temporal paradoxes), Pacing check (scene length, tension curve, action/reflection balance). Persona Engine — persona composition for pacing sensitivity.

## Input Requirements
Chapter text, Active Scene Cache, Timeline section (current_time, calendar_system, significant_dates, temporal_anchors, flashback_active, time_skip_active). For pacing analysis: scene records with length and tension metadata.

## Output
Timeline report (temporal consistency, event ordering verification, anachronism flags) or Pacing Report (tension curve visualization, scene length analysis, imbalance flags, restructuring suggestions).

## Constraints
Event timestamps must be monotonically increasing within a timeline. Time paradoxes flagged with severity. Pacing analysis respects genre-specific norms (thrillers expect faster pacing than literary fiction). Read-only — suggests changes but does not modify state.
