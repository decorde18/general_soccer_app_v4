# General Soccer App v4 - Core Architecture & Operational Rules

This file documents mandatory architectural rules and conventions for developers and AI coding agents working on `general_soccer_app_v4`.

---

## 1. Mandatory UX: Optimistic Updates, Loading Spinners & Disabled Button States

- **Rule of Thumb for All UI Operations**:
  - Every form submission, modal action, live match event trigger, inline creation/edit/delete, and async server call MUST implement **Optimistic UI Updates** and/or **Loading Feedback**.
- **Button Disabling & Text Mutation**:
  - While an async request is in-flight, the action button MUST be disabled (`disabled={isPending || isSubmitting}`) to prevent double-submissions or duplicate records.
  - Action button text MUST dynamically change to indicate active status (e.g., `"Saving..."`, `"Executing..."`, `"Deleting..."`, `"Updating..."`) or display an inline loading spinner icon.
- **Optimistic UI Responsiveness**:
  - Interactive tables, roster panels, score entries, and live controls MUST mutate UI state optimistically so the interface feels instantaneous and lag-free to the user.
- **Error Recovery & Rollback**:
  - If an async request fails or errors out, the component MUST handle the exception, notify the user with feedback, and revert/roll back the optimistic state.

---

## 2. Universal Date & Time Conversion Standard

- **DB Storage Standard**:
  - `start_time` for games MUST always be saved into the database as a UTC `DateTime` object using `parseGameDatesAndTimesUTC(dateStr, timeStr)` from `@/lib/utils/dateTimeUtils`.
  - Non-shifted literal game time (e.g. `8:00 AM`) is preserved as `08:00:00.000Z` in UTC so that clock hours never drift across client or server timezones.
- **UI Display Standard**:
  - Always convert DB timestamps to UI display strings using `formatTimeStandard(timeInput)` or `formatDateStandard(dateInput)` from `@/lib/utils/dateTimeUtils`.
  - All game start times across match cards, schedules, scoreboards, recent/upcoming matches, and modals MUST be rendered in 12-hour AM/PM format (e.g. `8:00 AM`, `1:30 PM`). Never display raw 24-hour military time strings (e.g. `13:30:00`) in UI views.
  - HTML `<input type="time" ...>` controls MUST format time values using `formatTime24(timeInput)`.
  - Never call raw `.toLocaleTimeString()` or `.getUTCHours()` directly in component files.

---

## 3. Active Game Clock & Playing Time Standard

- **Dual-Clock Concept**:
  - **Absolute Time**: Continuous wall-clock seconds from match start ($T=0$). Used strictly for ordering sub events, goals, and cards.
  - **Scoreboard / Active Game Clock**: Running seconds ONLY during active period intervals (`[P.start, P.end]`) when `clock_should_run` / `clock_stopped` is NOT paused.
- **Player Playing Time (Active Minutes)**:
  - All player on-field playing time and goalkeeper playing time MUST be calculated by intersecting on-field shifts with active period ranges and subtracting paused-clock stoppages using `calculateActivePlayerTimeOnField` from `@/lib/utils/dateTimeUtils`.
  - Halftime and inter-period breaks have 0 active period duration and MUST NEVER contribute to player playing time.
- **Player Bench Time (Active Off-Field Time)**:
  - All bench/off-field player time MUST be calculated using `calculateActivePlayerTimeOffField` from `@/lib/utils/dateTimeUtils`.
  - Halftime and stopped-clock stoppages MUST NEVER accumulate as active bench time.
- **Dynamic Re-evaluation**:
  - If a period boundary is edited or a stoppage duration / `clock_should_run` flag changes in match administration, player active times MUST re-evaluate dynamically using `calculateActivePlayerTimeOnField`.

---

## 4. Database & Query Standards

- **Unified Calculation Helpers**:
  - Both client-side Zustand stores (`gamePlayerTimeStore.ts`) and server-side Prisma queries (`queries.ts`) MUST call the shared helpers in `@/lib/utils/dateTimeUtils` to guarantee 100% logic consistency across client and server.
  - Do NOT write ad-hoc interval loop calculations in component files or queries.

---

## 5. Multi-Table Cascade Event Deletion & Stoppage Integrity

- **Cascade Event Deletion**:
  - Deleting or canceling any game event (Goal, Card, Penalty, Sub, Stoppage) MUST delete all parent records (`game_events_major`) AND linked child records (`game_events_goals`, `game_events_discipline`, `game_events_penalties`, `game_subs`) across database tables and Zustand state simultaneously.
  - Never leave orphan child rows in sub-tables or duplicate stoppage feed entries.
