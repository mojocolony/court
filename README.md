# Baseline

A quiet personal dashboard for following professional tennis.

## Status

v0.6.1 is the first functional build on top of the Baseline editorial design. Today keeps the ATP/WTA and Singles/Doubles order-of-play view, now with personal relevance ordering and spoiler-safe score hiding for matches placed in Watch.

Players now supports live ATP/WTA player search, followed players, player profiles, and upcoming-match context where the free provider has it. Tour entries open tournament detail pages and tournaments can be followed. Watch now contains working Up Next, Watch Later, and Watched sections with match snapshots and notes.

Star, Watch, Note, followed-player, and followed-tournament data are stored locally immediately. When Baseline can reuse an authenticated Supabase session for the shared Ticking project on the same browser origin, those personal records also sync to Court-prefixed RLS-protected Supabase tables. This preserves the existing internal Court naming while the visible product remains Baseline.

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
