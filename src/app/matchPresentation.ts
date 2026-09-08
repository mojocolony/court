import type { CourtMatch } from "../data/courtApi";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function matchIsCompleted(match: Pick<CourtMatch, "status" | "eventStatus">) {
  const event = String(match.eventStatus ?? "").toLowerCase();
  return match.status === "completed" || event === "completed" || event === "final" || event === "finished";
}

export function setScoreLabel(match: Pick<CourtMatch, "sets" | "setCounts" | "games">) {
  const games = match.games;
  if (Array.isArray(games) && games.length >= 2 && Array.isArray(games[0]) && Array.isArray(games[1])) {
    const home = games[0];
    const away = games[1];
    const length = Math.min(home.length, away.length);
    const labels: string[] = [];
    for (let index = 0; index < length; index++) {
      if (isNumber(home[index]) && isNumber(away[index])) labels.push(`${home[index]}–${away[index]}`);
    }
    if (labels.length) return labels.join("  ");
  }

  const sets = match.sets as unknown[];
  if (!Array.isArray(sets) || !sets.length) {
    const counts = match.setCounts;
    return Array.isArray(counts) && counts.length >= 2 && isNumber(counts[0]) && isNumber(counts[1]) ? `${counts[0]}–${counts[1]}` : "";
  }

  return sets.map(set => {
    if (Array.isArray(set) && set.length >= 2 && isNumber(set[0]) && isNumber(set[1])) return `${set[0]}–${set[1]}`;
    if (set && typeof set === "object") {
      const typed = set as { home?: unknown; away?: unknown };
      if (isNumber(typed.home) && isNumber(typed.away)) return `${typed.home}–${typed.away}`;
    }
    return "";
  }).filter(Boolean).join("  ");
}

export function inferredWinnerPlayerId(match: Pick<CourtMatch, "status" | "eventStatus" | "winnerPlayerId" | "sets" | "setCounts" | "games" | "home" | "away">) {
  if (!matchIsCompleted(match)) return undefined;
  if (match.winnerPlayerId) return match.winnerPlayerId;

  const counts = match.setCounts;
  if (Array.isArray(counts) && counts.length >= 2 && isNumber(counts[0]) && isNumber(counts[1]) && counts[0] !== counts[1]) {
    return counts[0] > counts[1] ? match.home.id : match.away.id;
  }

  if (Array.isArray(match.games) && Array.isArray(match.games[0]) && Array.isArray(match.games[1])) {
    let homeSets = 0;
    let awaySets = 0;
    const length = Math.min(match.games[0].length, match.games[1].length);
    for (let index = 0; index < length; index++) {
      const home = match.games[0][index];
      const away = match.games[1][index];
      if (!isNumber(home) || !isNumber(away) || home === away) continue;
      if (home > away) homeSets++; else awaySets++;
    }
    if (homeSets !== awaySets) return homeSets > awaySets ? match.home.id : match.away.id;
  }
  return undefined;
}

function detailedSetScoreLabel(match: Pick<CourtMatch, "sets" | "games">) {
  const games = match.games;
  if (Array.isArray(games) && games.length >= 2 && Array.isArray(games[0]) && Array.isArray(games[1])) {
    const labels:string[] = [];
    const length = Math.min(games[0].length, games[1].length);
    for (let index=0; index<length; index++) {
      const home=games[0][index], away=games[1][index];
      if (isNumber(home) && isNumber(away)) labels.push(`${home}–${away}`);
    }
    if (labels.length) return labels.join("  ");
  }
  if (!Array.isArray(match.sets)) return "";
  return (match.sets as unknown[]).map(set => {
    if (Array.isArray(set) && set.length >= 2 && isNumber(set[0]) && isNumber(set[1])) return `${set[0]}–${set[1]}`;
    if (set && typeof set === "object") {
      const typed=set as {home?:unknown;away?:unknown};
      if (isNumber(typed.home) && isNumber(typed.away)) return `${typed.home}–${typed.away}`;
    }
    return "";
  }).filter(Boolean).join("  ");
}

export function completedMatchPresentation(match: CourtMatch) {
  const completed = matchIsCompleted(match);
  const winnerPlayerId = inferredWinnerPlayerId(match);
  const winner = winnerPlayerId === match.home.id ? match.home : winnerPlayerId === match.away.id ? match.away : undefined;
  const loser = winnerPlayerId === match.home.id ? match.away : winnerPlayerId === match.away.id ? match.home : undefined;
  const resultLabel = completed && winner && loser ? `${winner.name} def. ${loser.name}` : "";
  let scoreLabel = detailedSetScoreLabel(match);
  if (!scoreLabel && completed && winner && Array.isArray(match.setCounts) && match.setCounts.length >= 2 && isNumber(match.setCounts[0]) && isNumber(match.setCounts[1])) {
    const winnerSets = winnerPlayerId === match.home.id ? match.setCounts[0] : match.setCounts[1];
    const loserSets = winnerPlayerId === match.home.id ? match.setCounts[1] : match.setCounts[0];
    scoreLabel = `${winner.name} won ${winnerSets} ${winnerSets === 1 ? "set" : "sets"} to ${loserSets}`;
  }
  if (!scoreLabel) scoreLabel = setScoreLabel(match);
  return {
    statusLabel: completed ? "FINAL" : match.status === "live" ? "LIVE" : "",
    scoreLabel,
    winnerPlayerId,
    resultLabel
  };
}
