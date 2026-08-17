---
node_type: schema
status: live
audited: 2026-08-17
---

# Closed map schema

Every object, process, schema, and effect card uses YAML frontmatter with:

node_type: object | process | schema | effect | contract | catalog
universe: live | leftover | ghost
status: verified | stale | documented-only | live
audited: YYYY-MM-DD
snapshot: branch @ commit

Catalog and folder-contract files may omit universe when the file itself is the routing or contract layer; their status and audit snapshot still apply.

## Node types

- object: a noun, durable file, type, table, artifact, or UI surface.
- process: a movement that actually runs or is actually followed.
- schema: a shape or constraint owned by code, SQL, or configuration.
- effect: a change-impact index; it catalogs links and does not duplicate waterfalls.
- contract: a folder-level walking agreement.
- catalog: a small routing file.

## Universe rules

- live means the repository implements the claim.
- leftover means the item remains but is not the main path.
- ghost means the item is named or documented but not wired; do not implement against it without new source evidence.

## Citation rules

Use the smallest source owner and a line anchor when practical. Code and migrations outrank prose. A planning document may establish a documented-only shape, but cannot establish runtime behavior by itself.
