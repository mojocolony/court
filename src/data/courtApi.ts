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

export async function getTodayFeed(signal?: AbortSignal): Promise<TodayFeed> {
  const { url, key } = config();
  const response = await fetch(`${url}/functions/v1/court-tennis?route=today`, {
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
