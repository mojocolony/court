# Baseline

A quiet personal dashboard for following professional tennis.

## Status

v0.7.2 fixes Players search focus and rate-limit behaviour. Typing no longer rerenders the whole Players page, searches wait for three characters with a longer debounce, successful searches are cached locally for six hours, and 429 responses now explain that the free tennis-data quota has been reached instead of showing a generic error.

Players supports live ATP/WTA search, followed players, player profiles, and upcoming-match context where the free provider has it. Tour now loads a multi-day ATP/WTA slate into the season timeline, and tournament detail pages show live and upcoming matches when available. Watch contains working Up Next, Watch Later, and Watched sections, refreshes stale match snapshots near start time, and includes an optional global Spoiler Mode.

Star, Watch, Note, followed-player, followed-tournament, and spoiler-mode data are stored locally immediately. When Baseline can reuse an authenticated Supabase session for the shared Ticking project on the same browser origin, those personal records also sync to Court-prefixed RLS-protected Supabase tables. This preserves the existing internal Court naming while the visible product remains Baseline.

## Internal naming

The existing GitHub repository path, `/court/` deployment base, Supabase Edge Function (`court-tennis`), `COURT_*` environment names, and internal Court TypeScript types remain unchanged for now. This avoids unnecessary deployment and backend migration risk while the visible product is Baseline.

## Configuration

Baseline's GitHub Actions deployment currently expects the repository secret `COURT_SUPABASE_ANON_KEY`. This is the public/anon key for the shared Ticking Supabase project; the Live Tennis provider key remains server-side in the Edge Function and must never be added to the frontend.

## Development

```bash
npm install
npm test
npm run dev
```

Production build:

```bash
npm run build
```
