# Learnings

This file is a running log of what the project is teaching us about building a knowledge-intensive constitutional website. It is written so it can later be published as product, editorial, or engineering notes.

## 2026-04-04

### 1. A constitutional website is not a normal content website

The site needs the reliability of a reference product, not the publishing habits of a blog. The moment a page explains rights, powers, institutions, or disputes, it enters a higher-trust category. That means sourcing, versioning, and cross-linking are product requirements, not editorial polish.

### 2. The Constitution text must be the spine of the product

Every interpretive page becomes stronger when it points back to the relevant Article, Part, or Schedule. This is not just a citation habit. It is an information architecture rule. Without that spine, the site turns into a loose essay collection and loses its authority.

### 3. A knowledge graph beats a flat archive

The useful unit is not just the page. It is the relationship between pages:

- Article to Topic
- Article to Case
- Article to Current Affair
- Amendment to affected provisions
- Case to doctrine

This structure makes the site more reusable, more searchable, and more defensible.

### 4. Official sources are strong, but rarely clean

The official sources are good enough to trust, but not always good enough to plug in directly. Government and court material is often PDF-first, portal-based, or inconsistent in metadata quality. That means extraction and normalization are not a temporary inconvenience. They are a permanent part of the system.

### 5. “Current affairs” needs a narrower definition than most people think

For this site, current affairs should mean constitutionally relevant developments, not general news. That constraint is a strength. It keeps the site coherent and prevents the live layer from drowning the reference layer.

### 6. Source hierarchy needs to be enforced in the content model

It is not enough to say “use good sources.” The system should make that concrete:

- primary legal text
- primary institutional record
- secondary explanatory source

Once that hierarchy is visible in the content model, editorial discipline becomes easier to maintain.

### 7. A source registry is part of the product

The source list is not just internal documentation. It helps the team write better pages, makes the publishing process more repeatable, and can become public-facing trust infrastructure.

### 8. Search quality depends on normalized labels

Legal and civic users search in inconsistent ways: Article number, doctrine name, case title, common shorthand, or current event phrase. Good search depends less on one full-text index and more on consistently normalized labels, summaries, aliases, and cross-links.

### 9. Editorial neutrality benefits from structure

Neutrality is easier when every page must answer the same questions:

- what happened
- what constitutional issue is raised
- which provisions are implicated
- which cases matter
- what the current status is

That structure reduces drift into rhetoric or opinionated framing.

### 10. The build process itself is publishable knowledge

This project produces two outputs at once:

- the website
- the process knowledge for building trustworthy legal-reference products

That means learnings should be captured as they happen, not reconstructed later.

### 11. Research workflow and publishing workflow should be separate

The tool that helps an editor think is not always the right tool to publish from. Obsidian is strong for note-linking, source exploration, and relationship discovery, but the website still needs a canonical, typed, reviewable content graph in the repo.

### 12. “Semantic graph” can mean two different things

For editors, a semantic graph often means linked notes, backlinks, and visual exploration. For the product, it means typed entities and explicit relationships that code can trust. The site needs both, but they should not be conflated.

### 13. A maintained intermediate wiki is more valuable than raw-file RAG alone

One of the strongest ideas in Karpathy's `LLM Wiki` note is that raw documents should not be rediscovered and re-synthesized from scratch on every question. A maintained intermediate knowledge layer compounds value over time: better summaries, better cross-links, better contradictions tracking, and less repetitive work.

### 14. Knowledge systems need explicit operations

It helps to think in terms of a few repeatable operations:

- ingest
- query
- lint

That framing is useful for this project because it turns “research” into a maintainable workflow instead of an unstructured pile of pages and chats.

### 15. Indexes and logs are underrated infrastructure

An index helps humans and agents navigate the knowledge base. A log preserves chronology: what changed, what was ingested, and what was reviewed. These are simple files, but they become disproportionately useful as the knowledge system grows.

### 16. Coverage checks reduce invisible drift

Once the project has both a research graph and a canonical publishing graph, drift becomes easy: pages get published without matching research notes, or research notes accumulate without being normalized. A small lint pass that checks coverage is a cheap way to keep both layers aligned.

### 17. Backfilling research notes should be automated from the canonical layer

