# Constitution Atlas

Constitution Atlas is a static-first Astro site for the Indian Constitution. The current build is structured as a reference platform with a live current-affairs layer:

- `Articles` explain constitutional provisions in plain English
- `Parts` and `Schedules` preserve the constitutional structure around those Articles
- `Topics` group recurring themes like federalism and fundamental rights
- `Cases` connect landmark judgments back to Articles and doctrine
- `Amendments` track constitutional change over time
- `Current Affairs` pages explain ongoing issues through a constitutional lens
- `Glossary` and `Timeline` pages make the knowledge base easier to navigate

Current corpus snapshot:

- `501` Articles
- `26` Parts
- `12` Schedules
- `24` Amendments
- `33` Cases
- `22` Topics
- `14` Current Affairs desks
- `48` Timeline entries
- `10` Institutions
- `13` Glossary entries
- `30` Source records

## Commands

```sh
npm install
npm run dev
npm run build
npm run preview
npm run content:lint
npm run vault:sync
npm run vault:lint
```

## Content Model

Content lives in `src/content/` and is typed through `src/content.config.ts`.

```text
src/content/
├── articles/
├── parts/
├── schedules/
├── cases/
├── topics/
├── institutions/
├── glossary/
├── amendments/
├── timeline/
├── current-affairs/
└── sources/
```

Each entry uses frontmatter for metadata and Markdown for body sections. Relationships are represented with slugs so pages can surface backlinks automatically.

## Research Notes

- `docs/source-research.md` tracks the source hierarchy and data acquisition plan for official constitutional, judicial, parliamentary, and current-affairs material.
- `docs/knowledge-system.md` explains how research, raw sources, the Obsidian-style vault, and the publishable site content fit together.
- `learnings.md` is a running log of product and editorial lessons from building a knowledge-intensive constitutional reference site.
- `raw/` is the immutable evidence layer for source captures and extraction artifacts.
- `knowledge-vault/` is the Obsidian-compatible research graph.

## Current Guardrails

- `npm run content:lint` verifies that relationship fields only point to existing slugs
- `npm run vault:sync` backfills missing research notes from canonical content
- `npm run vault:lint` checks mapped coverage between `src/content/` and `knowledge-vault/`

## Next Priorities

- deepen remaining case-law gaps in election law, minority-rights doctrine, and judicial process
- keep the current-affairs desk on a real review cadence using official process trails
- enrich the timeline and amendment layers without reintroducing duplicate concept pages
- keep tightening source normalization for official PDFs, judgments, and parliamentary records

## GitHub Pages Deployment

This repository is configured to deploy as a GitHub Pages project site from `main`.

1. In the repository settings, set `Pages` to use `GitHub Actions` as the source.
2. Push to `main`; the workflow in `.github/workflows/deploy.yml` builds the static site and publishes `dist`.
3. The Astro config automatically switches to the repository subpath when `GITHUB_PAGES=true`, so links and assets work under `/<repo-name>/`.

The deployed URL will follow the standard GitHub Pages project format:
`https://<owner>.github.io/<repo-name>/`
