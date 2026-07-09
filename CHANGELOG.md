# Changelog

## [0.1.0-alpha.1] — 2026-07-10

### Added
- SDK: Storia class with three-layer API (run, save, load, health, export, import)
- SDK: Error hierarchy (11 typed error classes)
- SDK: Backend adapters (Memory, Filesystem) with BackendAdapter interface
- SDK: Plugin system with PluginRegistry and lifecycle hooks
- SDK: CLI (init, run, doctor, export, import, list)
- SDK: Security module (input validation, path traversal, checksums, size limits)
- SDK: Structured Logger with levels, formats, context binding
- SDK: Telemetry system (events, counters, histograms, gauges, spans)
- SDK: Retry with exponential backoff and jitter
- SDK: .d.ts type declarations
- SDK: Contract test suite (Backend, Plugin, PersonaPack, WorkflowPack)
- Runtime: Orchestrator (16 intents, persona-aware routing)
- Runtime: State Manager (versioned, diff-based updates)
- Runtime: Synthesizer (multi-source merge, confidence scoring)
- Runtime: Validator (7 hard rules, 5 soft rules)
- Runtime: Diff Engine (character/plot/scene/world deltas)
- Runtime: Optimizer (context windows, cache, dedup)
- Runtime: Workflow Engine (markdown pipeline runner)
- Runtime: Persona Engine (5-role composition, priority, delta)
- Runtime: Narrative Intelligence Engine (15 Reason + 6 Guide + 8 Verify modules)
- Runtime: Prompt Engine (template loading/composition)
- Runtime: Schema Validator (15 JSON Schema files, zero-dependency)
- Personas: 68 personas across 12 categories
- Workflows: 16 narrative workflow configurations
- Prompts: 23 prompt templates
- Schemas: 15 canonical JSON schemas
- Examples: Minimal story generator, novel project (save/load/resume), Express API
- Documentation: README, GETTING_STARTED, CONTRIBUTING, SECURITY, CHANGELOG
- Repository: Issue templates, PR template, .github config

### Security
- Input validation on all public methods
- Path traversal prevention in filesystem backend
- SHA-256 state checksums with tamper detection
- 10 MB state size limit
- npm provenance configuration
- Zero runtime dependencies

### Quality
- sideEffects: false (tree-shaking ready)
- .d.ts type declarations packaged
- No circular dependencies
- ESM + CJS exports
- npm pack: 264 kB packed, 237 files

- npm pack: 392 kB packed (added extensions, CAPABILITIES, EXTENSIONS docs)

### Added (pre-release)
- Extensions directory with sample pack (manifest.json + SKILL.md)
- CAPABILITIES.md — machine-readable capability index for agent inspection
- EXTENSIONS.md — extension authoring guide with layout, manifests, contract tests
- SKILL.md: Input/Output contract section for explicit agent guidance
- Persona count corrected: 68 (was 49 in earlier docs)
- Version changed to 0.1.0-alpha.1 to reflect Alpha status

### Tests
- 162 runtime tests
- 117 SDK tests
- 42 contract tests
- 321 total, all passing
- 3 runnable examples verified
