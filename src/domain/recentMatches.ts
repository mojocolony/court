import type { CourtMatch } from "../data/courtApi";

interface StorageLike {
  getItem(key:string): string|null;
  setItem(key:string,value:string): void;
}

const KEY = "baseline:recent-completed-matches";
const MAX_MATCHES = 60;

function isCompleted(match: CourtMatch) {
  const event = String(match.eventStatus ?? "").toLowerCase();
  return match.status === "completed" || event === "completed" || event === "final" || event === "finished";
}

function read(storage:StorageLike): CourtMatch[] {
  try {
    const value = JSON.parse(storage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter(item => item && typeof item === "object") as CourtMatch[] : [];
  } catch {
    return [];
  }
}

export function rememberCompletedMatch(match:CourtMatch, storage:StorageLike = localStorage): void {
  if (!isCompleted(match)) return;
  const matches = read(storage).filter(item => item.id !== match.id);
  matches.push(match);
  matches.sort((a,b) => Date.parse(b.scheduledAt || "") - Date.parse(a.scheduledAt || ""));
  storage.setItem(KEY, JSON.stringify(matches.slice(0, MAX_MATCHES)));
}

export function recentCompletedMatchesForPlayer(playerId:string, storage:StorageLike = localStorage): CourtMatch[] {
  return read(storage)
    .filter(match => match.home?.id === playerId || match.away?.id === playerId)
    .sort((a,b) => Date.parse(b.scheduledAt || "") - Date.parse(a.scheduledAt || ""));
}
