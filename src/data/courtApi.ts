import type { TennisMatch, Surface, Tour } from "../domain/types";

export type MatchLevel = "TOUR" | "CHALLENGER" | "ITF" | "OTHER";

export interface CourtMatch extends TennisMatch {
  roundCode?: string;
  level?: MatchLevel;
  eventStatus?: string;
  setCounts?: number[];
  games?: unknown[][];
  points?: unknown[];
  home: TennisMatch["home"] & { handedness?: string; birthday?: string };
  away: TennisMatch["away"] & { handedness?: string; birthday?: string };
}

export interface TodayFeed {
  provider: string;
  fetchedAt: string;
  live: CourtMatch[];
  upcoming: CourtMatch[];
  capabilities: Record<string, boolean>;
}

export interface CourtPlayer {
  id: string;
  name: string;
  tour: Tour;
  countryCode?: string;
  ranking?: number;
  rankingPoints?: number;
  rankingMovement?: string;
  hand?: string;
  birthday?: string;
  backhand?: number;
  isDoublesTeam?: boolean;
  stats?: Record<string, unknown>;
  nextMatch?: CourtMatch;
}

export interface CourtTournament {
  id: string;
  name: string;
  tour: Tour;
  surface: Surface;
  indoor?: boolean;
  city?: string;
  country?: string;
  category?: string;
}

function config() {
  const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Baseline data connection is not configured.");
  return { url, key };
}

async function edgeGet<T>(params:URLSearchParams, signal?:AbortSignal):Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/functions/v1/court-tennis?${params.toString()}`, {
    headers: { apikey:key, Authorization:`Bearer ${key}`, Accept:"application/json" },
    signal
  });
  if (!response.ok) {
    const retry = response.headers.get("Retry-After");
    throw new Error(response.status === 429 && retry
      ? `Tennis data limit reached. Try again in ${retry} seconds.`
      : `Tennis data unavailable (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export function utcRangeForOffsetDate(
  year: number, month: number, day: number, offsetMinutes: number
): { from: string; to: string } {
  const fromMs = Date.UTC(year, month, day, 0, 0, 0, 0) + offsetMinutes * 60_000;
  return {
    from: new Date(fromMs).toISOString(),
    to: new Date(fromMs + 86_400_000 - 1).toISOString()
  };
}

export function localDayUtcRange(date = new Date()): { from: string; to: string } {
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
  return { from: from.toISOString(), to: new Date(next.getTime() - 1).toISOString() };
}

export async function getTodayFeed(signal?: AbortSignal, draw: "singles" | "doubles" = "singles", date = new Date()): Promise<TodayFeed> {
  const { from, to } = localDayUtcRange(date);
  return edgeGet<TodayFeed>(new URLSearchParams({ route:"today", from, to, draw }), signal);
}

export async function getMatch(id: string, signal?: AbortSignal): Promise<CourtMatch> {
  const body=await edgeGet<{match:CourtMatch}>(new URLSearchParams({route:"match",id}), signal);
  return body.match;
}

export async function searchPlayers(search:string, signal?:AbortSignal):Promise<CourtPlayer[]> {
  if(search.trim().length<2) return [];
  const body=await edgeGet<{players:CourtPlayer[]}>(new URLSearchParams({route:"players",search:search.trim()}), signal);
  return body.players;
}

export async function getPlayer(id:string, signal?:AbortSignal):Promise<CourtPlayer> {
  const body=await edgeGet<{player:CourtPlayer;nextMatch?:CourtMatch}>(new URLSearchParams({route:"player",id}), signal);
  return { ...body.player, ...(body.nextMatch ? { nextMatch: body.nextMatch } : {}) };
}

export async function getTournament(id:string, signal?:AbortSignal):Promise<CourtTournament> {
  const body=await edgeGet<{tournament:CourtTournament}>(new URLSearchParams({route:"tournament",id}), signal);
  return body.tournament;
}
