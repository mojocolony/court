import type { PlayerRef, Surface, Tour } from './types';

export interface FollowedPlayer extends PlayerRef {
  hand?: string;
  birthday?: string;
}

export interface FollowedTournament {
  id: string;
  name: string;
  tour: Tour | 'BOTH';
  surface: Surface;
  city?: string;
  country?: string;
  category?: string;
}

interface StorageLike {
  readonly length?: number;
  getItem(key:string): string|null;
  setItem(key:string,value:string): void;
  removeItem?(key:string): void;
  key?(index:number): string|null;
}

const PLAYER_PREFIX = 'baseline:followed-player:';
const TOURNAMENT_PREFIX = 'baseline:followed-tournament:';

function listPrefix<T>(prefix:string, storage:StorageLike): T[] {
  const out:T[]=[];
  const length=storage.length ?? 0;
  if (!storage.key) return out;
  for(let i=0;i<length;i++) {
    const key=storage.key(i);
    if(!key?.startsWith(prefix)) continue;
    const raw=storage.getItem(key);
    if(!raw) continue;
    try { out.push(JSON.parse(raw) as T); } catch { /* ignore corrupt local rows */ }
  }
  return out;
}

export function followPlayer(player:FollowedPlayer, storage:StorageLike=localStorage):void {
  storage.setItem(`${PLAYER_PREFIX}${player.id}`, JSON.stringify(player));
}
export function unfollowPlayer(id:string, storage:StorageLike=localStorage):void { storage.removeItem?.(`${PLAYER_PREFIX}${id}`); }
export function isPlayerFollowed(id:string, storage:StorageLike=localStorage):boolean { return storage.getItem(`${PLAYER_PREFIX}${id}`) !== null; }
export function listFollowedPlayers(storage:StorageLike=localStorage):FollowedPlayer[] {
  return listPrefix<FollowedPlayer>(PLAYER_PREFIX, storage).sort((a,b)=>a.name.localeCompare(b.name));
}

export function followTournament(tournament:FollowedTournament, storage:StorageLike=localStorage):void {
  storage.setItem(`${TOURNAMENT_PREFIX}${tournament.id}`, JSON.stringify(tournament));
}
export function unfollowTournament(id:string, storage:StorageLike=localStorage):void { storage.removeItem?.(`${TOURNAMENT_PREFIX}${id}`); }
export function isTournamentFollowed(id:string, storage:StorageLike=localStorage):boolean { return storage.getItem(`${TOURNAMENT_PREFIX}${id}`) !== null; }
export function listFollowedTournaments(storage:StorageLike=localStorage):FollowedTournament[] {
  return listPrefix<FollowedTournament>(TOURNAMENT_PREFIX, storage).sort((a,b)=>a.name.localeCompare(b.name));
}
