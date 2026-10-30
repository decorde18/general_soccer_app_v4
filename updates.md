### [2026-10-29 12:00] Clock Actions Disable State, Halftime Sub Eligibility, Game Scheduler Prefill Guards, PK Goal Recording Fix & Match Shift Durations Tab
- **Type**: Bug Fix / Feature / UX Resilience
- **Summary**:
  1. **Clock Action Button Disabled & Spinner State (`BroadcastScoreboard.tsx`)**:
     - Added `isClockActionPending` state and wrapped period clock toggling (`handleClockButtonClick`) in try/finally to prevent duplicate clicks.
     - Disables button and displays inline spinner (`<Loader2 className="animate-spin" />`) with dynamic label (`"Updating..."` / `"Ending Period..."`) during clock changes (Start Match, Start/End Period, Resume Clock).
  2. **Exhausted Subs Not Carrying Over to Halftime (`subRules.ts`, `LivePlayerTable.tsx`, `MajorEventModal.tsx`)**:
     - Updated sub eligibility checking to recognize period breaks (`isPeriodBreak`). Break/halftime substitutions are exempt from sub window limits per half and game.
     - When at halftime (`storeStage === GAME_STAGES.BETWEEN_PERIODS`), sub eligibility is evaluated for the upcoming period (`currentPeriodIndex + 2`), ensuring players who subbed out in Period 1 under `one_per_half` or NCAA rules are not marked "Exhausted" and can be queued for the second half.
  3. **Game Scheduler Primary Team Prefilling Guard (`GameSchedulerModal.tsx`)**:
     - Added `isLoadingOptions` and `isPrefillingDefaults` (`isPrefillingPrimaryTeam`) state to track initial data load and asynchronous latest game defaults resolution.
     - Disables Primary Team dropdown, tab switching, and Next Step / Schedule Match buttons while defaults are prefilling, showing an inline pulsating loader (`"Prefilling team defaults..."`) to prevent race conditions.
  4. **Penalty Kick Goal Direct Recording & Infinite Spinner Fix (`MajorEventModal.tsx`)**:
     - Resolved the bug where selecting Penalty Kick Result = `"goal"` previously redirected to the Goal form with an un-reset `isSubmitting: true` flag, locking the form into an infinite spinning state.
     - `handlePkSubmit` now directly logs both the penalty kick and goal event (optimistically updating match score and stores, and persisting to `/api/game_events_major`, `/api/game_events_goals`, and `/api/game_events_penalties`), immediately closing the modal with zero UI delay.
  5. **Game Summary Shift Durations & Stints Tab (`PlayerShiftsTab.tsx`, `GameSummaryClient.tsx`)**:
     - Added a dedicated 4th tab to Game Summary: **"Shift Durations & Stints"**.
     - Features team-wide KPI cards (players used, total shifts, avg shift length, longest shift), role & player search filters, and an interactive **Moment-in-Time Match Clock Inspector** slider showing exact on-field and bench lineups with current stint/rest times at any chosen second.
     - Renders an interactive visual Gantt timeline track per player with period markers, plus an expandable chronological breakdown of every on-field shift and bench recovery stint with exact start/end clocks and durations.
- **Modified Files**:
  - `src/components/game/live/BroadcastScoreboard.tsx`
  - `src/lib/utils/subRules.ts`
  - `src/components/game/live/LivePlayerTable.tsx`
  - `src/components/game/live/MajorEventModal.tsx`
  - `src/components/dashboard/GameSchedulerModal.tsx`
  - `src/components/game/PlayerShiftsTab.tsx`
  - `src/components/game/GameSummaryClient.tsx`
  - `src/lib/utils/__tests__/subRules.test.ts`
  - `updates.md`

### [2026-10-24 08:10] Substitution Windows Tracking, Batch Sync & Limit Restriction Enforcement
- **Type**: Bug Fix / Feature / UX Resilience
- **Summary**:
  1. **Sub Windows Real-Time Tracking & Game Store Synchronization (`gameSubsStore.ts`)**:
     - Resolved the core bug where confirmed substitutions (`confirmSub` and `confirmAllPendingSubs`) never populated or updated `gameStore.game.gameSubs`.
     - `confirmSub` now synchronously updates both `gameStore.game.pendingSubs` and `gameStore.game.gameSubs`, ensuring that `BenchReservesPanel` and `LivePlayerTable` instantly recalculate `calculateSubWindowsUsed` for the game and half.
  2. **Batch "Enter All" Single-Window Consolidation (`gameSubsStore.ts`, `subRules.ts`)**:
     - `confirmAllPendingSubs` now unifies pending substitutions with a single shared timestamp (`batchTime`) and period (`batchPeriod`) across the batch.
     - `calculateSubWindowsUsed` groups substitutions occurring at the exact same timestamp or within a 15-second stoppage window into a single substitution window (occasion), adhering to soccer rules.
  3. **Halftime & Period Break Exclusion (`gameSubsStore.ts`, `gameStore.ts`, `subRules.ts`)**:
     - Substitutions made during inter-period breaks, before match start, or auto-entered at period kickoff are flagged with `is_halftime` / `is_break`.
     - `calculateSubWindowsUsed` excludes these break substitutions so they never consume in-play substitution windows per half or game.
  4. **Strict Enforcement & UI Safeguards when Max Windows Reached (`UpcomingSubsPanel.tsx`, `BenchReservesPanel.tsx`, `gameSubsStore.ts`)**:
     - When `maxSubWindowsPerHalf` or `maxSubWindowsPerGame` limits are reached:
       - `UpcomingSubsPanel` disables the "Enter" and "Enter All" buttons with clear disabled states and displays a pulsating `Max Windows Reached` badge.
       - `confirmSub` and `confirmAllPendingSubs` reject additional window creation and notify via toast error.
       - `LivePlayerTable` marks bench players as "Exhausted" with reasons (e.g. `Max Sub Windows Reached for Half (X/Y Used)`), blocking quick-tap selection without ref override.
       - `BenchReservesPanel` displays windows used whenever limits are configured or windows have been used (`Windows: X/Y G • A/B H`), pulsing red when maxed out.
  5. **Dynamic Rollback on Sub Deletion / Cancellation (`gameSubsStore.ts`)**:
     - `cancelSub` removes deleted substitutions from `gameStore.game.gameSubs`, decrementing windows used dynamically.
- **Modified Files**:
  - `src/stores/gameSubsStore.ts`
  - `src/stores/gameStore.ts`
  - `src/lib/utils/subRules.ts`
  - `src/components/game/live/UpcomingSubsPanel.tsx`
  - `src/components/game/live/BenchReservesPanel.tsx`
  - `src/lib/utils/__tests__/subRules.test.ts`
  - `updates.md`

### [2026-10-19 13:40] Early Period End Confirmation Prompt & Ended Games Pending Subs Deletion
- **Type**: Feature / UX Safeguard / Data Integrity
- **Summary**:
  1. **Early Period End Confirmation Prompt (`BroadcastScoreboard.tsx`)**:
     - Added an "Are you sure?" confirmation prompt dialog (`<Dialog type="confirm">`) when the user clicks to end a period prior to the scheduled period duration (handles both regular periods and overtime periods).
     - Displays the scheduled duration vs elapsed period time, with action disabling and loading indicators during submission.
  2. **Pending Substitutions Deletion When Game Ends & Purge from Ended Games**:
     - **Game Stores (`gameStore.ts`, `gameSubsStore.ts`, `gamePlayersStore.ts`)**:
       - Added `clearAllPendingSubs` to `useGameSubsStore` that optimistically purges pending substitutions, resets player `subStatus` to `null`, and triggers deletion on backend.
       - Wired `clearAllPendingSubs` into `endGame()`, `syncGameStatus()` (when transition to `"completed"` occurs), and `initializeGame()`.
       - Filtered out pending substitutions when loading completed matches in `gamePlayersStore.ts` and `gameStore.ts`.
     - **API & Server Actions (`route.ts`, `fetcher.ts`, `game-actions.ts`, `quickScore-actions.ts`)**:
       - Added server action `deletePendingSubsFromEndedGames(targetGameId?)`.
       - Updated `api/[tableName]/route.ts` so `PUT` with `status: "completed"` and `DELETE` with `clean_completed=true` or `pending=true` purge unconfirmed pending substitutions (`sub_time IS NULL`) from completed games.
       - Fixed `apiFetch` in `fetcher.ts` to preserve and forward all query parameters when table query strings are passed.
- **Modified Files**:
  - `src/components/game/live/BroadcastScoreboard.tsx`
  - `src/components/game/live/__tests__/BroadcastScoreboard.test.tsx`
  - `src/app/api/[tableName]/route.ts`
  - `src/app/api/fetcher.ts`
  - `src/lib/actions/game-actions.ts`
  - `src/lib/actions/quickScore-actions.ts`
  - `src/stores/gameStore.ts`
  - `src/stores/gameSubsStore.ts`
  - `src/stores/gamePlayersStore.ts`
  - `updates.md`

### [2026-10-19 13:20] Live Match Player Times, Major Event Duration, Optimistic Controls & Bulk Substitution Edits
- **Type**: Bug Fix / Feature / UX Resilience
- **Summary**:
  1. **Fixed Shift Time 0:00 Reset on Pending Subs (`dateTimeUtils.ts`)**:
     - Resolved root cause where pending substitutions with `null` `gameTime` / `sub_time` fell back to `0` in `calculateActivePlayerTimeOnField`, terminating the starter's on-field shift at second 0.
     - Added `extractConfirmedSubTime` to safely ignore unconfirmed/pending substitutions, preserving active shift time until a sub is executed.
  2. **Accurate Major Event Duration Calculation (`MajorEventModal.tsx`)**:
     - Streamlined event duration display to strictly calculate `currentMatchSecs - eventStaticGameTime` when the clock is running, and preserve stoppage elapsed seconds when the clock is paused.
  3. **Event Modal Closure & Duplicate Submit Prevention (`MajorEventModal.tsx`)**:
     - Added re-entrancy and submission guards (`isSubmitting`) across all event submissions (Goal, Card, Penalty, Stoppage).
     - Removed blocking `showPendingSubPrompt` flow that hijacked the modal and left it open after goal recording.
     - Automatically disables action buttons with inline loading spinners to prevent duplicate goal submissions.
  4. **Optimistic Deletions & Button Disabling in Manual Stats Entry (`GameManageClient.tsx`, `Dialog.tsx`)**:
     - Updated deletion confirmations to optimistically remove records from UI state immediately with zero lag.
     - Added `disabled={isPending}` states and `isLoading` spinner support to Dialog confirmation actions and management buttons.
  5. **Deterministic Player Box Sorting Stability (`LivePlayerTable.tsx`)**:
     - Replaced non-unique keying with stable player ID keys (`pg-[playerGameId]`).
     - Added secondary tiebreakers (jersey number, name, ID) so sorting doesn't shift rows erratically or scramble live times.
     - Removed in-render store mutations during sort rendering.
  6. **Bulk Substitution Time Modification (`GameManageClient.tsx`)**:
     - Added a dedicated "Bulk Change Time" modal allowing coaches to select multiple substitutions and batch-update their period, minute, and second timestamps in a single action.
     - Added an inline "Select All at this Time" shortcut to quickly group substitutions executed at the same timestamp.
