# Sackerl Environments

Sackerl uses ignored local environment files. Do not commit `.env*` files.

| Ignored file   | Target             |
| -------------- | ------------------ |
| `.env.dev`     | Local development  |
| `.env.staging` | Staging deploys    |
| `.env.prod`    | Production deploys |

Provider setup guidance is tracked in [provider-setup.md](provider-setup.md).

For local app runs, keep real values in ignored files:

- Root workspace: `.env`
- Next.js web app: `apps/web/.env.local`
- Expo mobile app: `apps/mobile/.env.local`

The app-local files matter because Next.js and Expo load environment values from their own package directories when run through workspace scripts.

## Keys

| Key                             | Description                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `APP_ENV`                       | Internal environment label: `dev`, `staging`, or `prod`.                         |
| `NEXT_PUBLIC_APP_ENV`           | Web client environment label. Public because it is bundled into the browser app. |
| `NEXT_PUBLIC_API_URL`           | Web API base URL. Public because it is bundled into the browser app.             |
| `EXPO_PUBLIC_APP_ENV`           | Mobile client environment label. Public because it is bundled into the Expo app. |
| `EXPO_PUBLIC_API_URL`           | Mobile API base URL. Public because it is bundled into the Expo app.             |
| `AUTH_PROVIDER`                 | Auth provider label. Default recommendation for Slice 1 is `supabase`.           |
| `DATABASE_PROVIDER`             | Database provider label. Default recommendation for Slice 1 is `supabase`.       |
| `DATABASE_URL`                  | Server-only database connection URL. Do not expose this to client apps.          |
| `NEXT_PUBLIC_SUPABASE_URL`      | Web Supabase project URL. Public because it is bundled into the browser app.     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web Supabase anon key. Public, but still environment-specific.                   |
| `EXPO_PUBLIC_SUPABASE_URL`      | Mobile Supabase project URL. Public because it is bundled into the Expo app.     |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile Supabase anon key. Public, but still environment-specific.                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only Supabase service role key. Never expose this to client apps.         |
| `OCR_PROVIDER`                  | Placeholder for the future receipt parsing provider decision.                    |
| `SENTRY_DSN`                    | Placeholder for future error reporting.                                          |

Do not store secrets in tracked files. Use local, CI, and host-managed secret stores for real values.
