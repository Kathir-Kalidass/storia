# Memory Specification

> Persistence layer specification for Storia's Story State.
> Manages active state, archive, versioning, caching, and budget enforcement.

---

## 1. Storage Architecture

```
~/.config/storia/
├── {story_id}/
│   ├── active.json             # Current active state (<100 KB target)
│   ├── active.lock             # Write lock
│   ├── archive/
│   │   ├── scenes/             # Archived scene records
│   │   │   ├── ch001-sc001.json
│   │   │   ├── ch001-sc002.json
│   │   │   └── ...
│   │   ├── summaries/          # Chapter summaries
│   │   │   ├── ch001.json
│   │   │   ├── ch002.json
│   │   │   └── ...
│   │   ├── revisions/          # State version history
│   │   │   ├── v1.0.0.json
│   │   │   ├── v1.1.0.json
│   │   │   └── ...
│   │   ├── knowledge/          # Archived knowledge events
│   │   │   └── events.log
│   │   └── characters/         # Inactive character profiles
│   │       └── ...
│   ├── state.index             # Fast lookup index for archive
│   └── config.json             # Story-level configuration
├── registry.json               # Story ID registry (all known stories)
└── storia.lock                 # Global lock
```

---

## 2. Active State Management

### 2.1 Load Protocol

1. Acquire `active.lock` (shared read)
2. Read `active.json`
3. Validate against JSON Schema (from schemas/)
4. Check integrity via State Validator
5. Return active state
6. Release lock

### 2.2 Write Protocol

1. Acquire `active.lock` (exclusive write)
2. Receive state diff from Synthesizer (confidence-scored)
3. Apply auto-commit changes (confidence >= 0.95)
4. Stage flagged changes (confidence 0.70-0.94)
5. Reject low-confidence changes (confidence < 0.70) — return for user review
6. Run State Validator on new state
7. If valid: commit, create version snapshot, release lock
8. If invalid: rollback, return validation errors

### 2.3 Concurrency

- Single-writer model (lock-based)
- Read locks are shared; write locks are exclusive
- Write queue with exponential backoff on contention
- Timeout: 5 seconds max wait; fail to user if exceeded

---

## 3. Archive Management

### 3.1 Promotion to Archive

Triggers for moving active data to archive:

| Trigger | Section | Condition |
|---|---|---|
| Scene completed | Active Scene Cache | Scene is 3+ positions from current in priority |
| Character inactive | Active Characters | Character not appeared in 10+ scenes |
| Location inactive | Active World | Location not visited in 10+ scenes |
| Budget exceeded | Any section | Section exceeds hard limit |
| Story completed | Full state | Story status → complete |

### 3.2 Demotion from Archive

Triggers for moving archive data to active:

| Trigger | Section | Condition |
|---|---|---|
| Character returns | Characters | Character appears in new scene |
| Location revisited | World | Scene set in archived location |
| Reference needed | Scenes | Context requires archived scene |
| Explicit request | Any | User requests specific archive data |

### 3.3 Archive File Format

```
archive/scenes/{scene_id}.json
```

Each archived file follows the same schema as its active counterpart.

Archive subdirectories maintain an `index.json` for fast listing:

```json
{
  "total_items": 150,
  "last_updated": "datetime",
  "items": [
    {"id": "ch001-sc001", "timestamp": "datetime", "summary": "string"},
    ...
  ]
}
```

---

## 4. Cache Management

### 4.1 Adaptive Scene Cache Priority

Scenes are retained in the active cache based on narrative relevance, not recency:

| Priority Level | Scenes Retained | Eviction Order |
|---|---|---|
| Current scene | 1 | Never (pinned) |
| Previous scene | 1 | Last |
| Connected scenes | Up to 3 | By narrative distance |
| Referenced scenes | Up to 3 | By reference count |
| Recently edited | Last 3 | By edit recency |

### 4.2 Cache Budget

- Target: 10 KB for scene cache
- Hard limit: 15 KB
- Eviction: when limit exceeded, archive lowest-priority scene

### 4.3 Cache Warm-up

On workflow start, Memory Engine pre-loads:
1. Current scene (from state.current_scene)
2. Previous scene
3. POV character's last 3 connected scenes
4. Active location's last scene

---

## 5. State Versioning

### 5.1 Version Schema

```json
{
  "version": "1.0.0",
  "parent": "0.9.0",
  "timestamp": "datetime",
  "reason": "scene_written | revision | manual_edit | state_synthesized",
  "scene_id": "ch003-sc007",
  "author": "llm | user | synthesizer",
  "checksum": "sha256",
  "size_bytes": 84219,
  "sections_changed": ["characters.alice", "timeline", "plot_state"]
}
```

