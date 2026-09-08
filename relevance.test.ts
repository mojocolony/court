import { expect, it } from "vitest";
import { rankMatches } from "../../src/domain/relevance";
import type { PersonalState, TennisMatch } from "../../src/domain/types";

const base = (id: string, tournamentId: string, homeId: string, round = "round_of_32"): TennisMatch => ({
  id, tournamentId, tournamentName: "Test", tour: "ATP", eventType: "singles",
  round, surface: "hard", scheduledAt: "2026-09-07T18:00:00Z", status: "scheduled",
  home: { id: homeId, name: homeId, tour: "ATP" }, away: { id: `${id}-away`, name: "Away", tour: "ATP" }, sets: []
});

it("uses the approved relevance priority", () => {
  const matches = [
    base("other","t0","p0"), base("qf","t0","p0","quarterfinal"),
    base("followedTournament","t2","p0"), base("followedPlayer","t0","p2"),
    base("starred","t0","p0")
  ];
  const personal: PersonalState = {
    followedPlayerIds:["p2"], followedTournamentIds:["t2"], starredMatchIds:["starred"],
    watchMatchIds:[], watchedMatchIds:[], globalSpoilerMode:false
  };
  expect(rankMatches(matches, personal, r => r === "quarterfinal").map(m => m.id))
    .toEqual(["starred","followedPlayer","followedTournament","qf","other"]);
});