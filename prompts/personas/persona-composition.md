# Persona Composition — Prompt Guidance

## How Personas Work
Personas are composable configuration profiles that tune Storia's behavior. Each persona has a SKILL.md (for LLM understanding) and a config.json (for runtime configuration).

## Composition Priority
When multiple personas are active, they are applied in this priority order:

1. **Primary** — The main writing persona (e.g., novelist, fantasy-writer)
2. **Secondary** — A supporting persona (e.g., dialogue-coach, worldbuilder)
3. **Style** — A stylistic overlay (e.g., poet, minimalist)
4. **Language** — Language-specific tuning (e.g., tamil-writer)
5. **Audience** — Audience-specific tuning (e.g., ya-novelist)

Higher priority values overwrite lower priority values. Arrays are unioned.

## What Personas Configure

| Section | What It Tunes |
|---------|---------------|
| `tone` | Formality, darkness, humor, emotional intensity, poetic density |
| `writing_style` | Sentence length, paragraph density, dialogue ratio, narrative distance |
| `verification_focus` | Priority checks, ignored checks, tolerance levels |
| `engine_overrides` | Which reason/guide/verify/creative modules are enabled |
| `memory_overrides` | Active state priority, archive frequency, scene cache size |
| `constraints` | Incompatible personas, banned patterns, required elements |
| `prompt_prefix` | Custom instruction prefix for the LLM |

## 49 Available Personas Across 12 Categories

- **Literary** (6): novelist, poet, minimalist, maximalist, experimental, translator
- **Genre** (8): fantasy-writer, sci-fi-writer, mystery-writer, thriller-writer, romance-writer, historical-fiction-writer, horror-writer, literary-fiction-writer
- **Character** (5): character-designer, dialogue-coach, psychologist, voice-actor, relationship-architect
- **Worldbuilding** (5): worldbuilder, magic-system-designer, cartographer, cultural-anthropologist, historian
- **Plot** (5): plot-architect, pacing-editor, mystery-designer, conflict-designer, ending-specialist
- **Style** (6): stylist, prose-editor, line-editor, grammarian, voice-coach, tone-consultant
- **Drama** (5): screenwriter, playwright, showrunner, beat-writer, scene-structurer
- **Cultural** (11): tamil-storyteller, hindi-kahani, japanese-monogatari, korean-saram, chinese-gushi, nigerian-akuko, arabic-hikaya, latinx-cuento, french-conte, german-erzahlung, irish-scela
- **Historical** (4): ancient-historian, medieval-scribe, renaissance-scholar, victorian-chronicler
- **Publishing** (4): developmental-editor, copy-editor, proofreader, publishing-consultant
- **Reader** (5): beta-reader, critic, sensitivity-reader, fan-theorist, book-club-host
- **Innovation** (4): ai-collaborator, transmedia-designer, interactive-writer, game-narrative-designer
