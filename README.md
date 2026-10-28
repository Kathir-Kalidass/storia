# Storia

**Narrative Intelligence Agent Skill** — AI-powered storytelling for any compatible LLM agent.

```
npx skills add Kathir-Kalidass/storia
```

Then ask your agent:

> Use the Storia skill to plan a mystery novel.

No SDK code required. The agent reads [SKILL.md](SKILL.md), discovers 49 personas across 12 categories, 16 narrative workflows, and orchestrates them through a structured runtime.

## For Agent Users

| Resource | Purpose |
|----------|---------|
| [SKILL.md](SKILL.md) | Entry point — what Storia does and how the agent uses it |
| [personas/](personas/) | 49 narrative personas (genre, style, literary, drama, character, plot, worldbuilding, cultural, reader, publishing, historical, innovation) |
| [workflows/](workflows/) | 16 workflow configurations (start, continue, plan, build characters + worlds, review, fix continuity, generate endings, and more) |
| [prompts/](prompts/) | 23 LLM prompt templates for system, engines, workflows, and personas |
| [schemas/](schemas/) | 15 JSON Schema files for state validation |

## For JavaScript Developers

Storia also ships as an npm package for programmatic use.

```bash
npm install @kkdass/storia
```

```js
import { Storia } from '@kkdass/storia';

const storia = new Storia();
const result = await storia.run({ prompt: 'Start a fantasy story.' });
console.log(result.story);
```

### CLI

```bash
npx storia init "The Lost Kingdom"
npx storia run "create a mysterious character"
npx storia doctor
npx storia list
```

### SDK

- `Storia` class — `run()`, `save()`, `load()`, `health()`, `export()`, `import()`, `use()`
- Pluggable backends (Memory, Filesystem, custom via `BackendAdapter`)
- Plugin system with lifecycle hooks
- Security: input validation, path traversal prevention, state checksums
- Observability: structured logging, telemetry, retry with backoff
- Zero dependencies

See [GETTING_STARTED.md](GETTING_STARTED.md) for a full walkthrough.

## Examples

- `examples/minimal-story-generator.js` — 10-line story generator
- `examples/novel-project.js` — save, load, resume a novel
- `examples/express-api.js` — Express.js API integration

## Requirements

- Node.js >= 18
- Zero npm dependencies

## License

MIT &copy; Kathir Kalidass
