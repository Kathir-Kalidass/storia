# Reason Engine — Prompt Guidance

## Purpose
Planning before generation. Produces structured outlines, maps, and plans.

## When to Use Reason
- Before writing a new chapter or scene
- When the user asks for a plan or outline
- When the story needs structural decisions
- Before generating dialogue rewrites, POV conversions, or pacing adjustments

## Available Reason Modes

| Mode | Output | Used For |
|------|--------|----------|
| `plot` | Scene sequence, cause/effect chain, subplot map | Story planning |
| `structure` | Act breakdown, pacing plan, architectural notes | Novel outlining |
| `character` | Character arcs, motivations, flaws, growth | Character design |
| `theme` | Theme map, thematic statement | Thematic planning |
| `conflict` | Conflict layers, escalation paths | Conflict design |
| `mystery` | Clue map, red herrings, reveal timeline | Mystery plotting |
| `foreshadowing` | Plant/payoff pairs, timing | Long-term setup |
| `genre` | Genre rules, reader promises, boundaries | Genre compliance |
| `series` | Cross-book arcs, series bible outline | Multi-book planning |
| `pov-conversion` | Knowledge boundaries, voice requirements | POV changes |
| `continuity` | Continuity gaps, fix recommendations | Error resolution |
| `pacing` | Pacing metrics, adjustment suggestions | Pacing fixes |
| `ending` | Open arcs, unresolved mysteries, readiness | Ending generation |
| `readiness` | Readiness score, gaps, checklist | Publishing prep |
| `publishing` | Blurb, synopsis, query letter | Publication materials |

## Output Format
Each reason module returns:
- `outputs[]`: Structured items with type, label, and detail
- `prompts[]`: What to feed the LLM for this mode
- `constraints[]`: What to enforce during generation
