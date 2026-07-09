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
const HELP_FLAGS = ['--help', '-h', 'help'];

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'doctor';

  if (HELP_FLAGS.includes(command) || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (!COMMANDS.includes(command)) {
    console.error(`Unknown command: ${command}`);
    showHelp();
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
      const stories = await storia._backend.list();
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

function showHelp() {
  console.log(`
  Storia — Narrative Intelligence Agent Skill

  USAGE

    npx storia <command> [args]

  COMMANDS

    init [title]     Start a new story
    run <prompt>     Process a narrative request
    doctor           Health check
    export <id>      Export a story
    import <file>    Import a story
    list             List all stories

  EXAMPLES

    npx storia init "The Lost Kingdom"
    npx storia run "create a mysterious character"
    npx storia doctor
    npx storia list

  AGENT USAGE

    Add this skill to your agent:
      npx skills add Kathir-Kalidass/storia

    Then ask the agent:
      "Use the Storia skill to plan a mystery novel."
`);
}

// Allow running directly
if (require.main === module) {
  main();
}

module.exports = { main, run, showHelp };
