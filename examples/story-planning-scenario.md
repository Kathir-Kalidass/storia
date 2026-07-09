# Story Planning Scenario (W003)

This walkthrough shows how Storia guides an LLM through the **W003 — Plan Novel** workflow.
Every interaction starts with the SKILL.md activation surface, routes through the Capability Registry,
and is executed by the Workflow Engine.

## User Request

> "I want to plan a fantasy novel about a disgraced court astronomer who discovers
> the stars are actually holes in a celestial dome, and the beings on the other side
> are trying to break through."

## Step 1 — Intent Detection

The orchestrator's `detectIntent()` matches against trigger phrases:

```
Input: "plan a fantasy novel"
Match: "plan" → intent: 'plan_novel', workflow: 'W003'
```

## Step 2 — Workflow Pipeline

W003 defines the following pipeline (parsed from `workflows/configs/W003.md`):

| Step | Engine | Method |
|------|--------|--------|
| 1 | state-manager | `load(storyId)` |
| 2 | persona-engine | `resolve([primary, secondary])` |
| 3 | narrative-intelligence | `reason(plot_arc_reasoner)` |
| 4 | narrative-intelligence | `reason(story_structure_reasoner)` |
| 5 | narrative-intelligence | `guide(knowledge_boundaries)` |
| 6 | narrative-intelligence | `guide(scene_goal_guide)` |
| 7 | synthesizer | `extractUserInput(text)` |
| 8 | validator | `validate(state)` |
| 9 | diff-engine | `computeDiff(before, after)` |

## Step 3 — Persona Composition

Persona stack resolves to:
- **primary**: fantasy-writer (epic worldbuilding, magic systems)
- **secondary**: novelist (character-driven arcs, pacing)

Conflict resolution: fantasy-writer's `engine_overrides` take priority for
reason/verify modules; novelist's tone acts as a moderating influence.

## Step 4 — Narrative Intelligence

The Reason module produces:

```json
{
  "mode": "story_structure_reasoner",
  "analysis": {
    "type": "five_act_structure",
    "hook": "The stars are wounds in the sky. The astronomer who knows this has been branded a heretic.",
    "acts": [
      { "act": 1, "label": "The Heresy", "summary": "Astronomer Elara is stripped of her rank" },
      { "act": 2, "label": "The Evidence", "summary": "She proves the celestial dome theory" },
      { "act": 3, "label": "The Threshold", "summary": "First breach — a star goes dark" },
      { "act": 4, "label": "The Invasion", "summary": "Beings from beyond begin crossing" },
      { "act": 5, "label": "The Choice", "summary": "Seal the dome or let through one that offers knowledge" }
    ],
    "thematic_throughline": "Knowledge as both salvation and danger"
  }
}
```

## Step 5 — State Synthesis

The Synthesizer extracts from the conversation:

```json
{
  "characters": {
    "elara": { "name": "Elara Voss", "role": "protagonist", "arc": "disgraced_astronomer" }
  },
  "plot": {
    "main_plot_progress": 0.05,
    "active_subplots": [{"name": "the_heresy", "progress": 0.1}],
    "themes": ["knowledge_vs_safety", "truth_and_heresy"]
  }
}
```

## Step 6 — Verify & Diff

The Validator checks for conflicts (none yet — new story). The Diff Engine records
the initial state transition from empty to planned.

## Result

Storia returns a structured response with the plan, composed persona guidance,
and the updated Story State ready for the user to continue.
