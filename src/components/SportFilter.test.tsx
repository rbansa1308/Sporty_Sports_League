import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SportFilter } from "./SportFilter";

describe("SportFilter", () => {
  it("renders an 'All sports' option plus the provided options", () => {
    render(
      <SportFilter value="" options={["Basketball", "Soccer"]} onChange={() => {}} />,
    );

    expect(screen.getByRole("option", { name: "All sports" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Soccer" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Basketball" })).toBeInTheDocument();
  });

  it("calls onChange with the selected sport", async () => {
    const onChange = vi.fn();
    render(
      <SportFilter value="" options={["Basketball", "Soccer"]} onChange={onChange} />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Sport"), "Soccer");

    expect(onChange).toHaveBeenCalledWith("Soccer");
  });
});
