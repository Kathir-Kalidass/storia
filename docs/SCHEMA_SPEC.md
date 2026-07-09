# Schema Specification

> JSON Schema definitions for Storia's Story State and inter-engine communication.
> Every schema here is the canonical validation reference.

---

## 1. Story Metadata Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "storia/story/metadata",
  "type": "object",
  "properties": {
    "story_id": {"type": "string", "pattern": "^[a-z0-9-]{8,64}$"},
    "title": {"type": "string", "maxLength": 200},
    "genre": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 1,
      "maxItems": 5
    },
    "language": {"type": "string", "pattern": "^[a-z]{2}(-[A-Z]{2})?$"},
    "secondary_languages": {
      "type": "array",
      "items": {"type": "string", "pattern": "^[a-z]{2}(-[A-Z]{2})?$"}
    },
    "themes": {"type": "array", "items": {"type": "string"}, "maxItems": 10},
    "target_audience": {"type": "string"},
    "tone": {"type": "string"},
    "pov": {"type": "string"},
    "narrative_style": {"type": "string"},
    "status": {"type": "string", "enum": ["planning", "writing", "revising", "complete", "published"]},
    "current_chapter": {"type": "integer", "minimum": 0},
    "total_chapters": {"type": "integer", "minimum": 0},
    "word_count_target": {"type": "integer", "minimum": 0},
    "active_personas": {"type": "array", "items": {"type": "string"}},
    "created_at": {"type": "string", "format": "date-time"},
    "updated_at": {"type": "string", "format": "date-time"}
  },
  "required": ["story_id", "title", "genre", "language", "status", "created_at"]
}
```

---

## 2. Story DNA Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "storia/story/dna",
  "type": "object",
  "properties": {
    "core_themes": {"type": "array", "items": {"type": "string"}, "maxItems": 5},
    "symbols": {
      "type": "object",
      "additionalProperties": {"type": "string"},
      "maxProperties": 20
    },
    "motifs": {"type": "array", "items": {"type": "string"}, "maxItems": 10},
    "tone_profile": {
      "type": "object",
      "properties": {
        "formality": {"type": "number", "minimum": 0, "maximum": 1},
        "darkness": {"type": "number", "minimum": 0, "maximum": 1},
        "humor": {"type": "number", "minimum": 0, "maximum": 1},
        "emotional_intensity": {"type": "number", "minimum": 0, "maximum": 1},
        "poetic_density": {"type": "number", "minimum": 0, "maximum": 1}
      }
    },
    "writing_style": {
      "type": "object",
      "properties": {
        "sentence_length_target": {"type": "string", "enum": ["short", "moderate", "long", "varied"]},
        "dialogue_ratio": {"type": "number", "minimum": 0, "maximum": 1},
        "narrative_distance": {"type": "string", "enum": ["close", "medium", "distant", "omniscient"]},
        "show_vs_tell": {"type": "number", "minimum": 0, "maximum": 1}
      }
    },
    "genre_rules": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "rule": {"type": "string"},
          "description": {"type": "string"},
          "severity": {"type": "string", "enum": ["required", "recommended", "optional"]}
        }
      }
    },
    "forbidden_patterns": {"type": "array", "items": {"type": "string"}},
    "promises_to_reader": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["core_themes", "tone_profile", "writing_style"]
}
```

---

