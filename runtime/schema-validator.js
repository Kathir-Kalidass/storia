// Storia Schema Validator
// Lightweight JSON Schema validator (draft-07 subset) — no external dependencies.

const path = require('path');
const fs = require('fs');

class SchemaValidator {
  constructor(options = {}) {
    this.schemasDir = options.schemasDir || path.join(__dirname, '..', 'schemas');
    this.cache = new Map();
  }

  // Load a schema by $id
  loadSchema($id) {
    if (this.cache.has($id)) return this.cache.get($id);

    const fileName = this._idToFile($id);
    const filePath = path.join(this.schemasDir, fileName);
    if (!fs.existsSync(filePath)) {
      this.cache.set($id, null);
      return null;
    }

    const schema = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    this.cache.set($id, schema);
    return schema;
  }

  // Validate data against a schema $id
  validate($id, data) {
    const schema = this.loadSchema($id);
    if (!schema) {
      return { valid: false, errors: [{ message: `Schema not found: ${$id}` }] };
    }
    return this._validate(schema, data);
  }

  // Validate data directly against a schema object
  _validate(schema, data, path = '$') {
    const errors = [];

    if (schema.type === 'object') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push({ path, message: `expected object, got ${typeof data}` });
        return { valid: false, errors };
      }

      // Required fields
      if (schema.required) {
        for (const field of schema.required) {
          const isMissing = !(field in data) || data[field] === undefined;
          const isNull = data[field] === null;
          const allowsNull = this._isNullable(schema.properties && schema.properties[field]);
          if (isMissing || (isNull && !allowsNull)) {
            errors.push({ path: `${path}.${field}`, message: `required field '${field}' is missing or null` });
          }
        }
      }

