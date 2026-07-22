// lib/dateTimeUtils.ts

// ==================== TYPES ====================

export type DateInput = string | number | Date;

export interface SecondsToTimeOptions {
  /** Include seconds in output (default true) */
  includeSeconds?: boolean;
  /** Use 12-hour format (default false) */
  use12Hour?: boolean;
}

export interface MySqlDateTimeDisplay {
  date: string;
  time: string;
}

export type TimestampFormatType =
  | "date"
  | "timeShort"
  | "timeLong"
  | "datetime";

export interface Stoppage {
  /** Stoppage start time in game seconds */
  startTime: number;
  /** Stoppage end time in game seconds, or null if still ongoing */
  endTime: number | null;
}

export interface SubEvent {
  /** Game time (seconds) of the substitution event, or null if not yet recorded */
  gameTime: number | null;
}

interface TimeRange {
  start: number;
  end: number;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Pads a number to 2 digits with leading zero.
 */
function pad(num: number): string {
  return String(num).padStart(2, "0");
}

// ==================== CONVERSION FUNCTIONS ====================

/**
 * Converts various date inputs to Unix timestamp in milliseconds.
 * @param dateInput - Date input in various formats
 * @returns Unix timestamp in milliseconds
 */
export function toTimestamp(dateInput: DateInput): number {
  if (!dateInput) return 0;

  let dateObject: Date;

  // If it's a MySQL datetime string (YYYY-MM-DD HH:MM:SS), treat it as UTC
  if (
    typeof dateInput === "string" &&
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateInput)
  ) {
    dateObject = new Date(dateInput.replace(" ", "T") + "Z");
  } else {
    // Handle everything else (timestamps, ISO strings, Date objects, etc.)
    dateObject = new Date(dateInput);
  }

  if (isNaN(dateObject.getTime())) {
    throw new Error("Invalid date input. Could not parse to a Date object.");
  }

  return dateObject.getTime();
}

/**
 * Converts Unix timestamp (ms) to MySQL DATETIME format (UTC).
 * @param timestamp - Unix timestamp in milliseconds
 * @returns MySQL DATETIME string (YYYY-MM-DD HH:MM:SS)
 */
