import { readOrRefreshSharedSession } from './supabaseSession';
import { listMatchPersonalRecords, writeMatchPersonalState, type MatchPersonalState } from '../domain/matchPersonalState';
import {
  followPlayer,
  followTournament,
  listFollowedPlayers,
  listFollowedTournaments,
  type FollowedPlayer,
  type FollowedTournament
} from '../domain/followedState';

function config() {
  const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

async function authenticatedRequest(path:string, init:RequestInit = {}):Promise<Response|null> {
  const cfg=config();
  if(!cfg) return null;
  const session=await readOrRefreshSharedSession(cfg.url,cfg.key);
  if(!session?.access_token) return null;
  return fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers:{
      apikey:cfg.key,
      Authorization:`Bearer ${session.access_token}`,
      'Content-Type':'application/json',
      ...(init.headers ?? {})
    }
  });
}

export async function hydratePersonalData():Promise<'synced'|'local'> {
  const matches = await authenticatedRequest('court_match_state?select=match_id,starred,watch_state,note,watched_at,match_data');
  const players = await authenticatedRequest('court_followed_players?select=player_id,player_data');
  const tournaments = await authenticatedRequest('court_followed_tournaments?select=tournament_id,tournament_data');
  if(!matches || !players || !tournaments) return 'local';
  if(!matches.ok || !players.ok || !tournaments.ok) return 'local';

  const matchRows = await matches.json() as Array<Record<string,unknown>>;
  for(const row of matchRows) {
    const id=String(row.match_id ?? '');
    if(!id) continue;
    const state:MatchPersonalState={
      starred:row.starred===true,
      watchState:row.watch_state==='up_next'||row.watch_state==='later'||row.watch_state==='watched' ? row.watch_state : 'none',
      note:typeof row.note==='string'?row.note:'',
      watchedAt:typeof row.watched_at==='string'?row.watched_at:null,
      ...(row.match_data && typeof row.match_data==='object' ? { match: row.match_data as MatchPersonalState['match'] } : {})
    };
    writeMatchPersonalState(id,state);
  }

  const playerRows = await players.json() as Array<Record<string,unknown>>;
  for(const row of playerRows) {
    if(row.player_data && typeof row.player_data==='object') followPlayer(row.player_data as FollowedPlayer);
  }
  const tournamentRows = await tournaments.json() as Array<Record<string,unknown>>;
  for(const row of tournamentRows) {
    if(row.tournament_data && typeof row.tournament_data==='object') followTournament(row.tournament_data as FollowedTournament);
  }

  const localMatches=listMatchPersonalRecords();
  if(localMatches.length) {
    await authenticatedRequest('court_match_state?on_conflict=user_id,match_id', {
      method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify(localMatches.map(({id,state})=>({
        match_id:id, starred:state.starred, watch_state:state.watchState, note:state.note,
        watched_at:state.watchedAt, match_data:state.match ?? null, updated_at:new Date().toISOString()
      })))
    });
  }
  const localPlayers=listFollowedPlayers();
  if(localPlayers.length) {
    await authenticatedRequest('court_followed_players?on_conflict=user_id,player_id', {
      method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify(localPlayers.map(player=>({player_id:player.id,player_data:player,updated_at:new Date().toISOString()})))
    });
  }
  const localTournaments=listFollowedTournaments();
  if(localTournaments.length) {
    await authenticatedRequest('court_followed_tournaments?on_conflict=user_id,tournament_id', {
      method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify(localTournaments.map(tournament=>({tournament_id:tournament.id,tournament_data:tournament,updated_at:new Date().toISOString()})))
    });
  }
  return 'synced';
}

export async function persistMatchState(id:string,state:MatchPersonalState):Promise<boolean> {
  const response=await authenticatedRequest('court_match_state?on_conflict=user_id,match_id',{
    method:'POST',
    headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify({
      match_id:id,
      starred:state.starred,
      watch_state:state.watchState,
      note:state.note,
      watched_at:state.watchedAt,
      match_data:state.match ?? null,
      updated_at:new Date().toISOString()
    })
  });
  return Boolean(response?.ok);
}

export async function persistFollowedPlayer(player:FollowedPlayer, followed:boolean):Promise<boolean> {
  const path = followed
    ? 'court_followed_players?on_conflict=user_id,player_id'
    : `court_followed_players?player_id=eq.${encodeURIComponent(player.id)}`;
  const response=await authenticatedRequest(path, followed ? {
    method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify({ player_id:player.id, player_data:player, updated_at:new Date().toISOString() })
  } : { method:'DELETE' });
  return Boolean(response?.ok);
}

export async function persistFollowedTournament(tournament:FollowedTournament, followed:boolean):Promise<boolean> {
  const path = followed
    ? 'court_followed_tournaments?on_conflict=user_id,tournament_id'
    : `court_followed_tournaments?tournament_id=eq.${encodeURIComponent(tournament.id)}`;
  const response=await authenticatedRequest(path, followed ? {
    method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify({ tournament_id:tournament.id, tournament_data:tournament, updated_at:new Date().toISOString() })
  } : { method:'DELETE' });
  return Boolean(response?.ok);
}
