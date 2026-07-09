// Storia — Express API Integration
// Run: node examples/express-api.js
//
// Demonstrates embedding Storia in an HTTP server with custom logger and telemetry.
// Requires: npm install express
// Standalone: runs the logic without HTTP if express is unavailable.

const { Storia, Logger, Telemetry, Errors } = require('../lib');

// ─── Custom Logger (structured JSON) ─────────────────────────────
const log = new Logger({
  level: 'info',
  format: 'json',
  defaultMeta: { service: 'storia-api' }
});

// ─── Custom Telemetry (in-memory, observable) ─────────────────────
const telemetry = new Telemetry({ service: 'storia-api' });
telemetry.on('event', (event) => {
  log.info('telemetry.event', { name: event.name, data: event.data });
});

// ─── Storia Instance ──────────────────────────────────────────────
const storia = new Storia({
  backend: 'memory',
  logger: log,
  telemetry
});

// ─── API Handlers ─────────────────────────────────────────────────
async function handleCreateStory(req) {
  const { prompt, metadata } = req;
  return storia.run({ prompt, metadata });
}

async function handleContinueStory(storyId, prompt) {
  return storia.run({ prompt, storyId });
}

async function handleGetStory(storyId) {
  return storia.load(storyId);
}

async function handleExportStory(storyId) {
  return storia.export(storyId);
}

async function handleHealth() {
  return storia.health();
}

// ─── Try Express, fall back to standalone demo ────────────────────
async function main() {
  let app;
  try {
    app = require('express')();
  } catch {
    console.log('Express not installed — running standalone demo.\n');
    await standaloneDemo();
    return;
  }

  app.use(require('express').json());

  app.post('/api/stories', async (req, res) => {
    try {
      const result = await handleCreateStory(req.body);
      res.json(result);
    } catch (err) {
      res.status(err instanceof Errors.StoriaError ? 400 : 500).json({ error: err.message });
    }
  });

  app.post('/api/stories/:id/continue', async (req, res) => {
    try {
      const result = await handleContinueStory(req.params.id, req.body.prompt);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/stories/:id', async (req, res) => {
    try {
      const state = await handleGetStory(req.params.id);
      res.json(state);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.get('/api/stories/:id/export', async (req, res) => {
    try {
      const exported = await handleExportStory(req.params.id);
      res.json(exported);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.get('/api/health', async (req, res) => {
    const health = await handleHealth();
    res.json(health);
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    log.info('server.start', { port });
    console.log(`Storia API running on http://localhost:${port}`);
    console.log('Endpoints:');
    console.log('  POST   /api/stories              — create a story');
    console.log('  POST   /api/stories/:id/continue  — continue a story');
    console.log('  GET    /api/stories/:id            — get story state');
    console.log('  GET    /api/stories/:id/export     — export story');
    console.log('  GET    /api/health                 — health check');
  });
}

async function standaloneDemo() {
  // ── Create a story ────────────────────────────────
  const created = await handleCreateStory({
    prompt: 'Start a sci-fi story about an AI that dreams.',
    metadata: { title: 'Electric Dreams', genre: ['scifi'] }
  });
  log.info('story.created', { storyId: created.storyId, intent: created.intent.intent });

  // ── Continue ──────────────────────────────────────
  const continued = await handleContinueStory(created.storyId, 'The AI wakes up in a simulated garden.');
  log.info('story.continued', { storyId: continued.storyId, success: continued.success });

  // ── Load ──────────────────────────────────────────
  const state = await handleGetStory(created.storyId);
  log.info('story.loaded', { title: state.metadata.title });

  // ── Export ────────────────────────────────────────
  const exported = await handleExportStory(created.storyId);
  log.info('story.exported', { version: exported.exportVersion });

  // ── Health ────────────────────────────────────────
  const health = await handleHealth();
  console.log('\nHealth:', JSON.stringify(health, null, 2));
  console.log('\nTelemetry snapshot:', JSON.stringify(telemetry.snapshot(), null, 2));
  console.log('\nDemo complete.');
}

main().catch(err => {
  console.error('API demo failed:', err);
  process.exit(1);
});
