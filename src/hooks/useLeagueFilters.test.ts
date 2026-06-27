import { describe, it, expect } from "vitest";
import { filterLeagues, getSportOptions } from "./useLeagueFilters";
import type { League } from "../api/types";

const leagues: League[] = [
  { idLeague: "1", strLeague: "English Premier League", strSport: "Soccer", strLeagueAlternate: "EPL" },
  { idLeague: "2", strLeague: "NBA", strSport: "Basketball", strLeagueAlternate: "National Basketball Association" },
  { idLeague: "3", strLeague: "La Liga", strSport: "Soccer", strLeagueAlternate: "" },
  { idLeague: "4", strLeague: "Formula 1", strSport: "Motorsport", strLeagueAlternate: "F1" },
];

describe("getSportOptions", () => {
  it("returns unique sports sorted alphabetically", () => {
    expect(getSportOptions(leagues)).toEqual(["Basketball", "Motorsport", "Soccer"]);
  });

  it("returns an empty list for no leagues", () => {
    expect(getSportOptions([])).toEqual([]);
  });
});

describe("filterLeagues", () => {
  it("returns all leagues when no filters are applied", () => {
    expect(filterLeagues(leagues, { search: "", sport: "" })).toHaveLength(4);
  });

  it("filters by case-insensitive name substring", () => {
    const result = filterLeagues(leagues, { search: "liga", sport: "" });
    expect(result.map((l) => l.strLeague)).toEqual(["La Liga"]);
  });

  it("filters by sport", () => {
    const result = filterLeagues(leagues, { search: "", sport: "Soccer" });
    expect(result.map((l) => l.strLeague)).toEqual([
      "English Premier League",
      "La Liga",
    ]);
  });

  it("combines search and sport filters", () => {
    const result = filterLeagues(leagues, { search: "premier", sport: "Soccer" });
    expect(result.map((l) => l.strLeague)).toEqual(["English Premier League"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterLeagues(leagues, { search: "cricket", sport: "" })).toEqual([]);
  });
});
