import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TeamCountersPanel from "../TeamCountersPanel";

describe("TeamCountersPanel", () => {
  const defaultProps = {
    ourShortName: "Lions FC",
    opponentShortName: "Tigers FC",
    ourId: 1,
    oppId: 2,
    ourCorners: 4,
    oppCorners: 2,
    ourOffsides: 1,
    oppOffsides: 3,
    ourFouls: 5,
    oppFouls: 8,
    onAddTeamEvent: vi.fn(),
    onRemoveTeamEvent: vi.fn(),
  };

  it("renders counter numbers for corners, offsides, and fouls", () => {
    render(<TeamCountersPanel {...defaultProps} />);

    expect(screen.getByText("Corners: 4")).toBeInTheDocument();
    expect(screen.getByText("Corners: 2")).toBeInTheDocument();
    expect(screen.getByText("Offsides: 1")).toBeInTheDocument();
    expect(screen.getByText("Offsides: 3")).toBeInTheDocument();
    expect(screen.getByText("Fouls: 5")).toBeInTheDocument();
    expect(screen.getByText("Fouls: 8")).toBeInTheDocument();
  });

  it("calls onAddTeamEvent when plus button is clicked", () => {
    render(<TeamCountersPanel {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Add Our Corner"));
    expect(defaultProps.onAddTeamEvent).toHaveBeenCalledWith(1, "corner");

    fireEvent.click(screen.getByLabelText("Add Opponent Foul"));
    expect(defaultProps.onAddTeamEvent).toHaveBeenCalledWith(2, "foul");
  });

  it("calls onRemoveTeamEvent when minus button is clicked", () => {
    render(<TeamCountersPanel {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Remove Our Offside"));
    expect(defaultProps.onRemoveTeamEvent).toHaveBeenCalledWith(1, "offside");
  });
});
