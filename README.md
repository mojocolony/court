# Court

A quiet personal dashboard for following professional tennis.

## Status

v0.2.8 refines the first Match page: tournament and round context are clearer, competitors are more prominent, Star/Watch are quiet Court-style actions, and Note stays collapsed until requested. Today retains ATP/WTA and Singles/Doubles filtering.

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


## v0.2.4
Today now uses ATP/WTA singles fixtures for the local calendar date, merged with live main-tour singles. Challenger, ITF and juniors remain excluded from Today.


## v0.2.8
Refined Match page hierarchy and interaction. Notes remain device-local and autosave after opening the Note action.