### 5.2 Version History

- Keep last 100 versions in archive/revisions/
- Versions older than 100 are summarized and pruned
- Summary format: compressed diff from v{N-100} to current

### 5.3 Rollback

1. User requests rollback to version V
2. Load `archive/revisions/v{V}.json`
3. Compute diff from current to V
4. Reverse-apply diff to active state
5. Run State Validator
6. Create new version with reason: "rollback_to_V"

---

## 6. Budget Enforcement

### 6.1 Per-Section Budgets

| Section | Soft Limit | Hard Limit | Archive Action |
|---|---|---|---|
| Story Metadata | 2 KB | 3 KB | Archive oldest metadata versions |
| Story DNA | 5 KB | 7 KB | Compress motif/symbol descriptions |
| Active Characters | 30 KB | 40 KB | Archive least-recently-active character |
| Active World | 15 KB | 20 KB | Archive least-recently-visited location |
| Timeline | 10 KB | 12 KB | Archive oldest temporal anchors |
| Reader Model | 10 KB | 12 KB | Compress emotional curve history |
| Plot State | 15 KB | 20 KB | Archive oldest subplot/completed payoffs |
| Active Scene Cache | 10 KB | 15 KB | LRU-evict to archive |

### 6.2 Total Active State

- Target: < 100 KB
- Hard ceiling: 129 KB
- At hard ceiling: Runtime blocks writes and triggers Optimizer compaction

### 6.3 Budget Monitoring

- Budget check runs after every state write
- Budget report included in every verification output
- Warning emitted at 80% of hard limit
- Critical warning at 95% of hard limit

---

## 7. State Index

### 7.1 Active Index

Inline in `active.json` — maps section keys to byte offsets for fast random access:

```json
{
  "_index": {
    "metadata": {"offset": 0, "size": 2048},
    "dna": {"offset": 2048, "size": 5120},
    "characters": {"offset": 7168, "size": 30720},
    "world": {"offset": 37888, "size": 15360},
    "timeline": {"offset": 53248, "size": 10240},
    "reader": {"offset": 63488, "size": 10240},
    "plot": {"offset": 73728, "size": 15360},
    "scenes": {"offset": 89088, "size": 10240}
  }
}
```

### 7.2 Archive Index

`state.index` is a separate file for fast archive lookups without scanning directories:

```json
{
  "version": 1,
  "updated": "datetime",
  "scenes": {
    "ch001-sc001": {"path": "archive/scenes/ch001-sc001.json", "summary": "...", "timestamp": "..."},
    "ch001-sc002": {"path": "archive/scenes/ch001-sc002.json", "summary": "...", "timestamp": "..."}
  },
  "characters": {
    "alice": {"path": "archive/characters/alice.json", "last_active": "ch005-sc003", "status": "inactive"},
    "bob": {"path": "archive/characters/bob.json", "last_active": "ch004-sc001", "status": "inactive"}
  },
  "knowledge_events": {
    "total": 342,
    "path": "archive/knowledge/events.log",
    "last_event": {"scene": "ch010-sc005", "character": "alice", "fact": "victor_is_spy"}
  }
}
```

---

## 8. Locking Protocol

### 8.1 File Locks

| Lock | Scope | Type | Purpose |
|---|---|---|---|
| `storia.lock` | Global | Exclusive | Prevent concurrent story operations |
| `active.lock` | Per-story | Read/Write | Coordinate state access |

### 8.2 Lock Timeout

- Read lock: 2 seconds max wait
- Write lock: 5 seconds max wait
- On timeout: return error to Runtime for recovery

### 8.3 Deadlock Prevention

- Fixed lock ordering: acquire global → acquire story
- No nested lock acquisition within callbacks
- All locks released in reverse acquisition order

---

## 9. Recovery

### 9.1 Corruption Detection

- Checksum verification on every state read
- Schema validation on every state read
- Integrity check via State Validator on every state write

### 9.2 Recovery Process

1. Detect corruption (checksum mismatch, schema violation, or validator failure)
2. Isolate corrupted section
3. Restore section from latest clean version in archive/revisions/
4. If revision unavailable: rebuild section from archive data
5. If rebuild fails: flag data loss to user
6. Create recovery version with reason: "recovery_from_corruption"

### 9.3 Graceful Degradation

- If active.json is corrupted but archive is intact: rebuild active from archive
- If both active and archive are corrupted: attempt rebuild from raw story text (via Synthesizer)
- If everything is lost: inform user of extent; offer to start fresh
