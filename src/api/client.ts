import { createCache } from "./cache";
import type {
  AllLeaguesResponse,
  AllSeasonsResponse,
  League,
  LeagueDetail,
  LookupLeagueResponse,
  Season,
} from "./types";

// `||` (not `??`) so a defined-but-empty env value still falls back to the key.
const API_KEY = import.meta.env.VITE_SPORTSDB_KEY || "3";
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

/** All leagues, cached for the lifetime of the session. */
export function getAllLeagues(): Promise<League[]> {
  return leaguesCache.getOrFetch("all", async () => {
    const data = await fetchJson<AllLeaguesResponse>(`${BASE_URL}/all_leagues.php`);
    return dedupeById(data.leagues ?? []);
  });
}

// TheSportsDB can return repeated league entries; drop duplicates so React keys
// (and the rendered list) stay unique.
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
