import { createCache } from "./cache";
import type {
  AllSeasonsResponse,
  League,
  LeagueDetail,
  LookupLeagueResponse,
  Season,
  SearchLeaguesResponse,
} from "./types";

// The free tier caps `all_leagues.php` at ~10 results, so we instead aggregate
// the per-sport `search_all_leagues.php` endpoint across this curated list. That
// yields far more leagues (and multiple sports) on the free key, and returns the
// full per-sport catalog when a premium key is supplied.
const SPORTS = [
  "Soccer",
  "Basketball",
  "American Football",
  "Ice Hockey",
  "Baseball",
  "Motorsport",
  "Rugby",
  "Golf",
  "Tennis",
  "Cricket",
  "Cycling",
  "Boxing",
  "Volleyball",
  "Handball",
  "Australian Football",
];

// `||` (not `??`) so a defined-but-empty env value still falls back to the key.
// "123" is TheSportsDB's documented free key (capped at 10 leagues); a premium
// key returns the full catalog.
const API_KEY = import.meta.env.VITE_SPORTSDB_KEY || "123";
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// One cache per resource type. Leagues share a single key; per-league resources
// key by league id.
const leaguesCache = createCache<League[]>();
const badgeCache = createCache<Season | null>();
const detailCache = createCache<LeagueDetail | null>();

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return (await response.json()) as T;
}

/**
 * All leagues, aggregated across the curated sport list and cached for the
 * session. Sports are fetched in parallel and degrade independently — a failed
 * or empty sport simply contributes nothing.
 */
export function getAllLeagues(): Promise<League[]> {
  return leaguesCache.getOrFetch("all", async () => {
    const perSport = await Promise.allSettled(SPORTS.map(fetchLeaguesForSport));
    const leagues = perSport.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );

    // Fail loudly if every sport request errored — surface an error + retry
    // rather than a misleading empty grid. (All-empty-but-no-errors is a genuine
    // empty result and is allowed through.)
    if (leagues.length === 0) {
      const rejected = perSport.find((result) => result.status === "rejected");
      if (rejected?.status === "rejected") {
        throw rejected.reason instanceof Error
          ? rejected.reason
          : new Error("Failed to load leagues");
      }
    }

    return dedupeById(leagues);
  });
}

function fetchLeaguesForSport(sport: string): Promise<League[]> {
  return fetchJson<SearchLeaguesResponse>(
    `${BASE_URL}/search_all_leagues.php?s=${encodeURIComponent(sport)}`,
  ).then((data) => data.countries ?? []);
}

// The same league can surface under multiple sport queries; drop duplicates so
// React keys (and the rendered list) stay unique.
function dedupeById(leagues: League[]): League[] {
  const seen = new Set<string>();
  return leagues.filter((league) => {
    if (seen.has(league.idLeague)) return false;
    seen.add(league.idLeague);
    return true;
  });
}

/**
 * The most recent season that has a badge image for the given league, or null
 * if the league has no badges. Seasons arrive oldest-first, so we scan from the
 * end. Cached per league id.
 */
export function getSeasonBadge(leagueId: string): Promise<Season | null> {
  return badgeCache.getOrFetch(leagueId, async () => {
    const data = await fetchJson<AllSeasonsResponse>(
      `${BASE_URL}/search_all_seasons.php?badge=1&id=${encodeURIComponent(leagueId)}`,
    );
    const found = findMostRecentBadge(data.seasons ?? []);

    // Don't cache an empty result: an intermittent empty response shouldn't pin
    // the league to "no badge" for the rest of the session.
    if (!found) badgeCache.evict(leagueId);
    return found;
  });
}

function findMostRecentBadge(seasons: Season[]): Season | null {
  for (let index = seasons.length - 1; index >= 0; index--) {
    if (seasons[index].strBadge) return seasons[index];
  }
  return null;
}

/** Extra detail (description, alternate names) for a league. Cached per id. */
export function getLeagueDetail(leagueId: string): Promise<LeagueDetail | null> {
  return detailCache.getOrFetch(leagueId, async () => {
    const data = await fetchJson<LookupLeagueResponse>(
      `${BASE_URL}/lookupleague.php?id=${encodeURIComponent(leagueId)}`,
    );
    const detail = data.leagues?.[0] ?? null;

    if (!detail) detailCache.evict(leagueId);
    return detail;
  });
}
