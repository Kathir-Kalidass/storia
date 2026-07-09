# Capability: Publishing

## Description
Prepares stories for market release including market analysis, genre validation, publishing readiness assessment, and generation of marketing materials. Produces blurbs, synopses, query letters, and market positioning documents.

## Activation Triggers
"publish story", "ready for publication", "marketing materials", "write a blurb", "query letter", "synopsis", "market analysis", "publishing readiness"

## Supported Workflows
W016 — Prepare Publication

## Preferred Personas
Primary: Developmental Editor, Market Analyst. Secondary: Bestseller Consultant, Line Editor, Copy Editor, Proofreader. Genre: genre-appropriate persona for genre validation (e.g., Fantasy Writer for fantasy market).

## Engines Invoked
Runtime Engine — workflow routing. Publishing Engine — Market Review (genre convention compliance, comparable titles, market positioning), Genre Validation (genre expectation conformance), Publishing Readiness (comprehensive checklist), Series Consistency (cross-book continuity). Creative Engine — Blurb Generator, Synopsis Generator, Query Letter Generator. Verification Engine — Grammar check, Tone check, Reader Experience check. Memory Engine — state metadata update (status → complete/published).

## Input Requirements
Full narrative text (completed manuscript). Full Story State. Story DNA. Genre and audience metadata. For series: prior book Story States for consistency checking.

## Output
Publishing Package: Market Analysis (genre trends, comparable titles, positioning recommendations), Publishing Readiness Score (0-100 with per-dimension breakdown), Blurb (back-cover copy), Synopsis (submission-ready summary), Query Letter (agent/publisher pitch), Marketing Materials (target audience, hook, comparable titles), and Format-specific export (markdown, plain text).

## Constraints
Critical issues (genre violations, incomplete arcs, unresolved mysteries) block publishing readiness score. Readiness score >= 80 required for greenlight. Market mismatch suggestions are advisory — author retains final decision. Series consistency requires prior book data for cross-volume checking.