## 3. Character State Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "storia/state/character",
  "type": "object",
  "properties": {
    "character_id": {"type": "string"},
    "name": {"type": "string", "maxLength": 100},
    "aliases": {"type": "array", "items": {"type": "string"}},
    "active": {"type": "boolean"},
    "location": {"type": "string"},
    "physical_state": {"$ref": "#/definitions/physical_state"},
    "emotional_state": {"$ref": "#/definitions/emotional_state"},
    "relationships": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "target": {"type": "string"},
          "type": {"type": "string"},
          "strength": {"type": "number", "minimum": -1, "maximum": 1},
          "changed_at": {"type": "string", "format": "date-time"}
        },
        "required": ["target", "type", "strength"]
      }
    },
    "voice_profile": {"$ref": "#/definitions/voice_profile"},
    "arc_progress": {"type": "number", "minimum": 0, "maximum": 1},
    "active_goals": {"type": "array", "items": {"type": "string"}},
    "active_conflicts": {"type": "array", "items": {"type": "string"}},
    "inventory": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "item_id": {"type": "string"},
          "name": {"type": "string"},
          "quantity": {"type": "integer", "minimum": 1},
          "unique": {"type": "boolean"},
          "acquired_at": {"type": "string", "format": "date-time"}
        },
        "required": ["item_id", "name", "quantity", "unique"]
      }
    },
    "scene_count": {"type": "integer", "minimum": 0}
  },
  "required": ["character_id", "name", "active"],
  "definitions": {
    "physical_state": {
      "type": "object",
      "properties": {
        "injuries": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "injury_id": {"type": "string"},
              "type": {"type": "string"},
              "severity": {"type": "string", "enum": ["minor", "moderate", "severe", "critical"]},
              "body_part": {"type": "string"},
              "scene_acquired": {"type": "string"},
              "healed": {"type": "boolean"}
            }
          }
        },
        "fatigue": {"type": "number", "minimum": 0, "maximum": 1},
        "hunger": {"type": "number", "minimum": 0, "maximum": 1},
        "poison_status": {"type": "array", "items": {"type": "object"}},
        "magical_status": {"type": "array", "items": {"type": "object"}},
        "equipment": {"type": "array", "items": {"type": "object"}}
      }
    },
    "emotional_state": {
      "type": "object",
      "properties": {
        "primary_emotion": {"type": "string"},
        "secondary_emotion": {"type": "string"},
        "intensity": {"type": "number", "minimum": 0, "maximum": 1},
        "arc": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "scene_id": {"type": "string"},
              "emotion": {"type": "string"},
              "intensity": {"type": "number", "minimum": 0, "maximum": 1}
            }
          }
        }
      }
    },
    "voice_profile": {
      "type": "object",
      "properties": {
        "vocabulary_tier": {"type": "string", "enum": ["simple", "moderate", "advanced", "archaic"]},
        "sentence_length": {"type": "string", "enum": ["short", "moderate", "long", "varied"]},
        "dialect_markers": {"type": "array", "items": {"type": "string"}},
        "humor_style": {"type": "string", "enum": ["none", "dry", "sarcastic", "warm", "dark"]},
        "education_level": {"type": "string", "enum": ["informal", "formal", "academic", "self-taught"]},
        "emotional_expression": {"type": "string", "enum": ["reserved", "expressive", "volatile", "calculated"]},
        "signature_phrases": {"type": "array", "items": {"type": "string"}},
        "language_mix": {
          "type": "object",
          "properties": {
            "primary_language": {"type": "string"},
            "secondary_language": {"type": "string"},
            "switch_patterns": {"type": "string"}
          }
        }
      }
    }
  }
}
```

---

## 4. Scene Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "storia/state/scene",
  "type": "object",
  "properties": {
    "scene_id": {"type": "string", "pattern": "^ch\\d{3}-sc\\d{3}$"},
    "chapter": {"type": "integer", "minimum": 1},
    "sequence": {"type": "integer", "minimum": 1},
    "pov_character": {"type": "string"},
    "location": {"type": "string"},
    "time": {"type": "string", "format": "date-time"},
    "participants": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 1
    },
    "objective": {"type": "string", "maxLength": 500},
    "conflict": {"type": "string", "maxLength": 500},
    "turning_point": {"type": "string", "maxLength": 500},
    "outcome": {"type": "string", "maxLength": 500},
    "emotional_delta": {
      "type": "object",
      "properties": {
        "from": {"type": "string"},
        "to": {"type": "string"},
        "intensity_change": {"type": "number"}
      }
    },
    "state_changes": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Paths in Story State that changed during this scene"
    },
    "summary": {"type": "string", "maxLength": 1000}
  },
  "required": ["scene_id", "chapter", "sequence", "pov_character", "location", "participants"]
}
```

---

## 5. Knowledge Event Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "storia/knowledge/event",
  "type": "object",
  "properties": {
    "event_id": {"type": "string"},
    "scene_id": {"type": "string"},
    "timestamp": {"type": "string", "format": "date-time"},
    "character_id": {"type": "string"},
    "fact": {"type": "string"},
    "fact_id": {"type": "string"},
    "from_type": {"type": "string", "enum": ["public", "private", "secret", "unknown"]},
    "to_type": {"type": "string", "enum": ["public", "private", "secret", "unknown"]},
    "source": {"type": "string", "enum": ["witnessed", "told", "deduced", "read", "inferred"]},
    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
    "reliability": {"type": "number", "minimum": 0, "maximum": 1}
  },
  "required": ["event_id", "scene_id", "character_id", "fact", "from_type", "to_type", "confidence"]
}
```

---

## 6. State Diff Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "storia/state/diff",
  "type": "object",
  "properties": {
    "version": {"type": "string"},
    "parent": {"type": "string"},
    "scene_id": {"type": "string"},
    "timestamp": {"type": "string", "format": "date-time"},
    "added": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": {"type": "string"},
          "value": {}
        },
        "required": ["path", "value"]
      }
    },
    "modified": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": {"type": "string"},
          "from": {},
          "to": {}
        },
        "required": ["path", "from", "to"]
      }
    },
    "removed": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": {"type": "string"}
        },
        "required": ["path"]
      }
    }
  },
  "required": ["version", "parent", "timestamp", "added", "modified", "removed"]
}
```

