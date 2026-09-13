---
tags: [code-map, generated]
---

# Method Index

[[Sackerl Code Map]] · [[Maintenance]]

Generated from 75 runtime TypeScript files and 10 SQL migrations: **577 named callables**, **1053 resolved relationships**, **77 module notes**.

Open a module to see each method, its source line, what it calls and what uses it. In Obsidian, open its Local graph to explore connected modules.

## How to read the evidence

- `call`: TypeScript resolves a call/new expression to this implementation.
- `JSX` / `JSX callback`: component or handler reference; React decides when it runs.
- `argument reference`: a named function passed as an argument (for example `items.map(mapRow)`); the receiving function controls its use.
- `RPC`: a literal RPC name matches a SQL function in the checked-in migrations.
- `SQL call`: a schema-qualified function reference in the latest SQL function body.
- Anonymous callbacks are attributed to their nearest named owner. Calls inside effects or callbacks are not necessarily immediate.
- This is not a complete runtime call graph: route discovery, dependency injection, computed names, HTTP boundaries, SQL triggers, dynamic callbacks and platform resolution need the curated flow notes.
- Native and web source variants are indexed; default TypeScript resolution does not model Metro platform selection.
- Tests, generated/build output, third-party libraries, object data and types are excluded. No detected caller does **not** mean unused. SQL migration presence does **not** mean deployed.

## Modules

