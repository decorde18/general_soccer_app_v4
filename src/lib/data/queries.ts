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
    orderBy: { name: 'asc' },
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
    orderBy: { name: 'asc' },
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
    governingBodyName: r.governing_bodies?.name ?? r.governing_body_name ?? null,
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
    orderBy: [
      { league_id: 'asc' },
      { level: 'asc' },
      { display_order: 'asc' }
    ]
  });
  return nodes.map(r => ({
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
        include: { leagues: true }
      },
      seasons: true
    },
    orderBy: [
      { league_nodes: { leagues: { name: 'asc' } } },
      { league_nodes: { level: 'asc' } },
      { league_nodes: { display_order: 'asc' } }
    ]
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
    orderBy: { name: 'asc' },
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
    orderBy: { start_date: 'desc' },
  });
  return seasons.map(mapSeasonRow);
}

export async function getCurrentSeason(): Promise<Season | null> {
  const season = await prisma.seasons.findFirst({
    // Prisma model doesn't seem to have is_current, it's missing in introspection? 
    // Fallback: order by start_date desc limit 1
    orderBy: { start_date: 'desc' },
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
    isCurrent: !!r.is_current, // Note: is_current was missing in schema, might be undefined
    createdAt: toDateTimeString(r.created_at),
  };
}

// ─── Age Groups ───────────────────────────────────────────────────────────────

export async function getAgeGroups(): Promise<AgeGroup[]> {
  const groups = await prisma.age_groups.findMany({
    orderBy: { name: 'asc' },
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
    orderBy: [
      { clubs: { name: 'asc' } },
      { team_name: 'asc' },
    ],
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
    orderBy: { team_name: 'asc' },
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
        include: { clubs: true }
      },
      seasons: true
    },
    orderBy: [
      { seasons: { start_date: 'desc' } },
      { teams: { clubs: { name: 'asc' } } },
      { teams: { team_name: 'asc' } }
    ]
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
    isActive: !!r.is_active,
  }));
}

export async function getTeamSeasonById(
  id: number,
): Promise<TeamSeason | null> {
  const teamSeason = await prisma.team_seasons.findUnique({
    where: { id },
    include: {
      teams: {
        include: { clubs: true }
      },
      seasons: true
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
    isActive: !!teamSeason.is_active,
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
            include: { clubs: true }
          }
        }
      }
    },
    orderBy: [
      { people: { last_name: 'asc' } },
      { people: { first_name: 'asc' } }
    ]
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
            include: { clubs: true }
          }
        }
      }
    },
    orderBy: [
      { team_seasons: { season_id: 'desc' } }
    ]
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
          seasons: true
        }
      }
    },
    orderBy: [
      { role: 'asc' },
      { people: { last_name: 'asc' } }
    ]
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
          seasons: true
        }
      }
    },
    orderBy: [
      { team_seasons: { season_id: 'desc' } }
    ]
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
    orderBy: [
      { role: 'asc' },
      { people: { last_name: 'asc' } }
    ]
  });
  return staff.map((r) => ({
    id: r.id,
    personId: r.person_id,
    firstName: r.people?.first_name ?? '',
    lastName: r.people?.last_name ?? '',
    email: r.people?.email ?? null,
    clubId: r.club_id,
    clubName: r.clubs?.name ?? '',
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
}): Promise<Game[]> {
  const gamesData = await prisma.games.findMany({
    where: {
      season_id: filters?.seasonId ? filters.seasonId : undefined,
      OR: filters?.teamSeasonId ? [
        { home_team_season_id: filters.teamSeasonId },
        { away_team_season_id: filters.teamSeasonId }
      ] : undefined,
      game_league_nodes: filters?.leagueId ? {
        some: {
          league_node_seasons: {
            league_nodes: {
              league_id: filters.leagueId
            }
          }
        }
      } : undefined,
      status: filters?.status as any,
      game_type: filters?.gameType as any,
    },
    include: {
      seasons: true,
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } }
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } }
      },
      locations: true,
      game_scores: true,
    },
    orderBy: [
      { start_date: 'asc' },
      { start_time: 'asc' }
    ]
  });
  return gamesData.map(mapGameRow);
}

export async function getGameById(id: number): Promise<Game | null> {
  const gameData = await prisma.games.findUnique({
    where: { id },
    include: {
      seasons: true,
      team_seasons_games_home_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } }
      },
      team_seasons_games_away_team_season_idToteam_seasons: {
        include: { teams: { include: { clubs: true } } }
      },
      locations: true,
      game_scores: true,
    },
  });
  return gameData ? mapGameRow(gameData) : null;
}

