#!/usr/bin/env node

/**
 * Storia CLI — thin wrapper over the SDK.
 *
 * Usage:
 *   npx storia init          — initialize a new story
 *   npx storia run <prompt>  — run a narrative prompt
 *   npx storia doctor        — health check
 *   npx storia export <id>   — export a story
 *   npx storia import <file> — import a story
 *   npx storia list          — list all stories
 */

const path = require('path');
const fs = require('fs');
const Storia = require('./storia');

const COMMANDS = ['init', 'run', 'doctor', 'export', 'import', 'list'];

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'doctor';

  if (!COMMANDS.includes(command)) {
    console.error(`Unknown command: ${command}`);
    console.error(`Usage: npx storia <${COMMANDS.join('|')}> [args]`);
    process.exit(1);
  }

  try {
    await run(command, args.slice(1));
  } catch (err) {
    console.error(`\n  ✗ ${err.message}`);
    if (process.env.STORIA_DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

async function run(command, args) {
  switch (command) {
    case 'init': {
      const title = args.join(' ') || 'Untitled Story';
      const storia = new Storia({ backend: 'filesystem' });
      console.log(`\n  ◷ Initializing "${title}"...`);
      const result = await storia.run({ prompt: `start a new story titled ${title}`, metadata: { title } });
      if (result.success) {
        console.log(`  ✓ Story created: ${result.storyId}`);
        console.log(`  ◇ Run: npx storia run "continue the story" --story ${result.storyId}`);
      } else {
        console.log(`  ⚠ ${result.error}`);
      }
      break;
    }

    case 'run': {
      const prompt = args.join(' ');
      if (!prompt) {
        console.error('  ✗ Usage: npx storia run <prompt>');
        process.exit(1);
      }
      const storia = new Storia({ backend: 'filesystem' });
      console.log(`\n  ◷ Processing: "${prompt.slice(0, 60)}..."`);
      const result = await storia.run({ prompt });
      if (result.success) {
        console.log(`  ✓ Intent detected: ${result.intent.intent}`);
        console.log(`  ✓ Workflow: ${result.workflow?.id || 'none'}`);
        console.log(`  ✓ Story ID: ${result.storyId}`);
        console.log(`  ◇ Duration: ${result.durationMs}ms`);
      } else {
        console.log(`  ⚠ ${result.error}`);
      }
      break;
    }

    case 'doctor': {
      const storia = new Storia({ backend: 'filesystem' });
      const report = await storia.health();
      const icon = report.status === 'ok' ? '✓' : report.status === 'degraded' ? '⚠' : '✗';
      console.log(`\n  ${icon} Storia v${report.version} — ${report.status}`);
      console.log(`  ─────────────────────────────`);
      console.log(`  Engine:     ${report.engines.orchestrator ? '✓' : '✗'}`);
      console.log(`  Validator:  ${report.engines.validator ? '✓' : '✗'}`);
      console.log(`  Backend:    ${report.backend.type} (${report.backend.ready ? '✓' : '✗'})`);
      console.log(`  Plugins:    ${report.plugins.length} registered`);
      console.log(`  Runs:       ${report.metrics.runs}`);
      console.log(`  Uptime:     ${report.uptime}`);
      break;
    }

    case 'export': {
      const storyId = args[0];
      if (!storyId) {
        console.error('  ✗ Usage: npx storia export <story-id>');
        process.exit(1);
      }
      const storia = new Storia({ backend: 'filesystem' });
      const data = await storia.export(storyId);
      const outFile = `${storyId}-export.json`;
      fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
      console.log(`\n  ✓ Exported to ${outFile}`);
      break;
    }

    case 'import': {
      const filePath = args[0];
      if (!filePath || !fs.existsSync(filePath)) {
        console.error(`  ✗ File not found: ${filePath}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      const storia = new Storia({ backend: 'filesystem' });
      const storyId = await storia.import(data);
      console.log(`\n  ✓ Imported as ${storyId}`);
      break;
    }

    case 'list': {
      const storia = new Storia({ backend: 'filesystem' });
      await storia.health(); // triggers init
      const { listBackends, createBackend } = require('./adapters/base');
      const stories = await backend.list();
      if (stories.length === 0) {
        console.log('\n  No stories found.');
        console.log('  Run: npx storia init "My Story"');
      } else {
        console.log(`\n  Stories (${stories.length}):`);
        for (const id of stories) {
          console.log(`  ◇ ${id}`);
        }
      }
      break;
    }
  }
}

// Allow running directly
if (require.main === module) {
  main();
}

module.exports = { main, run };
