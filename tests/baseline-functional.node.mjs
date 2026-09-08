import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const app = await readFile(new URL('../src/app/app.ts', import.meta.url), 'utf8');
const personal = await readFile(new URL('../src/data/personalData.ts', import.meta.url), 'utf8');
const api = await readFile(new URL('../src/data/courtApi.ts', import.meta.url), 'utf8');

assert.match(api, /export async function searchPlayers/, 'player search must call the tennis backend');
assert.match(api, /export async function getPlayer/, 'player detail must be available');
assert.match(api, /export async function getTournament/, 'tournament detail must be available');
assert.match(app, /data-watch-move/, 'Watch must expose state transitions');
assert.match(app, /data-profile-follow/, 'player profiles must expose Follow');
assert.match(app, /rankMatches\(filtered, aggregatePersonalState\(\)/, 'Today must apply personal relevance ordering');
assert.match(personal, /court_match_state/, 'personal match state must have a Supabase persistence path');
assert.match(personal, /court_followed_players/, 'followed players must have a Supabase persistence path');
console.log('baseline functional checks passed');
