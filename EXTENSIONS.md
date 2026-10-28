# Storia Extensions

Extensions add personas, workflows, prompts, capabilities, schemas, and validation rules to Storia. This document explains how they work.

## Discovery

Extensions are discovered from two sources:

1. **Local directory** — the `extensions/` directory in a Storia project
2. **npm packages** — packages published under the `@storia/` scope (e.g., `@storia/fantasy-pack`)

At startup, Storia scans both locations and merges all discovered assets into the runtime registry.

## Directory Layout

Every extension must have this structure:

```
{extension-name}/
  manifest.json       # Required — version, dependencies, metadata
  SKILL.md            # Required — agent-readable description
  personas/           # Optional — same format as root personas/
  workflows/          # Optional — same format as root workflows/
  prompts/            # Optional — same format as root prompts/
  capabilities/       # Optional — same format as root capabilities/
  schemas/            # Optional — additional JSON Schema files
```

## The Manifest

Every extension requires a `manifest.json` at its root:

```json
{
  "name": "@storia/my-pack",
  "version": "0.1.0",
  "description": "What this extension provides",
  "storia": "^0.1.0",
  "personas": 5,
  "workflows": 2,
  "provides": ["fantasy-personas", "quest-workflow"],
  "requires": ["storia-core@>=0.1.0"]
}
```

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Unique extension name |
| `version` | Yes | Semver version |
| `description` | Yes | Short description |
| `storia` | Yes | Compatible Storia version range |
| `personas` | No | Number of personas provided |
| `workflows` | No | Number of workflows provided |
| `provides` | No | Capability identifiers |
| `requires` | No | Dependencies on other extensions or Storia core |

## Persona Merging

Extension personas follow the same conventions as built-in personas:

- `personas/{category}/{name}/SKILL.md` — agent-readable
- `personas/{category}/{name}/config.json` — machine-readable

If an extension defines a persona with the same name as a built-in persona, the extension's version takes precedence for that session.

## Workflow Merging

Extension workflows follow the same conventions:

- `workflows/SKILL.md` — workflow catalog
- `workflows/configs/{workflow-id}.json` — workflow configuration

Workflow IDs should use the range W100–W999 to avoid collision with built-in workflows (W001–W016).

## Version Compatibility

The `storia` field in `manifest.json` uses semver ranges. Storia checks this at load time and rejects incompatible extensions with a clear error.

## Contract Tests

Extensions can (and should) run the same contract test suite as built-in components:

```js
const { BackendContract, PluginContract, PersonaPackContract, WorkflowPackContract } = require('@kkdass/storia/test/contract');

describe('My Extension', () => {
  PersonaPackContract('my-pack', './extensions/my-pack/personas');
  WorkflowPackContract('my-pack', './extensions/my-pack/workflows');
});
```

See `test/contract.test.js` for the full contract definitions.

## See Also

- `extensions/README.md` — quick-start overview
- `extensions/sample-pack/` — minimal working example
- `test/contract.test.js` — contract test suite
