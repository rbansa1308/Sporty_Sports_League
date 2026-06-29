import { useMemo } from "react";
import type { League } from "../api/types";

export interface LeagueFilters {
  search: string;
  sport: string;
}

/** Unique sport names present in the data, sorted alphabetically. */
export function getSportOptions(leagues: League[]): string[] {
  const sports = new Set(leagues.map((league) => league.strSport).filter(Boolean));
  return [...sports].sort((a, b) => a.localeCompare(b));
}

/** Leagues matching a case-insensitive name search and an exact sport match. */
export function filterLeagues(leagues: League[], filters: LeagueFilters): League[] {
  const search = filters.search.trim().toLowerCase();

  return leagues.filter((league) => {
    const matchesSport = !filters.sport || league.strSport === filters.sport;
    const matchesSearch =
      !search || league.strLeague.toLowerCase().includes(search);
    return matchesSport && matchesSearch;
  });
}

/** Memoized filtered list plus the sport dropdown options. */
export function useLeagueFilters(leagues: League[], filters: LeagueFilters) {
  const { search, sport } = filters;
  const sportOptions = useMemo(() => getSportOptions(leagues), [leagues]);
  // Key on the primitive filter values, not the object's identity, so callers
  // can pass an inline { search, sport } without defeating memoization.
  const filtered = useMemo(
    () => filterLeagues(leagues, { search, sport }),
    [leagues, search, sport],
  );

  return { filtered, sportOptions };
}
