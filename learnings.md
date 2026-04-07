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

### 45. Cross-country demography needs one official baseline and an explicit date convention

When comparing countries, the hard part is not finding a number but keeping the dates and definitions aligned. The UN `World Population Prospects` files are unusually useful because they expose annual mid-year population, growth, fertility, age, natural change, and migration in one schema across countries. For this project, any cross-country population comparison should state the exact reference date, for example `1 July 2026`, and whether the figure is an estimate or a projection rather than mixing clocks, census years, and modelled mid-year series.

### 45. Source transparency requires more than listing sources — it requires telling readers how to use them

Adding source slugs to frontmatter is not enough for a trust-heavy legal reference site. Readers need to know which specific claim each source supports and exactly how to retrieve the primary document. A "Sources and how to verify" section that names the eSCR citation, explains what the source proves, and identifies the exact sections to read transforms a passive bibliography into an active verification guide.

### 46. Case pages need retrieval instructions, not just citations

A citation like "(1973) 4 SCC 225" is not self-explanatory to most readers. Adding a dedicated "How to find the judgment" section that names the portal (eSCR), gives the citation, and points to the most-cited sections turns a reference tag into a usable research instruction. For long multi-opinion judgments like Kesavananda, knowing which opinion is authoritative is as important as knowing the citation.

### 47. Amendment pages need three distinct layers: what changed, why it happened, and what effect it had

An amendment page that only describes the amendment is incomplete. The political and constitutional context explains why the amendment was enacted — usually a Supreme Court judgment, a political crisis, or a social reform imperative. The long-term effect explains how the amendment was subsequently interpreted, challenged, or corrected. Without all three layers, readers cannot understand amendments as events in constitutional history rather than static text changes.

### 48. Institution pages should behave like operating consoles, not encyclopedia entries

An institution page becomes genuinely useful when it answers three questions: what is the institution's constitutional design, what live issues is it currently involved in, and how should a reader monitor it? A description of powers is only the starting point. Connecting the institution to active current-affairs desks, current case law, and monitoring sources makes the page a live tool rather than a historical reference.

### 49. Timeline entries are the knowledge graph's chronological spine
Timeline entries that list only a date and a verdict are navigational dead ends. Entries that include what happened, why it mattered constitutionally, and what doctrinal legacy it left transform the timeline into constitutional history a reader can actually traverse. Chronological depth is not decorative — it is how users connect a landmark judgment to its political moment and to the cases that followed from it.

### 50. Glossary entries are the reading aids that unlock dense content
A user who cannot parse "basic structure doctrine" or "collegium system" cannot use the rest of the site effectively. Thin glossary entries therefore defeat their own purpose. Deep entries that include how courts have applied the concept and why it remains contested today function as the site's interpretive scaffolding, reducing the barrier to every other page that references the term.

### 51. Parts and Schedules pages carry interpretive weight that article pages cannot carry alone

A Part III page that simply links its constituent articles is not doing enough. A well-written Part page explains why those articles should be read as a unified scheme, identifies the cases that have tested the Part's outer limits, and names the live debates that currently strain it. That interpretive framing is the work individual article pages are structurally unable to perform.

### 52. Source records should be wired to the case files that discuss them

Listing sources in a registry is necessary but not sufficient. Wiring judgment-specific source records into the frontmatter of the matching case file makes traceability transparent at the point of use, so a reader can see from the case page itself which official record supports each claim. This matters most for multi-opinion judgments where different opinions support different propositions and a separate methodology document is too far removed from the content to be useful.

### 53. Sub-classification and the SC/ST reservation evolution

After Davinder Singh (2024), the doctrine that SC/ST categories are internally homogeneous is definitively overruled — states now need empirical data to sub-classify. The doctrinal arc runs Champakam Dorairajan (1951) → Indra Sawhney (1992) → M. Nagaraj (2006) → Jarnail Singh (2018) → Davinder Singh (2024). Every reservation article page benefits from referencing this complete chronology.

### 54. The money bill controversy requires dedicated coverage on the Article 110 page

