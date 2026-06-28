# Sporty — Sports Leagues

A single-page React + TypeScript app that browses sports leagues from
[TheSportsDB](https://www.thesportsdb.com/free_sports_api). Search by name, filter
by sport, and click any league to light up its season badge in a spotlight modal.
All network responses are cached to avoid repeat calls.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
npm test           # run the test suite once
npm run test:watch # watch mode
npm run typecheck  # tsc --noEmit
```

## Configuration

The API key is read from `VITE_SPORTSDB_KEY` (see `.env.example`); it defaults to
the public test key `3`. To use your own key:

```bash
cp .env.example .env
# edit .env and set VITE_SPORTSDB_KEY=<your-key>
```

## Architecture

```
src/
  api/        client.ts   cache.ts   types.ts
  hooks/      useLeagues.ts   useSeasonBadge.ts   useLeagueFilters.ts
  components/ App  SearchBar  SportFilter  LeagueList  LeagueCard  BadgeModal  StatusMessage
  test/       setup.ts
```

- **`api/cache.ts`** — a tiny generic in-memory cache. `getOrFetch(key, fetcher)`
  returns the cached value if present, otherwise stores the in-flight Promise so
  concurrent/rapid requests for the same key **dedupe into a single network call**.
  Rejected fetches are evicted so a retry can succeed. This is the "cache responses
  to avoid repeat calls" requirement, hand-rolled with no dependencies.
- **`api/client.ts`** — typed `getAllLeagues()` and `getSeasonBadge(leagueId)`,
  each routed through its own cache instance.
- **`hooks/`** — `useLeagues` loads the list once; `useSeasonBadge` lazily loads a
  league's badge only when the modal opens; `useLeagueFilters` derives the filtered
  list and the sport dropdown options (pure functions, memoized).
- **`components/`** — small, single-purpose components. `App` owns the filter and
  selection state; everything below is presentational.

### Design

A "floodlit stadium at night" aesthetic: near-black surfaces with a stadium-glow
background, an electric volt-lime accent, condensed display type (Anton) for a
broadcast/scoreboard feel, and a mono face for stat-line metadata. Responsive grid,
animated card entrances, a spotlight badge modal, skeleton loading states, and
accessible focus handling (modal closes on Esc/overlay, focus is restored on close).

## API notes & known limitation

This app targets three TheSportsDB endpoints:

- `all_leagues.php` → list of leagues (`idLeague`, `strLeague`, `strSport`)
- `search_all_seasons.php?badge=1&id=<id>` → seasons with badge image URLs (the
  modal shows the **most recent** season that has a badge)
- `lookupleague.php?id=<id>` → per-league detail; used by the modal for
  `strDescriptionEN` (and it also carries `strLeagueAlternate`)

The modal loads the badge and the detail **in parallel** and degrades
independently: a failure of one still shows the other, and the error/retry state
appears only when both fail.

**Free-key limitation:** with the public test key, `all_leagues.php` currently
returns only a 10-league demo subset — all of them Soccer, and **without the
`strLeagueAlternate` field** (that field is only returned by the per-league
`lookupleague.php` endpoint). As a result, on the free key:

- the **sport dropdown** contains only "Soccer", and
- **alternate league names** are not shown (the UI renders them when present and
  hides them when absent).

The code is written for the full dataset: supplying a premium `VITE_SPORTSDB_KEY`
makes the complete multi-sport catalog, alternate names, and richer sport filtering
flow through unchanged — no code changes required.

## Testing

Focused tests with Vitest + React Testing Library:

- `cache.test.ts` — caching, cache hits, concurrent-call dedup, retry after failure
- `useLeagueFilters.test.ts` — name/sport filtering and dropdown option derivation
- `SearchBar` / `SportFilter` — controlled inputs fire change callbacks
- `BadgeModal` — renders the badge on success, falls back gracefully when none
  exists, and closes on Escape (API mocked)

## AI tools & design decisions

Built with **Claude Code** (Opus 4.8). The workflow used four assistive passes:

- **Brainstorming** — pinned down scope and requirements before any code.
- **Frontend-design** — drove the "floodlit stadium" visual direction.
- **Grill-me** — stress-tested the design, surfacing decisions made by omission.
- **Code review (high-effort)** — self-review that found and fixed 10 issues.

Key decisions:

- **Hand-rolled cache, no deps** — a generic `Map`-based cache dedupes in-flight
  requests and evicts failures/empty results, so repeat calls hit memory, not the
  network. Chosen over a data-fetching library to keep the caching logic explicit.
- **Pure, testable core** — filtering and option-derivation are pure functions;
  hooks own async/state. Logic is unit-tested without rendering.
- **Combined modal fetch** — badge + league detail load in parallel
  (`Promise.allSettled`) and degrade independently; the error state appears only
  when both fail, so a flaky detail call never hides a good badge.
- **Most-recent badge** — the modal shows the latest season's badge (more
  recognizable) rather than the oldest the API lists first.
- **Accessibility** — focus trap + restore, Escape/overlay close, body-scroll
  lock, and `role="alert"` for errors.
- **CSS Modules** — component-scoped styling with zero runtime cost.
- **Honest about the free API** — no mock data; the free-key limitations above are
  documented, and the code is premium-key-ready with no changes.
