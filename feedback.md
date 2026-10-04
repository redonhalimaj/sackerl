Okay so basically I did a test:

The homepage seems cool, but I might have some insights on design too, but for now I see a recipes stock shown even if the stock is long overdue, june 26 and I am testing this on September 13. I suppose there should be a mechanism that runs the date of the expiration against what is, we find that after a suggested expiration from the date bought, or if there is an exact input of the expiration date by the user after it if there is no stock, no recipe suggestions, because we dont want to have our users get food poisoning. Plus if a user adds a product there should be an estimate minimum for expiration, and have a yellowish exlamation logo on it that when clicked on or hoverd should tell the user that please for safety input the exact expiration date of the product in order to preserve health and efficienct. the overdue items should be marked with red, and we should add double exclamation logo on the item and have it send push up notifications that please move this item into the trash so that they get removed, indicating that the user has already trashed those products. (this has to remain in good faith). Afterwards I suggest besides the scan for the product from bill, maybe also then add a camre input also for products details, like at the expiration date page, were we ask expiration date photo and barcode (optional) to have a product detailed information (all this also optional) or we can leave it with exclamation mark until the user sends at least the expiration photo and barcode of the product (or at least something that relates and makes sure the product is the one we talking about and the data is legit), but here we need to be more efficient in order to not piss off users and bring down our user experience. Plus for recipes we should add custom recipes, like create a recipe book, which will be dynamic with the suggestion but prioritize the personal ones in a more highlited way. (My goal is to somehow in the future create a recipe sharing interface that will make this not a social media, but spotify sharing albums here recipes and voting them why not). And yeah you already know also the AI support throughout the app I am looking for but thats the next stage.
The UI doesnt have that smooth iphone swipe right and left move through the options, it uses the navigation buttons which is okay, but Id like to have also teh navigation swipes that Iphone has
Also for the better nourishment and calorie calculator for more fit relateed reciped Id suggest we have them under suggestive recipes, and also the count calories more like a question button, that if the user wants to count them, he/she can, if not they eat what they want. If they need then calorie intake calculation, then we offer it optionally be is suggested recipe or custom one. Might be a great area but good to have.

---

## Owner additions — 2026-10-04

- The app lacks a user profile page and a visible user icon or account-management entry.
- After login, the Home header should greet the signed-in user with **`Hello, <account name>`**
  rather than the generic **`Hello, there`**.

These owner requests are recorded for a **later branch** under the current
`feature/SCKRL-ASTRA` scope freeze. They are not additional requirements for the current branch
closeout and do not authorize product implementation.

Proposed backlog routing, using currently unused IDs in the [feature index](features.md):

| Proposed ticket                                     | State              | Primary owner                 | Scope and dependencies                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SCKRL-105 — Add an account profile page and entry   | Todo; later branch | Frontend, with Backend and QA | Provide a visible, accessible user icon/account entry leading to the profile/account page. Refine its account details and management actions before Ready; build on SCKRL-008 auth and SCKRL-009 profile data/API. |
| SCKRL-207 — Personalize the signed-in Home greeting | Todo; later branch | Frontend, with Backend and QA | Display `Hello, <account name>` for the current signed-in account. Depends on a defined account-name contract from the profile work; covers the Home header separately from SCKRL-203's existing hero card.        |

The account-name source, editing rules and missing-name fallback still need refinement. The current
shared user profile exposes email, locale, ID and creation time; it has no display-name field.
These are ticket proposals for future refinement, not implemented or accepted changes.

---

## Further owner ideas — 2026-10-04 (documentation proposal v1)

### Owner requests

- Improve receipt brand/product recognition and categorization in English and German, including
  examples such as **Colgate** and **Kinder chocolate**.
- Let the user prepare a shopping list and start a buying session that tracks progress while
  shopping.
- Offer product-photo recognition as an alternative way to enter acquired products, alongside
  receipt capture and manual entry.
- Personalize the entry experience around the user's chosen receipt, product-photo or manual
  route.
- Let friends share **private recipe collections**, similar to Spotify playlists.
- Support family household invitations with mutual verification/approval or an invitation code;
  investigate the proposed geolocation validation as part of that joining experience.

