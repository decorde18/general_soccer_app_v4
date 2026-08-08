import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MajorEventModal from "../MajorEventModal";

const playerOptions = [
  { value: "1", label: "#10 Lionel Messi" },
  { value: "2", label: "#7 Cristiano Ronaldo" },
];

describe("MajorEventModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    opponentShortName: "Tigers FC",
    playerOptions,
    onRecordGoal: vi.fn(),
    onRecordCard: vi.fn(),
    onRecordStoppage: vi.fn(),
    isPending: false,
  };

  it("renders goal form options by default", () => {
    render(<MajorEventModal {...defaultProps} />);

    expect(screen.getByText("Record Major Match Event")).toBeInTheDocument();
    expect(screen.getByText("Goal for Opponent (Tigers FC)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record Goal" })).toBeInTheDocument();
  });

  it("submits goal data when Record Goal is clicked", () => {
    render(<MajorEventModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Record Goal" }));
    expect(defaultProps.onRecordGoal).toHaveBeenCalledWith({
      scorerId: "",
      assistId: "",
      goalType: "foot",
      isOpponentGoal: false,
    });
  });

  it("switches to card form when Event Type is changed to Disciplinary Card", () => {
    const { container } = render(<MajorEventModal {...defaultProps} />);

    const selects = container.querySelectorAll("select");
    const eventTypeSelect = selects[0];
    fireEvent.change(eventTypeSelect, { target: { value: "card" } });

    expect(screen.getByText("Select Player")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record Card" })).toBeInTheDocument();
  });

  it("submits stoppage data when Event Type is changed to Stoppage", () => {
    const { container } = render(<MajorEventModal {...defaultProps} />);

    const selects = container.querySelectorAll("select");
    const eventTypeSelect = selects[0];
    fireEvent.change(eventTypeSelect, { target: { value: "stoppage" } });

    const input = screen.getByPlaceholderText(/e\.g\. Injury, Referee Timeout, Water break/i);
    fireEvent.change(input, { target: { value: "Injury timeout" } });

    fireEvent.click(screen.getByRole("button", { name: "Log Stoppage" }));
    expect(defaultProps.onRecordStoppage).toHaveBeenCalledWith({
      reason: "Injury timeout",
    });
  });
});
