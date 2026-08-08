import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LiveNavigationDrawer from "../LiveNavigationDrawer";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("LiveNavigationDrawer", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    teamSeasonId: "1",
    gameId: "10",
  };

  it("renders nothing when isOpen is false", () => {
    const { container } = render(<LiveNavigationDrawer {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders drawer options when isOpen is true", () => {
    render(<LiveNavigationDrawer {...defaultProps} />);

    expect(screen.getByText("Match Operations")).toBeInTheDocument();
    expect(screen.getByText("Lineup & Roster Setup")).toBeInTheDocument();
    expect(screen.getByText("Game Rules & Settings")).toBeInTheDocument();
    expect(screen.getByText("Game Management")).toBeInTheDocument();
    expect(screen.getByText("Match Summary")).toBeInTheDocument();
  });

  it("navigates to lineup page on click", () => {
    render(<LiveNavigationDrawer {...defaultProps} />);

    fireEvent.click(screen.getByText("Lineup & Roster Setup"));
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/gamestats/1/10/lineup");
  });
});
