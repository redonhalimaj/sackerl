import { readE2eEnv, requireE2eEnv } from './env';

export default function globalSetup(): void {
  process.env.E2E_RUN_ID ??= `r${Date.now().toString(36)}`;
  if (readE2eEnv()) {
    // Validates the target guard once before any test runs.
    requireE2eEnv();
  }
}
