# Sackerl Epics

## Product North Star

Sackerl helps households know what groceries they already have, where those groceries are stored, when they may expire, and what they should buy or avoid buying next.

## Backlog Source

The full ticket-level backlog lives in [features.md](features.md). This file is the high-level epic map for Obsidian navigation and delivery planning.

The active product-screen design source is the Phase 2 handoff at `Design/Phase 2/sackerl phase 2`. Its visual source of truth is `index.html`; its implementation details are in `handoff/features.md`, `handoff/screens.md`, and `handoff/design-system.md`.

## Epic Map

| Epic                                   | Status        | Goal                                                                                                                                                                               | Ticket Range           |
| -------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| EPIC-0 Product Truth And Stage Gates   | In progress   | Reconcile real product behavior, completed-ticket evidence, QA gates, architecture decisions, and measurement before more product-screen work.                                     | SCKRL-020 to SCKRL-024 |
| EPIC-1 Foundation And Design System    | Ready to plan | Establish monorepo, environments, design tokens, typography, components, icon set, PaperBag, navigation shell, auth, household model, and telemetry scaffolding.                   | SCKRL-001 to SCKRL-010 |
| EPIC-2 Onboarding                      | Backlog       | Implement welcome, storage-zone setup, locale selection, and optional Sackerl explainer.                                                                                           | SCKRL-101 to SCKRL-104 |
| EPIC-3 Stock And Storage               | Backlog       | Build the item model, items API, dashboard modules, storage detail, manual add, and item editing.                                                                                  | SCKRL-201 to SCKRL-213 |
| EPIC-4 Receipt To Stock                | Backlog       | Implement mobile receipt capture, upload, OCR parsing, review, placement, receipt history, and production-grade media/OCR follow-ups.                                              | SCKRL-301 to SCKRL-311 |
| EPIC-5 Expiry And Notifications        | Backlog       | Track expiring items, estimate expiry when needed, distinguish expiry provenance, register push tokens, send daily reminders, track waste avoided, and provide notification inbox. | SCKRL-401 to SCKRL-421 |
| EPIC-6 Suggestions And Recipes         | Backlog       | Match recipes from current stock, show recipe detail, maintain shopping list, and show the suggestions screen.                                                                     | SCKRL-501 to SCKRL-521 |
| EPIC-7 Premium                         | Backlog       | Add paywall, subscriptions, and entitlement gates for premium behavior.                                                                                                            | SCKRL-601 to SCKRL-610 |
| EPIC-8 Web Companion                   | Backlog       | Build the authenticated Next.js web shell, desktop dashboard, web upload receipt scan, and print-ready shopping list.                                                              | SCKRL-701 to SCKRL-715 |
| EPIC-9 Internationalisation            | Backlog       | Add i18next, DACH German polish, and multi-language receipt handling.                                                                                                              | SCKRL-801 to SCKRL-810 |
| EPIC-10 Quality, Telemetry And Release | In progress   | Establish application test harness and journey evidence first, then accessibility audit, performance budget, telemetry events, store listings, and release pipeline.               | SCKRL-901 to SCKRL-920 |

## Delivery Bias

The foundation is complete locally. The current implementation sequence starts with EPIC-0 Stage 0, then the bounded quality/media/data contracts needed to make the receipt-to-stock loop reliable.

After foundation, prioritize Slice 1 from the Phase 2 handoff:

- SCKRL-008 and SCKRL-009 for auth, profile, and household.
- SCKRL-101 through SCKRL-103 for welcome, storage-zone setup, and locale.
- SCKRL-201 and SCKRL-202 for item model and item CRUD.
- SCKRL-203 through SCKRL-205 for the read-only dashboard hero, expiring card, and storage grid.

Receipt scanning is core to the product identity, but it depends on camera/upload, private storage, OCR provider abstraction, review state, expiry provenance, atomic placement, and journey evidence. It is planned as a vertical slice after those contracts are stable enough to receive parsed items.

## Out Of Scope For V1

- Barcode scan.
- Multi-household / shared baskets.
- Smart-fridge integration.
- AI nutrition coaching.
- Voice add.
- Apple Watch / wearable companion.
- Community recipe sharing.
