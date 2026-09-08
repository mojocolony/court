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
  live?: CourtMatch[];
  upcoming?: CourtMatch[];
}

const PLAYER_SEARCH_CACHE_KEY = "baseline.player-search-cache.v1";
const PLAYER_SEARCH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
type PlayerSearchCacheEntry = { savedAt: number; players: CourtPlayer[] };
const playerSearchMemory = new Map<string, PlayerSearchCacheEntry>();

function normalizedPlayerSearch(search:string) {
  return search.trim().replace(/\s+/g, " ").toLowerCase();
}

function loadPlayerSearchStorage() {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(PLAYER_SEARCH_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, PlayerSearchCacheEntry>;
    for (const [key, value] of Object.entries(parsed)) {
      if (value && typeof value.savedAt === "number" && Array.isArray(value.players)) playerSearchMemory.set(key, value);
    }
  } catch { /* cache is disposable */ }
}

function savePlayerSearchStorage() {
  if (typeof localStorage === "undefined") return;
  try {
    const entries = [...playerSearchMemory.entries()]
      .filter(([, value]) => Date.now() - value.savedAt < PLAYER_SEARCH_CACHE_TTL_MS)
      .slice(-40);
    localStorage.setItem(PLAYER_SEARCH_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch { /* cache is disposable */ }
}

loadPlayerSearchStorage();

export function findCachedPlayerSearch(search:string):CourtPlayer[] | undefined {
  const query = normalizedPlayerSearch(search);
  const now = Date.now();
  const candidates = [...playerSearchMemory.entries()]
    .filter(([key, entry]) => query.startsWith(key) && now - entry.savedAt < PLAYER_SEARCH_CACHE_TTL_MS)
    .sort((a, b) => b[0].length - a[0].length);
  if (!candidates.length) return undefined;
  const [, entry] = candidates[0];
  return entry.players.filter(player => player.name.toLowerCase().includes(query));
}

export function writeCachedPlayerSearch(search:string, players:CourtPlayer[]) {
  const query = normalizedPlayerSearch(search);
  if (query.length < 3) return;
  playerSearchMemory.set(query, { savedAt: Date.now(), players });
  savePlayerSearchStorage();
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
    if (response.status === 429) {
      throw new Error(retry
        ? `Tennis data limit reached on the free provider. Try again in ${retry} seconds.`
        : "Tennis data limit reached on the free provider. Try again after the provider quota resets.");
    }
    throw new Error(`Tennis data unavailable (${response.status}).`);
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


export async function getTourSlate(signal?:AbortSignal, start = new Date(), days = 21):Promise<CourtMatch[]> {
  const from = new Date(start);
  from.setHours(0,0,0,0);
  const to = new Date(from);
  to.setDate(to.getDate()+Math.max(1,days));
  to.setMilliseconds(to.getMilliseconds()-1);
  const body=await edgeGet<{matches:CourtMatch[]}>(new URLSearchParams({route:"tour_slate",from:from.toISOString(),to:to.toISOString()}), signal);
  return body.matches;
}

export async function getMatch(id: string, signal?: AbortSignal): Promise<CourtMatch> {
  const body=await edgeGet<{match:CourtMatch}>(new URLSearchParams({route:"match",id}), signal);
  return body.match;
}

export async function searchPlayers(search:string, signal?:AbortSignal):Promise<CourtPlayer[]> {
  const query = search.trim().replace(/\s+/g, " ");
  if(query.length<3) return [];
  const cached = findCachedPlayerSearch(query);
  if (cached !== undefined) return cached;
  const body=await edgeGet<{players:CourtPlayer[]}>(new URLSearchParams({route:"players",search:query}), signal);
  writeCachedPlayerSearch(query, body.players);
  return body.players;
}

export async function getPlayer(id:string, signal?:AbortSignal):Promise<CourtPlayer> {
  const body=await edgeGet<{player:CourtPlayer;nextMatch?:CourtMatch}>(new URLSearchParams({route:"player",id}), signal);
  return { ...body.player, ...(body.nextMatch ? { nextMatch: body.nextMatch } : {}) };
}

export async function getTournament(id:string, signal?:AbortSignal):Promise<CourtTournament> {
  const body=await edgeGet<{tournament:CourtTournament;live?:CourtMatch[];upcoming?:CourtMatch[]}>(new URLSearchParams({route:"tournament",id}), signal);
  return { ...body.tournament, live:body.live ?? [], upcoming:body.upcoming ?? [] };
}
