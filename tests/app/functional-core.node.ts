import test from 'node:test';
import assert from 'node:assert/strict';
import { watchMatchPresentation } from '../../src/app/watchPresentation.ts';
import { tourTimelineEvents } from '../../src/app/tourPresentation.ts';
import { readBaselineSettings, writeBaselineSettings } from '../../src/domain/settings.ts';

test('completed watched-later match is spoiler-safe until explicitly revealed', () => {
  const match = {
    id:'m1', status:'completed', tournamentId:'t1', tournamentName:'US Open', tour:'WTA', eventType:'singles', surface:'hard', scheduledAt:'2026-09-08T15:00:00Z',
    home:{id:'p1',name:'Aryna Sabalenka',tour:'WTA'}, away:{id:'p2',name:'Linda Noskova',tour:'WTA'},
    sets:[{home:6,away:2},{home:3,away:6},{home:6,away:4}], setCounts:[2,1], games:[[6,3,6],[2,6,4]]
  } as any;
  const state = { starred:false, watchState:'later', note:'', watchedAt:null } as any;
  assert.deepEqual(watchMatchPresentation(match, state, false, false), {
    statusLabel:'FINAL', resultHidden:true, scoreLabel:''
  });
  assert.deepEqual(watchMatchPresentation(match, state, false, true), {
    statusLabel:'FINAL', resultHidden:false, scoreLabel:'6–2  3–6  6–4'
  });
});

test('global spoiler mode protects completed matches even when not on Watch', () => {
  const match = {
    id:'m2', status:'completed', tournamentId:'t1', tournamentName:'US Open', tour:'ATP', eventType:'singles', surface:'hard', scheduledAt:'2026-09-08T17:00:00Z',
    home:{id:'p1',name:'A',tour:'ATP'}, away:{id:'p2',name:'B',tour:'ATP'}, sets:[], setCounts:[2,0], games:[[6,6],[4,3]]
  } as any;
  const state = { starred:false, watchState:'none', note:'', watchedAt:null } as any;
  assert.equal(watchMatchPresentation(match, state, true, false).resultHidden, true);
});

test('tour timeline collapses singles and doubles into one tournament event and marks followed events', () => {
  const matches = [
    {id:'1',tournamentId:'us',tournamentName:'US Open',tour:'WTA',eventType:'singles',surface:'hard',scheduledAt:'2026-09-08T15:00:00Z'},
    {id:'2',tournamentId:'us',tournamentName:'US Open',tour:'WTA',eventType:'doubles',surface:'hard',scheduledAt:'2026-09-08T17:00:00Z'},
    {id:'3',tournamentId:'bj',tournamentName:'Beijing',tour:'WTA',eventType:'singles',surface:'hard',scheduledAt:'2026-09-25T10:00:00Z'}
  ] as any[];
  const events = tourTimelineEvents(matches, ['bj']);
  assert.equal(events.length, 2);
  assert.equal(events[0].tournamentId, 'us');
  assert.equal(events[1].tournamentId, 'bj');
  assert.equal(events[1].followed, true);
});

test('spoiler preference persists locally', () => {
  const map = new Map<string,string>();
  const storage = {
    getItem:(key:string)=>map.get(key) ?? null,
    setItem:(key:string,value:string)=>{ map.set(key,value); }
  };
  assert.equal(readBaselineSettings(storage as any).globalSpoilerMode, false);
  writeBaselineSettings({globalSpoilerMode:true}, storage as any);
  assert.equal(readBaselineSettings(storage as any).globalSpoilerMode, true);
});
