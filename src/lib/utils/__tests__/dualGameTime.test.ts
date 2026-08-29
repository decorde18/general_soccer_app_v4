import { describe, it, expect } from "vitest";
import {
  calculateAbsoluteGameTime,
  calculateScoreboardTime,
  formatScoreboardMinute,
} from "../dateTimeUtils";

describe("Dual Game Time Utilities (dateTimeUtils)", () => {
  describe("calculateAbsoluteGameTime", () => {
    it("should calculate continuous elapsed seconds from match start", () => {
      const matchStartMs = 1700000000000;
      const currentMs = 1700000600000; // 600 seconds (10 minutes) later
      expect(calculateAbsoluteGameTime(matchStartMs, currentMs)).toBe(600);
    });

    it("should return 0 if invalid inputs provided", () => {
      expect(calculateAbsoluteGameTime(0, 1000)).toBe(0);
      expect(calculateAbsoluteGameTime(1000, 0)).toBe(0);
    });
  });

  describe("calculateScoreboardTime", () => {
    it("should subtract clock stoppages from absolute game time", () => {
      const absoluteSeconds = 600; // 10 minutes elapsed
      const stoppages = [
        { startTime: 120, endTime: 180 }, // 60 seconds injury stoppage
        { startTime: 300, endTime: 330 }, // 30 seconds VAR review
      ];

      // Total stoppage deduction = 60 + 30 = 90 seconds
      // Scoreboard Time = 600 - 90 = 510 seconds (8m 30s)
      expect(calculateScoreboardTime(absoluteSeconds, stoppages)).toBe(510);
    });

    it("should handle ongoing stoppages (null endTime)", () => {
      const absoluteSeconds = 600;
      const stoppages = [
        { startTime: 500, endTime: null }, // Ongoing stoppage since t=500s (100s duration)
      ];

      // Scoreboard Time = 600 - 100 = 500 seconds
      expect(calculateScoreboardTime(absoluteSeconds, stoppages)).toBe(500);
    });

    it("should subtract inter-period breaks from absolute time", () => {
      const absoluteSeconds = 3600; // 60 minutes after match start
      const periodBreaks = [
        { start: 2400, end: 3300 }, // Halftime break (900s / 15 mins)
      ];

      // Scoreboard Time = 3600 - 900 = 2700 seconds (45 mins)
      expect(calculateScoreboardTime(absoluteSeconds, [], periodBreaks)).toBe(2700);
    });
  });

  describe("formatScoreboardMinute", () => {
    it("should format 1st half minutes accurately", () => {
      // 0 seconds -> 1st minute ("1'")
      expect(formatScoreboardMinute(0, 1, 40)).toBe("1'");
      // 23m 15s (1395 seconds) -> 24th minute ("24'")
      expect(formatScoreboardMinute(1395, 1, 40)).toBe("24'");
    });

    it("should format 1st half extra time correctly", () => {
      // 41m 30s (2490 seconds) in a 40m half -> "40+2'"
      expect(formatScoreboardMinute(2490, 1, 40)).toBe("40+2'");
    });

    it("should format 2nd half minutes accurately", () => {
      // Start of 2nd half (40m nominal 1st half + 5m in 2nd half = 45m -> 46th minute)
      expect(formatScoreboardMinute(2700, 2, 40)).toBe("46'");
    });
  });
});
