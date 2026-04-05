# Constitution Atlas

Constitution Atlas is a static-first Astro site for the Indian Constitution. The current build is structured as a reference platform with a live current-affairs layer:

- `Articles` explain constitutional provisions in plain English
- `Topics` group recurring themes like federalism and fundamental rights
- `Cases` connect landmark judgments back to Articles and doctrine
- `Amendments` track constitutional change over time
- `Current Affairs` pages explain ongoing issues through a constitutional lens

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
├── cases/
├── topics/
├── amendments/
├── current-affairs/
└── sources/
```

Each entry uses frontmatter for metadata and Markdown for body sections. Relationships are represented with slugs so pages can surface backlinks automatically.

## Near-Term Roadmap

- add Parts, Schedules, glossary, and timeline collections
- move search from a lightweight inline index to a dedicated static search solution
- expand the editorial workflow for frequent current-affairs publishing
- prepare Cloudflare Pages deployment
