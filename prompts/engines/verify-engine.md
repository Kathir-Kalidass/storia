# Verify Engine — Prompt Guidance

## Purpose
Quality and consistency checking after generation. Produces verification reports with issues, scores, and suggestions.

## When to Use Verify
- After every generation or edit
- Before committing state changes
- As part of the publication readiness check

## Available Verify Modes

| Mode | What It Checks |
|------|----------------|
| `continuity` | Character location conflicts, alive/dead consistency, timeline order |
| `plot-hole` | Logical contradictions, broken cause/effect, motivation gaps |
| `emotional-arc` | Emotional variety, flat stretches, intensity trends |
| `cognitive-load` | Active character count, subplot count, reader load score |
| `pacing` | Scene length, dialogue/action balance |
| `theme-resonance` | Are declared themes present in current state? |
| `prose-rhythm` | Sentence length variety, average length |
| `satisfaction` | Mysteries resolved, plot progress toward ending |

## Output Format
Each verify module returns:
- `checks[]`: Individual check results with name, label, passed status, and issues[]
- `score`: Overall quality score (0-1)
- `passed`: Boolean — did the module pass overall?
