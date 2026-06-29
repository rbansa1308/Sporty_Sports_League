import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { __resetCaches } from "../api/client";

function countingFetch() {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.includes("search_all_leagues.php")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          countries: [
            {
              idLeague: "4328",
              strLeague: "English Premier League",
              strSport: "Soccer",
              strLeagueAlternate: "EPL",
            },
          ],
        }),
      };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// Reset the module-singleton league cache before each test so every render
// performs a real load instead of reading a previous test's cached result.
beforeEach(() => __resetCaches());
afterEach(() => vi.unstubAllGlobals());

describe("App", () => {
  it("renders league cards once data loads", async () => {
    countingFetch();

    render(<App />);

    expect(await screen.findByText("English Premier League")).toBeInTheDocument();
  });

  it("does not re-fetch leagues when filtering (responses are cached)", async () => {
    const fetchMock = countingFetch();

    render(<App />);
    await screen.findByText("English Premier League");
    const callsAfterLoad = fetchMock.mock.calls.length;

    // Guard against a false green: the initial render must have actually hit the
    // network (caches are reset before each test), so this isn't passing merely
    // because a previous test warmed the cache.
    expect(callsAfterLoad).toBeGreaterThan(0);

    // Typing in the search box re-renders and re-filters in memory; it must not
    // trigger any new network requests.
    await userEvent.type(screen.getByLabelText("Search"), "premier");

    expect(fetchMock.mock.calls.length).toBe(callsAfterLoad);
  });
});
