# Baseline Today Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the user-facing product to Baseline and implement the approved editorial visual system on the Today screen without changing backend identity or Match-page behavior.

**Architecture:** Keep the current vanilla TypeScript rendering model and provider-neutral data layer. Add a small pure date-strip model, allow `getTodayFeed` to accept a selected local date, update Today markup for the editorial schedule, and replace the current narrow mobile-first CSS with responsive Baseline layout rules.

**Tech Stack:** TypeScript, Vite, vanilla DOM/string rendering, CSS, Live Tennis data through existing Supabase Edge Function.

**Spec:** `docs/superpowers/specs/2026-09-08-baseline-editorial-design.md`

## Global Constraints

- User-facing brand is `Baseline`.
- Keep internal `court-*`, `COURT_*`, Supabase function, GitHub repository, and `/court/` base identifiers unchanged.
- Today remains ATP/WTA only.
- No paid tennis endpoint.
- Existing Match-page interactions remain behaviorally unchanged.
- Source Serif 4 + IBM Plex Sans + IBM Plex Mono define the working typography.

---

### Task 1: Branding and regression smoke test

**Files:**
- Create: `tests/baseline-redesign.test.mjs`
- Modify: `index.html`
- Modify: `package.json`
- Modify: `README.md`

- [ ] Write a failing Node smoke test for Baseline title/wordmark hooks and Today design hooks.
- [ ] Run the test and verify it fails against Court v0.3.1.
- [ ] Rename user-facing metadata and docs to Baseline; add font loading.
- [ ] Add the smoke test to the project test command.
- [ ] Run the smoke test and verify the branding assertions pass.

### Task 2: Date-strip model and selected-day data retrieval

**Files:**
- Create: `src/app/todayDates.ts`
- Create: `tests/app/todayDates.test.ts`
- Modify: `src/data/courtApi.ts`
- Modify: `src/app/app.ts`

- [ ] Write tests for current + upcoming date-strip entries and stable selected-date labels.
- [ ] Add pure date-strip helpers.
- [ ] Extend `getTodayFeed` to accept a selected local `Date` while preserving the current default.
- [ ] Wire Today date buttons to abort/refetch for the selected local day.

### Task 3: Editorial Today markup

**Files:**
- Modify: `src/app/app.ts`
- Modify: `tests/baseline-redesign.test.mjs`

- [ ] Add failing smoke assertions for editorial Today hooks.
- [ ] Rework shell/header/tournament/match-row markup around Baseline wordmark, desktop nav, date rail, and schedule columns.
- [ ] Preserve route behavior and match deep links.
- [ ] Render restrained existing Star/Watch state indicators without adding Today write controls.

### Task 4: Responsive Baseline design system

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/layout.css`

- [ ] Add approved typography, colour, spacing, focus and surface tokens.
- [ ] Implement wide desktop editorial canvas and light top navigation.
- [ ] Implement phone recomposition and bottom navigation.
- [ ] Preserve Match-page readability while moving it onto the new typography/tokens.

### Task 5: Verification and package

**Files:**
- Modify: `README.md`

- [ ] Run local Node smoke tests.
- [ ] Run targeted TypeScript compilation where possible; document dependency limitations accurately.
- [ ] Inspect version/branding strings and ZIP contents.
- [ ] Package as `baseline-v0.4.0.zip` without flattening directories.
