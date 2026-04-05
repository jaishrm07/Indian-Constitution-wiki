# Knowledge Operations

This repository contains both a publishable constitutional site and the beginning of a research knowledge system. Treat them as related but distinct layers.

## Layers

1. `raw/`
   - immutable source captures
   - PDFs, clippings, extracted text, source notes
   - never treated as publish-ready interpretation
2. `knowledge-vault/`
   - Obsidian-compatible research graph
   - exploratory notes, entity notes, issue notes, source summaries
   - useful for discovery, synthesis, and backlink navigation
3. `src/content/`
   - canonical publishing graph
   - typed, reviewed, source-controlled content for the website

## Core rules

- Official constitutional or institutional sources come before secondary summaries.
- Any page that explains law, power, doctrine, or a live controversy should point back to relevant constitutional text.
- Do not publish directly from `raw/` or `knowledge-vault/` without normalization into `src/content/`.
- Preserve source provenance. When possible, carry upstream URL, source date, and source tier.
- Keep `learnings.md` updated when the project uncovers reusable product, editorial, or engineering lessons.

## Operations

### Ingest

When adding a meaningful new source:

1. store the source or a reference to it in `raw/`
2. summarize and relate it inside `knowledge-vault/`
3. update relevant entity/topic/issue notes
4. add or update canonical records in `src/content/` if the source changes what should be published
5. append an entry to `knowledge-vault/log.md`
6. update `knowledge-vault/index.md` if new durable notes or entities were created

### Query

When answering a project question:

1. consult the maintained knowledge layer first
2. use raw sources to verify, deepen, or correct
3. file durable syntheses back into the knowledge system instead of leaving them only in chat

### Lint

Periodically check for:

- orphan notes
- missing backlinks
- stale claims
- unsupported assertions
- missing constitutional anchors
- source gaps
- duplicate entities under different names

Use `npm run vault:lint` to compare the canonical publishing graph against the research vault coverage for mapped collections.
Use `npm run vault:sync` to seed missing research notes from canonical content without overwriting notes that already exist.

## Preferred direction of truth

`official source -> raw capture -> research note -> canonical content -> site page`

## What not to do

- Do not let exploratory notes silently become public truth.
- Do not rely on memory or chat history as the only record of work.
- Do not treat community plugin behavior as a hard requirement for the publishing pipeline.
