# Court v1 — Design Specification

**Date:** 2026-09-07  
**Status:** Approved design  
**Repository:** `court`  
**Working name:** Court  
**Purpose:** A quiet personal dashboard for following professional tennis.

## 1. Product goal

Court is a mobile-first personal tennis dashboard for ATP and WTA tour information. It should make it easy to see what matters today, follow players and tournaments, understand current match context, plan what to watch, avoid spoilers, and preserve a personal viewing history.

Court is intentionally not a general-purpose sports portal. It will avoid news-feed clutter, advertising, betting information, promotional content, and unnecessary visual noise.

## 2. v1 scope

v1 is the “personal tennis dashboard” version.

Core destinations:

- **Today**
- **Tour**
- **Players**
- **Watch**

Court always opens to **Today**.

Singles are the primary experience. Doubles are available through an optional filter/setting but are not mixed into the main view by default.

## 3. Today

Today groups matches by tournament and ranks relevance before completeness.

Priority order:

1. Starred matches
2. Matches involving followed players
3. Matches in followed tournaments
4. Significant later-round matches
5. Everything else under a collapsible **All Matches** section

Nationality does not affect relevance ranking.

Tournament headers are compact and collapsible. A tournament header may show:

- tournament name
- ATP / WTA
- level
- location
- surface
- round/context

Match rows may show:

- scheduled local time
- players
- seed/ranking where available
- compact live state
- set score when live/completed and not spoiler-protected
- broadcast information
- star state
- watch state

Live scoring remains compact on Today. Detailed live state belongs on the match page.

## 4. Match page

A match page should prioritize context rather than prediction.

Pre-match content may include:

- tournament
- round
- surface
- players
- seed/ranking
- scheduled time
- court/stadium when available
- broadcast information
- recent form
- recent meetings / H2H when available free
- trailing 12-month record when derivable
- surface-specific record when derivable
- simple note field

Actions:

- Star / unstar
- Add to Watch / remove from Watch
- Mark Watched
- Reveal result
- Edit note

Deep serve/return analytics are postponed unless they are obtainable reliably through free sources.

## 5. Spoiler protection

Spoiler safety is an application rule, not merely a visual treatment.

Two levels are supported:

1. **Watchlist protection:** matches placed on Watch automatically hide their result until explicitly revealed or marked Watched.
2. **Global Spoiler Mode:** hides completed results throughout Court.

When a match is protected, Court must avoid indirect spoilers in:

- Today
- match pages
- player recent-results lists
- tournament results
- tournament draws
- recent-form indicators
- any other result-derived styling or copy

## 6. Tour

Tour is a vertical season timeline grouped by month, not a traditional month-grid calendar.

Tournament rows may show:

- tournament name
- date range
- city/location
- ATP / WTA
- tournament level
- surface
- followed state

Filters:

- ATP / WTA / Both
- level
- singles / doubles where meaningful

Tournament pages use:

- **Matches**
- **Draw**
- **Players**
- **Info**

Draws are included in v1 only if the chosen free source proves dependable.

## 7. Players

The default Players screen emphasizes followed players.

A player page should support the contextual “B-level” depth:

- current ranking
- ranking movement when available
- country
- age/date of birth
- handedness
- current tournament
- next match
- recent form
- recent results
- season record when derivable
- trailing 12-month record when derivable
- hard/clay/grass splits when derivable
- recent H2H against next opponent when available free
- simple note field

A later **Stats** expansion may add:

- hold/break percentage
- first/second serve performance
- tiebreak record
- deciding-set record
- break-point performance
- opponent-quality splits
- charts and trends

These are not core v1 requirements.

## 8. Following and starring

Court supports following:

- players
- tournaments

Matches can be starred independently.

**Star** and **Watch** are separate concepts:

- **Star:** important/favourite; surface it more prominently and retain it.
- **Watch:** user intends to watch; automatically enable spoiler protection.

## 9. Watch

Watch is a personal viewing queue, not merely a television guide.

Sections:

- **Up Next**
- **Watch Later**
- **Watched**

A Watched entry records at minimum:

- match identity
- tournament
- date played
- date/time marked watched
- attached note
- star state where relevant

Watch history is retained unless explicitly removed.

## 10. Broadcast information

Broadcast information is automatic where sufficiently reliable and manually overridable.

v1 stores:

- tournament-level broadcast rules
- match-level overrides
- user broadcast-service preferences

The initial audience/location is Canada.

Potential services include:

- TSN
- TSN+
- Tennis TV
- DAZN
- other providers added as needed

Broadcast data is not permitted to become a paid-API dependency in v1.

## 11. Notes

v1 supports one simple freeform notes field on:

- players
- matches
- tournaments

Notes autosave and are included in Dropbox backup/export.

There is no tags/search/cross-link note system in v1.

## 12. Visual language

Court should feel like a well-typeset timetable/reference tool rather than a conventional sports app.

