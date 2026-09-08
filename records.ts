import type { Surface, TennisMatch } from "./types";

export interface RecordSummary { wins: number; losses: number; }

export function calculateRecord(
  matches: TennisMatch[],
  playerId: string,
  since: Date,
  surface?: Surface
): RecordSummary {
  return matches.reduce<RecordSummary>((record, match) => {
    if (match.status !== "completed" || !match.winnerPlayerId) return record;
    if (new Date(match.scheduledAt) < since) return record;
    if (surface && match.surface !== surface) return record;
    if (match.home.id !== playerId && match.away.id !== playerId) return record;
    if (match.winnerPlayerId === playerId) record.wins++;
    else record.losses++;
    return record;
  }, { wins: 0, losses: 0 });
}

export function recentForm(matches: TennisMatch[], playerId: string, limit = 5): ("W" | "L")[] {
  return matches
    .filter(m => m.status === "completed" && m.winnerPlayerId &&
      (m.home.id === playerId || m.away.id === playerId))
    .sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt))
    .slice(0, limit)
    .map(m => m.winnerPlayerId === playerId ? "W" : "L");
}