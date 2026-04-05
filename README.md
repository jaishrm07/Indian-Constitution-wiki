# Constitution Atlas

Constitution Atlas is a static-first Astro site for the Indian Constitution. The current build is structured as a reference platform with a live current-affairs layer:

- `Articles` explain constitutional provisions in plain English
- `Parts` and `Schedules` preserve the constitutional structure around those Articles
- `Topics` group recurring themes like federalism and fundamental rights
- `Cases` connect landmark judgments back to Articles and doctrine
- `Amendments` track constitutional change over time
- `Current Affairs` pages explain ongoing issues through a constitutional lens
- `Glossary` and `Timeline` pages make the knowledge base easier to navigate

## Commands

```sh
npm install
npm run dev
npm run build
npm run preview
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

## Near-Term Roadmap

- expand constitutional coverage across all Articles and major amendment eras
- move search from a lightweight inline index to a dedicated static search solution
- strengthen source normalization for official PDFs, judgments, and parliamentary records
- prepare Cloudflare Pages deployment

## GitHub Pages Deployment

This repository is configured to deploy as a GitHub Pages project site from `main`.

1. In the repository settings, set `Pages` to use `GitHub Actions` as the source.
2. Push to `main`; the workflow in `.github/workflows/deploy.yml` builds the static site and publishes `dist`.
3. The Astro config automatically switches to the repository subpath when `GITHUB_PAGES=true`, so links and assets work under `/<repo-name>/`.

The deployed URL will follow the standard GitHub Pages project format:
`https://<owner>.github.io/<repo-name>/`
