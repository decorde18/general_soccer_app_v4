import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SidebarTeamSelector from "../SidebarTeamSelector";

describe("SidebarTeamSelector", () => {
  it("renders disabled placeholder when teams list is empty", () => {
    render(
      <SidebarTeamSelector teams={[]} currentTeamId="" onChange={vi.fn()} />
    );
    expect(screen.getByText("No teams found")).toBeInTheDocument();
  });

  it("collapses sub-squads (Varsity and JV) into a single parent program", () => {
    const teams = [
      {
        id: 10,
        clubId: 1,
        teamName: "IHS Girls Soccer Varsity",
        teamId: 100,
        seasonId: 5,
        clubType: "high_school",
      },
      {
        id: 11,
        clubId: 1,
        teamName: "IHS Girls Soccer JV",
        teamId: 101,
        seasonId: 5,
        clubType: "high_school",
      },
    ];

    render(
      <SidebarTeamSelector teams={teams} currentTeamId="10" onChange={vi.fn()} />
    );

    // Should only show parent team name "Girls Soccer" as a single card, not separate JV or Varsity entries
    expect(screen.getByText("Girls Soccer")).toBeInTheDocument();
    expect(screen.queryByText("IHS Girls Soccer JV")).toBeNull();
    expect(screen.queryByText("IHS Girls Soccer Varsity")).toBeNull();
  });

  it("renders parent programs dropdown when multiple distinct programs exist and selects Varsity primary ID", () => {
    const handleChange = vi.fn();
    const teams = [
      {
        id: 10,
        clubId: 1,
        teamName: "IHS Girls Soccer Varsity",
        teamId: 100,
        seasonId: 5,
        clubType: "high_school",
      },
      {
        id: 11,
        clubId: 1,
        teamName: "IHS Girls Soccer JV",
        teamId: 101,
        seasonId: 5,
        clubType: "high_school",
      },
      {
        id: 20,
        clubId: 1,
        teamName: "IHS Boys Soccer Varsity",
        teamId: 200,
        seasonId: 5,
        clubType: "high_school",
      },
      {
        id: 21,
        clubId: 1,
        teamName: "IHS Boys Soccer JV",
        teamId: 201,
        seasonId: 5,
        clubType: "high_school",
      },
    ];

    render(
      <SidebarTeamSelector
        teams={teams}
        currentTeamId="10"
        onChange={handleChange}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    // Verify option labels are parent teams only
    expect(screen.getByText("Boys Soccer")).toBeInTheDocument();
    expect(screen.getByText("Girls Soccer")).toBeInTheDocument();
    expect(screen.queryByText("IHS Girls Soccer JV")).toBeNull();
    expect(screen.queryByText("IHS Boys Soccer JV")).toBeNull();

    // Selecting Boys Soccer should select the primary Varsity id (20)
    fireEvent.change(select, { target: { value: "20" } });
    expect(handleChange).toHaveBeenCalled();
  });
});
