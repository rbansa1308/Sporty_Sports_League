# Sports Leagues SPA — Design Spec

**Date:** 2026-06-27
**Status:** Approved

## Goal

A single-page React + TypeScript application that consumes TheSportsDB API to
display sports leagues with search and sport-type filtering. Clicking a league
shows a season badge image in a modal. API responses are cached to avoid repeat
calls.

## Requirements

- Fetch and display all leagues from the **All Leagues API**.
- Display fields per league: `strLeague`, `strSport`, `strLeagueAlternate`.
- **Search bar** to filter leagues by name (case-insensitive substring).
- **Dropdown** to filter by sport type (options derived from the data, not hardcoded).
- Component-based architecture; responsive, functional UI (design-led polish).
- Clicking a league calls the **Season Badge API** with the league id and shows a
  badge image in a modal.
- Cache responses to avoid repeat API calls (both leagues and per-league badges).

## API (TheSportsDB)

- Base: `https://www.thesportsdb.com/api/v1/json/<key>/`
- Key: `VITE_SPORTSDB_KEY`, default public test key `3`.
- All leagues: `all_leagues.php` → `{ leagues: League[] }`
- Season badge: `search_all_seasons.php?badge=1&id=<id>` → `{ seasons: Season[] }`
- Docs: https://www.thesportsdb.com/free_sports_api
- Exact response field names (e.g. badge image key) verified against the live API
  during implementation.

## Stack & Tooling

- Vite + React 18 + TypeScript (strict mode).
- CSS Modules for styling. Visual quality is a first-class goal, driven by the
  `frontend-design` skill at implementation time (color system, type scale,
  spacing, hover/focus states, accessible contrast, responsive grid + modal).
- Vitest + React Testing Library for focused tests.
- No runtime dependencies beyond React — fetching/caching is hand-rolled.

## Architecture

### API layer (`src/api/`)
- `types.ts` — `League`, `Season` interfaces matching API fields.
- `cache.ts` — generic in-memory `Map`-based cache. `getOrFetch(key, fetcher)`
  returns cached value if present; otherwise stores the in-flight Promise so
  concurrent/rapid calls dedupe to a single network request.
- `client.ts` — typed functions `getAllLeagues()` and `getSeasonBadge(leagueId)`,
  both routed through the cache.

### Hooks (`src/hooks/`)
- `useLeagues()` — loads all leagues once; exposes `{ data, loading, error }`.
- `useSeasonBadge(leagueId)` — lazily fetches a league's badge on demand (only
  when the modal opens); cached per league.
- `useLeagueFilters(leagues)` — pure/memoized derivation of the filtered list and
  the sport dropdown options from search text + selected sport.

### Components (`src/components/`)
- `App` — composes everything; owns filter state (search, selected sport,
  selected league).
- `SearchBar` — controlled text input.
- `SportFilter` — dropdown; options derived from data.
- `LeagueList` / `LeagueCard` — responsive grid; card shows `strLeague`,
  `strSport`, `strLeagueAlternate`; clickable.
- `BadgeModal` — dialog; on open triggers `useSeasonBadge`; shows badge image +
  league name/description; loading/error/empty states; closes on overlay/Esc.
- `StatusMessage` — shared loading/error/empty UI.

## Behavior & Edge Cases

- Loading: spinner/skeleton on initial league load and inside the modal.
- Errors: friendly message + retry; never a blank screen (fail loudly to the user).
- Empty filter results: "No leagues match" message.
- No badge available: modal shows a graceful "No badge for this league" fallback.

## Testing (focused)

- `cache.test.ts` — caches values, returns cached value, dedupes concurrent calls.
- `useLeagueFilters.test.ts` — search + sport filtering, dropdown option derivation.
- `SearchBar` / `SportFilter` — change events fire callbacks.
- `BadgeModal` — renders badge on success, fallback on empty (API mocked).

## Project Structure

```
src/
  api/        client.ts  cache.ts  types.ts
  hooks/      useLeagues.ts  useSeasonBadge.ts  useLeagueFilters.ts
  components/ App  SearchBar  SportFilter  LeagueList  LeagueCard  BadgeModal  StatusMessage
  test/       setup.ts
```
