import type { PersonalState, TennisMatch } from "./types";

export function relevanceScore(
  match: TennisMatch,
  state: PersonalState,
  significant: (round?: string) => boolean
): number {
  if (state.starredMatchIds.includes(match.id)) return 400;
  if (state.followedPlayerIds.includes(match.home.id) || state.followedPlayerIds.includes(match.away.id)) return 300;
  if (state.followedTournamentIds.includes(match.tournamentId)) return 200;
  if (significant(match.round)) return 100;
  return 0;
}

export function rankMatches(
  matches: TennisMatch[],
  state: PersonalState,
  significant: (round?: string) => boolean
): TennisMatch[] {
  return [...matches].sort((a, b) => relevanceScore(b, state, significant) - relevanceScore(a, state, significant));
}