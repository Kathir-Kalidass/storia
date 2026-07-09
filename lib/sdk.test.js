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
      assert.ok(e.message.includes('must be a string'));
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

// ─── Security ────────────────────────────────────────────────────────

function testSecurity() {
  console.log('\nSecurity');

  const sec = require('./security');
  const Storia = require('./storia');
  const path = require('path');
  const fs = require('fs');
  const os = require('os');

  // ── Input Validation ────────────────────────────────────────────────

  test('validateStoryId rejects empty string', () => {
    try { sec.validateStoryId(''); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('non-empty')); }
  });

  test('validateStoryId rejects path traversal', () => {
    try { sec.validateStoryId('../etc/passwd'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('match')); }
  });

  test('validateStoryId rejects uppercase', () => {
    try { sec.validateStoryId('Story-ABC'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('match')); }
  });

  test('validateStoryId accepts valid ID', () => {
    const id = sec.validateStoryId('story-abc123-def456');
    assert.strictEqual(id, 'story-abc123-def456');
  });

  test('validateStoryId rejects excess length', () => {
    try { sec.validateStoryId('a'.repeat(65)); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('exceeds')); }
  });

  test('validatePrompt rejects empty', () => {
    try { sec.validatePrompt(''); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('empty')); }
  });

  test('validatePrompt rejects non-string', () => {
    try { sec.validatePrompt(123); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('string')); }
  });

  test('validatePrompt trims whitespace', () => {
    const p = sec.validatePrompt('  hello  ');
    assert.strictEqual(p, 'hello');
  });

  test('validatePrompt rejects excess length', () => {
    try { sec.validatePrompt('x'.repeat(sec.PROMPT_MAX_LENGTH + 1)); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('exceeds')); }
  });

  test('validateGenre rejects empty array', () => {
    try { sec.validateGenre([]); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('at least one')); }
  });

  test('validateGenre rejects too many items', () => {
    try { sec.validateGenre(['a','b','c','d','e','f']); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('exceeds')); }
  });

  test('validateGenre accepts valid genre', () => {
    const g = sec.validateGenre(['fantasy', 'adventure']);
    assert.deepStrictEqual(g, ['fantasy', 'adventure']);
  });

  test('validateLanguage rejects invalid code', () => {
    try { sec.validateLanguage('english'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('match')); }
  });

  test('validateLanguage accepts valid code', () => {
    assert.strictEqual(sec.validateLanguage('en'), 'en');
    assert.strictEqual(sec.validateLanguage('zh-CN'), 'zh-CN');
  });

  test('validateTitle rejects excess length', () => {
    try { sec.validateTitle('x'.repeat(sec.TITLE_MAX_LENGTH + 1)); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('exceeds')); }
  });

  test('validateConfig rejects non-object', () => {
    try { sec.validateConfig('string'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('object')); }
  });

  test('validateConfig rejects invalid backend name', () => {
    try { sec.validateConfig({ backend: '../../' }); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('backend')); }
  });

  // ── Path Traversal Prevention ───────────────────────────────────────

  test('sanitizeStoragePath blocks ../', () => {
    try { sec.sanitizeStoragePath('/safe', '../etc'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('traversal')); }
  });

  test('sanitizeStoragePath blocks absolute paths', () => {
    try { sec.sanitizeStoragePath('/safe', '/etc/passwd'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('traversal')); }
  });

  test('sanitizeStoragePath blocks slash in ID', () => {
    try { sec.sanitizeStoragePath('/safe', 'story/../evil'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('traversal')); }
  });

  test('sanitizeStoragePath accepts valid ID', () => {
    const p = sec.sanitizeStoragePath('/safe', 'story-valid-123');
    assert.ok(p.startsWith('/safe'));
    assert.ok(p.includes('story-valid-123'));
  });

  // ── Checksums ──────────────────────────────────────────────────────

  test('computeChecksum returns consistent hash', () => {
    const a = sec.computeChecksum({ hello: 'world' });
    const b = sec.computeChecksum({ hello: 'world' });
    assert.strictEqual(a, b);
  });

  test('computeChecksum changes with content', () => {
    const a = sec.computeChecksum({ x: 1 });
    const b = sec.computeChecksum({ x: 2 });
    assert.notStrictEqual(a, b);
  });

  test('verifyChecksum returns true for matching data', () => {
    const data = { foo: 'bar' };
    const hash = sec.computeChecksum(data);
    assert.ok(sec.verifyChecksum(data, hash));
  });

  test('verifyChecksum returns false for tampered data', () => {
    const hash = sec.computeChecksum({ original: 'data' });
    assert.ok(!sec.verifyChecksum({ tampered: 'yes' }, hash));
  });

  // ── Size Limits ─────────────────────────────────────────────────────

  test('validateStateSize rejects oversized state', () => {
    const big = { data: 'x'.repeat(sec.MAX_STATE_SIZE_BYTES + 1) };
    try { sec.validateStateSize(big); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('exceeds')); }
  });

  test('validateStateSize accepts small state', () => {
    const bytes = sec.validateStateSize({ small: 'ok' });
    assert.ok(bytes > 0);
  });

  // ── RunOptions Validation Integration ───────────────────────────────

  test('validateRunOptions rejects missing prompt', () => {
    try { sec.validateRunOptions({}); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('must be a string')); }
  });

  test('validateRunOptions rejects null', () => {
    try { sec.validateRunOptions(null); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('RunOptions')); }
  });

  test('validateRunOptions validates nested fields', () => {
    const opts = sec.validateRunOptions({ prompt: 'hello', metadata: { genre: ['fantasy'] }, language: 'en' });
    assert.strictEqual(opts.prompt, 'hello');
    assert.deepStrictEqual(opts.metadata.genre, ['fantasy']);
  });

  test('validateExportData rejects empty data', () => {
    try { sec.validateExportData(null); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('object')); }
  });

  test('validateExportData rejects data without story_id', () => {
    try { sec.validateExportData({ metadata: {} }); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('story_id')); }
  });

  test('validatePluginName rejects empty', () => {
    try { sec.validatePluginName(''); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('non-empty')); }
  });

  test('validatePluginName rejects special chars', () => {
    try { sec.validatePluginName('my plugin!'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('match')); }
  });

  test('validatePluginName accepts valid name', () => {
    assert.strictEqual(sec.validatePluginName('my-plugin'), 'my-plugin');
  });

  // ── SDK Integration: validation in Storia methods ───────────────────

  test('Storia constructor validates config', () => {
    try { new Storia({ backend: '../../evil' }); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('backend')); }
  });

  test('Storia run() validates prompt', async () => {
    const s = new Storia({ backend: 'memory' });
    try { await s.run(''); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('empty')); }
  });

  test('Storia run() validates runOptions', async () => {
    const s = new Storia({ backend: 'memory' });
    try { await s.run(null); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('prompt')); }
  });

  test('Storia load() validates storyId', async () => {
    const s = new Storia({ backend: 'memory' });
    await s.run('start a story');
    try { await s.load(''); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('non-empty')); }
  });

  test('Storia load() rejects traversal', async () => {
    const s = new Storia({ backend: 'memory' });
    try { await s.load('../etc/passwd'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('match')); }
  });

  test('Storia export() validates storyId', async () => {
    const s = new Storia({ backend: 'memory' });
    try { await s.export('../evil'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('match')); }
  });

  test('Storia import() validates import data', async () => {
    const s = new Storia({ backend: 'memory' });
    try { await s.import({}); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('story_id')); }
  });

  test('Storia import() validates newStoryId', async () => {
    const s = new Storia({ backend: 'memory' });
    try { await s.import({ story: { metadata: { story_id: 'valid-id-123' } } }, '../evil'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('match')); }
  });

  test('Storia use() validates plugin name', () => {
    const s = new Storia({ backend: 'memory' });
    try { s.use({ name: '../../' }); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('match')); }
  });

  test('Storia save() validates storyId', async () => {
    const s = new Storia({ backend: 'memory' });
    await s.run('start a story');
    try { await s.save('../../evil'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('match')); }
  });

  // ── Filesystem Path Traversal Protection ────────────────────────────

  test('FilesystemBackend blocks path traversal', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storia-sec-'));
    const { createBackend } = require('./adapters/base');
    const b = createBackend('filesystem', { storiaDir: tmpDir });
    await b.initialize({ storiaDir: tmpDir });
    try { await b.save('../evil', { x: 1 }); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('traversal')); }
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('FilesystemBackend creates checksum on save', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storia-sec-'));
    const { createBackend } = require('./adapters/base');
    const b = createBackend('filesystem', { storiaDir: tmpDir });
    await b.initialize({ storiaDir: tmpDir });
    await b.save('story-checksum-test', { title: 'Test' });
    const checksumPath = path.join(tmpDir, 'story-checksum-test', '.checksum');
    assert.ok(fs.existsSync(checksumPath));
    const checksum = fs.readFileSync(checksumPath, 'utf-8').trim();
    assert.ok(checksum.length > 0);
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('FilesystemBackend detects tampered state', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storia-sec-'));
    const { createBackend } = require('./adapters/base');
    const b = createBackend('filesystem', { storiaDir: tmpDir });
    await b.initialize({ storiaDir: tmpDir });
    await b.save('story-tamper', { title: 'Original' });
    // Tamper with the state file directly
    const activePath = path.join(tmpDir, 'story-tamper', 'active.json');
    fs.writeFileSync(activePath, JSON.stringify({ title: 'Tampered' }));
    try { await b.load('story-tamper'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('checksum mismatch')); }
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('MemoryBackend detects tampered state', async () => {
    const { createBackend } = require('./adapters/base');
    const b = createBackend('memory', {});
    await b.initialize({});
    await b.save('story-mem-tamper', { title: 'Original' });
    // Directly tamper with internal store
    b._store.set('story-mem-tamper', { title: 'Tampered' });
    try { await b.load('story-mem-tamper'); assert.fail('should throw'); }
    catch (e) { assert.ok(e.message.includes('checksum mismatch')); }
  });
}

// ─── Observability ───────────────────────────────────────────────────

function testObservability() {
  console.log('\nObservability');

  // ── Logger ──────────────────────────────────────────────────────────

  const { Logger } = require('./logger');

  test('Logger default level is info', () => {
    const log = new Logger();
    assert.strictEqual(log.level, 'info');
  });

  test('Logger respects level threshold', () => {
    const lines = [];
    const log = new Logger({ level: 'warn', transport: (entry) => lines.push(entry) });
    log.trace('should not appear');
    log.debug('should not appear');
    log.info('should not appear');
    log.warn('warning message');
    log.error('error message');
    assert.strictEqual(lines.length, 2);
    assert.strictEqual(lines[0].message, 'warning message');
    assert.strictEqual(lines[1].message, 'error message');
  });

  test('Logger child inherits context', () => {
    const lines = [];
    const log = new Logger({ level: 'info', transport: (entry) => lines.push(entry) });
    const child = log.child({ correlationId: 'abc-123' });
    child.info('test');
    assert.strictEqual(lines[0].correlationId, 'abc-123');
  });

  test('Logger pretty format produces readable output', () => {
    const lines = [];
    const log = new Logger({ level: 'info', format: 'pretty', transport: (entry) => lines.push(entry) });
    log.info('hello', { key: 'value' });
    assert.strictEqual(lines[0].message, 'hello');
    assert.strictEqual(lines[0].key, 'value');
  });

  test('Logger JSON format produces valid JSON', () => {
    const strings = [];
    const log = new Logger({ level: 'info', format: 'json', transport: (entry) => strings.push(JSON.stringify(entry)) });
    log.info('test', { count: 42 });
    const parsed = JSON.parse(strings[0]);
    assert.strictEqual(parsed.message, 'test');
    assert.strictEqual(parsed.count, 42);
    assert.ok(parsed.timestamp);
  });

  // ── Telemetry ───────────────────────────────────────────────────────

  const { Telemetry } = require('./telemetry');

  test('Telemetry track emits events', () => {
    const t = new Telemetry({ service: 'test' });
    const events = [];
    t.on('event', (e) => events.push(e));
    t.track('test.event', { data: 1 });
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].name, 'test.event');
    assert.strictEqual(events[0].data.data, 1);
  });

  test('Telemetry increment maintains counters', () => {
    const t = new Telemetry();
    t.increment('runs');
    t.increment('runs');
    t.increment('errors');
    const snap = t.snapshot();
    assert.strictEqual(snap.counters.runs, 2);
    assert.strictEqual(snap.counters.errors, 1);
  });

  test('Telemetry histogram records values', () => {
    const t = new Telemetry();
    t.histogram('latency', 150);
    t.histogram('latency', 200);
    const snap = t.snapshot();
    assert.strictEqual(snap.histograms.latency, 2);
  });

  test('Telemetry gauge tracks latest value', () => {
    const t = new Telemetry();
    t.gauge('connections', 5);
    t.gauge('connections', 3);
    const snap = t.snapshot();
    assert.strictEqual(snap.gauges.connections, 3);
  });

  test('Telemetry startSpan and endSpan returns duration', () => {
    const t = new Telemetry();
    const id = t.startSpan('op');
    assert.ok(id);
    const dur = t.endSpan(id);
    assert.ok(dur >= 0);
  });

  test('Telemetry reset clears all metrics', () => {
    const t = new Telemetry();
    t.increment('runs', 5);
    t.gauge('cpu', 80);
    t.reset();
    const snap = t.snapshot();
    assert.deepStrictEqual(snap.counters, {});
    assert.deepStrictEqual(snap.gauges, {});
  });

  test('Telemetry disabled when enabled=false', () => {
    const t = new Telemetry({ enabled: false });
    const events = [];
    t.on('event', (e) => events.push(e));
    t.track('test', {});
    assert.strictEqual(events.length, 0);
  });

  test('Telemetry unsubscribe removes listener', () => {
    const t = new Telemetry();
    let count = 0;
    const unsub = t.on('event', () => count++);
    t.track('a');
    unsub();
    t.track('b');
    assert.strictEqual(count, 1);
  });

  // ── Retry ───────────────────────────────────────────────────────────

  const { retry, RetryError } = require('./retry');

  test('retry succeeds on first attempt', async () => {
    let calls = 0;
    const result = await retry(async () => { calls++; return 'ok'; });
    assert.strictEqual(result, 'ok');
    assert.strictEqual(calls, 1);
  });

  const { BackendError } = require('./errors');

  test('retry retries on failure then succeeds', async () => {
    let calls = 0;
    const result = await retry(async () => {
      calls++;
      if (calls < 3) throw new BackendError('transient');
      return 'ok';
    }, { maxRetries: 3, baseDelay: 5 });
    assert.strictEqual(result, 'ok');
    assert.strictEqual(calls, 3);
  });

  test('retry throws RetryError after exhausting retries', async () => {
    try {
      await retry(async () => { throw new BackendError('always fails'); }, { maxRetries: 2, baseDelay: 5 });
      assert.fail('should throw');
    } catch (e) {
      assert.ok(e instanceof RetryError);
      assert.ok(e.message.includes('retries'));
    }
  });

  test('retry does not retry non-retryable errors', async () => {
    let calls = 0;
    try {
      await retry(async () => { calls++; throw new Error('fatal'); }, {
        maxRetries: 3,
        baseDelay: 5,
        retryable: () => false
      });
      assert.fail('should throw');
    } catch (e) {
      assert.strictEqual(calls, 1);
    }
  });

  test('retry calls onRetry callback', async () => {
    let attempts = [];
    let calls = 0;
    await retry(async () => {
      calls++;
      if (calls < 3) throw new BackendError('retry me');
      return 'done';
    }, {
      maxRetries: 3,
      baseDelay: 5,
      onRetry: (err, attempt, delay) => { attempts.push({ attempt, delay }); }
    });
    assert.strictEqual(attempts.length, 2);
    assert.strictEqual(attempts[0].attempt, 1);
  });

  // ── SDK Integration ────────────────────────────────────────────────

  const Storia = require('./storia');

  test('Storia with logger level records entries', async () => {
    const lines = [];
    const log = new Logger({ level: 'info', transport: (entry) => lines.push(entry) });
    const s = new Storia({ backend: 'memory', logger: log });
    await s.run('start a story');
    const storiaLogs = lines.filter(l => l.message && l.message.startsWith('storia.'));
    assert.ok(storiaLogs.length > 0);
    assert.ok(storiaLogs.some(l => l.message === 'storia.run'));
  });

  test('Storia Telemetry tracks counter', async () => {
    const t = new Telemetry();
    const s = new Storia({ backend: 'memory', telemetry: t });
    await s.run('start a story');
    await s.run('create a character');
    const snap = t.snapshot();
    assert.ok(snap.counters['runs.total'] >= 2);
  });

  test('Storia health includes telemetry snapshot', async () => {
    const t = new Telemetry();
    const s = new Storia({ backend: 'memory', telemetry: t });
    await s.run('start a story');
    const h = await s.health();
    assert.ok(h.metrics.telemetry);
    assert.ok(h.metrics.telemetry.counters);
  });

  test('Storia health includes logger level', async () => {
    const log = new Logger({ level: 'debug' });
    const s = new Storia({ backend: 'memory', logger: log });
    const h = await s.health();
    assert.strictEqual(h.logger.level, 'debug');
  });

  test('Storia custom Telemetry via use() works', () => {
    const events = [];
    const t = new Telemetry();
    t.on('event', (e) => events.push(e));
    const s = new Storia({ backend: 'memory', telemetry: t, logLevel: 'silent' });
    s.use({ name: 'my-pack', version: '1.0.0' });
    assert.ok(s.plugins.list().includes('my-pack'));
  });

  test('retry config passed to backend operations', async () => {
    const s = new Storia({ backend: 'memory', retry: { maxRetries: 1, baseDelay: 5 } });
    const result = await s.run('start a story');
    assert.ok(result.success);
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
  testSecurity();
  testObservability();

  await queue;

  console.log(`\n${'='.repeat(24)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