- **Modified Files**:
  - `src/lib/utils/dateTimeUtils.ts`
  - `src/components/game/live/MajorEventModal.tsx`
  - `src/components/game/live/LivePlayerTable.tsx`
  - `src/components/ui/Dialog.tsx`
  - `src/components/game/GameManageClient.tsx`
  - `updates.md`

### [2026-10-17 08:50] Bulk Schedule Importer Entity Resolution & Subnode Input Readability Fix
- **Type**: Bug Fix / Data Integrity / UX Architecture
- **Summary**:
  1. **Step 1 Club Creation & Defaults in Entity Matching Wizard (`EntityMatchingWizardModal.tsx`)**:
     - Fixed Step 1 where unrecognized clubs defaulted to `-- Select Existing Club --` without prominent "Create New Club" visibility.
     - Unrecognized clubs now default automatically to `+ Create New Club "{club}"` with an inline editable name field and a prominent `+ Create New Club` badge.
     - Added inline creation during Step 1 transition: When clicking "Next: Match Teams", all pending new clubs are created immediately in the database via `createInlineClub`.
     - The newly created clubs and their generated database IDs are persisted into `clubsList` and `mappings` before advancing to Step 2.
  2. **Step 2 Team-to-Club Linkage Enforcement**:
     - Teams in Step 2 are now strictly bound and scoped to the club resolved or created in Step 1 (`targetClubId`, `targetClubName`).
     - The team card and dropdown explicitly display the target club (`Club: [Club Name] (✓ Ready in Database)`), and the dropdown defaults to `+ Create New Team "{teamName}" in [Club Name]`.
     - Resolved mappings attach both `clubId` and `clubName` to each team item.
  3. **Backend Importer Safeguards (`src/lib/actions/import-actions.ts`)**:
     - Updated `batchImportSchedule` to honor `clubId` passed directly from team mappings.
     - Multi-key candidate resolution for home and away clubs ensures clubs are never null or blank, preventing orphaned teams or teams created with empty club names.
  4. **Subnode Input Box Styling Fix (`src/components/admin/BatchImporterClient.tsx`)**:
     - Fixed the division subnode creation text input which rendered white text on a white background ("light on light").
     - Applied dark background and border tokens (`bg-slate-950 text-white border-slate-700 placeholder:text-slate-500`) to ensure high contrast and readability.
  5. **Unit Tests Added (`src/lib/actions/__tests__/importEntityResolution.test.ts`)**:
     - Added comprehensive unit tests validating `discernClubAndTeam` extraction across delimiters, prefix stripping, and team-club linkage preservation.
- **Modified Files**:
  - `src/components/admin/BatchImporterClient.tsx`
  - `src/components/admin/importer/EntityMatchingWizardModal.tsx`
  - `src/lib/actions/import-actions.ts`
  - `src/lib/actions/__tests__/importEntityResolution.test.ts`
  - `updates.md`

