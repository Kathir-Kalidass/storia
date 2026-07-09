# Narrative Framework

Storia operates on a four-layer architecture:

```
Narrative Modules → Runtime Services → Story State → LLM Provider
```

## Story State Model

The Story State is the single source of truth. It contains:

- **Metadata**: Title, genre, language, status, word count targets
- **DNA**: Core themes, symbol registry, tone profile, genre rules, promises to reader
- **Characters**: Profiles, relationships, arcs, knowledge boundaries, physical state
- **World**: Locations, factions, magic systems, cultures, history events
- **Timeline**: Internal chronology, seasons, time passage tracking
- **Reader Model**: Open questions, cognitive load, suspense level, emotional curve
- **Plot**: Main plot progress, subplots, mysteries, conflicts, foreshadowing
- **Scenes**: Current scene, previous scene, connected scenes

## Confidence-Based State Updates

Every state change goes through confidence scoring:

| Score | Action |
|-------|--------|
| ≥0.95 | Auto-commit to state |
| 0.70–0.94 | Flag for user review |
| <0.70 | Reject, ask user to confirm |

## Four Knowledge Types

- **Public**: Everyone knows this
- **Private**: One character knows this
- **Secret**: No living character knows this
- **Unknown**: Not yet established in the narrative
