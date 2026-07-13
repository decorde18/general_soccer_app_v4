/**
 * lib/data/queries.ts
 *
 * All read queries in one place, built directly from the schema.
 * Each function returns typed, UI-ready data (camelCase, dates as strings).
 * For writes, use server actions in lib/actions/.
 */

import prisma from "@/lib/prisma";

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
  status: string;
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
  ageGroupName: string | null;
  isActive: boolean;
  clubType?: string | null;
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
  settings: {
    playersOnField: number;
  };
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

export interface Address {
  id: number;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
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
  const bodies = await prisma.governing_bodies.findMany({
    orderBy: { name: "asc" },
  });
  return bodies.map((r) => ({
    id: r.id,
    name: r.name,
    abbreviation: r.abbreviation ?? null,
    website: r.website ?? null,
  }));
}

// ─── Leagues ──────────────────────────────────────────────────────────────────

export async function getLeagues(): Promise<League[]> {
  const leaguesData = await prisma.leagues.findMany({
    include: { governing_bodies: true },
    orderBy: { name: "asc" },
  });
  return leaguesData.map(mapLeagueRow);
}

export async function getLeagueById(id: number): Promise<League | null> {
  const leagueData = await prisma.leagues.findUnique({
    where: { id },
    include: { governing_bodies: true },
  });
  return leagueData ? mapLeagueRow(leagueData) : null;
}

function mapLeagueRow(r: any): League {
  return {
    id: r.id,
    name: r.name,
    abbreviation: r.abbreviation ?? null,
    governingBodyId: r.governing_body_id ?? null,
    governingBodyName:
      r.governing_bodies?.name ?? r.governing_body_name ?? null,
    description: r.description ?? null,
    isTournament: !!r.is_tournament,
    status: mapLeagueStatus(r.status),
    createdAt: toDateTimeString(r.created_at),
    modifiedAt: toDateTimeString(r.modified_at),
  };
}

// ─── League Nodes ─────────────────────────────────────────────────────────────

export async function getLeagueNodes(leagueId?: number): Promise<LeagueNode[]> {
  const nodes = await prisma.league_nodes.findMany({
    where: leagueId ? { league_id: leagueId } : undefined,
    include: { leagues: true },
    orderBy: [{ league_id: "asc" }, { level: "asc" }, { display_order: "asc" }],
  });
  return nodes.map((r) => ({
    id: r.id,
    leagueId: r.league_id,
    leagueName: r.leagues.name,
    parentId: r.parent_id ?? null,
    name: r.name,
    nodeType: r.node_type,
    level: r.level ?? 0,
    displayOrder: r.display_order ?? 0,
    startDate: toDateString(r.start_date),
    endDate: toDateString(r.end_date),
  }));
}

// ─── League Node Seasons ──────────────────────────────────────────────────────

export async function getLeagueNodeSeasons(
  leagueId?: number,
  seasonId?: number,
): Promise<LeagueNodeSeason[]> {
  const nodeSeasons = await prisma.league_node_seasons.findMany({
    where: {
      league_nodes: leagueId ? { league_id: leagueId } : undefined,
      season_id: seasonId ? seasonId : undefined,
    },
    include: {
      league_nodes: {
        include: { leagues: true },
      },
      seasons: true,
    },
    orderBy: [
      { league_nodes: { leagues: { name: "asc" } } },
      { league_nodes: { level: "asc" } },
      { league_nodes: { display_order: "asc" } },
    ],
  });
  return nodeSeasons.map((r) => ({
    id: r.id,
    leagueNodeId: r.league_node_id,
    leagueNodeName: r.league_nodes.name,
    leagueId: r.league_nodes.league_id,
    leagueName: r.league_nodes.leagues.name,
    seasonId: r.season_id,
    seasonName: r.seasons.season_name,
    startDate: toDateString(r.start_date),
    endDate: toDateString(r.end_date),
    isActive: !!r.is_active,
  }));
}

// ─── Clubs ────────────────────────────────────────────────────────────────────

export async function getClubs(activeOnly = false): Promise<Club[]> {
  const clubs = await prisma.clubs.findMany({
    where: activeOnly ? { is_active: true } : undefined,
    orderBy: { name: "asc" },
  });
  return clubs.map(mapClubRow);
}

export async function getClubById(id: number): Promise<Club | null> {
  const club = await prisma.clubs.findUnique({
    where: { id },
  });
  return club ? mapClubRow(club) : null;
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
  const seasons = await prisma.seasons.findMany({
    orderBy: { start_date: "desc" },
  });
  return seasons.map(mapSeasonRow);
}

export async function getCurrentSeason(): Promise<Season | null> {
  const season = await prisma.seasons.findFirst({
    // Prisma model doesn't seem to have is_current, it's missing in introspection?
    // Fallback: order by start_date desc limit 1
    orderBy: { start_date: "desc" },
  });
  return season ? mapSeasonRow(season) : null;
}

export async function getSeasonById(id: number): Promise<Season | null> {
  const season = await prisma.seasons.findUnique({
    where: { id },
  });
  return season ? mapSeasonRow(season) : null;
}

function mapSeasonRow(r: any): Season {
  return {
    id: r.id,
    seasonName: r.season_name,
    startDate: toDateString(r.start_date)!,
    endDate: toDateString(r.end_date)!,
    status: r.status || "upcoming",
    isCurrent: !!r.is_current, // Note: is_current was missing in schema, might be undefined
    createdAt: toDateTimeString(r.created_at),
  };
}

// ─── Age Groups ───────────────────────────────────────────────────────────────

