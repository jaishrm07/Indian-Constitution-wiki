# Source Research

This project needs a source strategy that is stronger than a normal content site. The site is about constitutional text, constitutional doctrine, and current constitutional disputes. That means the quality bar is closer to a legal reference product than a blog.

## Bottom line

The best data pipeline is a tiered one:

1. Use official legal and institutional sources as the canonical layer.
2. Use high-quality policy explainers to add structure and context.
3. Use journalism mainly for chronology, reactions, and public framing.

The site should never publish a constitutional claim without an anchor back to the Constitution text or another official record.

## Best sources by content type

### 1. Constitution text and amendment text

Best sources:

- India Code: https://www.indiacode.nic.in/
- India Code Constitution handle: https://www.indiacode.nic.in/handle/123456789/16124?locale=hi
- Legislative Department: https://www.legislative.gov.in/
- Legislative Department 2024 Constitution PDF: https://www.legislative.gov.in/static/uploads/2025/08/cb1b190ea633a1746368ed1fac35fb30.pdf
- eGazette of India: https://www.egazette.nic.in/

Why these matter:

- India Code is an official repository for central legislation and official constitutional text.
- The Legislative Department publishes updated Constitution compilations and legislative publications.
- eGazette is the best place to verify notification and commencement details for Acts and related statutory instruments.

How to use them:

- Normalize the Constitution into local, versioned records for Articles, Parts, and Schedules.
- Track the publication date of the upstream official PDF used for extraction.
- Use eGazette as the final verification source for amendment enactment and notification details when relevant.

Operational note:

- These sources are reliable, but they are still often PDF-first. The product should expect extraction and cleanup work instead of assuming a clean API.

### 2. Supreme Court and High Court judgments

Best sources:

- Supreme Court of India: https://www.sci.gov.in/
- eSCR: https://scr.sci.gov.in/
- Judgments and Orders portal: https://judgments.ecourts.gov.in/
- NJDG: https://njdg.ecourts.gov.in/hcnjdg_v2/

Why these matter:

- The Supreme Court site is the primary official source for Supreme Court judgments, orders, and court publications.
- eSCR helps with reported judgment retrieval and citation-oriented lookup.
- The Judgments and Orders portal gives official access to Supreme Court and High Court judgments.
- NJDG is valuable for pendency and systems data, especially for explanatory pieces about the judiciary as an institution.

How to use them:

- Treat official court-hosted PDFs and portals as the authoritative case-text layer.
- Store case metadata locally: title, citation, date, court, linked Articles, linked Topics, and source URL.
- Use NJDG for statistics and institutional dashboards only. Do not use it to summarize holdings.

Operational note:

- Search works, but these systems are not consistently exposed as developer-friendly public APIs. A semi-manual ingestion workflow is realistic and defensible.

### 3. Parliamentary history, debates, and bill tracking

Best sources:

- Sansad: https://sansad.in/
- Parliament Digital Library: https://eparlib.sansad.in/

What these cover well:

- current bill status
- parliamentary questions
- committee information
- historical debates
- Constituent Assembly Debates
- committee reports
- historical legislative material

Why these matter:

- For current constitutional developments, Sansad is the right place to track bills, business papers, and parliamentary questions.
- For foundational interpretation and research value, the Parliament Digital Library is one of the strongest assets in the stack because it contains Constituent Assembly debates and deep parliamentary archives.

How to use them:

- Link amendment pages to bill records and committee reports where possible.
- Use Constituent Assembly debates to enrich topic pages and historical explainers.
- Use parliamentary questions and committee reports as institutional evidence, not as substitutes for enacted text.

Operational note:

- Parliamentary data is valuable but often scattered across PDFs and archive systems. Metadata quality is uneven, so internal normalization matters.

### 4. Election, executive, and institutional current affairs

Best sources:

- Election Commission of India: https://eci.gov.in/
- Press Information Bureau: https://pib.gov.in/
- Law Commission of India: https://lawcommissionofindia.nic.in/

Why these matter:

- ECI is a primary source for election notifications, press notes, manuals, and statistical reports.
- PIB is useful for timely official announcements and ministry statements.
- Law Commission reports and consultation papers are strong background material when a constitutional issue intersects with reform proposals or longstanding debates.