- **Auto Clock Stoppage Rules**:
  - Under rulesets requiring automatic stoppage (e.g. High School rules), major event recording MUST automatically pause the match clock and log a stoppage window with `clock_should_run: false`.

---

## 6. Substitution & Roster Eligibility Standards

- **Strict On-Field Scoping for Event Triggers**:
  - Event recording modals (Scorer, Assist, PK Taker, Yellow/Red Card) MUST strictly scope player dropdowns to players active ON THE FIELD at that game timestamp (`isPlayerOnFieldAtTime`).
  - Scorer and Assister selection MUST bi-directionally exclude selecting the same player for both roles.
- **Roster Eligibility Filtering**:
  - On-field and bench tables MUST filter by eligible player statuses (`starter`, `goalkeeper`, `dressed`), excluding non-playing statuses (`injured`, `not_dressed`, `suspended`, `unavailable`).
- **Unconfirmed Sub State Safeguard**:
  - Pending substitutions MUST NEVER mutate a player's `fieldStatus` to `subbingIn` or `subbingOut` until explicitly confirmed or executed.

---

## 7. Importer & Entity Deduplication Standards

- **Entity Deduplication**:
  - Importers MUST match existing clubs, venues (`locations`), fields (`sublocations`), and team seasons case-insensitively before creating new database entities.
- **Division Hierarchy & Enrollment**:
  - Schedule imports MUST enroll participating teams into `team_league_enrollments` for the target division node season and attach games to `game_league_nodes` and `game_standings_inclusions`.
- **Header Parsing Priority**:
  - Primary date/time columns (`Date`, `Time`) MUST take precedence over secondary sort keys (e.g. `Datesort`).

---

## 8. Input Guarding, Type Safety & Aesthetics

- **NaN & Null Guards**:
  - All route params, numeric IDs, and time calculations MUST include `NaN` guards (`Number(...) || 0`) to prevent database 500 null constraint errors.
- **UI & Aesthetic Requirements**:
  - Use curated Tailwind/CSS color palettes (sleek dark modes, modern typography, glassmorphism).
  - Roster tables in live controls MUST maintain compact padding (`py-0.5 px-1.5`) and fixed row heights.
- **Verification**:
  - All code changes MUST pass `npx tsc --noEmit` and `npx vitest run` with zero errors.

---

## 9. Design System Primitives & UI Component Enforcement

- **No Raw HTML Input Controls**:
  - Never render raw `<select>`, `<input>`, or native `<button>` tags when standard UI primitives exist in `@/components/ui/` (`Select`, `Input`, `Button`, `Checkbox`, `Toggle`, `Modal`, `Dialog`).
- **Button Props & Loading State**:
  - `Button` component MUST destructure `isLoading`, `variant`, `size`, and `disabled`. When `isLoading={true}`, the component MUST automatically render an inline loading spinner and set `disabled={true}`.
- **Select Option Normalization**:
  - `Select` component MUST automatically suppress redundant default options when custom placeholder choices exist.

---

## 10. Cascading Selectors & Interactive Entity Links

- **Cascading Club → Team Selector**:
  - Any UI screen requiring selection of a team MUST use `ClubTeamSelect` from `@/components/ui/ClubTeamSelect` to filter Club first, then Team.
- **Universal Interactive Entity Links**:
  - Render venues using `LocationLink` and clubs/teams using `ClubLink` / `TeamLink` to trigger standard interactive modals (`LocationDetailsModal`, `ClubDetailsModal`, `TeamDetailsModal`) across all tables, schedules, and summary cards.

---

## 11. Terminal Subnode Hierarchy & Competition Node Selection

- **Terminal Leaf Subnode Scoping**:
  - Competition node select dropdowns MUST filter to terminal leaf subnodes (`other_league_nodes.length === 0`). Intermediate parent category nodes MUST NOT be selectable as match or team enrollment targets.
- **Full Hierarchy Path Formatting**:
  - All competition node options MUST display full hierarchy breadcrumbs (`"League Name > Parent Node > Division Subnode"`).
- **Dual Competition Enrollment & Auto-Sync**:
  - Selecting a primary competition node MUST automatically sync `gameType` (`"tournament"` vs `"league"`), while allowing dual-enrolled secondary competitions to be attached via `+ Add Dual Competition`.
