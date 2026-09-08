import type { CourtMatch } from "../data/courtApi";
export type TourFilter = "BOTH" | "ATP" | "WTA";
export type DrawFilter = "singles" | "doubles";
export function filterTodayMatches(matches: CourtMatch[], tour: TourFilter, draw: DrawFilter): CourtMatch[] {
  return matches.filter(m => m.eventType === draw && (tour === "BOTH" || m.tour === tour));
}
