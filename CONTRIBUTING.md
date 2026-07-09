# Contributing

## Getting Started

```bash
git clone https://github.com/Kathir-Kalidass/storia.git
cd storia
npm install
npm test
```

## Project Structure

```
lib/          SDK — public API, adapters, plugins, security, observability
runtime/      Core narrative intelligence engines
prompts/      LLM prompt templates
schemas/      JSON Schema definitions
personas/     49 narrative personas
workflows/    16 workflow configurations
capabilities/ 10 capability definitions
examples/     Runnable example applications
docs/         Architecture and specification documents
```

## Development

### Tests

```bash
npm test            # Run all tests (runtime + SDK)
npm run test:sdk    # SDK tests only
npm run test:runtime # Runtime tests only
```

### Adding a Backend

1. Create `lib/adapters/<name>.js` extending `BackendAdapter`
2. Implement `load`, `save`, `list`, `exists`, `delete`, `initialize`, `health`
3. Register with `registerBackend('<name>', YourBackend)`
4. Run the contract tests to verify compatibility

### Adding a Plugin

1. Create a plugin object with `name`, optional `hooks`, `personas`, `workflows`
2. Test with `storia.use(yourPlugin)`

## Pull Request Process

1. Ensure tests pass: `npm test`
2. Add tests for new functionality
3. Update docs if changing public API
4. Run `npm pack --dry-run` to verify package contents

## Code Style

- No semicolons (ASI)
- 2-space indentation
- JSDoc for all public APIs
- No comments in implementation code
- Tests before features

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
