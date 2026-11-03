import { expect, test } from '@playwright/test';

const PAGES = [
  { heading: 'Sackerl', path: '/' },
  { heading: 'Core component library', path: '/design-components' },
  { heading: 'Icon set', path: '/design-icons' },
  { heading: 'Animated paper bag', path: '/design-paper-bag' },
  { heading: 'Design tokens', path: '/design-tokens' },
  { heading: 'Typography', path: '/design-typography' },
] as const;

for (const { heading, path } of PAGES) {
  test(`design page ${path} renders without console errors`, async ({ page }, testInfo) => {
    test.setTimeout(90_000); // cold next dev compiles each route on first hit
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => errors.push(error.message));

    const response = await page.goto(path, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible({
      timeout: 30_000,
    });

    await testInfo.attach(`${path === '/' ? 'home' : path.slice(1)}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    expect(errors, errors.join('\n')).toEqual([]);
  });
}
