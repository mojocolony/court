import { createIcons, CalendarDays, Trophy, Users, Eye } from "lucide";
import { parseRoute } from "./routes";
import { getMatch, getPlayer, getTodayFeed, getTournament, searchPlayers, type CourtMatch, type CourtPlayer, type CourtTournament, type TodayFeed } from "../data/courtApi";
import { filterTodayMatches, type DrawFilter, type TourFilter } from "./todayFilters";
import { dateFromLocalKey, dateRailItems, localDateKey } from "./todayDates";
import { matchHeading } from "./matchHeading";
import { listMatchPersonalRecords, readMatchPersonalState, watchStateIsProtected, writeMatchPersonalState, type MatchPersonalState, type WatchState } from "../domain/matchPersonalState";
import { followPlayer, followTournament, isPlayerFollowed, isTournamentFollowed, listFollowedPlayers, listFollowedTournaments, unfollowPlayer, unfollowTournament, type FollowedPlayer, type FollowedTournament } from "../domain/followedState";
import { persistFollowedPlayer, persistFollowedTournament, persistMatchState } from "../data/personalData";
import { rankMatches } from "../domain/relevance";
import type { PersonalState } from "../domain/types";
import "../styles/tokens.css";
import "../styles/layout.css";

const nav = [
  ["today", "Today", "calendar-days"],
  ["tour", "Tour", "trophy"],
  ["players", "Players", "users"],
  ["watch", "Watch", "eye"]
] as const;

let tourFilter: TourFilter = "BOTH";
let drawFilter: DrawFilter = "singles";
let selectedDate = new Date();
let lastFeed: TodayFeed | undefined;
let request: AbortController | undefined;
let playerSearchRequest: AbortController | undefined;
let playerSearchQuery = "";
let playerSearchResults: CourtPlayer[] = [];
const revealedMatchIds = new Set<string>();

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]!));
}

function navHref(key: string) {
  return `#/${key === "today" ? "" : key}`;
}

function renderRoot(root: HTMLElement, html: string) {
  root.innerHTML = html;
  createIcons({ icons: { CalendarDays, Trophy, Users, Eye } });
}

function fullDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function selectedTitle() {
  return localDateKey(selectedDate) === localDateKey(new Date())
    ? "Today"
    : new Intl.DateTimeFormat("en-CA", { weekday: "long" }).format(selectedDate);
}

function timeLabel(match: CourtMatch) {
  if (match.status === "live") return "LIVE";
  const date = new Date(match.scheduledAt);
  return Number.isNaN(date.getTime())
    ? "TBD"
    : new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" }).format(date);
}

function scoreLabel(match: CourtMatch) {
  const raw = match.sets as unknown as unknown[];
  if (!raw?.length) return "";
  if (raw.length === 2 && raw.every(value => typeof value === "number")) {
    return `${raw[0]}–${raw[1]}`;
  }
  return raw.map(set => {
    if (Array.isArray(set) && set.length >= 2) return `${set[0]}–${set[1]}`;
    if (set && typeof set === "object") {
      const typed = set as { home?: number; away?: number };
      if (typeof typed.home === "number" && typeof typed.away === "number") {
        return `${typed.home}–${typed.away}`;
      }
    }
    return "";
  }).filter(Boolean).join("  ");
}

function playerLine(player: CourtMatch["home"]) {
  return `<span class="player-name">${escapeHtml(player.name)}</span>${player.ranking ? `<span class="rank">${player.ranking}</span>` : ""}`;
}

function personalIndicators(match: CourtMatch) {
  const state = readMatchPersonalState(match.id);
  const parts = [
    state.starred ? `<span aria-label="Starred">★</span>` : "",
    state.watchState === "up_next" ? `<span>WATCH</span>` : state.watchState === "later" ? `<span>LATER</span>` : ""
  ].filter(Boolean);
  return parts.length ? `<div class="match-personal">${parts.join("")}</div>` : "";
}

function aggregatePersonalState(): PersonalState {
  const records = listMatchPersonalRecords();
  return {
    followedPlayerIds: listFollowedPlayers().map(player => player.id),
    followedTournamentIds: listFollowedTournaments().map(tournament => tournament.id),
    starredMatchIds: records.filter(record => record.state.starred).map(record => record.id),
    watchMatchIds: records.filter(record => watchStateIsProtected(record.state)).map(record => record.id),
    watchedMatchIds: records.filter(record => record.state.watchState === "watched").map(record => record.id),
    globalSpoilerMode: false
  };
}