export function toMySqlDateTime(timestamp: number = Date.now()): string {
  return new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Converts MySQL DATETIME string to Unix timestamp (ms).
 * @param mysqlDateTime - MySQL DATETIME (e.g., "2025-11-29 14:30:00")
 * @returns Unix timestamp in milliseconds
 */
export function fromMySqlDateTime(mysqlDateTime: string): number {
  if (!mysqlDateTime) return 0;
  return new Date(mysqlDateTime.replace(" ", "T") + "Z").getTime();
}

// ==================== FORMATTING FUNCTIONS ====================

/**
 * Converts seconds to time string format.
 * @param totalSeconds - Total duration in seconds
 * @param options - Formatting options
 * @returns Formatted time string
 */
export function secondsToTime(
  totalSeconds: number,
  options: SecondsToTimeOptions = {},
): string {
  const { includeSeconds = true, use12Hour = false } = options;

  const secondsFloor = Math.floor(totalSeconds);
  const SECONDS_IN_DAY = 86400;
  const secondsInDay = secondsFloor % SECONDS_IN_DAY;

  const hours24 = Math.floor(secondsInDay / 3600);
  const minutes = Math.floor((secondsInDay % 3600) / 60);
  const seconds = secondsInDay % 60;

  let timeString: string;
  let period = "";

  if (use12Hour) {
    period = hours24 >= 12 ? "PM" : "AM";
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    timeString = `${hours12}:${pad(minutes)}`;
  } else {
    timeString = `${pad(hours24)}:${pad(minutes)}`;
  }

  if (includeSeconds) {
    timeString += `:${pad(seconds)}`;
  }

  if (use12Hour) {
    timeString += ` ${period}`;
  }

  return timeString;
}

/**
 * Converts seconds to MM:SS format.
 * @param seconds - Total seconds
 * @returns Formatted time as MM:SS
 */
export function formatSecondsToMmss(seconds: number): string {
  if (!seconds || seconds < 0) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Converts MySQL DATETIME to local date and time display strings.
 * @param mysqlDateTime - MySQL DATETIME in UTC
 * @returns Formatted date and time
 */
export function formatMySqlDateTime(
  mysqlDateTime: string,
): MySqlDateTimeDisplay {
  if (!mysqlDateTime) return { date: "", time: "" };

  const dateObj = new Date(mysqlDateTime.replace(" ", "T") + "Z");

  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  const year = dateObj.getFullYear().toString().slice(-2);
  const date = `${month}/${day}/${year}`;

  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const time = `${hours}:${minutes} ${ampm}`;

  return { date, time };
}

/**
 * Formats Unix timestamp to various display formats.
 * @param timestampMs - Unix timestamp in milliseconds
 * @param formatType - 'date', 'timeShort', 'timeLong', or 'datetime'
 * @param timeZone - IANA timezone string
 * @returns Formatted date/time string
 */
export function formatTimestamp(
  timestampMs: number,
  formatType: TimestampFormatType | string,
  timeZone: string = "America/Chicago",
): string {
  if (typeof timestampMs !== "number" || timestampMs < 0) return "";

  const date = new Date(timestampMs);
  const options: Intl.DateTimeFormatOptions = { timeZone, hour12: true };

  switch (formatType.toLowerCase()) {
    case "date":
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      break;

    case "timeshort":
      options.hour = "numeric";
      options.minute = "2-digit";
      break;

    case "timelong":
      options.hour = "numeric";
      options.minute = "2-digit";
      options.second = "2-digit";
      break;

    case "datetime":
    default:
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      options.hour = "numeric";
      options.minute = "2-digit";
      options.second = "2-digit";
      break;
  }

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

/**
 * Converts MySQL TIME string to 12-hour format display.
 * @param mysqlTimeString - MySQL TIME (e.g., "13:30:00")
 * @returns Formatted time (h:mm AM/PM)
 */
export function formatMySqlTime(mysqlTimeString: string): string | null {
  if (!mysqlTimeString) return null;

  const [hours, minutes] = mysqlTimeString.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;

  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Converts MySQL DATE string to display format (MM/DD/YY).
 * @param mysqlDateString - MySQL DATE (e.g., "2025-10-25")
 * @returns Formatted date (MM/DD/YY)
 */
export function formatMySqlDate(mysqlDateString: string): string {
  if (!mysqlDateString) return "";

  const dateObj = new Date(mysqlDateString + "T00:00:00.000Z");
  if (isNaN(dateObj.getTime())) return "";

  const options: Intl.DateTimeFormatOptions = {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  };

  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

/**
 * Converts local date/time to MySQL format for form inputs.
 * @param dateValue - Date value
 * @returns Date string for input (YYYY-MM-DD)
 */
export function toDateInputValue(dateValue: DateInput): string {
  if (!dateValue) return "";

  // If it's already a valid YYYY-MM-DD string, return it exactly as is
  if (
    typeof dateValue === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim())
  ) {
    return dateValue.trim();
  }

  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Converts time value to format for time inputs.
 * @param timeValue - Time value
 * @returns Time string for input (HH:MM)
 */
export function toTimeInputValue(timeValue: string): string {
  if (!timeValue) return "";
  if (/^\d{2}:\d{2}$/.test(timeValue)) return timeValue;
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeValue)) return timeValue.substring(0, 5);
  return timeValue;
}

// ==================== GAME TIME CALCULATIONS ====================

/**
 * Calculates total game time (wall clock time since game started).
 * Game time never pauses.
 * @param firstPeriodStartMs - Unix timestamp when game started (ms)
 * @param currentMs - Current Unix timestamp (ms)
 * @returns Game time in seconds
 */
export function calculateGameTime(
  firstPeriodStartMs: number,
  currentMs: number,
): number {
  if (!firstPeriodStartMs || !currentMs) return 0;
  return Math.floor((currentMs - firstPeriodStartMs) / 1000);
}

/**
 * Calculates period time (playing time, excluding stoppages).
 * @param periodStartMs - Period start timestamp (ms)
 * @param periodEndMs - Period end timestamp (ms) or current time
 * @param stoppages - Stoppages in game seconds
 * @returns Period time in seconds (excluding stoppages)
 */
export function calculatePeriodTime(
  periodStartMs: number,
  periodEndMs: number,
  stoppages: Stoppage[] = [],
): number {
  if (!periodStartMs || !periodEndMs) return 0;

  const totalPeriodSeconds = Math.floor((periodEndMs - periodStartMs) / 1000);

  const stoppageSeconds = stoppages
    .filter((s): s is Stoppage & { endTime: number } => s.endTime !== null)
    .reduce((total, s) => total + (s.endTime - s.startTime), 0);

  return Math.max(0, totalPeriodSeconds - stoppageSeconds);
}

/**
 * Calculates player's actual time on field (playing time, excluding stoppages).
 * @param playerIns - Sub-in times (game seconds)
 * @param playerOuts - Sub-out times (game seconds)
 * @param isStarter - Whether player started
 * @param currentGameTime - Current game time (seconds)
 * @param stoppages - Stoppages (game seconds)
 * @returns Playing time in seconds
 */
export function calculatePlayerTimeOnField(
  playerIns: SubEvent[],
  playerOuts: SubEvent[],
  isStarter: boolean,
  currentGameTime: number,
  stoppages: Stoppage[] = [],
): number {
  const completedIns = (playerIns || []).filter((sub) => sub.gameTime !== null);
  const completedOuts = (playerOuts || []).filter(
    (sub) => sub.gameTime !== null,
  );

  // Build time ranges when player was on field
  const ranges: TimeRange[] = [];

  if (isStarter) {
    if (completedOuts.length > 0) {
      ranges.push({ start: 0, end: completedOuts[0].gameTime as number });
    } else {
      ranges.push({ start: 0, end: currentGameTime });
    }
  }

  // Process ins and outs
  for (let i = 0; i < completedIns.length; i++) {
    const inTime = completedIns[i].gameTime as number;
    const outTime =
      (completedOuts[i + (isStarter ? 1 : 0)]?.gameTime as
        | number
        | undefined) || currentGameTime;
    ranges.push({ start: inTime, end: outTime });
  }

  // Calculate time excluding stoppages
  let totalTime = 0;
  for (const range of ranges) {
    let rangeTime = range.end - range.start;

    // Subtract overlapping stoppages
    for (const stoppage of stoppages) {
      if (!stoppage.endTime) continue;

      const overlapStart = Math.max(range.start, stoppage.startTime);
      const overlapEnd = Math.min(range.end, stoppage.endTime);

      if (overlapStart < overlapEnd) {
        rangeTime -= overlapEnd - overlapStart;
      }
    }

    totalTime += rangeTime;
  }

  return Math.max(0, totalTime);
}
