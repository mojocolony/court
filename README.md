# Baseline

A quiet personal dashboard for following professional tennis.

## Status

v0.5.1 refines the first Baseline design build with larger desktop base typography and a better-balanced two-column competitor layout. It renames the user-facing product from Court, introduces the approved editorial typography and responsive layout, and redesigns Today as an order-of-play view with a compact date rail, ATP/WTA and Singles/Doubles filters, tournament sections, and wide schedule rows on larger screens.

The Match page and its Star, Watch, and Note behavior remain intact. Personal match state is still device-local in this build.

## Internal naming

The existing GitHub repository path, `/court/` deployment base, Supabase Edge Function (`court-tennis`), `COURT_*` environment names, and internal Court TypeScript types remain unchanged for now. This avoids unnecessary deployment and backend migration risk while the visible product becomes Baseline.

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