function significantRound(round?: string) {
  const value = String(round ?? "").toLowerCase();
  return value.includes("quarter") || value.includes("semi") || value === "final" || value.includes("finals");
}

function matchRow(match: CourtMatch) {
  const state = readMatchPersonalState(match.id);
  const protectedScore = watchStateIsProtected(state) && !revealedMatchIds.has(match.id) && (match.status === "live" || match.status === "completed");
  const score = protectedScore ? "" : scoreLabel(match);
  const round = matchHeading(match.round, match.roundCode);
  return `<a class="match" href="#/match/${encodeURIComponent(match.id)}">
    <div class="match-time ${match.status === "live" ? "is-live" : ""}">${escapeHtml(timeLabel(match))}</div>
    <div class="match-round">${escapeHtml(round)}</div>
    <div class="players">
      <div>${playerLine(match.home)}</div>
      <div>${playerLine(match.away)}</div>
    </div>
    <div class="match-status">
      ${protectedScore ? `<span class="hidden-result">${match.status === "completed" ? "Result hidden" : "Score hidden"}</span>` : score ? `<span class="match-score-inline">${escapeHtml(score)}</span>` : match.status === "live" ? `<span class="live-label">Live</span>` : ""}
      ${personalIndicators(match)}
    </div>
  </a>`;
}

function tournamentKey(match: CourtMatch) {
  return `${match.tournamentId}|${match.eventType}|${match.surface}|${match.tour}`;
}

function tournamentSections(matches: CourtMatch[]) {
  const groups = new Map<string, CourtMatch[]>();
  for (const match of matches) {
    groups.set(tournamentKey(match), [...(groups.get(tournamentKey(match)) ?? []), match]);
  }

  return [...groups.values()].map(group => {
    const first = group[0];
    return `<section class="tournament">
      <div class="tournament-head">
        <div>
          <div class="eyebrow">${escapeHtml(first.tour)} · ${escapeHtml(first.eventType.toUpperCase())}</div>
          <h2>${escapeHtml(first.tournamentName)}</h2>
        </div>
        <span class="surface ${first.surface}">${escapeHtml(first.surface.toUpperCase())}</span>
      </div>
      <div class="schedule-head" aria-hidden="true">
        <span>Time</span><span>Round</span><span>Match</span><span>Status</span>
      </div>
      <div class="schedule-body">${group.map(matchRow).join("")}</div>
    </section>`;
  }).join("");
}

function segmented(name: string, options: [string, string][], selected: string) {
  return `<div class="segmented" data-filter="${name}">${options.map(([value, label]) =>
    `<button data-value="${value}" class="${value === selected ? "active" : ""}" aria-pressed="${value === selected}">${label}</button>`
  ).join("")}</div>`;
}

function dateRail() {
  const selectedKey = localDateKey(selectedDate);
  return `<div class="date-rail" aria-label="Choose day">${dateRailItems(new Date()).map(item =>
    `<button data-day-key="${item.key}" class="${item.key === selectedKey ? "active" : ""}" aria-pressed="${item.key === selectedKey}">
      <span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.day)}</strong>
    </button>`
  ).join("")}</div>`;
}

function todayContent(feed: TodayFeed) {
  const filtered = filterTodayMatches([...feed.live, ...feed.upcoming], tourFilter, drawFilter);
  for (const match of filtered) {
    const state=readMatchPersonalState(match.id);
    if(!state.match && (state.starred || state.watchState !== "none" || Boolean(state.note))) saveMatchState(match,state);
  }
  const matches = rankMatches(filtered, aggregatePersonalState(), significantRound) as CourtMatch[];
  const live = matches.filter(match => match.status === "live");
  const isToday = localDateKey(selectedDate) === localDateKey(new Date());
  const status = isToday ? (live.length ? `${live.length} live` : "No live matches") : "Schedule";
  const emptyDate = new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(selectedDate);

  return `<div class="today-controls-row">
      <div class="today-controls">
        ${segmented("tour", [["BOTH", "Both"], ["ATP", "ATP"], ["WTA", "WTA"]], tourFilter)}
        ${segmented("draw", [["singles", "Singles"], ["doubles", "Doubles"]], drawFilter)}
      </div>
      <div class="feed-status">${escapeHtml(status)} · updated ${new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" }).format(new Date(feed.fetchedAt))}</div>
    </div>
    ${matches.length
      ? tournamentSections(matches)
      : `<p class="empty-note">No ${tourFilter === "BOTH" ? "ATP or WTA" : tourFilter} ${drawFilter} matches scheduled for ${escapeHtml(emptyDate)}.</p>`}`;
}

