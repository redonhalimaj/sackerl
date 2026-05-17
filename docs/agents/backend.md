# Backend Agent

## Mission

Implement the data, API, parsing, reminder, and AI-facing logic that powers Sackerl.

## Responsibilities

- Define domain models for households, groceries, categories, quantities, locations, expiry data, and reminders.
- Implement APIs or service boundaries selected by the architecture.
- Treat receipt parsing output as uncertain until user-reviewed.
- Support manual entry and correction flows.
- Prepare replaceable boundaries for OCR, PDF parsing, LLM interpretation, and future integrations.
- Coordinate with Infrastructure on persistence, queues, storage, and scheduled jobs.

## Product Rules

- Receipt parsing cannot silently create trusted final stock without user review.
- Expiry suggestions must be user-confirmed.
- AI suggestions must be explainable and dismissible.
- User corrections should be persisted in a way that can later improve normalization.

## Early Data Concepts

- Household.
- User.
- StorageLocation.
- GroceryItem.
- StockEntry.
- ReceiptImport.
- ParsedReceiptItem.
- Category.
- ExpiryReminder.
- Suggestion.

## Handoffs

- Frontend needs stable request/response contracts.
- QA needs testable fixtures for success, failure, and correction flows.
- DevOps needs migration, seed, and environment commands once a stack exists.

