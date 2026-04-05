# Product Signals: GitHub, Reddit, and X

Date: 2026-04-04

This note captures product ideas gathered from GitHub projects, Reddit discussions, and X platform documentation, then translates them into concrete improvements for Constitution Atlas.

## What GitHub suggests

### 1. Static search should be treated as a first-class system

[Pagefind](https://github.com/Pagefind/pagefind) is built specifically for static sites, and its docs expose support for metadata, filtering, sorting, and even multisite search:

- metadata: <https://pagefind.app/docs/metadata/>
- filtering: <https://pagefind.app/docs/filtering/>
- multisite search: <https://pagefind.app/docs/multisite/>

Implication for this project:

- replace the current lightweight search with a typed search index
- filter by collection, status, institution, and topic
- keep room for future cross-site search if the project later splits into a public reference site and an editorial desk

### 2. Relationship graphs are product features, not internal-only tools

[Cytoscape.js](https://github.com/cytoscape/cytoscape.js) is a mature graph-visualization library used to inspect networks. That maps directly onto this project’s strongest structural advantage: the site already has typed links between provisions, cases, institutions, amendments, and live issues.

Implication for this project:

- expose the semantic graph to readers, not just editors
- let users start from an Article, case, or institution and move through neighboring nodes
- use the graph as a discovery layer for doctrine and current affairs

### 3. Constitutional change should eventually be explorable as a diff

[diff2html](https://github.com/rtfpessoa/diff2html) is a mature HTML diff renderer. It suggests a strong future feature: before/after compare views for amendments, doctrines, or policy proposals.

Implication for this project:

- add amendment compare pages later
- show what changed in text, not just in prose
- use this especially for Article 368 debates and major structural amendments

### 4. Git-backed editorial tooling is a real option

[Pages CMS](https://github.com/pagescms/pagescms) is a Git-backed CMS that manages content directly in a GitHub repository.

Implication for this project:

- once the content volume grows, a lightweight editorial UI can be added without giving up Git history
- this is a stronger fit than a heavy CMS if the team remains small and technical

## What Reddit suggests

### 1. Readers want faster case understanding

Legal readers repeatedly gravitate toward case briefs, concise rule statements, and structured summaries rather than long uninterrupted prose. That is especially true when they are revising or comparing multiple cases.

Implication for this project:

- every case page should open with a quick brief
- the structure should make it obvious what the issue was, what the Court held, and why the case still matters

### 2. Graphs are only useful when the links are meaningful

Obsidian users consistently point out that a knowledge graph becomes useful only when the notes are purposefully linked instead of forming a decorative “ball of string.”

Relevant Reddit threads:

- GraphRAG over Obsidian notes: <https://www.reddit.com/r/ObsidianMD/comments/1jc0vl2/a_portable_graphrag_for_your_obsidian_notes_how_i/>
- knowledge graph usefulness discussion: <https://www.reddit.com/r/ObsidianMD/comments/1ax7833/knowledge_graph_everyones_favorite_questionably/>

Implication for this project:

- graph edges should correspond to real constitutional relationships
- the graph should be derived from canonical content, not generated loosely from text similarity
- search, filters, and node detail matter more than pure visual density

## What X suggests

X is not a constitutional source of record, but its official website tooling confirms that public posts and timelines can be embedded:

- embed posts help page: <https://help.x.com/en/using-x/how-to-embed-a-post>
- developer platform overview: <https://docs.x.com/overview>

Implication for this project:

- embed verified institutional posts only as supplemental live context
- never treat X posts as the authoritative source of constitutional meaning
- use embeds for “live updates” around Parliament, the Supreme Court, ECI, or government announcements after the relevant official source page is already linked

## Improvements implemented in this pass

- added a public-facing relationship explorer so the knowledge graph is visible to readers
- improved case pages with a fast case-brief layer at the top
- added the relationship explorer to navigation and site discovery
- replaced the lightweight search page with a Pagefind-backed static search layer
- added typed filters for content type, topic, status, institution, and timeline category
- made amendment discovery shareable through filterable search links

## Next product improvements

1. Add amendment compare views using a diff renderer.
2. Add institution-level monitoring pages that surface current affairs, source feeds, and key constitutional anchors together.
3. Add more structured case metadata so users can scan doctrine faster.
4. Add saved searches or editorial dashboards once publishing volume increases.