Once the site already contains structured, reviewed content, manually recreating that structure in a research vault is wasted effort. A sync script that seeds missing notes from canonical records is faster, more consistent, and less error-prone than hand-copying summaries.

### 18. The live layer needs a source stack, not a single source

For constitutional current affairs, no single website is enough. Official institutional sources are best for authority, PRS and Supreme Court Observer are best for structured tracking, and legal-news sites are best for early monitoring. Treating those as different jobs makes the live layer both faster and more trustworthy.

### 19. Product research from adjacent communities is unusually useful here

GitHub, Reddit, and X are not constitutional authorities, but they are useful product signals. GitHub reveals mature building blocks like static search, diff rendering, and graph visualization. Reddit surfaces what readers actually struggle with, especially around case comprehension and note-linking. X clarifies where lightweight live embeds can fit without displacing official sources.

### 20. Relationship visibility is part of trust

When a site claims to be a knowledge system, users should be able to see the relationships, not just trust that they exist under the hood. A public graph explorer turns the internal content model into a reader-facing navigation tool and makes the product feel closer to a reference system than a content archive.

### 21. Legal readers benefit from “quick brief” layers

Dense legal pages become more usable when the top of the page answers a few immediate questions before asking the reader to parse full prose. In practice that means issue, holding, and significance should be visible at a glance, especially on case pages.

### 22. Static search becomes much more valuable when it knows the schema

Full-text search alone is not enough for a constitutional site. Once the search index knows which pages are Articles, cases, amendments, institutions, or current-affairs explainers, users can narrow quickly instead of sifting through mixed results. The improvement comes less from raw search power than from explicit metadata and filters.

### 23. Indexing fewer pages can improve search quality

Not every page should be searchable. Homepages, list pages, and utility pages can pollute a reference search experience if they compete with the actual canonical entries. Restricting the search index to real content pages makes the results cleaner and easier to trust.

### 24. Shareable filter URLs are part of discoverability

Once filters are reflected in the URL, search stops being only a lookup box and becomes a navigable interface. That matters for editorial products because you can link directly to “all amendment pages touching federalism” or “all ongoing issues involving Parliament” without creating separate custom landing pages for every slice.

### 25. A live constitutional desk should track institutions and text, not only headlines

Current-affairs pages become much more useful when the reader can immediately see three things:

- which constitutional provisions anchor the issue
- which institutions are in the conflict
- which official sources should be watched first

That turns the live layer into a maintained desk rather than a stream of essays.

### 26. Issue chronology and constitutional chronology are different jobs

For live issues, it helps to separate short-term desk chronology from the longer constitutional timeline. Readers need both, but they answer different questions. One explains what is happening now and when the page was reviewed; the other shows the deeper constitutional arc that makes the issue intelligible.

### 27. Institution pages become more valuable when they act like operating consoles

A reader often arrives at an institution page because they want to know where power is currently being exercised or contested. That means the page should surface live disputes, constitutional anchors, and the right monitoring sources immediately. If it behaves only like an encyclopedia entry, it underuses the structure already present in the knowledge graph.

### 28. Source transparency should be navigable from the top level

For a trust-heavy product, the source registry cannot stay hidden in methodology pages. Readers should be able to move directly from the main navigation into the source layer, inspect the source stack, and see how individual sources are used across Articles, cases, amendments, and current-affairs explainers.

### 29. Topic pages should act like dossiers, not categories

A strong constitutional topic page does more than group links. It should answer which institutions operationalize the topic, which provisions anchor it, which cases define it, and which live issues currently test it. Once those layers are visible, the topic stops being a taxonomy label and starts behaving like a reusable briefing document.

### 30. Content depth should follow live-pressure clusters

When deciding what to add next, the best guide is not abstract completeness. It is the set of constitutional clusters already under live pressure on the site. Adding Articles 163, 174, 200, and 201 is especially valuable because those provisions immediately strengthen governor-state disputes, anti-defection coverage, state-legislature hubs, and federalism dossiers all at once.

### 31. Thin topic pages usually hide missing article series, not missing prose

When a topic feels weak, the first fix is often to add the missing constitutional series around it rather than rewriting the topic summary. Secularism became materially stronger once Articles 26, 27, and 28 were added alongside the cases that readers actually need to understand them. The same pattern will likely repeat across other weak dossiers.