function mapGameRow(r: any): Game {
  const homeTeamSeason = r.team_seasons_games_home_team_season_idToteam_seasons;
  const awayTeamSeason = r.team_seasons_games_away_team_season_idToteam_seasons;
  const homeTeam = homeTeamSeason?.teams;
  const awayTeam = awayTeamSeason?.teams;
  const score = r.game_scores;

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
    homeScore: score?.home_score ?? r.home_score ?? null,
    awayScore: score?.away_score ?? r.away_score ?? null,
    homePenaltyScore: score?.home_penalty_score ?? r.home_penalty_score ?? null,
    awayPenaltyScore: score?.away_penalty_score ?? r.away_penalty_score ?? null,
    finalStatus: score?.final_status ?? r.final_status ?? null,
    notes: r.notes ?? null,
    videoLink: r.video_link ?? null,
    timezoneLabel: r.timezone_label ?? null,
  };
}

// ─── Player Season Stats ──────────────────────────────────────────────────────

export async function getPlayerStatsByTeamSeason(
  teamSeasonId: number,
): Promise<PlayerSeasonStats[]> {
  const stats = await prisma.player_season_stats.findMany({
    where: { team_season_id: teamSeasonId },
    include: {
      people: true,
      team_seasons: {
        include: { teams: true }
      }
    },
    orderBy: [
      { goals: 'desc' },
      { people: { last_name: 'asc' } }
    ]
  });
  return stats.map(mapStatsRow);
}

export async function getPlayerStatsByPerson(
  personId: number,
): Promise<PlayerSeasonStats[]> {
  const stats = await prisma.player_season_stats.findMany({
    where: { player_id: personId },
    include: {
      people: true,
      team_seasons: {
        include: { teams: true }
      }
    },
    orderBy: [
      { team_seasons: { season_id: 'desc' } }
    ]
  });
  return stats.map(mapStatsRow);
}

function mapStatsRow(r: any): PlayerSeasonStats {
  const person = r.people ?? r;
  const team = r.team_seasons?.teams;

  return {
    id: r.id,
    playerId: r.player_id,
    firstName: person.first_name,
    lastName: person.last_name,
    teamSeasonId: r.team_season_id,
    teamName: team?.team_name ?? r.team_name,
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
    statsSource: r.stats_source as StatSource,
    notes: r.notes ?? null,
  };
}

// ─── Team Season Records (standings) ─────────────────────────────────────────

export async function getTeamSeasonRecords(
  leagueNodeSeasonId?: number,
  teamSeasonId?: number,
): Promise<TeamSeasonRecord[]> {
  const records = await prisma.team_season_records.findMany({
    where: {
      league_node_season_id: leagueNodeSeasonId ? leagueNodeSeasonId : undefined,
      team_season_id: teamSeasonId ? teamSeasonId : undefined,
    },
    include: {
      team_seasons: {
        include: { teams: { include: { clubs: true } } }
      }
    },
    orderBy: [
      { points: 'desc' },
      { wins: 'desc' }
    ]
  });
  return records.map((r) => {
    const team = r.team_seasons?.teams;
    return {
      id: r.id,
      teamSeasonId: r.team_season_id,
      teamName: team?.team_name ?? r.team_season_id.toString(), // fallback
      clubName: team?.clubs?.name ?? '',
      leagueNodeSeasonId: r.league_node_season_id ?? null,
      wins: r.wins ?? 0,
      losses: r.losses ?? 0,
      draws: r.draws ?? 0,
      goalsFor: r.goals_for ?? 0,
      goalsAgainst: r.goals_against ?? 0,
      gamesPlayed: r.games_played ?? 0,
      points: r.points ?? 0,
      recordSource: r.record_source as StatSource,
    };
  });
}

// ─── Locations ────────────────────────────────────────────────────────────────

export async function getAddresses(): Promise<Address[]> {
  const bodies = await prisma.addresses.findMany({
    orderBy: { city: 'asc' },
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
    orderBy: { name: 'asc' }
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
    orderBy: { name: 'asc' }
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
        include: { teams: true }
      },
      event_types: true,
      locations: true,
    },
    orderBy: { start_datetime: 'asc' }
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
