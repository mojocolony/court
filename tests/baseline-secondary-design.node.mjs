import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../src/app/app.ts', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles/layout.css', import.meta.url), 'utf8');

assert.match(app, /class="tour-timeline"/, 'Tour should render the editorial season timeline');
assert.match(app, /class="players-search"/, 'Players should render the search/following layout');
assert.match(app, /class="watch-sections"/, 'Watch should render the notebook sections');
assert.match(app, /"Up Next"/, 'Watch should expose Up Next');
assert.match(app, /"Watch Later"/, 'Watch should expose Watch Later');
assert.match(app, /"Watched"/, 'Watch should expose Watched');

assert.match(css, /\.secondary-hero\s*\{/, 'Secondary pages should use a shared editorial hero');
assert.match(css, /\.tour-timeline\s*\{/, 'Tour timeline needs layout styling');
assert.match(css, /\.players-search\s*\{/, 'Players search needs layout styling');
assert.match(css, /\.watch-sections\s*\{/, 'Watch notebook needs layout styling');

assert.match(css, /\.top-nav\s*\{[\s\S]*?font-size:\s*17px/, 'Desktop nav text should be larger');
assert.match(css, /\.segmented button\s*\{[\s\S]*?font-size:\s*16px/, 'Filters should be larger');
assert.match(css, /\.eyebrow,[\s\S]*?font-size:\s*13px/, 'Eyebrow labels should be larger');
assert.match(css, /\.match-round\s*\{[\s\S]*?font-size:\s*16px/, 'Round labels should be larger');
assert.match(css, /\.rank\s*\{[\s\S]*?font-size:\s*12px/, 'Rankings should be larger');
assert.match(css, /\.feed-status\s*\{[\s\S]*?font-size:\s*12px/, 'Status line should be larger');
assert.match(css, /\.schedule-head\s*\{[\s\S]*?font-size:\s*11px/, 'Column headings should be larger');

console.log('baseline secondary design checks passed');
