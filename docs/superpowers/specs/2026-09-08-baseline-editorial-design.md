# Baseline Editorial Design Specification

## Product identity

Court is renamed **Baseline** in all user-facing branding. Existing internal `court-*` identifiers, the Supabase Edge Function name, environment-secret names, repository path, and `/court/` deployment base remain unchanged in this phase to avoid backend and deployment risk.

Baseline should feel like a beautifully typeset tennis programme, season almanac, and reference book translated into an interactive application. It should not resemble a conventional score app.

## Visual system

- Editorial display face: Source Serif 4 for major page titles, tournament names, and player/match names.
- Interface face: IBM Plex Sans for navigation, labels, controls, and supporting information.
- Data face: IBM Plex Mono for times, scores, rankings, status, and compact numeric information.
- Warm paper background, charcoal ink, muted secondary copy, hairline rules.
- Surface accents only: muted blue-grey hard, terracotta clay, subdued green grass.
- Avoid card containers, heavy borders, pills, shadows, gradients, and decorative colour.

## Responsive composition

Desktop and iPad landscape use a wide editorial canvas so schedule information can spread horizontally. iPhone and narrow portrait widths recompose the same hierarchy vertically instead of shrinking desktop columns.

Desktop navigation is a light horizontal text navigation associated with the Baseline wordmark. Phone navigation remains fixed at the bottom.

## Today

Today is the primary expression of Baseline and behaves like an order-of-play sheet.

Header:
- Baseline wordmark and permanent navigation.
- Serif `Today` title with the full local date nearby/subordinate.
- Compact date strip for the current day and upcoming days; selecting a date loads that local calendar day.
- Compact Both / ATP / WTA and Singles / Doubles filters.

Tournament sections:
- One restrained tournament header containing tour, tournament name, draw type, and surface.
- No enclosing tournament card.
- Matches form a typeset schedule with time, round/status, competitors, score/status, and restrained personal-state indicators.
- Ranking numbers appear directly after player names when supplied.
- Live scores use monospaced numerals.
- Only ATP/WTA appears on Today.

Mobile match rows collapse into a vertical reading order while preserving the same hierarchy.

## Other primary screens

The same design system will later apply to:
- Tour = season almanac and timeline.
- Players = reference-book profiles.
- Watch = personal watching notebook with prominent broadcast information and spoiler protection.

Those screens are not redesigned in this first implementation; existing functional placeholders remain.

## Accessibility and behavior

- Preserve semantic links/buttons and visible focus treatment.
- Controls must not depend on colour alone.
- Existing Match-page behavior, Star/Watch/Note behavior, free-provider architecture, and backend contracts are unchanged by the visual redesign.
- No paid data dependency is introduced.