---

## 7. Verification Report Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "storia/verify/report",
  "type": "object",
  "properties": {
    "report_id": {"type": "string"},
    "scene_id": {"type": "string"},
    "timestamp": {"type": "string", "format": "date-time"},
    "overall_score": {"type": "number", "minimum": 0, "maximum": 100},
    "checks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "check_type": {"type": "string"},
          "status": {"type": "string", "enum": ["pass", "fail", "warning", "skip"]},
          "severity": {"type": "string", "enum": ["critical", "major", "minor", "suggestion"]},
          "location": {
            "type": "object",
            "properties": {
              "scene_id": {"type": "string"},
              "paragraph": {"type": "integer"}
            }
          },
          "message": {"type": "string"},
          "suggestion": {"type": "string"}
        },
        "required": ["check_type", "status", "severity"]
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "passed": {"type": "integer"},
        "failed": {"type": "integer"},
        "warnings": {"type": "integer"},
        "critical_count": {"type": "integer"}
      }
    }
  },
  "required": ["report_id", "scene_id", "overall_score", "checks"]
}
```

---

## 8. Configuration Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "storia/config",
  "type": "object",
  "properties": {
    "story_id": {"type": "string"},
    "active_personas": {
      "type": "object",
      "properties": {
        "primary": {"type": "string"},
        "secondary": {"type": "string"},
        "style": {"type": "string"},
        "language": {"type": "string"},
        "audience": {"type": "string"}
      }
    },
    "verification_settings": {
      "type": "object",
      "properties": {
        "auto_fix": {"type": "boolean"},
        "minimum_confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "strict_mode": {"type": "boolean"}
      }
    },
    "memory_settings": {
      "type": "object",
      "properties": {
        "max_archive_versions": {"type": "integer", "minimum": 10, "maximum": 500},
        "auto_archive_threshold": {"type": "integer", "minimum": 1}
      }
    },
    "optimization_settings": {
      "type": "object",
      "properties": {
        "compression_level": {"type": "string", "enum": ["low", "medium", "high"]},
        "cache_size": {"type": "integer", "minimum": 5, "maximum": 50}
      }
    }
  },
  "required": ["story_id"]
}
```

---

## 9. Version History Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "storia/state/version",
  "type": "object",
  "properties": {
    "version": {"type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$"},
    "parent": {"type": "string"},
    "timestamp": {"type": "string", "format": "date-time"},
    "reason": {"type": "string", "enum": ["scene_written", "revision", "manual_edit", "state_synthesized", "rollback", "import", "recovery"]},
    "scene_id": {"type": "string"},
    "author": {"type": "string", "enum": ["llm", "user", "synthesizer"]},
    "checksum": {"type": "string"},
    "size_bytes": {"type": "integer", "minimum": 0},
    "sections_changed": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["version", "parent", "timestamp", "reason", "checksum"]
}
```

---

## 10. Engine Message Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "storia/engine/message",
  "type": "object",
  "properties": {
    "message_id": {"type": "string"},
    "engine_id": {"type": "string"},
    "message_type": {"type": "string", "enum": ["request", "response", "event", "error"]},
    "target_engine": {"type": "string"},
    "workflow_id": {"type": "string"},
    "payload": {"type": "object"},
    "timestamp": {"type": "string", "format": "date-time"},
    "correlation_id": {"type": "string"}
  },
  "required": ["message_id", "engine_id", "message_type", "timestamp"]
}
```

---

## Schema Directory Layout

```
schemas/
├── story.json              # Story Metadata
├── character.json          # Character State
├── scene.json              # Scene
├── knowledge.json          # Knowledge Event
├── diff.json               # State Diff
├── report.json             # Verification Report
├── config.json             # Configuration
├── version.json            # Version History
├── message.json            # Engine Message
├── world.json              # World State
├── timeline.json           # Timeline
├── reader.json             # Reader Model
├── plot.json               # Plot State
└── persona.json            # Persona Profile
```
