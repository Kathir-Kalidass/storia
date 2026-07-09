// Storia — Novel Project (save/load/resume)
// Run: node examples/novel-project.js
//
// Demonstrates persistent story management with the filesystem backend.
// Creates a novel, saves it, loads it back, and continues the narrative.

const path = require('path');
const fs = require('fs');
const os = require('os');
const { Storia } = require('../lib');

const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'storia-novel-'));

async function main() {
  console.log('=== Storia Novel Project ===\n');

  // Initialize with filesystem backend for persistence
  const storia = new Storia({
    backend: 'filesystem',
    storiaDir: path.join(TMP_DIR, '.storia')
  });

  // Step 1: Start a new novel
  console.log('1. Starting a new fantasy novel...');
  const chapter1 = await storia.run({
    prompt: 'Start a fantasy novel about a librarian who discovers a hidden world between books.',
    metadata: { title: 'The Library Between Worlds', genre: ['fantasy', 'adventure'] }
  });
  console.log(`   Story ID: ${chapter1.storyId}`);
  console.log(`   Status: ${chapter1.story?.metadata?.status}\n`);

  // Step 2: Save explicitly
  console.log('2. Saving story state...');
  await storia.save(chapter1.storyId);
  console.log('   Saved.\n');

  // Step 3: Simulate a new session — create a fresh Storia instance
  console.log('3. Starting a new session and loading the novel...');
  const storia2 = new Storia({
    backend: 'filesystem',
    storiaDir: path.join(TMP_DIR, '.storia')
  });
  const loaded = await storia2.load(chapter1.storyId);
  console.log(`   Loaded: "${loaded.metadata.title}"`);
  console.log(`   Chapters: ${loaded.metadata.current_chapter}\n`);

  // Step 4: Continue the story (resume)
  console.log('4. Continuing the story...');
  const chapter2 = await storia2.run({
    prompt: 'The librarian finds the first hidden book and steps through the portal.',
    storyId: chapter1.storyId
  });
  console.log(`   Continued: intent=${chapter2.intent.intent}\n`);

  // Step 5: Export
  console.log('5. Exporting story...');
  const exported = await storia2.export(chapter1.storyId);
  console.log(`   Exported: ${exported.story.metadata.title} (v${exported.story.metadata.schema_version})\n`);

  // Step 6: Health report
  const health = await storia2.health();
  console.log('6. Health:');
  console.log(`   Status: ${health.status}`);
  console.log(`   Backend: ${health.backend.type}`);
  console.log(`   Runs: ${health.metrics.runs}`);
  console.log(`   Saves: ${health.metrics.saves}\n`);

  console.log('=== Done ===');

  // Cleanup
  fs.rmSync(TMP_DIR, { recursive: true });
}

main().catch(err => {
  console.error('Novel demo failed:', err);
  process.exit(1);
});
