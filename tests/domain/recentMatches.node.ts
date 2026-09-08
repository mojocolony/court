import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberCompletedMatch, recentCompletedMatchesForPlayer } from '../../src/domain/recentMatches.ts';

function storage() {
  const map = new Map<string,string>();
  return {
    getItem:(key:string)=>map.get(key) ?? null,
    setItem:(key:string,value:string)=>{ map.set(key,value); }
  };
}

test('Baseline retains completed matches it has observed for player context', () => {
  const store = storage();
  rememberCompletedMatch({
    id:'old',status:'completed',scheduledAt:'2026-09-07T20:00:00Z',
    home:{id:'sab',name:'Aryna Sabalenka'},away:{id:'oldopp',name:'Opponent'},
    tournamentId:'us',tournamentName:'US Open',tour:'WTA',eventType:'singles',surface:'hard',sets:[]
  } as any, store as any);
  rememberCompletedMatch({
    id:'new',status:'completed',scheduledAt:'2026-09-08T15:40:00Z',
    home:{id:'sab',name:'Aryna Sabalenka'},away:{id:'nos',name:'Linda Noskova'},
    tournamentId:'us',tournamentName:'US Open',tour:'WTA',eventType:'singles',surface:'hard',sets:[],winnerPlayerId:'sab'
  } as any, store as any);
  rememberCompletedMatch({
    id:'future',status:'scheduled',scheduledAt:'2026-09-09T15:00:00Z',
    home:{id:'sab',name:'Aryna Sabalenka'},away:{id:'x',name:'Someone'},
    tournamentId:'us',tournamentName:'US Open',tour:'WTA',eventType:'singles',surface:'hard',sets:[]
  } as any, store as any);

  const matches = recentCompletedMatchesForPlayer('sab', store as any);
  assert.deepEqual(matches.map(match => match.id), ['new','old']);
});