export async function getAgeGroups(): Promise<AgeGroup[]> {
  const groups = await prisma.age_groups.findMany({
    orderBy: { name: "asc" },
  });
  return groups.map((r) => ({
    id: r.id,
    name: r.name,
    beginDate: toDateString(r.begin_date),
    endDate: toDateString(r.end_date),
  }));
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function getTeams(activeOnly = false): Promise<Team[]> {
  const teamsData = await prisma.teams.findMany({
    where: activeOnly ? { is_active: true } : undefined,
    include: { clubs: true },
    orderBy: [{ clubs: { name: "asc" } }, { team_name: "asc" }],
  });
  return teamsData.map(mapTeamRow);
}

export async function getTeamById(id: number): Promise<Team | null> {
  const teamData = await prisma.teams.findUnique({
    where: { id },
    include: { clubs: true },
  });
  return teamData ? mapTeamRow(teamData) : null;
}

export async function getTeamsByClub(clubId: number): Promise<Team[]> {
  const teamsData = await prisma.teams.findMany({
    where: { club_id: clubId },
    include: { clubs: true },
    orderBy: { team_name: "asc" },
  });
  return teamsData.map(mapTeamRow);
}

function mapTeamRow(r: any): Team {
  return {
    id: r.id,
    clubId: r.club_id,
    clubName: r.clubs?.name ?? r.club_name,
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
  const teamSeasons = await prisma.team_seasons.findMany({
    where: {
      season_id: seasonId ? seasonId : undefined,
      teams: clubId ? { club_id: clubId } : undefined,
    },
    include: {
      teams: {
        include: { clubs: true },
      },
      seasons: true,
      age_groups: true,
    },
    orderBy: [
      { seasons: { start_date: "desc" } },
      { teams: { clubs: { name: "asc" } } },
      { teams: { team_name: "asc" } },
    ],
  });
  return teamSeasons.map((r) => ({
    id: r.id,
    teamId: r.team_id,
    teamName: r.teams.team_name,
    clubId: r.teams.club_id,
    clubName: r.teams.clubs.name,
    seasonId: r.season_id,
    seasonName: r.seasons.season_name,
    ageGroup: r.age_group ?? null,
    ageGroupName: r.age_groups?.name ?? null,
    isActive: !!r.is_active,
    clubType: r.teams.clubs.type,
  }));
}

export async function getTeamSeasonById(
  id: number,
): Promise<TeamSeason | null> {
  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id },
    include: {
      teams: {
        include: { clubs: true },
      },
      seasons: true,
      age_groups: true,
    },
  });
  if (!teamSeason) return null;
  return {
    id: teamSeason.id,
    teamId: teamSeason.team_id,
    teamName: teamSeason.teams.team_name,
    clubId: teamSeason.teams.club_id,
    clubName: teamSeason.teams.clubs.name,
    seasonId: teamSeason.season_id,
    seasonName: teamSeason.seasons.season_name,
    ageGroup: teamSeason.age_group ?? null,
    ageGroupName: teamSeason.age_groups?.name ?? null,
    isActive: !!teamSeason.is_active,
    clubType: teamSeason.teams.clubs.type,
  };
}

// ─── Players (roster) ─────────────────────────────────────────────────────────

export async function getPlayersByTeamSeason(
  teamSeasonId: number,
): Promise<Player[]> {
  const playersData = await prisma.player_teams.findMany({
    where: { team_season_id: teamSeasonId },
    include: {
      people: true,
      team_seasons: {
        include: {
          teams: {
            include: { clubs: true },
          },
        },
      },
    },
    orderBy: [
      { people: { last_name: "asc" } },
      { people: { first_name: "asc" } },
    ],
  });
  return playersData.map(mapPlayerRow);
}

export async function getPlayersByPerson(personId: number): Promise<Player[]> {
  const playersData = await prisma.player_teams.findMany({
    where: { player_id: personId },
    include: {
      people: true,
      team_seasons: {
        include: {
          teams: {
            include: { clubs: true },
          },
        },
      },
    },
    orderBy: [{ team_seasons: { season_id: "desc" } }],
  });
  return playersData.map(mapPlayerRow);
}

