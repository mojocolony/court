import { parseRoute } from "./routes";
import { getTodayFeed, type CourtMatch, type TodayFeed } from "../data/courtApi";
import { isMainTourMatch } from "../domain/tourVisibility";
import "../styles/tokens.css";
import "../styles/layout.css";

const nav = [["today", "Today"], ["tour", "Tour"], ["players", "Players"], ["watch", "Watch"]] as const;

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
}
function dayHeading(): string {
  return new Intl.DateTimeFormat("en-CA", { weekday:"long", month:"long", day:"numeric" }).format(new Date()).toUpperCase();
}
function timeLabel(match: CourtMatch): string {
  if (match.status === "live") return "LIVE";
  const date = new Date(match.scheduledAt);
  return Number.isNaN(date.getTime()) ? "TBD" : new Intl.DateTimeFormat("en-CA", { hour:"numeric", minute:"2-digit" }).format(date);
}
function scoreLabel(match: CourtMatch): string {
  if (!match.sets?.length) return "";
  return match.sets.map(s => `${s.home}–${s.away}`).join("  ");
}
function playerLine(player: CourtMatch["home"]): string {
  return `<span>${escapeHtml(player.name)}</span>${player.ranking ? `<span class="rank">${player.ranking}</span>` : ""}`;
}
function matchRow(match: CourtMatch): string {
  const score = scoreLabel(match);
  return `<a class="match" href="#/match/${encodeURIComponent(match.id)}">
    <div class="match-time ${match.status === "live" ? "is-live" : ""}">${timeLabel(match)}${score ? `<span>${escapeHtml(score)}</span>` : ""}</div>
    <div class="players"><div>${playerLine(match.home)}</div><div>${playerLine(match.away)}</div></div>
    <div class="match-meta">${escapeHtml(match.round ?? "")}</div>
  </a>`;
}
function tournamentKey(m: CourtMatch): string { return `${m.tournamentId}|${m.eventType}|${m.surface}`; }
function tournamentSections(matches: CourtMatch[]): string {
  const groups = new Map<string, CourtMatch[]>();
  for (const match of matches) groups.set(tournamentKey(match), [...(groups.get(tournamentKey(match)) ?? []), match]);
  return [...groups.values()].map(group => {
    const first = group[0];
    return `<section class="tournament">
      <div class="tournament-head"><div><div class="eyebrow">${escapeHtml(first.tour)} · ${escapeHtml(first.eventType.toUpperCase())}</div><h2>${escapeHtml(first.tournamentName)}</h2></div><span class="surface ${first.surface}">${escapeHtml(first.surface.toUpperCase())}</span></div>
      ${group.map(matchRow).join("")}
    </section>`;
  }).join("");
}
function todayContent(feed: TodayFeed): string {
  const visibleLive = feed.live.filter(m => m.eventType === "singles" && isMainTourMatch(m));
  const visibleUpcoming = feed.upcoming.filter(m => m.eventType === "singles" && isMainTourMatch(m));
  const matches = [...visibleLive, ...visibleUpcoming];
  return `<div class="feed-status">${visibleLive.length ? `${visibleLive.length} live` : "No live matches"} · updated ${new Intl.DateTimeFormat("en-CA", {hour:"numeric", minute:"2-digit"}).format(new Date(feed.fetchedAt))}</div>
    ${matches.length ? tournamentSections(matches) : `<p class="empty-note">No ATP or WTA matches scheduled today.</p>`}`;
}
function todayView(body = `<div class="loading">Loading today’s matches…</div>`): string {
  return `<header class="masthead"><div><div class="eyebrow">${dayHeading()}</div><h1>Today</h1></div><button class="quiet-button" aria-label="Text size">Aa</button></header><main>${body}</main>`;
}
function placeholder(title: string, copy: string): string { return `<header class="masthead"><div><div class="eyebrow">COURT</div><h1>${title}</h1></div></header><main><p class="intro">${copy}</p></main>`; }
function shell(routeName: string, content: string): string {
  return `<div class="shell"><div class="wordmark">COURT</div>${content}<nav class="bottom-nav">${nav.map(([key,label]) => `<a href="#/${key === "today" ? "" : key}" class="${routeName === key ? "active" : ""}">${label}</a>`).join("")}</nav></div>`;
}

let request: AbortController | undefined;
export function renderApp(root: HTMLElement): void {
  request?.abort();
  const route = parseRoute(location.hash);
  let content = todayView();
  if (route.name === "tour") content = placeholder("Tour", "The season timeline will live here.");
  if (route.name === "players") content = placeholder("Players", "Followed players and player search will live here.");
  if (route.name === "watch") content = placeholder("Watch", "Your spoiler-safe viewing queue will live here.");
  if (route.name === "match") content = placeholder("Match", "Match context, form, broadcast information and notes will live here.");
  if (route.name === "player") content = placeholder("Player", "Current form, records and next-match context will live here.");
  if (route.name === "tournament") content = placeholder("Tournament", "Matches, players and tournament information will live here.");
  root.innerHTML = shell(route.name, content);

  if (route.name === "today") {
    request = new AbortController();
    getTodayFeed(request.signal).then(feed => {
      if (parseRoute(location.hash).name === "today") root.innerHTML = shell("today", todayView(todayContent(feed)));
    }).catch(error => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (parseRoute(location.hash).name === "today") root.innerHTML = shell("today", todayView(`<div class="data-error"><strong>Today couldn’t load.</strong><span>${escapeHtml(error instanceof Error ? error.message : "Tennis data is unavailable.")}</span><button onclick="location.reload()">Try again</button></div>`));
    });
  }
}
