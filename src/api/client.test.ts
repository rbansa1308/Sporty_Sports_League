import { describe, it, expect, vi, afterEach } from "vitest";
import { getAllLeagues, getLeagueDetail, getSeasonBadge } from "./client";

function mockFetchOnce(payload: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getAllLeagues", () => {
  it("throws when every sport request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    await expect(getAllLeagues()).rejects.toThrow("network");
  });

  it("aggregates leagues across sports and dedupes by id", async () => {
    // Every per-sport call returns the same two leagues, so the aggregated
    // result must collapse to the two unique ids.
    mockFetchOnce({
      countries: [
        { idLeague: "1", strLeague: "A", strSport: "Soccer", strLeagueAlternate: "x" },
        { idLeague: "2", strLeague: "B", strSport: "Basketball", strLeagueAlternate: "y" },
      ],
    });

    const leagues = await getAllLeagues();

    expect(leagues.map((l) => l.idLeague)).toEqual(["1", "2"]);
  });
});

describe("getSeasonBadge", () => {
  it("returns the most recent season that has a badge", async () => {
    mockFetchOnce({
      seasons: [
        { strSeason: "1999", strBadge: "https://example.com/old.png" },
        { strSeason: "2000", strBadge: "https://example.com/new.png" },
        { strSeason: "2001", strBadge: "" },
      ],
    });

    const season = await getSeasonBadge("badge-league");

    expect(season).toEqual({ strSeason: "2000", strBadge: "https://example.com/new.png" });
  });

  it("does not cache an empty result, so a later call re-fetches", async () => {
    const fetchMock = mockFetchOnce({ seasons: [] });

    const first = await getSeasonBadge("empty-league");
    const second = await getSeasonBadge("empty-league");

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("getLeagueDetail", () => {
  it("returns the league's English description", async () => {
    mockFetchOnce({ leagues: [{ strDescriptionEN: "A description." }] });

    const description = await getLeagueDetail("detail-league");

    expect(description).toBe("A description.");
  });
});
