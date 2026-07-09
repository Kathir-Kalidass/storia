/**
 * Storia Contract Tests
 *
 * These tests verify that adapters, plugins, personas, and workflows
 * conform to the Storia public API contract.
 *
 * Run: node test/contract.test.js
 *
 * Third-party extensions (e.g. @storia/sqlite, @storia/english-pack)
 * should run these same tests to verify compatibility.
 */

const assert = require('assert');

let passed = 0;
let failed = 0;
let queue = Promise.resolve();

function test(name, fn) {
  queue = queue.then(async () => {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (e) {
      failed++;
      console.log(`  ✗ ${name}: ${e.message}`);
    }
  });
}

// ─── Backend Contract Tests ─────────────────────────────────────────

/**
 * Run backend contract tests against any BackendAdapter instance.
 * @param {Object} backend — initialized backend instance
 * @param {string} label — display name for the backend
 */
function runBackendContract(backend, label) {
  const prefix = `[${label}]`;

  test(`${prefix} type is a non-empty string`, () => {
    assert.ok(typeof backend.type === 'string' && backend.type.length > 0);
  });

  test(`${prefix} initialize makes backend ready`, async () => {
    const b = backend;
    if (!await b.health()) {
      await b.initialize({});
    }
    assert.ok(await b.health());
  });

  test(`${prefix} health returns boolean`, async () => {
    const h = await backend.health();
    assert.strictEqual(typeof h, 'boolean');
  });

  test(`${prefix} save stores data`, async () => {
    await backend.save('story-contract-test', { title: 'Contract Test', value: 42 });
    const loaded = await backend.load('story-contract-test');
    assert.strictEqual(loaded.title, 'Contract Test');
    assert.strictEqual(loaded.value, 42);
  });

  test(`${prefix} load returns null for unknown story`, async () => {
    const loaded = await backend.load('story-nonexistent');
    assert.strictEqual(loaded, null);
  });

  test(`${prefix} exists returns true/false`, async () => {
    await backend.save('story-exists-test', { x: 1 });
    assert.ok(await backend.exists('story-exists-test'));
    assert.ok(!(await backend.exists('story-nonexistent')));
  });

  test(`${prefix} list returns all story IDs`, async () => {
    await backend.save('story-list-a', {});
    await backend.save('story-list-b', {});
    const list = await backend.list();
    assert.ok(list.includes('story-list-a'));
    assert.ok(list.includes('story-list-b'));
  });

  test(`${prefix} delete removes story`, async () => {
    await backend.save('story-delete-me', { data: 'to-delete' });
    assert.ok(await backend.exists('story-delete-me'));
    await backend.delete('story-delete-me');
    assert.ok(!(await backend.exists('story-delete-me')));
  });

  test(`${prefix} save/load round-trips with deep clone`, async () => {
    const original = { nested: { array: [1, 2, 3] }, date: '2026-01-01' };
    await backend.save('story-contract-deep', original);
    const loaded = await backend.load('story-contract-deep');
    assert.deepStrictEqual(loaded, original);
    // Verify mutation isolation
    loaded.nested.array.push(4);
    const reloaded = await backend.load('story-contract-deep');
    assert.strictEqual(reloaded.nested.array.length, 3);
  });

  test(`${prefix} save with different reasons does not affect data`, async () => {
    await backend.save('story-contract-reason', { msg: 'first' }, 'initial');
    await backend.save('story-contract-reason', { msg: 'second' }, 'update');
    const loaded = await backend.load('story-contract-reason');
    assert.strictEqual(loaded.msg, 'second');
  });
}

// ─── Plugin Contract Tests ──────────────────────────────────────────

function runPluginContract(plugin, label) {
  const prefix = `[${label}]`;

  test(`${prefix} has a non-empty name`, () => {
    assert.ok(typeof plugin.name === 'string' && plugin.name.length > 0);
  });

  test(`${prefix} version is string if present`, () => {
    if (plugin.version !== undefined) {
      assert.strictEqual(typeof plugin.version, 'string');
    }
  });

  test(`${prefix} hooks are functions if present`, () => {
    if (plugin.hooks) {
      const validHooks = ['onBeforeInit', 'onAfterInit', 'onBeforeRun', 'onAfterRun', 'onError', 'onShutdown'];
      for (const hook of validHooks) {
        if (plugin.hooks[hook] !== undefined) {
          assert.strictEqual(typeof plugin.hooks[hook], 'function', `hook ${hook} must be a function`);
        }
      }
    }
  });

  test(`${prefix} personas pack has valid shape if present`, () => {
    if (plugin.personas) {
      assert.ok(typeof plugin.personas.name === 'string');
      assert.ok(Array.isArray(plugin.personas.personas));
      for (const p of plugin.personas.personas) {
        assert.ok(typeof p.id === 'string');
        assert.ok(p.config !== undefined);
      }
    }
  });

  test(`${prefix} workflows pack has valid shape if present`, () => {
    if (plugin.workflows) {
      assert.ok(typeof plugin.workflows.name === 'string');
      assert.ok(Array.isArray(plugin.workflows.workflows));
    }
  });

  test(`${prefix} backend extends BackendAdapter if present`, () => {
    if (plugin.backend) {
      const { BackendAdapter } = require('../lib/adapters/base');
      assert.ok(plugin.backend.prototype instanceof BackendAdapter);
    }
  });
}

