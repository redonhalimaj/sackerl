# Mobile testIDs

Generated from `apps/mobile/app/**`. Dynamic IDs are shown as template expressions. `use-soon.tsx` re-exports the expiring screen, so it uses the `expiring.*` IDs. Tab IDs are in `app/(tabs)/_layout.tsx` (`tabs.home`, `tabs.stock`, `tabs.scan`, `tabs.expiring`, `tabs.settings`).

## app/(tabs)/\_layout.tsx

- `tabs.home` (app/(tabs)/\_layout.tsx:18)
- `tabs.stock` (app/(tabs)/\_layout.tsx:19)
- `tabs.scan` (app/(tabs)/\_layout.tsx:20)
- `tabs.expiring` (app/(tabs)/\_layout.tsx:21)
- `tabs.settings` (app/(tabs)/\_layout.tsx:22)
- `tab.testID` (app/(tabs)/\_layout.tsx:108)

## app/(tabs)/expiring.tsx

- `testID` (app/(tabs)/expiring.tsx:95)
- `expiring.row.${item.id}` (app/(tabs)/expiring.tsx:283)
- `expiring.row.${item.id}.name` (app/(tabs)/expiring.tsx:287)
- `expiring.row.${item.id}.used` (app/(tabs)/expiring.tsx:324)
- `expiring.row.${item.id}.snooze` (app/(tabs)/expiring.tsx:340)
- `expiring.row.${item.id}.compost` (app/(tabs)/expiring.tsx:356)
- `expiring.screen` (app/(tabs)/expiring.tsx:544)
- `expiring.back` (app/(tabs)/expiring.tsx:560)
- `expiring.filter` (app/(tabs)/expiring.tsx:564)
- `expiring.error` (app/(tabs)/expiring.tsx:583)
- `expiring.status` (app/(tabs)/expiring.tsx:588)
- `expiring.bucket.${bucket.id}` (app/(tabs)/expiring.tsx:600)
- `expiring.empty` (app/(tabs)/expiring.tsx:627)

## app/(tabs)/index.tsx

- `home.screen` (app/(tabs)/index.tsx:664)
- `home.search` (app/(tabs)/index.tsx:690)
- `home.notifications` (app/(tabs)/index.tsx:698)
- `home.hero` (app/(tabs)/index.tsx:718)
- `home.pending-reviews` (app/(tabs)/index.tsx:765)
- `home.pending-reviews.retry` (app/(tabs)/index.tsx:781)
- `home.pending-reviews.row.${index}` (app/(tabs)/index.tsx:805)
- `home.pending-reviews.more` (app/(tabs)/index.tsx:830)
- `home.error` (app/(tabs)/index.tsx:843)
- `home.expiring.see-all` (app/(tabs)/index.tsx:867)
- `home.expiring.row.${index}` (app/(tabs)/index.tsx:885)
- `home.expiring.empty` (app/(tabs)/index.tsx:904)
- `home.storage.${zone.key}` (app/(tabs)/index.tsx:936)
- `home.suggestion` (app/(tabs)/index.tsx:961)
- `home.suggestion.see-all` (app/(tabs)/index.tsx:977)
- `home.suggestion.show-recipe` (app/(tabs)/index.tsx:1012)

## app/(tabs)/scan.tsx

- `scan.screen` (app/(tabs)/scan.tsx:270)
- `scan.cancel` (app/(tabs)/scan.tsx:290)
- `scan.help` (app/(tabs)/scan.tsx:302)
- `scan.status` (app/(tabs)/scan.tsx:321)
- `scan.sample-panel` (app/(tabs)/scan.tsx:327)
- `scan.load-sample` (app/(tabs)/scan.tsx:340)
- `scan.import-gallery` (app/(tabs)/scan.tsx:357)
- `scan.capture` (app/(tabs)/scan.tsx:374)
- `scan.import-pdf` (app/(tabs)/scan.tsx:388)
- `scan.manual` (app/(tabs)/scan.tsx:401)

## app/(tabs)/settings.tsx