How to use them:

- Use ECI first for election-related constitutional content tied to Articles like 324.
- Use PIB to verify what the government formally announced, then pair it with the relevant bill, notification, constitutional provision, or judgment.
- Use Law Commission material to deepen explainers, not as a substitute for enacted law or judicial holdings.

Operational note:

- PIB is useful, but it is not the constitutional source of truth. It is a statement layer, not the legal text layer.

### 5. Machine-readable public datasets

Best source:

- Open Government Data Platform India: https://www.data.gov.in/
- Government Open Data License page: https://www.data.gov.in/Godl

Why this matters:

- data.gov.in is the best official place to look for machine-readable public datasets and APIs when a ministry or institution has published them.
- It is especially useful for statistics, dashboards, and supporting civic data.

How to use it:

- Use it selectively for quantitative pages, dashboards, and background datasets.
- Do not treat it as a source for constitutional text, amendment wording, or case holdings.

Operational note:

- The platform supports machine-readable data in principle, but constitutional and judicial source material still often lives outside this ecosystem in PDF-first portals.

## Best secondary source

Use PRS Legislative Research as the preferred secondary layer:

- PRS: https://prsindia.org/

Why PRS is valuable:

- It is better structured than most media coverage.
- It is particularly useful for bill summaries, amendment background, and institutional explainers.

Rule:

- PRS can shape the editorial frame, but official text should still be the source of record.

## Current-affairs monitoring websites

The best websites to monitor for constitutional current affairs are:

- PRS Legislative Research: https://prsindia.org/
- Supreme Court Observer: https://www.scobserver.in/
- Live Law: https://www.livelaw.in/
- Bar and Bench: https://www.barandbench.com/
- Vidhi Centre for Legal Policy: https://vidhilegalpolicy.in/

Use pattern:

- use official institutional sources as the publication anchor
- use PRS and Supreme Court Observer as the strongest structured secondary layer
- use Live Law and Bar and Bench mainly for early detection and monitoring

Detailed guidance is in `docs/current-affairs-websites.md`.

## Sources to use carefully

Useful for discovery, not as the final authority:

- general news coverage
- legal blogs
- Indian Kanoon
- Wikipedia

These can help surface topics, but published pages on this site should move from discovery sources to official source records before they go live.

## Recommended source hierarchy for the site

### Tier 1: canonical

- Constitution text from India Code and the Legislative Department
- notified and enacted text from eGazette
- judgments from Supreme Court and eCourts official portals
- parliamentary records from Sansad and the Parliament Digital Library
- institutional records from ECI

### Tier 2: structured explanatory

- PRS Legislative Research
- Law Commission reports

### Tier 3: context and chronology

- reputable journalism
- official press releases through PIB

## Product implications

This research changes the product architecture in a few ways:

1. Every page needs explicit source slots, not a single generic footnote area.
2. Every interpretive page should link back to Article, Part, or Schedule anchors.
3. A source registry is not optional. It is part of the product infrastructure.
4. PDF ingestion and cleanup are core capabilities for this site.
5. The editorial workflow has to distinguish between legal authority, institutional statement, and secondary explanation.

## Recommended ingestion strategy

### Constitution and amendments

- maintain a local normalized corpus for Articles, Parts, and Schedules
- store upstream official source URL and publication date
- record amendment relationships explicitly

### Cases

- maintain a local case index with official URLs
- store citations, dates, court, linked constitutional provisions, and short editor-reviewed summaries
- use official PDFs or court portals as the canonical source of record

### Current affairs

- require at least one constitutional text anchor
- require at least one official institutional source
- allow secondary sources only for chronology or broader context
- add status fields such as ongoing, resolved, or archived

## Immediate next steps

1. Keep expanding the source registry in `src/content/sources/`.
2. Normalize the Constitution text against a clearly dated official upstream edition.
3. Build a repeatable extraction workflow for constitutional text and judgment metadata.
4. Treat source provenance as first-class metadata across the site.
5. Follow the editorial cadence and review checklist in `docs/editorial-operations.md` when source changes need to become published updates.