function mapPlayerRow(r: any): Player {
  const person = r.people ?? r;
  const teamSeason = r.team_seasons;
  const team = teamSeason?.teams;
  const club = team?.clubs;

  return {
    id: r.id,
    personId: r.player_id ?? r.person_id,
    firstName: person.first_name,
    lastName: person.last_name,
    nickname: person.nickname ?? null,
    email: person.email ?? null,
    birthDate: toDateString(person.birth_date),
    gender: person.gender ?? null,
    teamSeasonId: r.team_season_id,
    teamName: team?.team_name ?? r.team_name,
    clubName: club?.name ?? r.club_name,
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
  const staff = await prisma.team_staff.findMany({
    where: { team_season_id: teamSeasonId },
    include: {
      people: true,
      team_seasons: {
        include: {
          teams: { include: { clubs: true } },
          seasons: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { people: { last_name: "asc" } }],
  });
  return staff.map(mapTeamStaffRow);
}

export async function getTeamStaffByPerson(
  personId: number,
): Promise<TeamStaffMember[]> {
  const staff = await prisma.team_staff.findMany({
    where: { person_id: personId },
    include: {
      people: true,
      team_seasons: {
        include: {
          teams: { include: { clubs: true } },
          seasons: true,
        },
      },
    },
    orderBy: [{ team_seasons: { season_id: "desc" } }],
  });
  return staff.map(mapTeamStaffRow);
}

function mapTeamStaffRow(r: any): TeamStaffMember {
  const person = r.people ?? r;
  const teamSeason = r.team_seasons;
  const team = teamSeason?.teams;
  const club = team?.clubs;
  const season = teamSeason?.seasons;

  return {
    id: r.id,
    personId: r.person_id,
    firstName: person.first_name,
    lastName: person.last_name,
    email: person.email ?? null,
    teamSeasonId: r.team_season_id,
    teamName: team?.team_name ?? r.team_name,
    clubName: club?.name ?? r.club_name,
    seasonName: season?.season_name ?? r.season_name,
    role: r.role,
    isActive: !!r.is_active,
    joinedDate: toDateString(r.joined_date),
    leftDate: toDateString(r.left_date),
  };
}

// ─── Club Staff ───────────────────────────────────────────────────────────────

export async function getClubStaff(clubId: number): Promise<ClubStaffMember[]> {
  const staff = await prisma.club_staff.findMany({
    where: { club_id: clubId },
    include: {
      people: true,
      clubs: true,
    },
    orderBy: [{ role: "asc" }, { people: { last_name: "asc" } }],
  });
  return staff.map((r) => ({
    id: r.id,
    personId: r.person_id,
    firstName: r.people?.first_name ?? "",
    lastName: r.people?.last_name ?? "",
    email: r.people?.email ?? null,
    clubId: r.club_id,
    clubName: r.clubs?.name ?? "",
    role: r.role as ClubStaffRole,
    isActive: !!r.is_active,
    joinedDate: toDateString(r.joined_date),
    leftDate: toDateString(r.left_date),
  }));
}

// ─── Games ────────────────────────────────────────────────────────────────────

export async function getGames(filters?: {
  seasonId?: number;
  teamSeasonId?: number;
  leagueId?: number;
  status?: GameStatus;
  gameType?: GameType;
  clubType?: string;
}): Promise<Game[]> {
  const gamesData = await prisma.games.findMany({
    where: {
      season_id: filters?.seasonId ? filters.seasonId : undefined,
      OR: filters?.teamSeasonId
        ? [
            { home_team_season_id: filters.teamSeasonId },
            { away_team_season_id: filters.teamSeasonId },
          ]
        : undefined,
      game_league_nodes: filters?.leagueId
        ? {
            some: {
              league_node_seasons: {
                league_nodes: {
                  league_id: filters.leagueId,
                },
              },
            },
          }
        : undefined,
      AND: filters?.clubType
        ? [
            {
              OR: [
                {
                  team_seasons_games_home_team_season_idToteam_seasons: {
                    teams: {
                      clubs: {
                        type: filters.clubType as any,
                      },
                    },
                  },
                },
                {
                  team_seasons_games_away_team_season_idToteam_seasons: {
                    teams: {
                      clubs: {
                        type: filters.clubType as any,
                      },
                    },
                  },
                },
              ],
            },
          ]
        : undefined,
      status: filters?.status as any,
      game_type: filters?.gameType as any,
    },
    include: {
      seasons: true,
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } },
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } },
      },
      locations: true,
      game_events_major: {
        include: {
          game_events_goals: true,
          game_events_penalties: true,
        },
      },
      game_league_nodes: {
        include: {
          league_node_seasons: {
            include: {
              league_nodes: true,
            },
          },
        },
      },
    },
    orderBy: [{ start_date: "asc" }, { start_time: "asc" }],
  });
  return gamesData.map(mapGameRow);
}

export async function getGameById(id: number): Promise<Game | null> {
  const gameData = await prisma.games.findUnique({
    where: { id },
    include: {
      seasons: true,
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } },
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } },
      },
      locations: true,
      game_events_major: {
        include: {
          game_events_goals: true,
          game_events_penalties: true,
        },
      },
      game_league_nodes: {
        include: {
          league_node_seasons: {
            include: {
              league_nodes: true,
            },
          },
        },
      },
    },
  });
  return gameData ? mapGameRow(gameData) : null;
}

function mapGameRow(r: any): Game {
  const homeTeamSeason = r.team_seasons_games_home_team_season_idToteam_seasons;
  const awayTeamSeason = r.team_seasons_games_away_team_season_idToteam_seasons;
  const homeTeam = homeTeamSeason?.teams;
  const awayTeam = awayTeamSeason?.teams;

  const isPlayed = r.status === "completed" || r.status === "in_progress";

  let homeScore: number | null = null;
  let awayScore: number | null = null;
  let homePenaltyScore: number | null = null;
  let awayPenaltyScore: number | null = null;
  let finalStatus: string | null = null;

  if (isPlayed) {
    homeScore = 0;
    awayScore = 0;

    let hasShootout = false;

    r.game_events_major?.forEach((major: any) => {
      if (major.event_type === "goal") {
        major.game_events_goals?.forEach((goal: any) => {
          const isHomeScorer = goal.team_season_id === r.home_team_season_id;
          if (
            (isHomeScorer && !goal.is_own_goal) ||
            (!isHomeScorer && goal.is_own_goal)
          ) {
            homeScore = (homeScore || 0) + 1;
          } else {
            awayScore = (awayScore || 0) + 1;
          }
        });
      }

      if (
        major.game_events_penalties &&
        major.game_events_penalties.length > 0
      ) {
        major.game_events_penalties.forEach((pen: any) => {
          if (pen.is_shootout) {
            hasShootout = true;
            if (pen.outcome === "goal") {
              const isHomePenalty =
                pen.team_season_id === r.home_team_season_id;
              if (isHomePenalty) {
                homePenaltyScore = (homePenaltyScore || 0) + 1;
              } else {
                awayPenaltyScore = (awayPenaltyScore || 0) + 1;
              }
            }
          }
        });
      }
    });

    if (hasShootout) {
      finalStatus = "penalty_kicks";
    } else {
      let maxPeriod = 0;
      r.game_events_major?.forEach((major: any) => {
        if (major.period > maxPeriod) {
          maxPeriod = major.period;
        }
      });
      if (maxPeriod > r.default_reg_periods) {
        finalStatus = "overtime";
      } else {
        finalStatus = "regulation";
      }
    }
  }

  const primaryNode =
    r.game_league_nodes?.find((n: any) => n.is_primary) ||
    r.game_league_nodes?.[0];
  const nodeName = primaryNode?.league_node_seasons?.league_nodes?.name || "";
  const playersOnField = getPlayersOnFieldFromNodeName(nodeName);

  return {
    id: r.id,
    seasonId: r.season_id,
    seasonName: r.seasons?.season_name ?? r.season_name,
    homeTeamSeasonId: r.home_team_season_id,
    homeTeamName: homeTeam?.team_name ?? r.home_team_name,
    homeClubName: homeTeam?.clubs?.name ?? r.home_club_name,
    awayTeamSeasonId: r.away_team_season_id,
    awayTeamName: awayTeam?.team_name ?? r.away_team_name,
    awayClubName: awayTeam?.clubs?.name ?? r.away_club_name,
    status: r.status as GameStatus,
    gameType: r.game_type as GameType,
    startDate: toDateString(r.start_date)!,
    startTime: r.start_time ? toDateTimeString(r.start_time) : null,
    endDate: toDateString(r.end_date),
    endTime: r.end_time ? toDateTimeString(r.end_time) : null,
    locationId: r.location_id ?? null,
    locationName: r.locations?.name ?? r.location_name ?? null,
    homeScore,
    awayScore,
    homePenaltyScore,
    awayPenaltyScore,
    finalStatus,
    notes: r.notes ?? null,
    videoLink: r.video_link ?? null,
    timezoneLabel: r.timezone_label ?? null,
    settings: {
      playersOnField,
    },
  };
}