function todayView(body = `<div class="loading">Loading matches…</div>`) {
  return `<header class="today-hero">
      <div>
        <h1>${escapeHtml(selectedTitle())}</h1>
        <div class="today-date">${escapeHtml(fullDateLabel(selectedDate))}</div>
      </div>
      <button class="quiet-button" aria-label="Text size">Aa</button>
    </header>
    ${dateRail()}
    <main class="today-main">${body}</main>`;
}

function placeholder(title: string, copy: string) {
  return `<header class="masthead"><h1>${title}</h1></header><main><p class="intro">${copy}</p></main>`;
}

function secondaryHero(title: string, kicker: string, detail: string) {
  return `<header class="secondary-hero">
    <div>
      <div class="eyebrow">${escapeHtml(kicker)}</div>
      <h1>${escapeHtml(title)}</h1>
    </div>
    <div class="secondary-detail">${escapeHtml(detail)}</div>
  </header>`;
}

function tourView() {
  const now = new Date();
  const monthNames = Array.from({ length: 12 }, (_, month) =>
    new Intl.DateTimeFormat("en-CA", { month: "long" }).format(new Date(now.getFullYear(), month, 1))
  );
  const current = now.getMonth();
  const currentMatches = lastFeed ? [...lastFeed.live, ...lastFeed.upcoming] : [];
  const events = new Map<string, CourtMatch>();
  for (const match of currentMatches) {
    if (!events.has(match.tournamentId || match.tournamentName)) events.set(match.tournamentId || match.tournamentName, match);
  }
  const currentEvents = [...events.values()].map(match => {
    const inner=`<div><span class="tour-event-name">${escapeHtml(match.tournamentName)}</span><span class="tour-event-meta">${escapeHtml(match.tour)} · ${escapeHtml(match.eventType)}</span></div><span class="surface ${match.surface}">${escapeHtml(match.surface.toUpperCase())}</span>`;
    return match.tournamentId
      ? `<a class="tour-event" href="#/tournament/${encodeURIComponent(match.tournamentId)}">${inner}</a>`
      : `<div class="tour-event">${inner}</div>`;
  }).join("");

  return `${secondaryHero("Tour", `${now.getFullYear()} season`, "Season almanac")}
    <main class="tour-timeline">${monthNames.map((month, index) => `<section class="tour-month ${index === current ? "current" : ""}">
      <div class="tour-month-marker">${index === current ? `<span>Current</span>` : ""}</div>
      <h2>${escapeHtml(month)}</h2>
      <div class="tour-month-content">${index === current
        ? currentEvents || `<p class="timeline-note">Current tournaments will appear here as schedule data becomes available.</p>`
        : `<span class="timeline-rule"></span>`}</div>
    </section>`).join("")}</main>`;
}

function playerAsFollowed(player: CourtPlayer): FollowedPlayer {
  return {
    id: player.id,
    name: player.name,
    tour: player.tour,
    countryCode: player.countryCode,
    ranking: player.ranking,
    hand: player.hand,
    birthday: player.birthday
  };
}

function playerMeta(player: Pick<CourtPlayer, "tour" | "countryCode" | "ranking">) {
  return [player.tour, player.countryCode, player.ranking ? `No. ${player.ranking}` : ""].filter(Boolean).join(" · ");
}

function followedPlayerRow(player: FollowedPlayer) {
  return `<div class="followed-player-row">
    <a href="#/player/${encodeURIComponent(player.id)}"><span class="followed-player-name">${escapeHtml(player.name)}</span><span>${escapeHtml(playerMeta(player))}</span></a>
    <button data-unfollow-player="${escapeHtml(player.id)}">Following</button>
  </div>`;
}

function playerSearchRow(player: CourtPlayer) {
  const followed = isPlayerFollowed(player.id);
  return `<div class="player-result">
    <a href="#/player/${encodeURIComponent(player.id)}"><span class="player-result-name">${escapeHtml(player.name)}</span><span>${escapeHtml(playerMeta(player))}</span></a>
    <button data-follow-player="${escapeHtml(player.id)}" class="${followed ? "active" : ""}">${followed ? "Following" : "Follow"}</button>
  </div>`;
}

