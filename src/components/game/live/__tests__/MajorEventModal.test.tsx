import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MajorEventModal from "../MajorEventModal";

describe("MajorEventModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    opponentShortName: "Tigers FC",
    onRecordGoal: vi.fn(),
    onRecordCard: vi.fn(),
    onRecordStoppage: vi.fn(),
    isPending: false,
  };

  it("renders goal form options by default", () => {
    render(<MajorEventModal {...defaultProps} />);

    expect(screen.getByText("Record Major Match Event")).toBeInTheDocument();
    expect(screen.getByText("Our Team")).toBeInTheDocument();
    expect(screen.getByText("Tigers FC")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Record Goal/i })).toBeInTheDocument();
  });

  it("switches form step when quick event type button is clicked", () => {
    render(<MajorEventModal {...defaultProps} />);

    // Click Card button
    const cardBtn = screen.getByRole("button", { name: "Card" });
    fireEvent.click(cardBtn);

    expect(screen.getByRole("button", { name: /Record Card/i })).toBeInTheDocument();
  });

  it("switches to PK form when PK button is clicked", () => {
    render(<MajorEventModal {...defaultProps} />);

    const pkBtn = screen.getByRole("button", { name: "PK" });
    fireEvent.click(pkBtn);

    expect(screen.getByRole("button", { name: /Log Penalty Kick/i })).toBeInTheDocument();
    expect(screen.getByText("Penalty Kick Result")).toBeInTheDocument();
  });
});
