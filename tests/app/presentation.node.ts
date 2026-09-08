import test from 'node:test';
import assert from 'node:assert/strict';
import { completedMatchPresentation } from '../../src/app/matchPresentation.ts';
import { countryDisplayName, dedupePlayers, handDisplayName } from '../../src/app/playerPresentation.ts';

test('completed match uses FINAL, full set scores, and winner identity', () => {
  const match = {
    id:'m1', status:'completed',
    home:{id:'sab',name:'Aryna Sabalenka'}, away:{id:'nos',name:'Linda Noskova'},
    sets:[{home:6,away:2},{home:3,away:6},{home:6,away:4}], setCounts:[2,1], games:[[6,3,6],[2,6,4]]
  } as any;
  assert.deepEqual(completedMatchPresentation(match), {
    statusLabel:'FINAL', scoreLabel:'6–2  3–6  6–4', winnerPlayerId:'sab',
    resultLabel:'Aryna Sabalenka def. Linda Noskova'
  });
});

test('player facts use clear human language', () => {
  assert.equal(handDisplayName('R'), 'Right-handed');
  assert.equal(handDisplayName('L'), 'Left-handed');
  assert.equal(countryDisplayName('blr'), 'Belarus');
});

test('player search deduplicates same player and keeps richer record', () => {
  const players = [
    {id:'1',name:'Aryna Sabalenka',tour:'WTA',countryCode:'blr'},
    {id:'2',name:'Aryna Sabalenka',tour:'WTA',countryCode:'blr',ranking:1},
    {id:'3',name:'Karyna Fiadosik',tour:'WTA',countryCode:'wor'}
  ] as any[];
  const result = dedupePlayers(players);
  assert.equal(result.length, 2);
  assert.equal(result[0].id, '2');
  assert.equal(result[0].ranking, 1);
});

test('completed aggregate score becomes a clear result instead of a bare set count', () => {
  const match = {
    id:'m2', status:'completed',
    home:{id:'tia',name:'Frances Tiafoe'}, away:{id:'mic',name:'Alex Michelsen'},
    sets:[], setCounts:[1,3], games:[]
  } as any;
  assert.deepEqual(completedMatchPresentation(match), {
    statusLabel:'FINAL',
    scoreLabel:'Alex Michelsen won 3 sets to 1',
    winnerPlayerId:'mic',
    resultLabel:'Alex Michelsen def. Frances Tiafoe'
  });
});
