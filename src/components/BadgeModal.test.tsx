import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BadgeModal } from "./BadgeModal";
import { getSeasonBadge } from "../api/client";
import type { League } from "../api/types";

vi.mock("../api/client", () => ({
  getSeasonBadge: vi.fn(),
}));

const mockedGetBadge = vi.mocked(getSeasonBadge);

const league: League = {
  idLeague: "4328",
  strLeague: "English Premier League",
  strSport: "Soccer",
  strLeagueAlternate: "EPL",
};

describe("BadgeModal", () => {
  beforeEach(() => {
    mockedGetBadge.mockReset();
  });

  it("shows the badge image once loaded", async () => {
    mockedGetBadge.mockResolvedValue({
      strSeason: "2024-2025",
      strBadge: "https://example.com/badge.png",
    });

    render(<BadgeModal league={league} onClose={() => {}} />);

    const img = await screen.findByRole("img", {
      name: /english premier league season badge/i,
    });
    expect(img).toHaveAttribute("src", "https://example.com/badge.png");
  });

  it("shows a fallback when no badge is available", async () => {
    mockedGetBadge.mockResolvedValue(null);

    render(<BadgeModal league={league} onClose={() => {}} />);

    expect(
      await screen.findByText(/no badge available for this league/i),
    ).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", async () => {
    mockedGetBadge.mockResolvedValue(null);
    const onClose = vi.fn();

    render(<BadgeModal league={league} onClose={onClose} />);
    await waitFor(() => expect(mockedGetBadge).toHaveBeenCalled());

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
