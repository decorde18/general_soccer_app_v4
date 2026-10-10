import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SidebarSeasonSelector from "../SidebarSeasonSelector";

describe("SidebarSeasonSelector", () => {
  const seasons = [
    { id: 1, season_name: "2024-2025" },
    { id: 2, season_name: "2025-2026" },
  ];

  it("renders null when seasons list is empty", () => {
    const { container } = render(
      <SidebarSeasonSelector seasons={[]} selectedSeasonId="" onChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders static badge when exactly one season exists", () => {
    render(
      <SidebarSeasonSelector
        seasons={[{ id: 1, season_name: "2024-2025" }]}
        selectedSeasonId="1"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Current Season")).toBeInTheDocument();
    expect(screen.getByText("2024-2025")).toBeInTheDocument();
  });

  it("renders select dropdown with All Seasons and season choices", () => {
    const handleChange = vi.fn();
    render(
      <SidebarSeasonSelector
        seasons={seasons}
        selectedSeasonId="1"
        onChange={handleChange}
      />
    );

    expect(screen.getByText("All Seasons")).toBeInTheDocument();
    expect(screen.getByText("2024-2025")).toBeInTheDocument();
    expect(screen.getByText("2025-2026")).toBeInTheDocument();

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "2" } });
    expect(handleChange).toHaveBeenCalled();
  });
});
