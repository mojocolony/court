import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('user-facing product is Baseline', async () => {
  const [index, pkg, readme, app] = await Promise.all([
    read('index.html'), read('package.json'), read('README.md'), read('src/app/app.ts')
  ]);
  assert.match(index, /<title>Baseline<\/title>/);
  assert.equal(JSON.parse(pkg).name, 'baseline');
  assert.match(readme, /^# Baseline/m);
  assert.match(app, /class="wordmark"[^>]*>BASELINE</);
});

test('Today exposes the approved editorial layout hooks', async () => {
  const [app, css] = await Promise.all([read('src/app/app.ts'), read('src/styles/layout.css')]);
  assert.match(app, /class="date-rail"/);
  assert.match(app, /class="top-nav"/);
  assert.match(app, /class="schedule-head"/);
  assert.match(app, /"calendar-days"/);
  assert.match(app, /data-lucide="\$\{icon\}"/);
  assert.match(css, /\.today-hero/);
  assert.match(css, /\.schedule-head/);
});
