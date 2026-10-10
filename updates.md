# Application Update Log (`updates.md`)

This log tracks code updates, features, bug fixes, and architectural adjustments made to `general_soccer_app_v4` (including automated entries recorded by AI coding sessions).

### [2026-10-10 12:21] GameManageClient Duplicate Code & Preview Badge Cleanup
- **Type**: Bug Fix / Code Integrity
- **Summary**:
  1. **Fixed TS2451 Redeclare Variable Errors**:
     - Removed duplicate `const totalSeconds = resolveGameTimeSeconds(...)` declarations inside substitution (`handleAddOrUpdateSub`) and discipline card (`handleAddOrUpdateCard`) handler scopes in [`GameManageClient.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/GameManageClient.tsx).
  2. **Removed Duplicate UI Preview Badges**:
     - Removed duplicate Calculated Match Clock preview badges that were rendered twice in the Goal Modal, Substitution Modal, and Card Modal.
  3. **Verification**:
     - `npx tsc --noEmit` and all 24 Vitest test suites (91 tests) passed with 100% success.
- **Modified Files**:
  - `src/components/game/GameManageClient.tsx`
  - `updates.md`

### [2026-10-10 12:13] Universal Goal Type & Method Synchronization Across All Match Modals

- **Type**: Feature / UX Alignment / Design System Standardization
- **Summary**:
  1. **Synchronized Goal Types & Method Options**:
     - Exported standardized `GOAL_METHOD_OPTIONS` from [`goalUtils.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/utils/goalUtils.ts) covering the standard 8 methods:
       - Open Play (`open_play`)
       - Corner Kick (`corner`)
       - Direct Free Kick (`direct_free_kick`)
       - Indirect Free Kick (`indirect_free_kick`)
       - Penalty Kick (`penalty_kick`)
       - Throw-In (`throw_in`)
       - Header (`header`)
       - Volley (`volley`)
  2. **Standardized Goal Modals (Live Tracking, Game Manage & Game Summary)**:
     - **Game Management ([`GameManageClient.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/GameManageClient.tsx))**:
       - Replaced ad-hoc 5-option `<Select>` with the exact same UX as [`MajorEventModal.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/live/MajorEventModal.tsx):
         - `Standard Goal ⚽` vs `Own Goal ⚠️` toggle buttons
         - Own Goal explanation banner preventing incorrect player attribution
         - Interactive `GOAL_METHOD_OPTIONS` checkbox buttons with multi-select support
       - Replaced ad-hoc string formatting in the goal rows table with [`formatGoalTypesDisplay`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/utils/goalUtils.ts).
     - **Game Summary ([`GameSummaryClient.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/GameSummaryClient.tsx))**:
       - Added the matching `Standard Goal ⚽` vs `Own Goal ⚠️` toggle and `GOAL_METHOD_OPTIONS` buttons to the play-by-play Edit Goal modal.
     - **Live Tracking ([`MajorEventModal.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/live/MajorEventModal.tsx))**:
       - Imported `GOAL_METHOD_OPTIONS` directly from [`goalUtils.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/utils/goalUtils.ts) for single-source-of-truth consistency.
  3. **Testing & Verification**:
     - Added unit tests in [`goalUtils.test.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/utils/__tests__/goalUtils.test.ts) covering standard method export, parsing legacy/ad-hoc formats, JSON array string normalization, and UI presentation formatting.
     - `npx tsc --noEmit` passed with 0 errors.
     - All 24 Vitest test suites (91 tests) passed with 100% success.
- **Modified Files**:
  - `src/lib/utils/goalUtils.ts`
  - `src/components/game/live/MajorEventModal.tsx`
  - `src/components/game/GameManageClient.tsx`
  - `src/components/game/GameSummaryClient.tsx`
  - `src/lib/utils/__tests__/goalUtils.test.ts` (created)
  - `updates.md`

### [2026-10-10 12:02] MySQL Error 4025 (`json_valid(goal_types)`) Permanent Universal Resolution

- **Type**: Bug Fix / Database Integrity / API Hardening
- **Summary**:
  1. **Root Cause Analysis (MySQL Constraint 4025)**:
     - The table `game_events_goals` defines `` `goal_types` longtext DEFAULT NULL CHECK (json_valid(`goal_types`)) ``.
     - MySQL/MariaDB rejects raw strings (e.g., `'foot'`, `'open_play'`, or empty strings `''`) because `json_valid()` requires valid JSON syntax (such as `'["foot"]'` or `'["open_play"]'`). When unquoted or unstringified arrays were inserted, MySQL returned `Code: 4025. Message: CONSTRAINT game_events_goals.goal_types failed`.
  2. **Universal Normalizer Utility**:
     - Created [`normalizeGoalTypesJson`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/utils/goalUtils.ts), which converts any string, array, empty string, or undefined value into a valid, canonical JSON array string (e.g. `'["foot"]'`, `'["penalty_kick"]'`, `'["open_play"]'`).
  3. **Multi-Layer Defensive Implementation**:
     - **API Route Level**: In [`src/app/api/[tableName]/route.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/app/api/%5BtableName%5D/route.ts), added automatic normalization on both `POST` (unconditional default to valid JSON array) and `PUT` (normalizing `goal_types` if present), completely immunizing the database against invalid payloads from any client.
     - **Game Management Client**: In [`GameManageClient.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/GameManageClient.tsx), wrapped `goalPayload.goal_types` with `normalizeGoalTypesJson` and safely parsed stored `g.goal_types` on edit.
     - **Game Summary Client**: In [`GameSummaryClient.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/GameSummaryClient.tsx), wrapped `editGoalType` with `normalizeGoalTypesJson`.
     - **Quick Score Actions**: In [`quickScore-actions.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/actions/quickScore-actions.ts), ensured `goal_types` uses `normalizeGoalTypesJson` instead of raw string `'penalty_kick'`.
  4. **Validation & Dev Server Refresh**:
     - Verified with `npx tsc --noEmit` (0 errors) and all 23 Vitest test suites (87 tests) passing.
     - Dev server cleanly restarted on port 3000.
- **Modified Files**:
  - `src/lib/utils/goalUtils.ts` (created)
  - `src/app/api/[tableName]/route.ts`
  - `src/components/game/GameManageClient.tsx`
  - `src/components/game/GameSummaryClient.tsx`
  - `src/lib/actions/quickScore-actions.ts`
  - `updates.md`

### [2026-10-10 11:45] Manual Goal & Card Entry API Fix & Smart Match Clock Time Resolution

- **Type**: Bug Fix / Feature / UX Enhancement
- **Summary**:
  1. **Fixed Database Error on Manual Goal & Card Entry**:
     - In [`GameManageClient.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/GameManageClient.tsx), creating manual goal or card records failed with a MySQL error (`Unknown column 'game_id' in 'field list'`) because `game_id` was erroneously passed in `goalPayload` and `cardPayload`. `game_id` belongs only on `game_events_major`, while child tables `game_events_goals` and `game_events_discipline` link via `major_event_id`. Removed `game_id` from child payloads.
  2. **Smart Match Minute Resolution (Period Minute vs Cumulative Match Minute)**:
     - Implemented `resolveGameTimeSeconds` which seamlessly handles either input format:
       - If user enters the minute within the period (e.g. 15' into the 2nd half), it computes nominal preceding offset (e.g. 30' or 40' + 15' = 45' or 55').
       - If user enters the cumulative match minute (e.g. 45'), it detects that the input already exceeds preceding period offset and uses it directly.
       - Fixed substitution manual entry to also use `resolveGameTimeSeconds`.
  3. **Live Match Clock Preview Badges**:
     - Added real-time preview badges in Goal, Card, and Substitution manual modals showing:
       `Calculated Match Clock: 45' (2nd Half, 15:00)` along with helper text clarifying that both formats are accepted.
  4. **Testing**:
     - Added unit tests in [`gameManageTimeResolution.test.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/__tests__/gameManageTimeResolution.test.ts) covering 30-minute halves, 40-minute halves, period minute input, cumulative game minute input, and period 1 inputs.
     - Passed `npx tsc --noEmit` and all 23 vitest test files (87 tests) with zero errors.
- **Modified Files**:
  - `src/components/game/GameManageClient.tsx`
  - `src/components/game/__tests__/gameManageTimeResolution.test.ts`

### [2026-10-10 11:10] MajorEventModal React Hook Fix, Lineup Reconciliation Tool & Substitution Desync Resolution

- **Type**: Bug Fix / Feature / Roster Architecture
- **Summary**: Resolved two critical match tracking issues encountered during live gameplay:
  1. **MajorEventModal React Hook Violation Fixed**:
     - Fixed React error (`Rendered more hooks than during the previous render`) that crashed the modal when clicking "Record Major Event": `isSubWidgetExpanded` was defined after an early return (`if (!isOpen) return null`), violating React Rules of Hooks. Moved hook unconditionally to top level.
     - Fixed `replaceGoalEvent` and `replaceDisciplineEvent` in `MajorEventModal.tsx` to preserve all event fields (`scorer_player_game_id`, `team_season_id`, `is_own_goal`, `goal_types`, `card_type`, etc.) when server returns `{ success: true, id }`.
     - Verified with reproduction test `reproduce_major_event.test.tsx` passing with zero errors.
  2. **Lineup Reconciliation & Field/Bench Desync Fix ("⚡ Reconcile Lineup")**:
     - Built `LineupReconcileModal.tsx` and integrated it into `OnFieldPlayersPanel.tsx` with a quick-access header button.
     - Allows coaches to resolve roster discrepancies in one click (e.g., if a sub was missed, deleted, or tracking got inverted) by directly swapping on-field and bench players without having to stage inverted fake substitutions.
  3. **Substitution Queue Feedback & Race Conditions**:
     - Added interactive toast notifications with an immediate `"Enter Now"` action button when staging substitutions in `LiveGameTrackerClient.tsx`.
     - Updated `confirmAllPendingSubs` in `gameSubsStore.ts` to execute sequentially rather than concurrently (`Promise.all`), preventing state race conditions on `playersStore.players`.
     - Added `await` to `confirmAllPendingSubs` in `startNextPeriod` in `gameStore.ts`.
     - Enhanced Halftime / Intermission banner in `LiveGameTrackerClient.tsx` to display pending halftime subs with a 1-click execution button.
  4. **Game 923 Data Remediation**:
     - Fixed Game 923 records: created missing first-half substitution at 855s (Adelyne Wooten IN, Leighton Hurley OUT) and corrected Sub #1365 at 3683s to Leighton Hurley IN, Adelyne Wooten OUT.
     - Player playing times and on-field/bench shifts for Leighton Hurley and Adelyne Wooten are now 100% accurate and mathematically balanced.
  5. **Validation**:
     - All 22 vitest test suites (83 tests) and `npx tsc --noEmit` pass with zero errors.
- **Modified Files**:
  - `src/components/game/live/MajorEventModal.tsx`
  - `src/components/game/live/LineupReconcileModal.tsx`
  - `src/components/game/live/OnFieldPlayersPanel.tsx`
  - `src/components/game/LiveGameTrackerClient.tsx`
  - `src/stores/gameStore.ts`
  - `src/stores/gameSubsStore.ts`
  - `src/components/game/live/__tests__/LineupReconcileModal.test.tsx`
  - `src/components/game/live/__tests__/reproduce_major_event.test.tsx`

### [2026-10-10 07:54] Hierarchical League & Sub-Node Match Settings Inheritance & Tiebreaker Standard

- **Type**: Feature / Architecture & Rule Standard
- **Summary**: Implemented a comprehensive hierarchical match settings and rules structure across Leagues, Sub-Nodes (Divisions, Conferences, Districts, Age Groups), and Game Creation:
  1. **Tiebreaker Standard (Default Draw / No Shootout)**:
     - Established universal system default (`SYSTEM_DEFAULT_GAME_SETTINGS`) with `tiebreakerMode: "none"` and `hasShootout: false`. Regular games and league matches end in a tie by default unless explicitly configured otherwise by a tournament or node override.
     - Removed hardcoded `hasShootout: true` / PK shootout defaults across `game-actions.ts`, `GameSchedulerModal.tsx`, `gameStore.ts`, `GameSettingsEditor.tsx`, and `LeaguesStructureClient.tsx`.
  2. **Schema & Node Match Rules**:
     - Added `match_rules String? @db.Text` to `league_nodes` in `prisma/schema.prisma` and synchronized database schema via `prisma db push` and `prisma generate`.
     - Updated Zod validation schema `leagueNodeSchema` to support optional `matchRules`.
     - Added `matchRules` to `LeagueNode` in `queries.ts` and mapped it from `league_nodes.match_rules`.
  3. **Hierarchical Settings Resolver (`src/lib/utils/gameRules.ts`)**:
     - Built `resolveHierarchyGameSettings` which traverses `System Baseline -> League -> Ancestor Nodes -> Target Node` to compute the fully resolved match settings.
     - Built `safeParseMatchRules`, `mergeGameSettings`, and `inferRulesFromNodeName` (e.g. automatically discerning 9v9 with 30m halves for U11/U12, 7v7 with 25m halves for U9/U10, 11v11 40m for high school/NFHS).
  4. **League & Node Creation UI Defaults Display**:
     - **Create League Modal**: Displays the baseline match settings summary (11v11, 40m halves, tie by default, unlimited subs) and provides an accordion toggle allowing the user to customize competition match rules prior to creation.
     - **Create Node Modal**: Computes and displays the inherited match rules and source name, offers smart 1-click suggestions when age groups like U11/U12 are typed, and provides an expandable match rules override section to save custom node settings (e.g. 9v9, 30m halves, or knockout shootout rules).
  5. **League Structure Management (`LeaguesStructureClient.tsx`)**:
     - Upgraded Match Rules modal to handle both top-level Leagues and Sub-Nodes.
     - Added visual indicator badges showing whether a node is using custom rules or inheriting from parent.
     - Added `Reset to Inherited Rules` server action (`updateLeagueNodeMatchRules`) allowing users to easily discard node overrides and revert to parent rules.
     - Added quick hover action buttons (`Sliders` icon) on every node in the hierarchy explorer tree with amber highlighting for nodes containing custom overrides.
     - Added active match rules summary card in the selected node details panel.
  6. **Game Creation & Schedule Import Inheritance**:
     - In `GameSchedulerModal.tsx`, `gameRules` initializes to system defaults (regular tie), and when a primary competition node is selected, dynamically updates to the node's resolved settings.
     - In `createGame` (`game-actions.ts`), games created under a competition node automatically inherit the node's hierarchical match settings when custom settings are not explicitly passed.
     - In `batchImportSchedule` (`import-actions.ts`), imported fixtures automatically resolve the target division/league node rules and populate game period counts, durations, overtime, shootout, and notes settings.
  7. **Testing & Type Safety**:
     - Created unit test suite `gameRules.test.ts` covering system defaults, tiebreaker coherence, node name inference, and multi-level inheritance (TSSAA NFHS 11v11 40m regular season vs district tournament shootout; Collective Cup 11v11 35m vs U11/U12 9v9 30m vs playoff shootout).
     - Passed `npx tsc --noEmit` and all 20 test files (80 tests) in `npx vitest run` with zero errors.
- **Modified Files**:
  - `prisma/schema.prisma`
  - `src/types/game.ts`
  - `src/lib/utils/gameRules.ts`
  - `src/lib/utils/__tests__/gameRules.test.ts`
  - `src/lib/validations/schemas.ts`
  - `src/lib/data/queries.ts`
  - `src/lib/actions/league-actions.ts`
  - `src/lib/actions/leagueNode-actions.ts`
  - `src/lib/actions/game-actions.ts`
  - `src/lib/actions/import-actions.ts`
  - `src/components/admin/LeaguesStructureClient.tsx`
  - `src/components/dashboard/GameSchedulerModal.tsx`
  - `src/components/game/GameSettingsEditor.tsx`
  - `src/stores/gameStore.ts`
  - `updates.md`

### [2026-10-10 07:05] Fix Imported Match Schedule Date Parsing & Database Remediation

- **Type**: Bug Fix / Data Remediation & Importer Reliability
- **Summary**: Investigated and fixed date parsing issue where imported schedule fixtures defaulted to `1970-01-01` / `2026-01-01`:
  1. **Root Cause**: `parseGameDatesAndTimesUTC` in `dateTimeUtils.ts` only handled raw `YYYY-MM-DD` and `MM/DD/YYYY` numeric formats. When CSVs contained written/named dates (e.g. `"Saturday, October 10, 2026"` or `"Sunday, October 11, 2026"`), the parser failed to match 3-part dashes or slashes and silently fell back to default fallback numbers (`2026-01-01`), corrupting the match dates for all imported fixtures.
  2. **Enhanced Universal Date Parser**: Expanded `parseGameDatesAndTimesUTC` in `dateTimeUtils.ts` to support named month formats (e.g. `"Saturday, October 10, 2026"`, `"October 10, 2026"`, `"10 Oct 2026"`), cross-validating with standard JavaScript `Date` parsing as a fallback.
  3. **Batch Importer Client Normalization**: Updated `BatchImporterClient.tsx` in `parseScheduleText` to normalize parsed dates to clean `YYYY-MM-DD` strings during client-side mapping so the schedule preview table and payload to server reflect the true calendar dates immediately.
  4. **Database Remediation**: Re-parsed and corrected all 12 imported Collective Cup matches (Games `921` to `932`):
     - Games `921`–`927` updated to `2026-10-10` with their exact start times.
     - Games `928`–`932` updated to `2026-10-11` with their exact start times.
  5. **Unit Testing**: Added test coverage in `dualGameTime.test.ts` asserting exact parsing for named weekday/month strings (`Saturday, October 10, 2026` + `8:30 AM`), slash dates, and ISO dates. Passed with zero TypeScript errors and 75 passing unit tests.
- **Modified Files**:
  - `src/lib/utils/dateTimeUtils.ts`
  - `src/components/admin/BatchImporterClient.tsx`
  - `src/lib/utils/__tests__/dualGameTime.test.ts`
  - `updates.md`

### [2026-10-10 06:58] Resolve Missing Team Page Games for Imported Collective Cup Matches

- **Type**: Bug Fix / Data Remediation & Deduplication
- **Summary**: Investigated and resolved why Collective Cup games were showing in the tournament standings page but not appearing on the team page for `TSC U12 (2014/15) Williamson Girls Elite` (`/teams/121`):
  1. **Root Cause Identification**: During schedule CSV import, the CSV lacked an explicit gender column and defaulted to `MIXED`. In `batchImportSchedule`, team lookup previously searched with `where: { club_id, team_name, gender: "MIXED" }`. Because the existing team (`Team ID 61`, `TeamSeason ID 121`) had `gender: "FEMALE"`, the lookup failed to match and erroneously created a duplicate team (`Team ID 1735`) and new team season (`TeamSeason ID 3473`). The standings page calculated records using the division's games (displaying the team name), while the team page at `/teams/121` specifically filtered games by `teamSeasonId: 121`, missing the games attached to duplicate ID `3473`.
  2. **Data Remediation**: Migrated all 3 Collective Cup games (Games `923`, `926`, `929`) from duplicate `team_season_id: 3473` to existing `team_season_id: 121`. Migrated division enrollment (`ID 252`) to `team_season_id: 121`. Deleted orphan duplicate records (`team_seasons: 3473` and `teams: 1735`). All 3 tournament games now appear directly on the team page for `TSC U12 (2014/15) Williamson Girls Elite`.
  3. **Importer Deduplication Guard**: Updated `batchImportSchedule` and `batchImportTeams` in `import-actions.ts` to first attempt an exact match with gender if provided, and fall back to matching by `club_id` and `team_name` regardless of gender. This guarantees that importing schedules without gender columns will always match existing club teams rather than spawning duplicates. Verified with 0 TypeScript compilation errors and 73 passing unit tests.
- **Modified Files**:
  - `src/lib/actions/import-actions.ts`
  - `updates.md`

### [2026-10-10 06:52] Side Panel Season Select & Header Team Filtering/Navigation

- **Type**: Feature / UX Refinement
- **Summary**: Implemented Season Select in the side navigation panel and verified/refined season filtering and team navigation across both side panel and header:
  1. **Side Panel Season Selector**: Created `SidebarSeasonSelector.tsx` and integrated it into `NavBar.tsx` with a calendar icon and clean dropdown styling.
  2. **Season-Scoped Team & Club Filtering in Side Panel**: Teams displayed in `SidebarTeamSelector` are now strictly filtered to teams matching `selectedSeasonId`. When `selectedSeasonId` changes, `filteredClubsByType` also scopes available clubs to those with active teams in that season. If a selected club has no teams in a newly selected season, it resets smoothly without stranding the selector.
  3. **Empty & Single-Team State Handling**: Updated `SidebarTeamSelector.tsx` to display a graceful "No teams found" state instead of disappearing when a season has no teams, and made single-team cards clickable to navigate to that team from other pages.
  4. **Header Season & Team Filtering (`TeamSelector.tsx`)**:
     - Updated `filteredClubs` and `filteredSeasons` so selecting a season dynamically filters available clubs to clubs participating in that season, and selecting a club filters seasons.
     - Added selectable `"All Clubs"` and `"All Seasons"` options with `showPlaceholder={false}`, allowing users to un-filter at will.
     - Added transition handling (`useTransition`), optimistic loading overlay triggers via `useTeamLoadingStore`, and loading spinners on the Team select dropdown when selecting a team, providing instantaneous feedback while redirecting to `/teams/[teamSeasonId]`.
     - Safeguarded active team values so switching seasons resets team selection when the previously selected team does not belong to the newly chosen season.
  5. **Data Layer & Types**: Updated `nav.ts` with `Season` interface, and updated `useNavBarData.ts` to return seasons from `/api/teams-data`.
  6. **Testing**: Added unit test suite `SidebarSeasonSelector.test.tsx` verifying empty, single-season, and multi-season dropdown behaviors. Passed with zero TypeScript errors and 73 passing unit tests.
- **Modified Files**:
  - `src/types/nav.ts`
  - `src/hooks/useNavBarData.ts`
  - `src/components/layout/SidebarSeasonSelector.tsx`
  - `src/components/layout/SidebarTeamSelector.tsx`
  - `src/components/layout/ClubSelector.tsx`
  - `src/components/layout/NavBar.tsx`
  - `src/components/layout/TeamSelector.tsx`
  - `src/components/layout/__tests__/SidebarSeasonSelector.test.tsx`
  - `updates.md`

### [2026-10-10 06:36] Fix False-Positive Playoff Classification & Empty Club Placeholder Bug

- **Type**: Bug Fix / Batch Importer Accuracy
- **Summary**: Resolved false-positive playoff categorization where regular group play games were erroneously marked as playoff matches and prevented CSV uploads: (1) Fixed `isTbdOrSeedTeam` in `locationUtils.ts` which was returning `true` for empty or falsy strings (`!teamName`). When schedule CSVs lacked an explicit `Home Club` column, `rawHomeClub` (`""`) caused `isHomeTbd` to evaluate `true` across all rows, turning every regular game into `TBD vs TBD` and forcing `playoff` game types. (2) Removed `isTbdOrSeedTeam` checks on raw club strings in both `BatchImporterClient.tsx` and `import-actions.ts`, ensuring TBD detection strictly evaluates team names. (3) Added top-level `normalizeScheduleGameType` in `BatchImporterClient.tsx`, ensuring explicit CSV round indicators like `"Group Play"` accurately resolve to `"group_stage"` and are never overwritten as playoff games. (4) Enhanced `discernVenueAndField` to recognize Sports Complex / Park facilities (e.g. `"Sansom Sports Complex"`), automatically extracting sublocation fields (`"Hackney A"`, `"Hackney B"`, `"Katherine B 9v9"`, `"Sansom 3A"`, `"Sansom 3B"`). (5) Expanded unit tests in `tbdSeed.test.ts` to assert that empty strings and real team names return `false`. Verified with 0 TypeScript errors and 70 passing unit tests.
- **Modified Files**:
  - `src/lib/utils/locationUtils.ts`
  - `src/components/admin/BatchImporterClient.tsx`
  - `src/lib/actions/import-actions.ts`
  - `src/lib/utils/__tests__/tbdSeed.test.ts`
  - `updates.md`

### [2026-10-10 06:21] Club-Scoped Team Selection & Auto-Matching in Importer Wizard

- **Type**: Feature / Data Importer UX Refinement
- **Summary**: Updated `EntityMatchingWizardModal.tsx` and `BatchImporterClient.tsx` to scope unmatched team selection and fuzzy matching strictly to the club selected or resolved in Step 1 of the importer wizard: (1) Added `UnmatchedTeamItem` interface (`{ teamName, clubName }`) to maintain parent club context for each unmatched team. (2) Updated Step 2 (Teams) auto-matching logic to resolve the picked club from Step 1 (`createNew` vs `matchedId` vs existing DB club) and filter candidate teams to ONLY those belonging to that picked club. (3) If the club was selected as "+ Create New Club", the team automatically defaults to "+ Create New Team" and the team select dropdown ONLY lists "+ Create New Team" (preventing invalid assignment of new club teams to existing clubs). (4) If an existing club was selected, the team select dropdown strictly lists existing teams from that specific club only. (5) Added parent club status badge in Step 2 team rows. Verified with 0 TypeScript compilation errors and 70 passing unit tests.
- **Modified Files**:
  - `src/components/admin/importer/EntityMatchingWizardModal.tsx`
  - `src/components/admin/BatchImporterClient.tsx`
  - `updates.md`

### [2026-10-10 06:17] TBD Team Placeholder & Playoff Seed Matchup Auto-Detection

- **Type**: Feature / Data Importer Intelligence
- **Summary**: Enhanced `BatchImporterClient.tsx`, `locationUtils.ts`, and `import-actions.ts` to handle seed placeholder strings (e.g. `"[ Group A #1 Seed ]"`, `"Group A #2 Seed"`, `"Winner of Game 5"`) gracefully during schedule CSV imports: (1) Added `isTbdOrSeedTeam(name)` check to detect bracket/seed placeholders and standard `TBD`/`TBA`/`Bye` strings. (2) Standardized home and away team entries to `"TBD"` when seed placeholders are present, saving the original seed string (e.g. `"[ Group A #1 Seed ]"`) in raw placeholder variables. (3) Auto-detected playoff/final game types (`"playoff"`, `"final"`, `"semifinal"`, `"quarterfinal"`) when seeds or playoff keywords are detected. (4) Built matchup note string (`"Playoff Matchup: [ Group A #1 Seed ] vs [ Group A #2 Seed ]"`) and saved it into the game's `notes` field. (5) Excluded TBD placeholders from the Entity Matching Wizard (`handleExecuteImport`), avoiding bogus club/team prompts. (6) Updated Schedule preview table with styled TBD badges showing original raw placeholders, purple game type tags, and matchup notes column. (7) Updated `batchImportSchedule` server action to resolve or create a single standardized `TBD` club and team per season, and attach the matchup note to `prisma.games.create`. Verified with 0 TypeScript compilation errors and 70 passing unit tests.
- **Modified Files**:
  - `src/lib/utils/locationUtils.ts`
  - `src/components/admin/BatchImporterClient.tsx`
  - `src/lib/actions/import-actions.ts`
  - `src/lib/utils/__tests__/tbdSeed.test.ts`
  - `updates.md`

### [2026-10-10 06:06] Smart Combined Club/Team & Venue/Field Auto-Discernment

- **Type**: Feature / Data Importer Intelligence
- **Summary**: Enhanced `locationUtils.ts`, `BatchImporterClient.tsx`, and `import-actions.ts` with smart auto-discernment for combined Club/Team strings and combined Venue/Field strings: (1) Created `discernClubAndTeam(rawTeamName, rawClubName)` helper that automatically extracts `clubName` and `teamName` from delimited strings (e.g. `"Tennessee Soccer Club - U12 (2014/15) Williamson Girls Elite"`, `"One Knox Youth Club - U11G Yellow"`), or strips redundant club prefixes when separate club columns exist. (2) Integrated `discernClubAndTeam` into `parseScheduleText` (client-side) and `batchImportSchedule` (server-side action) to resolve or create missing `clubs` and `teams` entities automatically when schedule CSVs combine club and team names into a single column. (3) Verified smart venue and field sublocation discernment (`discernVenueAndField`) creates missing venues (e.g. `"Sansom Sports Complex Hackney"`) and fields (e.g. `"Hackney A"`, `"Hackney B"`) on demand. Verified with 0 TypeScript compilation errors and 68 passing unit tests.
- **Modified Files**:
  - `src/lib/utils/locationUtils.ts`
  - `src/components/admin/BatchImporterClient.tsx`
  - `src/lib/actions/import-actions.ts`
  - `updates.md`

### [2026-10-10 05:58] CSV Batch Importer Quoted Field Parsing & Reactive Mapping Fix

- **Type**: Bug Fix / Batch Importer Refinement
- **Summary**: Fixed two major issues in `BatchImporterClient.tsx`: (1) Built `parseCSVLine` helper to parse CSV rows respecting quotes and escaped characters. Previously, naive `.split(/,|\t/)` split date strings with internal commas (e.g. `"Saturday, October 10, 2026"`), which shifted column indices +2 and misassigned `Group Play` to Home Team and location field to Away Team. (2) Fixed column mapping reactivity by removing internal `autoMap` overrides inside `parseScheduleText`, `parseRosterText`, and `parseTeamsText`, ensuring manual UI dropdown mapping adjustments instantly update parsed records and the preview table. (3) Expanded Schedule Header Mapping Matrix UI with select dropdowns for all schedule fields (Date, Time, Home Team, Away Team, Location, Field, Play Type, Division Name, Home Club, Away Club) and added Location / Field column to the schedule preview table. Verified with 0 TypeScript compilation errors and 68 passing unit tests.
- **Modified Files**:
  - `src/components/admin/BatchImporterClient.tsx`
  - `updates.md`

### [2026-10-10 05:49] TSC U12 Elite, DC & LM Roster Jersey Number Updates

- **Type**: Data Refinement / Roster Synchronization
- **Summary**: Updated roster jersey numbers for all 29 players across the Tennessee Soccer Club (TSC) U12 rosters based on updated CSV input: (1) `U12 (2014/15) Williamson Girls Elite` (parent pool, TeamSeason ID `121`), (2) `U12 (2014/15) Williamson Girls Elite DC` (DC squad, TeamSeason ID `122`), and (3) `U12 (2014/15) Williamson Girls Elite LM` (LM squad, TeamSeason ID `125`). Built and executed `scripts/update_u12_jersey_numbers.ts` updating a total of 58 `player_teams` records across all 3 team seasons. Verified with zero compilation errors and 68 passing unit tests.
- **Modified Files**:
  - `scripts/update_u12_jersey_numbers.ts`
  - `updates.md`

### [2026-10-10 05:40] Global Dark Button High-Contrast Text Standard

- **Type**: Fix / UX & Theme Standardization
- **Summary**: Addressed dark text contrast bug on selected mode buttons ("Assign Existing" / "Create New") in `AddTeamCompetitionModal.tsx`. (1) Added `--color-primary-contrast` (`0 0% 100%` pure white) and `--color-secondary-contrast` to `:root` and `.dark` themes in `src/styles/theme.css`. (2) Extended `tailwind.config.ts` colors to include `primary-contrast` and `secondary-contrast`. (3) Added base/utility CSS rules in `src/styles/globals.css` ensuring all dark/primary background elements (`button.bg-primary`, `.bg-primary`, `button.bg-secondary`, `.bg-secondary`, `button.bg-accent`, `button.bg-danger`) default to high-contrast white text (`color: hsl(var(--color-primary-contrast))`) to permanently eliminate black text on dark background buttons. (4) Updated `Button.tsx` variants to explicitly consume `text-primary-contrast` and `text-secondary-contrast`. Verified with zero compilation errors and 68 passing unit tests.
- **Modified Files**:
  - `src/styles/theme.css`
  - `tailwind.config.ts`
  - `src/styles/globals.css`
  - `src/components/ui/Button.tsx`
  - `src/components/team/AddTeamCompetitionModal.tsx`
  - `updates.md`

### [2026-10-10 05:34] Team Competitions "+ Add Competition" Feature

- **Type**: Feature / UX Enhancement
- **Summary**: Added "+ Add Competition" button to the Competitions tab on the Team Page (`/teams/[teamSeasonId]`). Built `AddTeamCompetitionModal.tsx` allowing users to: (1) Assign and enroll the team into an existing competition node filtered to terminal leaf subnodes with full hierarchy breadcrumbs (`"League Name > Parent > Leaf Node"`). (2) Create a new League or Tournament inline (`name`, `abbreviation`, `isTournament`), auto-generate root league nodes, and enroll the team into `team_league_enrollments`. Built server actions `getTerminalCompetitionNodes`, `enrollTeamInCompetitionNode`, and `createAndEnrollCompetition` in `teamEnrollment-actions.ts`. Verified with 0 TypeScript compilation errors and 68 passing unit tests.
- **Modified Files**:
  - `src/components/team/TeamCompetitions.tsx`
  - `src/components/team/AddTeamCompetitionModal.tsx`
  - `src/components/team/TeamPageClient.tsx`
  - `src/lib/actions/teamEnrollment-actions.ts`
  - `todo.md`
  - `updates.md`

### [2026-10-10 05:26] Alternate Emails Schema Field & Person ID 17 Email Configuration

- **Type**: Schema Extension / Data Alignment
- **Summary**: (1) Audited `u676616277_hs_original.sql`: found legacy `people` table used a single `email` string column, with certain entries storing multiple comma-separated emails. (2) Added `alternate_emails Json?` field to `people` model in `prisma/schema.prisma` and updated MySQL database via `npx prisma db push`. (3) Updated Head Coach David Cordero de Jesus (`person_id: 17`) with primary email `decorde@yahoo.com` and alternate emails `["davidc3@wcs.edu", "decordecoach@gmail.com"]`. (4) Built and executed `scripts/update_person17_emails.ts` and updated `scripts/migrate_independence_seasons.ts` to automatically parse and split legacy multi-email strings into primary and alternate email JSON arrays. Verified with 0 TypeScript compilation errors and 68 passing unit tests.
- **Modified Files**:
  - `prisma/schema.prisma`
  - `scripts/update_person17_emails.ts`
  - `scripts/migrate_independence_seasons.ts`
  - `todo.md`
  - `updates.md`

### [2026-10-10 05:22] Imported Staff Deactivation & Head Coach Admin Assignments

- **Type**: Data Refinement / Permission Alignment
- **Summary**: Applied user directives for staff activation and administrator roles: (1) Set `is_active: false` across all 24 imported legacy `club_staff` records (Athletic Directors, Principals, Assistant Principals) for Independence High School. (2) Updated `scripts/migrate_independence_seasons.ts` to insert imported club staff as inactive by default. (3) Assigned full active Club Staff Admin (`is_active: true`, `role: club_admin`, `access_level: club_admin`) to Head Coach David Cordero de Jesus (`person_id: 17`) for both **Independence High School** (`club_id: 25`) and **Tennessee Soccer Club** (`club_id: 1`). (4) Verified system admin authorization (`system_admin: true`) on linked user account for `person_id: 17`. Verified with zero compilation errors and 68 passing unit tests.
- **Modified Files**:
  - `scripts/migrate_independence_seasons.ts`
  - `scripts/update_staff_permissions.ts`
  - `todo.md`
  - `updates.md`

### [2026-10-10 05:12] Downs East/West & Bethesda Location Consolidation

- **Type**: Data Refinement / Schema Integrity
- **Summary**: Applied user directives for location and sublocation formatting: (1) Standardized WCSC Downs fields (Fields 1-20 formatted as `Downs East #N`, Fields 21-27 formatted as `Downs West #N`), consolidating sublocations `Downs East #1`, `Downs East #7`, `Downs East #11`, `Downs East #18`, `Downs East #19`, `Downs West #22`, `Downs West #24`, `Downs West #25`, `Downs West #26`. (2) Consolidated `Bethesda Sports Park` and `Bethesda Recreation Park` into a single location `Bethesda Recreation Park` (`ID 36`) with sublocations `Field #3` and `Field #4`. Re-pointed all games and club links cleanly with zero compilation errors and 68 passing unit tests.
- **Modified Files**:
  - `scripts/fix_downs_and_bethesda.ts`
  - `todo.md`
  - `updates.md`

### [2026-10-10 04:55] Location & Sublocation Consolidation

- **Type**: Data Refinement / Schema Integrity
- **Summary**: Identified location entries where field/sublocation details (e.g., `WCSC Downs East #18`, `WCSC Downs East #7`, `Bethesda #3`, `Kate Campbell Park #1`, `MBLP Watt Rd`) were created as full standalone locations. Built and executed `scripts/consolidate_locations.ts` to merge redundant locations into single parent venues (`Williamson County Soccer Complex (WCSC Downs)`, `Bethesda Recreation Park`, `Kate Campbell Park`, `Major Bob Leonard Park`, `Richard Siegel Soccer Complex`, `Ridley Sports Complex`, `Pope Saint John Paul II Preparatory School`), creating/moving sublocations (`Downs East #18`, `Field #3`, `Field #4`, etc.) under master location IDs, and re-pointing all foreign keys (`games.location_id`, `games.sublocation_id`, `clubs.location_id`) cleanly before deleting redundant location records. Verified with 0 TypeScript compilation errors and 68 passing unit tests.
- **Modified Files**:
  - `scripts/consolidate_locations.ts`
  - `todo.md`
  - `updates.md`

### [2026-10-10 04:45] Legacy People Column Mapping Fix & Database Cleanup

- **Type**: Bug Fix / Data Alignment
- **Summary**: Identified column index offset in `scripts/migrate_independence_seasons.ts` when parsing legacy `people` tuples (`[2]` title, `[3]` firstName, `[4]` lastName, `[5]` email, `[6]` cellNumber, `[7]` otherLastName, `[8]` nickName, `[10]` dateOfBirth, `[11]` gender). Fixed index assignments in migration logic, added DOB and normalized gender extraction, and executed bulk cleanup script (`fix_people_data.ts`) over 794 database `people` records using chunked transactions. Verified email, phone, nickname, gender, and birth date assignments across database records with zero compilation errors and 68 passing unit tests.
- **Modified Files**:
  - `scripts/migrate_independence_seasons.ts`
  - `scratch/fix_people_data.ts`
  - `scratch/inspect_db_people_after_fix.ts`
  - `updates.md`

### [2026-10-09 12:20] Independence High School Seasons & Staff Migration

- **Type**: Data Migration / Feature Integration
- **Summary**: Applied Prisma schema updates (`npx prisma db push`) to synchronize `awards` model, `club_staff` (`title`, `access_level`), and `team_staff` (`title`, `access_level`). Built and executed `scripts/migrate_independence_seasons.ts` to parse all 22 historical seasons (`2004-2005` through `2025-2026`) for Independence High School (Club ID 25) from `u676616277_hs_original.sql`. Successfully created 22 `seasons`, 52 squad `team_seasons` (Varsity Girls, JV Girls, JV Gold Girls, JV Navy Girls), 794 `people` records, 210 `team_staff` assignments (Head Coaches, Assistant Coaches, Athletic Trainers, Student Managers), and 24 `club_staff` administrative roles (Principals, Athletic Directors, Assistant Principals). Verified with zero TypeScript compilation errors and 68 passing unit tests.
- **Modified Files**:
  - `prisma/schema.prisma`
  - `scripts/migrate_independence_seasons.ts`
  - `todo.md`
  - `updates.md`

### [2026-10-09 09:16] Awards Model & Granular Staff Role Architecture

- **Type**: Feature / Architecture Extension
- **Summary**: Added `awards` model, `award_category` enum, and `award_scope` enum to `schema.prisma` to track team, district, region, state, and national awards (e.g. Most Improved, All-District, All-American). Enhanced `club_staff` and `team_staff` models with custom `title` and `access_level` fields, separating real-world job titles (Athletic Director, ECNL Director, Athletic Trainer, Student Manager, Treasurer) from system authorization groups (`club_admin`, `team_admin`, `coach`, `trainer`). Regenerated Prisma Client (`npx prisma generate`) and updated `todo.md`.
- **Modified Files**:
  - `prisma/schema.prisma`
  - `src/generated/client/*`
  - `todo.md`
  - `updates.md`

### [2026-10-08 16:45] High School Team Seasons Generation & Sidebar Filtering Fix

- **Type**: Bug Fix / Data Alignment
- **Summary**: Identified that legacy high school teams created in `teams` lacked `team_seasons` links, causing `getAccessibleClubs` in `NavBar.tsx` to filter out all high schools from the sidebar. Executed bulk creation of 3,268 `team_seasons` entries for all high school teams across active seasons. Sidebar selectors (`ClubTypeSelector`, `ClubSelector`, `SidebarTeamSelector`) now display and filter all 400+ high school clubs and teams seamlessly alongside club travel teams.
- **Modified Files**:
  - `scripts/import_locations_and_schools.ts`
  - `src/components/layout/NavBar.tsx`
  - `updates.md`

### [2026-10-08 16:41] Club vs High School Selectors in Header & Sidebar

- **Type**: Feature / UX Enhancement
- **Summary**: Added Program Type / Category selectors ("All Types", "Club", "High School") to both the Header (`TeamSelector.tsx`) and Sidebar (`NavBar.tsx` / `ClubTypeSelector.tsx`). Updated `/api/teams-data` API endpoint and `nav.ts` types to expose club `type` and `clubType`. Dynamically filters available clubs and teams based on selected program category with automatic URL team context synchronization.
- **Modified Files**:
  - `src/app/api/teams-data/route.ts`
  - `src/types/nav.ts`
  - `src/components/layout/ClubTypeSelector.tsx`
  - `src/components/layout/TeamSelector.tsx`
  - `src/components/layout/NavBar.tsx`
  - `updates.md`

### [2026-10-08 16:36] Legacy Addresses, Locations, Sublocations & High School Clubs Import

- **Type**: Feature / Data Migration
- **Summary**: Built and executed `scripts/import_locations_and_schools.ts` to parse all `addresses`, `locations`, and `schools` from `u676616277_hs_original.sql`. Deduplicated entities case-insensitively against existing database records: 435 legacy addresses processed (397 matched, 38 created), 399 venue locations matched and linked to address records, 400 default field sublocations established, 439 high schools imported into `clubs` (`type: high_school`, 34 matched existing, 405 created), and 1,632 default Varsity/JV teams created across high school programs.
- **Modified Files**:
  - `scripts/import_locations_and_schools.ts`
  - `todo.md`
  - `updates.md`

### [2026-10-08 16:27] Seeded TSSAA Governing Body & Complete Node Hierarchy

- **Type**: Feature / Data Seeding
- **Summary**: Created `src/lib/actions/tssaa-league-builder.ts` and seeded the **TSSAA** Governing Body, League ("TSSAA High School Soccer"), Division (Division I / Division II), Gender (Girls Soccer / Boys Soccer), Class (Class AAA, AA, A), Region, District (District 11-AAA), Sub-District, and Postseason Tournament nodes into the database with high school match rules (40 min halves, `ot_if_tied = false`). Updated `todo.md` and `MIGRATION_PLAN.md`.
- **Modified Files**:
  - `src/lib/actions/tssaa-league-builder.ts`
  - `MIGRATION_PLAN.md`
  - `todo.md`
  - `updates.md`

### [2026-10-08 16:11] Clarified Call-Up Roster Dressed Status Rule

- **Type**: Architecture Refinement / Documentation
- **Summary**: Updated `MIGRATION_PLAN.md` and `todo.md` section 2.3 clarifying that JV/JV2 call-ups are members of the overarching program roster pool who default to `game_status = 'not_dressed'` for Varsity matches. When brought up for a Varsity game, their status is toggled to `dressed` without marking `is_guest = true` (reserving `is_guest` strictly for true external guests outside the program).
- **Modified Files**:
  - `MIGRATION_PLAN.md`
  - `todo.md`
  - `updates.md`

### [2026-10-08 15:00] Refined 25 Table Migration Plan & Program Pool Architecture

- **Type**: Feature Planning / Documentation
- **Summary**: Updated `MIGRATION_PLAN.md` with an exhaustive 25 table audit of `u676616277_hs_original.sql`. Documented business architecture for Independence High School program context, TSSAA Class/Region/District leaf hierarchy mapping, and `squad_level` (`Varsity`, `JV`, `JV2`, `DC`, `LM`) design for season roster pools with dual-duty floating players. Updated Step 29 in `todo.md`.
- **Modified Files**:
  - `MIGRATION_PLAN.md`
  - `todo.md`
  - `updates.md`

### [2026-10-08 14:24] Roadmap Extension & Audit: Step 29 for Legacy High School DB Migration

- **Type**: Feature Planning / Documentation
- **Summary**: Parsed and audited `u676616277_hs_original.sql` (25 tables). Created `MIGRATION_PLAN.md` with table-by-table & column-by-column schema transformation rules (gender normalization, UTC date/time handling, goal type JSON serialization, foreign key re-mapping). Appended Step 29 to `todo.md`.
- **Modified Files**:
  - `MIGRATION_PLAN.md`
  - `todo.md`
  - `updates.md`

### [2026-10-08 14:16] Fixed SSR/Client Date Formatting Hydration Error

- **Type**: Bug Fix
- **Summary**: Resolved Next.js React hydration mismatch warning on `Header.tsx` / `Logo.tsx` by using `useEffect` client state mounting for `formattedDate` and adding `suppressHydrationWarning` to the date display element.
- **Modified Files**:
  - `src/components/layout/Header.tsx`
  - `src/components/layout/Logo.tsx`
  - `updates.md`

### [2026-10-08 14:11] Synced Database Schema & Added `prisma:generate` Script

- **Type**: Fix / Configuration
- **Summary**: Executed `npx prisma db push` to synchronize remote MySQL database `u676616277_stats_app` with Step 26 schema columns (`require_photo_review` on `team_seasons`, `photo_url`, `photo_status`, `photo_rejection_reason` on `people`, and `instructions`, `action_url`, `action_label` on `custom_field_definitions`). Added `"prisma:generate": "prisma generate"` and `"prisma:push": "prisma db push"` scripts to `package.json`.
- **Modified Files**:
  - `package.json`
  - `updates.md`

### [2026-10-08 14:11] Past Matches Styling & Mobile Schedule Responsiveness Audit

- **Type**: Bug Fix / UX Refactor
- **Summary**: Removed harsh `bg-surface/40` transparency and `opacity-85` darkening on past games in `TeamSchedule.tsx`, switching past match cards to standard high-contrast `bg-surface` with `opacity-100` while preserving subtle result borders. Re-architected the schedule & venue panel layout into a flex-column layout with wrap support for mobile screens. Updated `todo.md` and `todo2.md` to confirm completion of Step 23.2.
- **Modified Files**:
  - `src/components/team/TeamSchedule.tsx`
  - `todo.md`
  - `todo2.md`
  - `updates.md`

### [2026-10-08 13:26] Roadmap Extension: Step 28 for Dynamic League Rules & Competition Game Defaults

- **Type**: Feature Planning / Documentation
- **Summary**: Added Step 28 to `todo.md` defining the architectural plan for configurable league game rules (11v11, 9v9, 7v7, half durations), automatic rule pre-population on game creation when attached to competition nodes, and enforcing `ot_if_tied = false` as the default for new games.
- **Modified Files**:
  - `todo.md`
  - `updates.md`

### [2026-10-08 13:18] Built Flattened Goal Log & Game Summary Analytics Service

- **Type**: Feature
- **Summary**: Created `src/lib/services/stats-service.ts` with `getFlattenedGoalLog` and `getFlattenedGameSummaries`. Implemented automatic Game-Winning Goal (GWG) detection (`(OpponentScore + 1)`-th goal in victories), game context classification (Opening Goal, Equalizer, Go-Ahead, Insurance Goal), and multi-dimension filtering.
- **Modified Files**:
  - `src/lib/services/stats-service.ts`
  - `todo.md`
  - `updates.md`

### [2026-10-08 13:17] Roadmap Extension: Step 27 for Flattened Goal/Game Analytics Engine & GWG

- **Type**: Feature Planning / Documentation
- **Summary**: Added Step 27 to `todo.md` defining the architectural plan for flattened Goal Log (`getFlattenedGoalLog`) and Game Summary (`getFlattenedGameSummaries`) analytics services, including Game-Winning Goal (GWG) calculation, on-field +/- player tracking, and ultimate stats hub UI.
- **Modified Files**:
  - `todo.md`
  - `updates.md`

### [2026-10-08 08:47] Implemented Step 26: Task Directions/Links & Profile Picture Review System

- **Type**: Feature
- **Summary**: Implemented task completion directions/instructions text and external action link buttons for custom requirement definitions. Created `photo-actions.ts` server actions and built the interactive Roster Headshot Review Hub with upload, 1-click admin approval/rejection feedback, and automated requirement checklist synchronization.
- **Modified Files**:
  - `prisma/schema.prisma`
  - `src/lib/actions/customFields-actions.ts`
  - `src/lib/actions/photo-actions.ts`
  - `src/components/team/TeamRequirements.tsx`
  - `src/lib/data/queries.ts`
  - `todo.md`
  - `updates.md`

### [2026-10-08 08:29] Roadmap Extension: Step 26 for Task Instructions & Headshot Review

- **Type**: Feature Planning / Documentation
- **Summary**: Added Step 26 to `todo.md` detailing the architectural breakdown and implementation plan for player task directions/action links and the profile photo upload & approval workflow.
- **Modified Files**:
  - `todo.md`
  - `updates.md`

### [2026-10-08 08:22] Initialized `updates.md` & AI Auto-Logging Rule

- **Type**: Configuration / Documentation
- **Summary**: Initialized `updates.md` tracking log and added mandatory update rule #13 to `AGENTS.md` so that the AI automatically appends change logs whenever code is modified.
- **Modified Files**:
  - `updates.md`
  - `AGENTS.md`
