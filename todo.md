# Soccer App v4 — Master Todo

> Cross-referenced with [blueprint.md](file:///c:/Users/decor/Development/general_soccer_app_v4/blueprint.md)

---

## Step 1: Foundational Stability & Core Bugfixes

[x] On public page. Select Team Season needs to show more than the team name as many teams may have the same name. Will need club etc.
[x] The Select League should only show any league that team is in. If the team is not selected, show all available leagues.
[x] Add a filter for club, high school, etc.
[x] I am going to start adding more teams like FIFA, or MLS — will need to be sure the schema allows for it
[x] The game results card should show a different color for a loss vs a win
[x] In team overview, the winning percentage should be wins + 1/2(draws) / total games. If the game is not completed, it should not count in the stats
[x] In league nodes, I need the ability to add nodes or rearrange nodes. There may be nodes for gender/age, division, subdivision(s)
[x] Add guest player management page allowing bulk assignments, filtering roster players by club/team/age/search, date-range filtering games, and safe removal
[x] In Locations admin, I need to be able to add/crud sublocations
[x] In clubs, I need to be able to crud teams
[x] Restructure routes: move Clubs & Teams CRUD to /admin/clubs and Staff Assignments/Roles CRUD to /admin/club-staff, updating links and actions
[x] In standings, we need filters we can send in the url showing specific division etc. Page should reflect those filters on load
[x] When creating games, we need settings for period length, overtime rules, shootout rules — defaulting from age group/league/tournament with per-game overrides
[x] In the game management page, we need to be able to change the settings of that game
[x] Fix 500 error on POST for player*games when navigating to a game stats page with no stats yet (duplicate key handling + route.ts error catching)
[x] Redirection integrity: preserve original navigation targets when prompting users to log in (callback URL tracking in middleware) *(blueprint §5.1)\_

[x] **1.1 Table Label Display Mismatch** _(blueprint §5.2)_ — When editing an entity's `select` fields, the data table incorrectly shows the raw FK id (e.g. `2`) instead of the human-readable label (e.g. "TSSA"). Fix: merge `displayPatch` (containing display labels) into the table's active state in [EntityPage.tsx](file:///c:/Users/decor/Development/general_soccer_app_v4/src/components/entities/EntityPage.tsx) instead of raw `formData`.

[x] **1.2 Homepage → Dashboard Smart-Redirect** — Unauthenticated guests see the public match center at `/`; authenticated users are auto-redirected to `/dashboard`. Fix: add session check to [page.tsx](<file:///c:/Users/decor/Development/general_soccer_app_v4/src/app/(mainAppLayout)/page.tsx>).

[x] **1.3 Dev & Admin Role Selector Persistence** _(blueprint §2.2, §5.3)_ — Active view-switching cookies should dynamically update navigation menus and filter DB queries based on the simulated role. Specifically: `getServerAuthSession` must resolve override cookie configs to modify active permissions so Admins/Club Admins can view the app as Coach/Team Admin/Player/Parent.

[x] **1.4 Standings Page Infinite Render Bug** — Standings page is currently stuck in an infinite render loop. Investigate and fix render cycle.

---

---

[x] On roster view in team page, default to table layout instead of cards
[x] Add player avatar/photo placeholder on roster cards view
[x] Chronological schedule sorting (oldest at top -> recent -> upcoming), divider line for upcoming games, and grayed out cards for past matches (excluding today's matches)

## Step 2: Public View — Teams, Schedules & Standings

[x] **2.1 Public Leagues & Standings Pages** _(blueprint §4, route: Public Standings & Game Details)_

- Create `/leagues` view listing active leagues/divisions
- Create dynamic route `/leagues/[leagueId]` rendering the division standings table
- Write Prisma query helper in [queries.ts](file:///c:/Users/decor/Development/general_soccer_app_v4/src/lib/data/queries.ts) to calculate standings dynamically: W (3 pts), D (1 pt), L (0 pts), GF, GA, GD
- Respect `game_standings_inclusions` flag — only count games where this flag is set _(blueprint §1.3)_

[x] **2.2 Public Team Detail Pages** ([teams/[teamSeasonId]/page.tsx](<file:///c:/Users/decor/Development/general_soccer_app_v4/src/app/(mainAppLayout)/teams/[teamSeasonId]/page.tsx>))

- Render full team rosters (jersey numbers, player names)
- Show detailed schedules (past results and future fixtures)
- Display player stats tables (Goals, Assists, Cards, Clean Sheets)

## Step 3: Player & Parent Dashboards (Assigned Access Only)

_(blueprint §2.1 — roles: PLAYER, PARENT)_

[x] **3.1 Restricted Dashboard Rendering**

- Limit query results in `/dashboard` based on resolved JWT token lists (`roles.playerTeamIds`, `roles.parentTeamIds`)
- Personalized calendar showing upcoming matches and practice events
- Player view: own performance metrics and match results

[x] **3.2 Parent Dashboard** _(blueprint §1.2 — `player_relationships`)_

- Use `player_relationships` table to link parent users to their child players
- Parent view shows child player roster stats, schedule, and staff contacts
- Ensure `player_relationships` CRUD exists in admin (Parent/Guardian mapping to players)

---

## Step 4: Coach & Team Admin Controls

_(blueprint §2.1 — roles: COACH, TEAM_ADMIN, CLUB_ADMIN)_

[x] **4.1 Team Roster Adjustments** _(blueprint §4, route: Roster & Staff Management)_

- Add players to a team roster (`player_teams`)
- Edit player jersey numbers & positions
- Add/remove team staff (head coach, assistant, stats keeper)
- Location: `/dashboard/roster` or integrated into `TeamPageClient` for authorized coach roles

[x] **4.2 Game Scheduling & Venue Booking**

- Add new matches with date, time, opponent, location, and sublocation
- Prevent double-booking warning indicators on fields/venues
- Location: server actions + scheduling modals

[x] **4.3 Team Name Formatting & Display Hook** _(promoted from future considerations / blueprint)_

- Reusable hook/utility to construct standardized team display names (e.g. Club Name + Team Name in long vs. short abbreviation formats across all tables/cards)

[x] **4.4 Quick Score Entry & Standings Inclusions Toggle** _(promoted from future considerations)_

- Simple score entry page/modal for quick match results (home/away score, status update to completed)
- Toggle UI for `game_standings_inclusions` per game to control if match counts in league standings

---

## Game Scheduling

[x] It currently assumes the team scheduling is home. that is wrong, we need to be able to select the opponent then select if the team scheduling is home or away (toggle component).

[x] It currently assumes the team scheduling is home. that is wrong, we need to be able to select the opponent then select if the team scheduling is home or away (toggle component).

[x] It currently assumes the team scheduling is home. that is wrong, we need to be able to select the opponent then select if the team scheduling is home or away (toggle component).
[x] if the game is a league, we need to know which league it is, this is missing from the game details. The game could count for more than one (for instance a tournament game counts as a tournament but also a separate league game)
[x] if the league is not listed, we need to either assign the team to the league or create a new league if needed.
[x] if the league is not listed, we need to either assign the team to the league or create a new league if needed.
[x] if the league is not listed, we need to either assign the team to the league or create a new league if needed.
[x] the same for the tournament
[x] if the game is a playoff, we still need to know which league/tournament (Playoff games default to not counting in standings, with toggle to override).
[x] opponent should allow for new team (allows selecting Club -> Team with inline modal to add new Club or Team if needed).
[x] same for Location if not listed (+ Add Location inline modal).
[x] same for the field (+ Add Field inline modal).
[x] time should allow for different time zones (EST, CST, MST, PST, UTC timezone selector).
[x] the game should also have settings. (Game Rules & Duration Overrides tab for periods, period length, overtime, and shootout rules).
[x] Multi-tab wizard UI utilizing TabbedPanel to step through Teams, Competitions, Schedule & Venue, and Game Rules.
[x] Component consistency audit: replaced all browser native confirm() calls with custom Dialog component; standardized DateSelect (MM/DD/YYYY) and 12-hour AM/PM time formatting across modals.
[x] On guest player assignment, players already assigned as guests for selected games are badged with an "Assigned Guest" pill badge, and roster players are filtered.
[x] Fixed foreign key constraint violation in recordQuickScore when upserting game_standings_inclusions by resolving league_node_seasons.league_node_id.
[x] Created Teams & Schedule Batch Importer (/admin/importer) allowing batch CSV/text imports for teams, clubs, and match schedules with automatic deduplication.

---

## Step 5: Advanced Live Match Operations & Offline Engine

_(blueprint §1.4, §4, §5.5 — intense tracking module)_

[x] **5.1 Match Statistics Logger (Live Game Tracker)**: Built live game tracker at `/gamestats/[teamSeasonId]/[id]/live` featuring period clock controls, quick action bar (+GOAL, SUB IN/OUT, CARD, CORNER, OFFSIDE, +GUEST), on-field vs bench rosters, micro-player stats (shots, saves, fouls), and team events.
[x] **5.2 Offline-Capable Logging & Synchronization Engine**: Implemented `src/lib/offline/offlineSync.ts` with LocalStorage/IndexedDB action queueing, offline status badge indicator, and automatic background flush on network reconnection (`window.addEventListener("online")`).
[x] **5.3 Guest Player In-Game Assignment**: Support for adding guest players directly within the live match tracker with temporary jersey numbers.
[x] **Design System Overhaul**: Redesigned Game Menu dashboard, Game Status Card, Match Config Card, and Game Action Cards to match app design system (`Card`, `Button`, `Modal`, `Select`, `Input`, `Checkbox`, `Dialog`, CSS design tokens).

## Step 5.4: Live Match Tracker Refinement & Tablet Optimization

We will overhaul the live tracking workspace at `/gamestats/[teamSeasonId]/[id]/live` utilizing core logic from `liveOld` and our new design system:

- [x] **Tablet Vertical-First Layout**: Redesign the live match layout to optimize vertical screen real-estate on tablets (using tight grids/panels, avoiding layout overflow, and supporting collapsible stats panels).
- [x] **Real-Time Playing Times & Action Stats**:
  - Integrate `useGamePlayerTimeStore` to display live playing time (total minutes played and current shift/bench time) next to each player.
  - Display derived match action summaries (shots, saves, goals, assists, yellow/red cards, plus/minus) dynamically on the on-field/bench cards.
- [x] **Roster & Lineup Validation**: Add gatekeeping checks on loading the live tracker; redirect to `/lineup` if the count of starters/goalkeepers doesn't match rules settings, or redirect to `/summary` if the game is already ended.
- [x] **Stoppage Clocks & Automatic Stops**: Implement auto-stoppage triggers when recording key actions that pause/resume the game periods and track stoppage duration.
- [x] **Quick Action Subscriptions & UI Auditing**: Convert modals, event logs, dialogs, and loaders to use standard UI system components with proper input validation.
- [x] **Vertical-Friendly Click-to-Sub Panel**: Replace complex drag-and-drop actions with a streamlined double-tap/click workflow to swap bench players onto the field quickly.
- [x] **No Scroll Screen Layout**: Tighten layout elements to fit entire dashboard screen on tablets without scrolling.
- [x] **Colored Broadcast Scoreboard**: Styled the header with a dark indigo premium gradient, placed larger scores on either side of a large match game clock, and added contextual controls.
- [x] **Wide Split Column Layout (Left-Right Split)**:
  - Left Column (70%): Wide, comfortable layout displaying stacked tables for Goalkeepers, Field Players, and Game Changers (Bench Reserves) to prevent clipping.
  - Right Column (30%): Stacked sidebar panel containing Team Counters, Recent Events feed, and the Upcoming Substitutions queue.
- [x] **Goalkeeper Separation**: Separated the goalkeeper into their own table section displaying goalie-specific stats: Saves (Sv) and Goals Against (GA).
- [x] **Tailored Stat Columns**:
  - Removed the position column across all tables.
  - Field Players track: Shots, Goals, Assists, +/-, total time, shift time.
  - Goalkeepers track: Saves, GA, +/-, total time, shift time.
  - Bench Reserves track: Shots, Goals, Assists, +/-, total time, bench time.
- [x] **Enlarged Touch Targets**: Enlarged all row actions (Sub In/Out, SHOT, SAVE) to larger standard buttons for touch-friendly tablet coaching.
- [x] **Unified Event Modal**: Consolidated Goal, Card, and Stoppage events into a single "Record Major Event" modal.
- [x] **Pending Sub Queue Routing**: Configured row clicks and Sub buttons to route swaps to the upcoming sub queue.
- [x] **Card Visual Badges**: Renders small visual yellow/red rectangle indicators next to player names for active cards.
- [x] **Red Card Enforcement**: Grayed out sent-off players (red carded or 2 yellow cards) and disabled their micro-action / sub buttons, showing an explicit "SENT OFF" status.
- [x] **Dynamic Panel Heights**: Configured the On-Field players table to size naturally (`shrink-0`) to fit all rows with no scrolling, moving the Game Changers (Bench) table down cleanly and allowing it to occupy the remaining vertical height with scroll support.
- [x] **Score Neutral Colors**: Removed colors from the score digits, leaving them as plain high-contrast bold white.
- [x] **Player Row Alignment**: Placed player name and jersey number columns level/vertically aligned.
- [x] **Instant Upcoming Queue (No Lag)**: Configured in-memory state updates for pending subs so they appear in the queue instantly without forcing a screen refresh.
- [x] **Single-Line Queue Formats**: Configured pending substitutions to display on a single line showing player names (`Out: [Player] 🔄 In: [Player]`).
- [x] **Event Deletion Feed Controls**: Added delete buttons next to entries in the Recent Events feed, requiring an inline confirmation ("Yes/No") block to delete.
- [x] **Card Visual Badges**: Fixed type conversion in ID filters to display yellow and red card badges next to player names.
- [x] **Action Refresh Prevention**: Modified loader to prevent background data syncs from unmounting the page and flashing a loading screen.
- [x] **Expanded Team Counters**: Increased height of Team Counters card to `165px` to fit all three rows.
- [x] **Scrollable Reserves**: Verified and tested the reserve scrollbars to function correctly under long bench lists.
- [x] **Sidebar Stacking Refinement**: Stacked Upcoming Subs as the primary flex container (`flex-1`) and capped Recent Events to a shorter `160px` card.
- [x] **Duplicate Sub Mitigation**: Added synchronous selections cleanup inside the queueing effect to prevent duplicate database writes during concurrent React updates.
- [x] **Break Live Game Page into Components**: Extracted 8 modular subcomponents (LineupValidationBanner, BroadcastScoreboard, OnFieldPlayersPanel, BenchReservesPanel, TeamCountersPanel, UpcomingSubsPanel, RecentEventsPanel, MajorEventModal) into `src/components/game/live/` with dedicated Vitest unit tests for each component.
- [x] **Unified Live Player Table**: Created shared `LivePlayerTable` for Goalkeepers, Field Players, and Bench Reserves with compact `py-0.5 px-1.5` padding, fixed row heights, and instant pending sub colors.
- [x] **Collapsible Operations Sidebar**: Added hamburger button to `BroadcastScoreboard` header that opens `LiveNavigationDrawer` for quick access to Lineup Roster (`/lineup`), Game Rules (`/settings`), Management (`/manage`), and Summary (`/summary`).
- [x] **Pending Sub Editing & Multi-line Cards**: Added Edit button & modal to `UpcomingSubsPanel` and formatted pending sub items into 2 lines so player names are never cut off.
- [x] **Disappearing Player Sub Bug Fix**: Modified `calculateFieldStatus` in `gamePlayersStore` so pending subs do not alter `fieldStatus` to `subbingIn`/`subbingOut`. Players remain in their respective table until confirmed.
- [x] **Team Counter 500 Null Fix**: Resolved `Column 'team_season_id' cannot be null` error by deriving `ourId` and `oppId` from route params and fallback game properties with NaN guards.
- [x] **Eligible Player Game Roster Filtering**: Filtered On-Field and Bench tables to only include eligible active players (`starter`, `goalkeeper`, `dressed`), excluding non-playing statuses (`injured`, `not_dressed`, `suspended`, `unavailable`).
- [x] **User Dashboard Team Navigation**: Added direct links and primary "Go to Team Dashboard" action buttons to active team cards and dropdowns on the User Dashboard (`/dashboard`).
- [x] **Enhanced Major Event Recording Modal**:
  - **Immediate Pop-up & Icon Buttons**: Instant modal tabs for `Goal ⚽`, `Card 🟨`, `PK 🎯`, `Injury 🚑`, `Weather ⚡`, `VAR 📺`, `Other Stoppage ⏸️`.
  - **Auto Clock Pause & Live Time Header**: `autoStopClockOnMajorEvent` game setting (High School rules) with live clock header (`12:34`) and instant Pause/Resume clock control.
  - **Strict On-Field Scoping**: Scorer, Assist, and PK Taker dropdowns for "Our Team" strictly list on-field players only and bi-directionally exclude selecting the same player for Scorer and Assister.
  - **Goal Methods & Opponent Jersey Inputs**: Method checkboxes (`Corner`, `Direct Free Kick`, `Indirect Free Kick`, `Throw-In`, `Header`, `Volley`, `Open Play`), `Own Goal` toggle, and optional jersey number inputs for opponent goals/cards.
  - **Penalty Kick Workflow & Rebound Stoppage**: PK taker on-field filtering, outcome buttons (`Goal`, `Saved`, `Missed`, `Hit Post`), rebound goal follow-up option, and automatic transition to kickoff stoppage.

- [x] **Complete Multi-Table Cascade Event Deletion**:
  - Enhanced `deleteEvent` in `gameStore` to find and delete ALL linked parent and child records (`game_events_major`, `game_events_goals`, `game_events_discipline`, `game_events_penalties`) across database tables and Zustand state simultaneously.
  - Canceling or deleting any major event or stoppage removes all traces of it as if it never happened.
  - Filtered linked major events out of `RecentEventsPanel` to eliminate duplicate stoppage feed entries for logged goals and cards.
- [x] **In-Event Substitutions, Immediate Execution & Exhausted Filtering**:
  - Rendered substitution widget across all major event tabs (`Goal`, `Card`, `PK`, `Injury`, `Weather`, `VAR`, `Stoppage`).
  - Added dual actions for selected players: `[Enter Sub Now ⚡]` (executes sub immediately during stoppage) and `[Queue for Restart]` (queues sub for restart).
  - Added per-item `[Execute Now ⚡]` and `[Delete 🗑️]` buttons to queued pending subs list.
  - Enforced exhausted player filtering on `Player IN` dropdown (excludes players who reached re-entry limit under active sub rules) with an optional `"Include Exhausted Players (Override)"` checkbox.
- [x] **Match Administration In-Game Adjustments & Multi-Select Deletion**:
  - Added full event editing for Goals, Substitutions, and Disciplinary Cards with modal pre-population and `PUT` persistence.
  - Added checkboxes on every event item, "Select All" header toggles, section-level "Delete Selected (N)" buttons, and a floating bulk deletion banner.

## Step 6: Verification & Automated Tests

[x] Run automated Next.js build compilation and fix any type/compile errors
[x] Verify navigation redirects and role switches work correctly
[x] Verify all 6 role types (Admin, Club Admin, Team Admin, Coach, Parent, Player) render correct data scopes _(blueprint §2.1)_

---

## Step 7: Seasons Lifecycle & Age Group Associations

- [x] **7.1 Seasons & Age Group Association (Admin Lifecycle)**
  - [x] View associated age groups on season list/detail page in admin
  - [x] On Season Create: automatically borrow/check previous season's age groups by default with checkboxes to select/unselect all available age groups
  - [x] On Season Edit: view and update age group associations for the season
  - [x] Backend API / Prisma query updates to persist season-age group links

## Step 8: Season-Specific Clubs, Teams & Player Rollover Engine

- [x] **8.1 Team Archiving & Season Context**
  - [x] Season completion handler: archive team season records (rosters, schedules, staff assignments) while maintaining historical stat integrity
  - [x] Ensure season selector in header switches context to past archived seasons seamlessly
- [x] **8.2 Player Rollover & Transfer Tool**
  - [x] Create next-season team initialization workflow (blank roster & schedule)
  - [x] Build player rollover UI allowing bulk selection and migration of roster players from past season teams to new season teams

- [x] **8.3 Season Completion & Automated Next-Season Setup Prompt**
  - [x] When marking a season as completed in Admin, prompt to activate the upcoming season
  - [x] Automatically archive completed season's team records (`is_active = false`)
  - [x] Create blank new `team_seasons` for the new active season based on the age groups associated with the season
  - [x] Provide direct link/redirect to the Player Rollover Tool to populate new teams

## Step 9: Player Profile Season Stats Integration

- [x] **9.1 Player Profile Season Filtered Stats**
  - [x] Update player profile stats queries to filter goals, assists, cards, clean sheets, and minutes played strictly by active/selected season
  - [x] Display historical career stats breakdown per season

## Step 10: Season-Aware Data Importer & Schema Mapping

- [x] **10.1 Importer Target Season Selector**
  - [x] Add season selection dropdown to `/admin/importer` to scope all imports
- [x] **10.2 Robust CSV Entity Mapping & Field Validation**
  - [x] Build field mapping preview for Teams, Clubs, Roster Players, and Games with explicit Required vs Optional badges
  - [x] Handle target table/column insertion and error reporting for invalid/missing rows

- [x] **8.4 Rollover Source & Target Season Scoping & Multi-Source Merging**
  - [x] Scope source team selection to previous/completed season teams
  - [x] Scope target team selection to new/active season teams
  - [x] Allow multi-source selection to merge rosters from multiple past teams into target team
- [x] **10.3 Target Team Selection for Roster Import & Strict Deduplication**
  - [x] Allow selecting target team first from dropdown to simplify CSV parsing (First Name, Last Name...)
  - [x] Strict player & roster deduplication (skip existing enrolled players)
- [x] **10.4 Schedule Import Game Play Type Prompt**
  - [x] Prompt for game play type (League Play, Tournament Play, Friendly, Playoff) during schedule import
- [x] **10.5 Top Target Team Selector & CSV File Upload Support**
  - [x] Prominently display Target Team dropdown at top header before import (enforcing Club/Team columns in CSV if unselected)
  - [x] Support native `.csv` file upload (`<input type="file">` & FileReader) alongside paste text
- [x] **10.6 Interactive CSV Column Mapper Tool & Skip Unused Columns**
  - [x] Visual column mapping tool allowing user to assign CSV columns to target database fields or set to `(None / Skip Field)`
  - [x] Smart heuristic auto-detection for First Name, Last Name, Email, Jersey #, Position, Grade, Club, Team, Location
- [x] **10.7 Dual Player & Parent Relationship Import System**
  - [x] Auto-map Player (`player_first_name`, `player_last_name`, `gender` [Required], `number` [Jersey #], `position`, `grade`, `birth_date`)
  - [x] Auto-map Optional Parent 1 & Parent 2 (`parent1_first_name`, `parent1_last_name`, `parent1_email`, `parent1_mobile_number`, `parent2_*`)
  - [x] Create parent `people` records and link to players via `player_relationships` model (`relationship: Parent`)
- [x] **11. Dynamic Match Format (5v5, 7v7, 8v8, 9v9, 11v11) & Starter Max Limit Engine**
  - [x] Configure Match Format / Players on Field (`playersOnField` e.g. 5v5, 7v7, 8v8, 9v9, 11v11) in Game Settings
  - [x] Dynamic Lineup Manager STARTER limit set to `playersOnField` max (e.g. 9 for 9v9, 7 for 7v7, 11 for 11v11)
  - [x] Dynamically calculate required field players and goalkeeper requirements in lineup footer and status sections
- [x] **11.4 Sublocation & Field Complex Display on Schedule Cards**
  - [x] Render sublocation name alongside location (e.g. `Harpeth Hall (Field #2)`) on team schedule cards
  - [x] Fix sublocation initialization & persistence in Edit Game Modal
- [x] **11.5 Fix 404 Route & Netlify App Router Configuration for `/gamestats/[teamSeasonId]/[id]`**
  - [x] Resolve invalid fallback route redirect (`/games` -> `/teams/${teamSeasonId}`) in `GameProvider.tsx`
  - [x] Remove static `publish = ".next"` override in `netlify.toml` and configure `@netlify/plugin-nextjs` for dynamic App Router routes
- [x] **11.6 Detailed Post-Game Match Event Logger & Stat Scoping Engine**
  - [x] Quick Score modal toggle between Simple Score and Detailed Match Event Logger
  - [x] Goal Logger: Scorer, Assist, Goalkeeper Conceded On, Minute, PK flag, Own Goal, Event Comment
  - [x] Discipline Logger: Card type (Yellow/Red), Player, Minute, Reason/Comment
  - [x] Team Totals: Shots, Saves, Corner Kicks, Fouls, Offsides for Home & Away teams
  - [x] Stat Scoping: Games without full lineup details exclude unplayed `minutesPlayed` and `plusMinus` while including logged goal/assist/card events in player season totals
- [x] **11.7 Period Duration Presets, Manual Entry & Mobile Input Fix**
  - [x] Preset duration buttons (25m, 30m, 35m, 40m, 45m; removed 20m & 60m) across Match Settings, New Game & Edit Game Modals
  - [x] Custom Manual Entry input field for any period duration in minutes
  - [x] Removed "4 Quarters" from period count options
  - [x] Fixed mobile input deletion bug where clearing digits forced immediate fallback and concatenated typed values (e.g. `435`)
- [x] **11.8 Workspace File & Dump Cleanup**
  - [x] Removed obsolete root database dump (`u676616277_stats_app (4).sql`) and unused root `proxy.ts` file

## Step 12: Upcoming Enhancements & Bug Fixes

- [ ] **12.1 Lineup Missing / Duplicate Jersey Number Resolution Modal**
  - [ ] Prompt user with a modal when players lack a jersey number during lineup selection, allowing them to assign jersey numbers for the match or permanently for the season

## Step 13: Live Match Reliability, Offline-First Engine & Coaching Workflow Upgrades

- [x] **13.1 Offline-First Game State Caching & Network Resilience**
  - [x] Cache game data, rosters, settings, and player times in `localStorage`/`IndexedDB` on initial load so page refresh or opening `/gamestats/...` with zero cell reception renders full tracker cleanly without 404/blank screen.
  - [x] Build offline testing mode toggle (simulates 0kbps no-internet environment for local testing).
- [x] **13.2 Instant Optimistic UI & Non-Blocking Goal/Stoppage Modal Save & Cancel**
  - [x] Update local state and close Goal/Major Event modal synchronously (0ms UI lag) on Save or Cancel, queueing server writes in background without hanging or blocking modal closure.
  - [x] Disable action buttons immediately upon tap + show instant visual loading state to prevent double-clicks.
- [x] **13.3 Flexible Goalkeeper & On-Field Position Swap Engine**
  - [x] Support complex GK substitutions: allow any bench or field player to move into Goalkeeper, with outgoing GK moving to field or subbing off to bench.
  - [x] Flexible player dropdown selector for position/role swaps on field.
- [x] **13.4 Live Action Playing Time vs. Stopped Clock & Inter-Period Pause Logic**
  - [x] Scope player minutes played strictly to live active clock seconds (`clockIsRunning === true`).
  - [x] Freeze playing time accumulation for both field and bench players during inter-period breaks, paused clock states, and major event stoppages.
- [x] **13.5 Hydration Break Stoppage & NFHS vs. USSF Clock Rule Profiles**
  - [x] Add Hydration Break 💧 tab to Major Event modal with duration tracker to calculate stoppage time at end of half.
  - [x] Differentiate NFHS (High School stopped clock on major events/goals) vs USSF (Club continuous running clock with added stoppage time calculation).

## Step 14: Match Stage Workflows (Pregame, Inter-Period Breaks & Postgame)

- [x] **14.1 Pregame & Inter-Period Simplified Workspaces**
  - [x] Restrict live match action buttons (Shot, Save, Corner, Foul, Offside, Record Major Event) strictly to active periods (`during_period`).
  - [x] Simplify pregame and between-period views to show game details, lineups, and game stats while preserving pending substitution management.
- [x] **14.2 Automatic Final Stage Navigation & Game End Workflow**
  - [x] Configure game stage manager to know the total scheduled periods (e.g. 2 halves + OT).
  - [x] Automatically navigate to the final game stats & summary page upon completing the final period.
- [x] **14.3 Period Transition Clock & Period Number Integrity**
  - [x] Ensure timed match clock remains stopped between periods.
  - [x] Fix period number tracking on period restart so starting the next period correctly increments the period number (e.g., Period 2 after Halftime instead of resetting to Period 1).

## Step 15: Event Recording & Live Tracker Polish

- [x] **15.1 Automatic Shot Creation on Goal**: Automatically log an accompanying `shot` action for the scoring player whenever a goal is recorded.
- [x] **15.2 Pending Sub Confirmation Prompt on Event Entry**: Prompt user whether to confirm pending substitutions when recording/saving major events.
- [x] **15.3 Optional Assister Selection & Clean Default Labels**: Remove explicit "Unassisted" selection options (making assister optional by default) and remove redundant "Select an Option" items from Scorer and Assister dropdowns.
- [x] **15.4 Instant Period Start Pending Sub Sync**: Apply pending substitutions synchronously on period start without waiting for database responses.
- [x] **15.5 Injury Stoppage Recording & Concurrent Sub Reliability**: Fix injury stoppage recording when substitutions are executed or queued concurrently during the stoppage event.
- [x] **15.6 Global Notification Audit (Error-Only Toasts)**: Remove non-error toasts for lineup changes, game/period starts, and general tracking actions, retaining toasts strictly for error alerts.
- [x] **15.7 Team Page 500 Route Error Fix (`/teams/122`)**: Resolve "Something went wrong" crash on public team page (`/teams/[teamSeasonId]`).
- [x] **15.8 Dev-Only Offline Test Mode**: Restrict offline testing toggle UI to development environment (`process.env.NODE_ENV === 'development'`).

## Step 16: League & Tournament Match Format & Standings Configurations

- [x] **16.1 League & Tournament Rules / Match Format Metadata**
  - [x] Store match format options (11v11, 9v9, 7v7, 5v5), period duration (e.g. 35m vs 40m), tiebreaker rules, and advancement criteria (group winner, top X teams) as JSON/text in `leagues`.
  - [x] Build configuration interface in Admin League Management (`/admin/leagues`).
- [x] **16.2 Standings Calculation & Seeding Engine Roadmap**
  - [x] Design future standings engine rules (points per win/draw/loss, shutout bonuses, max goal differential caps, group tiebreakers, and seeding).

## Step 17: Comprehensive Game Schedule Importer & Hierarchy Mapper

- [x] **17.1 Host Team Scoping (Default Team vs Neutral Schedule Imports)**
  - [x] Support importing game schedules assigned to a default host team OR importing neutral schedule batches across leagues/tournaments.
- [x] **17.2 Gender-First League Node Hierarchy Alignment**
  - [x] Enforce sub-node tree hierarchy order: **Gender** level above **Age Group** level above **Division / Group**.
  - [x] Migration script: Automatically reorganize existing node trees in DB to place Gender above Age Group across existing leagues & tournaments.
- [x] **17.3 Interactive Step-by-Step Entity Matching Wizard (Clubs, Teams, Locations, Sublocations)**
  - [x] Evaluate incoming schedule rows against DB clubs, teams, locations, and sublocations (fields).
  - [x] Build an Interactive Step-by-Step Wizard modal showing candidate matches with single-click mapping or "Create New Entity" buttons.
- [x] **17.4 Timezone Resolution & Header Auto-Detection**
  - [x] Prompt for default Time Zone in import header whenever timezone column is missing from import rows.
  - [x] Support mapping standard CSV/TSV headers (`Game#`, `Date`, `Time`, `Division`, `Field`, `Home`, `H Score`, `Away`, `A Score`, `Game Type`).

## Step 18: Summary Page Stats Polish & Keeper Time-in-Goal Fix

- [x] **18.1 Summary Player Minutes Played & +/- Display**
  - [x] Include `minutesPlayed` and `plusMinus` (+/-) on post-game summary player statistics tables.
- [x] **18.2 Separate Goalkeeper Stats & Time-in-Goal Calculation Integrity**
  - [x] Separate goalkeeper stats into a dedicated summary table (tracking shots faced, saves, clean sheets, and exact `timeInGoal`).
  - [x] Fix Game 877 issue where starting GK received zero/incorrect time in goal despite no goalkeeper substitutions being logged.

- [x] ON league/tournament schedule, let's use the grid/table option we use for rosters and schedule. Let's set default to table.
- [x] on the time clock, we need a button/toggle to show clock up clock down (scoreboard clock counts up like ifab or counts down like NFHS/NCAA). It also needs a button/toggle, for period time vs game time, remember these are scoreboard times, not actual. The default should be period, so we always know how much time is in/left in any period based on its start time.

## Step 19: Tournament Rules, Multi-Season Lifecycle & Season Navigation

- [ ] **19.1 Tournament Rules Modal Options on Batch Importer**
  - [ ] Expand inline "Create New League/Tournament" modal in Batch Importer (`/admin/importer`) to configure tournament-specific rules (Points per W/D/L, max goal diff cap, advancing teams count, group advancement rules).
- [ ] **19.2 Multi-Season League Lifecycle & Previous Season Team Import**
  - [ ] Support rollover of Leagues/Tournaments across seasons (`league_node_seasons`) and add a "Import Previous Season Teams" tool inside League Admin (`/admin/leagues`) to quickly re-enroll past season teams into the new season's league nodes.
- [x] **19.3 Knockout Placeholder Team Resolution Engine**
  - [x] Added `resolveKnockoutPlaceholders` action in `league-actions.ts` to calculate group rankings (pts, GD, GF) and parse placeholders (`Group A #1`, `Group B Winner`, etc.).
  - [x] Added `[⚡ Resolve Seedings]` button on tournament schedule views (`TournamentScheduleView.tsx`) to auto-populate knockout fixtures when group play completes.
- [ ] **19.4 Dynamic Season Navigation Context Sync**
  - [ ] Update global `SeasonSelector` & `TeamSelector` so that changing the active season dropdown automatically updates the current page route and refetches data for the newly selected season (mapping team/league routes e.g. `/teams/[teamSeasonId]` to the target season's equivalent ID).

## Step 21: Match Management Sub Editing & Box Score Cleanups

- [x] **21.1 NASA Tophat Tournament Record Cleanup**
  - [x] Verified database state and ensured single active NASA Tophat tournament record (`ID 7`).
- [x] **21.2 Match Edit Sub Player Resolution & Stale Pending Sub Cleanup (Game 881)**
  - [x] Converted player ID matching in `GameManageClient.tsx` sub rows & dropdowns to loose string comparisons (`String(playerGameId) === String(s.in_player_id)`) to fix "Unknown" player labels.
  - [x] Added automated pending sub status cleanup and store re-initialization on sub save/update to prevent phantom 12th player on field.
- [x] **21.3 Match Final/Summary Page Navigation Link**
  - [x] Added `[Edit Match Details & Clocks]` button to post-game summary header banner (`GameSummaryClient.tsx`) directing to `/gamestats/[teamSeasonId]/[id]/manage`.
- [x] **21.4 Box Score SOG Column Removal**
  - [x] Removed Shots On Goal (SOG) header and cell data from player box score summary tables.
- [x] **21.5 Schedule Location Cell Font & Sublocation Display**
  - [x] Refined location cell styling in `TournamentScheduleView.tsx` (`text-[11px] font-normal hover:underline`) and added sublocation formatting (`Location Name (Sublocation)`).

- [x] **22.4 Unplayed Games Exclusions & Actual Minutes Played Calculation**
  - [x] Implemented `calculatePlayerGameMinutes()` helper in `queries.ts` to strictly ignore unplayed games (`scheduled`, `cancelled`, `postponed`) from player stats (`gamesPlayed`, `gamesStarted`, `minutesPlayed`).
  - [x] Corrected minutes played calculation to compute exact on-field interval times based on actual match period durations instead of hardcoded defaults or counting future unplayed games.

- [x] **22.1 Master Score Reporting Filters & Season Default**
  - [x] Added Season selector (defaulting to current active season) and specific Tournament / League dropdown filter in `MasterScoreEntryClient.tsx`.
- [x] **22.2 Inline Batch Score Entry Mode**
  - [x] Added **`[⚡ Batch Quick Edit Scores]`** toggle to `MasterScoreEntryClient.tsx` allowing inline editing of scores with immediate UI state updates and a single **`[Save All Scores]`** batch action.
- [x] **22.3 Tournament Crossover Standings Calculation**
  - [x] Updated `getTeamSeasonRecords` in `queries.ts` so crossover matches against teams in other group nodes count towards enrolled teams' group standings.
- [x] **22.4 Major Event Modal & Select Dropdown UI Cleanups**
  - [x] Removed duplicate inline clock pause checkbox from `MajorEventModal.tsx`.
  - [x] Updated `Select.tsx` to automatically suppress generic `-- Select an option --` when customized placeholder options exist.
- [x] **22.5 Game Summary Box Score Minutes Played Calculation Fix (Game 882)**
  - [x] Updated `GameSummaryClient.tsx` to pass continuous absolute game time (`getGameTime()`) instead of single-period time (`getPeriodTime()`), ensuring full-match players (Bryn) and subbed-in players (Isabella, Georgia) accumulate accurate match minutes.

## Notes / Future Considerations

- Advanced live match stream / video link embeds (`games.video_link`)
- Historical season archiving and player career stats aggregation
- High school team player status management (available players, trying out, interested)
- Uniforms and numbers assignment tool
