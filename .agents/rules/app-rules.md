# Application Rules - General Soccer App v4

## 1. Mandatory UX: Optimistic Updates, Loading Spinners & Disabled Button States
- Every form submission, modal trigger, live match event, and async API call MUST implement **Optimistic Updates** and/or **Loading Feedback**.
- Action buttons MUST be disabled during pending requests (`disabled={isSubmitting || isLoading}`) to prevent double-submissions or duplicate records.
- Action button text MUST dynamically change to indicate active status (e.g. `"Saving..."`, `"Executing..."`, `"Deleting..."`, `"Submitting..."`) or render an inline loading spinner icon.
- Failed requests MUST catch exceptions, notify the user, and roll back optimistic updates gracefully.

## 2. Universal Date & Time Standards
- Save game `start_time` as UTC `DateTime` using `parseGameDatesAndTimesUTC(dateStr, timeStr)`. Preserve 8:00 AM as `08:00:00.000Z` UTC.
- Format UI times using `formatTimeStandard(timeInput)` or `formatDateStandard(dateInput)`.
- Format `<input type="time" ...>` controls using `formatTime24(timeInput)`.

## 3. Active Game Clock & Playing Time Standards
- Compute player active time on field via `calculateActivePlayerTimeOnField`.
- Compute player active time off field via `calculateActivePlayerTimeOffField`.
- Intersect player shifts with active period ranges `[P.start, P.end]`. Halftime, inter-period breaks, and stopped-clock stoppages MUST contribute 0 seconds to active playing time and bench time.

## 4. Multi-Table Cascade Event Deletion & Stoppage Integrity
- Deleting or canceling an event MUST delete all parent records (`game_events_major`) AND child records (`game_events_goals`, `game_events_discipline`, `game_events_penalties`, `game_subs`) across DB tables and Zustand stores simultaneously.

## 5. Substitution & Roster Eligibility Standards
- Event recording modals (Scorer, Assist, Cards) MUST scope option dropdowns to players on the field at that timestamp (`isPlayerOnFieldAtTime`).
- Scorer and Assister selection MUST bi-directionally exclude selecting the same player.
- Live match tables MUST filter by eligible player statuses (`starter`, `goalkeeper`, `dressed`).
- Pending subs MUST NEVER alter a player's `fieldStatus` until confirmed.

## 6. Importer & Entity Deduplication
- Importers MUST match existing clubs, venues (`locations`), fields (`sublocations`), and team seasons before creating new entities.
- Importers MUST enroll teams into `team_league_enrollments` and link games to `game_league_nodes` and `game_standings_inclusions`.

## 7. Type Safety & Verification
- All server actions and route handlers MUST include `NaN` guards on numeric IDs.
- All code changes MUST pass `npx tsc --noEmit` and `npx vitest run` with zero errors.
