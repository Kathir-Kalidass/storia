# Extensions

Extensions allow Storia to be extended with additional personas, workflows, prompts, capabilities, and validation rules — without modifying the core skill.

## Layout

```
extensions/
  {extension-name}/
    SKILL.md        # Agent-readable description of the extension
    manifest.json   # Machine-readable extension manifest
    personas/       # Additional personas (optional, same format as root personas/)
    workflows/      # Additional workflows (optional)
    prompts/        # Additional prompt templates (optional)
    capabilities/   # Additional capability definitions (optional)
    schemas/        # Additional JSON Schemas (optional)
```

## Example

See `extensions/sample-pack/` for a minimal working example.

## Publishing

Extensions are distributed as npm packages under the `@storia/` scope:

- `@storia/fantasy-pack`
- `@storia/romance-pack`
- `@storia/english-pack`

Install into a Storia project:

```
npx historia install @storia/fantasy-pack
```

## See Also

- `EXTENSIONS.md` — full extension authoring guide
- `test/contract.test.js` — contract tests for extensions