// ─── Workflow Pack Contract Tests ───────────────────────────────────

function runWorkflowPackContract(pack, label) {
  const prefix = `[${label}]`;

  test(`${prefix} has a non-empty name`, () => {
    assert.ok(typeof pack.name === 'string' && pack.name.length > 0);
  });

  test(`${prefix} has version string`, () => {
    assert.strictEqual(typeof pack.version, 'string');
  });

  test(`${prefix} has non-empty workflows array`, () => {
    assert.ok(Array.isArray(pack.workflows));
    assert.ok(pack.workflows.length > 0);
  });

  for (let i = 0; i < Math.min(pack.workflows.length, 3); i++) {
    const wf = pack.workflows[i];
    test(`${prefix} workflow ${i} has valid id`, () => {
      assert.ok(typeof wf.id === 'string' && wf.id.length > 0);
    });
  }
}

// ─── Persona Pack Contract Tests ────────────────────────────────────

function runPersonaPackContract(pack, label) {
  const prefix = `[${label}]`;

  test(`${prefix} has a non-empty name`, () => {
    assert.ok(typeof pack.name === 'string' && pack.name.length > 0);
  });

  test(`${prefix} has version string`, () => {
    if (pack.version !== undefined) {
      assert.strictEqual(typeof pack.version, 'string');
    }
  });

  test(`${prefix} has non-empty personas array`, () => {
    assert.ok(Array.isArray(pack.personas));
    assert.ok(pack.personas.length > 0);
  });

  for (let i = 0; i < Math.min(pack.personas.length, 3); i++) {
    const p = pack.personas[i];
    test(`${prefix} persona ${i} has valid id and config`, () => {
      assert.ok(typeof p.id === 'string' && p.id.length > 0);
      assert.ok(p.config !== null && p.config !== undefined);
    });
  }
}

// ─── Run Built-in Backend Contracts ─────────────────────────────────

async function runBuiltinContracts() {
  console.log('\nBackend Contract — Memory');
  const backends = require('../lib/adapters/backend');
  const mem = backends.createBackend('memory', {});
  await mem.initialize({});
  runBackendContract(mem, 'Memory');

  console.log('\nBackend Contract — Filesystem');
  const path = require('path');
  const fs = require('fs');
  const os = require('os');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storia-contract-'));
  const fsb = backends.createBackend('filesystem', { storiaDir: tmpDir });
  await fsb.initialize({ storiaDir: tmpDir });
  runBackendContract(fsb, 'Filesystem');

  await queue;
  // Cleanup: delete contract test stories from filesystem
  const stories = await fsb.list();
  for (const s of stories.filter(x => x.startsWith('story-contract'))) {
    try { await fsb.delete(s); } catch {}
  }
  fs.rmSync(tmpDir, { recursive: true });

  // ── Run Plugin Contract on Built-in Examples ──────────────────────

  console.log('\nPlugin Contract');
  const pluginA = {
    name: 'example-plugin',
    version: '1.0.0',
    hooks: {
      onBeforeRun: async (opts) => { /* noop */ },
      onAfterRun: async (result) => { /* noop */ }
    }
  };
  runPluginContract(pluginA, 'example-plugin');

  const pluginB = {
    name: 'minimal-plugin'
  };
  runPluginContract(pluginB, 'minimal-plugin');

  // ── Run Persona Pack Contract ────────────────────────────────────

  console.log('\nPersona Pack Contract');
  const personaPack = {
    name: 'test-pack',
    version: '1.0.0',
    personas: [
      { id: 'test-persona-1', config: { tone: 'dark' } },
      { id: 'test-persona-2', config: { tone: 'light' } }
    ]
  };
  runPersonaPackContract(personaPack, 'test-pack');

  // ── Run Workflow Pack Contract ───────────────────────────────────

  console.log('\nWorkflow Pack Contract');
  const workflowPack = {
    name: 'test-workflows',
    version: '1.0.0',
    workflows: [
      { id: 'W001', config: { steps: [] } },
      { id: 'W002', config: { steps: [] } }
    ]
  };
  runWorkflowPackContract(workflowPack, 'test-workflows');
}

// ─── Run All ─────────────────────────────────────────────────────────

(async () => {
  console.log('Storia Contract Test Suite');
  console.log('==========================');

  await runBuiltinContracts();

  await queue;

  console.log(`\n${'='.repeat(24)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
