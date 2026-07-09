# Guide Engine — Prompt Guidance

## Purpose
Constraint enforcement during generation. Reads Story State and persona config to produce constraints that keep the narrative consistent.

## When to Use Guide
- Before generating any narrative text
- During writing to maintain consistency
- When switching between scenes or POVs

## Available Guide Modes

| Mode | Constraints Produced |
|------|---------------------|
| `knowledge-boundary` | Per-character knowledge limits — prevents info leaks |
| `character-voice` | Voice consistency rules — vocabulary, rhythm, dialect |
| `scene-goal` | Scene purpose requirements — must advance something |
| `timeline` | Chronology rules — time must flow forward logically |
| `physical-state` | Physical consistency — injuries persist, inventory is tracked |
| `story-dna` | Tone and theme consistency — stay within established profile |

## Integration
Guide output is consumed by the generation step. The constraints should be enforced by the LLM during text generation.