function getPlayersOnFieldFromNodeName(nodeName?: string): number {
  if (!nodeName) return 11;
  const name = nodeName.toLowerCase();
  if (
    name.includes("u9") ||
    name.includes("u10") ||
    name.includes("7v7") ||
    name.includes("7 v 7")
  ) {
    return 7;
  }
  if (
    name.includes("u11") ||
    name.includes("u12") ||
    name.includes("9v9") ||
    name.includes("9 v 9")
  ) {
    return 9;
  }
  return 11;
}

// ─── Player Season Stats ──────────────────────────────────────────────────────

export async function getPlayerStatsByTeamSeason(
  teamSeasonId: number,
): Promise<PlayerSeasonStats[]> {
  const roster = await prisma.player_teams.findMany({
    where: { team_season_id: teamSeasonId },
    include: {
      people: true,
      team_seasons: {
        include: { teams: true },
      },
    },
  });

  return getStatsForRoster(roster, teamSeasonId);
}

export async function getPlayerStatsByPerson(
  personId: number,
): Promise<PlayerSeasonStats[]> {
  const roster = await prisma.player_teams.findMany({
    where: { player_id: personId },
    include: {
      people: true,
      team_seasons: {
        include: { teams: true },
      },
    },
  });

  const statsList: PlayerSeasonStats[] = [];
  for (const r of roster) {
    const playerStats = await getStatsForRoster([r], r.team_season_id);
    if (playerStats.length > 0) {
      statsList.push(playerStats[0]);
    }
  }

  return statsList;
}

async function getStatsForRoster(
  roster: any[],
  teamSeasonId: number,
): Promise<PlayerSeasonStats[]> {
  if (roster.length === 0) return [];

  const personIds = roster.map((r) => r.player_id);

  const playerGames = await prisma.player_games.findMany({
    where: {
      player_id: { in: personIds },
      team_season_id: teamSeasonId,
    },
    include: {
      game_events_discipline: true,
      game_events_player_actions: true,
      game_events_goals_game_events_goals_scorer_player_game_idToplayer_games: true,
      game_events_goals_game_events_goals_assist_player_game_idToplayer_games: true,
      game_events_goals_game_events_goals_defending_gk_player_game_idToplayer_games: true,
    },
  });

  const gameIds = Array.from(new Set(playerGames.map((pg) => pg.game_id)));

  const games = await prisma.games.findMany({
    where: { id: { in: gameIds } },
    include: {
      game_events_major: {
        include: {
          game_events_goals: true,
        },
      },
    },
  });

  const gameScoresMap = new Map<
    number,
    {
      homeScore: number;
      awayScore: number;
      homeTeamSeasonId: number;
      awayTeamSeasonId: number;
    }
  >();
  games.forEach((g) => {
    let homeScore = 0;
    let awayScore = 0;
    g.game_events_major?.forEach((major: any) => {
      if (major.event_type === "goal") {
        major.game_events_goals?.forEach((goal: any) => {
          const isHomeScorer = goal.team_season_id === g.home_team_season_id;
          if (
            (isHomeScorer && !goal.is_own_goal) ||
            (!isHomeScorer && goal.is_own_goal)
          ) {
            homeScore++;
          } else {
            awayScore++;
          }
        });
      }
    });
    gameScoresMap.set(g.id, {
      homeScore,
      awayScore,
      homeTeamSeasonId: g.home_team_season_id,
      awayTeamSeasonId: g.away_team_season_id,
    });
  });

  const pgMap = new Map<number, any[]>();
  playerGames.forEach((pg) => {
    if (!pgMap.has(pg.player_id)) {
      pgMap.set(pg.player_id, []);
    }
    pgMap.get(pg.player_id)!.push(pg);
  });

  return roster
    .map((r) => {
      const pgs = pgMap.get(r.player_id) || [];

      let goals = 0;
      let assists = 0;
      let yellowCards = 0;
      let redCards = 0;
      let gamesPlayed = 0;
      let gamesStarted = 0;
      let minutesPlayed = 0;
      let shots = 0;
      let shotsOnTarget = 0;
      let saves = 0;
      let cleanSheets = 0;
      let penaltyGoals = 0;

      pgs.forEach((pg) => {
        const status = pg.game_status;
        if (
          status === "starter" ||
          status === "goalkeeper" ||
          status === "dressed"
        ) {
          gamesPlayed++;
        }
        if (pg.started || status === "starter" || status === "goalkeeper") {
          gamesStarted++;
        }

        const scorerGoals =
          pg.game_events_goals_game_events_goals_scorer_player_game_idToplayer_games ||
          [];
        scorerGoals.forEach((goal: any) => {
          if (!goal.is_own_goal) {
            goals++;
            if (
              goal.goal_types &&
              goal.goal_types.toLowerCase().includes("penalty")
            ) {
              penaltyGoals++;
            }
          }
        });

        const assistGoals =
          pg.game_events_goals_game_events_goals_assist_player_game_idToplayer_games ||
          [];
        assists += assistGoals.length;

        pg.game_events_discipline?.forEach((card: any) => {
          if (card.card_type === "yellow") yellowCards++;
          else if (card.card_type === "red") redCards++;
          else if (card.card_type === "yellow_red") {
            yellowCards++;
            redCards++;
          }
        });

        pg.game_events_player_actions?.forEach((act: any) => {
          if (act.event_type === "shot") shots++;
          else if (act.event_type === "shot_on_target") {
            shots++;
            shotsOnTarget++;
          } else if (act.event_type === "save") {
            saves++;
          }
        });

        if (status === "goalkeeper") {
          const gameScore = gameScoresMap.get(pg.game_id);
          if (gameScore) {
            const isHomeGK = gameScore.homeTeamSeasonId === teamSeasonId;
            const opponentScore = isHomeGK
              ? gameScore.awayScore
              : gameScore.homeScore;
            if (opponentScore === 0) {
              cleanSheets++;
            }
          }
        }
      });

      minutesPlayed = gamesPlayed * 80;

      const person = r.people;
      return {
        id: r.id,
        playerId: r.player_id,
        firstName: person.first_name,
        lastName: person.last_name,
        teamSeasonId: teamSeasonId,
        teamName: r.team_seasons?.teams?.team_name ?? "",
        goals,
        assists,
        yellowCards,
        redCards,
        gamesPlayed,
        gamesStarted,
        minutesPlayed,
        shots,
        shotsOnTarget,
        saves,
        cleanSheets,
        penaltyGoals,
        statsSource: "calculated" as const,
        notes: null,
      };
    })
    .sort((a, b) => b.goals - a.goals || a.lastName.localeCompare(b.lastName));
}

