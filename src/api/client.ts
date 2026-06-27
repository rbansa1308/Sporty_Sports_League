import { createCache } from "./cache";
import type {
  AllLeaguesResponse,
  AllSeasonsResponse,
  League,
  Season,
} from "./types";

const API_KEY = import.meta.env.VITE_SPORTSDB_KEY ?? "3";
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// One cache per resource type. Leagues share a single key; badges key by league.
const leaguesCache = createCache<League[]>();
const badgeCache = createCache<Season | null>();

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
    return data.leagues ?? [];
  });
}

/**
 * The first season that has a badge image for the given league, or null if the
 * league has no badges. Cached per league id.
 */
export function getSeasonBadge(leagueId: string): Promise<Season | null> {
  return badgeCache.getOrFetch(leagueId, async () => {
    const data = await fetchJson<AllSeasonsResponse>(
      `${BASE_URL}/search_all_seasons.php?badge=1&id=${encodeURIComponent(leagueId)}`,
    );
    const seasons = data.seasons ?? [];
    return seasons.find((season) => Boolean(season.strBadge)) ?? null;
  });
}
