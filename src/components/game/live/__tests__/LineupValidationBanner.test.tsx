import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LineupValidationBanner from "../LineupValidationBanner";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("LineupValidationBanner", () => {
  it("renders nothing when lineup is configured", () => {
    const { container } = render(
      <LineupValidationBanner
        isLineupConfigured={true}
        onFieldCount={11}
        playersOnFieldSetting={11}
        teamSeasonId="1"
        gameId="10"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders warning banner when lineup is misconfigured", () => {
    render(
      <LineupValidationBanner
        isLineupConfigured={false}
        onFieldCount={9}
        playersOnFieldSetting={11}
        teamSeasonId="1"
        gameId="10"
      />
    );

    expect(
      screen.getByText(/Roster setup required: starting lineup size mismatch \(9\/11\)\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Configure Lineup/i })).toBeInTheDocument();
  });

  it("navigates to lineup page on button click", () => {
    render(
      <LineupValidationBanner
        isLineupConfigured={false}
        onFieldCount={9}
        playersOnFieldSetting={11}
        teamSeasonId="1"
        gameId="10"
      />
    );

    const btn = screen.getByRole("button", { name: /Configure Lineup/i });
    fireEvent.click(btn);
    expect(mockPush).toHaveBeenCalledWith("/gamestats/1/10/lineup");
  });
});