      // Property validation
      if (schema.properties && typeof data === 'object') {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in data && data[key] !== undefined) {
            const result = this._validate(propSchema, data[key], `${path}.${key}`);
            errors.push(...result.errors);
          }
        }
      }

      // Additional properties
      if (schema.additionalProperties === false && schema.properties) {
        for (const key of Object.keys(data)) {
          if (!(key in schema.properties)) {
            errors.push({ path: `${path}.${key}`, message: `unexpected property '${key}'` });
          }
        }
      }

      // $defs validation (only for refs in properties)
      if (schema.$defs) {
        for (const [key, value] of Object.entries(data)) {
          const propSchema = schema.properties && schema.properties[key];
          if (propSchema && propSchema.$ref) {
            const defKey = propSchema.$ref.replace('#/$defs/', '');
            const defSchema = schema.$defs[defKey];
            if (defSchema && typeof value === 'object') {
              const result = this._validate(defSchema, value, `${path}.${key}`);
              errors.push(...result.errors);
            }
          }
          // Also check additionalProperties with $ref
          if (!propSchema && schema.additionalProperties && typeof schema.additionalProperties === 'object') {
            let refSchema = schema.additionalProperties;
            if (refSchema.$ref) {
              const defKey = refSchema.$ref.replace('#/$defs/', '');
              refSchema = schema.$defs ? schema.$defs[defKey] : null;
            }
            if (refSchema && typeof value === 'object') {
              const result = this._validate(refSchema, value, `${path}.${key}`);
              errors.push(...result.errors);
            }
          }
        }
      }
    }

    if (schema.type === 'array') {
      if (!Array.isArray(data)) {
        errors.push({ path, message: `expected array, got ${typeof data}` });
        return { valid: false, errors };
      }

      if (schema.minItems !== undefined && data.length < schema.minItems) {
        errors.push({ path, message: `expected at least ${schema.minItems} items, got ${data.length}` });
      }
      if (schema.maxItems !== undefined && data.length > schema.maxItems) {
        errors.push({ path, message: `expected at most ${schema.maxItems} items, got ${data.length}` });
      }

      if (schema.items && Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          const result = this._validate(schema.items, data[i], `${path}[${i}]`);
          errors.push(...result.errors);
        }
      }
    }

    if (schema.type === 'string') {
      if (typeof data !== 'string') {
        errors.push({ path, message: `expected string, got ${typeof data}` });
      }
      if (typeof data === 'string') {
        if (schema.maxLength !== undefined && data.length > schema.maxLength) {
          errors.push({ path, message: `max length ${schema.maxLength}, got ${data.length}` });
        }
        if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(data)) {
          errors.push({ path, message: `does not match pattern ${schema.pattern}: '${data}'` });
        }
        if (schema.enum !== undefined && !schema.enum.includes(data)) {
          errors.push({ path, message: `must be one of [${schema.enum.join(', ')}], got '${data}'` });
        }
        if (schema.format === 'date-time' && isNaN(Date.parse(data))) {
          errors.push({ path, message: `invalid date-time format: '${data}'` });
        }
      }
    }

    if (schema.type === 'number' || schema.type === 'integer') {
      if (typeof data !== 'number') {
        errors.push({ path, message: `expected ${schema.type}, got ${typeof data}` });
      }
      if (typeof data === 'number') {
        if (schema.type === 'integer' && !Number.isInteger(data)) {
          errors.push({ path, message: `expected integer, got ${data}` });
        }
        if (schema.minimum !== undefined && data < schema.minimum) {
          errors.push({ path, message: `minimum ${schema.minimum}, got ${data}` });
        }
        if (schema.maximum !== undefined && data > schema.maximum) {
          errors.push({ path, message: `maximum ${schema.maximum}, got ${data}` });
        }
      }
    }

    if (schema.type === 'boolean') {
      if (typeof data !== 'boolean') {
        errors.push({ path, message: `expected boolean, got ${typeof data}` });
      }
    }

    // Handle nullable types (type: ["string", "null"])
    if (Array.isArray(schema.type)) {
      if (data === null) {
        // null is always valid for nullable
      } else if (!schema.type.includes(typeof data) && !(typeof data === 'number' && schema.type.includes('integer'))) {
        errors.push({ path, message: `expected one of [${schema.type.join(', ')}], got ${typeof data}` });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Quick validation helpers for common state types
  validateCharacter(data) { return this.validate('storia/state/character', data); }
  validateScene(data) { return this.validate('storia/state/scene', data); }
  validateStory(data) { return this.validate('storia/story/metadata', data); }
  validateDNA(data) { return this.validate('storia/story/dna', data); }
  validateKnowledge(data) { return this.validate('storia/knowledge/event', data); }
  validateDiff(data) { return this.validate('storia/state/diff', data); }
  validateReport(data) { return this.validate('storia/verify/report', data); }
  validateConfig(data) { return this.validate('storia/config', data); }
  validateVersion(data) { return this.validate('storia/state/version', data); }
  validateMessage(data) { return this.validate('storia/engine/message', data); }
  validateWorld(data) { return this.validate('storia/state/world', data); }
  validateTimeline(data) { return this.validate('storia/state/timeline', data); }
  validateReader(data) { return this.validate('storia/state/reader', data); }
  validatePlot(data) { return this.validate('storia/state/plot', data); }
  validatePersona(data) { return this.validate('storia/persona/config', data); }

  // Validate entire active story state
  validateActiveState(state) {
    const errors = [];
    if (state.metadata) {
      const r = this.validateStory(state.metadata);
      if (!r.valid) errors.push(...r.errors.map(e => `metadata.${e.path}: ${e.message}`));
    }
    if (state.dna) {
      const r = this.validateDNA(state.dna);
      if (!r.valid) errors.push(...r.errors.map(e => `dna.${e.path}: ${e.message}`));
    }
    if (state.timeline) {
      const r = this.validateTimeline(state.timeline);
      if (!r.valid) errors.push(...r.errors.map(e => `timeline.${e.path}: ${e.message}`));
    }
    if (state.reader) {
      const r = this.validateReader(state.reader);
      if (!r.valid) errors.push(...r.errors.map(e => `reader.${e.path}: ${e.message}`));
    }
    if (state.plot) {
      const r = this.validatePlot(state.plot);
      if (!r.valid) errors.push(...r.errors.map(e => `plot.${e.path}: ${e.message}`));
    }
    if (state.characters && typeof state.characters === 'object') {
      for (const [id, char] of Object.entries(state.characters)) {
        const r = this.validateCharacter(char);
        if (!r.valid) errors.push(...r.errors.map(e => `characters.${id}.${e.path}: ${e.message}`));
      }
    }
    if (state.world && typeof state.world === 'object') {
      const r = this.validateWorld(state.world);
      if (!r.valid) errors.push(...r.errors.map(e => `world.${e.path}: ${e.message}`));
    }
    return { valid: errors.length === 0, errors };
  }

  listSchemas() {
    if (!fs.existsSync(this.schemasDir)) return [];
    return fs.readdirSync(this.schemasDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''));
  }

  clearCache() { this.cache.clear(); }

  _isNullable(propSchema) {
    if (!propSchema) return false;
    return Array.isArray(propSchema.type) && propSchema.type.includes('null');
  }

  _idToFile($id) {
    const map = {
      'storia/story/metadata': 'story.json',
      'storia/story/dna': 'dna.json',
      'storia/state/character': 'character.json',
      'storia/state/scene': 'scene.json',
      'storia/knowledge/event': 'knowledge.json',
      'storia/state/diff': 'diff.json',
      'storia/verify/report': 'report.json',
      'storia/config': 'config.json',
      'storia/state/version': 'version.json',
      'storia/engine/message': 'message.json',
      'storia/state/world': 'world.json',
      'storia/state/timeline': 'timeline.json',
      'storia/state/reader': 'reader.json',
      'storia/state/plot': 'plot.json',
      'storia/persona/config': 'persona.json'
    };
    return map[$id] || ($id.split('/').pop() + '.json');
  }
}

module.exports = SchemaValidator;
