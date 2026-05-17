# Sackerl Environments

Sackerl has three checked-in environment templates:

| File           | Target             |
| -------------- | ------------------ |
| `.env.dev`     | Local development  |
| `.env.staging` | Staging deploys    |
| `.env.prod`    | Production deploys |

## Keys

| Key                   | Description                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| `APP_ENV`             | Internal environment label: `dev`, `staging`, or `prod`.                         |
| `NEXT_PUBLIC_APP_ENV` | Web client environment label. Public because it is bundled into the browser app. |
| `NEXT_PUBLIC_API_URL` | Web API base URL. Public because it is bundled into the browser app.             |
| `EXPO_PUBLIC_APP_ENV` | Mobile client environment label. Public because it is bundled into the Expo app. |
| `EXPO_PUBLIC_API_URL` | Mobile API base URL. Public because it is bundled into the Expo app.             |
| `DATABASE_URL`        | Placeholder for the future persistence provider.                                 |
| `AUTH_PROVIDER`       | Placeholder for the future auth provider decision.                               |
| `OCR_PROVIDER`        | Placeholder for the future receipt parsing provider decision.                    |
| `SENTRY_DSN`          | Placeholder for future error reporting.                                          |

Do not store secrets in the checked-in templates. Use local, CI, and host-managed secret stores for real values.
