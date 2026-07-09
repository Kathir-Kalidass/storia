# Character Creation Scenario (W004)

This walkthrough shows how Storia handles a character design request through
the **W004 — Build Character** workflow, demonstrating persona-guided
character generation with confidence-scored state extraction.

## User Request

> "Create a character: a former pirate captain turned smuggler, haunted by
> the crew he lost in a storm that should have killed him too. His name is
> Captain Silas Marwick."

## Step 1 — Intent Detection

```
Input: "create a character named Captain Silas Marwick"
Match: "create character" → intent: 'build_character', workflow: 'W004'
```

## Step 2 — Persona Composition

The persona stack resolves:
- **primary**: character-psychologist (deep internal conflict, trauma arcs)
- **secondary**: novelist (narrative integration)

The character-psychologist persona overrides the verify modules to prioritize
`character_voice_consistency` and `psychological_plausibility`.

## Step 3 — Character Generation

The Reason module's `character_psychology_reasoner` produces:

```json
{
  "mode": "character_psychology_reasoner",
  "analysis": {
    "core_trauma": "survivor's guilt — believes he should have died with his crew",
    "defense_mechanisms": ["dark_humor", "emotional_distance", "workaholism"],
    "arc_trajectory": "from self-destruction to reluctant redemption",
    "voice_notes": {
      "speech_pattern": "short, pragmatic sentences; avoids emotional topics",
      "vocabulary": "nautical metaphors, dry understatement",
      "tell_tale": "touches his left shoulder where a splinter hit him during the storm"
    }
  }
}
```

## Step 4 — State Synthesis

The Synthesizer extracts with confidence scoring:

| Fact | Confidence | Action |
|------|-----------|--------|
| Name: Silas Marwick | 0.99 | Auto-commit |
| Former pirate captain | 0.95 | Auto-commit |
| Haunted by lost crew | 0.85 | Auto-commit |
| Survived a storm | 0.90 | Auto-commit |
| Shoulder splinter injury | 0.70 | Flagged (medium) |

The flagged fact about the shoulder injury is held for user confirmation
before entering the canonical state.

## Step 5 — Result

```json
{
  "character_id": "silas_marwick",
  "name": "Captain Silas Marwick",
  "active": true,
  "physical_state": { "injuries": [] },
  "emotional_state": {
    "primary_emotion": "guilt",
    "intensity": 0.85,
    "arc": []
  },
  "voice_profile": {
    "vocabulary_tier": "moderate",
    "dialect_markers": ["nautical_slang"],
    "emotional_expression": "reserved"
  },
  "arc_progress": 0.0,
  "active_goals": ["find_redemption", "protect_current_crew"],
  "active_conflicts": ["survivors_guilt", "mistrust_of_fate"]
}
```

## Step 6 — User Confirmation

The flagged injury fact is presented:

> *"Should Silas have a shoulder injury from the storm? (This was inferred at 70% confidence)"*

The user confirms → fact moves to auto-committed state.
