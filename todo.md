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

[ ] **4.1 Team Roster Adjustments** _(blueprint §4, route: Roster & Staff Management)_

- Add players to a team roster
- Edit player jersey numbers
- Add/remove team staff (head coach, assistant, stats keeper)
- Location: `/dashboard/roster` or integrated into `TeamPageClient` for authorized coach roles

[ ] **4.2 Game Scheduling & Venue Booking**

- Add new matches with date, time, opponent, location, and sublocation
- Prevent double-booking warning indicators on fields/venues
- Location: server actions + scheduling modals

[ ] **4.3 Match Statistics Logger (Live Game Tracker)** _(blueprint §1.4, §4 — route: Score Reporting / Event Logging)_

- Start/stop period clocks (`game_periods`: start/end/run-time per half or OT)
- Substitutions logger (`game_subs`: who in, who out, game minute, GK flag)
- Goal recorder (`game_events_goals`: scorer, assist, opposing GK, own-goal, type: header/free kick/penalty/etc.)
- Penalty shootout logger (`game_events_penalties`)
- Discipline logs (`game_events_discipline`: yellow/red card, reason, duration)
- Player micro-stats (`game_events_player_actions`: shots, saves, fouls — per player) _(blueprint §1.4)_
- Team-wide events (`game_events_team`: timeouts, team fouls) _(blueprint §1.4)_
- Location: game stats page / `/dashboard/games/[gameId]/edit`

[ ] **4.4 Offline-Capable Logging** _(blueprint §5.5)_

- Provide client-side logging helpers for coaches recording games in areas with weak cellular service
- Queue events locally and sync when connection is restored

---

## Step 5: Verification & Automated Tests

[ ] Run automated Next.js build compilation and fix any type/compile errors
[ ] Verify navigation redirects and role switches work correctly
[ ] Verify all 6 role types (Admin, Club Admin, Team Admin, Coach, Parent, Player) render correct data scopes _(blueprint §2.1)_

---

## Notes / Future Considerations

- For team names, consider a hook that combines club name + team name in long (full club) or short (abbreviation) format — consistent across the app _(blueprint mentions this as a display concern)_
- future: simple score entry page or detailed (goal scorer, assist, etc.) — when entered, game shows as completed
- future: guest player roster number — possibly a separate column if different from regular number, incorporated across all games they participate in
- future: `game_standings_inclusions` admin UI — allow per-game toggle of whether a match counts toward league standings
