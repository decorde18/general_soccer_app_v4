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

## Notes / Future Considerations

- Advanced live match stream / video link embeds (`games.video_link`)
- Historical season archiving and player career stats aggregation

