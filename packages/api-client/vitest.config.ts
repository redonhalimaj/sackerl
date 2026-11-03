import { configDefaults, defineConfig } from 'vitest/config';

// `tsc -p tsconfig.build.json` emits compiled `*.test.js` into dist/ (turbo builds before
// test), so keep vitest on the TypeScript sources only (SCKRL-914).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'dist/**'],
  },
});
