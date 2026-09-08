import type { CourtMatch } from '../data/courtApi.ts';
import type { Surface, Tour } from '../domain/types.ts';

export interface TourTimelineEvent {
  tournamentId: string;
  tournamentName: string;
  tour: Tour;
  surface: Surface;
  scheduledAt: string;
  followed: boolean;
}

export function tourTimelineEvents(matches: CourtMatch[], followedTournamentIds: string[]): TourTimelineEvent[] {
  const followed = new Set(followedTournamentIds);
  const map = new Map<string, TourTimelineEvent>();
  for (const match of matches) {
    if (!match.tournamentId) continue;
    const key = `${match.tournamentId}|${match.tour}`;
    const event: TourTimelineEvent = {
      tournamentId: match.tournamentId,
      tournamentName: match.tournamentName,
      tour: match.tour,
      surface: match.surface,
      scheduledAt: match.scheduledAt,
      followed: followed.has(match.tournamentId)
    };
    const existing = map.get(key);
    if (!existing || Date.parse(event.scheduledAt) < Date.parse(existing.scheduledAt)) map.set(key, event);
  }
  return [...map.values()].sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
}