### [2026-10-17 08:10] Veo Match Video Link Integration, Tournament Stats Hierarchy Resolution & Sidepanel Defaults
- **Type**: Feature / Bug Fix / UX Architecture
- **Summary**:
  1. **Veo Match Video Link Integration**:
     - Added `videoLink` support to `CreateGameData`, `createGame`, `updateGame`, and `getGameEditDetailsAction` in `src/lib/actions/game-actions.ts`.
     - Integrated a modern "Veo / Match Video Link" field into `GameEditModal.tsx` (`src/components/dashboard/GameEditModal.tsx`) with real-time video link persistence.
     - Added a dedicated "Veo" watch button with video icon on match cards in `src/components/team/TeamSchedule.tsx` linking directly to external match footage.
  2. **Tournament & Competition Stats Hierarchy Resolution**:
     - Fixed `getComprehensivePlayerStats` in `src/lib/data/queries.ts` where filtering by a competition/tournament node only matched an isolated `league_node_season_id`.
     - Expanded `getComprehensivePlayerStats` to resolve the full competition tree (parent category, child brackets/flights, and all node seasons under the competition's `league_id`), and match across both `league_node_id` and `league_node_seasons.id` as well as `game_standings_inclusions`.
     - Updated `TeamStatsProps` in `src/components/team/TeamStats.tsx` with optional `leagueId` support.
  3. **Sidebar Dropdown Defaults (Program Type "club", Active Season, Last Used)**:
     - Updated `NavBar.tsx` and `useSelectedClub.ts` to default Program Type to `"club"` and current active season (`status === "active"`), while persisting user selections in `localStorage` across page navigations.
     - Updated `api/teams-data/route.ts` and `types/nav.ts` to provide `status`, `start_date`, and `end_date` for robust active season identification.
- **Modified Files**:
  - `src/lib/actions/game-actions.ts`
  - `src/components/dashboard/GameEditModal.tsx`
  - `src/components/team/TeamSchedule.tsx`
  - `src/lib/data/queries.ts`
  - `src/components/team/TeamStats.tsx`
  - `src/types/nav.ts`
  - `src/app/api/teams-data/route.ts`
  - `src/hooks/useSelectedClub.ts`
  - `src/components/layout/NavBar.tsx`
  - `updates.md`

### [2026-10-16 23:00] Admin People Management, Fuzzy Search Resolution, Season-Scoped Guest Players & On-The-Fly Rostering
- **Type**: Feature / UX Architecture / Data Integrity
- **Summary**:
  1. **Admin People Directory & Management (`/admin/people`)**:
     - Added dedicated "People Directory" module card to the Admin Portal (`src/app/(mainAppLayout)/admin/page.tsx`).
     - Created `people.config.ts` entity configuration and server actions (`getAdminPeople`, `createPerson`, `updatePerson`, `deletePerson` in `people-actions.ts`) with normalized gender enforcement (`normalizeGender`), UTC birth dates, and soft-delete safeguards.
     - Built the admin management page (`/admin/people/page.tsx`) with `EntityShell`, search/filter, stats metrics (Total People, Active Profiles, Rostered Players, Coaches/Staff), and full CRUD.
  2. **Intelligent Fuzzy Logic Search Engine (`src/lib/utils/fuzzySearch.ts`)**:
     - Developed a high-performance Levenshtein distance, token-matching, and multi-field fuzzy search utility (`fuzzyFilterPeople`, `scorePersonQuery`, `stringSimilarity`).
     - Supports typo tolerance, transposed letters, reversed names ("Morgan Alex"), nicknames, and full name matching across first name, last name, nickname, and email.
     - Covered with comprehensive unit tests (`src/lib/utils/__tests__/fuzzySearch.test.ts`).
  3. **Season-Scoped Guest Player Resolution**:
     - Enforced that candidate guest players on both the match lineup modal (`AddGuestPlayerModal.tsx`) and the bulk guest assignments page (`GuestPlayersClient.tsx`) MUST be players on an active roster for that specific season (`team_seasons.season_id`).
     - Updated `getGuestPlayerOptions` in `queries.ts` and `searchGuestPlayerCandidates` in `gameLineup-actions.ts` to strictly scope by `seasonId` and rank candidates using fuzzy search.
  4. **On-the-Fly Person, Club & Team Creation and Rostering**:
     - **Team Roster Page (`TeamRoster.tsx`)**: Upgraded the Add Player modal with standard UI primitives (`Modal`, `Input`, `Select`, `Checkbox`, `Button`). Added a "+ Create New Person" mode allowing coaches to create a person on-the-fly and immediately roster them to the team via `createPersonAndAddToRoster`.
     - **Match Lineup Modal (`AddGuestPlayerModal.tsx`)**: Added "+ Roster New / External Player" mode: allows selecting an existing directory person (not yet rostered this season) or creating a new person, cascading Club selection (with `+` inline creation) and Team selection (with `+` inline creation), rostering them to that team for the season, and inserting them as a guest in the active match lineup via `rosterPersonAndAddGuestToLineup`.
     - **Bulk Guest Player Management (`GuestPlayersClient.tsx`)**: Added "+ Roster New Player" button and modal allowing on-the-fly creation/resolution of person, club, and team, immediately enrolling them into the season roster and optionally assigning them as guests to selected matches via `rosterPersonAndAssignGuestGames`.
- **Modified Files**:
  - `src/lib/utils/fuzzySearch.ts`
  - `src/lib/utils/__tests__/fuzzySearch.test.ts`
  - `src/lib/actions/people-actions.ts`
  - `src/lib/entities/configs/people.config.ts`
  - `src/app/(mainAppLayout)/admin/page.tsx`
  - `src/app/(mainAppLayout)/admin/people/page.tsx`
  - `src/lib/data/queries.ts`
  - `src/lib/actions/roster-actions.ts`
  - `src/components/team/TeamRoster.tsx`
  - `src/lib/actions/gameLineup-actions.ts`
  - `src/app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/lineup/AddGuestPlayerModal.tsx`
  - `src/lib/actions/guestPlayer-actions.ts`
  - `src/app/(mainAppLayout)/dashboard/guest-players/page.tsx`
  - `src/components/dashboard/GuestPlayersClient.tsx`
  - `src/lib/actions/inlineEntity-actions.ts`
  - `updates.md`

### [2026-10-16 22:30] Inline Guest Player Management on Game Lineup Page
- **Type**: Feature / UX Standard
- **Summary**:
  1. **Direct Lineup Guest Player Insertion**:
     - Added an inline **"+ Add Guest"** button to the Available (Not Dressed) section header on the match lineup page (`/gamestats/[teamSeasonId]/[id]/lineup`).
     - Created `AddGuestPlayerModal.tsx` allowing coaches and admins to search any person/player across the organization or club, view their primary club and team, assign an optional match jersey number, choose their initial section (Dressed/Bench, Starters, or Available), and immediately insert them into the active lineup.
  2. **Guest Player Query Resilience (`loadGameLineup`, `addGuestPlayerToLineup`)**:
     - Updated `loadGameLineup` in `gameLineup-actions.ts` to query `player_games` with an `OR: [{ team_season_id: { in: siblingTeamSeasonIds } }, { is_guest: true }]` clause so guest players assigned from outside the team's squad pool are never filtered out.
     - Automatically resolves default jersey numbers for guest players from their primary team rosters.
- **Modified Files**:
  - `src/lib/actions/gameLineup-actions.ts`
  - `src/app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/lineup/PlayerStatusSections.tsx`
  - `src/app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/lineup/AddGuestPlayerModal.tsx`
  - `updates.md`

### [2026-10-16 22:00] Sub-Team & Squad Architecture: Distinct Tabs for U12 Elite (LM/DC) and High School (Varsity/JV)
- **Type**: Feature / Refactor / Architecture Fix
- **Summary**:
  1. **Elimination of Club-Wide Bleed**:
     - Removed legacy queries filtering on `teams: { club_id }` in `getPlayersByTeamSeason`, `loadGameLineup`, and `teams/[teamSeasonId]/page.tsx`, which erroneously pooled and mashed all games, records, and rosters for every team under the same club.
  2. **Scoped Sub-Team Resolution (`resolveSubTeams`)**:
     - Implemented `resolveSubTeams(teamSeasonId)` in `queries.ts` to identify legitimate sub-squads:
       - **High School programs**: Scopes strictly to sister high school squads (`Varsity (V)`, `Junior Varsity (JV)`, `JV Gold`, `JV Navy`, `Freshman`).
       - **U12 Elite programs**: Scopes strictly to sub-squads (`LM`, `DC`, and `U12 Elite`).
       - **Standard / Single teams**: Returns empty sub-teams list (`[]`) and scopes strictly to self (`[teamSeasonId]`), preventing any cross-team bleed.
  3. **Interactive Sub-Team / Squad Tab Bar in `TeamPageClient.tsx`**:
     - Added prominent Sub-Team Squad Bar (`[ All Squads ]`, `[ LM ]`, `[ DC ]` or `[ All Squads ]`, `[ Varsity (V) ]`, `[ Junior Varsity (JV) ]`) built with standard `<Button>` UI primitives.
     - Dynamically filters games, rosters, W-L-D-Points records, next match, and recent results strictly to the active squad upon click, or displays the aggregate program pool when "All Squads" is selected.
  4. **Strict Lineup Call-Up Scoping**:
     - Updated `loadGameLineup` in `gameLineup-actions.ts` to use `resolveSubTeams`, preventing illegal cross-team call-ups across unrelated club age groups.
- **Modified Files**:
  - `src/lib/data/queries.ts`
  - `src/app/(mainAppLayout)/teams/[teamSeasonId]/page.tsx`
  - `src/components/team/TeamPageClient.tsx`
  - `src/lib/actions/gameLineup-actions.ts`
  - `src/lib/data/__tests__/resolveSubTeams.test.ts`
  - `updates.md`

### [2026-10-16 21:00] Legacy Access Database Audit & Sub-Team Architecture Planning
- **Type**: Configuration / Documentation
- **Summary**:
  - Extracted and audited all 24 user tables, 236 stored queries, and 65 decompressed VBA modules/forms from `IHS Girls Soccer - Most Recent.accdb`.
  - Added Future Milestone to `todo.md` (deferred per user request) documenting historical feature domains: Player Awards & Honors (`player_awards`, `player_awards_earned`), Varsity Letterman system (`player_season_letters`), Beep Test / Yo-Yo fitness conditioning (`fitness_tests`, `fitness_results`), Shootout archives (`shootouts`), pre-2006 historical stats, and granular metrics (+/- ratings, shots, GK minutes, travel times).
  - Analyzed and formulated clean sub-team / squad architecture to eliminate club-wide game and roster blending and provide dedicated squad tabs (LM vs DC for U12 Elite, Varsity vs JV for High School).
- **Modified Files**:
  - `todo.md`
  - `updates.md`

### [2026-10-16 10:16] Major Event Clock: 3 Clock Pause Scenarios & Removal of 5s Threshold
- **Type**: Feature / UX Standard / User Request
- **Summary**:
  1. **Tri-State Clock Pause Dialog**:
     - Upgraded the clock pause transition dialog in `MajorEventModal.tsx` and `Dialog.tsx` to handle all 3 user scenarios when toggling a running clock:
       1. **Cancel Clock Stop Change** (`"Keep Clock Running"`): Dismisses the prompt and maintains continuous running clock without changes.
       2. **Confirm Whole Event as Stopped Clock** (`"Pause from Event Start ({T1})"`): Retroactively treats the entire event interval as a stopped clock from $T_1$, starting an open stoppage without creating an intermediate running interval.
       3. **Pause Clock at Current Time** (`"Yes, Pause Clock at Current Time ({T2})"`): Closes the elapsed running interval ($T_1 \to T_2$) with `clock_should_run: 1` and begins a new open stoppage at $T_2$ with `clock_should_run: 0`.
  2. **Universal Event Scope & Removal of 5s Check**:
     - Removed the 5-second elapsed threshold check so the user is always in full control regardless of when they click to pause the clock.
     - Ensured the 3 scenarios apply universally across all major event types (Goal, Card, Penalty Kick, Injury, Hydration, Weather, Delay, Pause).
  3. **Responsive Dialog Layout**:
     - Enhanced `Dialog.tsx` to support the `size` prop and `flex-wrap` button layouts, cleanly accommodating 3 descriptive action buttons across desktop and mobile screens.
- **Modified Files**:
  - `src/components/ui/Dialog.tsx`
  - `src/components/game/live/MajorEventModal.tsx`
  - `src/components/game/live/__tests__/MajorEventModal.test.tsx`
  - `updates.md`

### [2026-10-16 09:58] Major Event Clock Architecture: Explicit Clock Stopping, NFHS Mercy Rule Running Clock & Split-Event Transition
- **Type**: Feature / Bug Fix / UX Standard
- **Summary**:
  1. **Strict Explicit Clock Stopping & Running Stoppage Integrity (`dateTimeUtils.ts`, `gamePlayerTimeStore.ts`)**:
     - Fixed critical timing bug where `event_type === "stoppage"` was automatically treated as paused clock regardless of `clock_should_run`. Now, only `clock_should_run === 0` (or `false`) pauses player on-field playing time calculations.
     - Major events with a running clock (`clock_should_run: 1`) will never pause player active playing minutes or freeze game timers.
     - Ensured NO major event receives an end time before it is recorded: instantaneous events with running clock receive `end_time = gameTimeSeconds` strictly upon submission, while stopped-clock stoppages remain open (`end_time = null`) until play is resumed. Fixed bug where background cache synchronization inadvertently reset `end_time` to `null`.
  2. **Instance A: NFHS Auto-Pause vs. Mercy Rule Continuous Clock (`gameRules.ts`, `MajorEventModal.tsx`, `BroadcastScoreboard.tsx`, `MatchSettingsAccordions.tsx`, `GameSettingsEditor.tsx`)**:
     - Added `shouldAutoStopClockOnMajorEvent(game)` evaluating whether the clock should pause: returns `true` under NFHS rules unless the score differential reaches +5 goals (configurable via `mercyRuleGoalDiff`) or continuous running clock is agreed upon by referees (`mercyRuleRunningClock === true`).
     - Major event modal defaults the clock button to paused or running based on `shouldAutoStopClockOnMajorEvent(game)` and renders a contextual indicator badge. Switching event tabs (Goal, Card, PK, Injury, Hydration) never forcefully toggles the clock off without user action.
  3. **Instance B: Non-NFHS Running Clock to Stopped Clock Split Transition (`MajorEventModal.tsx`, `Dialog.tsx`)**:
     - Implemented split-event workflow when game play is paused for an injury or issue with a running clock ($T_1$) and the referee later signals time-off ($T_2$):
       - If user clicks `[Clock Running ⏱️]` to pause the clock after $> 5$ seconds of play have elapsed, an interactive confirmation `Dialog` appears.
       - Upon confirmation, the app records the elapsed running play ($T_1 \to T_2$) with `clock_should_run: 1` and `end_time = T2` (preserving player on-field minutes), and begins a new stoppage at $T_2$ with `clock_should_run: 0` and `end_time = null`.
       - The modal smoothly switches to paused stoppage mode at $T_2$ with an active paused timer.
- **Modified Files**:
  - `src/lib/utils/dateTimeUtils.ts`
  - `src/stores/gamePlayerTimeStore.ts`
  - `src/lib/utils/gameRules.ts`
  - `src/types/game.ts`
  - `src/stores/gameStore.ts`
  - `src/lib/data/queries.ts`
  - `src/lib/actions/gameSettings-actions.ts`
  - `src/components/game/live/MajorEventModal.tsx`
  - `src/components/game/live/BroadcastScoreboard.tsx`
  - `src/components/game/MatchSettingsAccordions.tsx`
  - `src/components/game/GameSettingsEditor.tsx`
  - `src/components/game/live/__tests__/MajorEventModal.test.tsx`
  - `updates.md`

### [2026-10-16 09:05] Revert Synthetic 60s Timeout Cap, Enforce Strict Event Cascade Deletion & Fix Major Event Clock Defaults
- **Type**: Bug Fix / Refactor / Data Integrity
- **Summary**:
  1. **Revert Synthetic Stoppage Timeout Cap (`gamePlayerTimeStore.ts`, `queries.ts`)**:
     - Removed the synthetic 60-second completion timeout cap on unended stoppages. Stoppages now adhere strictly to authentic match period boundaries and explicit event times.
  2. **Bidirectional Cascade Event Deletion (`api/[tableName]/route.ts`, `gameStore.ts`)**:
     - Enforced strict cascade deletion across both database and Zustand store: deleting any discipline, goal, or penalty record immediately deletes its linked parent `game_events_major` record (and vice versa).
     - Enhanced `route.ts` DELETE handler for `game_events_discipline`, `game_events_goals`, and `game_events_penalties` to query `id = ? OR major_event_id = ?` and execute parent major event deletion, triggering MySQL's native foreign key cascade.
     - Hardened `gameStore.ts` `deleteEvent()` to proactively find and remove linked major and child events from in-memory state with 0ms lag, guaranteeing no orphan stopped-clock major event records remain.
  3. **Major Event Clock State & Instantaneous Event Closure (`MajorEventModal.tsx`)**:
     - Clarified and enforced running-clock defaults when `autoStopClockOnMajorEvent: false`: cards, goals, and penalty kicks recorded with running clock now write `clock_should_run: 1` and `end_time: gameTimeSeconds` immediately, preventing instantaneous events from ever lingering as unended stoppages.
     - Updated event type switching in `MajorEventModal` so selecting non-stoppage event types (card, goal, pk) automatically synchronizes `stopClock` with the match's `autoStopClockOnMajorEvent` rule setting.
- **Modified Files**:
  - `src/stores/gamePlayerTimeStore.ts`
  - `src/lib/data/queries.ts`
  - `src/stores/gameStore.ts`
  - `src/app/api/[tableName]/route.ts`
  - `src/components/game/live/MajorEventModal.tsx`
  - `updates.md`

### [2026-10-15 17:02] Live Match Audit Fixes: Period Cascade, Stoppage Playing Time Freeze, Grayed Player Contrast, Red Card Lineup Warning & Intermission State
- **Type**: Bug Fix / Data Integrity / UX Polish
- **Summary**:
  1. **Period Deletion Full Cascade (`api/[tableName]/route.ts`, `gameStore.ts`)**:
     - Updated `DELETE /api/game_periods` to cascade-delete all linked records for that period and match: `game_events_major`, `game_events_goals`, `game_events_discipline`, `game_events_penalties`, `game_events_team`, `game_events_player_actions`, and `game_subs`.
     - Added reverse cascade when deleting child events (`game_events_discipline`, `game_events_goals`, `game_events_penalties`) so their linked parent `game_events_major` stoppage records are automatically removed simultaneously.
     - Updated `deletePeriod` in `gameStore.ts` to clear in-memory period events and re-evaluate team scores, player stats, and +/- dynamically.
  2. **1:13 Playing Time Freeze & Stoppage Integrity (`gamePlayerTimeStore.ts`, `queries.ts`, `gameStore.ts`)**:
     - Fixed root cause where deleted disciplinary events left orphan `game_events_major` records with `clock_should_run: 0` and `end_time: null`, causing `calculateActivePlayerTimeOnField` to subtract all subsequent period minutes and capping player times to 1:13.
     - Enhanced `getGameStoppageIntervals` and `calculatePlayerGameMinutes` to filter out orphan card/goal major events whose child discipline/goal row was deleted, and capped unended stoppages with no trailing events to a 60-second limit rather than consuming entire periods.
     - Updated `endPeriod()` in `gameStore.ts` to automatically close any active unended stoppages when a period ends.
  3. **High-Contrast Typography for Grayed-Out Player Rows (`LivePlayerTable.tsx`)**:
     - Replaced low-contrast `opacity-40` and muted text on sent-off (red-carded) and exhausted player rows with vibrant, readable styles: high-contrast white text (`text-slate-100 dark:text-slate-100 font-medium`) for player names, `text-slate-200` for jersey numbers, `text-emerald-400 font-black` for goals, `text-blue-400` for assists, and `text-slate-300 font-semibold` for playing times.
  4. **Pregame Scoping for Starting Lineup Size Validation (`LineupValidationBanner.tsx`, `BroadcastScoreboard.tsx`)**:
     - Fixed issue where issuing a red card to an on-field player decremented the required field count (e.g. from 11 to 10), triggering the pregame "Configure Lineup" mismatch banner and disabling the period clock button with "Roster config mismatch".
     - Guarded `LineupValidationBanner` to render strictly during `GAME_STAGES.BEFORE_START`, suppressing starting lineup size warnings during live play or between periods.
     - Updated `handleDefaultToggleClock` and `isClockButtonDisabled` in `BroadcastScoreboard.tsx` so `isLineupConfigured` is checked strictly before kickoff, allowing `Start Period 2` to execute smoothly at halftime without blocking.
  5. **Intermission & Halftime Workspace Controls (`TeamCountersPanel.tsx`, `LivePlayerTable.tsx`, `gameStore.ts`)**:
     - Disabled Team Counter +/- buttons during `GAME_STAGES.BETWEEN_PERIODS` and `BEFORE_START` with a visual `"Halftime (Paused)"` indicator badge, preventing stray corner/foul/offside logs during intermissions.
     - Made `LivePlayerTable` game stage evaluation reactive to store updates, ensuring quick actions (`+SHOT`, `+SAVE`) are cleanly hidden as soon as the match transitions to intermission.
     - Exported `GAME_STAGES` from `gameStore.ts` to maintain unified type safety across all live match subcomponents.
- **Modified Files**:
  - `src/app/api/[tableName]/route.ts`
  - `src/stores/gameStore.ts`
  - `src/stores/gamePlayerTimeStore.ts`
  - `src/lib/data/queries.ts`
  - `src/components/game/live/MajorEventModal.tsx`
  - `src/components/game/live/LivePlayerTable.tsx`
  - `src/components/game/live/LineupValidationBanner.tsx`
  - `src/components/game/live/BroadcastScoreboard.tsx`
  - `src/components/game/live/TeamCountersPanel.tsx`
  - `src/components/game/live/__tests__/LineupValidationBanner.test.tsx`
  - `src/components/game/live/__tests__/TeamCountersPanel.test.tsx`
  - `updates.md`

### [2026-10-15 14:10] Penalty Shootout Distance-to-Decision, Lineup Jersey Verification & Master Calendar
- **Type**: Feature / UX Enhancement / Roadmap Reconciliation
- **Summary**:
  1. **Shootout Distance-to-Decision & Live Kick Stakes (`shootoutUtils.ts`, `ShootoutConsoleClient.tsx`)**:
     - Built `computeMinKicksToDecision` BFS engine determining the exact minimum kicks until a winner can mathematically be declared from any regulation or sudden-death state.
     - Implemented dynamic live consequences card for the active kick:
       - ⚽ **If Scores**: Highlights whether the team clinches the win immediately or how many kicks remain to decide.
       - ❌ **If Misses**: High-contrast alert when the opponent wins the shootout immediately (*"If missed, [Opponent] WINS THE SHOOTOUT!"*) or whether it extends sudden death.
       - Dynamic badges above kick action buttons (`★ Clinches Win` on Goal, `⚠️ Opponent Wins` on Miss/Saved).
     - Added comprehensive unit tests in `shootoutUtils.test.ts` (10 tests passing 100%).
  2. **Lineup Missing & Duplicate Jersey Number Resolution (`LineupJerseyCheckModal.tsx`, `LineupFooter.tsx`, `gameLineup-actions.ts`)**:
     - Added automatic verification modal on "Confirm Lineup" when starting field players or goalkeepers lack a jersey number or have duplicate numbers.
     - Allows assigning jersey numbers inline with an optional toggle to save permanently to team roster via `updateLineupPlayerJerseys`.
  3. **Step 34: Interactive Team & Master Calendar (`/calendar`, `CalendarClient.tsx`, `calendar-actions.ts`)**:
     - Built `/calendar` aggregating scheduled matches (`getGames`) and program events (`prisma.events`: practices, meetings, camps, banquets).
     - Multi-view switcher: Month Grid view (with colored category badges and day slots) and Agenda List view.
     - Category filter pills (Matches, Practices, Meetings, Camps, Team Events).
     - Interactive Event Modal with venue/sublocation info (`LocationLink`) and direct match links.
     - Added `Calendar & Schedule` link to primary navigation (`NavLinks.tsx`).
  4. **`todo.md` Full Audit & Reconciliation**:
     - Reviewed and resolved every unchecked item in `todo.md`.
     - Verified Step 12.1 (Jersey Modal), Step 19.1 (superseded by centralized competition settings), Step 19.2 (rollover), Step 30 (awards schema ready), Step 33 (Shootout Console), and Step 34 (Calendar).
     - Zero unchecked active roadmap items remaining; all 29 test suites (115 tests) passing with 0 TypeScript errors.
- **Modified Files**:
  - `src/lib/utils/shootoutUtils.ts`
  - `src/lib/utils/__tests__/shootoutUtils.test.ts`
  - `src/components/game/shootout/ShootoutConsoleClient.tsx`
  - `src/app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/lineup/LineupJerseyCheckModal.tsx`
  - `src/app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/lineup/LineupFooter.tsx`
  - `src/lib/actions/gameLineup-actions.ts`
  - `src/lib/actions/calendar-actions.ts`
  - `src/components/calendar/CalendarClient.tsx`
  - `src/app/(mainAppLayout)/calendar/page.tsx`
  - `src/components/layout/NavLinks.tsx`
  - `todo.md`
  - `updates.md`

### [2026-10-15 13:25] Goal Audit Verification & Legacy Migrations (Parents, Relationships, Calendar Events)
- **Type**: Migration / Audit / Data Integrity
- **Summary**:
  1. **Comprehensive Goal Audit of `u676616277_hs_original.sql`**:
     - Audited all 1,155 goals (776 Goals For, 379 Goals Against) and verified 100% mapping integrity across periods, stoppages, and games with 0 orphan records.
     - Confirmed exact reasons for completed games without scores: 245 JV games (historical stats were never tracked for JV in legacy system), 33 games from 2004–2006 (prior to stoppage/goal event logging), ~60 pre-season August scrimmages, and 31 regular/playoff games where live tracking was not entered.
  2. **Parent & Player Relationships Migration (`scripts/migrate_parents_and_relationships.ts`, `scripts/import_player_relationships.sql`)**:
     - Parsed 310 legacy parents and 318 `playerParents` relationship linkages.
     - Mapped 100% of player and parent person IDs cleanly to `player_relationships` (`relationship = 'Parent'`).
     - Generated executable SQL script `scripts/import_player_relationships.sql` with `ON DUPLICATE KEY UPDATE` guards.
  3. **Calendar Events Migration (`scripts/migrate_calendar_events.ts`, `scripts/import_calendar_events.sql`)**:
     - Parsed 11 legacy `calendarEvents` (PreSeason, Regular Season, Tryouts, Summer Camps, Alumni Game).
     - Generated executable SQL script `scripts/import_calendar_events.sql` mapping dates, all-day flags, Google Calendar IDs, and location references into the Prisma `events` table.
  4. **Minor Events Migration Staging (`scripts/migrate_minor_events.ts`)**:
     - Staged migration for 64 historical corner kicks (20), offsides (19), fouls (19), and shots (6) mapped across 4 legacy matches.
- **Modified Files**:
  - `scripts/migrate_parents_and_relationships.ts`
  - `scripts/import_player_relationships.sql`
  - `scripts/migrate_calendar_events.ts`
  - `scripts/import_calendar_events.sql`
  - `scripts/migrate_minor_events.ts`
  - `scratch/analyze_legacy_goals.ts`
  - `scratch/audit_parents_mapping.ts`
  - `scratch/audit_calendar_events.ts`
  - `scratch/audit_minor_events_mapping.ts`

### [2026-10-15 11:37] Step 32: Live Match Audit Findings, Clock/Playing Time Integrity & Mobile/Tablet Enhancements
- **Type**: Feature / Bug Fix / Refactor / UX Enhancement
- **Summary**:
  1. **Red Card Play-Down On-Field Enforcement (`LineupValidationBanner.tsx`, `BroadcastScoreboard.tsx`, `OnFieldPlayersPanel.tsx`, `gameSubsStore.ts`)**:
     - Enforced that a team only plays down if the red-carded or disqualified player was active on the field at the time the card was received (`isPlayerOnFieldAtTime`).
     - Disqualifications issued to bench/reserve players send off and gray out the player, but do not decrement on-field headcount or force the team to play down.
     - Added on-field header status badge indicating `Playing Down (10)` when active on-field red cards exist.
     - Prevented red-carded players from being substituted out or subbed in.
  2. **Penalty Kick True 0ms Optimistic Return (`MajorEventModal.tsx`, `gameStore.ts`)**:
     - Converted penalty kick submission for saved/missed outcomes into a synchronous optimistic update (`addPenaltyEvent`, `addPlayerAction`).
     - Immediately closes the modal and returns directly to the live game console (0ms latency) without awaiting network roundtrips and bypassing pending substitution prompt interruptions.
     - Performs non-blocking background persistence with cache auto-sync.
  3. **Multi-Time Display in Major Event Modal Header (`MajorEventModal.tsx`)**:
     - Updated header to display the three distinct match metrics:
       - **Active Game Clock**: Running vs. paused match clock (responsive to the `stopClock` toggle).
       - **Event Game Time**: Static match timestamp indicating the exact game minute/second the event/stoppage occurred (e.g. `23:45`, not a ticking clock).
       - **Elapsed Event Time**: Live duration counter tracking how long this specific event or stoppage has been active since opening or since the stoppage began (e.g. weather delay duration).
  4. **Mobile-Responsive Team Schedule (`TeamSchedule.tsx`)**:
     - Modernized team schedule filters and action bars for clean wrapping on narrow mobile screens (320px - 414px) without horizontal overflow.
     - Optimized game cards with compact padding, clear home/away status tags, responsive matchup rows, and touch-friendly action buttons.
  5. **Scoreboard Countdown Normalization & Defaults (`BroadcastScoreboard.tsx`, `gameRules.ts`)**:
     - Normalized `periodDuration` handling to parse seconds values (`> 120`) directly without multiplying by 60, eliminating the 3000m countdown glitch.
     - Defaulted High School Varsity to 40m (`2400s`) and JV to 30m (`1800s`), while preserving explicit node overrides.
  6. **True 0ms Optimistic Team Counters & Roster Sorting (`TeamCountersPanel.tsx`, `OnFieldPlayersPanel.tsx`, `LivePlayerTable.tsx`)**:
     - Removed blocking network roundtrips on shot, save, and counter triggers, updating local Zustand state synchronously.
     - Added column sorting (jersey number, name, shots, goals, assists, saves, GA, +/-, total time, shift time/bench time) with indicator arrows on live box score tables.
  7. **Game Loading State Guard & Fullscreen Reopen Control (`GameProvider.tsx`, `BroadcastScoreboard.tsx`, `FullscreenManager.tsx`)**:
     - Guarded `GameProvider` so route transitions never render stale/empty game states while active match data is loading.
     - Embedded persistent `<FullscreenManager />` in the broadcast scoreboard header for one-touch fullscreen entry on mobile/tablets.
  8. **Player Shift Time Calculation & Post-Game Lineup Roster (`dateTimeUtils.ts`, `gamePlayerTimeStore.ts`, `gameStore.ts`, `GameSummaryClient.tsx`)**:
     - Chronologically replayed substitution events in `calculateRecentPlayerTimeOnField` to determine continuous stint starts for re-entering players, excluding position swaps and paused clock stoppages.
     - Expanded post-game match event details to render the exact on-field lineup present at the event timestamp.
     - Ensured unended periods and stoppages are closed with `Date.now()` upon game conclusion.
- **Modified Files**:
  - `src/components/game/live/BroadcastScoreboard.tsx`
  - `src/components/game/live/LineupValidationBanner.tsx`
  - `src/components/game/live/MajorEventModal.tsx`
  - `src/components/game/live/OnFieldPlayersPanel.tsx`
  - `src/components/game/live/TeamCountersPanel.tsx`
  - `src/components/game/live/LivePlayerTable.tsx`
  - `src/components/team/TeamSchedule.tsx`
  - `src/components/game/GameProvider.tsx`
  - `src/components/game/FullscreenManager.tsx`
  - `src/components/game/GameSummaryClient.tsx`
  - `src/lib/utils/dateTimeUtils.ts`
  - `src/lib/utils/gameRules.ts`
  - `src/stores/gamePlayerTimeStore.ts`
  - `src/stores/gameStore.ts`
  - `todo.md`
  - `updates.md`

### [2026-10-15 09:48] Integrated Step 32 Live Match Audit, Clock/Playing Time Integrity & Mobile/Tablet Enhancements
- **Type**: Configuration / Project Planning & Refactor
- **Summary**:
  - Integrated raw testing and audit notes from the bottom of `todo.md` into a formal, structured roadmap: **Step 32: Live Match Audit Findings, Clock/Playing Time Integrity & Mobile/Tablet Enhancements** (tasks 32.1 through 32.13).
  - Investigated root causes and established technical specifications for all 13 items:
    1. Mobile-responsive team game schedule (`TeamSchedule.tsx`).
    2. High School period duration defaults (40m for Varsity vs. 30m for JV).
    3. Scoreboard countdown clock unit normalization (`BroadcastScoreboard.tsx`, fixing 3000m display caused by multiplying seconds by 60).
    4. 0ms optimistic UI for team counters, shots, and saves (`OnFieldPlayersPanel.tsx`, `TeamCountersPanel.tsx`).
    5. Game loading state & stale data prevention (`GameProvider.tsx`).
    6. Persistent fullscreen reopen control for tablets & mobile (`BroadcastScoreboard.tsx`).
    7. Column sorting for live box scores (`LivePlayerTable.tsx`).
    8. Resetting default Major Event tab to Goal on modal open (`MajorEventModal.tsx`).
    9. Red card disqualification, playing down, and NFHS soft-red replacement rules.
    10. Multi-clock display in Major Event modal (Game Time, Elapsed Time, and Active Game Clock).
    11. Returning player shift time calculation fix in `gamePlayerTimeStore.ts`.
    12. Post-game match event on-field player lineup display in `GameSummaryClient.tsx`.
    13. Game conclusion period termination and final playing time clamping (`gameStore.ts`, `queries.ts`).
- **Modified Files**:
  - `todo.md`
  - `updates.md`

### [2026-10-14 14:45] Lineup Page Mount Loop Elimination, FullscreenManager State Guard & Completed Match Lineup Integrity
- **Type**: Bug Fix / Stability & Data Integrity
- **Summary**:
  1. **Infinite Re-render Loop & Mount Depth Resolution (`FullscreenManager.tsx`, `GameProvider.tsx`, `GameLineupClientPage.tsx`)**:
     - Identified that `GameProvider`'s loading check `if (!game || players.length === 0)` unmounted and remounted the entire page whenever `players` was modified or empty, causing a cyclic re-mount loop with `GameLineupClientPage` and `FullscreenManager`.
     - Replaced the brittle `players.length === 0` unmount trigger in `GameProvider` with an explicit `isDataLoading` state guard, preventing sudden component tree tears and remount cascades.
     - Added a module-level session guard `hasCheckedGlobalFsPref` in `FullscreenManager.tsx` ensuring preference checks and `setShowResumeBanner(true)` are strictly executed once across the entire browser session rather than triggering on rapid remounts.
     - Updated `GameLineupClientPage` to merge `initialPlayers` with existing store players without stripping `playerGameId` or resetting player stats.
  2. **Completed Matches Without Starters Safeguard (`gameLineup-actions.ts`, `gamePlayersStore.ts`)**:
     - Identified that games like 1472, 1456, 1457, 1458, etc., which were completed matches where no individual lineup was ever fielded (0 starters and 0 goalkeepers), had entire program rosters (V and JV/V) auto-marked as `dressed`.
     - Added `hasRecordedStarters` guard in `loadGameLineup` and `loadPlayers`: for completed matches where 0 starters exist in match records, players are never falsely dressed and default to `not_dressed` (Available) while preserving explicit non-playing statuses (`injured`, `unavailable`, `suspended`).
  3. **MySQL Connection Pool Optimization (`.env`)**:
     - Added `connection_limit=5&pool_timeout=20` to `DATABASE_URL` in `.env` to enforce strict connection reuse and prevent exceeding the 500 connections/hour host limit.
  4. **Quality Verification**:
     - Passed `npx tsc --noEmit` with 0 errors.
     - Passed `npx vitest run` with 105/105 tests passing across 28 test files.

### [2026-10-14 14:12] FullscreenManager Re-render Loop Fix, Box Score Duplicate Elimination & Completed Match Roster Integrity
- **Type**: Bug Fix / UX & Data Integrity
- **Summary**:
  1. **FullscreenManager Maximum Update Depth Fix (`FullscreenManager.tsx`)**:
     - Added `initialCheckDone` ref guard to guarantee preference checks and `setShowResumeBanner` are only executed once per component lifecycle.
     - Prevented repeated `setShowResumeBanner(true)` invocations from triggering infinite update cycles (`Maximum update depth exceeded`) during route transitions and component mounts.
  2. **GameProvider Redirection & Subroute Preservation (`GameProvider.tsx`)**:
     - Added `hasRedirectedRef` to guard bracket resolved team redirection, ensuring it only fires once.
     - Preserved active subroutes (e.g. `/lineup`, `/manage`, `/live`, `/summary`) when resolving tournament bracket placeholders.
  3. **Elimination of Duplicate Players on Box Score (`v_player_games`, `updateVPlayerGames.ts`, `gamePlayersStore.ts`)**:
     - Identified that `pt_prog` subquery in `v_player_games` returned multiple rows for hybrid players active on multiple squads within the same club and season (e.g. JV + Varsity), causing players to appear multiple times in the box score.
     - Added `GROUP BY pt2.player_id, ts2.season_id, t2.club_id` with `MAX()` aggregations to the `pt_prog` subquery in MySQL view `v_player_games`, guaranteeing exactly one row per player.
     - Added client-side deduplication in `loadPlayers` (`gamePlayersStore.ts`) by `player_game_id` and `player_id`.
  4. **Completed Match Roster Integrity & Inactive Players Verification (`gamePlayersStore.ts`, `gameLineup-actions.ts`)**:
     - Guarded `loadPlayers` so it strictly avoids auto-inserting missing roster players as `dressed` on completed matches (`!isCompletedMatch`).
     - Updated `loadGameLineup` so that for completed games, unrecorded roster players default to `not_dressed` instead of `dressed`.
     - Cleaned up 22 spurious `dressed` rows accidentally auto-created on game 1388, restoring the match to its pristine historical roster (1 GK, 10 starters, 8 dressed reserves, 7 injured players, 13 not dressed).
     - Verified games with recorded injured/unavailable players (such as games 1200–1217 in 2014-15 and game 1388) accurately display all injured players in the dedicated "Inactive Players" card on Game Summary.
  5. **Verification**:
     - Passed `npx tsc --noEmit` with 0 errors.
     - Passed `npx vitest run` with 105/105 tests passing across 28 test files.
- **Modified Files**:
  - `src/components/game/FullscreenManager.tsx`
  - `src/components/game/GameProvider.tsx`
  - `src/app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/lineup/GameLineupClientPage.tsx`
  - `src/stores/gamePlayersStore.ts`
  - `src/lib/actions/gameLineup-actions.ts`
  - `src/scripts/updateVPlayerGames.ts`
  - `updates.md`

### [2026-10-14 13:45] Fix Duplicate Entry 1062 on player_games & Resilient Cross-Squad Match Loading
- **Type**: Bug Fix / Data Integrity & Resilience
- **Summary**:
  1. **Cross-Squad Program Roster Join in `v_player_games` (`updateVPlayerGames.ts`)**:
     - Updated MySQL `v_player_games` view to join both direct team season player affiliations (`pt_direct`) and program-level sister squad affiliations (`pt_prog`, matching club, season, and active status).
     - Fixed issue where players rostered on sister squads (e.g. JV players dressing for Varsity matches, or hybrid players) were omitted from `v_player_games` because `pt.team_season_id = ts.id` was null, leading downstream checks to falsely treat them as uninitialized.
  2. **Game-Scoped Existing Check & Number Normalization (`gamePlayersStore.ts`)**:
     - Updated `loadPlayers` to query all match participants via `{ filters: { game_id: Number(gameId) } }`, ensuring `existingAllInGame` encompasses all players currently associated with the game regardless of squad id.
     - Scoped `existingPlayerGames` to the current team season while preserving hybrid and sister-squad program players already attached to the match.
     - Normalized `Number(pg.player_id) === Number(p.player_id)` comparisons to prevent string/number type mismatches from marking existing players as missing.
  3. **Graceful 1062/409 Duplicate Handling in `upsertPlayerGame` (`gamePlayersStore.ts`)**:
     - Hardened `upsertPlayerGame` to catch `409`, `1062`, and `"duplicate"` errors.
     - Upon duplicate detection, safely queries and returns the already-persisted `player_games` row.
     - Provides a fallback synthetic row so unexpected race conditions or edge cases never trigger unhandled exceptions or crash the `GameProvider` / match tracker page.
  4. **Quality Verification**:
     - Passed `npx tsc --noEmit` with 0 errors.
     - Passed `npx vitest run` with 105/105 tests passing across 28 test files.
- **Modified Files**:
  - `src/stores/gamePlayersStore.ts`
  - `src/scripts/updateVPlayerGames.ts`
  - `updates.md`

### [2026-10-14 13:08] Sidebar Parent Team Selection, Not-Dressed Player Exclusion & Game Summary Inactive Players Card
- **Type**: Feature / UX & Data Integrity Enhancement
- **Summary**:
  1. **Sidebar Selector Parent Program Grouping (`SidebarTeamSelector.tsx`, `TeamSelector.tsx`)**:
     - Exported and integrated `getProgramLevelTeamName` to collapse squad variants (e.g. `JV`, `Varsity`) into parent programs (e.g. `Girls Soccer`, `Boys Soccer`).
     - Restricted selection to parent programs only, redirecting to the primary Varsity team ID.
     - Automatically displays single-program programs cleanly without sub-squad tags.
  2. **Strict Exclusion of `not_dressed` Players Post-Lineup**:
     - Excluded `not_dressed` players from match tracking views (`BenchReservesPanel.tsx`, `MajorEventModal.tsx`, `GameManageClient.tsx`).
     - Prevented `not_dressed`, `injured`, `suspended`, or `unavailable` players from appearing in bench reserves, on-field lists, sub pickers, or manual event modal options.
  3. **Dedicated Inactive Players Card on Game Summary (`GameSummaryClient.tsx`)**:
     - Filtered `fieldPlayers` and `goalkeepers` box score tables to strictly include eligible playing players (`starter`, `goalkeeper`, `dressed`).
     - Excluded `not_dressed` players from appearing anywhere in the match summary.
     - Added a dedicated "Inactive Players" card highlighting `Injured`, `Suspended`, and `Unavailable` players with distinct badges, counters, and player detail chips.
  4. **Automated Testing & Verification**:
     - Created `SidebarTeamSelector.test.tsx` verifying parent program collapsing and primary ID selection.
     - Created `GameSummaryClient.test.tsx` verifying `not_dressed` exclusion and inactive player rendering.
     - Verified `npx tsc --noEmit` (0 errors) and `npx vitest run` (105/105 tests passing across 28 test files).
- **Modified Files**:
  - `src/components/layout/TeamSelector.tsx`
  - `src/components/layout/SidebarTeamSelector.tsx`
  - `src/components/layout/__tests__/SidebarTeamSelector.test.tsx`
  - `src/components/game/live/BenchReservesPanel.tsx`
  - `src/components/game/live/MajorEventModal.tsx`
  - `src/components/game/GameManageClient.tsx`
  - `src/components/game/GameSummaryClient.tsx`
  - `src/components/game/__tests__/GameSummaryClient.test.tsx`
  - `updates.md`

### [2026-10-14 12:25] Enforced Rostered Status Across Lineups, Game Stats & Live Tracking
- **Type**: Feature / Data Integrity Refactor
- **Summary**:
  1. **Game Lineup Builder & Match Availability (`gameLineup-actions.ts`)**:
     - Restricted `loadGameLineup` to strictly load `status: "rostered"` players across the program pool.
     - Prevented players with tryout, interested, cut, quit, or not playing statuses from populating into game lineups or match rosters.
     - Scoped guest fallback to explicit `pg.is_guest: true` records only.
  2. **Database View Enforcement (`v_players` & `v_player_games`)**:
     - Updated MySQL `v_players` view with `WHERE pt.status = 'rostered' AND pt.is_active = 1` to guarantee all downstream consumers receive active rostered members.
     - Updated MySQL `v_player_games` view with `WHERE (pt.status = 'rostered' OR pg.is_guest = 1)` and added `roster_status`.
  3. **Live Tracking & Game Store Guarding (`gamePlayersStore.ts`)**:
     - Added `player_status` tracking in `RosterPlayerRow` and ensured `missingPlayers` roster sync only initializes players with `status === "rostered"`.
  4. **Player Stats & Quick Score Scoping (`queries.ts`, `quickScore-actions.ts`)**:
     - Filtered `getPlayerStatsByTeamSeason` and `getPlayerStatsByPerson` to active rostered players only.
     - Filtered quick score match roster options to `status: "rostered"` players.
  5. **Quality Verification**:
     - Verified `npx tsc --noEmit` (0 errors).
     - Verified `npx vitest run` (101/101 tests passing).
- **Modified Files**:
  - `src/lib/actions/gameLineup-actions.ts`
  - `src/lib/actions/quickScore-actions.ts`
  - `src/lib/data/queries.ts`
  - `src/stores/gamePlayersStore.ts`
  - `updates.md`

### [2026-10-14 12:05] Reverted Breaking Prisma 7 Upgrade & Restored Prisma 5.22.0
- **Type**: Bug Fix / Configuration Recovery
- **Summary**:
  1. **Restored Prisma 5.22.0 & Resolved P1012 Validation Error**:
     - `npm audit fix --force` had forcefully upgraded Prisma to 7.10.0, introducing breaking schema changes where `url` was removed from `schema.prisma`.
     - Reverted `@prisma/client` and `prisma` to `^5.22.0` and removed `prisma.config.ts`.
     - Regenerated Prisma Client v5.22.0 and verified database sync with `npx prisma db push`.
  2. **Restored Vitest Test Dependencies**:
     - Re-added `vite` and `@testing-library/dom` peer dependencies removed during npm audit pruning.
     - Verified `npx tsc --noEmit` (0 errors) and `npx vitest run` (101/101 tests passing).
- **Modified Files**:
  - `package.json`
  - `updates.md`

### [2026-10-14 11:50] Program-Level Selector Grouping, Schedule Sub-Squad Tabs, and Player Status Filtering
- **Type**: Feature / UX Refactor
- **Summary**:
  1. **Top-Level Program Selection in Navigation Selectors (`TeamSelector.tsx`)**:
     - Collapsed sub-squads (`Varsity`, `JV`, `DC`, `LM`, `Gold`, `Navy`) into top-level program options (e.g., `Girls Soccer`, `Boys Soccer`, or base age group program).
     - Individual sub-squad variants are no longer shown in navigation dropdowns; each program maps to its primary squad ID (prioritizing Varsity).
     - Maintains active selection state when visiting any sister squad sub-page.
  2. **Sub-Squad Schedule Tabs & Match Badging (`TeamSchedule.tsx`)**:
     - Added interactive sub-squad filter tabs (`[All Program Matches]`, `[Varsity]`, `[JV]`, etc.) with match counts to the team schedule view.
     - Extracted squad levels for games using `programTeamSeasonIds` and rendered a prominent squad badge (`[Varsity]`, `[JV]`) on each match card.
     - Closest match auto-scrolling and filtering dynamically adapt to the selected squad tab.
  3. **Player Statuses & Dedicated Roster Filtering (`TeamRoster.tsx`, `roster-actions.ts`)**:
     - Supported all legacy and modern player statuses: `Rostered`, `Trying Out`, `Interested`, `Not Playing`, `Quit`, and `Cut`.
     - Added a dedicated Status Filter Bar above the roster with live counts per status.
     - Set default status filter to `rostered` so only active squad members display upon loading, preventing clutter from tryout, cut, or inactive registrants.
     - Added status badges in both grid cards and table rows, and added a Player Status dropdown in the Edit Player Modal.
  4. **Quality & Test Verification**:
     - Verified `npx tsc --noEmit` compiles cleanly with zero errors.
     - Verified all 26 test suites and 101 tests pass cleanly (`npx vitest run`).
- **Modified Files**:
  - `src/components/layout/TeamSelector.tsx`
  - `src/components/team/TeamSchedule.tsx`
  - `src/components/team/TeamRoster.tsx`
  - `src/components/team/TeamPageClient.tsx`
  - `src/lib/data/queries.ts`
  - `src/lib/actions/roster-actions.ts`
  - `updates.md`

### [2026-10-14 10:35] Unified Program Roster Pool & Complete Historical Match Events & Subs Migration (Steps 3 & 4)
- **Type**: Feature / Data Migration / UI Refactor
- **Summary**:
  1. **Unified Program Roster Pool Architecture**:
     - **Backend Program Resolution (`queries.ts`)**: Enhanced `getPlayersByTeamSeason()` to automatically resolve all sister team seasons sharing club, season, and gender (`includeProgramPool: true`). Hybrid players rostered on both squads (e.g. Varsity and JV) are deduplicated with composite squad levels (`squadLevels: ['Varsity', 'JV']`, `squadLevel: 'Varsity & JV'`).
     - **UI Sub-Squad Tabs & Badges (`TeamRoster.tsx`, `TeamPageClient.tsx`)**: Rendered interactive squad pills above the roster (`[All Program Players (N)]`, `[Varsity (N)]`, `[JV (N)]`), added squad badges on player cards, and added a dedicated "Squad" column in the table view.
     - **Game Day Roster & Lineup Integration (`gameLineup-actions.ts`)**: Updated `loadGameLineup()` to load all program pool players for match day prep. Primary squad players default to `"dressed"` while secondary squad players default to `"not_dressed"` (with `isGuest: false`), allowing coaches to dress or start any player in the program on the fly without using guest player hacks.
  2. **Robust SQL Tuple Parser & Games Completion**:
     - Solved a critical parsing issue where semicolons inside legacy comment/details strings prematurely truncated SQL INSERT blocks.
     - Upgraded `migrate_independence_games.ts` with `parseSqlTuplesRobust`, completing 100% of legacy games (total games in DB now 927; player games at 12,390).
  3. **Complete Major Events, Goals, Cards & Subs Migration (`migrate_events_and_subs.ts`)**:
     - **Major Events (`game_events_major`)**: Bulk migrated all 1,352 legacy stoppages, bringing DB total to 1,862.
     - **Goals (`game_events_goals`)**: Bulk migrated 1,155 goals (776 goals for, 379 goals against) with normalized JSON `goal_types` (`open_play`, `corner_kick`, `penalty`, `header`, `volley`, `direct_free_kick`), bringing DB total to 1,460.
     - **Cards & Discipline (`game_events_discipline`)**: Bulk migrated 31 cards, bringing DB total to 72.
     - **Substitutions (`game_subs`)**: Bulk migrated all 6,004 historical substitutions with exact player match mapping, bringing DB total to 13,244.
  4. **Quality & Test Verification**:
     - Verified clean TypeScript compilation (`npx tsc --noEmit` exited with 0 errors).
     - Verified all 26 test suites and 101 tests passing (`npx vitest run`).
- **Modified Files**:
  - `src/lib/data/queries.ts`
  - `src/components/team/TeamPageClient.tsx`
  - `src/components/team/TeamRoster.tsx`
  - `src/lib/actions/gameLineup-actions.ts`
  - `scripts/migrate_independence_games.ts`
  - `scripts/migrate_events_and_subs.ts`
  - `updates.md`

### [2026-10-13 16:55] Seasonal Team Rosters Migration (`playerSeasons` → `player_teams`)
- **Type**: Feature / Data Migration
- **Summary**:
  1. **Historical Team Rosters Imported**:
     - Identified that while game match appearances (`player_games`) were migrated, the seasonal team rosters (`player_teams`) had not yet been populated from legacy `playerSeasons`.
     - Migrated all 1,195 legacy `playerSeasons` records into 1,314 `player_teams` seasonal roster entries across all 22 seasons for Independence High School Girls squads (`Varsity Girls`, `JV Girls`, `JV Navy Girls`, `JV Gold Girls`).
     - Preserved all jersey numbers, alt/GK numbers, positions, grades, captain status, and enrollment attributes.
  2. **Resolved Missing 2014-2015 Season Rosters**:
     - **Varsity Girls (2014-2015)**: Populated all 24 rostered players with jersey numbers and positions alongside staff.
     - **JV Girls (2014-2015)**: Populated all 15 rostered players.
     - Total `player_teams` in the database increased from 122 to 1,436.
- **Modified Files**:
  - `scripts/migrate_player_teams.ts`
  - `updates.md`

### [2026-10-13 16:25] Bulk Migration of Historical Games, Periods & Rosters (Steps 1 & 2)
- **Type**: Feature / Data Migration
- **Summary**:
  1. **Legacy Independence High School Girls Match Import**:
     - Audited and imported all historical matches from `u676616277_hs_original.sql` across 22 seasons into `games`.
     - Automatically resolved and created missing high school opponent clubs, girls teams (`Varsity Girls`, `JV Girls`), and team seasons.
     - Preserved universal UTC date/time formatting via `parseGameDatesAndTimesUTC` without timezone drift.
  2. **Periods (`game_periods`)**:
     - Created 790 game periods with UTC epoch millisecond start/end timestamps.
  3. **Roster Match Appearances (`player_games`)**:
     - Bulk inserted 8,696+ roster records mapping legacy players to new database people and assigning roles (`starter`, `goalkeeper`, `dressed`, `injured`, `unavailable`).
     - Total `player_games` in DB now stands at 12,060.
  4. **Time & Stoppage Analysis for Step 3**:
     - Verified that legacy `stoppages.begin` and `subs.gameMinute` represent active scoreboard seconds and strictly **exclude** halftime / inter-period breaks, perfectly matching the app's dual-clock active play calculation standard.
- **Modified Files**:
  - `scripts/migrate_independence_games.ts`
  - `updates.md`

### [2026-10-13 14:28] Autonomous Agent Execution & Interruption Suppression Standard (v4 & v5)
- **Type**: Configuration / Agent Governance Rules
- **Summary**:
  - Enforced autonomous agent decision-making across `general_soccer_app_v4` (`AGENTS.md` Rule 14 and `.agents/rules/app-rules.md` Rule 8) and `general_soccer_app_v5` (`AGENTS.md` Rule 7 and `.agents/rules/autonomous-execution.md`).
  - Explicitly banned unnecessary use of interactive question modals (`ask_question`), routine confirmation dialogues, and multiple-choice interrogations.
  - Mandated terminal command batching: banned executing long chains of individual exploratory terminal commands (`Get-Content`, `Get-ChildItem`, etc.) that trigger repetitive user confirmation prompts.
  - Mandated bias-towards-action: agents must make sensible defaults autonomously based on established repository patterns, complete the task, and summarize rationale after the fact, asking only on strictly irrecoverable/destructive blockers.
- **Modified Files**:
  - `general_soccer_app_v4/AGENTS.md`
  - `general_soccer_app_v4/.agents/rules/app-rules.md`
  - `general_soccer_app_v5/AGENTS.md`
  - `general_soccer_app_v5/.agents/rules/autonomous-execution.md`
  - `general_soccer_app_v5/updates.md`


### [2026-10-13 14:20] Persistent Fullscreen Mode & First-Time Onboarding in GameStats (v4 & v5)
- **Type**: Feature & UX Enhancement
- **Summary**:
  1. Created `FullscreenManager` component in both `v4` and `v5`:
     - **First-Time Modal**: Displays an onboarding modal the first time a user visits any GameStats page, offering to enter distraction-free fullscreen mode with a "Remember this preference" checkbox.
     - **Persistent Setting**: Stores the user's choice in `localStorage` (`gamestats_fullscreen_pref`).
     - **Universal Toggle Button**: Renders a sleek icon button (`Maximize2` / `Minimize2`) in the top utility header next to the theme switcher, supporting real-time toggling and Esc-key exits via browser `fullscreenchange` events.
     - **One-Tap Resumption Pill**: If the user previously selected fullscreen, a floating 1-tap pill allows immediate activation (satisfying browser user-gesture security requirements).
  2. Integrated into `src/components/layout/gameLayout/GameHeader.tsx` in `v4` and `src/app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/layout.tsx` in `v5`.
- **Modified Files**:
  - `general_soccer_app_v4/src/components/game/FullscreenManager.tsx`
  - `general_soccer_app_v4/src/components/layout/gameLayout/GameHeader.tsx`
  - `general_soccer_app_v5/src/components/game/FullscreenManager.tsx`
  - `general_soccer_app_v5/src/app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/layout.tsx`


# Application Update Log (`updates.md`)

This log tracks code updates, features, bug fixes, and architectural adjustments made to `general_soccer_app_v4` (including automated entries recorded by AI coding sessions).

### [2026-10-12 16:05] Manual Event Clock Resolution with Period Breaks and Clock Stoppages
- **Type**: Bug Fix / Architecture / Time Utilities
- **Summary**:
  1. **Dual-Clock Domain Math & Problem Resolution**:
     - When entering or editing manual events (goals, substitutions, cards), users specify the event time as active period clock time (e.g. Period 2, 9:52). However, all events are stored in the database in continuous absolute/real-time seconds from match start ($T=0$).
     - The previous resolution in `GameManageClient.tsx` used a simplistic calculation that omitted inter-period breaks (e.g. halftime intermission) and stopped-clock stoppages (`clock_should_run === 0`).
     - Implemented `convertPeriodClockToAbsoluteSeconds` and `convertAbsoluteSecondsToPeriodClock` in `dateTimeUtils.ts` to convert bi-directionally between active period clock and absolute match seconds:
       - Accounts for the full elapsed duration of preceding periods (active time + added/stoppage time).
       - Accounts for all inter-period breaks (halftime / overtime intermissions).
       - Accounts for any clock stoppages with clock off (`clock_should_run: 0`) in the target period prior to the event.
  2. **Event Creation & Edit Integration in `GameManageClient.tsx`**:
     - Updated `resolveGameTimeSeconds` and `calculatePreviewTime` to call `convertPeriodClockToAbsoluteSeconds`.
     - Updated `openEditGoalModal`, `openEditSubModal`, and `openEditCardModal` to call `convertAbsoluteSecondsToPeriodClock` so that when editing an existing event, the inputs display the true active period clock time (e.g. Period 2, 9:52) instead of raw cumulative seconds (e.g. 71:52).
     - Enhanced goals, subs, and cards management tables to display both period clock time (`P2 09:52`) and match minute.
  3. **Verification**:
     - Updated `src/components/game/__tests__/gameManageTimeResolution.test.ts` with comprehensive unit tests for Period 1, Period 2 with halftime break and stoppage delays, fallback behavior without timestamps, and roundtrip bidirectional fidelity.
     - `npx tsc --noEmit` passed with 0 errors.
- **Modified Files**:
  - `src/lib/utils/dateTimeUtils.ts`
  - `src/components/game/GameManageClient.tsx`
  - `src/components/game/__tests__/gameManageTimeResolution.test.ts`
  - `updates.md`

### [2026-10-11 12:45] Fix Goal Recording Flow & Stoppage Modal Auto-Reopen Collision
- **Type**: Bug Fix / UX / Event Management
- **Summary**:
  1. **Root Cause Analysis**:
     - When recording a goal (or card) with the clock stopped or `autoStopClockOnMajorEvent` active, `handleGoalSubmit` created an optimistic major event record with `clock_should_run: 0` and `end_time: null`.
     - In [`LiveGameTrackerClient.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/LiveGameTrackerClient.tsx), an effect auto-reopening the stoppage modal on reload did not check `event_type === "stoppage"` and listened directly to mutations in `game.gameEventsMajor`. Consequently, right after `handleGoalSubmit` called `onClose()`, the effect detected the newly added goal, interpreted it as an active stoppage, and immediately reopened `MajorEventModal`.
     - Reopening the modal triggered its form reset effect, clearing all selected dropdown inputs in front of the user.
     - Furthermore, `activeStoppage` in [`MajorEventModal.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/live/MajorEventModal.tsx) also lacked an `event_type === "stoppage"` check, causing the modal to render a "Cancel Stoppage" button. When the user clicked "Cancel Stoppage", it executed `deleteEvent(activeStoppage.id, "major")`, which cascadingly wiped out the goal.
  2. **Stoppage Scoping & Re-Open Guards**:
     - In [`LiveGameTrackerClient.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/LiveGameTrackerClient.tsx), scoped the stoppage check strictly to `s.event_type === "stoppage"` and guarded it with `hasCheckedActiveStoppageRef` to run only once on initial mount/page reload rather than on every event mutation.
     - In [`MajorEventModal.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/live/MajorEventModal.tsx), strictly scoped `activeStoppage` and `handleCancelStoppage` to `s.event_type === "stoppage"`, ensuring goals, cards, and penalties can never be misidentified or deleted as stoppages.
     - Updated `handleEndStoppageAndResume` in [`MajorEventModal.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/live/MajorEventModal.tsx) to execute and confirm queued pending subs safely even if no active stoppage entity is present.
     - Added immediate feedback toasts on goal and card submissions (`toast.success`).
  3. **Clock Stoppage Integrity in Scoreboard**:
     - In [`BroadcastScoreboard.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/live/BroadcastScoreboard.tsx), updated `handleDefaultToggleClock` to end all unended stoppage windows for the active period when resuming the clock.
  4. **Verification**:
     - `npx tsc --noEmit` passed with 0 errors.
     - All 26 Vitest test suites (100 tests) passed with 100% success.
- **Modified Files**:
  - `src/components/game/LiveGameTrackerClient.tsx`
  - `src/components/game/live/MajorEventModal.tsx`
  - `src/components/game/live/BroadcastScoreboard.tsx`
  - `updates.md`

### [2026-10-11 10:00] Team Competition Leaf Node Scoping & Errant Tournament Root Enrollment Cleanup
- **Type**: Bug Fix / Data Integrity / Query Architecture
- **Summary**:
  1. **Root Cause Analysis**:
     - Team 121 (`U12 (2014/15) Williamson Girls Elite`) had an errant legacy enrollment (ID 247) in Node 107 (`One Knox Collective Cup (Tournament)`, level 0 root node), which was created prior to division subnodes being established.
     - When schedule games were imported, all 8 teams were enrolled into Node 109 (`U11/U12 Girls Yellow`, level 2 division subnode), with team 121 receiving enrollment ID 252.
     - `getLeaguesForTeamSeason` in [`queries.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/data/queries.ts) grouped by `leagueId` and processed enrollments in ID order. Because enrollment 247 had a lower ID than 252, it selected Node 107 (where no other teams were enrolled) and discarded Node 109.
     - Consequently, the team page listed `One Knox Collective Cup` with no other opponents/standings, and `/leagues/10` showed Node 107 as an empty standalone division with only team 121.
  2. **Database Cleanup**:
     - Deleted errant root enrollment 247 from `team_league_enrollments`. Team 121 is now enrolled cleanly into Node 109 (`U11/U12 Girls Yellow`) alongside all other 7 teams in the division.
  3. **Architectural Leaf Node Scoping Enforcement**:
     - Updated `getLeaguesForTeamSeason` in [`queries.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/data/queries.ts) to sort and prioritize terminal leaf subnodes (`other_league_nodes.length === 0`) and deeper `level` nodes, ensuring playable divisions always take precedence over parent container nodes.
     - Updated `getLeagueNodeSeasons` in [`queries.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/data/queries.ts) with `leafOnly = true` default (`other_league_nodes: { none: {} }`), preventing parent category nodes (like Tournament roots and Gender nodes) from generating extraneous divisions or false standings tables on league pages.
  4. **Verification**:
     - Added unit test in [`leagueNodeHierarchy.test.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/actions/__tests__/leagueNodeHierarchy.test.ts) verifying leaf subnode sorting and precedence.
     - `npx tsc --noEmit` passed with 0 errors.
     - All 26 Vitest test suites (100 tests) passed with 100% success.
- **Modified Files**:
  - `src/lib/data/queries.ts`
  - `src/lib/actions/__tests__/leagueNodeHierarchy.test.ts`
  - `updates.md`

### [2026-10-11 09:47] League Node Hierarchy Chaining & Parent Node Selection in Importer
- **Type**: Bug Fix / Feature / Admin Importer
- **Summary**:
  1. **Fixed Database Records for One Knox Collective Cup (League 10)**:
     - Relinked Node 108 (`Girls`) to `parent_id = 107` (One Knox Collective Cup Tournament root node) with `level = 1` and `node_type = 'gender'`.
     - Relinked Node 109 (`U11/U12 Girls Yellow`) to `parent_id = 108` (`Girls`) with `level = 2` and `node_type = 'division'`.
  2. **Enhanced Server Action `createInlineLeagueNode`**:
     - Added optional `parentId?: number | null` parameter.
     - Automatically resolves `parentId` whether passed as `league_nodes.id` or `league_node_seasons.id`.
     - Automatically infers and defaults to the league's root tournament node (`level = 0, parent_id = null`) when no parent is specified for tournament leagues.
     - Added support for hierarchy path strings separated by `>` or ` / ` (e.g. `Girls > U11/U12 Girls Yellow`), sequentially building or finding each level and preserving slash-delimited age groups like `U11/U12`.
     - Automatically infers `node_type` (`gender`, `age_group`, `group`, `division`, `tournament`) and increments `level` from parent node.
     - Returns leaf node details and `allNodes` array for instant client state synchronization.
  3. **Batch Importer Client Modal & UI Improvements ([`BatchImporterClient.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/admin/BatchImporterClient.tsx))**:
     - Added `Parent Node (Nests Under)` selector inside the Create Node modal, populated with full breadcrumb paths of existing nodes in the selected league.
     - When opening the modal, preselects the active `leagueNodeId` (or the tournament's root node if none is selected).
     - Automatically chains subsequent subnode additions by setting `newNodeParentId` to the newly created node upon submission.
     - Implemented `isCreatingNode` loading state with disabled buttons and `"Creating Node..."` label per Rule 1 & Rule 10.
     - Replaced raw `<input>` with UI primitive `Input` from `@/components/ui/Input`.
     - Updated `BatchImporterClientProps` to include complete node metadata (`leagueNodeId`, `parentId`, `nodeName`, `level`).
  4. **Verification**:
     - Added unit tests in [`leagueNodeHierarchy.test.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/actions/__tests__/leagueNodeHierarchy.test.ts) validating path splitting and node type inference.
     - `npx tsc --noEmit` passed with 0 errors.
     - All 26 Vitest test files (99 tests) passed with 100% success.
- **Modified Files**:
  - `src/lib/actions/league-actions.ts`
  - `src/components/admin/BatchImporterClient.tsx`
  - `src/app/(mainAppLayout)/admin/importer/page.tsx`
  - `src/lib/actions/__tests__/leagueNodeHierarchy.test.ts`
  - `updates.md`

### [2026-10-11 09:17] Upcoming Sub Toast Removal, In-Game Plus/Minus Recalculation Fix, and NFHS Default Auto Clock Pause
- **Type**: Bug Fix / Feature / Game Tracking Integrity
- **Summary**:
  1. **Removed Upcoming Sub Toast Notification**:
     - Removed the intrusive `toast.info` prompt when creating an upcoming sub in [`LiveGameTrackerClient.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/LiveGameTrackerClient.tsx) so subs queue cleanly without popup spam.
  2. **Fixed In-Game Plus/Minus Calculation**:
     - **Root Cause**: `game_events_goals` records do not contain a direct `game_time` column in the database (stored on `game_events_major`), which caused `goal.game_time` to evaluate to `undefined` (or 0). As a consequence, `isPlayerOnFieldAtTime` was evaluated at $T=0$, where no subs had taken place, meaning only starters were ever credited/debited and bench players on the field were ignored.
     - **Resolution**:
       - Fixed [`gamePlayerTimeStore.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/stores/gamePlayerTimeStore.ts) `calculatePlusMinus` to reliably resolve goal game time via `goal.game_time` or the linked major event `gameEventsMajor.find(m => m.id === goal.major_event_id).game_time`.
       - Excluded player position swaps (`is_swap`) from field entry/exit events in both `isPlayerOnFieldNow` and `isPlayerOnFieldAtTime`.
       - Ensured subs occurring at a goal's stoppage timestamp take effect for play following the goal, accurately attributing +/- to the players on the field when the goal was scored.
       - Enriched optimistic goals in [`MajorEventModal.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/live/MajorEventModal.tsx) and [`gameStore.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/stores/gameStore.ts) with `game_time` and `period`.
       - Triggered instant plus/minus recalculation upon sub confirmation in [`gameSubsStore.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/stores/gameSubsStore.ts) and event modifications in [`gamePlayersStore.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/stores/gamePlayersStore.ts).
       - Fixed `TABLE_ID_COLUMNS` for `v_game_events_goals_complete` (`goal_id`), `v_game_events_discipline_complete` (`discipline_id`), and `v_game_events_penalties_complete` (`penalty_id`) in `src/app/api/[tableName]/route.ts`.
  3. **Default Auto-Pause Clock on Major Events to False (Except NFHS)**:
     - Configured `autoStopClockOnMajorEvent` in [`gameStore.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/stores/gameStore.ts) `DEFAULT_GAME_SETTINGS` to `false` and `clockRuleProfile` to `"USSF"`.
     - In [`gameRules.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/utils/gameRules.ts) `inferRulesFromNodeName`, [`gameStore.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/stores/gameStore.ts), and [`queries.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/data/queries.ts), default `autoStopClockOnMajorEvent` to `false` unless the division/league rules explicitly specify NFHS or High School.
     - Updated [`MajorEventModal.tsx`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/game/live/MajorEventModal.tsx) `stopClock` state to initialize dynamically based on `game.settings.autoStopClockOnMajorEvent`.
  4. **Testing & Verification**:
     - Created comprehensive test suite in [`gamePlusMinus.test.ts`](file:///c:/Users/decor/Development/general_soccer_app_v4/src/stores/__tests__/gamePlusMinus.test.ts) covering starters subbed out early, non-starters subbed in, full match starters, unused subs, and NFHS rule inference.
     - `npx tsc --noEmit` passed with 0 errors.
     - All 25 Vitest test files (95 tests) passed with 100% success.

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
