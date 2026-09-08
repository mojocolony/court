import { describe, expect, it } from "vitest";
import { filterTodayMatches } from "../../src/app/todayFilters";
import type { CourtMatch } from "../../src/data/courtApi";

const match = (tour: "ATP"|"WTA", eventType: "singles"|"doubles", id: string): CourtMatch => ({
  id, tournamentId:"t", tournamentName:"US Open", tour, eventType, surface:"hard",
  scheduledAt:"2026-09-08T17:00:00Z", status:"scheduled",
  home:{id:"1",name:"One",tour}, away:{id:"2",name:"Two",tour}, sets:[]
});
const matches = [match("ATP","singles","as"), match("WTA","singles","ws"), match("ATP","doubles","ad")];

describe("Today filters", () => {
  it("filters by tour without changing event type", () => {
    expect(filterTodayMatches(matches, "ATP", "singles").map(m => m.id)).toEqual(["as"]);
  });
  it("shows both tours when Both is selected", () => {
    expect(filterTodayMatches(matches, "BOTH", "singles").map(m => m.id)).toEqual(["as","ws"]);
  });
});
