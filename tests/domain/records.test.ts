import { expect, it } from "vitest";
import { calculateRecord } from "../../src/domain/records";
import type { TennisMatch } from "../../src/domain/types";

const match = (id:string, date:string, surface:"hard"|"clay", winner:string): TennisMatch => ({
  id, tournamentId:"t", tournamentName:"T", tour:"ATP", eventType:"singles", surface,
  scheduledAt:date, status:"completed", home:{id:"p1",name:"P1",tour:"ATP"},
  away:{id:"p2",name:"P2",tour:"ATP"}, sets:[], winnerPlayerId:winner
});

it("calculates a surface record inside the requested time window", () => {
  const matches = [
    match("1","2026-01-01T00:00:00Z","hard","p1"),
    match("2","2026-02-01T00:00:00Z","hard","p2"),
    match("3","2026-03-01T00:00:00Z","hard","p1"),
    match("4","2026-04-01T00:00:00Z","clay","p2"),
    match("5","2025-01-01T00:00:00Z","hard","p2")
  ];
  expect(calculateRecord(matches,"p1",new Date("2025-09-07T00:00:00Z"),"hard"))
    .toEqual({wins:2,losses:1});
});