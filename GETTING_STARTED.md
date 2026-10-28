# Getting Started

## Installation

```bash
npm install @kkdass/storia
```

## Your First Story

Create a file `story.js`:

```js
import { Storia } from '@kkdass/storia';

const storia = new Storia();

async function main() {
  const result = await storia.run({
    prompt: 'Start a mystery story set in Victorian London.'
  });

  console.log('Story ID:', result.storyId);
  console.log('Intent:', result.intent.intent);
  console.log('State:', JSON.stringify(result.story, null, 2));
}

main().catch(console.error);
```

Run:

```bash
node story.js
```

## Save and Resume

```js
const storia = new Storia({ backend: 'filesystem' });

// Create
const { storyId } = await storia.run({ prompt: 'Start a fantasy novel.' });

// Continue later
const state = await storia.load(storyId);
const next = await storia.run({
  prompt: 'Introduce the main antagonist.',
  storyId
});
```

## Use a Persona

```js
const result = await storia.run({
  prompt: 'Write a battle scene.',
  personas: { style: 'cinematic', primary: 'fantasy-writer' }
});
```

## Next Steps

- [Examples](examples/) — runnable scripts to learn by doing
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how Storia works
- [README.md](README.md) — full API reference
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to contribute
