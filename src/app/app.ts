import { createIcons, CalendarDays, Trophy, Users, Eye } from "lucide";
import { parseRoute } from "./routes";
import { getMatch, getTodayFeed, type CourtMatch, type TodayFeed } from "../data/courtApi";
import { filterTodayMatches, type DrawFilter, type TourFilter } from "./todayFilters";
import { dateFromLocalKey, dateRailItems, localDateKey } from "./todayDates";
import { matchHeading } from "./matchHeading";
import { readMatchPersonalState, writeMatchPersonalState } from "../domain/matchPersonalState";
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
    state.watch ? `<span>WATCH</span>` : ""
  ].filter(Boolean);
  return parts.length ? `<div class="match-personal">${parts.join("")}</div>` : "";
}

function matchRow(match: CourtMatch) {
  const score = scoreLabel(match);
  const round = matchHeading(match.round, match.roundCode);
  return `<a class="match" href="#/match/${encodeURIComponent(match.id)}">
    <div class="match-time ${match.status === "live" ? "is-live" : ""}">${escapeHtml(timeLabel(match))}</div>
    <div class="match-round">${escapeHtml(round)}</div>
    <div class="players">
      <div>${playerLine(match.home)}</div>
      <div>${playerLine(match.away)}</div>
    </div>
    <div class="match-status">
      ${score ? `<span class="match-score-inline">${escapeHtml(score)}</span>` : match.status === "live" ? `<span class="live-label">Live</span>` : ""}
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
  const matches = filterTodayMatches([...feed.live, ...feed.upcoming], tourFilter, drawFilter);
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
  const currentEvents = [...events.values()].map(match => `<a class="tour-event" href="#/tournament/${encodeURIComponent(match.tournamentId || match.id)}">
      <div><span class="tour-event-name">${escapeHtml(match.tournamentName)}</span><span class="tour-event-meta">${escapeHtml(match.tour)} · ${escapeHtml(match.eventType)}</span></div>
      <span class="surface ${match.surface}">${escapeHtml(match.surface.toUpperCase())}</span>
    </a>`).join("");

  return `${secondaryHero("Tour", `${now.getFullYear()} season`, "Season almanac")}
    <main class="tour-timeline">${monthNames.map((month, index) => `<section class="tour-month ${index === current ? "current" : ""}">
      <div class="tour-month-marker">${index === current ? `<span>Current</span>` : ""}</div>
      <h2>${escapeHtml(month)}</h2>
      <div class="tour-month-content">${index === current
        ? currentEvents || `<p class="timeline-note">Current tournaments will appear here as schedule data becomes available.</p>`
        : `<span class="timeline-rule"></span>`}</div>
    </section>`).join("")}</main>`;
}

function playersView() {
  return `${secondaryHero("Players", "Reference", "Following first")}
    <main class="players-page">
      <section class="following-section">
        <div class="section-heading"><h2>Following</h2><span>0 players</span></div>
        <p class="editorial-empty">Players you follow will stay here for quick access to ranking, form, current tournament and next-match context.</p>
      </section>
      <section class="players-search">
        <div class="section-heading"><h2>Find a player</h2><span>ATP · WTA</span></div>
        <label class="search-label" for="player-search">Search players</label>
        <input id="player-search" class="player-search-field" type="search" placeholder="Name" autocomplete="off">
      </section>
    </main>`;
}

function watchView() {
  return `${secondaryHero("Watch", "Personal", "Spoiler-safe viewing")}
    <main class="watch-sections">
      <section class="watch-section is-primary"><div class="section-heading"><h2>Up Next</h2><span>0</span></div><p class="editorial-empty">Matches you choose to watch will appear here in start-time order, with broadcast information when available.</p></section>
      <section class="watch-section"><div class="section-heading"><h2>Watch Later</h2><span>0</span></div><p class="editorial-empty">Keep matches here when you want to preserve them without committing to watching live.</p></section>
      <section class="watch-section"><div class="section-heading"><h2>Watched</h2><span>0</span></div><p class="editorial-empty">Completed viewing history and your match notes will accumulate here.</p></section>
    </main>`;
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
  const score = scoreLabel(match);
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
      ${score ? `<div class="match-score">${escapeHtml(score)}</div>` : ""}
      <div class="personal-actions">
        <button data-action="star" class="${state.starred ? "active" : ""}" aria-pressed="${state.starred}"><span class="action-icon">${state.starred ? "★" : "☆"}</span><span>${state.starred ? "Starred" : "Star"}</span></button>
        <button data-action="watch" class="${state.watch ? "active" : ""}" aria-pressed="${state.watch}"><span class="action-icon">${state.watch ? "●" : "○"}</span><span>${state.watch ? "Watching" : "Watch"}</span></button>
        <button data-action="note" class="${state.note ? "active" : ""}" aria-expanded="false"><span class="action-icon">＋</span><span>Note</span></button>
      </div>
      <div class="match-note-panel" hidden>
        <label class="note-label" for="match-note">Note</label>
        <textarea id="match-note" data-match-id="${escapeHtml(match.id)}" placeholder="Add a note…">${escapeHtml(state.note)}</textarea>
        <div class="note-status" aria-live="polite"></div>
      </div>
    </main>`;
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
    writeMatchPersonalState(match.id, { ...state, starred: !state.starred });
    renderRoot(root, shell("match", matchView(match)));
    wireMatch(root, match);
  };

  root.querySelector<HTMLElement>("[data-action='watch']")!.onclick = () => {
    const state = get();
    writeMatchPersonalState(match.id, { ...state, watch: !state.watch });
    renderRoot(root, shell("match", matchView(match)));
    wireMatch(root, match);
  };

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
      writeMatchPersonalState(match.id, { ...state, note: note.value });
      noteButton.classList.toggle("active", Boolean(note.value.trim()));
      const status = root.querySelector(".note-status");
      if (status) status.textContent = "Saved";
    }, 350);
  };
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

  const content = route.name === "tour"
    ? tourView()
    : route.name === "players"
      ? playersView()
      : route.name === "watch"
        ? watchView()
        : route.name === "player"
          ? `${secondaryHero("Player", "Reference", "Player profile")}<main><p class="intro">Current form, records and next-match context will live here.</p></main>`
          : `${secondaryHero("Tournament", "Tour", "Tournament detail")}<main><p class="intro">Matches, draw, players and tournament information will live here.</p></main>`;

  renderRoot(root, shell(route.name, content));
}
