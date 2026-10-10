# Comprehensive Legacy Database Migration & Architectural Plan
## Legacy DB (`u676616277_hs_original.sql`) → New DB (`u676616277_stats_app` / Prisma Schema)

This document provides a 100% comprehensive audit of all 25 tables in the legacy High School database, mapping every table, column, and business concept into `general_soccer_app_v4` without data loss or schema breaking.

---

## 1. Full Audit of ALL 25 Legacy Tables

Below is the complete status of all 25 tables in `u676616277_hs_original.sql`:

| # | Legacy Table Name | Columns Count | Status in New Architecture | Target Model / Destination | Notes & Missing Items |
| :-: | :--- | :-: | :--- | :--- | :--- |
| 1 | `addresses` | 8 | ✅ Direct Mapping | `addresses` | Maps `address`, `city`, `state`, `zip` → `postal_code`. |
| 2 | `calendarEvents` | 13 | ✅ Direct Mapping | `events` | Maps `summary` → `title`, `calId` → `google_cal_id`, `allDay` → `is_all_day`. |
| 3 | `coaches` | 7 | ✅ Direct Mapping | `team_staff` / `club_staff` | Maps coach links to staff roles (`head_coach`, `assistant_coach`). |
| 4 | `dbDefaults` | 10 | ✅ Direct Mapping | `teams`, `leagues`, `age_groups` | Default period durations, stoppage rules, and short names. |
| 5 | `games` | 29 | ✅ Direct Mapping | `games`, `games_overtimes` | Converts `date` + `time` to UTC via `parseGameDatesAndTimesUTC()`. |
| 6 | `goalsAgainst` | 12 | ✅ Direct Mapping | `game_events_major`, `game_events_goals` | Opponent goals scored against team. |
| 7 | `goalsFor` | 14 | ✅ Direct Mapping | `game_events_major`, `game_events_goals` | Goals scored; serializes `headed`, `pk`, `ck`, `directKick` to JSON. |
| 8 | `locations` | 5 | ✅ Direct Mapping | `locations`, `locations_sublocations` | Venue names & addresses. |
| 9 | `minorEvents` | 8 | ✅ Direct Mapping | `game_events_discipline`, `game_events_player_actions` | Yellow cards, red cards, fouls. |
| 10 | `parents` | 4 | ✅ Direct Mapping | `people`, `player_relationships` | Parent person IDs. |
| 11 | `people` | 14 | ✅ Direct Mapping | `people` | Gender normalized via `normalizeGender()` (`Boys` → `MALE`, `Girls` → `FEMALE`). |
| 12 | `periods` | 8 | ✅ Direct Mapping | `game_periods` | Period start/end times in seconds. |
| 13 | `playerGames` | 11 | ✅ Direct Mapping | `player_games` | Roster match status (`starter`, `goalkeeper`, `dressed`, `injured`, `unavailable`). |
| 14 | `playerParents` | 5 | ✅ Direct Mapping | `player_relationships` | Parent-player links (`relationship: Parent`). |
| 15 | `players` | 7 | ✅ Direct Mapping | `people`, `player_teams` | Academic info (`entryYear` → `entry_year`, `creditsNeeded` → `credits_needed`). |
| 16 | `playerSeasons` | 20 | ✅ Direct Mapping + Enhanced | `player_teams` | Roster registration, `squad_level` (`Varsity`, `JV`, `JV2`), jersey numbers, headshots (`photo_url`). |
| 17 | `scheduleHelper` | 8 | ⚠️ Extension Needed | `schedule_leads` | Prospective match scheduling leads & notes. |
| 18 | `schoolClassification` | 5 | ✅ Direct Mapping | `leagues`, `league_nodes` | Maps TSSAA Class, Region, District nodes. |
| 19 | `schools` | 14 | ✅ Direct Mapping | `clubs`, `teams` | Maps High Schools to `clubs` (`type: high_school`) & `teams`. |
| 20 | `seasons` | 21 | ✅ Direct Mapping | `seasons`, `team_seasons` | Season metadata & team season instances. |
| 21 | `stoppages` | 11 | ✅ Direct Mapping | `game_events_major` | Stoppages logged with `clock_should_run: false`. |
| 22 | `subs` | 9 | ✅ Direct Mapping | `game_subs` | Sub in/out player IDs, period, game minute, `gk_sub`. |
| 23 | `uniformJerseys` | 7 | ⚠️ Inventory Extension | `uniform_jerseys` | Legacy jersey inventory (`number`, `size`, `lost`). |
| 24 | `uniforms` | 9 | ⚠️ Inventory Extension | `uniform_kits` | Uniform kit metadata (`brand`, `style`, `color`, `year`). |
| 25 | `uniformSeasonPlayers` & `uniformSeasons` | 6 | ⚠️ Inventory Extension | `uniform_assignments` | Uniform assignments per player/season. |

