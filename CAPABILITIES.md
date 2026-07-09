---
name: storia
version: 0.1.0-alpha.1
type: narrative-intelligence
---

# Storia Capability Manifest

## Overview

| Property | Value |
|---|---|
| Skill | Storia — Narrative Intelligence Agent Skill |
| Version | 0.1.0-alpha.1 |
| Type | narrative-intelligence |
| Install | `npx skills add Kathir-Kalidass/storia` |
| LLM Agnostic | true |
| Language Independent | true |

## Capabilities

| Capability | Workflows | Description |
|---|---|---|
| story-planning | novel, screenplay, short-story | Architecture, plot structure, theme planning, genre rules |
| chapter-writing | all | Guided generation with character/world/timeline constraints |
| dialogue | all | Voice lock, subtext analysis, attribution variety |
| worldbuilding | fantasy, sci-fi, historical | Geography, politics, magic, religion, technology, culture |
| timeline | novel, screenplay | Chronology, temporal manager, time skips, parallel timelines |
| continuity | all | Character state, knowledge boundaries, physical state, plot holes |
| character-design | all | Psychology, backstory, voice, relationships, arcs |
| historical-research | historical | Period accuracy, cultural authenticity, anachronism detection |
| editing | all | Developmental, line, copy editing, proofreading |
| publishing | all | Market review, blurb, query letter, publishing readiness |

## Memory

| Feature | Supported |
|---|---|
| Persistent | true |
| Compression | true |
| Active State | <100 KB |
| Archive State | unlimited (filesystem) |
| Backend | filesystem, memory, plugin-provided |
| Multilingual | true |

## Personas

| Property | Value |
|---|---|
| Total | 68 |
| Categories | 12 |
| Composition | Primary + Secondary + Style + Language + Audience |
| Format | SKILL.md (agent-readable) + config.json (machine-readable) |
| Categories | literary, genre, character, cultural, historical, drama, worldbuilding, plot, style, publishing, reader, innovation |

## Workflows

| Property | Value |
|---|---|
| Total | 16 |
| IDs | W001–W016 |
| Lifecycle | Start → Plan → Draft → Edit → Publish |

## Verification

| Feature | Supported |
|---|---|
| Confidence Scoring | true |
| Quality Checks | continuity, pacing, dialogue, character-consistency, plot-holes |
| Schema Validation | true (JSON Schema) |
| State Validation | true (size limits, checksums, path traversal) |

## Plugins

| Feature | Supported |
|---|---|
| Plugin API | true (PluginRegistry) |
| Hook Points | onBeforeInit, onAfterInit, onBeforeRun, onAfterRun |
| Extension Points | personas, workflows, backends, telemetry |
| Extension Discovery | filesystem (extensions/), npm (@storia/*) |

## Security

| Feature | Supported |
|---|---|
| Input Validation | story IDs, prompts, configs, run options |
| Path Traversal Prevention | true |
| Checksums | SHA-256 (save/verify on load) |
| State Size Limits | 10 MB max |
| Plugin Name Validation | true |

## Observability

| Feature | Supported |
|---|---|
| Logging | structured, levels (trace–silent), JSON/pretty, child contexts |
| Telemetry | events, counters, histograms, spans, gauges, observer pattern |
| Retry | exponential backoff with jitter (3 retries, 100ms base, 5s max) |
| Health Reports | engine status, telemetry snapshot, logger level |

## Distribution

| Property | Value |
|---|---|
| npm Package | storia |
| License | Apache-2.0 |
| Node Minimum | >=18 |
| Dependencies | zero |
| Published Assets | SKILL.md, personas/, workflows/, prompts/, capabilities/, schemas/, lib/, runtime/, docs/, extensions/ |
