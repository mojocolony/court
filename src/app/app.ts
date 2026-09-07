import { parseRoute } from "./routes";
import "../styles/tokens.css";
import "../styles/layout.css";

const nav = [
  ["today", "Today"],
  ["tour", "Tour"],
  ["players", "Players"],
  ["watch", "Watch"]
] as const;

function todayView(): string {
  return `
    <header class="masthead">
      <div>
        <div class="eyebrow">SUNDAY · SEPTEMBER 7</div>
        <h1>Today</h1>
      </div>
      <button class="quiet-button" aria-label="Settings">Aa</button>
    </header>

    <main>
      <section class="tournament">
        <div class="tournament-head">
          <div>
            <div class="eyebrow">US OPEN · MEN'S SINGLES</div>
            <h2>New York</h2>
          </div>
          <span class="surface hard">HARD</span>
        </div>
        <div class="round-label">QUARTERFINAL · UPCOMING</div>
        <a class="match" href="#/match/alcaraz-shelton">
          <time>SEP 9</time>
          <div class="players">
            <div><strong>C. Alcaraz</strong><span class="rank">3</span></div>
            <div>B. Shelton</div>
          </div>
          <div class="actions"><span>★</span><span class="watch">WATCH</span></div>
        </a>
      </section>

      <section class="tournament muted-section">
        <div class="tournament-head">
          <div>
            <div class="eyebrow">US OPEN · WOMEN'S SINGLES</div>
            <h2>New York</h2>
          </div>
          <span class="surface hard">HARD</span>
        </div>
        <div class="empty-note">Free live tennis data will populate this view.</div>
      </section>

      <button class="all-matches">All Matches <span>⌄</span></button>
    </main>`;
}

function placeholder(title: string, copy: string): string {
  return `<header class="masthead"><div><div class="eyebrow">COURT</div><h1>${title}</h1></div></header>
  <main><p class="intro">${copy}</p></main>`;
}

export function renderApp(root: HTMLElement): void {
  const route = parseRoute(location.hash);
  let content = todayView();
  if (route.name === "tour") content = placeholder("Tour", "The season timeline will live here.");
  if (route.name === "players") content = placeholder("Players", "Followed players and player search will live here.");
  if (route.name === "watch") content = placeholder("Watch", "Your spoiler-safe viewing queue will live here.");
  if (route.name === "match") content = placeholder("Match", "Match context, form, broadcast information and notes will live here.");
  if (route.name === "player") content = placeholder("Player", "Current form, records and next-match context will live here.");
  if (route.name === "tournament") content = placeholder("Tournament", "Matches, players and tournament information will live here.");

  root.innerHTML = `<div class="shell"><div class="wordmark">COURT</div>${content}
    <nav class="bottom-nav">${nav.map(([key, label]) =>
      `<a href="#/${key === "today" ? "" : key}" class="${route.name === key ? "active" : ""}">${label}</a>`
    ).join("")}</nav></div>`;
}
