import { describe, expect, it } from "vitest";
import type { CourtMatch } from "../src/data/courtApi";

function sample(overrides: Partial<CourtMatch> = {}): CourtMatch {
  return {
    id: "1", tournamentId: "10", tournamentName: "Shanghai Challenger", tour: "ATP",
    eventType: "singles", round: "R32", surface: "hard", scheduledAt: "2026-09-08T14:00:00Z",
    status: "scheduled", home: { id: "p1", name: "Player One", tour: "ATP" },
    away: { id: "p2", name: "Player Two", tour: "ATP" }, sets: [], level: "CHALLENGER", ...overrides
  };
}

describe("CourtMatch free-feed contract", () => {
  it("allows a useful match even when live scoring is absent", () => {
    const match = sample({ sets: [] });
    expect(match.home.name).toBe("Player One");
    expect(match.tournamentName).toContain("Shanghai");
    expect(match.sets).toEqual([]);
  });
});
