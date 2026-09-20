import { describe, it, expect } from "vitest";
import {
  calculateAbsoluteGameTime,
  calculatePeriodTime,
  calculateActivePlayerTimeOnField,
  calculateRecentPlayerTimeOffField,
} from "../dateTimeUtils";

describe("Unified Game Clock & Player Time Calculations", () => {
  it("calculates absolute game time continuous elapsed seconds from game start", () => {
    const startMs = 100000;
    const currentMs = 190000;
    expect(calculateAbsoluteGameTime(startMs, currentMs)).toBe(90);
  });

  it("freezes period time when a stoppage with clock_should_run = 0 is active", () => {
    const periodStartMs = 100000;
    const stoppageStartMs = 160000; // Stoppage starts at 60 seconds into period

    // Before stoppage at 30 seconds
    const timeBefore = calculatePeriodTime(periodStartMs, 130000, []);
    expect(timeBefore).toBe(30);

    // Active stoppage in progress at 90 seconds (30s after stoppage started)
    const timeDuringStoppage1 = calculatePeriodTime(periodStartMs, 190000, [
      { startTime: stoppageStartMs, endTime: null },
    ]);
    expect(timeDuringStoppage1).toBe(60); // Clock FROZEN at 60 seconds!

    // Active stoppage in progress at 120 seconds (60s after stoppage started)
    const timeDuringStoppage2 = calculatePeriodTime(periodStartMs, 220000, [
      { startTime: stoppageStartMs, endTime: null },
    ]);
    expect(timeDuringStoppage2).toBe(60); // Clock STILL FROZEN at 60 seconds!

    // Stoppage ends at 220000 (duration = 60s). At 250000 (total elapsed = 150s)
    const timeAfterStoppage = calculatePeriodTime(periodStartMs, 250000, [
      { startTime: stoppageStartMs, endTime: 220000 },
    ]);
    expect(timeAfterStoppage).toBe(90); // 150 total - 60 stoppage = 90 active seconds
  });

  it("pauses player shift clocks and playing time when clock is stopped", () => {
    const isStarter = true;
    const periods = [{ start: 0, end: 2400 }]; // Period 1
    const stoppages = [{ startTime: 600, endTime: 900 }]; // 300s stoppage (mins 10-15)

    // Player time at minute 20 (1200 seconds)
    const playingTimeAt1200 = calculateActivePlayerTimeOnField(
      isStarter,
      [],
      [],
      periods,
      stoppages,
      1200
    );

    // Total time elapsed: 1200s. Minus 300s stoppage = 900s (15 minutes active)
    expect(playingTimeAt1200).toBe(900);
  });

  it("does not count halftime break towards player playing time or bench time", () => {
    const isStarter = true;
    // Period 1 (0 to 2400s), Halftime break (2400 to 3300s), Period 2 (3300 to 5700s)
    const periods = [
      { start: 0, end: 2400 },
      { start: 3300, end: 5700 },
    ];

    // Playing time during halftime at absolute second 2800
    const playingTimeAtHalftime = calculateActivePlayerTimeOnField(
      isStarter,
      [],
      [],
      periods,
      [],
      2800
    );

    // Player played full P1 (2400s). Halftime break contributes 0s.
    expect(playingTimeAtHalftime).toBe(2400);

    // Bench time during halftime for bench player at absolute second 2800
    const benchTimeAtHalftime = calculateRecentPlayerTimeOffField(
      false, // non-starter
      [],
      [],
      periods,
      [],
      2800
    );
    expect(benchTimeAtHalftime).toBe(2400);
  });
});