### Proposed discovery routing

These requests are **documentation-only, later-branch discovery** under the
`feature/SCKRL-ASTRA` freeze. No new ticket IDs are assigned by this addition. The mappings below
are pending refinement; they do not change an accepted ticket contract, state or program stage.

| Request                                            | Related backlog and next refinement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EN/DE brand/product categorization                 | Related SCKRL-303/309/810; [PROGRAM Stage 2](PROGRAM.md#stage-2-build-the-learning-data-spine) product normalization and locale-aware aliases. Keep brand, product/pack identity, category and quantity distinct; EN/DE names and labels map to canonical identity/category rather than duplicate language-specific categories. Preserve raw receipt evidence, confidence, correction and unknown handling. Brand alone cannot determine the product or category.                                                                                                                         |
| Shopping/buying session                            | Related SCKRL-511's persistent list; [PROGRAM Stage 3](PROGRAM.md#stage-3-budget-aware-buying-intelligence) shopping plans, with Stage 2 product identity/acquisition history prerequisites. Refine an explicit trip, quantities, substitutions, check/uncheck and cancellation. Distinguish planned, picked, bought and stored; a checked row does not prove payment or place stock. Reconcile later receipt/photo/manual capture of the same purchase without duplicates, name-only merging or loss of real repeated quantities/lots, including retries and concurrent household edits. |
| Alternative product-photo intake                   | New discovery beside SCKRL-307/308 media boundaries and SCKRL-409 optional evidence on an existing item; broader than SCKRL-409's accepted scope. Distinguish a product photo from a receipt photo and package-date evidence. Review uncertain recognition with confidence, correction and manual fallback; refine private media access, retention/deletion and provider sharing. A photo/barcode alone does not establish purchase, an exact expiry date or confirmed stock.                                                                                                             |
| Personalized entry route                           | Related acquisition/manual-entry work, with an explicit user preference to refine. Keep receipt, product-photo and manual alternatives available; no mandatory photo/barcode or inferred preference. This does not imply those future recognition routes already work.                                                                                                                                                                                                                                                                                                                    |
| Private friend recipe collections                  | Related SCKRL-507/508 and [PROGRAM Stage 4](PROGRAM.md#stage-4-personalized-recipes-and-meal-timing). Refine invite-only access, recipient acceptance, ownership, source/licensing, reshare/copy limits and revoke/leave/delete behavior. Collection access must not grant household stock/receipt access or disclose personal dietary information. The playlist metaphor does not authorize a public feed, votes or publishing.                                                                                                                                                          |
| Family household invitations and location proposal | Build future discovery around SCKRL-009's existing one-household membership baseline. Clarify mutually authenticated approval and invitation-code lifetime, single use, guessing/replay, revocation, recovery and joining/leaving; cover remote family, shared devices and minors. Two approvals or a shared code are not automatically authentication two-factor verification or proof of kinship. Geolocation remains an unresolved requested option, not accepted mandatory authentication or membership proof.                                                                        |

### Boundaries to preserve during refinement

The Colgate example raises non-food/toiletry handling under the current food-first boundary.
Recognizing or excluding non-food lines in a mixed receipt is a separate discovery question from
adding non-food inventory. The latter remains [PROGRAM Stage 7](PROGRAM.md#stage-7-general-household-storage)
discovery; do not force such products into food categories or recipe eligibility. Kinder chocolate
is the owner's food example, but its brand alone still does not identify a particular product.

Location discovery must clarify what is being validated, purpose, explicit consent, minimum data,
access, retention/deletion and denied/unavailable/spoofed-location behavior. Provide a non-location
alternative for remote family or travel; location alone cannot prove identity, kinship or continuing
consent. No continuous/background tracking, provider or security design is accepted here.

Product recognition also does not prove expiry, allergens or food safety. Receipt evidence and
user corrections must not silently become shared global data. Future criteria should cover
permission denial, cancellation, uncertainty/correction, retries, duplicate capture and source
reconciliation before implementation. These notes preserve the owner's ideas without adding
requirements to the current branch closeout or changing [features.md](features.md),
[PROGRAM.md](PROGRAM.md) or ticket states in [status.md](status.md).
