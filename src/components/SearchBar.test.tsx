import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("renders the current value", () => {
    render(<SearchBar value="liga" onChange={() => {}} />);
    expect(screen.getByLabelText("Search")).toHaveValue("liga");
  });

  it("calls onChange as the user types", async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("Search"), "nba");

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenLastCalledWith("a");
  });
});
