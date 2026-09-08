import type { PersonalState, TennisMatch } from "./types";

export type DisplayMatch = TennisMatch & { resultHidden: boolean };

export function isMatchProtected(matchId: string, state: PersonalState): boolean {
  return state.globalSpoilerMode || state.watchMatchIds.includes(matchId);
}

export function projectMatchForDisplay(
  match: TennisMatch,
  state: PersonalState,
  explicitlyRevealedIds: Set<string>
): DisplayMatch {
  const hidden = match.status === "completed" &&
    isMatchProtected(match.id, state) &&
    !explicitlyRevealedIds.has(match.id);

  if (!hidden) return { ...match, resultHidden: false };
  return {
    ...match,
    sets: [],
    winnerPlayerId: undefined,
    currentGame: undefined,
    serverPlayerId: undefined,
    resultHidden: true
  };
}