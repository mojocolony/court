import type { CourtMatch } from '../data/courtApi.ts';
import type { MatchPersonalState } from '../domain/matchPersonalState.ts';
import { watchStateIsProtected } from '../domain/matchPersonalState.ts';
import { completedMatchPresentation, matchIsCompleted, setScoreLabel } from './matchPresentation.ts';

export interface WatchMatchPresentation {
  statusLabel: string;
  resultHidden: boolean;
  scoreLabel: string;
}

export function watchMatchPresentation(
  match: CourtMatch,
  state: MatchPersonalState,
  globalSpoilerMode: boolean,
  explicitlyRevealed: boolean
): WatchMatchPresentation {
  const completed = matchIsCompleted(match);
  const protectedByPreference = globalSpoilerMode || watchStateIsProtected(state);
  const resultHidden = (completed || match.status === 'live') && protectedByPreference && !explicitlyRevealed;
  const statusLabel = completed ? 'FINAL' : match.status === 'live' ? 'LIVE' : '';
  const scoreLabel = resultHidden ? '' : completed
    ? completedMatchPresentation(match).scoreLabel
    : setScoreLabel(match);
  return { statusLabel, resultHidden, scoreLabel };
}