| Module | Named callables |
| --- | ---: |
| [[Methods - apps-mobile-app-layout\|apps/mobile/app/_layout.tsx]] | 1 |
| [[Methods - apps-mobile-app-tabs-layout\|apps/mobile/app/(tabs)/_layout.tsx]] | 3 |
| [[Methods - apps-mobile-app-tabs-expiring\|apps/mobile/app/(tabs)/expiring.tsx]] | 26 |
| [[Methods - apps-mobile-app-tabs-index\|apps/mobile/app/(tabs)/index.tsx]] | 24 |
| [[Methods - apps-mobile-app-tabs-scan\|apps/mobile/app/(tabs)/scan.tsx]] | 14 |
| [[Methods - apps-mobile-app-tabs-settings\|apps/mobile/app/(tabs)/settings.tsx]] | 1 |
| [[Methods - apps-mobile-app-tabs-stock\|apps/mobile/app/(tabs)/stock.tsx]] | 51 |
| [[Methods - apps-mobile-app-add-item\|apps/mobile/app/add-item.tsx]] | 19 |
| [[Methods - apps-mobile-app-auth\|apps/mobile/app/auth.tsx]] | 3 |
| [[Methods - apps-mobile-app-onboarding\|apps/mobile/app/onboarding.tsx]] | 2 |
| [[Methods - apps-mobile-app-recipe-id-\|apps/mobile/app/recipe/[id].tsx]] | 10 |
| [[Methods - apps-mobile-app-shopping-list\|apps/mobile/app/shopping-list.tsx]] | 17 |
| [[Methods - apps-mobile-app-storage-zones\|apps/mobile/app/storage-zones.tsx]] | 12 |
| [[Methods - apps-mobile-app-suggestions\|apps/mobile/app/suggestions.tsx]] | 11 |
| [[Methods - apps-mobile-components-ScreenScaffold\|apps/mobile/components/ScreenScaffold.tsx]] | 1 |
| [[Methods - apps-mobile-lib-add-item-form\|apps/mobile/lib/add-item-form.ts]] | 3 |
| [[Methods - apps-mobile-lib-auth-session\|apps/mobile/lib/auth-session.tsx]] | 6 |
| [[Methods - apps-mobile-lib-auth\|apps/mobile/lib/auth.ts]] | 3 |
| [[Methods - apps-mobile-lib-items\|apps/mobile/lib/items.ts]] | 1 |
| [[Methods - apps-mobile-lib-profile\|apps/mobile/lib/profile.ts]] | 1 |
| [[Methods - apps-mobile-lib-receipts\|apps/mobile/lib/receipts.ts]] | 1 |
| [[Methods - apps-mobile-lib-recipes\|apps/mobile/lib/recipes.ts]] | 1 |
| [[Methods - apps-mobile-lib-shopping-list\|apps/mobile/lib/shopping-list.ts]] | 1 |
| [[Methods - apps-web-app-design-components-page\|apps/web/app/design-components/page.tsx]] | 4 |
| [[Methods - apps-web-app-design-icons-page\|apps/web/app/design-icons/page.tsx]] | 1 |
| [[Methods - apps-web-app-design-paper-bag-page\|apps/web/app/design-paper-bag/page.tsx]] | 1 |
| [[Methods - apps-web-app-design-tokens-page\|apps/web/app/design-tokens/page.tsx]] | 2 |
| [[Methods - apps-web-app-design-typography-page\|apps/web/app/design-typography/page.tsx]] | 2 |
| [[Methods - apps-web-app-household-route\|apps/web/app/household/route.ts]] | 2 |
| [[Methods - apps-web-app-items-id-route\|apps/web/app/items/[id]/route.ts]] | 2 |
| [[Methods - apps-web-app-items-batch-route\|apps/web/app/items/batch/route.ts]] | 1 |
| [[Methods - apps-web-app-items-removal-stats-route\|apps/web/app/items/removal-stats/route.ts]] | 1 |
| [[Methods - apps-web-app-items-route\|apps/web/app/items/route.ts]] | 3 |
| [[Methods - apps-web-app-layout\|apps/web/app/layout.tsx]] | 1 |
| [[Methods - apps-web-app-me-route\|apps/web/app/me/route.ts]] | 2 |
| [[Methods - apps-web-app-page\|apps/web/app/page.tsx]] | 1 |
| [[Methods - apps-web-app-receipts-id-items-route\|apps/web/app/receipts/[id]/items/route.ts]] | 3 |
| [[Methods - apps-web-app-receipts-id-parse-route\|apps/web/app/receipts/[id]/parse/route.ts]] | 2 |
| [[Methods - apps-web-app-receipts-route\|apps/web/app/receipts/route.ts]] | 3 |
| [[Methods - apps-web-app-shopping-list-id-route\|apps/web/app/shopping-list/[id]/route.ts]] | 2 |
| [[Methods - apps-web-app-shopping-list-batch-route\|apps/web/app/shopping-list/batch/route.ts]] | 1 |
| [[Methods - apps-web-app-shopping-list-route\|apps/web/app/shopping-list/route.ts]] | 3 |
| [[Methods - apps-web-app-shopping-list-suggestions-route\|apps/web/app/shopping-list/suggestions/route.ts]] | 2 |
| [[Methods - apps-web-app-suggestions-route\|apps/web/app/suggestions/route.ts]] | 3 |
| [[Methods - apps-web-lib-api-auth\|apps/web/lib/api-auth.ts]] | 3 |
| [[Methods - apps-web-lib-auth\|apps/web/lib/auth.ts]] | 1 |
| [[Methods - apps-web-lib-item-payload\|apps/web/lib/item-payload.ts]] | 9 |
| [[Methods - apps-web-lib-items\|apps/web/lib/items.ts]] | 3 |
| [[Methods - apps-web-lib-profile\|apps/web/lib/profile.ts]] | 1 |
| [[Methods - apps-web-lib-receipt-parsing\|apps/web/lib/receipt-parsing.ts]] | 7 |
| [[Methods - apps-web-lib-receipt-payload\|apps/web/lib/receipt-payload.ts]] | 6 |
| [[Methods - apps-web-lib-receipt-review-payload\|apps/web/lib/receipt-review-payload.ts]] | 7 |
| [[Methods - apps-web-lib-receipts\|apps/web/lib/receipts.ts]] | 2 |
| [[Methods - apps-web-lib-recipes\|apps/web/lib/recipes.ts]] | 2 |
| [[Methods - apps-web-lib-shopping-list-payload\|apps/web/lib/shopping-list-payload.ts]] | 9 |
| [[Methods - apps-web-lib-shopping-list\|apps/web/lib/shopping-list.ts]] | 2 |
| [[Methods - packages-api-client-src-auth\|packages/api-client/src/auth.ts]] | 15 |
| [[Methods - packages-api-client-src-items\|packages/api-client/src/items.ts]] | 51 |
| [[Methods - packages-api-client-src-profile\|packages/api-client/src/profile.ts]] | 20 |
| [[Methods - packages-api-client-src-receipt-parsing\|packages/api-client/src/receipt-parsing.ts]] | 22 |
| [[Methods - packages-api-client-src-receipts\|packages/api-client/src/receipts.ts]] | 55 |
| [[Methods - packages-api-client-src-recipes\|packages/api-client/src/recipes.ts]] | 33 |
| [[Methods - packages-api-client-src-shopping-list\|packages/api-client/src/shopping-list.ts]] | 34 |
| [[Methods - packages-tokens-src-index\|packages/tokens/src/index.ts]] | 1 |
| [[Methods - packages-ui-src-icons\|packages/ui/src/icons.tsx]] | 3 |
| [[Methods - packages-ui-src-logo-native\|packages/ui/src/logo.native.tsx]] | 2 |
| [[Methods - packages-ui-src-logo\|packages/ui/src/logo.tsx]] | 2 |
| [[Methods - packages-ui-src-paper-bag-data\|packages/ui/src/paper-bag-data.ts]] | 3 |
| [[Methods - packages-ui-src-paper-bag-native\|packages/ui/src/paper-bag.native.tsx]] | 3 |
| [[Methods - packages-ui-src-paper-bag\|packages/ui/src/paper-bag.tsx]] | 2 |
| [[Methods - packages-ui-src-primitives\|packages/ui/src/primitives.tsx]] | 13 |
| [[Methods - supabase-migrations-20260524211500-sckrl-009-profile-households\|supabase/migrations/20260524211500_sckrl_009_profile_households.sql]] | 1 |
| [[Methods - supabase-migrations-20260531203000-sckrl-201-item-data-model\|supabase/migrations/20260531203000_sckrl_201_item_data_model.sql]] | 4 |
| [[Methods - supabase-migrations-20260612100000-sckrl-511-shopping-list\|supabase/migrations/20260612100000_sckrl_511_shopping_list.sql]] | 1 |
| [[Methods - supabase-migrations-20260621110000-sckrl-302-receipts\|supabase/migrations/20260621110000_sckrl_302_receipts.sql]] | 1 |
| [[Methods - supabase-migrations-20260804100000-sckrl-303-receipt-parsing\|supabase/migrations/20260804100000_sckrl_303_receipt_parsing.sql]] | 1 |
| [[Methods - supabase-migrations-20260911110000-sckrl-310-receipt-review-data\|supabase/migrations/20260911110000_sckrl_310_receipt_review_data.sql]] | 4 |
