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
the documented free key `123`. To use your own key:

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

- `search_all_leagues.php?s=<sport>` → leagues for a sport, with `strLeague`,
  `strSport`, and `strLeagueAlternate` inline. The list is built by **aggregating
  this endpoint across a curated set of sports** (see `SPORTS` in `client.ts`) and
  deduping by `idLeague`.
- `search_all_seasons.php?badge=1&id=<id>` → seasons with badge image URLs (the
  modal shows the **most recent** season that has a badge)
- `lookupleague.php?id=<id>` → per-league detail; used by the modal for
  `strDescriptionEN`

**Why aggregate?** The simpler `all_leagues.php` is capped at ~10 results on the
free tier. Aggregating `search_all_leagues.php` per sport yields far more leagues
(~60–70 across ~14 sports on the free key) **and** populates the sport dropdown
and alternate league names — without a paid key.

The modal loads the badge and the detail **in parallel** and degrades
independently: a failure of one still shows the other, and the error/retry state
appears only when both fail.

**Free-tier limitation (by design, per the docs):** TheSportsDB rate-limits the
free tier to **30 requests/minute** and returns only a sampled subset per query
(`all_leagues.php` is capped at a documented **"Free Limit: 10"**; the per-sport
endpoint returns a similar small sample). The aggregation above works *around*
this by combining many sports, yielding ~60–70 leagues across ~14 sports on the
free key — not the literal full catalog, but a properly populated, multi-sport
list. Supplying a **premium** `VITE_SPORTSDB_KEY` makes each per-sport query
return its complete list, so the same code yields the full catalog with no
changes. Because the initial load fans out one request per sport, a hard refresh
within the same minute can brush against the 30/min limit. Docs:
https://www.thesportsdb.com/documentation

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
  network.

  *Why not TanStack Query?* It's an excellent library, but for this scope a ~25-line
  cache covers the "avoid repeat calls" requirement while keeping the dedup/eviction
  mechanics explicit and dependency-free — and it demonstrates the caching reasoning
  directly rather than delegating it. TanStack Query would earn its place once the
  app needs background refetch / stale-while-revalidate, pagination, mutations with
  cache invalidation, or built-in retries — none of which this app requires.
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