function playersView() {
  const following = listFollowedPlayers();
  return `${secondaryHero("Players", "Reference", "Following first")}
    <main class="players-page">
      <section class="following-section">
        <div class="section-heading"><h2>Following</h2><span>${following.length} ${following.length === 1 ? "player" : "players"}</span></div>
        ${following.length ? `<div class="followed-player-list">${following.map(followedPlayerRow).join("")}</div>` : `<p class="editorial-empty">Players you follow will stay here for quick access to ranking, form, current tournament and next-match context.</p>`}
      </section>
      <section class="players-search">
        <div class="section-heading"><h2>Find a player</h2><span>ATP · WTA</span></div>
        <label class="search-label" for="player-search">Search players</label>
        <input id="player-search" class="player-search-field" type="search" placeholder="Name" autocomplete="off" value="${escapeHtml(playerSearchQuery)}">
        <div class="player-search-results" aria-live="polite">${playerSearchQuery.length >= 2
          ? playerSearchResults.length ? playerSearchResults.map(playerSearchRow).join("") : `<p class="editorial-empty search-empty">No matching ATP or WTA players.</p>`
          : ""}</div>
      </section>
    </main>`;
}

function watchMatchRow(record: ReturnType<typeof listMatchPersonalRecords>[number]) {
  const { state, id } = record;
  const match = state.match;
  if (!match) return "";
  const when = match.scheduledAt ? timeLabel(match as CourtMatch) : "TBD";
  const round = matchHeading(match.round, "roundCode" in match ? match.roundCode : undefined);
  const targetActions = state.watchState === "up_next"
    ? `<button data-watch-move="later" data-match-id="${escapeHtml(id)}">Later</button><button data-watch-move="watched" data-match-id="${escapeHtml(id)}">Watched</button>`
    : state.watchState === "later"
      ? `<button data-watch-move="up_next" data-match-id="${escapeHtml(id)}">Up Next</button><button data-watch-move="watched" data-match-id="${escapeHtml(id)}">Watched</button>`
      : `<button data-watch-move="up_next" data-match-id="${escapeHtml(id)}">Watch again</button>`;
  return `<article class="watch-match-row">
    <a href="#/match/${encodeURIComponent(id)}" class="watch-match-link">
      <span class="watch-time">${escapeHtml(when)}</span>
      <span class="watch-players">${escapeHtml(match.home.name)} <i>vs</i> ${escapeHtml(match.away.name)}</span>
      <span class="watch-context">${escapeHtml(match.tournamentName)} · ${escapeHtml(round)}</span>
      ${state.note ? `<span class="watch-note">${escapeHtml(state.note)}</span>` : ""}
    </a>
    <div class="watch-row-actions">${targetActions}<button data-watch-move="none" data-match-id="${escapeHtml(id)}">Remove</button></div>
  </article>`;
}

function watchSection(title:string, state:WatchState, copy:string) {
  const records=listMatchPersonalRecords()
    .filter(record => record.state.watchState === state && record.state.match)
    .sort((a,b) => state === "watched"
      ? Date.parse(b.state.watchedAt ?? "") - Date.parse(a.state.watchedAt ?? "")
      : Date.parse(a.state.match?.scheduledAt ?? "") - Date.parse(b.state.match?.scheduledAt ?? ""));
  return `<section class="watch-section ${state === "up_next" ? "is-primary" : ""}">
    <div class="section-heading"><h2>${escapeHtml(title)}</h2><span>${records.length}</span></div>
    ${records.length ? `<div class="watch-match-list">${records.map(watchMatchRow).join("")}</div>` : `<p class="editorial-empty">${escapeHtml(copy)}</p>`}
  </section>`;
}

function watchView() {
  return `${secondaryHero("Watch", "Personal", "Spoiler-safe viewing")}
    <main class="watch-sections">
      ${watchSection("Up Next", "up_next", "Matches you choose to watch will appear here in start-time order, with broadcast information when available.")}
      ${watchSection("Watch Later", "later", "Keep matches here when you want to preserve them without committing to watching live.")}
      ${watchSection("Watched", "watched", "Completed viewing history and your match notes will accumulate here.")}
    </main>`;
}

function playerAge(birthday?: string) {
  if (!birthday) return undefined;
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday = now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age--;
  return age;
}

