---
node_type: contract
status: live
audited: 2026-08-20
snapshot: main @ ed26b07 + working tree
---

# Map contract

## Purpose

Map the nouns, live movements, schemas, and first-order change impact of the ThoraxScan repository. The map is a catalog over the repository, not a second product specification.

## Inputs

- Runtime source: ../src/
- Database source: ../supabase/migrations/ and ../supabase/config.toml
- Product assets: ../public/
- Repository contracts: ../AGENTS.md, ../CLAUDE.md, ../package.json, ../README.md
- Stable references: the six original planning/design documents in this folder

## Walk order

1. Start at [CLAUDE.md](CLAUDE.md) or the identical [AGENTS.md](AGENTS.md).
2. Use [objects/_index.md](objects/_index.md) to select one noun; read only that card and its See source.
3. For a behavior change, open [processes/CONTEXT.md](processes/CONTEXT.md) and then the relevant process card.
4. Before editing, open [effects/CONTEXT.md](effects/CONTEXT.md) for the change target.

## Contract

- A live claim requires a source citation and an audit snapshot.
- A ghost claim is documented or named but not wired; it must not be treated as current behavior.
- A leftover claim remains in the tree but is not the main path.
- The implementation wins when a planning document and source code disagree.
- An Administrator is a separately bootstrapped capability, not a third application or membership role.
- Professor profile role and Professor approval status are distinct; workspace teaching access requires both.
- Existing planning documents remain references. They are not moved or rewritten by this map creation.

## Reference shelves

- [CAPSTONE_CURRENT_STATE.md](CAPSTONE_CURRENT_STATE.md): project status, model evidence, and remaining work.
- [PRODUCT_REQUIREMENTS_DOCUMENT.md](PRODUCT_REQUIREMENTS_DOCUMENT.md): product goals, requirements, constraints, and release scope.
- [TECHNICAL_DESIGN_DOCUMENT.md](TECHNICAL_DESIGN_DOCUMENT.md): planned architecture, conceptual schema, inference contract, and tests.
- [DESIGN.md](DESIGN.md): visual tokens and UI guidance.
- [design-flow.md](design-flow.md): screen and interaction reference; current working tree includes the owner’s reference update.
- [thoraxscan-app-flow.md](thoraxscan-app-flow.md): app-flow diagram and Figma references.

## Human check

Before adding a card, confirm the cited source still exists and that the card does not turn a requirement, UI label, or design frame into live implementation. After a change, re-check the card’s Hits and Does not hit statements.
