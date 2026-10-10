const MONTH_NAMES_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function parseGameDatesAndTimesUTC(
  dateStr: string,
  timeStr?: string,
  defaultDurationMinutes: number = 90
) {
  let year = 2026, month = 1, day = 1;
  const cleanDateStr = (dateStr || "").trim();
  const dateParts = cleanDateStr.split("T")[0].split("-");
  if (dateParts.length === 3 && dateParts[0].length === 4) {
    year = parseInt(dateParts[0], 10);
    month = parseInt(dateParts[1], 10);
    day = parseInt(dateParts[2], 10);
  } else {
    const slashes = cleanDateStr.split("/");
    if (slashes.length === 3) {
      if (slashes[0].length === 4) {
        year = parseInt(slashes[0], 10);
        month = parseInt(slashes[1], 10);
        day = parseInt(slashes[2], 10);
      } else {
        month = parseInt(slashes[0], 10);
        day = parseInt(slashes[1], 10);
        year = parseInt(slashes[2], 10);
      }
    } else {
      const monthFirstMatch = cleanDateStr.match(/(?:[a-zA-Z]+,\s*)?([a-zA-Z]+)\s+(\d{1,2}),?\s*(\d{4})/i);
      const dayFirstMatch = cleanDateStr.match(/(?:[a-zA-Z]+,\s*)?(\d{1,2})\s+([a-zA-Z]+),?\s*(\d{4})/i);

      if (monthFirstMatch && MONTH_NAMES_MAP[monthFirstMatch[1].toLowerCase()]) {
        month = MONTH_NAMES_MAP[monthFirstMatch[1].toLowerCase()];
        day = parseInt(monthFirstMatch[2], 10);
        year = parseInt(monthFirstMatch[3], 10);
      } else if (dayFirstMatch && MONTH_NAMES_MAP[dayFirstMatch[2].toLowerCase()]) {
        day = parseInt(dayFirstMatch[1], 10);
        month = MONTH_NAMES_MAP[dayFirstMatch[2].toLowerCase()];
        year = parseInt(dayFirstMatch[3], 10);
      } else {
        const parsed = new Date(cleanDateStr);
        if (!isNaN(parsed.getTime())) {
          year = parsed.getFullYear();
          month = parsed.getMonth() + 1;
          day = parsed.getDate();
        }
      }
    }
  }

  const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  if (!timeStr || !timeStr.trim()) {
    return {
      startDate,
      startTime: null,
      endDate: startDate,
      endTime: null,
    };
  }

  const rawTime = timeStr.trim();
  let hours = 0;
  let minutes = 0;

  const twelverMatch = rawTime.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (twelverMatch) {
    hours = parseInt(twelverMatch[1], 10);
    minutes = parseInt(twelverMatch[2], 10);
    const ampm = (twelverMatch[3] || "").toLowerCase();
    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;
  } else {
    const parts = rawTime.split(":");
    if (parts.length >= 2) {
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
    }
  }

  const startTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  const endTime = new Date(startTime.getTime() + defaultDurationMinutes * 60 * 1000);
  const endDate = new Date(Date.UTC(endTime.getUTCFullYear(), endTime.getUTCMonth(), endTime.getUTCDate(), 0, 0, 0));

  return {
    startDate,
    startTime,
    endDate,
    endTime,
  };
}

const testDates = [
  ["Saturday, October 10, 2026", "8:30 AM"],
  ["Sunday, October 11, 2026", "12:00 PM"],
  ["10/10/2026", "8:30 AM"],
  ["2026-10-10", "8:30 AM"],
  ["October 10, 2026", "9:50 AM"],
  ["10 Oct 2026", "1:50 PM"]
];

for (const [d, t] of testDates) {
  const res = parseGameDatesAndTimesUTC(d, t);
  console.log(`${d} + ${t} -> startDate=${res.startDate.toISOString()} startTime=${res.startTime?.toISOString()}`);
}