function playerDetailView(player:CourtPlayer) {
  const followed=isPlayerFollowed(player.id);
  const age=playerAge(player.birthday);
  const facts=[
    player.ranking ? `<div><strong>${player.ranking}</strong><span>Ranking</span></div>` : "",
    age !== undefined ? `<div><strong>${age}</strong><span>Age</span></div>` : "",
    player.hand ? `<div><strong>${player.hand === "R" ? "Right" : player.hand === "L" ? "Left" : escapeHtml(player.hand)}</strong><span>Hand</span></div>` : "",
    player.countryCode ? `<div><strong>${escapeHtml(player.countryCode)}</strong><span>Country</span></div>` : ""
  ].filter(Boolean).join("");
  return `<a class="back-link" href="#/players">← Players</a>
    <header class="player-profile-hero">
      <div><div class="eyebrow">${escapeHtml(player.tour)} · Player</div><h1>${escapeHtml(player.name)}</h1></div>
      <button class="follow-control ${followed ? "active" : ""}" data-profile-follow="${escapeHtml(player.id)}">${followed ? "Following" : "Follow"}</button>
    </header>
    <main class="player-profile-main">
      <div class="player-facts">${facts || `<span class="editorial-empty">Profile details are limited for this player.</span>`}</div>
      <section class="player-profile-section"><div class="section-heading"><h2>Current context</h2><span>Free data</span></div>${player.nextMatch ? `<a class="player-next-match" href="#/match/${encodeURIComponent(player.nextMatch.id)}"><span>Next match</span><strong>${escapeHtml(player.nextMatch.home.name)} <i>vs</i> ${escapeHtml(player.nextMatch.away.name)}</strong><span>${escapeHtml(player.nextMatch.tournamentName)} · ${escapeHtml(matchHeading(player.nextMatch.round, player.nextMatch.roundCode))} · ${escapeHtml(timeLabel(player.nextMatch))}</span></a>` : `<p class="editorial-empty">No upcoming match is currently listed.</p>`}<p class="editorial-empty player-data-note">Recent completed-match form and deep historical records remain unavailable on the free data plan.</p></section>
    </main>`;
}

function tournamentAsFollowed(tournament:CourtTournament):FollowedTournament {
  return { id:tournament.id, name:tournament.name, tour:tournament.tour, surface:tournament.surface, city:tournament.city, country:tournament.country, category:tournament.category };
}

function tournamentDetailView(tournament:CourtTournament) {
  const followed=isTournamentFollowed(tournament.id);
  const location=[tournament.city,tournament.country].filter(Boolean).join(", ");
  return `<a class="back-link" href="#/tour">← Tour</a>
    <header class="tournament-profile-hero">
      <div><div class="eyebrow">${escapeHtml(tournament.tour)} · ${escapeHtml(tournament.category?.replaceAll("_"," ") ?? "Tournament")}</div><h1>${escapeHtml(tournament.name)}</h1><p>${escapeHtml([location, tournament.surface !== "unknown" ? tournament.surface : ""].filter(Boolean).join(" · "))}</p></div>
      <button class="follow-control ${followed ? "active" : ""}" data-tournament-follow="${escapeHtml(tournament.id)}">${followed ? "Following" : "Follow"}</button>
    </header>
    <main class="tournament-profile-main"><nav class="detail-tabs"><span class="active">Matches</span><span>Draw</span><span>Players</span><span>Info</span></nav><p class="editorial-empty">Today and upcoming match schedules will appear here when available. Draw data remains provider-dependent on the free plan.</p></main>`;
}

function shell(routeName: string, content: string) {
  return `<div class="shell">
    <header class="app-header">
      <a class="wordmark" href="#/" aria-label="Baseline home">BASELINE</a>
      <nav class="top-nav" aria-label="Primary navigation">${nav.map(([key, label]) =>
        `<a href="${navHref(key)}" class="${routeName === key ? "active" : ""}">${label}</a>`
      ).join("")}</nav>
    </header>
    ${content}
    <nav class="bottom-nav" aria-label="Primary navigation">${nav.map(([key, label, icon]) =>
      `<a href="${navHref(key)}" class="${routeName === key ? "active" : ""}"><i data-lucide="${icon}" aria-hidden="true"></i><span>${label}</span></a>`
    ).join("")}</nav>
  </div>`;
}

