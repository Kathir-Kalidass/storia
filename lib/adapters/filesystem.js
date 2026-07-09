/**
 * Filesystem Backend — persistent state on local disk.
 * For production single-tenant use, development, and self-hosted.
 */

const path = require('path');
const fs = require('fs');
const { BackendAdapter, registerBackend } = require('./base');
const { BackendError } = require('../errors');
const { sanitizeStoragePath, computeChecksum, validateStateSize } = require('../security');

class FilesystemBackend extends BackendAdapter {
  constructor() {
    super();
    this._storiaDir = null;
    this._ready = false;
  }

  get type() { return 'filesystem'; }

  async initialize(config = {}) {
    this._storiaDir = config.storiaDir || path.join(process.env.HOME || process.cwd(), '.storia');
    this._storiaDir = path.resolve(this._storiaDir);
    if (!fs.existsSync(this._storiaDir)) {
      fs.mkdirSync(this._storiaDir, { recursive: true });
    }
    this._ready = true;
  }

  _safeDir(storyId) {
    return sanitizeStoragePath(this._storiaDir, storyId);
  }

  _activePath(storyId) {
    return path.join(this._safeDir(storyId), 'active.json');
  }

  _checksumPath(storyId) {
    return path.join(this._safeDir(storyId), '.checksum');
  }

  async load(storyId) {
    const filePath = this._activePath(storyId);
    if (!fs.existsSync(filePath)) return null;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      // Verify checksum on load (non-fatal — warn if mismatch)
      const checksumFile = this._checksumPath(storyId);
      if (fs.existsSync(checksumFile)) {
        const expected = fs.readFileSync(checksumFile, 'utf-8').trim();
        const actual = computeChecksum(raw);
        if (actual !== expected) {
          throw new BackendError(
            `Story '${storyId}' checksum mismatch: data may be corrupted`,
            { details: { expected, actual } }
          );
        }
      }

      return data;
    } catch (err) {
      if (err instanceof BackendError) throw err;
      throw new BackendError(`Failed to load story ${storyId}`, { cause: err });
    }
  }

  async save(storyId, state, reason = 'manual') {
    const dir = this._safeDir(storyId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      fs.mkdirSync(path.join(dir, 'archive', 'scenes'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'archive', 'summaries'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'archive', 'revisions'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'archive', 'knowledge'), { recursive: true });
    }
    try {
      const json = JSON.stringify(state, null, 2);
      validateStateSize(state);
      fs.writeFileSync(this._activePath(storyId), json);
      // Write checksum alongside state
      fs.writeFileSync(this._checksumPath(storyId), computeChecksum(json));
    } catch (err) {
      throw new BackendError(`Failed to save story ${storyId}`, { cause: err });
    }
  }

  async list() {
    if (!fs.existsSync(this._storiaDir)) return [];
    return fs.readdirSync(this._storiaDir)
      .filter(name => name.startsWith('story-'))
      .filter(name => {
        try {
          return fs.statSync(path.join(this._storiaDir, name)).isDirectory();
        } catch { return false; }
      });
  }

  async exists(storyId) {
    return fs.existsSync(this._activePath(storyId));
  }

  async delete(storyId) {
    const dir = this._safeDir(storyId);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  }

  async health() {
    if (!this._ready) return false;
    try {
      fs.accessSync(this._storiaDir, fs.constants.R_OK | fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}

registerBackend('filesystem', FilesystemBackend);
module.exports = FilesystemBackend;
