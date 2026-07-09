/**
 * Filesystem Backend — persistent state on local disk.
 * For production single-tenant use, development, and self-hosted.
 */

const path = require('path');
const fs = require('fs');
const { BackendAdapter, registerBackend } = require('./base');
const { BackendError } = require('../errors');

class FilesystemBackend extends BackendAdapter {
  constructor() {
    super();
    this._storiaDir = null;
    this._ready = false;
  }

  get type() { return 'filesystem'; }

  async initialize(config = {}) {
    this._storiaDir = config.storiaDir || path.join(process.env.HOME || process.cwd(), '.storia');
    if (!fs.existsSync(this._storiaDir)) {
      fs.mkdirSync(this._storiaDir, { recursive: true });
    }
    this._ready = true;
  }

  _storyDir(storyId) {
    return path.join(this._storiaDir, storyId);
  }

  _activePath(storyId) {
    return path.join(this._storyDir(storyId), 'active.json');
  }

  async load(storyId) {
    const filePath = this._activePath(storyId);
    if (!fs.existsSync(filePath)) return null;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      throw new BackendError(`Failed to load story ${storyId}`, { cause: err });
    }
  }

  async save(storyId, state, reason = 'manual') {
    const dir = this._storyDir(storyId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      fs.mkdirSync(path.join(dir, 'archive', 'scenes'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'archive', 'summaries'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'archive', 'revisions'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'archive', 'knowledge'), { recursive: true });
    }
    try {
      fs.writeFileSync(this._activePath(storyId), JSON.stringify(state, null, 2));
    } catch (err) {
      throw new BackendError(`Failed to save story ${storyId}`, { cause: err });
    }
  }

  async list() {
    if (!fs.existsSync(this._storiaDir)) return [];
    return fs.readdirSync(this._storiaDir)
      .filter(name => name.startsWith('story-'))
      .filter(name => fs.statSync(path.join(this._storiaDir, name)).isDirectory());
  }

  async exists(storyId) {
    return fs.existsSync(this._activePath(storyId));
  }

  async delete(storyId) {
    const dir = this._storyDir(storyId);
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
