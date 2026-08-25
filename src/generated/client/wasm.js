
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AddressesScalarFieldEnum = {
  id: 'id',
  address_line1: 'address_line1',
  address_line2: 'address_line2',
  city: 'city',
  state: 'state',
  postal_code: 'postal_code',
  country: 'country',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Age_groupsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  begin_date: 'begin_date',
  end_date: 'end_date',
  default_period_duration: 'default_period_duration',
  default_ot_if_tied: 'default_ot_if_tied',
  default_ot_duration: 'default_ot_duration',
  default_so_if_tied: 'default_so_if_tied'
};

exports.Prisma.Club_staffScalarFieldEnum = {
  id: 'id',
  person_id: 'person_id',
  club_id: 'club_id',
  role: 'role',
  is_active: 'is_active',
  joined_date: 'joined_date',
  left_date: 'left_date',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.ClubsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  location: 'location',
  logo_url: 'logo_url',
  founded_year: 'founded_year',
  contact_info: 'contact_info',
  created_at: 'created_at',
  modified_at: 'modified_at',
  is_active: 'is_active',
  abbreviation: 'abbreviation',
  type: 'type',
  location_id: 'location_id'
};

exports.Prisma.Event_typesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  category: 'category',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.EventsScalarFieldEnum = {
  id: 'id',
  created_at: 'created_at',
  modified_at: 'modified_at',
  start_datetime: 'start_datetime',
  end_datetime: 'end_datetime',
  is_all_day: 'is_all_day',
  title: 'title',
  description: 'description',
  recurrence_rule: 'recurrence_rule',
  google_cal_id: 'google_cal_id',
  team_season_id: 'team_season_id',
  event_type_id: 'event_type_id',
  location_id: 'location_id',
  video_link: 'video_link'
};

