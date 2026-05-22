/**
 * lib/data/queries.ts
 *
 * All read queries in one place, built directly from the schema.
 * Each function returns typed, UI-ready data (camelCase, dates as strings).
 * For writes, use server actions in lib/actions/.
 */

import db from "@/lib/db";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function toDateString(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "string") return val.slice(0, 10);
  return null;
}

function toDateTimeString(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return val;
  return null;
}

/**
 * Maps leagues.is_active (boolean) → UI status enum.
 * Once you run the status migration (is_active → status enum),
 * update this to just: return val as LeagueStatus
 */
function mapLeagueStatus(val: unknown): LeagueStatus {
  if (val === "active" || val === "upcoming" || val === "inactive") return val;
  return val ? "active" : "inactive";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeagueStatus = "active" | "upcoming" | "inactive";
export type ClubType = "high_school" | "club";
export type TeamGender = "Men" | "Women" | "Mixed";
export type GameStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "postponed"
  | "cancelled";
export type GameType =
  | "league"
  | "tournament"
  | "friendly"
  | "scrimmage"
  | "exhibition"
  | "playoff";
export type PlayerStatus =
  | "interested"
  | "rostered"
  | "trying out"
  | "not playing";
export type StaffRole =
  | "head_coach"
  | "assistant_coach"
  | "team_admin"
  | "stats_keeper";
export type ClubStaffRole = "club_admin" | "director" | "registrar";
export type CoachType =
  | "head_coach"
  | "assistant_coach"
  | "goalkeeper_coach"
  | "trainer"
  | "other";
export type StatSource = "manual" | "calculated" | "hybrid";
export type EventCategory = "training" | "social" | "team" | "other";

export interface League extends Record<string, unknown> {
  id: number;
  name: string;
  abbreviation: string | null;
  governingBodyId: number | null;
  governingBodyName: string | null;
  description: string | null;
  isTournament: boolean;
  status: LeagueStatus;
  createdAt: string | null;
  modifiedAt: string | null;
}

export interface GoverningBody {
  id: number;
  name: string;
  abbreviation: string | null;
  website: string | null;
}

export interface Club {
  id: number;
  name: string;
  abbreviation: string | null;
  location: string | null;
  locationId: number | null;
  logoUrl: string | null;
  foundedYear: number | null;
  contactInfo: string | null;
  type: ClubType;
  isActive: boolean;
  createdAt: string | null;
  modifiedAt: string | null;
}

export interface Season {
  id: number;
  seasonName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string | null;
}

export interface AgeGroup {
  id: number;
  name: string;
  beginDate: string | null;
  endDate: string | null;
}

export interface Team {
  id: number;
  clubId: number;
  clubName: string;
  teamName: string;
  gender: TeamGender;
  isActive: boolean;
  createdAt: string | null;
}

export interface TeamSeason {
  id: number;
  teamId: number;
  teamName: string;
  clubId: number;
  clubName: string;
  seasonId: number;
  seasonName: string;
  ageGroup: number | null;
  isActive: boolean;
}

export interface LeagueNode {
  id: number;
  leagueId: number;
  leagueName: string;
  parentId: number | null;
  name: string;
  nodeType: string;
  level: number;
  displayOrder: number;
  startDate: string | null;
  endDate: string | null;
}

export interface LeagueNodeSeason {
  id: number;
  leagueNodeId: number;
  leagueNodeName: string;
  leagueId: number;
  leagueName: string;
  seasonId: number;
  seasonName: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

export interface Game {
  id: number;
  seasonId: number;
  seasonName: string;
  homeTeamSeasonId: number;
  homeTeamName: string;
  homeClubName: string;
  awayTeamSeasonId: number;
  awayTeamName: string;
  awayClubName: string;
  status: GameStatus;
  gameType: GameType;
  startDate: string;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  locationId: number | null;
  locationName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  finalStatus: string | null;
  notes: string | null;
  videoLink: string | null;
  timezoneLabel: string | null;
}

export interface Player {
  id: number; // player_teams.id (roster entry)
  personId: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  email: string | null;
  birthDate: string | null;
  gender: string | null;
  teamSeasonId: number;
  teamName: string;
  clubName: string;
  jerseyNumber: number | null;
  altJerseyNumber: number | null;
  gkNumber: number | null;
  position: string | null;
  grade: string | null;
  status: PlayerStatus;
  captain: boolean;
  isActive: boolean;
  joinedDate: string | null;
}

export interface TeamStaffMember {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  teamSeasonId: number;
  teamName: string;
  clubName: string;
  seasonName: string;
  role: StaffRole;
  isActive: boolean;
  joinedDate: string | null;
  leftDate: string | null;
}

export interface ClubStaffMember {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  clubId: number;
  clubName: string;
  role: ClubStaffRole;
  isActive: boolean;
  joinedDate: string | null;
  leftDate: string | null;
}

export interface PlayerSeasonStats {
  id: number;
  playerId: number;
  firstName: string;
  lastName: string;
  teamSeasonId: number;
  teamName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  gamesPlayed: number;
  gamesStarted: number;
  minutesPlayed: number;
  shots: number;
  shotsOnTarget: number;
  saves: number;
  cleanSheets: number;
  penaltyGoals: number;
  statsSource: StatSource;
  notes: string | null;
}

export interface TeamSeasonRecord {
  id: number;
  teamSeasonId: number;
  teamName: string;
  clubName: string;
  leagueNodeSeasonId: number | null;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  gamesPlayed: number;
  points: number;
  recordSource: StatSource;
}

export interface Location {
  id: number;
  name: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface EventRecord {
  id: number;
  title: string;
  description: string | null;
  startDatetime: string;
  endDatetime: string;
  isAllDay: boolean;
  teamSeasonId: number | null;
  teamName: string | null;
  eventTypeId: number | null;
  eventTypeName: string | null;
  eventCategory: EventCategory | null;
  locationId: number | null;
  locationName: string | null;
  videoLink: string | null;
  recurrenceRule: string | null;
}

// ─── Governing Bodies ─────────────────────────────────────────────────────────

export async function getGoverningBodies(): Promise<GoverningBody[]> {
  const [rows] = await db.query<any[]>(
    `SELECT id, name, abbreviation, website FROM governing_bodies ORDER BY name ASC`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    abbreviation: r.abbreviation ?? null,
    website: r.website ?? null,
  }));
}

// ─── Leagues ──────────────────────────────────────────────────────────────────

export async function getLeagues(): Promise<League[]> {
  const [rows] = await db.query<any[]>(`
    SELECT
      l.id,
      l.name,
      l.abbreviation,
      l.governing_body_id,
      gb.name        AS governing_body_name,
      l.description,
      l.is_tournament,
      l.status,
      l.created_at,
      l.modified_at
    FROM leagues l
    LEFT JOIN governing_bodies gb ON gb.id = l.governing_body_id
    ORDER BY l.name ASC
  `);
  return rows.map(mapLeagueRow);
}

export async function getLeagueById(id: number): Promise<League | null> {
  const [rows] = await db.query<any[]>(
    `
    SELECT
      l.id, l.name, l.abbreviation, l.governing_body_id,
      gb.name AS governing_body_name,
      l.description, l.is_tournament, l.status, l.created_at, l.modified_at
    FROM leagues l
    LEFT JOIN governing_bodies gb ON gb.id = l.governing_body_id
    WHERE l.id = ? LIMIT 1`,
    [id],
  );
  return rows.length ? mapLeagueRow(rows[0]) : null;
}

function mapLeagueRow(r: any): League {
  return {
    id: r.id,
    name: r.name,
    abbreviation: r.abbreviation ?? null,
    governingBodyId: r.governing_body_id ?? null,
    governingBodyName: r.governing_body_name ?? null,
    description: r.description ?? null,
    isTournament: !!r.is_tournament,
    status: mapLeagueStatus(r.status),
    createdAt: toDateTimeString(r.created_at),
    modifiedAt: toDateTimeString(r.modified_at),
  };
}

// ─── League Nodes ─────────────────────────────────────────────────────────────

export async function getLeagueNodes(leagueId?: number): Promise<LeagueNode[]> {
  const where = leagueId ? "WHERE ln.league_id = ?" : "";
  const [rows] = await db.query<any[]>(
    `
    SELECT
      ln.id, ln.league_id, l.name AS league_name,
      ln.parent_id, ln.name, ln.node_type,
      ln.level, ln.display_order,
      ln.start_date, ln.end_date
    FROM league_nodes ln
    JOIN leagues l ON l.id = ln.league_id
    ${where}
    ORDER BY ln.league_id, ln.level, ln.display_order`,
    leagueId ? [leagueId] : [],
  );
  return rows.map((r) => ({
    id: r.id,
    leagueId: r.league_id,
    leagueName: r.league_name,
    parentId: r.parent_id ?? null,
    name: r.name,
    nodeType: r.node_type,
    level: r.level,
    displayOrder: r.display_order,
    startDate: toDateString(r.start_date),
    endDate: toDateString(r.end_date),
  }));
}

// ─── League Node Seasons ──────────────────────────────────────────────────────

export async function getLeagueNodeSeasons(
  leagueId?: number,
  seasonId?: number,
): Promise<LeagueNodeSeason[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  if (leagueId) {
    conditions.push("ln.league_id = ?");
    params.push(leagueId);
  }
  if (seasonId) {
    conditions.push("lns.season_id = ?");
    params.push(seasonId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query<any[]>(
    `
    SELECT
      lns.id, lns.league_node_id,
      ln.name   AS league_node_name,
      ln.league_id,
      l.name    AS league_name,
      lns.season_id,
      s.season_name,
      lns.start_date, lns.end_date, lns.is_active
    FROM league_node_seasons lns
    JOIN league_nodes ln ON ln.id = lns.league_node_id
    JOIN leagues      l  ON l.id  = ln.league_id
    JOIN seasons      s  ON s.id  = lns.season_id
    ${where}
    ORDER BY l.name, ln.level, ln.display_order`,
    params,
  );
  return rows.map((r) => ({
    id: r.id,
    leagueNodeId: r.league_node_id,
    leagueNodeName: r.league_node_name,
    leagueId: r.league_id,
    leagueName: r.league_name,
    seasonId: r.season_id,
    seasonName: r.season_name,
    startDate: toDateString(r.start_date),
    endDate: toDateString(r.end_date),
    isActive: !!r.is_active,
  }));
}

// ─── Clubs ────────────────────────────────────────────────────────────────────

export async function getClubs(activeOnly = false): Promise<Club[]> {
  const where = activeOnly ? "WHERE c.is_active = 1" : "";
  const [rows] = await db.query<any[]>(`
    SELECT
      c.id, c.name, c.abbreviation, c.location, c.location_id,
      c.logo_url, c.founded_year, c.contact_info,
      c.type, c.is_active, c.created_at, c.modified_at
    FROM clubs c
    ${where}
    ORDER BY c.name ASC`);
  return rows.map(mapClubRow);
}

export async function getClubById(id: number): Promise<Club | null> {
  const [rows] = await db.query<any[]>(
    `SELECT c.id, c.name, c.abbreviation, c.location, c.location_id,
            c.logo_url, c.founded_year, c.contact_info,
            c.type, c.is_active, c.created_at, c.modified_at
     FROM clubs c WHERE c.id = ? LIMIT 1`,
    [id],
  );
  return rows.length ? mapClubRow(rows[0]) : null;
}

function mapClubRow(r: any): Club {
  return {
    id: r.id,
    name: r.name,
    abbreviation: r.abbreviation ?? null,
    location: r.location ?? null,
    locationId: r.location_id ?? null,
    logoUrl: r.logo_url ?? null,
    foundedYear: r.founded_year ?? null,
    contactInfo: r.contact_info ?? null,
    type: r.type ?? "club",
    isActive: !!r.is_active,
    createdAt: toDateTimeString(r.created_at),
    modifiedAt: toDateTimeString(r.modified_at),
  };
}

// ─── Seasons ──────────────────────────────────────────────────────────────────

export async function getSeasons(): Promise<Season[]> {
  const [rows] = await db.query<any[]>(
    `SELECT id, season_name, start_date, end_date, is_current, created_at
     FROM seasons ORDER BY start_date DESC`,
  );
  return rows.map(mapSeasonRow);
}

export async function getCurrentSeason(): Promise<Season | null> {
  const [rows] = await db.query<any[]>(
    `SELECT id, season_name, start_date, end_date, is_current, created_at
     FROM seasons WHERE is_current = 1 LIMIT 1`,
  );
  return rows.length ? mapSeasonRow(rows[0]) : null;
}

export async function getSeasonById(id: number): Promise<Season | null> {
  const [rows] = await db.query<any[]>(
    `SELECT id, season_name, start_date, end_date, is_current, created_at
     FROM seasons WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows.length ? mapSeasonRow(rows[0]) : null;
}

function mapSeasonRow(r: any): Season {
  return {
    id: r.id,
    seasonName: r.season_name,
    startDate: toDateString(r.start_date)!,
    endDate: toDateString(r.end_date)!,
    isCurrent: !!r.is_current,
    createdAt: toDateTimeString(r.created_at),
  };
}

// ─── Age Groups ───────────────────────────────────────────────────────────────

export async function getAgeGroups(): Promise<AgeGroup[]> {
  const [rows] = await db.query<any[]>(
    `SELECT id, name, begin_date, end_date FROM age_groups ORDER BY name ASC`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    beginDate: toDateString(r.begin_date),
    endDate: toDateString(r.end_date),
  }));
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function getTeams(activeOnly = false): Promise<Team[]> {
  const where = activeOnly ? "WHERE t.is_active = 1" : "";
  const [rows] = await db.query<any[]>(`
    SELECT t.id, t.club_id, c.name AS club_name,
           t.team_name, t.gender, t.is_active, t.created_at
    FROM teams t
    JOIN clubs c ON c.id = t.club_id
    ${where}
    ORDER BY c.name ASC, t.team_name ASC`);
  return rows.map(mapTeamRow);
}

export async function getTeamById(id: number): Promise<Team | null> {
  const [rows] = await db.query<any[]>(
    `
    SELECT t.id, t.club_id, c.name AS club_name,
           t.team_name, t.gender, t.is_active, t.created_at
    FROM teams t
    JOIN clubs c ON c.id = t.club_id
    WHERE t.id = ? LIMIT 1`,
    [id],
  );
  return rows.length ? mapTeamRow(rows[0]) : null;
}

export async function getTeamsByClub(clubId: number): Promise<Team[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT t.id, t.club_id, c.name AS club_name,
           t.team_name, t.gender, t.is_active, t.created_at
    FROM teams t
    JOIN clubs c ON c.id = t.club_id
    WHERE t.club_id = ?
    ORDER BY t.team_name ASC`,
    [clubId],
  );
  return rows.map(mapTeamRow);
}

function mapTeamRow(r: any): Team {
  return {
    id: r.id,
    clubId: r.club_id,
    clubName: r.club_name,
    teamName: r.team_name,
    gender: r.gender,
    isActive: !!r.is_active,
    createdAt: toDateTimeString(r.created_at),
  };
}

// ─── Team Seasons ─────────────────────────────────────────────────────────────

export async function getTeamSeasons(
  seasonId?: number,
  clubId?: number,
): Promise<TeamSeason[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  if (seasonId) {
    conditions.push("ts.season_id = ?");
    params.push(seasonId);
  }
  if (clubId) {
    conditions.push("t.club_id = ?");
    params.push(clubId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query<any[]>(
    `
    SELECT
      ts.id, ts.team_id, t.team_name,
      t.club_id, c.name AS club_name,
      ts.season_id, s.season_name,
      ts.age_group, ts.is_active
    FROM team_seasons ts
    JOIN teams   t ON t.id = ts.team_id
    JOIN clubs   c ON c.id = t.club_id
    JOIN seasons s ON s.id = ts.season_id
    ${where}
    ORDER BY s.start_date DESC, c.name ASC, t.team_name ASC`,
    params,
  );
  return rows.map((r) => ({
    id: r.id,
    teamId: r.team_id,
    teamName: r.team_name,
    clubId: r.club_id,
    clubName: r.club_name,
    seasonId: r.season_id,
    seasonName: r.season_name,
    ageGroup: r.age_group ?? null,
    isActive: !!r.is_active,
  }));
}

export async function getTeamSeasonById(
  id: number,
): Promise<TeamSeason | null> {
  const [rows] = await db.query<any[]>(
    `
    SELECT
      ts.id, ts.team_id, t.team_name,
      t.club_id, c.name AS club_name,
      ts.season_id, s.season_name,
      ts.age_group, ts.is_active
    FROM team_seasons ts
    JOIN teams   t ON t.id = ts.team_id
    JOIN clubs   c ON c.id = t.club_id
    JOIN seasons s ON s.id = ts.season_id
    WHERE ts.id = ? LIMIT 1`,
    [id],
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    teamId: r.team_id,
    teamName: r.team_name,
    clubId: r.club_id,
    clubName: r.club_name,
    seasonId: r.season_id,
    seasonName: r.season_name,
    ageGroup: r.age_group ?? null,
    isActive: !!r.is_active,
  };
}

// ─── Players (roster) ─────────────────────────────────────────────────────────

export async function getPlayersByTeamSeason(
  teamSeasonId: number,
): Promise<Player[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT
      pt.id, pt.player_id AS person_id,
      p.first_name, p.last_name, p.nickname, p.email, p.birth_date, p.gender,
      pt.team_season_id,
      t.team_name, c.name AS club_name,
      pt.jersey_number, pt.alt_jersey_number, pt.gk_number,
      pt.position, pt.grade, pt.status,
      pt.captain, pt.is_active, pt.joined_date
    FROM player_teams pt
    JOIN people      p  ON p.id  = pt.player_id
    JOIN team_seasons ts ON ts.id = pt.team_season_id
    JOIN teams       t  ON t.id  = ts.team_id
    JOIN clubs       c  ON c.id  = t.club_id
    WHERE pt.team_season_id = ?
    ORDER BY p.last_name ASC, p.first_name ASC`,
    [teamSeasonId],
  );
  return rows.map(mapPlayerRow);
}

export async function getPlayersByPerson(personId: number): Promise<Player[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT
      pt.id, pt.player_id AS person_id,
      p.first_name, p.last_name, p.nickname, p.email, p.birth_date, p.gender,
      pt.team_season_id,
      t.team_name, c.name AS club_name,
      pt.jersey_number, pt.alt_jersey_number, pt.gk_number,
      pt.position, pt.grade, pt.status,
      pt.captain, pt.is_active, pt.joined_date
    FROM player_teams pt
    JOIN people      p  ON p.id  = pt.player_id
    JOIN team_seasons ts ON ts.id = pt.team_season_id
    JOIN teams       t  ON t.id  = ts.team_id
    JOIN clubs       c  ON c.id  = t.club_id
    WHERE pt.player_id = ?
    ORDER BY ts.season_id DESC`,
    [personId],
  );
  return rows.map(mapPlayerRow);
}

function mapPlayerRow(r: any): Player {
  return {
    id: r.id,
    personId: r.person_id,
    firstName: r.first_name,
    lastName: r.last_name,
    nickname: r.nickname ?? null,
    email: r.email ?? null,
    birthDate: toDateString(r.birth_date),
    gender: r.gender ?? null,
    teamSeasonId: r.team_season_id,
    teamName: r.team_name,
    clubName: r.club_name,
    jerseyNumber: r.jersey_number ?? null,
    altJerseyNumber: r.alt_jersey_number ?? null,
    gkNumber: r.gk_number ?? null,
    position: r.position ?? null,
    grade: r.grade ?? null,
    status: r.status,
    captain: !!r.captain,
    isActive: !!r.is_active,
    joinedDate: toDateString(r.joined_date),
  };
}

// ─── Team Staff ───────────────────────────────────────────────────────────────

export async function getTeamStaff(
  teamSeasonId: number,
): Promise<TeamStaffMember[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT
      ts_staff.id, ts_staff.person_id,
      p.first_name, p.last_name, p.email,
      ts_staff.team_season_id,
      t.team_name, c.name AS club_name, s.season_name,
      ts_staff.role, ts_staff.is_active,
      ts_staff.joined_date, ts_staff.left_date
    FROM team_staff ts_staff
    JOIN people      p   ON p.id   = ts_staff.person_id
    JOIN team_seasons ts  ON ts.id  = ts_staff.team_season_id
    JOIN teams       t   ON t.id   = ts.team_id
    JOIN clubs       c   ON c.id   = t.club_id
    JOIN seasons     s   ON s.id   = ts.season_id
    WHERE ts_staff.team_season_id = ?
    ORDER BY ts_staff.role, p.last_name ASC`,
    [teamSeasonId],
  );
  return rows.map(mapTeamStaffRow);
}

export async function getTeamStaffByPerson(
  personId: number,
): Promise<TeamStaffMember[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT
      ts_staff.id, ts_staff.person_id,
      p.first_name, p.last_name, p.email,
      ts_staff.team_season_id,
      t.team_name, c.name AS club_name, s.season_name,
      ts_staff.role, ts_staff.is_active,
      ts_staff.joined_date, ts_staff.left_date
    FROM team_staff ts_staff
    JOIN people      p   ON p.id   = ts_staff.person_id
    JOIN team_seasons ts  ON ts.id  = ts_staff.team_season_id
    JOIN teams       t   ON t.id   = ts.team_id
    JOIN clubs       c   ON c.id   = t.club_id
    JOIN seasons     s   ON s.id   = ts.season_id
    WHERE ts_staff.person_id = ?
    ORDER BY ts.season_id DESC`,
    [personId],
  );
  return rows.map(mapTeamStaffRow);
}

function mapTeamStaffRow(r: any): TeamStaffMember {
  return {
    id: r.id,
    personId: r.person_id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email ?? null,
    teamSeasonId: r.team_season_id,
    teamName: r.team_name,
    clubName: r.club_name,
    seasonName: r.season_name,
    role: r.role,
    isActive: !!r.is_active,
    joinedDate: toDateString(r.joined_date),
    leftDate: toDateString(r.left_date),
  };
}

// ─── Club Staff ───────────────────────────────────────────────────────────────

export async function getClubStaff(clubId: number): Promise<ClubStaffMember[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT
      cs.id, cs.person_id,
      p.first_name, p.last_name, p.email,
      cs.club_id, c.name AS club_name,
      cs.role, cs.is_active, cs.joined_date, cs.left_date
    FROM club_staff cs
    JOIN people p ON p.id = cs.person_id
    JOIN clubs  c ON c.id = cs.club_id
    WHERE cs.club_id = ?
    ORDER BY cs.role, p.last_name ASC`,
    [clubId],
  );
  return rows.map((r) => ({
    id: r.id,
    personId: r.person_id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email ?? null,
    clubId: r.club_id,
    clubName: r.club_name,
    role: r.role,
    isActive: !!r.is_active,
    joinedDate: toDateString(r.joined_date),
    leftDate: toDateString(r.left_date),
  }));
}

// ─── Games ────────────────────────────────────────────────────────────────────

export async function getGames(filters?: {
  seasonId?: number;
  teamSeasonId?: number;
  status?: GameStatus;
  gameType?: GameType;
}): Promise<Game[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.seasonId) {
    conditions.push("g.season_id = ?");
    params.push(filters.seasonId);
  }
  if (filters?.teamSeasonId) {
    conditions.push("(g.home_team_season_id = ? OR g.away_team_season_id = ?)");
    params.push(filters.teamSeasonId, filters.teamSeasonId);
  }
  if (filters?.status) {
    conditions.push("g.status = ?");
    params.push(filters.status);
  }
  if (filters?.gameType) {
    conditions.push("g.game_type = ?");
    params.push(filters.gameType);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query<any[]>(
    `
    SELECT
      g.id, g.season_id, s.season_name,
      g.home_team_season_id,
      ht.team_name  AS home_team_name,
      hc.name       AS home_club_name,
      g.away_team_season_id,
      at_.team_name AS away_team_name,
      ac.name       AS away_club_name,
      g.status, g.game_type,
      g.start_date, g.start_time, g.end_date, g.end_time,
      g.location_id, l.name AS location_name,
      gs.home_score, gs.away_score,
      gs.home_penalty_score, gs.away_penalty_score,
      gs.final_status,
      g.notes, g.video_link, g.timezone_label
    FROM games g
    JOIN seasons      s   ON s.id   = g.season_id
    JOIN team_seasons hts ON hts.id = g.home_team_season_id
    JOIN teams        ht  ON ht.id  = hts.team_id
    JOIN clubs        hc  ON hc.id  = ht.club_id
    JOIN team_seasons ats ON ats.id = g.away_team_season_id
    JOIN teams        at_ ON at_.id = ats.team_id
    JOIN clubs        ac  ON ac.id  = at_.club_id
    LEFT JOIN locations   l   ON l.id   = g.location_id
    LEFT JOIN game_scores gs  ON gs.game_id = g.id
    ${where}
    ORDER BY g.start_date ASC, g.start_time ASC`,
    params,
  );
  return rows.map(mapGameRow);
}

export async function getGameById(id: number): Promise<Game | null> {
  const [rows] = await db.query<any[]>(
    `
    SELECT
      g.id, g.season_id, s.season_name,
      g.home_team_season_id,
      ht.team_name  AS home_team_name,
      hc.name       AS home_club_name,
      g.away_team_season_id,
      at_.team_name AS away_team_name,
      ac.name       AS away_club_name,
      g.status, g.game_type,
      g.start_date, g.start_time, g.end_date, g.end_time,
      g.location_id, l.name AS location_name,
      gs.home_score, gs.away_score,
      gs.home_penalty_score, gs.away_penalty_score,
      gs.final_status,
      g.notes, g.video_link, g.timezone_label
    FROM games g
    JOIN seasons      s   ON s.id   = g.season_id
    JOIN team_seasons hts ON hts.id = g.home_team_season_id
    JOIN teams        ht  ON ht.id  = hts.team_id
    JOIN clubs        hc  ON hc.id  = ht.club_id
    JOIN team_seasons ats ON ats.id = g.away_team_season_id
    JOIN teams        at_ ON at_.id = ats.team_id
    JOIN clubs        ac  ON ac.id  = at_.club_id
    LEFT JOIN locations   l   ON l.id   = g.location_id
    LEFT JOIN game_scores gs  ON gs.game_id = g.id
    WHERE g.id = ? LIMIT 1`,
    [id],
  );
  return rows.length ? mapGameRow(rows[0]) : null;
}

function mapGameRow(r: any): Game {
  return {
    id: r.id,
    seasonId: r.season_id,
    seasonName: r.season_name,
    homeTeamSeasonId: r.home_team_season_id,
    homeTeamName: r.home_team_name,
    homeClubName: r.home_club_name,
    awayTeamSeasonId: r.away_team_season_id,
    awayTeamName: r.away_team_name,
    awayClubName: r.away_club_name,
    status: r.status,
    gameType: r.game_type,
    startDate: toDateString(r.start_date)!,
    startTime: r.start_time ?? null,
    endDate: toDateString(r.end_date),
    endTime: r.end_time ?? null,
    locationId: r.location_id ?? null,
    locationName: r.location_name ?? null,
    homeScore: r.home_score ?? null,
    awayScore: r.away_score ?? null,
    homePenaltyScore: r.home_penalty_score ?? null,
    awayPenaltyScore: r.away_penalty_score ?? null,
    finalStatus: r.final_status ?? null,
    notes: r.notes ?? null,
    videoLink: r.video_link ?? null,
    timezoneLabel: r.timezone_label ?? null,
  };
}

// ─── Player Season Stats ──────────────────────────────────────────────────────

export async function getPlayerStatsByTeamSeason(
  teamSeasonId: number,
): Promise<PlayerSeasonStats[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT
      pss.id, pss.player_id,
      p.first_name, p.last_name,
      pss.team_season_id,
      t.team_name,
      pss.goals, pss.assists, pss.yellow_cards, pss.red_cards,
      pss.games_played, pss.games_started, pss.minutes_played,
      pss.shots, pss.shots_on_target, pss.saves, pss.clean_sheets,
      pss.penalty_goals, pss.stats_source, pss.notes
    FROM player_season_stats pss
    JOIN people      p  ON p.id  = pss.player_id
    JOIN team_seasons ts ON ts.id = pss.team_season_id
    JOIN teams       t  ON t.id  = ts.team_id
    WHERE pss.team_season_id = ?
    ORDER BY pss.goals DESC, p.last_name ASC`,
    [teamSeasonId],
  );
  return rows.map(mapStatsRow);
}

export async function getPlayerStatsByPerson(
  personId: number,
): Promise<PlayerSeasonStats[]> {
  const [rows] = await db.query<any[]>(
    `
    SELECT
      pss.id, pss.player_id,
      p.first_name, p.last_name,
      pss.team_season_id,
      t.team_name,
      pss.goals, pss.assists, pss.yellow_cards, pss.red_cards,
      pss.games_played, pss.games_started, pss.minutes_played,
      pss.shots, pss.shots_on_target, pss.saves, pss.clean_sheets,
      pss.penalty_goals, pss.stats_source, pss.notes
    FROM player_season_stats pss
    JOIN people      p  ON p.id  = pss.player_id
    JOIN team_seasons ts ON ts.id = pss.team_season_id
    JOIN teams       t  ON t.id  = ts.team_id
    WHERE pss.player_id = ?
    ORDER BY ts.season_id DESC`,
    [personId],
  );
  return rows.map(mapStatsRow);
}

function mapStatsRow(r: any): PlayerSeasonStats {
  return {
    id: r.id,
    playerId: r.player_id,
    firstName: r.first_name,
    lastName: r.last_name,
    teamSeasonId: r.team_season_id,
    teamName: r.team_name,
    goals: r.goals ?? 0,
    assists: r.assists ?? 0,
    yellowCards: r.yellow_cards ?? 0,
    redCards: r.red_cards ?? 0,
    gamesPlayed: r.games_played ?? 0,
    gamesStarted: r.games_started ?? 0,
    minutesPlayed: r.minutes_played ?? 0,
    shots: r.shots ?? 0,
    shotsOnTarget: r.shots_on_target ?? 0,
    saves: r.saves ?? 0,
    cleanSheets: r.clean_sheets ?? 0,
    penaltyGoals: r.penalty_goals ?? 0,
    statsSource: r.stats_source,
    notes: r.notes ?? null,
  };
}

// ─── Team Season Records (standings) ─────────────────────────────────────────

export async function getTeamSeasonRecords(
  leagueNodeSeasonId?: number,
  teamSeasonId?: number,
): Promise<TeamSeasonRecord[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  if (leagueNodeSeasonId) {
    conditions.push("tsr.league_node_season_id = ?");
    params.push(leagueNodeSeasonId);
  }
  if (teamSeasonId) {
    conditions.push("tsr.team_season_id = ?");
    params.push(teamSeasonId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query<any[]>(
    `
    SELECT
      tsr.id, tsr.team_season_id,
      t.team_name, c.name AS club_name,
      tsr.league_node_season_id,
      tsr.wins, tsr.losses, tsr.draws,
      tsr.goals_for, tsr.goals_against,
      tsr.games_played, tsr.points, tsr.record_source
    FROM team_season_records tsr
    JOIN team_seasons ts ON ts.id = tsr.team_season_id
    JOIN teams        t  ON t.id  = ts.team_id
    JOIN clubs        c  ON c.id  = t.club_id
    ${where}
    ORDER BY tsr.points DESC, tsr.wins DESC`,
    params,
  );
  return rows.map((r) => ({
    id: r.id,
    teamSeasonId: r.team_season_id,
    teamName: r.team_name,
    clubName: r.club_name,
    leagueNodeSeasonId: r.league_node_season_id ?? null,
    wins: r.wins ?? 0,
    losses: r.losses ?? 0,
    draws: r.draws ?? 0,
    goalsFor: r.goals_for ?? 0,
    goalsAgainst: r.goals_against ?? 0,
    gamesPlayed: r.games_played ?? 0,
    points: r.points ?? 0,
    recordSource: r.record_source,
  }));
}

// ─── Locations ────────────────────────────────────────────────────────────────

export async function getLocations(): Promise<Location[]> {
  const [rows] = await db.query<any[]>(`
    SELECT
      l.id, l.name,
      a.address_line1, a.address_line2,
      a.city, a.state, a.postal_code, a.country
    FROM locations l
    LEFT JOIN addresses a ON a.id = l.address_id
    ORDER BY l.name ASC`);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    addressLine1: r.address_line1 ?? null,
    addressLine2: r.address_line2 ?? null,
    city: r.city ?? null,
    state: r.state ?? null,
    postalCode: r.postal_code ?? null,
    country: r.country ?? null,
  }));
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(teamSeasonId?: number): Promise<EventRecord[]> {
  const where = teamSeasonId ? "WHERE e.team_season_id = ?" : "";
  const [rows] = await db.query<any[]>(
    `
    SELECT
      e.id, e.title, e.description,
      e.start_datetime, e.end_datetime, e.is_all_day,
      e.team_season_id,
      t.team_name,
      e.event_type_id, et.name AS event_type_name, et.category AS event_category,
      e.location_id, l.name AS location_name,
      e.video_link, e.recurrence_rule
    FROM events e
    LEFT JOIN team_seasons ts ON ts.id = e.team_season_id
    LEFT JOIN teams        t  ON t.id  = ts.team_id
    LEFT JOIN event_types  et ON et.id = e.event_type_id
    LEFT JOIN locations    l  ON l.id  = e.location_id
    ${where}
    ORDER BY e.start_datetime ASC`,
    teamSeasonId ? [teamSeasonId] : [],
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    startDatetime: toDateTimeString(r.start_datetime)!,
    endDatetime: toDateTimeString(r.end_datetime)!,
    isAllDay: !!r.is_all_day,
    teamSeasonId: r.team_season_id ?? null,
    teamName: r.team_name ?? null,
    eventTypeId: r.event_type_id ?? null,
    eventTypeName: r.event_type_name ?? null,
    eventCategory: r.event_category ?? null,
    locationId: r.location_id ?? null,
    locationName: r.location_name ?? null,
    videoLink: r.video_link ?? null,
    recurrenceRule: r.recurrence_rule ?? null,
  }));
}
