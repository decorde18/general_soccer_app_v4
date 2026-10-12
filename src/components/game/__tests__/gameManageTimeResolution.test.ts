import { describe, it, expect } from "vitest";
import {
  convertPeriodClockToAbsoluteSeconds,
  convertAbsoluteSecondsToPeriodClock,
} from "@/lib/utils/dateTimeUtils";

describe("Manual Event Time Resolution (convertPeriodClockToAbsoluteSeconds & convertAbsoluteSecondsToPeriodClock)", () => {
  describe("Period 1 events", () => {
    it("handles Period 1 active clock directly when no stoppages exist", () => {
      const periods = [{ periodNumber: 1, startTime: 1000000, endTime: null }];
      const absSec = convertPeriodClockToAbsoluteSeconds(1, 750, periods, [], 2400); // 12m 30s
      expect(absSec).toBe(750);

      const clock = convertAbsoluteSecondsToPeriodClock(750, 1, periods, [], 2400);
      expect(clock.period).toBe(1);
      expect(clock.minutes).toBe(12);
      expect(clock.seconds).toBe(30);
      expect(clock.formattedTime).toBe("12:30");
    });

    it("adds clock stoppages occurring prior to the event in Period 1", () => {
      const periods = [{ periodNumber: 1, startTime: 1000000, endTime: null }];
      const stoppages = [
        { period: 1, clock_should_run: 0, game_time: 120, end_time: 240 }, // 120s stoppage at 2:00
        { period: 1, clock_should_run: 0, game_time: 900, end_time: 960 }, // 60s stoppage at 15:00
      ];

      // Goal at 10:00 (600s active clock):
      // The 120s stoppage at 2:00 has elapsed, but the 15:00 stoppage has NOT occurred yet.
      const absSec = convertPeriodClockToAbsoluteSeconds(1, 600, periods, stoppages, 2400);
      expect(absSec).toBe(600 + 120); // 720s

      const clock = convertAbsoluteSecondsToPeriodClock(720, 1, periods, stoppages, 2400);
      expect(clock.minutes).toBe(10);
      expect(clock.seconds).toBe(0);
      expect(clock.formattedTime).toBe("10:00");
    });
  });

  describe("Period 2 events with period breaks and clock stoppages", () => {
    it("accounts for all of Period 1, the halftime break, and Period 2 clock stoppages (user scenario)", () => {
      // Scenario:
      // Match starts at T0 = 1,000,000 ms.
      // Period 1 runs for 45 minutes wall-clock (2700s) -> ends at 1,000,000 + 2,700,000 ms.
      // Halftime break lasts 15 minutes (900s) -> Period 2 kicks off at 1,000,000 + 3,600,000 ms (T = 3600s).
      const periods = [
        { periodNumber: 1, startTime: 1000000, endTime: 1000000 + 2700000 },
        { periodNumber: 2, startTime: 1000000 + 3600000, endTime: null },
      ];

      // In Period 2:
      // Clock stoppage occurs at active clock 4:00 (absolute time: 3600 + 240 = 3840s).
      // Stoppage duration is 2 minutes (120s), ending at absolute time 3960s.
      // A later stoppage occurs at active clock 15:00 (absolute time: 3600 + 900 + 120 = 4620s).
      const stoppages = [
        { period: 2, clock_should_run: 0, game_time: 3840, end_time: 3960 },
        { period: 2, clock_should_run: 0, game_time: 4620, end_time: 4680 },
      ];

      // User enters goal at 9:52 of Period 2 (9 * 60 + 52 = 592 active seconds):
      // Expected absolute seconds:
      // Period 2 Start (3600s) + Active Clock (592s) + Stoppage (120s) = 4312s!
      const goalActiveSec = 9 * 60 + 52;
      const absGoalSec = convertPeriodClockToAbsoluteSeconds(2, goalActiveSec, periods, stoppages, 2400);

      expect(absGoalSec).toBe(3600 + 592 + 120);
      expect(absGoalSec).toBe(4312);

      // Verify the inverse conversion when opening "Edit Goal":
      const clock = convertAbsoluteSecondsToPeriodClock(4312, 2, periods, stoppages, 2400);
      expect(clock.period).toBe(2);
      expect(clock.minutes).toBe(9);
      expect(clock.seconds).toBe(52);
      expect(clock.totalPeriodSeconds).toBe(592);
      expect(clock.formattedTime).toBe("09:52");
    });

    it("handles fallback when periods do not have recorded timestamps", () => {
      // Offline/scheduled game with no timestamps:
      // Nominal period length: 40 minutes (2400s)
      const periods = [
        { periodNumber: 1, startTime: null, endTime: null },
        { periodNumber: 2, startTime: null, endTime: null },
      ];

      // Goal at 10:00 of Period 2:
      // Falls back to nominal Period 1 (2400s) + 600s active = 3000s
      const absSec = convertPeriodClockToAbsoluteSeconds(2, 600, periods, [], 2400);
      expect(absSec).toBe(3000);

      const clock = convertAbsoluteSecondsToPeriodClock(3000, 2, periods, [], 2400);
      expect(clock.minutes).toBe(10);
      expect(clock.seconds).toBe(0);
      expect(clock.formattedTime).toBe("10:00");
    });

    it("preserves exact roundtrip fidelity across multiple periods and times", () => {
      const periods = [
        { periodNumber: 1, startTime: 1000000, endTime: 1000000 + 2400000 },
        { periodNumber: 2, startTime: 1000000 + 3000000, endTime: 1000000 + 5500000 },
        { periodNumber: 3, startTime: 1000000 + 5800000, endTime: null }, // OT 1
      ];

      const stoppages = [
        { period: 1, clock_should_run: 0, game_time: 500, end_time: 560 },
        { period: 2, clock_should_run: 0, game_time: 3200, end_time: 3320 },
      ];

      const testCases = [
        { period: 1, min: 3, sec: 15 },
        { period: 1, min: 28, sec: 45 },
        { period: 2, min: 0, sec: 30 },
        { period: 2, min: 9, sec: 52 },
        { period: 2, min: 39, sec: 59 },
        { period: 3, min: 4, sec: 12 },
      ];

      for (const tc of testCases) {
        const inputClockSec = tc.min * 60 + tc.sec;
        const absSec = convertPeriodClockToAbsoluteSeconds(tc.period, inputClockSec, periods, stoppages, 2400);
        const resolved = convertAbsoluteSecondsToPeriodClock(absSec, tc.period, periods, stoppages, 2400);

        expect(resolved.period).toBe(tc.period);
        expect(resolved.minutes).toBe(tc.min);
        expect(resolved.seconds).toBe(tc.sec);
        expect(resolved.totalPeriodSeconds).toBe(inputClockSec);
      }
    });
  });
});
