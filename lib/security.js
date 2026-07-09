/**
 * Storia Security — input validation, sanitization, checksums, safe paths
 *
 * Every user-facing entry point in the SDK validates through these guards.
 */

const crypto = require('crypto');
const path = require('path');
const { ConfigError, ValidationError } = require('./errors');

// ─── Story ID Validation ─────────────────────────────────────────────

const STORY_ID_PATTERN = /^[a-z0-9-]{8,64}$/;
const STORY_ID_MAX_LENGTH = 64;

function validateStoryId(storyId, label = 'storyId') {
  if (typeof storyId !== 'string' || storyId.length === 0) {
    throw new ConfigError(`${label} must be a non-empty string`);
  }
  if (storyId.length > STORY_ID_MAX_LENGTH) {
    throw new ConfigError(`${label} exceeds maximum length (${STORY_ID_MAX_LENGTH})`);
  }
  if (!STORY_ID_PATTERN.test(storyId)) {
    throw new ConfigError(`${label} must match [a-z0-9-]{8,64}: '${storyId}'`);
  }
  return storyId;
}

// ─── Prompt Validation ───────────────────────────────────────────────

const PROMPT_MAX_LENGTH = 10000;
const PROMPT_MIN_LENGTH = 1;

function validatePrompt(prompt) {
  if (typeof prompt !== 'string') {
    throw new ConfigError('Prompt must be a string');
  }
  const trimmed = prompt.trim();
  if (trimmed.length < PROMPT_MIN_LENGTH) {
    throw new ConfigError('Prompt must not be empty');
  }
  if (trimmed.length > PROMPT_MAX_LENGTH) {
    throw new ConfigError(`Prompt exceeds maximum length (${PROMPT_MAX_LENGTH})`);
  }
  return trimmed;
}

// ─── Title Validation ────────────────────────────────────────────────

const TITLE_MAX_LENGTH = 200;

function validateTitle(title) {
  if (typeof title !== 'string') {
    throw new ConfigError('Title must be a string');
  }
  if (title.length > TITLE_MAX_LENGTH) {
    throw new ConfigError(`Title exceeds maximum length (${TITLE_MAX_LENGTH})`);
  }
  return title;
}

// ─── Genre Validation ────────────────────────────────────────────────

const GENRE_MAX_ITEMS = 5;
const GENRE_ITEM_MAX_LENGTH = 50;

function validateGenre(genre) {
  if (!Array.isArray(genre)) {
    throw new ConfigError('Genre must be an array');
  }
  if (genre.length === 0) {
    throw new ConfigError('Genre must have at least one item');
  }
  if (genre.length > GENRE_MAX_ITEMS) {
    throw new ConfigError(`Genre exceeds maximum items (${GENRE_MAX_ITEMS})`);
  }
  for (const g of genre) {
    if (typeof g !== 'string' || g.length === 0) {
      throw new ConfigError('Each genre must be a non-empty string');
    }
    if (g.length > GENRE_ITEM_MAX_LENGTH) {
      throw new ConfigError(`Genre item exceeds maximum length (${GENRE_ITEM_MAX_LENGTH}): '${g}'`);
    }
  }
  return genre;
}

// ─── Language Validation ─────────────────────────────────────────────

const LANGUAGE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

function validateLanguage(language) {
  if (typeof language !== 'string') {
    throw new ConfigError('Language must be a string');
  }
  if (!LANGUAGE_PATTERN.test(language)) {
    throw new ConfigError(`Language must match [a-z]{2}(-[A-Z]{2})?: '${language}'`);
  }
  return language;
}

// ─── RunOptions Validation ───────────────────────────────────────────

function validateRunOptions(options) {
  if (!options || typeof options !== 'object') {
    throw new ConfigError('run() requires a prompt string or RunOptions object');
  }

  const prompt = validatePrompt(options.prompt);

  if (options.storyId) {
    validateStoryId(options.storyId);
  }

  if (options.language) {
    validateLanguage(options.language);
  }

  if (options.metadata) {
    if (options.metadata.title) {
      options.metadata.title = validateTitle(options.metadata.title);
    }
    if (options.metadata.genre) {
      options.metadata.genre = validateGenre(options.metadata.genre);
    }
  }

  return { ...options, prompt };
}

// ─── Config Validation ───────────────────────────────────────────────

function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new ConfigError('Config must be an object');
  }

  // Backend name must be alphanumeric
  if (config.backend && typeof config.backend === 'string') {
    if (!/^[a-z0-9_-]+$/.test(config.backend)) {
      throw new ConfigError(`Invalid backend name: '${config.backend}'`);
    }
  }

  // storiaDir must be a string if provided
  if (config.storiaDir !== undefined && typeof config.storiaDir !== 'string') {
    throw new ConfigError('storiaDir must be a string path');
  }

  return config;
}

// ─── Path Traversal Prevention ───────────────────────────────────────

/**
 * Ensure a storyId doesn't escape its sandboxed directory.
 * Story IDs with '..', '/', or absolute paths are rejected.
 */
function sanitizeStoragePath(storiaDir, storyId) {
  if (typeof storyId !== 'string') {
    throw new ConfigError('Story ID must be a string');
  }

  // Reject path traversal characters
  if (storyId.includes('..') || storyId.includes('/') || storyId.includes('\\')) {
    throw new ConfigError(`Invalid story ID: path traversal detected in '${storyId}'`);
  }

  // Ensure the resolved path is within storiaDir
  const resolved = path.resolve(storiaDir, storyId);
  const base = path.resolve(storiaDir);

  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new ConfigError(`Path traversal blocked: '${storyId}' escapes storage directory`);
  }

  return resolved;
}

// ─── State Checksums ────────────────────────────────────────────────

function computeChecksum(data) {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(json).digest('hex');
}

function verifyChecksum(data, expectedChecksum) {
  const actual = computeChecksum(data);
  return actual === expectedChecksum;
}

// ─── Size Limits ─────────────────────────────────────────────────────

const MAX_STATE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function validateStateSize(data) {
  const json = JSON.stringify(data);
  const bytes = Buffer.byteLength(json, 'utf-8');
  if (bytes > MAX_STATE_SIZE_BYTES) {
    throw new ValidationError(`State exceeds maximum size (${MAX_STATE_SIZE_BYTES} bytes): ${bytes} bytes`);
  }
  return bytes;
}

// ─── Export Data Validation ──────────────────────────────────────────

function validateExportData(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Import data must be a non-empty object');
  }
  const story = data.story || data;
  if (!story.metadata || !story.metadata.story_id) {
    throw new ValidationError('Import data must contain a story with metadata.story_id');
  }
  return data;
}

// ─── Plugin Name Validation ──────────────────────────────────────────

const PLUGIN_NAME_PATTERN = /^[a-z0-9_-]+$/;

function validatePluginName(name) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new ConfigError('Plugin name must be a non-empty string');
  }
  if (!PLUGIN_NAME_PATTERN.test(name)) {
    throw new ConfigError(`Plugin name must match [a-z0-9_-]: '${name}'`);
  }
  return name;
}

module.exports = {
  validateStoryId,
  validatePrompt,
  validateTitle,
  validateGenre,
  validateLanguage,
  validateRunOptions,
  validateConfig,
  sanitizeStoragePath,
  computeChecksum,
  verifyChecksum,
  validateStateSize,
  validateExportData,
  validatePluginName,
  STORY_ID_PATTERN,
  PROMPT_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  MAX_STATE_SIZE_BYTES
};
