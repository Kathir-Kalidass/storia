/**
 * Storia SDK Tests
 * Run: node lib/sdk.test.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

// ─── Error Hierarchy ─────────────────────────────────────────────────

function testErrors() {
  console.log('\nError Hierarchy');

  const E = require('./errors');

  test('StoriaError has correct name', () => {
    const e = new E.StoriaError('test');
    assert.strictEqual(e.name, 'StoriaError');
    assert.strictEqual(e.code, 'ERR_STORIA_UNKNOWN');
  });

  test('ConfigError is instanceof StoriaError', () => {
    const e = new E.ConfigError('bad config');
    assert.ok(e instanceof E.StoriaError);
    assert.strictEqual(e.code, 'ERR_STORIA_CONFIG');
  });

  test('StateVersionError stores expected/actual', () => {
    const e = new E.StateVersionError('1.0.0', '2.0.0');
    assert.ok(e instanceof E.StateError);
    assert.strictEqual(e.details.expected, '1.0.0');
    assert.strictEqual(e.details.actual, '2.0.0');
  });

  test('BackendNotFoundError includes backend name', () => {
    const e = new E.BackendNotFoundError('postgres');
    assert.strictEqual(e.details.name, 'postgres');
  });

  test('PluginError has correct code', () => {
    const e = new E.PluginError('failed');
    assert.strictEqual(e.code, 'ERR_STORIA_PLUGIN');
  });

  test('PipelineError is instance of EngineError', () => {
    const e = new E.PipelineError('pipeline failed');
    assert.ok(e instanceof E.EngineError);
  });

  test('toJSON returns serializable shape', () => {
    const e = new E.ValidationError('invalid', { details: { field: 'name' } });
    const json = e.toJSON();
    assert.strictEqual(json.name, 'ValidationError');
    assert.strictEqual(json.details.field, 'name');
  });
}

// ─── Backend Adapters ────────────────────────────────────────────────

function testBackends() {
  console.log('\nBackend Adapters');

  test('MemoryBackend save and load round-trips', async () => {
    const { createBackend } = require('./adapters/base');
    const b = createBackend('memory', {});
    await b.initialize({});
    await b.save('test-1', { title: 'Test', count: 42 });
    const loaded = await b.load('test-1');
    assert.strictEqual(loaded.title, 'Test');
    assert.strictEqual(loaded.count, 42);
  });

  test('MemoryBackend returns null for unknown story', async () => {
    const { createBackend } = require('./adapters/base');
    const b = createBackend('memory', {});
    await b.initialize({});
    const loaded = await b.load('nonexistent');
    assert.strictEqual(loaded, null);
  });

  test('MemoryBackend exists works', async () => {
    const { createBackend } = require('./adapters/base');
    const b = createBackend('memory', {});
    await b.initialize({});
    await b.save('ex-1', { title: 'X' });
    assert.ok(await b.exists('ex-1'));
    assert.ok(!(await b.exists('ex-2')));
  });

  test('MemoryBackend list returns all story IDs', async () => {
    const { createBackend } = require('./adapters/base');
    const b = createBackend('memory', {});
    await b.initialize({});
    await b.save('a', { title: 'A' });
    await b.save('b', { title: 'B' });
    const list = await b.list();
    assert.ok(list.includes('a'));
    assert.ok(list.includes('b'));
  });

  test('MemoryBackend list returns registered stories', async () => {
    const { createBackend } = require('./adapters/base');
    const b = createBackend('memory', {});
    await b.initialize({});
    const list = await b.list();
    assert.ok(Array.isArray(list));
  });

  test('MemoryBackend health returns true after init', async () => {
    const { createBackend } = require('./adapters/base');
    const b = createBackend('memory', {});
    await b.initialize({});
    assert.ok(await b.health());
  });

  test('FilesystemBackend save and load round-trips', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storia-sdk-'));
    const { createBackend } = require('./adapters/base');
    const b = createBackend('filesystem', { storiaDir: tmpDir });
    await b.initialize({ storiaDir: tmpDir });
    await b.save('story-fs-test', { title: 'FS Test', value: 99 });
    const loaded = await b.load('story-fs-test');
    assert.strictEqual(loaded.title, 'FS Test');
    assert.strictEqual(loaded.value, 99);
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('FilesystemBackend handles missing story', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storia-sdk-'));
    const { createBackend } = require('./adapters/base');
    const b = createBackend('filesystem', { storiaDir: tmpDir });
    await b.initialize({ storiaDir: tmpDir });
    const loaded = await b.load('story-nonexistent');
    assert.strictEqual(loaded, null);
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('listBackends returns both built-in backends', () => {
    const { listBackends } = require('./adapters/base');
    const names = listBackends();
    assert.ok(names.includes('memory'));
    assert.ok(names.includes('filesystem'));
  });

  test('createBackend throws for unknown backend', async () => {
    const { createBackend } = require('./adapters/base');
    try {
      createBackend('nonexistent', {});
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e.message.includes('nonexistent'));
    }
  });
}

// ─── Plugin System ──────────────────────────────────────────────────

function testPlugins() {
  console.log('\nPlugin System');

  const PluginRegistry = require('./plugins/registry');

  test('register and list plugins', () => {
    const pr = new PluginRegistry();
    pr.register({ name: 'test-plugin', version: '1.0.0' });
    assert.ok(pr.list().includes('test-plugin'));
  });

  test('prevents duplicate registration', () => {
    const pr = new PluginRegistry();
    pr.register({ name: 'dup' });
    try {
      pr.register({ name: 'dup' });
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e.message.includes('already registered'));
    }
  });

  test('requires name', () => {
    const pr = new PluginRegistry();
    try {
      pr.register({});
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e.message.includes('must have a name'));
    }
  });

  test('get returns registered plugin', () => {
    const pr = new PluginRegistry();
    pr.register({ name: 'my-plugin' });
    assert.ok(pr.get('my-plugin'));
    assert.strictEqual(pr.get('nonexistent'), null);
  });

  test('runHook calls registered hooks', async () => {
    const pr = new PluginRegistry();
    let called = false;
    pr.register({
      name: 'hook-test',
      hooks: { onBeforeRun: async () => { called = true; } }
    });
    await pr.runHook('onBeforeRun', {});
    assert.ok(called);
  });

  test('runHook does not fail when no hooks registered', async () => {
    const pr = new PluginRegistry();
    const result = await pr.runHook('onBeforeRun', {});
    assert.deepStrictEqual(result, []);
  });

  test('clear resets registry', () => {
    const pr = new PluginRegistry();
    pr.register({ name: 'clear-test' });
    pr.clear();
    assert.strictEqual(pr.list().length, 0);
  });

  test('getPersonaPacks returns persona bundles', () => {
    const pr = new PluginRegistry();
    pr.register({ name: 'p1', personas: { name: 'English Pack', personas: [{ id: 'grammarian', config: {} }] } });
    const packs = pr.getPersonaPacks();
    assert.strictEqual(packs.length, 1);
    assert.strictEqual(packs[0].name, 'English Pack');
  });

  test('getWorkflowPacks returns workflow bundles', () => {
    const pr = new PluginRegistry();
    pr.register({ name: 'w1', workflows: { name: 'Custom Workflows', workflows: [] } });
    assert.strictEqual(pr.getWorkflowPacks().length, 1);
  });
}

// ─── Storia SDK ─────────────────────────────────────────────────────

function testStoriaSDK() {
  console.log('\nStoria SDK');

  const Storia = require('./storia');

  test('Storia instance creates without config', () => {
    const s = new Storia();
    assert.ok(s);
    assert.strictEqual(s.config.backend, 'memory');
  });

  test('Storia instance with filesystem config', () => {
    const s = new Storia({ backend: 'filesystem' });
    assert.strictEqual(s.config.backend, 'filesystem');
  });

  test('run() with string prompt works', async () => {
    const s = new Storia({ backend: 'memory' });
    const result = await s.run('start a new mystery story');
    assert.ok(result.storyId);
    assert.ok(result.correlationId);
    assert.ok(result.durationMs >= 0);
  });

  test('run() with RunOptions works', async () => {
    const s = new Storia({ backend: 'memory' });
    const result = await s.run({
      prompt: 'start a new fantasy story about dragons',
      metadata: { title: 'Dragon Realm', genre: ['fantasy'] },
      language: 'en'
    });
    assert.ok(result.storyId);
  });

  test('run() returns intent info', async () => {
    const s = new Storia({ backend: 'memory' });
    const result = await s.run('continue the story');
    assert.ok(result.intent);
    assert.strictEqual(result.intent.intent, 'continue_story');
  });

  test('run() with unrecognized prompt returns error', async () => {
    const s = new Storia({ backend: 'memory' });
    const result = await s.run('what is the weather today');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Unrecognized'));
  });

  test('run() requires prompt', async () => {
    const s = new Storia({ backend: 'memory' });
    try {
      await s.run({});
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e.message.includes('prompt'));
    }
  });

  test('load() throws for unknown story', async () => {
    const s = new Storia({ backend: 'memory' });
    try {
      await s.load('story-nonexistent');
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e.message.includes('not found'));
    }
  });

  test('save() requires storyId', async () => {
    const s = new Storia({ backend: 'memory' });
    try {
      await s.save();
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e.message.includes('storyId'));
    }
  });

  test('export returns serializable story', async () => {
    const s = new Storia({ backend: 'memory' });
    const run = await s.run('start a new story');
    const exported = await s.export(run.storyId);
    assert.ok(exported.exportVersion);
    assert.ok(exported.storiaVersion);
    assert.ok(exported.story);
    assert.ok(exported.story.metadata);
  });

  test('import loads exported story', async () => {
    const s = new Storia({ backend: 'memory' });
    const run = await s.run('start a new story');
    const exported = await s.export(run.storyId);

    const s2 = new Storia({ backend: 'memory' });
    const imported = await s2.import(exported);
    const loaded = await s2.load(imported);
    assert.strictEqual(loaded.metadata.title, exported.story.metadata.title);
  });

  test('import with new storyId works', async () => {
    const s = new Storia({ backend: 'memory' });
    const run = await s.run('start a new story');
    const exported = await s.export(run.storyId);

    const s2 = new Storia({ backend: 'memory' });
    const imported = await s2.import(exported, 'story-custom-id');
    assert.strictEqual(imported, 'story-custom-id');
    const loaded = await s2.load(imported);
    assert.ok(loaded);
  });

  test('health returns full report', async () => {
    const s = new Storia({ backend: 'memory' });
    await s.run('start a story');
    const h = await s.health();
    assert.strictEqual(h.status, 'ok');
    assert.ok(h.version);
    assert.ok(h.engines.orchestrator);
    assert.ok(h.engines.validator);
    assert.strictEqual(h.backend.type, 'memory');
    assert.ok(h.plugins);
    assert.ok(h.metrics);
    assert.ok(h.uptime);
  });

  test('track run metrics', async () => {
    const s = new Storia({ backend: 'memory' });
    await s.run('start a story');
    await s.run('create a character');
    const h = await s.health();
    assert.strictEqual(h.metrics.runs, 2);
  });

  test('use() registers plugin', () => {
    const s = new Storia({ backend: 'memory' });
    s.use({ name: 'english-pack', version: '1.0.0' });
    assert.ok(s.plugins.list().includes('english-pack'));
  });

  test('use() throws after initialization', async () => {
    const s = new Storia({ backend: 'memory' });
    await s.run('start a story');
    try {
      s.use({ name: 'late-plugin' });
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e.message.includes('before the first run'));
    }
  });

  test('orchestrator accessor returns low-level runtime', async () => {
    const s = new Storia({ backend: 'memory' });
    await s.run('start a story');
    assert.ok(s.orchestrator);
    assert.ok(s.orchestrator.stateManager);
    assert.ok(s.orchestrator.personaEngine);
  });

  test('config accessor returns read-only snapshot', () => {
    const s = new Storia({ backend: 'filesystem' });
    const c = s.config;
    assert.strictEqual(c.backend, 'filesystem');
    c.backend = 'memory'; // should not affect original
    assert.strictEqual(s.config.backend, 'filesystem');
  });
}

// ─── Run All ─────────────────────────────────────────────────────────

(async () => {
  console.log('Storia SDK Test Suite');
  console.log('=====================');

  testErrors();
  testBackends();
  testPlugins();
  testStoriaSDK();

  await queue;

  console.log(`\n${'='.repeat(24)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
