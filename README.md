# Court

A quiet personal dashboard for following professional tennis.

## Status

v0.2.3 connects Today to Court's Supabase `court-tennis` broker. The UI consumes only Court's normalized provider-neutral response, defaults to singles, keeps ATP/WTA prominent, places Challenger below the main tour, and collapses ITF/other events under More Matches. Missing live-score data is treated as optional.

## Configuration

Court's GitHub Actions deployment expects the repository secret `COURT_SUPABASE_ANON_KEY`. This is the public/anon key for the shared Ticking Supabase project; the Live Tennis provider key remains server-side in the Edge Function and must never be added to the frontend.

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
