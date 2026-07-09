# Synthesizer Engine — Prompt Guidance

## Purpose
Extract structured state changes from generated narrative text with confidence scoring.

## How Synthesis Works
1. Raw narrative text is scanned by extractors (character, location, knowledge, timeline, emotion, relationship, physical)
2. Each extracted fact gets a confidence score
3. High-confidence facts (≥0.95) are auto-committed to state
4. Medium-confidence facts (0.70-0.94) are flagged for review
5. Low-confidence facts (<0.70) are rejected

## Extraction Types

| Extractor | What It Extracts |
|-----------|-----------------|
| Character | Location changes, emotional states |
| Knowledge | Facts learned, discovered, or revealed |
| Location | Movement between locations |
| Timeline | Time passage, season changes |
| Emotion | Character emotional reactions |
| Relationship | Sentiment changes between characters |
| Physical | Injuries, item acquisition |

## Integration
Synthesis runs after every generation. The output is a state diff that goes through validation before being committed.