### 32. Some weak dossiers are graph problems, not content problems

A topic can look shallow even when the site already has the necessary material. Free speech and privacy improved simply by tagging Article 19, Article 21, and the relevant cases more accurately. Before adding new pages, it is often worth checking whether the graph already contains the answer but the relationships are too sparse for the UI to reveal it.

### 33. Editorial operations need their own documented cadence

When a constitutional site starts tracking live developments, the team needs a repeatable operating rhythm. Daily triage, weekly source review, monthly doctrine refreshes, and quarterly archival cleanup are more realistic than ad hoc publishing because they match the pace of constitutional change without encouraging churn.

### 34. Issue templates are part of editorial quality control

Maintainers should not have to remember the review shape for every new constitutional issue. A structured issue template for current-affairs updates and another for source review make the workflow explicit: constitutional question, official source, related anchors, and verification status. That reduces drift and makes handoffs cleaner.

### 35. Source review should answer what the source proves, not just where it lives

In a knowledge-heavy legal product, a source is only useful when the team knows its role in the stack. The source review process should force a decision: what this source establishes, what it cannot establish, and whether it should remain primary, secondary, or archival. That keeps source sprawl under control.

### 36. Relationship linting is mandatory once the graph gets large

As the corpus expands, broken slugs stop being edge cases and start becoming silent product defects. A content graph needs its own integrity check, separate from build success, because pages can still render while semantic links quietly fail. A dedicated reference-lint step becomes part of editorial quality control.

### 37. Coverage expansion exposes hidden taxonomy gaps

Adding more amendments and current-affairs pages does not only increase volume. It also reveals whether the topic system is actually complete enough to absorb that growth. Missing topic hubs such as representation, parliamentary procedure, or education rights can make a large corpus feel inconsistent even when the underlying pages are individually sound.

### 38. Current-affairs coverage improves fastest when it follows official process trails

The strongest constitutional live desks are the ones that can be anchored to an institutional process the reader can actually monitor: a bill text on Sansad, a court judgment PDF, a collegium resolution, a Department of Justice notification, or an Election Commission publication. That creates update discipline because the desk can be refreshed by checking a known source trail rather than rediscovering the issue from scratch.

### 39. Some doctrine gaps only become obvious after the live layer matures

Once the current-affairs desk becomes richer, missing cases become easier to spot. Election-commission independence demands Anoop Baranwal, campaign-finance transparency demands the electoral-bonds ruling, and judicial-appointments coverage feels thin until the Second Judges Case and the NJAC judgment are both present. The live layer is therefore a reliable map of which doctrinal holes matter most to users.

### 40. Resolved constitutional crises should stay searchable if they define the next reform baseline

Some issues stop being live without stopping being operationally important. Electoral bonds are the clearest example: the scheme is gone, but any future political-finance regime will be designed in the shadow of that judgment, so the desk entry still matters as a baseline record.

### 41. Official-source precision matters more than early summary speed on live desks

Constitutional current-affairs pages become much more trustworthy when the status line is rebuilt from exact institutional dates rather than from memory or a secondary summary. Replacing rough descriptions with precise milestones such as a commencement date, a publication date, or a parliamentary extension order immediately improves both reader trust and future update discipline.

### 42. Research sync and research lint are separate phases, not parallel tasks

Once the site and the Obsidian-style vault both become canonical working layers, coverage automation has to reflect the workflow order. Sync must run before lint; otherwise the tooling reports false gaps even when the notes were generated correctly. For knowledge-intensive publishing systems, the pipeline order is part of data quality.

### 43. Live desks age first in their chronology, not in their constitutional framing

A well-framed current-affairs page can still become stale if its milestone chain stops one order or one committee extension too early. The constitutional question may remain sound, but reader trust depends on whether the status line reflects the latest official procedural step, especially for bills under committee scrutiny and litigation that keeps generating follow-on orders.

### 44. Election accountability is a product of public infrastructure, not just doctrine

Candidate-disclosure and criminalisation-of-politics coverage becomes much stronger when the site models the actual public infrastructure voters use, such as affidavit portals, KYC apps, disclosure press notes, and qualification timelines. That turns abstract election law into an operational accountability system readers can inspect and revisit.