Principles:

- warm off-white or pale-grey light background
- charcoal typography
- deep charcoal rather than pure black in dark mode
- thin rules
- generous spacing
- minimal cards/boxes
- restrained animation
- no unnecessary modals
- no advertising/news/betting chrome

Typography:

- **IBM Plex Sans** for interface and prose
- **IBM Plex Mono** for scores, rankings, times, records, and compact numeric data

Surface colours are semantic and subtle:

- Hard: muted blue-grey
- Clay: muted terracotta
- Grass: subdued green

The colours should appear in small indicators rather than large backgrounds.

## 13. Navigation and responsive behaviour

Primary navigation:

- Today
- Tour
- Players
- Watch

iPhone uses bottom navigation with icon + text.

iPad/desktop retain the same conceptual navigation rather than becoming a large generic sidebar app.

Tournament draws and deeper statistical views may expand to use additional width.

Font-size control is required with 3–4 steps. Layout must reflow cleanly instead of relying on browser zoom.

## 14. App identity

Working/final name: **Court**

The interface wordmark is simply **COURT**.

The app icon should use a restrained geometric abstraction of tennis-court lines rather than a generic tennis ball. It should remain clear at small installed-PWA sizes.

## 15. Data strategy

### Free-only requirement

Court v1 must work without paid tennis API access.

No core feature may silently require a paid endpoint. If a data field is not obtainable reliably for free, the UI must omit or gracefully degrade that field rather than blocking the app.

### Provider-neutral tennis layer

UI code must not call a vendor-specific tennis API directly.

Court exposes its own normalized data interface, e.g.:

- `getTodayMatches(date)`
- `getTournament(id)`
- `getTournamentMatches(id)`
- `getPlayer(id)`
- `getPlayerRecentMatches(id)`
- `getHeadToHead(playerA, playerB)`
- `getRankingsForPlayers(ids)`

The implementation may use one or more free providers behind these interfaces.

### Derived records

Court may calculate summary statistics from raw recent match data, including:

- trailing 12-month W–L
- surface W–L
- last-N form
- winning/losing streaks

Missing summary statistics are acceptable when the underlying match data exists.

## 16. Supabase

Supabase is Court’s operational/personal database, not a mirror of the professional tennis world.

Primary persisted personal data:

- user profile/settings
- followed players
- followed tournaments
- starred matches
- watchlist
- watch history
- notes
- broadcast preferences
- broadcast rules/overrides
- small tennis API cache

Court data must be logically isolated from other apps, even if a Supabase project is shared.

Suggested tables:

- `court_settings`
- `court_followed_players`
- `court_followed_tournaments`
- `court_starred_matches`
- `court_watchlist`
- `court_watch_history`
- `court_notes`
- `court_broadcast_services`
- `court_broadcast_rules`
- `court_broadcast_overrides`
- `court_api_cache`

## 17. Secure tennis-data broker

Provider secrets must never be exposed in browser code or committed to GitHub.

Browser flow:

Court PWA → Supabase Edge Function → free tennis provider(s)

The broker is responsible for:

- provider-specific authentication
- normalization
- caching
- basic rate-limit protection
- graceful provider failure
- making provider swaps possible without rewriting UI code

## 18. Caching

Caching should reduce free-tier API pressure.

Indicative TTLs:

- player profile: 24 hours
- rankings embedded in player data: 6–24 hours
- tournament metadata: 24 hours
- historical/recent matches: 6–24 hours
- today schedule: 5–15 minutes
- upcoming match time/status: 5–15 minutes
- live scores: short polling interval only while Court is open and viewing live data

Court should not continuously poll when no user is actively viewing live information.

## 19. Dropbox

Dropbox is the independent backup/export layer for irreplaceable personal Court data.

Do not back up bulk replaceable tennis-feed data.

Backup/export should include:

- follows
- starred matches
- watchlist
- watch history
- notes
- broadcast preferences
- broadcast overrides
- Court settings

Primary format: JSON.

CSV export can be added later for human-friendly history export.

Suggested structure:

```text
Court/
  Backups/
    court-backup-YYYY-MM-DD.json
  Exports/
    watched-matches.json
    followed-players.json
    notes.json
```

## 20. Platform and deployment

v1 is an installable PWA optimized for:

- iPhone
- iPad
- desktop Chrome/Safari

Source control: GitHub repository `court`.

Deployment target: GitHub Pages.

Secrets remain outside the repository and are stored in Supabase secret configuration.

## 21. Explicitly postponed

The following are not required for v1:

- paid API subscription
- exhaustive historical tennis archive
- betting/odds
- predictive analytics
- news feed/editorial content
- deep statistical charts
- full ATP/WTA ranking-table browser
- guaranteed draw support if free data is unreliable
- sophisticated note tagging/search
- multi-user/social functionality
- background live-score polling when Court is closed
