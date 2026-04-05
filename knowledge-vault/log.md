# Knowledge Log

Append new entries instead of rewriting history.

## [2026-04-04] scaffold | vault-initialized

- created `raw/` for immutable source capture
- created `knowledge-vault/` for Obsidian-compatible research notes
- added note templates, entity hubs, and operating documentation
- aligned the vault with the canonical publishing graph in `src/content/`

## [2026-04-04] seed | initial-real-notes

- added seed research notes for Article 19, Fundamental Rights, and Kesavananda Bharati
- added an official source note for the Constitution of India
- added a live issue note for One Nation, One Election
- linked the research graph back to the canonical site entities and official source stack

## [2026-04-04] seed | hub-notes

- added hub notes for Part III, Part XI, Part XX, and the Seventh Schedule
- added topic notes for Basic Structure and Federalism
- added a case note for S.R. Bommai
- added institution and source notes for Parliament, the Supreme Court, the Election Commission, and the Legislative Department

## [2026-04-04] sync | canonical-to-vault

- added a vault sync command that seeds missing research notes from `src/content/`
- backfilled the remaining mapped collections so the vault mirrors the canonical site content
- verified that `npm run vault:sync` is idempotent
- verified that `npm run vault:lint` now passes with full mapped coverage
