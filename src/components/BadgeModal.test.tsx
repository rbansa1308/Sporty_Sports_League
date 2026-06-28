import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BadgeModal } from "./BadgeModal";
import { getSeasonBadge, getLeagueDetail } from "../api/client";
import type { League } from "../api/types";

vi.mock("../api/client", () => ({
  getSeasonBadge: vi.fn(),
  getLeagueDetail: vi.fn(),
}));

const mockedGetBadge = vi.mocked(getSeasonBadge);
const mockedGetDetail = vi.mocked(getLeagueDetail);

const league: League = {
  idLeague: "4328",
  strLeague: "English Premier League",
  strSport: "Soccer",
  strLeagueAlternate: "EPL",
};

const badge = { strSeason: "2024-2025", strBadge: "https://example.com/badge.png" };

beforeEach(() => {
  mockedGetBadge.mockReset().mockResolvedValue(null);
  mockedGetDetail.mockReset().mockResolvedValue(null);
});

describe("BadgeModal", () => {
  it("shows the badge image once loaded", async () => {
    mockedGetBadge.mockResolvedValue(badge);

    render(<BadgeModal league={league} onClose={() => {}} />);

    const img = await screen.findByRole("img", {
      name: /english premier league season badge/i,
    });
    expect(img).toHaveAttribute("src", badge.strBadge);
  });

  it("shows the league description when available", async () => {
    mockedGetDetail.mockResolvedValue({
      idLeague: "4328",
      strLeague: "English Premier League",
      strLeagueAlternate: "EPL",
      strDescriptionEN: "The top tier of English football.",
    });

    render(<BadgeModal league={league} onClose={() => {}} />);

    expect(
      await screen.findByText(/the top tier of english football/i),
    ).toBeInTheDocument();
  });

  it("shows a fallback when no badge is available", async () => {
    render(<BadgeModal league={league} onClose={() => {}} />);

    expect(
      await screen.findByText(/no badge available for this league/i),
    ).toBeInTheDocument();
  });

  it("still shows the badge when the detail call fails", async () => {
    mockedGetBadge.mockResolvedValue(badge);
    mockedGetDetail.mockRejectedValue(new Error("detail down"));

    render(<BadgeModal league={league} onClose={() => {}} />);

    expect(
      await screen.findByRole("img", { name: /english premier league season badge/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("falls back to text when the badge image fails to load", async () => {
    mockedGetBadge.mockResolvedValue(badge);

    render(<BadgeModal league={league} onClose={() => {}} />);

    const img = await screen.findByRole("img", {
      name: /english premier league season badge/i,
    });
    fireEvent.error(img);

    expect(
      await screen.findByText(/no badge available for this league/i),
    ).toBeInTheDocument();
  });

  it("shows an error with retry only when both calls fail, and re-fetches on retry", async () => {
    mockedGetBadge.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(badge);
    mockedGetDetail.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(null);

    render(<BadgeModal league={league} onClose={() => {}} />);

    const retry = await screen.findByRole("button", { name: /try again/i });
    await userEvent.click(retry);

    expect(
      await screen.findByRole("img", { name: /english premier league season badge/i }),
    ).toBeInTheDocument();
    expect(mockedGetBadge).toHaveBeenCalledTimes(2);
    expect(mockedGetDetail).toHaveBeenCalledTimes(2);
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();

    render(<BadgeModal league={league} onClose={onClose} />);
    await waitFor(() => expect(mockedGetBadge).toHaveBeenCalled());

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
