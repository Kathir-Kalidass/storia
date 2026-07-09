# Storia

**Narrative Intelligence Platform** — AI-powered storytelling SDK and Agent Skill.

```js
import { Storia } from 'storia';

const storia = new Storia();
const result = await storia.run({ prompt: 'A detective mystery.' });
console.log(result.story);
```

## Features

- **One SDK, three layers** — `run()` for quick starts, full app SDK for production, low-level orchestrator access for framework authors
- **Pluggable backends** — Memory (default), Filesystem, bring your own via `BackendAdapter`
- **Plugin system** — Extend with persona packs, workflow packs, custom adapters via `storia.use()`
- **49 personas** across 12 categories — genre, style, literary, drama, character, plot, worldbuilding, cultural, reader, publishing, historical, innovation
- **16 narrative workflows** — start, continue, plan, build characters + worlds, review, fix continuity, generate endings, and more
- **CLI** — `npx storia init/run/doctor/export/import/list`
- **Security built in** — input validation, path traversal prevention, state checksums, zero npm dependencies
- **Observability** — structured logging, telemetry counters/histograms/spans, exponential backoff retry

## Quick Start

```bash
npm install storia
```

```js
import { Storia } from 'storia';

const storia = new Storia();
const result = await storia.run({ prompt: 'Start a fantasy story about dragons.' });
console.log(result.story);
```

See [GETTING_STARTED.md](GETTING_STARTED.md) for a full walkthrough.

## Documentation

| Doc | Description |
|-----|-------------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Install, first story, next steps |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and design |
| [docs/WORKFLOW_SPEC.md](docs/WORKFLOW_SPEC.md) | Workflow pipeline specification |
| [docs/PERSONA_SPEC.md](docs/PERSONA_SPEC.md) | Persona engine specification |
| [docs/ENGINE_SPEC.md](docs/ENGINE_SPEC.md) | Narrative intelligence engine spec |
| [docs/SCHEMA_SPEC.md](docs/SCHEMA_SPEC.md) | State schema specification |
| [SKILL.md](SKILL.md) | Agent Skill definition |

## Examples

- `examples/minimal-story-generator.js` — 10-line story generator
- `examples/novel-project.js` — save, load, resume a novel
- `examples/express-api.js` — Express.js API integration

## CLI

```bash
npx storia init          # Initialize a Storia project
npx storia run "prompt"  # Run a narrative prompt
npx storia doctor         # Health check
npx storia export <id>   # Export a story
npx storia import <file>  # Import a story
npx storia list           # List all stories
```

## API

```js
const storia = new Storia({ backend: 'filesystem' });

// Layer 1: High-level
const result = await storia.run('Create a character');
const result = await storia.run({ prompt: '...', metadata: { genre: ['fantasy'] } });

// Layer 2: App SDK
await storia.save(storyId);
const state = await storia.load(storyId);
const exported = await storia.export(storyId);
const id = await storia.import(data, 'story-new-id');
const health = await storia.health();

// Layer 3: Plugins
storia.use({ name: 'my-pack', hooks: { onBeforeRun: async (opts) => { ... } } });
```

## Errors

All operations throw typed errors:

```
StoriaError
  ├── ConfigError
  ├── StateError
  │   └── StateVersionError
  ├── ValidationError
  ├── BackendError
  │   ├── BackendNotFoundError
  │   └── RetryError
  ├── PluginError
  ├── EngineError
  │   ├── PipelineError
  │   └── PersonaError
  └── WorkflowError
```

## Requirements

- Node.js >= 18
- Zero npm dependencies

## License

MIT &copy; Kathir Kalidass
