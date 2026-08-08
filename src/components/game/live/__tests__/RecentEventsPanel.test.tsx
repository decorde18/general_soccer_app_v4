import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RecentEventsPanel, { RecentEvent } from "../RecentEventsPanel";

const mockEvents: RecentEvent[] = [
  { id: "goal-1", dbId: 10, time: 300, type: "goal", desc: "Goal for Us by Messi" },
  { id: "card-1", dbId: 20, time: 500, type: "discipline", desc: "YELLOW Card to Ramos" },
];

describe("RecentEventsPanel", () => {
  const defaultProps = {
    recentEventsList: mockEvents,
    confirmDeleteId: null,
    setConfirmDeleteId: vi.fn(),
    onDeleteEvent: vi.fn(),
  };

  it("renders empty message when no events", () => {
    render(<RecentEventsPanel {...defaultProps} recentEventsList={[]} />);

    expect(screen.getByText("No events logged yet.")).toBeInTheDocument();
  });

  it("renders list of recent events", () => {
    render(<RecentEventsPanel {...defaultProps} />);

    expect(screen.getByText("05:00")).toBeInTheDocument();
    expect(screen.getByText("Goal for Us by Messi")).toBeInTheDocument();
    expect(screen.getByText("YELLOW Card to Ramos")).toBeInTheDocument();
  });

  it("toggles inline confirmation when delete icon is clicked", () => {
    render(<RecentEventsPanel {...defaultProps} />);

    const deleteButtons = screen.getAllByRole("button");
    fireEvent.click(deleteButtons[0]);
    expect(defaultProps.setConfirmDeleteId).toHaveBeenCalledWith("goal-1");
  });

  it("shows Yes/No confirm controls and calls onDeleteEvent when Yes is clicked", () => {
    render(<RecentEventsPanel {...defaultProps} confirmDeleteId="goal-1" />);

    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(defaultProps.onDeleteEvent).toHaveBeenCalledWith(10, "goal");
  });
});