exports.Prisma.Game_events_disciplineScalarFieldEnum = {
  id: 'id',
  major_event_id: 'major_event_id',
  team_season_id: 'team_season_id',
  player_game_id: 'player_game_id',
  opponent_jersey_number: 'opponent_jersey_number',
  card_type: 'card_type',
  card_reason: 'card_reason',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Game_events_goalsScalarFieldEnum = {
  id: 'id',
  major_event_id: 'major_event_id',
  team_season_id: 'team_season_id',
  scorer_player_game_id: 'scorer_player_game_id',
  opponent_jersey_number: 'opponent_jersey_number',
  assist_player_game_id: 'assist_player_game_id',
  defending_gk_player_game_id: 'defending_gk_player_game_id',
  is_own_goal: 'is_own_goal',
  goal_types: 'goal_types',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Game_events_majorScalarFieldEnum = {
  id: 'id',
  game_id: 'game_id',
  event_type: 'event_type',
  game_time: 'game_time',
  end_time: 'end_time',
  period: 'period',
  clock_should_run: 'clock_should_run',
  details: 'details',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Game_events_penaltiesScalarFieldEnum = {
  id: 'id',
  major_event_id: 'major_event_id',
  game_id: 'game_id',
  team_season_id: 'team_season_id',
  shooter_player_game_id: 'shooter_player_game_id',
  opponent_jersey_number: 'opponent_jersey_number',
  gk_player_game_id: 'gk_player_game_id',
  outcome: 'outcome',
  is_shootout: 'is_shootout',
  shootout_round: 'shootout_round',
  game_time: 'game_time',
  top_of_round: 'top_of_round',
  goal_id: 'goal_id',
  created_at: 'created_at',
  modified_at: 'modified_at',
  shooter_jersey_number: 'shooter_jersey_number'
};

exports.Prisma.Game_events_player_actionsScalarFieldEnum = {
  id: 'id',
  game_id: 'game_id',
  player_game_id: 'player_game_id',
  event_type: 'event_type',
  game_time: 'game_time',
  period: 'period',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Game_events_teamScalarFieldEnum = {
  id: 'id',
  game_id: 'game_id',
  team_season_id: 'team_season_id',
  event_type: 'event_type',
  game_time: 'game_time',
  period: 'period',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Game_league_nodesScalarFieldEnum = {
  game_id: 'game_id',
  league_node_id: 'league_node_id',
  is_primary: 'is_primary'
};

exports.Prisma.Game_periodsScalarFieldEnum = {
  id: 'id',
  game_id: 'game_id',
  period_number: 'period_number',
  start_time: 'start_time',
  end_time: 'end_time',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Game_standings_inclusionsScalarFieldEnum = {
  id: 'id',
  game_id: 'game_id',
  league_node_id: 'league_node_id',
  counts_for_standings: 'counts_for_standings',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Game_subsScalarFieldEnum = {
  id: 'id',
  game_id: 'game_id',
  in_player_id: 'in_player_id',
  out_player_id: 'out_player_id',
  sub_time: 'sub_time',
  period: 'period',
  gk_sub: 'gk_sub',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.GamesScalarFieldEnum = {
  id: 'id',
  season_id: 'season_id',
  timezone_label: 'timezone_label',
  home_team_season_id: 'home_team_season_id',
  away_team_season_id: 'away_team_season_id',
  status: 'status',
  game_type: 'game_type',
  notes: 'notes',
  created_at: 'created_at',
  modified_at: 'modified_at',
  default_reg_periods: 'default_reg_periods',
  period_duration: 'period_duration',
  ot_if_tied: 'ot_if_tied',
  ot_duration: 'ot_duration',
  so_if_tied: 'so_if_tied',
  video_link: 'video_link',
  location_id: 'location_id',
  google_cal_id: 'google_cal_id',
  sublocation_id: 'sublocation_id',
  start_date: 'start_date',
  start_time: 'start_time',
  end_date: 'end_date',
  end_time: 'end_time'
};

exports.Prisma.Games_overtimesScalarFieldEnum = {
  id: 'id',
  game_id: 'game_id',
  ot_1: 'ot_1',
  so_if_tied: 'so_if_tied',
  ot_if_tied: 'ot_if_tied',
  min_ot_periods: 'min_ot_periods',
  max_ot_periods: 'max_ot_periods',
  default_ot_1_minutes: 'default_ot_1_minutes',
  default_ot_2_periods: 'default_ot_2_periods',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Governing_bodiesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  abbreviation: 'abbreviation',
  website: 'website',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.League_node_seasonsScalarFieldEnum = {
  id: 'id',
  league_node_id: 'league_node_id',
  season_id: 'season_id',
  start_date: 'start_date',
  end_date: 'end_date',
  status: 'status',
  is_active: 'is_active',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.League_nodesScalarFieldEnum = {
  id: 'id',
  league_id: 'league_id',
  parent_id: 'parent_id',
  name: 'name',
  node_type: 'node_type',
  level: 'level',
  display_order: 'display_order',
  start_date: 'start_date',
  end_date: 'end_date',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.LeaguesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  abbreviation: 'abbreviation',
  governing_body_id: 'governing_body_id',
  status: 'status',
  is_active: 'is_active',
  created_at: 'created_at',
  modified_at: 'modified_at',
  description: 'description',
  is_tournament: 'is_tournament',
  period_duration: 'period_duration',
  reg_periods: 'reg_periods',
  ot_if_tied: 'ot_if_tied',
  ot_duration: 'ot_duration',
  so_if_tied: 'so_if_tied'
};

exports.Prisma.LocationsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address_id: 'address_id',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Locations_sublocationsScalarFieldEnum = {
  id: 'id',
  location_id: 'location_id',
  name: 'name',
  description: 'description',
  capacity: 'capacity',
  surface_type: 'surface_type',
  is_active: 'is_active',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.PeopleScalarFieldEnum = {
  id: 'id',
  created_at: 'created_at',
  modified_at: 'modified_at',
  birth_date: 'birth_date',
  first_name: 'first_name',
  last_name: 'last_name',
  nickname: 'nickname',
  email: 'email',
  phone: 'phone',
  gender: 'gender',
  title: 'title',
  other_last_name: 'other_last_name',
  entry_year: 'entry_year',
  credits_needed: 'credits_needed',
  is_active: 'is_active'
};

exports.Prisma.Player_gamesScalarFieldEnum = {
  id: 'id',
  game_id: 'game_id',
  player_id: 'player_id',
  team_season_id: 'team_season_id',
  position_id: 'position_id',
  started: 'started',
  game_status: 'game_status',
  created_at: 'created_at',
  modified_at: 'modified_at',
  is_guest: 'is_guest'
};

exports.Prisma.Player_relationshipsScalarFieldEnum = {
  id: 'id',
  player_id: 'player_id',
  related_person_id: 'related_person_id',
  created_at: 'created_at',
  modified_at: 'modified_at',
  relationship: 'relationship'
};

exports.Prisma.Player_teamsScalarFieldEnum = {
  id: 'id',
  grade: 'grade',
  status: 'status',
  alt_jersey_number: 'alt_jersey_number',
  gk_number: 'gk_number',
  player_id: 'player_id',
  team_season_id: 'team_season_id',
  jersey_number: 'jersey_number',
  created_at: 'created_at',
  modified_at: 'modified_at',
  position: 'position',
  previous_school: 'previous_school',
  lives_with_parents: 'lives_with_parents',
  played_last_season: 'played_last_season',
  earned_credits: 'earned_credits',
  enrolled_last_year: 'enrolled_last_year',
  captain: 'captain',
  is_active: 'is_active',
  joined_date: 'joined_date',
  left_date: 'left_date'
};

exports.Prisma.SeasonsScalarFieldEnum = {
  id: 'id',
  season_name: 'season_name',
  start_date: 'start_date',
  end_date: 'end_date',
  status: 'status',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Season_age_groupsScalarFieldEnum = {
  id: 'id',
  season_id: 'season_id',
  age_group_id: 'age_group_id',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Team_league_enrollmentsScalarFieldEnum = {
  id: 'id',
  team_season_id: 'team_season_id',
  league_node_season_id: 'league_node_season_id',
  is_active: 'is_active',
  enrollment_date: 'enrollment_date',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.Team_seasonsScalarFieldEnum = {
  id: 'id',
  team_id: 'team_id',
  season_id: 'season_id',
  created_at: 'created_at',
  modified_at: 'modified_at',
  age_group: 'age_group',
  is_active: 'is_active'
};

exports.Prisma.Team_staffScalarFieldEnum = {
  id: 'id',
  person_id: 'person_id',
  team_season_id: 'team_season_id',
  role: 'role',
  is_active: 'is_active',
  joined_date: 'joined_date',
  left_date: 'left_date',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.TeamsScalarFieldEnum = {
  id: 'id',
  club_id: 'club_id',
  team_name: 'team_name',
  gender: 'gender',
  created_at: 'created_at',
  modified_at: 'modified_at',
  is_active: 'is_active'
};

exports.Prisma.User_favoritesScalarFieldEnum = {
  id: 'id',
  person_id: 'person_id',
  team_season_id: 'team_season_id',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.User_preferencesScalarFieldEnum = {
  id: 'id',
  person_id: 'person_id',
  last_team_season_id: 'last_team_season_id',
  theme: 'theme',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.User_team_seasonsScalarFieldEnum = {
  id: 'id',
  person_id: 'person_id',
  team_season_id: 'team_season_id',
  role: 'role',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.UsersScalarFieldEnum = {
  id: 'id',
  person_id: 'person_id',
  system_admin: 'system_admin',
  password_hash: 'password_hash',
  reset_token: 'reset_token',
  reset_token_expiry: 'reset_token_expiry',
  last_login_at: 'last_login_at',
  created_at: 'created_at',
  modified_at: 'modified_at'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.club_staff_role = exports.$Enums.club_staff_role = {
  club_admin: 'club_admin',
  director: 'director',
  registrar: 'registrar'
};

exports.clubs_type = exports.$Enums.clubs_type = {
  high_school: 'high_school',
  club: 'club'
};

exports.event_types_category = exports.$Enums.event_types_category = {
  training: 'training',
  social: 'social',
  team: 'team',
  other: 'other'
};

exports.game_events_discipline_card_type = exports.$Enums.game_events_discipline_card_type = {
  yellow: 'yellow',
  red: 'red',
  yellow_red: 'yellow_red'
};

exports.game_events_penalties_outcome = exports.$Enums.game_events_penalties_outcome = {
  goal: 'goal',
  saved: 'saved',
  missed: 'missed',
  hit_post: 'hit_post'
};

exports.game_events_player_actions_event_type = exports.$Enums.game_events_player_actions_event_type = {
  shot: 'shot',
  shot_on_target: 'shot_on_target',
  shot_blocked: 'shot_blocked',
  save: 'save'
};

exports.game_events_team_event_type = exports.$Enums.game_events_team_event_type = {
  foul: 'foul',
  corner: 'corner',
  offside: 'offside',
  throw_in: 'throw_in',
  goal_kick: 'goal_kick',
  free_kick: 'free_kick'
};

exports.games_status = exports.$Enums.games_status = {
  scheduled: 'scheduled',
  in_progress: 'in_progress',
  completed: 'completed',
  postponed: 'postponed',
  cancelled: 'cancelled'
};

exports.games_game_type = exports.$Enums.games_game_type = {
  league: 'league',
  tournament: 'tournament',
  friendly: 'friendly',
  scrimmage: 'scrimmage',
  exhibition: 'exhibition',
  playoff: 'playoff'
};

exports.league_node_seasons_status = exports.$Enums.league_node_seasons_status = {
  upcoming: 'upcoming',
  active: 'active',
  completed: 'completed',
  archived: 'archived'
};

exports.league_nodes_node_type = exports.$Enums.league_nodes_node_type = {
  league: 'league',
  conference: 'conference',
  division: 'division',
  group: 'group',
  region: 'region',
  district: 'district',
  classification: 'classification',
  age_group: 'age_group',
  gender: 'gender',
  custom: 'custom',
  tournament: 'tournament'
};

exports.leagues_status = exports.$Enums.leagues_status = {
  upcoming: 'upcoming',
  active: 'active',
  inactive: 'inactive'
};

exports.player_games_game_status = exports.$Enums.player_games_game_status = {
  goalkeeper: 'goalkeeper',
  starter: 'starter',
  dressed: 'dressed',
  not_dressed: 'not_dressed',
  injured: 'injured',
  suspended: 'suspended',
  unavailable: 'unavailable'
};

exports.player_relationships_relationship = exports.$Enums.player_relationships_relationship = {
  Parent: 'Parent',
  Team_Captain: 'Team_Captain',
  Guardian: 'Guardian',
  Sibling: 'Sibling',
  Spouse: 'Spouse',
  Other: 'Other'
};

exports.player_teams_status = exports.$Enums.player_teams_status = {
  interested: 'interested',
  rostered: 'rostered',
  trying_out: 'trying_out',
  not_playing: 'not_playing'
};

exports.seasons_status = exports.$Enums.seasons_status = {
  upcoming: 'upcoming',
  active: 'active',
  completed: 'completed',
  archived: 'archived'
};

exports.team_staff_role = exports.$Enums.team_staff_role = {
  head_coach: 'head_coach',
  assistant_coach: 'assistant_coach',
  team_admin: 'team_admin',
  stats_keeper: 'stats_keeper'
};

exports.teams_gender = exports.$Enums.teams_gender = {
  Men: 'Men',
  Women: 'Women',
  Mixed: 'Mixed'
};

exports.user_team_seasons_role = exports.$Enums.user_team_seasons_role = {
  coach: 'coach',
  team_admin: 'team_admin',
  player: 'player',
  parent: 'parent'
};

exports.Prisma.ModelName = {
  addresses: 'addresses',
  age_groups: 'age_groups',
  club_staff: 'club_staff',
  clubs: 'clubs',
  event_types: 'event_types',
  events: 'events',
  game_events_discipline: 'game_events_discipline',
  game_events_goals: 'game_events_goals',
  game_events_major: 'game_events_major',
  game_events_penalties: 'game_events_penalties',
  game_events_player_actions: 'game_events_player_actions',
  game_events_team: 'game_events_team',
  game_league_nodes: 'game_league_nodes',
  game_periods: 'game_periods',
  game_standings_inclusions: 'game_standings_inclusions',
  game_subs: 'game_subs',
  games: 'games',
  games_overtimes: 'games_overtimes',
  governing_bodies: 'governing_bodies',
  league_node_seasons: 'league_node_seasons',
  league_nodes: 'league_nodes',
  leagues: 'leagues',
  locations: 'locations',
  locations_sublocations: 'locations_sublocations',
  people: 'people',
  player_games: 'player_games',
  player_relationships: 'player_relationships',
  player_teams: 'player_teams',
  seasons: 'seasons',
  season_age_groups: 'season_age_groups',
  team_league_enrollments: 'team_league_enrollments',
  team_seasons: 'team_seasons',
  team_staff: 'team_staff',
  teams: 'teams',
  user_favorites: 'user_favorites',
  user_preferences: 'user_preferences',
  user_team_seasons: 'user_team_seasons',
  users: 'users'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