- `settings.screen` (app/(tabs)/settings.tsx:112)
- `settings.time-zone` (app/(tabs)/settings.tsx:141)
- `settings.save-calendar` (app/(tabs)/settings.tsx:158)
- `settings.message` (app/(tabs)/settings.tsx:169)
- `settings.retry` (app/(tabs)/settings.tsx:178)
- `settings.sign-out` (app/(tabs)/settings.tsx:190)

## app/(tabs)/stock.tsx

- `testID` (app/(tabs)/stock.tsx:138)
- `testID` (app/(tabs)/stock.tsx:393)
- `testID ? `${testID` (app/(tabs)/stock.tsx:400)
- `stock.screen` (app/(tabs)/stock.tsx:787)
- `stock.back` (app/(tabs)/stock.tsx:803)
- `stock.more-actions` (app/(tabs)/stock.tsx:807)
- `stock.zone-chip.${zone.key}` (app/(tabs)/stock.tsx:849)
- `stock.category-chip.all` (app/(tabs)/stock.tsx:875)
- `stock.category-chip.${category.id}` (app/(tabs)/stock.tsx:899)
- `stock.error` (app/(tabs)/stock.tsx:912)
- `stock.empty` (app/(tabs)/stock.tsx:923)
- `stock.empty-add` (app/(tabs)/stock.tsx:934)
- `stock.empty-filtered` (app/(tabs)/stock.tsx:940)
- `stock.use-soon-list` (app/(tabs)/stock.tsx:949)
- `stock.row.${item.id}` (app/(tabs)/stock.tsx:966)
- `stock.row.${item.id}` (app/(tabs)/stock.tsx:983)
- `stock.add` (app/(tabs)/stock.tsx:1004)
- `stock.detail.backdrop` (app/(tabs)/stock.tsx:1029)
- `stock.detail` (app/(tabs)/stock.tsx:1031)
- `stock.detail.title` (app/(tabs)/stock.tsx:1036)
- `stock.detail.close` (app/(tabs)/stock.tsx:1048)
- `stock.detail.name` (app/(tabs)/stock.tsx:1070)
- `stock.detail.name-error` (app/(tabs)/stock.tsx:1074)
- `stock.detail.category.${category.id}` (app/(tabs)/stock.tsx:1104)
- `stock.detail.quantity-decrease` (app/(tabs)/stock.tsx:1128)
- `stock.detail.quantity` (app/(tabs)/stock.tsx:1142)
- `stock.detail.quantity-increase` (app/(tabs)/stock.tsx:1156)
- `stock.detail.quantity-error` (app/(tabs)/stock.tsx:1162)
- `stock.detail.unit.${unit}` (app/(tabs)/stock.tsx:1182)
- `stock.detail.move` (app/(tabs)/stock.tsx:1213)
- `stock.detail.zone.${zone.key}` (app/(tabs)/stock.tsx:1240)
- `stock.detail.zone-error` (app/(tabs)/stock.tsx:1256)
- `stock.detail.expiry` (app/(tabs)/stock.tsx:1277)
- `stock.detail.expiry-error` (app/(tabs)/stock.tsx:1284)
- `stock.detail.status` (app/(tabs)/stock.tsx:1308)
- `stock.detail.save` (app/(tabs)/stock.tsx:1325)
- `stock.detail.consume` (app/(tabs)/stock.tsx:1343)
- `stock.detail.delete` (app/(tabs)/stock.tsx:1355)

## app/add-item.tsx

- `testID` (app/add-item.tsx:193)
- `add-item.screen` (app/add-item.tsx:384)
- `add-item.back` (app/add-item.tsx:405)
- `add-item.name` (app/add-item.tsx:429)
- `add-item.name-error` (app/add-item.tsx:432)
- `add-item.category.${category.id}` (app/add-item.tsx:456)
- `add-item.quantity-decrease` (app/add-item.tsx:482)
- `add-item.quantity` (app/add-item.tsx:496)
- `add-item.quantity-increase` (app/add-item.tsx:507)
- `add-item.quantity-error` (app/add-item.tsx:512)
- `add-item.unit.${unit}` (app/add-item.tsx:529)
- `add-item.zones` (app/add-item.tsx:550)
- `add-item.zone.${zone.key}` (app/add-item.tsx:568)
- `add-item.zone-error` (app/add-item.tsx:583)
- `add-item.expiry` (app/add-item.tsx:606)
- `add-item.expiry-error` (app/add-item.tsx:614)
- `add-item.status` (app/add-item.tsx:618)
- `add-item.cancel` (app/add-item.tsx:631)
- `add-item.save` (app/add-item.tsx:646)

## app/auth.tsx

- `auth.screen` (app/auth.tsx:124)
- `auth.email` (app/auth.tsx:153)
- `auth.password` (app/auth.tsx:168)
- `auth.submit` (app/auth.tsx:184)
- `auth.apple` (app/auth.tsx:207)
- `auth.message` (app/auth.tsx:215)
- `auth.message-text` (app/auth.tsx:216)
- `auth.toggle-mode` (app/auth.tsx:230)
- `auth.toggle-reset` (app/auth.tsx:244)

## app/onboarding.tsx

- `onboarding.screen` (app/onboarding.tsx:48)
- `onboarding.get-started` (app/onboarding.tsx:101)
- `onboarding.have-account` (app/onboarding.tsx:113)

## app/receipt-review/[id].tsx

- `receipt-review.screen` (app/receipt-review/[id].tsx:511)
- `receipt-review.back` (app/receipt-review/[id].tsx:528)
- `receipt-review.reload` (app/receipt-review/[id].tsx:538)
- `receipt-review.title` (app/receipt-review/[id].tsx:545)
- `receipt-review.store` (app/receipt-review/[id].tsx:548)
- `receipt-review.confident-count` (app/receipt-review/[id].tsx:558)
- `receipt-review.needs-review-count` (app/receipt-review/[id].tsx:561)
- `receipt-review.conflict` (app/receipt-review/[id].tsx:567)
- `receipt-review.conflict-reload` (app/receipt-review/[id].tsx:572)
- `receipt-review.status` (app/receipt-review/[id].tsx:582)
- `receipt-review.empty` (app/receipt-review/[id].tsx:589)
- `receipt-review.empty-add` (app/receipt-review/[id].tsx:599)
- `receipt-review.lines` (app/receipt-review/[id].tsx:606)
- `receipt-review.line.${index}` (app/receipt-review/[id].tsx:614)
- `receipt-review.line.${index}.edit` (app/receipt-review/[id].tsx:621)
- `receipt-review.line.${index}.name` (app/receipt-review/[id].tsx:628)
- `receipt-review.line.${index}.meta` (app/receipt-review/[id].tsx:637)
- `receipt-review.line.${index}.toggle-include` (app/receipt-review/[id].tsx:657)
- `receipt-review.line.${index}.mark-reviewed` (app/receipt-review/[id].tsx:685)
- `receipt-review.add-line` (app/receipt-review/[id].tsx:705)
- `receipt-review.continue-placement` (app/receipt-review/[id].tsx:725)
- `receipt-review.save` (app/receipt-review/[id].tsx:739)
- `receipt-review.done-for-now` (app/receipt-review/[id].tsx:760)
- `receipt-review.edit` (app/receipt-review/[id].tsx:776)
- `receipt-review.edit.name` (app/receipt-review/[id].tsx:797)
- `receipt-review.edit.quantity` (app/receipt-review/[id].tsx:811)
- `receipt-review.edit.unit.${unit}` (app/receipt-review/[id].tsx:832)
- `receipt-review.edit.category.${category.id}` (app/receipt-review/[id].tsx:865)
- `receipt-review.edit.expiry-choices` (app/receipt-review/[id].tsx:880)
- `receipt-review.edit.expiry-state.${state}` (app/receipt-review/[id].tsx:909)
- `receipt-review.edit.expiry` (app/receipt-review/[id].tsx:934)
- `receipt-review.edit.errors` (app/receipt-review/[id].tsx:948)
- `receipt-review.edit.close` (app/receipt-review/[id].tsx:961)
- `receipt-review.edit.mark-reviewed` (app/receipt-review/[id].tsx:975)
- `receipt-review.state` (app/receipt-review/[id].tsx:997)
- `receipt-review.state-action` (app/receipt-review/[id].tsx:1007)
- `receipt-review.state-secondary` (app/receipt-review/[id].tsx:1017)

## app/recipe/[id].tsx

- `recipe.screen` (app/recipe/[id].tsx:260)
- `recipe.back` (app/recipe/[id].tsx:277)
- `recipe.loading` (app/recipe/[id].tsx:283)
- `recipe.error` (app/recipe/[id].tsx:288)
- `recipe.title` (app/recipe/[id].tsx:300)
- `recipe.ingredients` (app/recipe/[id].tsx:309)
- `recipe.ingredient.${index}` (app/recipe/[id].tsx:315)
- `recipe.add-missing` (app/recipe/[id].tsx:352)
- `recipe.cooked` (app/recipe/[id].tsx:372)
- `recipe.feedback` (app/recipe/[id].tsx:382)

## app/shopping-list.tsx

- `shopping-list.screen` (app/shopping-list.tsx:299)
- `shopping-list.back` (app/shopping-list.tsx:316)
- `shopping-list.counts` (app/shopping-list.tsx:324)
- `shopping-list.loading` (app/shopping-list.tsx:331)
- `shopping-list.error` (app/shopping-list.tsx:336)
- `shopping-list.retry` (app/shopping-list.tsx:345)
- `shopping-list.input` (app/shopping-list.tsx:364)
- `shopping-list.add` (app/shopping-list.tsx:379)
- `shopping-list.suggestions` (app/shopping-list.tsx:386)
- `shopping-list.suggestion.${suggestionIndex}` (app/shopping-list.tsx:400)
- `shopping-list.list` (app/shopping-list.tsx:409)
- `shopping-list.empty` (app/shopping-list.tsx:411)
- `shopping-list.row.${item.id}` (app/shopping-list.tsx:424)
- `shopping-list.row.${item.id}.toggle` (app/shopping-list.tsx:439)
- `shopping-list.row.${item.id}.name` (app/shopping-list.tsx:447)
- `shopping-list.row.${item.id}.delete` (app/shopping-list.tsx:468)
- `shopping-list.feedback` (app/shopping-list.tsx:479)

## app/storage-zones.tsx

- `storage-zones.row.${zone.id}` (app/storage-zones.tsx:167)
- `storage-zones.screen` (app/storage-zones.tsx:287)
- `storage-zones.back` (app/storage-zones.tsx:307)
- `storage-zones.list` (app/storage-zones.tsx:334)
- `storage-zones.add` (app/storage-zones.tsx:353)
- `storage-zones.message` (app/storage-zones.tsx:366)
- `storage-zones.continue` (app/storage-zones.tsx:395)
- `storage-zones.sheet-close` (app/storage-zones.tsx:426)
- `storage-zones.custom-name` (app/storage-zones.tsx:440)
- `storage-zones.custom-save` (app/storage-zones.tsx:448)

## app/suggestions.tsx

- `suggestions.card.${suggestion.recipe.id}` (app/suggestions.tsx:111)
- `suggestions.card.${suggestion.recipe.id}.title` (app/suggestions.tsx:116)
- `suggestions.card.${suggestion.recipe.id}.show` (app/suggestions.tsx:167)
- `suggestions.card.${suggestion.recipe.id}.save` (app/suggestions.tsx:179)
- `suggestions.screen` (app/suggestions.tsx:256)
- `suggestions.back` (app/suggestions.tsx:274)
- `suggestions.filter.${filterId}` (app/suggestions.tsx:317)
- `suggestions.loading` (app/suggestions.tsx:330)
- `suggestions.error` (app/suggestions.tsx:335)
- `suggestions.list` (app/suggestions.tsx:340)
- `suggestions.empty` (app/suggestions.tsx:346)
- `suggestions.empty-add` (app/suggestions.tsx:358)

## Not IDed / notes

- Native `Alert.alert` confirmations (stock Mark as used / Delete, receipt-review leave prompts) are OS dialogs and cannot carry testIDs.
- No receipt-review header name input exists; the store name is read-only (`receipt-review.store`). Name and expiry editing is in the line edit modal (`receipt-review.edit.name`, `receipt-review.edit.expiry`, shown only when expiry state is `dated`).
- Storage zones screen is the onboarding picker only: no rename or delete controls exist. Add is the custom-place sheet.
- Suggestions has no dismiss control; the heart `suggestions.card.<id>.save` is permanently disabled.
- Home/stock `SummaryChip`s on expiring and the static decorative elements are not IDed.
