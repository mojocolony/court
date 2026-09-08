import type { TennisMatch } from "../domain/types";

export type MatchLevel = "TOUR" | "CHALLENGER" | "ITF" | "OTHER";

export interface CourtMatch extends TennisMatch {
  level?: MatchLevel;
  home: TennisMatch["home"] & { handedness?: string };
  away: TennisMatch["away"] & { handedness?: string };
}

export interface TodayFeed {
  provider: string;
  fetchedAt: string;
  live: CourtMatch[];
  upcoming: CourtMatch[];
  capabilities: Record<string, boolean>;
}

function config() {
  const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Court data connection is not configured.");
  return { url, key };
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
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  return utcRangeForOffsetDate(
    midnight.getFullYear(), midnight.getMonth(), midnight.getDate(), midnight.getTimezoneOffset()
  );
}

export async function getTodayFeed(signal?: AbortSignal, draw: "singles" | "doubles" = "singles"): Promise<TodayFeed> {
  const { url, key } = config();
  const { from, to } = localDayUtcRange();
  const params = new URLSearchParams({ route: "today", from, to, draw });
  const response = await fetch(`${url}/functions/v1/court-tennis?${params.toString()}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json"
    },
    signal
  });
  if (!response.ok) {
    const retry = response.headers.get("Retry-After");
    throw new Error(response.status === 429 && retry
      ? `Tennis data limit reached. Try again in ${retry} seconds.`
      : `Tennis data unavailable (${response.status}).`);
  }
  return response.json() as Promise<TodayFeed>;
}

export async function getMatch(id: string, signal?: AbortSignal): Promise<CourtMatch> {
  const { url, key } = config();
  const params = new URLSearchParams({ route: "match", id });
  const response = await fetch(`${url}/functions/v1/court-tennis?${params.toString()}`, {
    headers: { apikey:key, Authorization:`Bearer ${key}`, Accept:"application/json" }, signal
  });
  if (!response.ok) throw new Error(`Match data unavailable (${response.status}).`);
  const body = await response.json() as { match: CourtMatch };
  return body.match;
}
