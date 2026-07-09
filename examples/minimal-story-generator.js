// Storia — Minimal Story Generator
// Run: node examples/minimal-story-generator.js
//
// The simplest possible Storia usage in ~10 lines.

const { Storia } = require('../lib');

async function main() {
  const storia = new Storia();
  const result = await storia.run({ prompt: 'Start a fantasy story about a dragon.' });
  console.log(`Story: ${result.storyId}`);
  console.log(`Intent: ${result.intent.intent}`);
  console.log(`Success: ${result.success}`);
  console.log(`Duration: ${result.durationMs}ms`);

  if (result.story) {
    console.log(`Title: ${result.story.metadata?.title}`);
    console.log(`Genre: ${result.story.metadata?.genre?.join(', ')}`);
  }
}

main().catch(console.error);