function matchView(match: CourtMatch) {
  const state = readMatchPersonalState(match.id);
  const protectedScore = watchStateIsProtected(state) && !revealedMatchIds.has(match.id) && (match.status === "live" || match.status === "completed");
  const score = protectedScore ? "" : scoreLabel(match);
  return `<a class="back-link" href="#/">← Today</a>
    <header class="match-masthead">
      <div class="eyebrow">${escapeHtml(match.tour)} · ${escapeHtml(match.tournamentName)}</div>
      <div class="match-title-row">
        <h1>${escapeHtml(matchHeading(match.round, match.roundCode))}</h1>
        <span class="surface ${match.surface}">${escapeHtml(match.surface.toUpperCase())}</span>
      </div>
    </header>
    <main>
      <div class="match-context"><span>${match.eventType === "doubles" ? "DOUBLES" : "SINGLES"}</span><span>${escapeHtml(timeLabel(match))}</span></div>
      <div class="match-players">
        <div class="match-player">${playerLine(match.home)}</div>
        <div class="match-versus">vs</div>
        <div class="match-player">${playerLine(match.away)}</div>
      </div>
      ${protectedScore ? `<div class="protected-result"><span>${match.status === "completed" ? "Result hidden" : "Score hidden"}</span><button data-action="reveal">Reveal</button></div>` : score ? `<div class="match-score">${escapeHtml(score)}</div>` : ""}
      <div class="personal-actions">
        <button data-action="star" class="${state.starred ? "active" : ""}" aria-pressed="${state.starred}"><span class="action-icon">${state.starred ? "★" : "☆"}</span><span>${state.starred ? "Starred" : "Star"}</span></button>
        <button data-action="watch" class="${state.watchState === "up_next" ? "active" : ""}" aria-pressed="${state.watchState === "up_next"}"><span class="action-icon">${state.watchState === "up_next" ? "●" : "○"}</span><span>${state.watchState === "up_next" ? "Watching" : state.watchState === "later" ? "Watch later" : state.watchState === "watched" ? "Watched" : "Watch"}</span></button>
        <button data-action="note" class="${state.note ? "active" : ""}" aria-expanded="false"><span class="action-icon">＋</span><span>Note</span></button>
      </div>
      <div class="match-note-panel" hidden>
        <label class="note-label" for="match-note">Note</label>
        <textarea id="match-note" data-match-id="${escapeHtml(match.id)}" placeholder="Add a note…">${escapeHtml(state.note)}</textarea>
        <div class="note-status" aria-live="polite"></div>
      </div>
    </main>`;
}

function saveMatchState(match:CourtMatch, state:MatchPersonalState) {
  const withMatch:MatchPersonalState={ ...state, match };
  writeMatchPersonalState(match.id, withMatch);
  void persistMatchState(match.id, withMatch);
}

function rerenderToday(root: HTMLElement) {
  if (!lastFeed) return;
  renderRoot(root, shell("today", todayView(todayContent(lastFeed))));
  wireToday(root);
}

function wireToday(root: HTMLElement) {
  root.querySelectorAll<HTMLButtonElement>("[data-filter='tour'] button").forEach(button => {
    button.onclick = () => {
      tourFilter = button.dataset.value as TourFilter;
      rerenderToday(root);
    };
  });

  root.querySelectorAll<HTMLButtonElement>("[data-filter='draw'] button").forEach(button => {
    button.onclick = () => {
      const next = button.dataset.value as DrawFilter;
      if (next === drawFilter) return;
      drawFilter = next;
      loadToday(root);
    };
  });

  root.querySelectorAll<HTMLButtonElement>("[data-day-key]").forEach(button => {
    button.onclick = () => {
      const key = button.dataset.dayKey;
      if (!key || key === localDateKey(selectedDate)) return;
      selectedDate = dateFromLocalKey(key);
      loadToday(root);
    };
  });
}