// ─── Team Season Records (standings) ─────────────────────────────────────────

export async function getTeamSeasonRecords(
  leagueNodeSeasonId?: number,
  teamSeasonId?: number,
): Promise<TeamSeasonRecord[]> {
  let enrolledTeamSeasonIds: number[] = [];
  const enrolledTeamSeasonsMap = new Map<number, any>();

  if (leagueNodeSeasonId) {
    const enrollments = await prisma.team_league_enrollments.findMany({
      where: { league_node_season_id: leagueNodeSeasonId, is_active: true },
      include: {
        team_seasons: {
          include: { teams: { include: { clubs: true } } },
        },
      },
    });
    enrolledTeamSeasonIds = enrollments.map((e) => e.team_season_id);
    enrollments.forEach((e) => {
      enrolledTeamSeasonsMap.set(e.team_season_id, e.team_seasons);
    });
  }

  const gamesData = await prisma.games.findMany({
    where: {
      status: "completed",
      OR: [
        ...(leagueNodeSeasonId
          ? [
              {
                game_league_nodes: {
                  some: { league_node_id: leagueNodeSeasonId },
                },
              },
            ]
          : []),
        ...(leagueNodeSeasonId && enrolledTeamSeasonIds.length > 0
          ? [
              {
                AND: [
                  { home_team_season_id: { in: enrolledTeamSeasonIds } },
                  { away_team_season_id: { in: enrolledTeamSeasonIds } },
                ],
              },
            ]
          : []),
        ...(teamSeasonId
          ? [
              {
                OR: [
                  { home_team_season_id: teamSeasonId },
                  { away_team_season_id: teamSeasonId },
                ],
              },
            ]
          : []),
      ],
    },
    include: {
      game_events_major: {
        include: {
          game_events_goals: true,
        },
      },
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } },
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } },
      },
      game_league_nodes: true,
    },
  });

  const recordsMap = new Map<
    string,
    {
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
    }
  >();

  // Initialize with enrolled teams
  if (leagueNodeSeasonId) {
    enrolledTeamSeasonsMap.forEach((ts, tsId) => {
      const key = `${tsId}_${leagueNodeSeasonId}`;
      recordsMap.set(key, {
        teamSeasonId: tsId,
        teamName: ts.teams.team_name,
        clubName: ts.teams.clubs.name,
        leagueNodeSeasonId: leagueNodeSeasonId,
        wins: 0,
        losses: 0,
        draws: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        gamesPlayed: 0,
        points: 0,
      });
    });
  }

  const getOrCreateRecord = (
    tsId: number,
    lnId: number,
    teamSeasonObj: any,
  ) => {
    const key = `${tsId}_${lnId}`;
    if (!recordsMap.has(key)) {
      const team = teamSeasonObj?.teams;
      recordsMap.set(key, {
        teamSeasonId: tsId,
        teamName: team?.team_name ?? tsId.toString(),
        clubName: team?.clubs?.name ?? "",
        leagueNodeSeasonId: lnId,
        wins: 0,
        losses: 0,
        draws: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        gamesPlayed: 0,
        points: 0,
      });
    }
    return recordsMap.get(key)!;
  };

  gamesData.forEach((g) => {
    let homeScore = 0;
    let awayScore = 0;
    g.game_events_major?.forEach((major: any) => {
      if (major.event_type === "goal") {
        major.game_events_goals?.forEach((goal: any) => {
          const isHomeScorer = goal.team_season_id === g.home_team_season_id;
          if (
            (isHomeScorer && !goal.is_own_goal) ||
            (!isHomeScorer && goal.is_own_goal)
          ) {
            homeScore++;
          } else {
            awayScore++;
          }
        });
      }
    });

    const nodes = g.game_league_nodes.map((n) => n.league_node_id);
    const targetNodes = nodes.length > 0 ? nodes : [0];

    targetNodes.forEach((lnId) => {
      const targetLnId = leagueNodeSeasonId || lnId;

      if (leagueNodeSeasonId) {
        if (
          !enrolledTeamSeasonsMap.has(g.home_team_season_id) ||
          !enrolledTeamSeasonsMap.has(g.away_team_season_id)
        ) {
          return;
        }
      }

      const homeRec = getOrCreateRecord(
        g.home_team_season_id,
        targetLnId,
        g.team_seasons_games_home_team_season_idToteam_seasons,
      );
      const awayRec = getOrCreateRecord(
        g.away_team_season_id,
        targetLnId,
        g.team_seasons_games_away_team_season_idToteam_seasons,
      );

      homeRec.gamesPlayed++;
      awayRec.gamesPlayed++;
      homeRec.goalsFor += homeScore;
      homeRec.goalsAgainst += awayScore;
      awayRec.goalsFor += awayScore;
      awayRec.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        homeRec.wins++;
        homeRec.points += 3;
        awayRec.losses++;
      } else if (homeScore < awayScore) {
        awayRec.wins++;
        awayRec.points += 3;
        homeRec.losses++;
      } else {
        homeRec.draws++;
        homeRec.points += 1;
        awayRec.draws++;
        awayRec.points += 1;
      }
    });
  });

  if (teamSeasonId && recordsMap.size === 0) {
    const teamSeason = await prisma.team_seasons.findUnique({
      where: { id: teamSeasonId },
      include: { teams: { include: { clubs: true } } },
    });
    if (teamSeason) {
      const team = teamSeason.teams;
      return [
        {
          id: teamSeasonId,
          teamSeasonId: teamSeasonId,
          teamName: team.team_name,
          clubName: team.clubs.name,
          leagueNodeSeasonId: null,
          wins: 0,
          losses: 0,
          draws: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          gamesPlayed: 0,
          points: 0,
          recordSource: "calculated" as const,
        },
      ];
    }
  }

  let result = Array.from(recordsMap.values()).map((r, index) => ({
    id: index + 1,
    teamSeasonId: r.teamSeasonId,
    teamName: r.teamName,
    clubName: r.clubName,
    leagueNodeSeasonId: r.leagueNodeSeasonId || null,
    wins: r.wins,
    losses: r.losses,
    draws: r.draws,
    goalsFor: r.goalsFor,
    goalsAgainst: r.goalsAgainst,
    gamesPlayed: r.gamesPlayed,
    points: r.points,
    recordSource: "calculated" as const,
  }));

  result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });

  return result;
}

