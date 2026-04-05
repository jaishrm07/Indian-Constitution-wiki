# Knowledge System

This project needs two related systems:

1. a **canonical publishing graph**
2. an **editor-friendly research graph**

They should not be the same thing.

## Recommendation

Use **Obsidian** for research, note-linking, and editorial discovery.

Keep the **website repo** as the canonical source of truth for anything that gets published.

If the project later needs heavy graph traversal or analysis, export the canonical graph to **Neo4j**. Do not start with Neo4j.

This mirrors the useful part of Karpathy's `LLM Wiki` pattern: keep immutable raw sources, maintain a persistent intermediate knowledge layer, and use a schema or operating document so the LLM behaves like a disciplined maintainer instead of a generic chat tool.

## Why this split is the right one

### Obsidian is strong for human research workflows

Obsidian works directly on local Markdown files, and its core features already fit this project well:

- Graph view for visual relationships
- Backlinks for incoming references and unlinked mentions
- Properties for structured metadata
- Bases for database-like views over notes and properties
- Aliases for alternate names and abbreviations

That makes it useful for:

- research notes
- source notes
- open questions
- issue mapping
- doctrine maps
- case-to-article exploration

### The repo is stronger for canonical publishing

The website already stores typed entities and relationships in `src/content/` and `src/content.config.ts`.

That gives us:

- typed collections
- predictable slugs
- build-time validation
- version control
- reviewable diffs
- a direct path to static publishing

That is a better canonical system than a note-taking tool.

### Neo4j is real graph infrastructure, but not needed yet

If we eventually want deeper queries like:

- all cases that touched Article 19 through free speech, privacy, and proportionality
- all current-affairs pages connected to a doctrine through multiple cases
- shortest paths between amendments, cases, and institutional topics

then a graph database becomes useful.

But right now it would add complexity before the editorial system is mature.

## What should live where

### Canonical publishing graph

This remains in the repo:

- `src/content/articles/`
- `src/content/parts/`
- `src/content/schedules/`
- `src/content/amendments/`
- `src/content/cases/`
- `src/content/topics/`
- `src/content/current-affairs/`
- `src/content/glossary/`
- `src/content/timeline/`
- `src/content/sources/`

These records should be treated as publishable, reviewed, and source-controlled.

### Obsidian research graph

This should hold:

- rough notes
- source extraction notes
- unresolved questions
- issue maps
- historical notes
- debate notes
- editorial planning notes

These notes are useful even when they are incomplete or unpublished.

## Recommended Obsidian model

Use a dedicated vault, not the raw `src/content` folder.

Suggested vault structure:

```text
knowledge-vault/
  entities/
    articles/
    parts/
    schedules/
    amendments/
    cases/
    topics/
    institutions/
    people/
  issues/
  sources/
  debates/
  timelines/
  drafts/
  templates/
  views/
```

## Required metadata for vault notes

Every serious note should use properties like these:

```yaml
---
type: article
slug: article-19
title: Article 19
aliases:
  - Freedom of speech
constitution_refs:
  - "[[Article 19]]"
related_cases:
  - "[[Shreya Singhal]]"
  - "[[Maneka Gandhi]]"
related_topics:
  - "[[Free Speech]]"
source_tier: primary
official_sources:
  - https://www.indiacode.nic.in/
status: reviewed
last_reviewed: 2026-04-04
---
```

The important point is consistency, not perfect completeness.

## Important rule

The Obsidian graph is not enough by itself.

Obsidian links are useful for navigation and discovery, but the actual site needs typed, predictable relationships. That means the semantic backbone should still be preserved in structured frontmatter and content schemas.

## Sync strategy

Use this direction of truth:

1. official source
2. raw source capture or source note
3. Obsidian research note
4. reviewed canonical content record in `src/content`
5. generated site pages

Do not make the live site depend directly on loose vault notes.

## Operating model

The most useful operational ideas from the `LLM Wiki` pattern are these:

### 1. Separate raw sources from maintained knowledge

The raw layer should be immutable:

- PDFs
- clipped articles
- scraped transcripts
- court documents
- committee reports

The maintained layer should be editable and synthesized:

- entity pages
- topic summaries
- doctrine notes
- issue explainers
- source summaries

This prevents the system from confusing evidence with interpretation.

### 2. Define repeatable operations

The knowledge system should support a small number of explicit operations:

- **ingest**: read a new source, summarize it, extract entities, update related notes
- **query**: answer a question from the maintained knowledge layer, not from raw source rediscovery every time
- **lint**: look for contradictions, stale claims, missing backlinks, orphan pages, and unsupported assertions

That is much stronger than relying on memory or one-off chats.

In this repo, a first maintenance command now exists:

- `npm run vault:lint`

It compares selected canonical content collections against the Obsidian-compatible research vault and reports missing research notes and orphan notes.

A companion bootstrap command also exists:

- `npm run vault:sync`

It creates missing vault notes from canonical site content without overwriting notes that already exist. This is the right way to seed broad coverage while preserving manually improved notes.

### 3. Maintain an index and a log

Two files are especially useful:

- `index.md`: a navigational catalog of important notes, entities, and pages
- `log.md`: an append-only timeline of what was added, changed, ingested, or reviewed

For this project, those ideas translate well into:

- a research index inside the Obsidian vault
- a content/source registry inside the repo
- a learnings log for product and editorial insights

### 4. Preserve compounding knowledge

If an answer, comparison, or synthesis is useful once, it should be filed back into the knowledge system. Otherwise good work dies in chat history and must be rediscovered later.

For this project, that means:

- current-affairs explainers should enrich topic pages
- case reading notes should improve doctrine pages
- source extraction notes should update entity pages
- product insights should go into `learnings.md`

## What not to do

- Do not use Obsidian as the only database for the website.
- Do not make community plugins a hard dependency for the publishing pipeline.
- Do not rely on symlinks between vaults and site content as a core workflow.
- Do not let exploratory notes become publishable pages without review and normalization.
- Do not answer every new question by re-reading raw sources from scratch if the maintained knowledge layer should already contain the answer.

## Practical decision

The best stack for this project is:

- **Obsidian** for research and semantic exploration
- **Astro content collections** for the canonical publishing graph
- **source registry + learnings** for editorial infrastructure
- **Neo4j later** only if we genuinely need graph analytics or complex traversals

## Next build step

If the project is adding live content or sources, follow the operating cadence in `docs/editorial-operations.md` alongside the knowledge-system rules above.
The Obsidian-compatible vault structure and sync rules are now scaffolded in:

- `raw/`
- `knowledge-vault/`
- `AGENTS.md`

The next practical step is to start using this system for real ingests and to promote reviewed knowledge into `src/content/`.