function wireMatch(root: HTMLElement, match: CourtMatch) {
  const get = () => readMatchPersonalState(match.id);

  root.querySelector<HTMLElement>("[data-action='star']")!.onclick = () => {
    const state = get();
    saveMatchState(match, { ...state, starred: !state.starred });
    renderRoot(root, shell("match", matchView(match)));
    wireMatch(root, match);
  };

  root.querySelector<HTMLElement>("[data-action='watch']")!.onclick = () => {
    const state = get();
    const next:WatchState = state.watchState === "up_next" ? "none" : "up_next";
    saveMatchState(match, { ...state, watchState: next, watchedAt: null });
    renderRoot(root, shell("match", matchView(match)));
    wireMatch(root, match);
  };

  root.querySelector<HTMLButtonElement>("[data-action='reveal']")?.addEventListener("click", () => {
    revealedMatchIds.add(match.id);
    renderRoot(root, shell("match", matchView(match)));
    wireMatch(root, match);
  });

  const noteButton = root.querySelector<HTMLButtonElement>("[data-action='note']")!;
  const panel = root.querySelector<HTMLElement>(".match-note-panel")!;
  const note = root.querySelector<HTMLTextAreaElement>("#match-note")!;
  noteButton.onclick = () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    noteButton.setAttribute("aria-expanded", String(opening));
    if (opening) requestAnimationFrame(() => note.focus());
  };

  let timer: number | undefined;
  note.oninput = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const state = get();
      saveMatchState(match, { ...state, note: note.value });
      noteButton.classList.toggle("active", Boolean(note.value.trim()));
      const status = root.querySelector(".note-status");
      if (status) status.textContent = "Saved";
    }, 350);
  };
}

function wirePlayers(root:HTMLElement) {
  const search = root.querySelector<HTMLInputElement>("#player-search");
  if (search) {
    let timer:number|undefined;
    search.oninput=()=>{
      playerSearchQuery=search.value;
      clearTimeout(timer);
      playerSearchRequest?.abort();
      if(playerSearchQuery.trim().length<2) {
        playerSearchResults=[];
        renderRoot(root,shell("players",playersView()));
        wirePlayers(root);
        return;
      }
      timer=window.setTimeout(()=>{
        playerSearchRequest=new AbortController();
        searchPlayers(playerSearchQuery,playerSearchRequest.signal).then(results=>{
          if(parseRoute(location.hash).name!=="players") return;
          playerSearchResults=results;
          renderRoot(root,shell("players",playersView()));
          wirePlayers(root);
          requestAnimationFrame(()=>root.querySelector<HTMLInputElement>("#player-search")?.focus());
        }).catch(error=>{
          if(error instanceof DOMException && error.name==="AbortError") return;
          const results=root.querySelector<HTMLElement>(".player-search-results");
          if(results) results.innerHTML=`<p class="editorial-empty search-empty">${escapeHtml(error instanceof Error?error.message:"Player search is unavailable.")}</p>`;
        });
      },300);
    };
  }

  root.querySelectorAll<HTMLButtonElement>("[data-follow-player]").forEach(button=>{
    button.onclick=()=>{
      const player=playerSearchResults.find(item=>item.id===button.dataset.followPlayer);
      if(!player) return;
      const followed=isPlayerFollowed(player.id);
      const record=playerAsFollowed(player);
      if(followed) unfollowPlayer(player.id); else followPlayer(record);
      void persistFollowedPlayer(record,!followed);
      renderRoot(root,shell("players",playersView()));
      wirePlayers(root);
    };
  });

  root.querySelectorAll<HTMLButtonElement>("[data-unfollow-player]").forEach(button=>{
    button.onclick=()=>{
      const id=button.dataset.unfollowPlayer;
      if(!id) return;
      const player=listFollowedPlayers().find(item=>item.id===id);
      if(!player) return;
      unfollowPlayer(id);
      void persistFollowedPlayer(player,false);
      renderRoot(root,shell("players",playersView()));
      wirePlayers(root);
    };
  });
}

function wireWatch(root:HTMLElement) {
  root.querySelectorAll<HTMLButtonElement>("[data-watch-move]").forEach(button=>{
    button.onclick=()=>{
      const id=button.dataset.matchId;
      const target=button.dataset.watchMove as WatchState|undefined;
      if(!id||!target) return;
      const state=readMatchPersonalState(id);
      const next={...state,watchState:target,watchedAt:target==="watched"?new Date().toISOString():null};
      writeMatchPersonalState(id,next);
      void persistMatchState(id,next);
      renderRoot(root,shell("watch",watchView()));
      wireWatch(root);
    };
  });
}

function wirePlayerProfile(root:HTMLElement, player:CourtPlayer) {
  root.querySelector<HTMLButtonElement>("[data-profile-follow]")?.addEventListener("click",()=>{
    const record=playerAsFollowed(player);
    const followed=isPlayerFollowed(player.id);
    if(followed) unfollowPlayer(player.id); else followPlayer(record);
    void persistFollowedPlayer(record,!followed);
    renderRoot(root,shell("player",playerDetailView(player)));
    wirePlayerProfile(root,player);
  });
}

