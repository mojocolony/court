import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../../src/app/app.ts', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../../src/data/courtApi.ts', import.meta.url), 'utf8');

function searchInputBlock() {
  const start = app.indexOf('search.oninput=()=>{');
  const end = app.indexOf('\n  }\n\n  wirePlayerResultActions(root);', start);
  assert.notEqual(start, -1, 'player search input handler exists');
  assert.notEqual(end, -1, 'player search input handler has a stable boundary');
  return app.slice(start, end);
}

test('typing in player search does not rerender the whole Players page', () => {
  const block = searchInputBlock();
  assert.equal(block.includes('renderRoot(root,shell("players",playersView()))'), false);
});

test('player search waits for three characters and debounces requests', () => {
  const block = searchInputBlock();
  assert.match(block, /length<3/);
  const delay = block.match(/\},(\d+)\);/);
  assert.ok(delay, 'debounce delay is present');
  assert.ok(Number(delay[1]) >= 600, 'debounce is at least 600ms');
});

test('player search uses cached prefix results before another provider request', () => {
  assert.match(api, /findCachedPlayerSearch/);
  assert.match(api, /writeCachedPlayerSearch/);
});

test('429 errors explain temporary provider quota exhaustion', () => {
  assert.match(api, /Tennis data limit reached/);
  assert.match(api, /free provider/);
});
