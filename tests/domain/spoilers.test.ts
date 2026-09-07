import { expect, it } from "vitest";
import { projectMatchForDisplay } from "../../src/domain/spoilers";
import type { PersonalState, TennisMatch } from "../../src/domain/types";

const completed: TennisMatch = {
  id:"m1", tournamentId:"t1", tournamentName:"US Open", tour:"ATP", eventType:"singles",
  surface:"hard", scheduledAt:"2026-09-06T18:00:00Z", status:"completed",
  home:{id:"p1",name:"A",tour:"ATP"}, away:{id:"p2",name:"B",tour:"ATP"},
  sets:[{home:6,away:4}], winnerPlayerId:"p1", currentGame:"0-0", serverPlayerId:"p1"
};
const state: PersonalState = {
  followedPlayerIds:[],followedTournamentIds:[],starredMatchIds:[],watchMatchIds:["m1"],
  watchedMatchIds:[],globalSpoilerMode:false
};

it("removes result-bearing fields from a protected completed match", () => {
  const result = projectMatchForDisplay(completed,state,new Set());
  expect(result.resultHidden).toBe(true);
  expect(result.sets).toEqual([]);
  expect(result.winnerPlayerId).toBeUndefined();
  expect(result.serverPlayerId).toBeUndefined();
});

it("allows an explicit reveal for only that match", () => {
  const result = projectMatchForDisplay(completed,state,new Set(["m1"]));
  expect(result.resultHidden).toBe(false);
  expect(result.winnerPlayerId).toBe("p1");
});