---

## 2. Specific Business & Architectural Rules

### 2.1 Single Club Context: Independence High School
- In `u676616277_hs_original.sql`, all historical players, matches, and rosters belong to **Independence High School** (e.g. Independence Eagles).
- During migration, Independence High School is mapped to a primary `clubs` record with `type = 'high_school'`.
- All historical seasons (e.g. 2018-2019 through 2025-2026) attach to Independence High School team seasons (`team_seasons`).

### 2.2 TSSAA Competition Node Hierarchy
TSSAA high school competition structures map into the **Terminal Leaf Subnode Hierarchy**:
- **Governing Body**: `TSSAA` (Tennessee Secondary School Athletic Association).
- **Parent League**: `TSSAA High School Soccer` (Boys & Girls).
- **Classification Node (Level 0)**: e.g. `Class AAA`.
- **Region Node (Level 1)**: e.g. `Region 6`.
- **District Terminal Leaf Node (Level 2)**: e.g. `District 11-AAA`.
- All high school league matches attach to the **Terminal Leaf District Node** (e.g., `District 11-AAA`), and the UI automatically renders full breadcrumb paths (`"TSSAA > Class AAA > Region 6 > District 11-AAA"`).

### 2.3 Program Roster Pools, Sub-Teams & Match Dressed Status (`game_status`)
To support both High School (`Varsity`, `JV`, `JV2`) and Club (`DC`, `LM`, `Premier`) sub-team structures with call-up / floating players:

1. **`squad_level` on `player_teams`**:
   - `squad_level` (`String? @db.VarChar(50)`): Stores primary squad level (`"varsity"`, `"jv"`, `"jv2"`, `"dc"`, `"lm"`).
   - `secondary_squad_level` (`String? @db.VarChar(50)`): For multi-squad players.
2. **`is_guest` Rule Enforcement**:
   - `is_guest = true` is strictly reserved for true external guest players outside the program.
   - All JV/JV2 players belong to the overarching Team/Program Season Roster Pool and are NOT marked as guest players.
3. **Match Dressed / Roster Status (`player_games.game_status`)**:
   - For a Varsity match, all players in the Program Pool default to `not_dressed` unless on the active game roster.
   - If a JV player is brought up for a Varsity game, the coach sets their game status for that match to `dressed` (or `starter` / `goalkeeper`).
   - Their playing time and stats are logged directly under their profile without requiring `is_guest`.

---

## 3. Recommended Schema Extension (`schema.prisma`)

To support squad levels and retain uniform inventory & schedule helper tables from the legacy database:

```prisma
// Added to player_teams model
model player_teams {
  // ... existing fields ...
  squad_level           String?              @db.VarChar(50) // 'varsity', 'jv', 'jv2', 'dc', 'lm'
  secondary_squad_level String?              @db.VarChar(50)
}

// Prospective Scheduling Leads (from scheduleHelper)
model schedule_leads {
  id          Int          @id @default(autoincrement())
  season_id   Int
  opponent_id Int
  likelihood  String?      @db.VarChar(50)
  status      String?      @db.VarChar(50)
  notes       String?      @db.Text
  created_at  DateTime?    @default(now()) @db.Timestamp(0)
  updated_at  DateTime?    @default(now()) @db.Timestamp(0)
}

// Uniform Inventory (from uniforms, uniformJerseys, uniformSeasons)
model uniform_kits {
  id         Int       @id @default(autoincrement())
  type       String?   @db.VarChar(50) // 'home', 'away', 'third'
  brand      String?   @db.VarChar(50)
  color      String?   @db.VarChar(50)
  year       Int?
  is_active  Boolean   @default(true)
  created_at DateTime? @default(now()) @db.Timestamp(0)
}
```

---

## 4. Execution Roadmap (`todo.md` Step 29)

1. **Step 29.1**: Schema extension in `schema.prisma` (`squad_level`, `schedule_leads`, `uniform_kits`).
2. **Step 29.2**: Master Entity Import (Independence High School club, TSSAA competition hierarchy, locations, people with gender normalization).
3. **Step 29.3**: Roster & Sub-Team Import (`player_teams` with `squad_level: Varsity / JV / JV2`, `player_relationships`).
4. **Step 29.4**: Schedule & UTC Match Import (`games` with `parseGameDatesAndTimesUTC`, `game_periods`, `ot_if_tied: false`).
5. **Step 29.5**: Goal & Event Log Import (`game_events_major`, `game_events_goals` with JSON goal types, `game_subs`, `game_events_discipline`).
6. **Step 29.6**: Data Audit & Verification Suite (`npx vitest run`).