// ─── Locations ────────────────────────────────────────────────────────────────

export async function getAddresses(): Promise<Address[]> {
  const bodies = await prisma.addresses.findMany({
    orderBy: { city: "asc" },
  });
  return bodies.map((r) => ({
    id: r.id,
    addressLine1: r.address_line1,
    addressLine2: r.address_line2 ?? null,
    city: r.city ?? null,
    state: r.state ?? null,
    country: r.country ?? null,
    postalCode: r.postal_code ?? null,
  }));
}
export async function getLocations(): Promise<Location[]> {
  const locations = await prisma.locations.findMany({
    include: { addresses: true },
    orderBy: { name: "asc" },
  });
  return locations.map((r) => ({
    id: r.id,
    name: r.name,
    addressLine1: r.addresses?.address_line1 ?? null,
    addressLine2: r.addresses?.address_line2 ?? null,
    city: r.addresses?.city ?? null,
    state: r.addresses?.state ?? null,
    postalCode: r.addresses?.postal_code ?? null,
    country: r.addresses?.country ?? null,
  }));
}
export async function getsubLocations(): Promise<any[]> {
  const subLocations = await prisma.locations_sublocations.findMany({
    include: { locations: { include: { addresses: true } } },
    orderBy: { name: "asc" },
  });
  return subLocations.map((r) => ({
    id: r.id,
    name: r.name,
    capacity: r.capacity ?? null,
    description: r.description ?? null,
    surfaceType: r.surface_type,
    isActive: !!r.is_active,
    locationId: r.location_id,
    locationName: r.locations?.name ?? null,
    addressLine1: r.locations?.addresses?.address_line1 ?? null,
    addressLine2: r.locations?.addresses?.address_line2 ?? null,
    city: r.locations?.addresses?.city ?? null,
    state: r.locations?.addresses?.state ?? null,
    postalCode: r.locations?.addresses?.postal_code ?? null,
    country: r.locations?.addresses?.country ?? null,
  }));
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(teamSeasonId?: number): Promise<EventRecord[]> {
  const events = await prisma.events.findMany({
    where: { team_season_id: teamSeasonId ? teamSeasonId : undefined },
    include: {
      team_seasons: {
        include: { teams: true },
      },
      event_types: true,
      locations: true,
    },
    orderBy: { start_datetime: "asc" },
  });
  return events.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    startDatetime: toDateTimeString(r.start_datetime)!,
    endDatetime: toDateTimeString(r.end_datetime)!,
    isAllDay: !!r.is_all_day,
    teamSeasonId: r.team_season_id ?? null,
    teamName: r.team_seasons?.teams?.team_name ?? null,
    eventTypeId: r.event_type_id ?? null,
    eventTypeName: r.event_types?.name ?? null,
    eventCategory: (r.event_types?.category as EventCategory) ?? null,
    locationId: r.location_id ?? null,
    locationName: r.locations?.name ?? null,
    videoLink: r.video_link ?? null,
    recurrenceRule: r.recurrence_rule ?? null,
  }));
}

// ─── Admin Users & People ───────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  personId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  systemAdmin: boolean;
  rolesList: string;
  createdAt: string | null;
  modifiedAt: string | null;
}

export async function getUsers(): Promise<AdminUser[]> {
  const userRows = await prisma.users.findMany({
    include: {
      people: {
        include: {
          club_staff: true,
          team_staff: true,
          player_teams: true,
          player_relationships_player_relationships_related_person_idTopeople: true,
        },
      },
    },
    orderBy: {
      people: {
        last_name: "asc",
      },
    },
  });

  return userRows.map((u) => {
    const roles: string[] = [];
    if (u.system_admin) roles.push("Admin");
    if (
      u.people.club_staff.some((cs) => cs.role === "club_admin" && cs.is_active)
    ) {
      roles.push("Club Admin");
    }
    if (
      u.people.team_staff.some((ts) => ts.role === "team_admin" && ts.is_active)
    ) {
      roles.push("Team Admin");
    }
    if (
      u.people.team_staff.some(
        (ts) =>
          (ts.role === "head_coach" || ts.role === "assistant_coach") &&
          ts.is_active,
      )
    ) {
      roles.push("Coach");
    }
    if (
      u.people.player_teams.some(
        (pt) => pt.status === "rostered" && pt.is_active,
      )
    ) {
      roles.push("Player");
    }
    if (
      u.people.player_relationships_player_relationships_related_person_idTopeople.some(
        (pr) => pr.relationship === "Parent" || pr.relationship === "Guardian",
      )
    ) {
      roles.push("Parent");
    }

    return {
      id: u.id,
      personId: u.person_id,
      firstName: u.people.first_name,
      lastName: u.people.last_name,
      email: u.people.email,
      systemAdmin: u.system_admin,
      rolesList: roles.length > 0 ? roles.join(", ") : "No assigned roles",
      createdAt: toDateTimeString(u.created_at),
      modifiedAt: toDateTimeString(u.modified_at),
    };
  });
}

