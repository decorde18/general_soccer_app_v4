import { describe, it, expect } from "vitest";

function resolveGameTimeSeconds(
  periodStr: string | number,
  minStr: string,
  secStr: string,
  game: { settings?: { periodDuration?: number }; periods?: Array<{ periodNumber?: number; period_number?: number; startTime?: number; endTime?: number }> }
) {
  const pNum = Number(periodStr) || 1;
  const rawInputSecs = (Number(minStr) || 0) * 60 + (Number(secStr) || 0);
  const regPeriodSecs = game?.settings?.periodDuration || 2400;

  let precedingOffset = 0;
  for (let i = 1; i < pNum; i++) {
    const matchingP = (game?.periods || []).find(
      (item: any) => (item.periodNumber || item.period_number) === i
    );
    if (matchingP && matchingP.endTime && matchingP.startTime) {
      precedingOffset += Math.round((matchingP.endTime - matchingP.startTime) / 60000) * 60;
    } else {
      precedingOffset += regPeriodSecs;
    }
  }

  return pNum > 1 && rawInputSecs < precedingOffset
    ? precedingOffset + rawInputSecs
    : rawInputSecs;
}

describe("resolveGameTimeSeconds", () => {
  const game30MinHalves = {
    settings: { periodDuration: 1800 },
    periods: [
      { periodNumber: 1, startTime: 1000000, endTime: 1000000 + 1801000 }, // ~1800s
    ],
  };

  it("converts Period 2 period minute (15m) into cumulative game time (45m)", () => {
    const secs = resolveGameTimeSeconds(2, "15", "0", game30MinHalves);
    expect(secs).toBe(2700); // 45 * 60
    expect(Math.floor(secs / 60)).toBe(45);
  });

  it("accepts already cumulative game minute (45m) for Period 2 without double-counting", () => {
    const secs = resolveGameTimeSeconds(2, "45", "0", game30MinHalves);
    expect(secs).toBe(2700); // 45 * 60
    expect(Math.floor(secs / 60)).toBe(45);
  });

  it("handles Period 1 minutes directly without offset", () => {
    const secs = resolveGameTimeSeconds(1, "12", "30", game30MinHalves);
    expect(secs).toBe(750); // 12 * 60 + 30
    expect(Math.floor(secs / 60)).toBe(12);
  });

  it("handles 40-minute halves (high school NFHS)", () => {
    const game40Min = {
      settings: { periodDuration: 2400 },
      periods: [],
    };
    // 10th minute of 2nd half -> 50th game minute (40 + 10)
    const secs = resolveGameTimeSeconds(2, "10", "0", game40Min);
    expect(secs).toBe(3000); // 50 * 60
    expect(Math.floor(secs / 60)).toBe(50);
  });
});
