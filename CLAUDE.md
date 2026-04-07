# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Constitution Atlas is a static Astro site for the Indian Constitution — a reference platform with articles, cases, amendments, institutions, topics, and a live current-affairs layer.

## Commands

```sh
npm run dev             # Start dev server
npm run build           # Build site + generate pagefind search index
npm run preview         # Preview production build
npm run content:lint    # Verify all relationship slug references resolve (run before merging content batches)
npm run vault:sync      # Seed missing knowledge-vault notes from canonical content (non-destructive)
npm run vault:lint      # Check coverage between src/content/ and knowledge-vault/
npm run constitution:sync  # Sync constitution corpus
```

## Architecture

### Three-layer knowledge system

| Layer | Path | Purpose |
|---|---|---|
| Raw captures | `raw/` | Immutable source files and PDFs — never publish directly |
| Research vault | `knowledge-vault/` | Obsidian-compatible exploratory notes, entity notes, source summaries |
| Canonical content | `src/content/` | Typed, reviewed content that drives the website |

Direction of truth: `official source → raw capture → research note → canonical content → site page`

### Astro content collections

Defined in `src/content.config.ts` with Zod schemas. All relationships use slug arrays for automatic backlink resolution.

| Collection | Key fields |
|---|---|
| `articles` | `number`, `part`, `partSlug`, `plainEnglish`, `officialText`, `relatedArticles` |
| `cases` | `citation`, `year`, `court`, `issue`, `holding`, `significance` |
| `amendments` | `number`, `year`, `compareProfile` (5-dimension strategic analysis), `compareHighlights` |
| `current-affairs` | `eventDate`, `publishedAt`, `updatedAt`, `status` (ongoing/resolved/archived), `issueTypes`, `trackingLanes`, `watchFor` |
| `timeline` | `date`, `category` (founding/amendment/case/crisis/rights/federalism), optional `relatedCollection`+`relatedSlug` |
| `sources` | `sourceType` (official/court/policy/reference), `tier` (primary/secondary/supporting) |
| `institutions` | `institutionType` (court/parliamentary-body/constitutional-office/election-authority/executive/legislative-office) |

### Routing and utilities

- `src/pages/` — file-based routing; one directory per collection plus `graph/`, `search/`, `timeline/`, `about/`, `methodology/`
- `src/lib/content.ts` — cross-collection helpers: `resolveBySlugs()`, `filterByRelationship()`, `sortArticles()` (handles "243ZD"-style numbering), `getEntryHref()`, `withBase()`
- `src/lib/site.ts` — site nav and metadata
- `astro.config.mjs` — static output; base path switches to `/<repo-name>/` when `GITHUB_PAGES=true`

### Search

Pagefind is run post-build (`pagefind --site dist`). The GitHub Actions workflow at `.github/workflows/deploy.yml` handles this automatically.

## Content authoring rules

- All relationships (articles, cases, topics, etc.) use slug strings that must resolve — run `npm run content:lint` to verify.
- Do not publish from `raw/` or `knowledge-vault/` without normalizing into `src/content/`.
- Preserve source provenance: carry upstream URL, source date, and tier in `sources` frontmatter.
- Every explanation of law, power, or doctrine should reference relevant constitutional text.
- Update `learnings.md` when discovering reusable product, editorial, or engineering lessons.
- When adding a meaningful new source: store in `raw/`, summarize in `knowledge-vault/`, update relevant notes, then update `src/content/`, and append to `knowledge-vault/log.md`.
