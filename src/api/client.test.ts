import { describe, it, expect, vi, afterEach } from "vitest";
import { __resetCaches, getAllLeagues, getLeagueDetail, getSeasonBadge } from "./client";

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
  // Reset module-singleton caches so tests don't leak state into each other.
  __resetCaches();
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

  it("does not cache an empty (but error-free) result, so a retry re-fetches", async () => {
    // First load: every sport responds OK but with no leagues.
    const emptyFetch = mockFetchOnce({ countries: null });
    const first = await getAllLeagues();
    expect(first).toEqual([]);

    // A later call must hit the network again rather than returning the cached
    // empty array — this is what makes the UI's retry button actually work.
    const populatedFetch = mockFetchOnce({
      countries: [
        { idLeague: "1", strLeague: "A", strSport: "Soccer", strLeagueAlternate: "x" },
      ],
    });
    const second = await getAllLeagues();

    expect(emptyFetch).toHaveBeenCalled();
    expect(populatedFetch).toHaveBeenCalled();
    expect(second.map((l) => l.idLeague)).toEqual(["1"]);
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
