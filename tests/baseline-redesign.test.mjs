import { test, expect } from 'vitest';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('user-facing product is Baseline', async () => {
  const [index, pkg, readme, app] = await Promise.all([
    read('index.html'), read('package.json'), read('README.md'), read('src/app/app.ts')
  ]);
  expect(index).toMatch(/<title>Baseline<\/title>/);
  expect(JSON.parse(pkg).name).toBe('baseline');
  expect(readme).toMatch(/^# Baseline/m);
  expect(app).toMatch(/class=\"wordmark\"[^>]*>BASELINE</);
});

test('Today exposes the approved editorial layout hooks', async () => {
  const [app, css] = await Promise.all([read('src/app/app.ts'), read('src/styles/layout.css')]);
  expect(app).toMatch(/class=\"date-rail\"/);
  expect(app).toMatch(/class=\"top-nav\"/);
  expect(app).toMatch(/class=\"schedule-head\"/);
  expect(app).toMatch(/\"calendar-days\"/);
  expect(app).toMatch(/data-lucide=\"\$\{icon\}\"/);
  expect(css).toMatch(/\.today-hero/);
  expect(css).toMatch(/\.schedule-head/);
});