The Aadhaar Act money bill certification controversy (Justice Chandrachud's dissent in Puttaswamy Aadhaar 2018), the Finance Act money bill amendments to IBC and PMLA, and subsequent Constitution Bench references make Article 110 one of the most actively disputed procedural articles. The standard treatment for Part V Parliament articles must prioritize this controversy.

### 55. Fiscal federalism coverage needs three distinct layers

GST Articles (246A, 269A, 279A) fundamentally changed Indian fiscal federalism. Finance article coverage needs: (1) what the provision means in pre-GST constitutional text; (2) how GST restructured its practical scope; (3) what remains live after GST — petroleum/alcohol, Finance Commission devolution, cess proliferation. Without all three layers, readers cannot understand the current fiscal constitution.

### 56. Part XXI special provisions are each historically specific

Articles 371–371J each require understanding the specific political compact that created them — Naga peace accord (371A), Mizo peace accord (371G), Manipur hill-plains divide (371C), Andhra Pradesh-Telangana tensions (371D/E), Sikkim accession (371F). This contextual specificity makes Part XXI articles denser to write than normal Part III or Part IV articles.

### 57. Ordinance re-promulgation is an underreported constitutional abuse

Krishna Kumar Singh v. State of Bihar (2017) — a seven-judge bench — is the definitive ruling that re-promulgating an ordinance without placing it before the legislature is constitutionally impermissible. The case should be prominently featured on all three relevant article pages: Article 123 (Union), Article 213 (State), and Article 239B (UT).

### 58. The collegium transparency improvement since 2017 is worth documenting

From 2017 the Supreme Court began uploading collegium resolutions to its website — a post-NJAC reform requiring no constitutional amendment. The Judicial Appointments desk should document this as a tracked transparency measure alongside the pending Memorandum of Procedure gap, so readers can see what has and has not changed since the NJAC judgment.

### 59. Current-affairs pages should be created for landmark pending Constitution Benches

Pending Constitution Benches as of 2026 include: CAA challenge (WP Civil 1474/2019+), FCRA restrictions on foreign funding to civil society, Article 370 statehood restoration, and Article 31B post-1973 Ninth Schedule review. Each is a distinct live desk entry — a pending bench that shapes constitutional expectations is as live as a recently decided case.

### 60. The Article 131 original jurisdiction page needs special depth

Article 131 is where federal disputes reach their only forum — the Supreme Court with exclusive jurisdiction. The "legal right" test it requires is stricter than it appears: the Court has repeatedly distinguished justiciable legal disputes (eligible) from political disagreements dressed as legal claims (excluded). This distinction has been central in water dispute cases, Article 356 proceedings, and GST Council disputes, and should be explained explicitly on the page.

### 61. A superior knowledge graph starts with typed edges, not prettier nodes

Graph quality degrades quickly when the site only stores generic backlinks and then tries to infer everything visually. The graph becomes materially more useful when relationships are first-class content with stable relation types such as `overrules`, `establishes`, `amends`, and `tracked-through`. Once those typed edges exist, the interface can support focused neighborhood views, shortest-path explanation, and better graph legend design without guessing what a connection means.

### 62. Default graph state should be curated, not complete

Showing the full constitutional network by default creates a hairball even when the underlying data is good. A better default is a curated overview of nodes that are especially central, explicitly connected, or structurally important. Readers can then drill into one-hop and two-hop neighborhoods or shortest paths when they actually need density.

### 63. Build-time graph normalization is the right fit for a static legal reference site

For this project, a static normalized graph payload generated from canonical content is more appropriate than introducing a graph database immediately. It keeps deployment simple, preserves source control over relationships, and still enables rich client-side interaction such as path search, typed-edge explanation, and mode-specific layouts. A graph database only becomes necessary once the product needs dynamic multi-user editing or much heavier query patterns.

### 64. Homepage graph and explorer graph should not use the same density budget

A homepage graph is a product statement, not a dumping ground for every valid edge in the corpus. The strongest default is a smaller backbone graph built around explicit doctrinal links plus their highest-signal constitutional anchors. The broader explorer can remain richer, but the first thing a user sees should optimize for legibility and trust, not raw coverage.

### 65. A graph becomes trustworthy only when it can explain its edges

Users do not trust a legal knowledge graph merely because the nodes look organized. They trust it when clicking an edge reveals the actual relation type, the note explaining the link, and the sources behind it. In practice this means the graph payload needs relation-level evidence, not just aggregate edge labels.
