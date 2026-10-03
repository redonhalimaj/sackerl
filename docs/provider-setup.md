# Provider Setup Notes

Last updated: 2026-05-23

This note captures the current provider decision for Slice 1 so setup details are not lost between sessions.

## Current Recommendation

Use Supabase first. Defer Apple Developer Program enrollment until App Store/TestFlight distribution or production Apple Sign-In setup is needed.

## What Supabase Is For

Supabase is the hosted backend provider selected for the first Sackerl implementation path.

For Sackerl, it will cover:

- Auth: email/password sign up, sign in, password reset, sessions, and later Apple Sign-In.
- Postgres database: users, households, stock items, storage zones, expiry data, and later receipt data.
- Row-level security: users should only access their own household data.
- Generated APIs and server-side keys for backend-only work.

The repo already has a Supabase Auth scaffold in `@sackerl/api-client`, plus web/mobile environment adapters. Runtime QA still needs real Supabase project values.

## What To Do Now

1. Create a free Supabase account.
2. Create a new Supabase project.
3. Choose an EU region close to the expected users.
4. In the Supabase dashboard, open the project Connect dialog or Settings > API Keys.
5. Copy the project URL and public client key.
6. Add those values to local environment files, not committed templates.

The dashboard may call the public client key a publishable key. The current repo env names still use `ANON_KEY`; the public publishable key can be placed there for now.

## Values Needed First

These are enough for web/mobile auth screen integration:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Use the same Supabase project URL and public key for both web and mobile in local development.

## Values Needed Later

These are needed for backend/database work and must stay server-only:

```bash
DATABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in browser or mobile code. It has elevated privileges and can bypass row-level security.

## Supabase Auth Settings

In the Supabase dashboard:

1. Enable email/password auth under Authentication > Providers.
2. Configure the Site URL under Authentication > URL Configuration.
3. Add redirect URLs for local development, email confirmation, and password reset.

Redirect URLs matter because Supabase only redirects users to allow-listed URLs after email confirmation, password reset, or OAuth flows.

## Apple Developer Program

Do not enroll yet unless distribution or Apple Sign-In setup becomes the active task.

Apple Developer Program is a paid membership, currently listed by Apple as 99 USD per membership year. It is needed later for:

- App Store distribution.
- TestFlight distribution.
- Production Sign in with Apple configuration.
- App identifiers, certificates, and App Store Connect setup.

For now, we can continue with email/password auth and mocked/logged-in app visuals without Apple Developer enrollment.

## If Supabase Is Not Created Yet

The team can still build:

- App visuals.
- Onboarding screens.
- Dashboard mocks.
- Navigation and design-system components.
- Mocked logged-in/logged-out states.

The team cannot fully complete runtime auth QA until a real Supabase project exists.

## Official References

- Supabase API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase password auth: https://supabase.com/docs/guides/auth/passwords
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase Apple auth: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Apple Developer Program enrollment: https://developer.apple.com/programs/enroll/
