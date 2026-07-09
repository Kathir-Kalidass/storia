// Storia — Web Novel Demo
// Run: node examples/web-novel-demo.js
// Demonstrates Storia's full orchestration pipeline end-to-end.

const path = require('path');
const fs = require('fs');
const StoriaOrchestrator = require('../runtime/orchestrator');

const DEMO_DIR = fs.mkdtempSync(path.join(require('os').tmpdir(), 'storia-demo-'));

async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  Storia — Narrative Intelligence Demo');
  console.log('══════════════════════════════════════════\n');

  // ── 1. Initialize ────────────────────────────────
  console.log('▸ Initializing orchestrator...');
  const storia = new StoriaOrchestrator({ storiaDir: DEMO_DIR });
  await storia.initialize();
  console.log(`  ✓ All engines loaded (stateDir: ${DEMO_DIR})\n`);

  // ── 2. Detect intents ──────────────────────────────
  console.log('▸ Intent detection:');
  const requests = [
    'start a new story with Storia',
    'create a character named Elena',
    'worldbuild for my story',
    'continue the story from chapter 2',
    'fix pacing in this chapter',
    'prepare for publishing',
    'what is the meaning of life'
  ];

  for (const req of requests) {
    const intent = storia.detectIntent(req);
    const status = intent.confidence >= 0.5
      ? `→ ${intent.intent} (${intent.workflow}, ${Math.round(intent.confidence * 100)}%)`
      : `→ unrecognized (${Math.round(intent.confidence * 100)}%)`;
    console.log(`  "${req.slice(0, 45) + (req.length > 45 ? '...' : '')}"`);
    console.log(`    ${status}`);
  }
  console.log();

  // ── 3. Create a story ──────────────────────────────
  console.log('▸ Creating story:');
  const storyId = await storia.createStory(
    'The Stars Are Wounds',
    ['fantasy', 'dark fantasy'],
    'en',
    {
      tone: 'somber',
      pov: 'third-limited',
      style: 'literary',
      themes: ['knowledge vs safety', 'truth and heresy'],
      personas: { primary: 'fantasy-writer', secondary: 'novelist', style: 'poetic' }
    }
  );
  console.log(`  ✓ Story created: ${storyId}\n`);

  // ── 4. Load the active state ───────────────────────
  console.log('▸ Initial story state:');
  const active = await storia.stateManager.load(storyId);
  console.log(`  Title:       ${active.metadata.title}`);
  console.log(`  Genre:       ${active.metadata.genre.join(', ')}`);
  console.log(`  Status:      ${active.metadata.status}`);
  console.log(`  Personas:    ${Object.values(active.metadata.active_personas).filter(Boolean).join(' → ')}`);
  console.log(`  Chapters:    ${active.metadata.current_chapter} / ${active.metadata.total_chapters}`);
  console.log();

  // ── 5. Process a workflow ─────────────────────────
  console.log('▸ Processing workflow request:');
  const result = await storia.process('worldbuild for my story', storyId);
  console.log(`  Intent:      ${result.intent.intent}`);
  console.log(`  Workflow:    ${result.workflow.id}`);
  console.log(`  Steps:       ${result.workflow.steps.length} pipeline steps`);
  for (const step of result.workflow.steps) {
    const icon = step.status === 'completed' ? '✓' : step.status === 'skipped' ? '⊘' : '✗';
    console.log(`    ${icon} ${step.engine} → ${step.method || '?'} (${step.status})`);
  }
  if (result.workflow.rolled_back) console.log(`  ⚠ Rolled back`);
  if (result.workflow.warnings && result.workflow.warnings.length) {
    for (const w of result.workflow.warnings) console.log(`  ⚠ Warning: ${w}`);
  }
  console.log();

  // ── 6. Validation ──────────────────────────────────
  console.log('▸ Validating story state:');
  const activeState = await storia.stateManager.load(storyId);
  const validation = storia.schemaValidator.validateActiveState(activeState);
  console.log(`  State valid: ${validation.valid}`);
  if (!validation.valid) {
    for (const e of validation.errors.slice(0, 5)) {
      console.log(`  ⚠ ${e}`);
    }
  }
  console.log();

  // ── 7. Persona composition ─────────────────────────
  console.log('▸ Persona composition:');
  const personas = storia.personaEngine.listPersonas();
  const personaResult = storia.personaEngine.resolve(
    { primary: 'fantasy-writer', secondary: 'novelist', style: 'poetic' }
  );
  console.log(`  Available:   ${personas.length} personas`);
  console.log(`  Composed:    ${personaResult.persona_ids.join(' + ')}`);
  console.log(`  Tone:        formality=${personaResult.composed.tone.formality}, darkness=${personaResult.composed.tone.darkness}`);
  const vf = personaResult.composed.verification_focus || {};
  console.log(`  Priority checks: ${(vf.priority_checks || []).slice(0, 3).join(', ')}...`);
  console.log();

  // ── 8. Prompt composition ─────────────────────────
  console.log('▸ Prompt template composition:');
  const composed = storia.promptEngine.composeWorkflowPrompt('W005', {}, { engine: 'verify-engine' });
  const sections = composed.split('---').length;
  console.log(`  W005 prompt: ${composed.length} chars, ${sections} sections`);
  console.log();

  // ── 9. Optimizer report ──────────────────────────
  console.log('▸ Optimizer (compact context):');
  const latestState = await storia.stateManager.load(storyId);
  const compacted = storia.optimizer.compactContext(latestState, 500);
  const saved = JSON.stringify(latestState).length - JSON.stringify(compacted).length;
  console.log(`  Size saved: ${saved} bytes`);
  console.log();

  // ── Summary ──────────────────────────────────────
  console.log('══════════════════════════════════════════');
  console.log('  Demo Complete');
  console.log('══════════════════════════════════════════');

  // Cleanup
  fs.rmSync(DEMO_DIR, { recursive: true });
}

main().catch(err => {
  console.error('Demo failed:', err);
  process.exit(1);
});