function wireTournamentProfile(root:HTMLElement, tournament:CourtTournament) {
  root.querySelector<HTMLButtonElement>("[data-tournament-follow]")?.addEventListener("click",()=>{
    const record=tournamentAsFollowed(tournament);
    const followed=isTournamentFollowed(tournament.id);
    if(followed) unfollowTournament(tournament.id); else followTournament(record);
    void persistFollowedTournament(record,!followed);
    renderRoot(root,shell("tournament",tournamentDetailView(tournament)));
    wireTournamentProfile(root,tournament);
  });
}

function loadToday(root: HTMLElement) {
  request?.abort();
  request = new AbortController();
  lastFeed = undefined;
  renderRoot(root, shell("today", todayView()));
  wireToday(root);

  getTodayFeed(request.signal, drawFilter, selectedDate).then(feed => {
    if (parseRoute(location.hash).name !== "today") return;
    lastFeed = feed;
    renderRoot(root, shell("today", todayView(todayContent(feed))));
    wireToday(root);
  }).catch(error => {
    if (error instanceof DOMException && error.name === "AbortError") return;
    if (parseRoute(location.hash).name === "today") {
      renderRoot(root, shell("today", todayView(`<div class="data-error"><strong>Matches couldn’t load.</strong><span>${escapeHtml(error instanceof Error ? error.message : "Tennis data is unavailable.")}</span><button onclick="location.reload()">Try again</button></div>`)));
      wireToday(root);
    }
  });
}

export function renderApp(root: HTMLElement) {
  request?.abort();
  playerSearchRequest?.abort();
  const route = parseRoute(location.hash);

  if (route.name === "today") {
    renderRoot(root, shell("today", todayView()));
    loadToday(root);
    return;
  }

  if (route.name === "match") {
    renderRoot(root, shell("match", placeholder("Match", "Loading match…")));
    request = new AbortController();
    getMatch(route.id, request.signal).then(match => {
      if (parseRoute(location.hash).name !== "match") return;
      renderRoot(root, shell("match", matchView(match)));
      wireMatch(root, match);
    }).catch(error => {
      renderRoot(root, shell("match", placeholder("Match", error instanceof Error ? error.message : "Match data is unavailable.")));
    });
    return;
  }

  if (route.name === "players") {
    renderRoot(root, shell("players", playersView()));
    wirePlayers(root);
    return;
  }

  if (route.name === "watch") {
    renderRoot(root, shell("watch", watchView()));
    wireWatch(root);
    return;
  }

  if (route.name === "tour") {
    renderRoot(root, shell("tour", tourView()));
    if (!lastFeed) {
      request = new AbortController();
      getTodayFeed(request.signal, "singles", new Date()).then(feed => {
        if (parseRoute(location.hash).name !== "tour") return;
        lastFeed = feed;
        renderRoot(root, shell("tour", tourView()));
      }).catch(() => { /* Tour keeps its honest empty timeline if schedule data is unavailable. */ });
    }
    return;
  }

  if (route.name === "player") {
    renderRoot(root, shell("player", placeholder("Player", "Loading player…")));
    request = new AbortController();
    getPlayer(route.id, request.signal).then(player => {
      if (parseRoute(location.hash).name !== "player") return;
      renderRoot(root, shell("player", playerDetailView(player)));
      wirePlayerProfile(root, player);
    }).catch(error => renderRoot(root, shell("player", placeholder("Player", error instanceof Error ? error.message : "Player data is unavailable."))));
    return;
  }

  renderRoot(root, shell("tournament", placeholder("Tournament", "Loading tournament…")));
  request = new AbortController();
  getTournament(route.id, request.signal).then(tournament => {
    if (parseRoute(location.hash).name !== "tournament") return;
    renderRoot(root, shell("tournament", tournamentDetailView(tournament)));
    wireTournamentProfile(root, tournament);
  }).catch(error => renderRoot(root, shell("tournament", placeholder("Tournament", error instanceof Error ? error.message : "Tournament data is unavailable."))));
}

export function refreshPersonalUI(root:HTMLElement) {
  const route=parseRoute(location.hash);
  if(route.name==="today" && lastFeed) {
    rerenderToday(root);
  } else if(route.name==="players") {
    renderRoot(root,shell("players",playersView()));
    wirePlayers(root);
  } else if(route.name==="watch") {
    renderRoot(root,shell("watch",watchView()));
    wireWatch(root);
  }
}