export interface AdminPerson {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  displayName: string;
}

export async function getPeople(): Promise<AdminPerson[]> {
  const people = await prisma.people.findMany({
    orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
  });

  return people.map((p) => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email,
    displayName: `${p.first_name} ${p.last_name} (${p.email || "No Email"})`,
  }));
}

// ─── Club Staff Records ─────────────────────────────────────────────────────

export interface ClubStaffRecord {
  id: number;
  clubId: number;
  clubName: string;
  personId: number;
  personName: string;
  role: string;
  isActive: boolean;
}

export async function getClubStaffRecords(): Promise<ClubStaffRecord[]> {
  const staff = await prisma.club_staff.findMany({
    include: {
      clubs: true,
      people: true,
    },
    orderBy: [{ clubs: { name: "asc" } }, { people: { last_name: "asc" } }],
  });

  return staff.map((s) => ({
    id: s.id,
    clubId: s.club_id,
    clubName: s.clubs.name,
    personId: s.person_id,
    personName: `${s.people.first_name} ${s.people.last_name}`,
    role: s.role,
    isActive: !!s.is_active,
  }));
}

// ─── Team Staff Records ─────────────────────────────────────────────────────

export interface TeamStaffRecord {
  id: number;
  teamSeasonId: number;
  teamName: string;
  clubName: string;
  seasonName: string;
  personId: number;
  personName: string;
  role: string;
  isActive: boolean;
}

export async function getTeamStaffRecords(): Promise<TeamStaffRecord[]> {
  const staff = await prisma.team_staff.findMany({
    include: {
      team_seasons: {
        include: {
          teams: { include: { clubs: true } },
          seasons: true,
        },
      },
      people: true,
    },
    orderBy: [
      { team_seasons: { teams: { team_name: "asc" } } },
      { people: { last_name: "asc" } },
    ],
  });

  return staff.map((s) => ({
    id: s.id,
    teamSeasonId: s.team_season_id,
    teamName: s.team_seasons.teams.team_name,
    clubName: s.team_seasons.teams.clubs.name,
    seasonName: s.team_seasons.seasons.season_name,
    personId: s.person_id,
    personName: `${s.people.first_name} ${s.people.last_name}`,
    role: s.role,
    isActive: !!s.is_active,
  }));
}

// ─── Team League Enrollments ────────────────────────────────────────────────

export interface TeamLeagueEnrollmentRecord {
  id: number;
  teamSeasonId: number;
  teamName: string;
  clubName: string;
  seasonId: number;
  seasonName: string;
  leagueId: number;
  leagueName: string;
  leagueNodeId: number;
  leagueNodeName: string;
  leagueNodeSeasonId: number;
  isActive: boolean;
}

export async function getTeamLeagueEnrollments(): Promise<
  TeamLeagueEnrollmentRecord[]
> {
  const enrollments = await prisma.team_league_enrollments.findMany({
    include: {
      team_seasons: {
        include: {
          teams: { include: { clubs: true } },
          seasons: true,
        },
      },
      league_node_seasons: {
        include: {
          league_nodes: {
            include: { leagues: true },
          },
          seasons: true,
        },
      },
    },
    orderBy: [
      { league_node_seasons: { league_nodes: { leagues: { name: "asc" } } } },
      { team_seasons: { teams: { team_name: "asc" } } },
    ],
  });

  return enrollments.map((e) => ({
    id: e.id,
    teamSeasonId: e.team_season_id,
    teamName: e.team_seasons.teams.team_name,
    clubName: e.team_seasons.teams.clubs.name,
    seasonId: e.league_node_seasons.season_id,
    seasonName: e.league_node_seasons.seasons.season_name,
    leagueId: e.league_node_seasons.league_nodes.league_id,
    leagueName: e.league_node_seasons.league_nodes.leagues.name,
    leagueNodeId: e.league_node_seasons.league_node_id,
    leagueNodeName: e.league_node_seasons.league_nodes.name,
    leagueNodeSeasonId: e.league_node_season_id,
    isActive: !!e.is_active,
  }));
}

export interface TeamLeagueLink {
  leagueId: number;
  leagueName: string;
  leagueNodeId: number;
  leagueNodeName: string;
  leagueNodeSeasonId: number;
  leagueAbbreviation?: string | null;
  isTournament?: boolean;
  record?: {
    wins: number;
    losses: number;
    draws: number;
    points: number;
  } | null;
  position?: number | null;
}

export async function getLeaguesForTeamSeason(
  teamSeasonId: number,
): Promise<TeamLeagueLink[]> {
  const enrollments = await prisma.team_league_enrollments.findMany({
    where: { team_season_id: teamSeasonId, is_active: true },
    include: {
      league_node_seasons: {
        include: {
          league_nodes: {
            include: { leagues: true },
          },
        },
      },
    },
  });

  return enrollments.map((e) => ({
    leagueId: e.league_node_seasons.league_nodes.league_id,
    leagueName: e.league_node_seasons.league_nodes.leagues.name,
    leagueNodeId: e.league_node_seasons.league_node_id,
    leagueNodeName: e.league_node_seasons.league_nodes.name,
    leagueNodeSeasonId: e.league_node_season_id,
    leagueAbbreviation:
      e.league_node_seasons.league_nodes.leagues.abbreviation ?? null,
    isTournament: !!e.league_node_seasons.league_nodes.leagues.is_tournament,
  }));
}

