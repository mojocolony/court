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
