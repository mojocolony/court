# Court

A quiet personal dashboard for following professional tennis.

## Status

v0.1.0 establishes the tested application shell, Court domain model, relevance ranking,
derived recent-record calculations, and spoiler-safe result projection.

The visible Today screen is intentionally a shell using sample content. Real tennis data
is connected in the next implementation checkpoint through a provider-neutral broker.

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


## GitHub Pages deployment

The repository includes `.github/workflows/deploy.yml`.

In GitHub, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.
Each push to `main` will install dependencies on GitHub, run the test suite, build Court,
and deploy `dist/` only if the tests and build pass.