export interface GuestPlayerOption {
  personId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  clubName: string;
  teamName: string;
  ageGroupName: string | null;
}

export async function getGuestPlayerOptions(filters?: {
  clubId?: number;
  ageGroupId?: number;
  teamId?: number;
  searchQuery?: string;
}): Promise<GuestPlayerOption[]> {
  const whereClause: any = {};

  if (filters?.teamId) {
    whereClause.team_seasons = { team_id: filters.teamId };
  } else if (filters?.clubId) {
    whereClause.team_seasons = { teams: { club_id: filters.clubId } };
  }

  if (filters?.ageGroupId) {
    if (!whereClause.team_seasons) whereClause.team_seasons = {};
    whereClause.team_seasons.age_group = filters.ageGroupId;
  }

  if (filters?.searchQuery) {
    const q = filters.searchQuery.trim().toLowerCase();
    whereClause.people = {
      OR: [
        { first_name: { contains: q } },
        { last_name: { contains: q } },
        { email: { contains: q } },
      ],
    };
  }

  const rostered = await prisma.player_teams.findMany({
    where: whereClause,
    include: {
      people: true,
      team_seasons: {
        include: {
          teams: { include: { clubs: true } },
          age_groups: true,
        },
      },
    },
    orderBy: [
      { people: { last_name: "asc" } },
      { people: { first_name: "asc" } },
    ],
  });

  const seen = new Set<number>();
  const deduped: GuestPlayerOption[] = [];

  rostered.forEach((r) => {
    if (seen.has(r.player_id)) return;
    seen.add(r.player_id);
    deduped.push({
      personId: r.player_id,
      firstName: r.people.first_name,
      lastName: r.people.last_name,
      email: r.people.email,
      clubName: r.team_seasons.teams.clubs.name,
      teamName: r.team_seasons.teams.team_name,
      ageGroupName: r.team_seasons.age_groups?.name ?? null,
    });
  });

  return deduped;
}

export interface ExistingGuestPlayer {
  playerGameId: number;
  gameId: number;
  personId: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  teamSeasonId: number;
  teamName: string;
}

export async function getExistingGuestPlayers(
  gameIds: number[],
): Promise<ExistingGuestPlayer[]> {
  if (gameIds.length === 0) return [];

  const pgRows = await prisma.player_games.findMany({
    where: {
      game_id: { in: gameIds },
      is_guest: true,
    },
    include: {
      people: {
        include: {
          player_teams: true,
        },
      },
      team_seasons: {
        include: { teams: true },
      },
    },
  });

  return pgRows.map((r) => {
    const pt = r.people.player_teams.find(
      (p) => p.team_season_id === r.team_season_id,
    );
    return {
      playerGameId: r.id,
      gameId: r.game_id,
      personId: r.player_id,
      firstName: r.people.first_name,
      lastName: r.people.last_name,
      jerseyNumber: pt?.jersey_number ?? null,
      teamSeasonId: r.team_season_id,
      teamName: r.team_seasons?.teams?.team_name ?? "",
    };
  });
}

export interface ChildPlayer {
  personId: number;
  firstName: string;
  lastName: string;
  teamSeasons: {
    teamSeasonId: number;
    teamName: string;
    clubName: string;
    seasonName: string;
  }[];
}

export async function getParentChildren(
  parentPersonId: number,
): Promise<ChildPlayer[]> {
  const rels = await prisma.player_relationships.findMany({
    where: {
      related_person_id: parentPersonId,
      relationship: { in: ["Parent", "Guardian"] },
    },
    include: {
      people_player_relationships_player_idTopeople: {
        include: {
          player_teams: {
            include: {
              team_seasons: {
                include: {
                  teams: { include: { clubs: true } },
                  seasons: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return rels.map((r) => {
    const child = r.people_player_relationships_player_idTopeople;
    return {
      personId: r.player_id,
      firstName: child.first_name,
      lastName: child.last_name,
      teamSeasons: child.player_teams.map((pt) => ({
        teamSeasonId: pt.team_season_id,
        teamName: pt.team_seasons.teams.team_name,
        clubName: pt.team_seasons.teams.clubs.name,
        seasonName: pt.team_seasons.seasons.season_name,
      })),
    };
  });
}

export async function getDashboardTeamSeasons(
  teamIds: number[],
): Promise<TeamSeason[]> {
  if (teamIds.length === 0) return [];
  const teamSeasons = await prisma.team_seasons.findMany({
    where: {
      team_id: { in: teamIds },
      is_active: true,
    },
    include: {
      teams: {
        include: { clubs: true },
      },
      seasons: true,
      age_groups: true,
    },
    orderBy: [{ seasons: { start_date: "desc" } }],
  });

  return teamSeasons.map((r) => ({
    id: r.id,
    teamId: r.team_id,
    teamName: r.teams.team_name,
    clubId: r.teams.club_id,
    clubName: r.teams.clubs.name,
    seasonId: r.season_id,
    seasonName: r.seasons.season_name,
    ageGroup: r.age_group ?? null,
    ageGroupName: r.age_groups?.name ?? null,
    isActive: !!r.is_active,
    clubType: r.teams.clubs.type,
  }));
}

export async function getPlayerTeamSeasons(
  personId: number,
): Promise<TeamSeason[]> {
  const ptRows = await prisma.player_teams.findMany({
    where: { player_id: personId, is_active: true },
    include: {
      team_seasons: {
        include: {
          teams: { include: { clubs: true } },
          seasons: true,
          age_groups: true,
        },
      },
    },
  });

  return ptRows.map((pt) => {
    const ts = pt.team_seasons;
    return {
      id: ts.id,
      teamId: ts.team_id,
      teamName: ts.teams.team_name,
      clubId: ts.teams.club_id,
      clubName: ts.teams.clubs.name,
      seasonId: ts.season_id,
      seasonName: ts.seasons.season_name,
      ageGroup: ts.age_group ?? null,
      ageGroupName: ts.age_groups?.name ?? null,
      isActive: !!ts.is_active,
      clubType: ts.teams.clubs.type,
    };
  });
}
