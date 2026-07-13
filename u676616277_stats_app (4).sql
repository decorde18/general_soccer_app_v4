-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 22, 2026 at 09:40 PM
-- Server version: 11.8.6-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u676616277_stats_app`
--
 
-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` int(11) NOT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'USA',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `age_groups`
--

CREATE TABLE `age_groups` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `begin_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clubs`
--

CREATE TABLE `clubs` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `founded_year` int(4) DEFAULT NULL,
  `contact_info` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `abbreviation` varchar(20) DEFAULT NULL,
  `type` enum('high_school','club') DEFAULT 'club',
  `location_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `club_staff`
--

CREATE TABLE `club_staff` (
  `id` int(11) NOT NULL,
  `person_id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `role` enum('club_admin','director','registrar') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `joined_date` date DEFAULT NULL,
  `left_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `is_all_day` tinyint(1) DEFAULT 0,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `recurrence_rule` text DEFAULT NULL,
  `google_cal_id` varchar(255) DEFAULT NULL,
  `team_season_id` int(11) DEFAULT NULL,
  `event_type_id` int(11) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `video_link` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_types`
--

CREATE TABLE `event_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` enum('training','social','team','other') DEFAULT 'other',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `games`
--

CREATE TABLE `games` (
  `id` int(11) NOT NULL,
  `season_id` int(11) NOT NULL,
  `timezone_label` varchar(10) DEFAULT NULL,
  `home_team_season_id` int(11) NOT NULL,
  `away_team_season_id` int(11) NOT NULL,
  `status` enum('scheduled','in_progress','completed','postponed','cancelled') DEFAULT 'scheduled',
  `game_type` enum('league','tournament','friendly','scrimmage','exhibition','playoff') DEFAULT 'league',
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `default_reg_periods` tinyint(4) NOT NULL DEFAULT 2,
  `video_link` varchar(500) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `google_cal_id` varchar(255) DEFAULT NULL,
  `sublocation_id` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `end_time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `games_overtimes`
--

CREATE TABLE `games_overtimes` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `ot_1` tinyint(4) DEFAULT NULL,
  `so_if_tied` tinyint(1) DEFAULT NULL,
  `ot_if_tied` tinyint(1) DEFAULT NULL,
  `min_ot_periods` tinyint(4) DEFAULT NULL,
  `max_ot_periods` tinyint(4) DEFAULT NULL,
  `default_ot_1_minutes` tinyint(4) DEFAULT NULL,
  `default_ot_2_periods` tinyint(4) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_events_discipline`
--

CREATE TABLE `game_events_discipline` (
  `id` int(11) NOT NULL,
  `major_event_id` int(11) NOT NULL,
  `team_season_id` int(11) NOT NULL COMMENT 'Team that received card',
  `player_game_id` int(11) DEFAULT NULL COMMENT 'NULL if opponent got card',
  `opponent_jersey_number` int(11) DEFAULT NULL COMMENT 'If opponent got card',
  `card_type` enum('yellow','red','yellow_red') NOT NULL,
  `card_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Discipline events (yellow/red cards)';

-- --------------------------------------------------------

--
-- Table structure for table `game_events_goals`
--

CREATE TABLE `game_events_goals` (
  `id` int(11) NOT NULL,
  `major_event_id` int(11) NOT NULL,
  `team_season_id` int(11) NOT NULL COMMENT 'Team that scored',
  `scorer_player_game_id` int(11) DEFAULT NULL COMMENT 'NULL if opponent scored',
  `opponent_jersey_number` int(11) DEFAULT NULL COMMENT 'If opponent scored',
  `assist_player_game_id` int(11) DEFAULT NULL,
  `defending_gk_player_game_id` int(11) DEFAULT NULL,
  `is_own_goal` tinyint(1) NOT NULL DEFAULT 0,
  `goal_types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`goal_types`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Goal events with scorer and assist information';

-- --------------------------------------------------------

--
-- Table structure for table `game_events_major`
--

CREATE TABLE `game_events_major` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `event_type` enum('weather','discipline','goal','penalty','injury','other') NOT NULL,
  `game_time` int(11) NOT NULL COMMENT 'Seconds from period start',
  `end_time` int(11) DEFAULT NULL COMMENT 'Seconds from period start, NULL if ongoing',
  `period` int(11) NOT NULL,
  `clock_should_run` tinyint(1) NOT NULL DEFAULT 1,
  `details` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Major game events that cause stoppages';

-- --------------------------------------------------------

--
-- Table structure for table `game_events_penalties`
--

CREATE TABLE `game_events_penalties` (
  `id` int(11) NOT NULL,
  `major_event_id` int(11) DEFAULT NULL COMMENT 'NULL for shootouts',
  `game_id` int(11) DEFAULT NULL COMMENT 'Only for shootouts',
  `team_season_id` int(11) NOT NULL COMMENT 'Team taking penalty',
  `shooter_player_game_id` int(11) DEFAULT NULL COMMENT 'NULL if opponent took it',
  `opponent_jersey_number` int(11) DEFAULT NULL COMMENT 'If opponent took it',
  `gk_player_game_id` int(11) DEFAULT NULL,
  `outcome` enum('goal','saved','missed','hit_post') NOT NULL,
  `is_shootout` tinyint(1) NOT NULL DEFAULT 0,
  `shootout_round` int(11) DEFAULT NULL,
  `game_time` int(11) DEFAULT NULL COMMENT 'Only for shootouts - seconds',
  `top_of_round` tinyint(1) DEFAULT 0 COMMENT 'Only for shootouts',
  `goal_id` int(11) DEFAULT NULL COMMENT 'FK to game_events_goals if resulted in goal',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `shooter_jersey_number` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Penalty kick events including shootouts';

-- --------------------------------------------------------

--
-- Table structure for table `game_events_player_actions`
--

CREATE TABLE `game_events_player_actions` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `player_game_id` int(11) NOT NULL,
  `event_type` enum('shot','shot_on_target','shot_blocked','save') NOT NULL,
  `game_time` int(11) NOT NULL COMMENT 'Seconds from period start',
  `period` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Player-specific actions like shots and saves';

-- --------------------------------------------------------

--
-- Table structure for table `game_events_team`
--

CREATE TABLE `game_events_team` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `team_season_id` int(11) NOT NULL,
  `event_type` enum('foul','corner','offside','throw_in','goal_kick','free_kick') NOT NULL,
  `game_time` int(11) NOT NULL COMMENT 'Seconds from period start',
  `period` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Team-level events like fouls, corners, offsides';

-- --------------------------------------------------------

--
-- Table structure for table `game_league_nodes`
--

CREATE TABLE `game_league_nodes` (
  `game_id` int(11) NOT NULL,
  `league_node_id` int(11) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_periods`
--

CREATE TABLE `game_periods` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `period_number` int(11) NOT NULL,
  `start_time` bigint(20) DEFAULT NULL,
  `end_time` bigint(20) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_scores`
--

CREATE TABLE `game_scores` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `home_score` int(11) DEFAULT NULL,
  `away_score` int(11) DEFAULT NULL,
  `home_penalty_score` int(11) DEFAULT NULL,
  `away_penalty_score` int(11) DEFAULT NULL,
  `final_status` enum('regulation','overtime','penalty_kicks') DEFAULT 'regulation',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_standings_inclusions`
--

CREATE TABLE `game_standings_inclusions` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `league_node_id` int(11) NOT NULL,
  `counts_for_standings` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game_subs`
--

CREATE TABLE `game_subs` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `in_player_id` int(11) DEFAULT NULL,
  `out_player_id` int(11) DEFAULT NULL,
  `sub_time` int(11) DEFAULT NULL COMMENT 'Game time in seconds since period 1 start (NULL = pending)',
  `period` int(11) NOT NULL,
  `gk_sub` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `governing_bodies`
--

CREATE TABLE `governing_bodies` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `abbreviation` varchar(50) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leagues`
--

CREATE TABLE `leagues` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `abbreviation` varchar(20) DEFAULT NULL,
  `governing_body_id` int(11) DEFAULT NULL,
  `status` enum('upcoming','active','inactive') NOT NULL DEFAULT 'active',
  `is_active` tinyint(1) GENERATED ALWAYS AS (`status` = 'active') VIRTUAL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_tournament` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `league_nodes`
--

CREATE TABLE `league_nodes` (
  `id` int(11) NOT NULL,
  `league_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `node_type` enum('league','conference','division','group','region','district','classification','age_group','gender','custom','tournament') NOT NULL,
  `level` int(11) DEFAULT 0,
  `display_order` int(11) DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `league_node_seasons`
--

CREATE TABLE `league_node_seasons` (
  `id` int(11) NOT NULL,
  `league_node_id` int(11) NOT NULL,
  `season_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('upcoming','active','completed','archived') NOT NULL DEFAULT 'active',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `locations_sublocations`
--

CREATE TABLE `locations_sublocations` (
  `id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `surface_type` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `people`
--

CREATE TABLE `people` (
  `id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `birth_date` date DEFAULT NULL,
  `first_name` varchar(25) NOT NULL,
  `last_name` varchar(25) NOT NULL,
  `nickname` varchar(25) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `gender` varchar(1) DEFAULT NULL,
  `title` varchar(50) DEFAULT NULL,
  `other_last_name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`other_last_name`)),
  `entry_year` year(4) DEFAULT NULL,
  `credits_needed` int(11) DEFAULT 22,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `player_games`
--

CREATE TABLE `player_games` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `team_season_id` int(11) NOT NULL,
  `position_id` int(11) DEFAULT NULL,
  `started` tinyint(1) DEFAULT 0,
  `game_status` enum('goalkeeper','starter','dressed','not_dressed','injured','suspended','unavailable') NOT NULL DEFAULT 'dressed',
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_guest` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `player_relationships`
--

CREATE TABLE `player_relationships` (
  `id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `related_person_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `relationship` enum('Parent','Team Captain','Guardian','Sibling','Spouse','Other') NOT NULL DEFAULT 'Parent'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `player_season_stats`
--

CREATE TABLE `player_season_stats` (
  `id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `team_season_id` int(11) NOT NULL,
  `goals` int(11) DEFAULT 0,
  `assists` int(11) DEFAULT 0,
  `yellow_cards` int(11) DEFAULT 0,
  `red_cards` int(11) DEFAULT 0,
  `games_played` int(11) DEFAULT 0,
  `games_started` int(11) DEFAULT 0,
  `minutes_played` int(11) DEFAULT 0,
  `shots` int(11) DEFAULT 0,
  `shots_on_target` int(11) DEFAULT 0,
  `saves` int(11) DEFAULT 0,
  `clean_sheets` int(11) DEFAULT 0,
  `penalty_goals` int(11) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `stats_source` enum('manual','calculated','hybrid') DEFAULT 'manual',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `player_teams`
--

CREATE TABLE `player_teams` (
  `id` int(11) NOT NULL,
  `grade` varchar(10) DEFAULT NULL,
  `status` enum('interested','rostered','trying out','not playing') DEFAULT 'interested',
  `alt_jersey_number` int(11) DEFAULT NULL,
  `gk_number` int(11) DEFAULT NULL,
  `player_id` int(11) NOT NULL,
  `team_season_id` int(11) NOT NULL,
  `jersey_number` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `previous_school` varchar(255) DEFAULT NULL,
  `lives_with_parents` tinyint(1) DEFAULT 1,
  `played_last_season` tinyint(1) DEFAULT NULL,
  `earned_credits` tinyint(1) DEFAULT NULL,
  `enrolled_last_year` tinyint(1) DEFAULT 1,
  `captain` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `joined_date` date DEFAULT NULL,
  `left_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `seasons`
--

CREATE TABLE `seasons` (
  `id` int(11) NOT NULL,
  `season_name` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('upcoming','active','completed','archived') NOT NULL DEFAULT 'upcoming',
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teams`
--

CREATE TABLE `teams` (
  `id` int(11) NOT NULL,
  `club_id` int(11) NOT NULL,
  `team_name` varchar(100) NOT NULL,
  `gender` enum('Men','Women','Mixed') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `team_league_enrollments`
--

CREATE TABLE `team_league_enrollments` (
  `id` int(11) NOT NULL,
  `team_season_id` int(11) NOT NULL,
  `league_node_season_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `enrollment_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `team_seasons`
--

CREATE TABLE `team_seasons` (
  `id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `season_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `age_group` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `team_season_records`
--

CREATE TABLE `team_season_records` (
  `id` int(11) NOT NULL,
  `team_season_id` int(11) NOT NULL,
  `league_node_season_id` int(11) DEFAULT NULL,
  `wins` int(11) DEFAULT 0,
  `losses` int(11) DEFAULT 0,
  `draws` int(11) DEFAULT 0,
  `goals_for` int(11) DEFAULT 0,
  `goals_against` int(11) DEFAULT 0,
  `games_played` int(11) DEFAULT 0,
  `points` int(11) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `record_source` enum('manual','calculated','hybrid') DEFAULT 'manual',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `team_staff`
--

CREATE TABLE `team_staff` (
  `id` int(11) NOT NULL,
  `person_id` int(11) NOT NULL,
  `team_season_id` int(11) NOT NULL,
  `role` enum('head_coach','assistant_coach','team_admin','stats_keeper') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `joined_date` date DEFAULT NULL,
  `left_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `person_id` int(11) NOT NULL,
  `system_admin` tinyint(1) NOT NULL DEFAULT 0,
  `password_hash` varchar(255) NOT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_favorites`
--

CREATE TABLE `user_favorites` (
  `id` int(11) NOT NULL,
  `person_id` int(11) NOT NULL,
  `team_season_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_preferences`
--

CREATE TABLE `user_preferences` (
  `id` int(11) NOT NULL,
  `person_id` int(11) NOT NULL,
  `last_team_season_id` int(11) DEFAULT NULL,
  `theme` varchar(50) DEFAULT 'light',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_team_seasons`
--

CREATE TABLE `user_team_seasons` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `person_id` int(11) NOT NULL,
  `team_season_id` int(11) NOT NULL,
  `role` enum('coach','team_admin','player','parent') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `modified_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_age_groups`
-- (See below for the actual view)
--
CREATE TABLE `v_age_groups` (
`age_group_id` int(11)
,`age_group_code` varchar(50)
,`begin_date` date
,`end_date` date
,`era` varchar(7)
,`season_id` int(11)
,`season_name` varchar(50)
,`season_start` date
,`season_end` date
,`is_current` int(1)
,`u_label` int(6)
,`age_group_name` varchar(7)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_calendar_all`
-- (See below for the actual view)
--
CREATE TABLE `v_calendar_all` (
`source_id` int(11)
,`source_type` varchar(5)
,`title` longtext
,`description` mediumtext
,`start_datetime` datetime /* mariadb-5.3 */
,`end_datetime` datetime /* mariadb-5.3 */
,`location_id` int(11)
,`video_link` varchar(500)
,`google_cal_id` varchar(255)
,`created_at` datetime /* mariadb-5.3 */
,`modified_at` datetime /* mariadb-5.3 */
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_games`
-- (See below for the actual view)
--
CREATE TABLE `v_games` (
`game_id` int(11)
,`status` enum('scheduled','in_progress','completed','postponed','cancelled')
,`game_type` enum('league','tournament','friendly','scrimmage','exhibition','playoff')
,`start_date` date
,`start_time` time
,`end_date` date
,`end_time` time
,`timezone_label` varchar(10)
,`season_name` varchar(50)
,`location_id` int(11)
,`location_name` varchar(255)
,`sublocation_id` int(11)
,`sublocation_name` varchar(100)
,`home_team_season_id` int(11)
,`home_team_name` varchar(100)
,`home_club_name` varchar(100)
,`home_gender` enum('Men','Women','Mixed')
,`away_team_season_id` int(11)
,`away_team_name` varchar(100)
,`away_club_name` varchar(100)
,`away_gender` enum('Men','Women','Mixed')
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_games_leagues`
-- (See below for the actual view)
--
CREATE TABLE `v_games_leagues` (
`game_id` int(11)
,`status` enum('scheduled','in_progress','completed','postponed','cancelled')
,`start_date` date
,`start_time` time
,`end_date` date
,`end_time` time
,`timezone_label` varchar(10)
,`season_name` varchar(50)
,`location_id` int(11)
,`location_name` varchar(255)
,`sublocation_id` int(11)
,`sublocation_name` varchar(100)
,`home_team_season_id` int(11)
,`home_team_name` varchar(100)
,`home_club_name` varchar(100)
,`home_gender` enum('Men','Women','Mixed')
,`away_team_season_id` int(11)
,`away_team_name` varchar(100)
,`away_club_name` varchar(100)
,`away_gender` enum('Men','Women','Mixed')
,`league_node_season_id` int(11)
,`league_node_id` int(11)
,`league_node_name` varchar(255)
,`league_node_type` enum('league','conference','division','group','region','district','classification','age_group','gender','custom','tournament')
,`league_id` int(11)
,`league_name` varchar(255)
,`is_primary_league` tinyint(1)
,`home_score` int(11)
,`away_score` int(11)
,`final_status` enum('regulation','overtime','penalty_kicks')
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_games_summary`
-- (See below for the actual view)
--
CREATE TABLE `v_games_summary` (
`game_id` int(11)
,`status` enum('scheduled','in_progress','completed','postponed','cancelled')
,`game_type` enum('league','tournament','friendly','scrimmage','exhibition','playoff')
,`start_date` date
,`start_time` time
,`end_date` date
,`end_time` time
,`timezone_label` varchar(10)
,`season_name` varchar(50)
,`location_id` int(11)
,`location_name` varchar(255)
,`sublocation_id` int(11)
,`sublocation_name` varchar(100)
,`home_team_season_id` int(11)
,`home_team_name` varchar(100)
,`home_club_name` varchar(100)
,`home_gender` enum('Men','Women','Mixed')
,`away_team_season_id` int(11)
,`away_team_name` varchar(100)
,`away_club_name` varchar(100)
,`away_gender` enum('Men','Women','Mixed')
,`league_names` longtext
,`league_node_names` longtext
,`leagues_array` longtext
,`home_score` bigint(22)
,`away_score` bigint(22)
,`final_status` enum('regulation','overtime','penalty_kicks')
,`score_source` varchar(10)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_game_events_discipline_complete`
-- (See below for the actual view)
--
CREATE TABLE `v_game_events_discipline_complete` (
`discipline_id` int(11)
,`major_event_id` int(11)
,`game_id` int(11)
,`stoppage_type` enum('weather','discipline','goal','penalty','injury','other')
,`game_time` int(11)
,`stoppage_end_time` int(11)
,`period` int(11)
,`clock_should_run` tinyint(1)
,`stoppage_details` text
,`team_season_id` int(11)
,`team_id` int(11)
,`team_name` varchar(100)
,`club_name` varchar(100)
,`player_game_id` int(11)
,`opponent_jersey_number` int(11)
,`player_name` varchar(51)
,`jersey_number` int(11)
,`card_type` enum('yellow','red','yellow_red')
,`card_reason` text
,`season_id` int(11)
,`season_name` varchar(50)
,`home_team_season_id` int(11)
,`away_team_season_id` int(11)
,`home_away` varchar(4)
,`created_at` timestamp
,`modified_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_game_events_goals_complete`
-- (See below for the actual view)
--
CREATE TABLE `v_game_events_goals_complete` (
`goal_id` int(11)
,`major_event_id` int(11)
,`game_id` int(11)
,`stoppage_type` enum('weather','discipline','goal','penalty','injury','other')
,`game_time` int(11)
,`stoppage_end_time` int(11)
,`period` int(11)
,`clock_should_run` tinyint(1)
,`stoppage_details` text
,`team_season_id` int(11)
,`team_id` int(11)
,`team_name` varchar(100)
,`club_name` varchar(100)
,`scorer_player_game_id` int(11)
,`scorer_opponent_jersey` int(11)
,`scorer_name` varchar(51)
,`scorer_jersey_number` int(11)
,`assist_player_game_id` int(11)
,`assist_name` varchar(51)
,`assist_jersey_number` int(11)
,`defending_gk_player_game_id` int(11)
,`gk_name` varchar(51)
,`is_own_goal` tinyint(1)
,`goal_types` longtext
,`season_id` int(11)
,`season_name` varchar(50)
,`home_team_season_id` int(11)
,`away_team_season_id` int(11)
,`home_away` varchar(4)
,`created_at` timestamp
,`modified_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_game_events_penalties_complete`
-- (See below for the actual view)
--
CREATE TABLE `v_game_events_penalties_complete` (
`penalty_id` int(11)
,`major_event_id` int(11)
,`game_id` int(11)
,`stoppage_type` enum('weather','discipline','goal','penalty','injury','other')
,`game_time` int(11)
,`stoppage_end_time` int(11)
,`period` int(11)
,`clock_should_run` tinyint(1)
,`stoppage_details` text
,`team_season_id` int(11)
,`team_id` int(11)
,`team_name` varchar(100)
,`club_name` varchar(100)
,`shooter_player_game_id` int(11)
,`shooter_opponent_jersey` int(11)
,`shooter_name` varchar(51)
,`shooter_jersey_number` int(11)
,`gk_player_game_id` int(11)
,`gk_name` varchar(51)
,`outcome` enum('goal','saved','missed','hit_post')
,`is_shootout` tinyint(1)
,`shootout_round` int(11)
,`goal_id` int(11)
,`season_id` int(11)
,`season_name` varchar(50)
,`home_team_season_id` int(11)
,`away_team_season_id` int(11)
,`home_away` varchar(4)
,`created_at` timestamp
,`modified_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `v_game_events_player_actions_complete`
--

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_game_events_player_actions_complete`  AS SELECT `gepa`.`id` AS `action_id`, `gepa`.`game_id` AS `game_id`, `gepa`.`player_game_id` AS `player_game_id`, `pg`.`team_id` AS `team_id`, `gepa`.`event_type` AS `event_type`, `gepa`.`game_time` AS `game_time`, `gepa`.`period` AS `period`, concat(`p`.`first_name`,' ',`p`.`last_name`) AS `player_name`, `pt`.`jersey_number` AS `jersey_number`, `pt`.`position` AS `position`, `ts`.`id` AS `team_season_id`, `t`.`team_name` AS `team_name`, `c`.`name` AS `club_name`, `g`.`season_id` AS `season_id`, `s`.`season_name` AS `season_name`, `g`.`home_team_season_id` AS `home_team_season_id`, `g`.`away_team_season_id` AS `away_team_season_id`, CASE WHEN `ts`.`id` = `g`.`home_team_season_id` THEN 'home' ELSE 'away' END AS `home_away`, `gepa`.`created_at` AS `created_at`, `gepa`.`modified_at` AS `modified_at` FROM ((((((((`game_events_player_actions` `gepa` join `player_games` `pg` on(`gepa`.`player_game_id` = `pg`.`id`)) join `people` `p` on(`pg`.`player_id` = `p`.`id`)) join `teams` `t` on(`pg`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `games` `g` on(`gepa`.`game_id` = `g`.`id`)) join `seasons` `s` on(`g`.`season_id` = `s`.`id`)) join `team_seasons` `ts` on(`pg`.`team_id` = `ts`.`team_id` and `g`.`season_id` = `ts`.`season_id`)) left join `player_teams` `pt` on(`pg`.`player_id` = `pt`.`player_id` and `pt`.`team_season_id` = `ts`.`id`)) ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_game_events_team_complete`
-- (See below for the actual view)
--
CREATE TABLE `v_game_events_team_complete` (
`team_event_id` int(11)
,`game_id` int(11)
,`team_season_id` int(11)
,`team_id` int(11)
,`event_type` enum('foul','corner','offside','throw_in','goal_kick','free_kick')
,`game_time` int(11)
,`period` int(11)
,`team_name` varchar(100)
,`club_name` varchar(100)
,`season_id` int(11)
,`season_name` varchar(50)
,`home_team_season_id` int(11)
,`away_team_season_id` int(11)
,`home_away` varchar(4)
,`created_at` timestamp
,`modified_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_game_timeline`
-- (See below for the actual view)
--
CREATE TABLE `v_game_timeline` (
`game_id` int(11)
,`event_id` int(11)
,`major_event_type` enum('weather','discipline','goal','penalty','injury','other')
,`game_time` int(11)
,`end_time` int(11)
,`period` int(11)
,`clock_should_run` tinyint(1)
,`goal_id` int(11)
,`scorer_name` varchar(51)
,`scoring_team_season_id` int(11)
,`scoring_team_name` varchar(100)
,`is_own_goal` tinyint(1)
,`goal_types` longtext
,`assist_name` varchar(51)
,`penalty_id` int(11)
,`penalty_outcome` enum('goal','saved','missed','hit_post')
,`is_shootout` tinyint(1)
,`shootout_round` int(11)
,`penalty_shooter_name` varchar(51)
,`discipline_id` int(11)
,`card_type` enum('yellow','red','yellow_red')
,`card_reason` text
,`card_recipient_name` varchar(51)
,`card_team_season_id` int(11)
,`card_team_name` varchar(100)
,`details` text
,`created_at` timestamp
,`modified_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `v_goalkeeper_stats`
--

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_goalkeeper_stats`  AS SELECT `psc`.`player_id` AS `player_id`, `psc`.`full_name` AS `full_name`, `psc`.`first_name` AS `first_name`, `psc`.`last_name` AS `last_name`, `psc`.`team_season_id` AS `team_season_id`, `psc`.`team_name` AS `team_name`, `psc`.`club_name` AS `club_name`, `psc`.`season_name` AS `season_name`, `psc`.`games_played` AS `games_played`, `psc`.`games_started` AS `games_started`, CASE WHEN exists(select 1 from `player_games` `pg` where `pg`.`player_id` = `psc`.`player_id` AND `pg`.`game_status` = 'goalkeeper' limit 1) THEN 'Listed GK' WHEN exists(select 1 from (`game_subs` `gs` join `player_games` `pg_in` on(`gs`.`in_player_id` = `pg_in`.`id`)) where `pg_in`.`player_id` = `psc`.`player_id` AND `gs`.`gk_sub` = 1 limit 1) THEN 'GK Sub' ELSE 'Emergency GK' END AS `gk_type`, `psc`.`total_saves` AS `total_saves`, `psc`.`total_goals_against` AS `total_goals_against`, `psc`.`clean_sheets` AS `clean_sheets`, `psc`.`total_penalties_faced` AS `total_penalties_faced`, `psc`.`total_penalty_saves` AS `total_penalty_saves`, `psc`.`save_percentage` AS `save_percentage`, `psc`.`goals_against_average` AS `goals_against_average`, CASE WHEN `psc`.`games_played` > 0 THEN round(`psc`.`clean_sheets` * 100.0 / `psc`.`games_played`,1) ELSE 0 END AS `clean_sheet_percentage`, CASE WHEN `psc`.`total_penalties_faced` > 0 THEN round(`psc`.`total_penalty_saves` * 100.0 / `psc`.`total_penalties_faced`,1) ELSE 0 END AS `penalty_save_percentage`, CASE WHEN `psc`.`games_played` > 0 THEN round(`psc`.`total_saves` * 1.0 / `psc`.`games_played`,2) ELSE 0 END AS `saves_per_game` FROM `v_player_season_stats_calculated` AS `psc` WHERE `psc`.`total_saves` > 0 OR `psc`.`total_goals_against` > 0 OR `psc`.`total_penalties_faced` > 0 OR exists(select 1 from (`player_games` `pg` join `team_seasons` `ts` on(`pg`.`team_id` = `ts`.`team_id`)) where `pg`.`player_id` = `psc`.`player_id` AND `ts`.`id` = `psc`.`team_season_id` AND `pg`.`game_status` = 'goalkeeper' limit 1) OR exists(select 1 from ((`game_subs` `gs` join `player_games` `pg_in` on(`gs`.`in_player_id` = `pg_in`.`id`)) join `team_seasons` `ts` on(`pg_in`.`team_id` = `ts`.`team_id`)) where `pg_in`.`player_id` = `psc`.`player_id` AND `ts`.`id` = `psc`.`team_season_id` AND `gs`.`gk_sub` = 1 limit 1) ORDER BY `psc`.`save_percentage` DESC, `psc`.`total_saves` DESC ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_head_to_head`
-- (See below for the actual view)
--
CREATE TABLE `v_head_to_head` (
`game_id` int(11)
,`start_date` date
,`status` enum('scheduled','in_progress','completed','postponed','cancelled')
,`season_name` varchar(50)
,`home_team_season_id` int(11)
,`home_team_name` varchar(100)
,`home_club_name` varchar(100)
,`away_team_season_id` int(11)
,`away_team_name` varchar(100)
,`away_club_name` varchar(100)
,`home_score` int(11)
,`away_score` int(11)
,`final_status` enum('regulation','overtime','penalty_kicks')
,`winner` varchar(4)
,`league_names` longtext
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_leagues`
-- (See below for the actual view)
--
CREATE TABLE `v_leagues` (
`league_id` int(11)
,`league_name` varchar(255)
,`league_abbreviation` varchar(20)
,`league_description` text
,`league_is_active` tinyint(1)
,`is_tournament` tinyint(1)
,`governing_body_id` int(11)
,`governing_body_name` varchar(255)
,`governing_body_abbreviation` varchar(50)
,`governing_body_website` varchar(255)
,`total_nodes` bigint(21)
,`root_nodes` bigint(21)
,`league_nodes` bigint(21)
,`conference_nodes` bigint(21)
,`division_nodes` bigint(21)
,`group_nodes` bigint(21)
,`seasons_count` bigint(21)
,`current_season_nodes` bigint(21)
,`current_teams_count` bigint(21)
,`created_at` timestamp
,`modified_at` datetime
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_leagues_detailed`
-- (See below for the actual view)
--
CREATE TABLE `v_leagues_detailed` (
`league_id` int(11)
,`league_name` varchar(255)
,`league_description` text
,`league_is_active` tinyint(1)
,`is_tournament` tinyint(1)
,`governing_body_id` int(11)
,`governing_body_name` varchar(255)
,`node_id` int(11)
,`node_parent_id` int(11)
,`node_name` varchar(255)
,`node_type` enum('league','conference','division','group','region','district','classification','age_group','gender','custom','tournament')
,`node_level` int(11)
,`display_order` int(11)
,`league_node_season_id` int(11)
,`season_id` int(11)
,`season_name` varchar(50)
,`season_start` date
,`season_end` date
,`is_current_season` int(1)
,`node_season_is_active` tinyint(1)
,`enrolled_teams_count` bigint(21)
,`active_teams_count` bigint(21)
,`league_created_at` timestamp
,`node_created_at` timestamp
,`node_season_created_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_league_hierarchy`
-- (See below for the actual view)
--
CREATE TABLE `v_league_hierarchy` (
`club_id` int(11)
,`club_name` varchar(100)
,`club_abbreviation` varchar(20)
,`club_location` varchar(100)
,`team_id` int(11)
,`team_name` varchar(100)
,`gender` enum('Men','Women','Mixed')
,`team_season_id` int(11)
,`season_name` varchar(50)
,`league_id` int(11)
,`league_name` varchar(255)
,`league_hierarchy` varchar(1000)
,`node_type` enum('league','conference','division','group','region','district','classification','age_group','gender','custom','tournament')
,`enrollment_date` date
,`is_active` tinyint(1)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_league_teams`
-- (See below for the actual view)
--
CREATE TABLE `v_league_teams` (
`club_id` int(11)
,`club_name` varchar(100)
,`team_id` int(11)
,`team_name` varchar(100)
,`team_season_id` int(11)
,`season_name` varchar(50)
,`league_id` int(11)
,`league_name` varchar(255)
,`league_node_season_id` int(11)
,`hierarchy_ids` varchar(200)
,`hierarchy_names` varchar(1000)
,`enrollment_date` date
,`is_active` tinyint(1)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_locations`
-- (See below for the actual view)
--
CREATE TABLE `v_locations` (
`location_id` int(11)
,`location_name` varchar(255)
,`address_id` int(11)
,`address_line1` varchar(255)
,`address_line2` varchar(255)
,`city` varchar(100)
,`state` varchar(50)
,`postal_code` varchar(20)
,`country` varchar(100)
,`full_address` text
,`sublocation_count` bigint(21)
,`active_sublocation_count` bigint(21)
,`created_at` timestamp
,`modified_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_locations_detailed`
-- (See below for the actual view)
--
CREATE TABLE `v_locations_detailed` (
`location_id` int(11)
,`location_name` varchar(255)
,`address_id` int(11)
,`address_line1` varchar(255)
,`address_line2` varchar(255)
,`city` varchar(100)
,`state` varchar(50)
,`postal_code` varchar(20)
,`country` varchar(100)
,`full_address` text
,`sublocation_id` int(11)
,`sublocation_name` varchar(100)
,`sublocation_description` text
,`sublocation_capacity` int(11)
,`sublocation_surface_type` varchar(50)
,`sublocation_is_active` tinyint(1)
,`location_created_at` timestamp
,`location_modified_at` timestamp
,`sublocation_created_at` timestamp
,`sublocation_modified_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_players`
-- (See below for the actual view)
--
CREATE TABLE `v_players` (
`player_id` int(11)
,`first_name` varchar(25)
,`last_name` varchar(25)
,`nickname` varchar(25)
,`email` varchar(100)
,`phone` varchar(20)
,`gender` varchar(1)
,`birth_date` date
,`entry_year` year(4)
,`player_is_active` tinyint(1)
,`player_team_id` int(11)
,`team_season_id` int(11)
,`jersey_number` int(11)
,`position` varchar(50)
,`roster_is_active` tinyint(1)
,`joined_date` date
,`left_date` date
,`team_id` int(11)
,`team_name` varchar(100)
,`team_gender` enum('Men','Women','Mixed')
,`team_is_active` tinyint(1)
,`season_id` int(11)
,`age_group_id` int(11)
,`age_group_name` varchar(50)
,`club_id` int(11)
,`club_name` varchar(100)
,`club_abbreviation` varchar(20)
,`club_location` varchar(100)
,`club_type` enum('high_school','club')
,`club_logo_url` varchar(255)
,`club_is_active` tinyint(1)
,`season_name` varchar(50)
,`season_start` date
,`season_end` date
,`is_current` int(1)
,`current_age` bigint(21)
,`full_name` varchar(51)
,`display_name` varchar(154)
,`player_created_at` datetime
,`player_modified_at` datetime
,`roster_created_at` datetime
,`roster_modified_at` datetime
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_player_availability`
-- (See below for the actual view)
--
CREATE TABLE `v_player_availability` (
`player_id` int(11)
,`full_name` varchar(51)
,`team_season_id` int(11)
,`team_name` varchar(100)
,`club_name` varchar(100)
,`jersey_number` int(11)
,`position` varchar(50)
,`roster_active` tinyint(1)
,`recent_red_cards` bigint(21)
,`season_yellow_cards` decimal(42,0)
,`availability_status` varchar(9)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_player_career_stats`
-- (See below for the actual view)
--
CREATE TABLE `v_player_career_stats` (
`player_id` int(11)
,`full_name` varchar(51)
,`first_name` varchar(25)
,`last_name` varchar(25)
,`teams_played_for` bigint(21)
,`seasons_played` bigint(21)
,`career_games` decimal(42,0)
,`career_starts` decimal(44,0)
,`career_goals` decimal(64,0)
,`career_penalty_goals` decimal(64,0)
,`career_assists` decimal(64,0)
,`career_shots` decimal(64,0)
,`career_shots_on_target` decimal(64,0)
,`career_saves` decimal(64,0)
,`career_goals_against` decimal(64,0)
,`career_penalties_faced` decimal(64,0)
,`career_penalty_saves` decimal(64,0)
,`career_clean_sheets` decimal(54,0)
,`career_yellow_cards` decimal(64,0)
,`career_red_cards` decimal(64,0)
,`career_goals_per_game` decimal(63,2)
,`career_shooting_percentage` decimal(62,1)
,`career_save_percentage` decimal(62,1)
,`career_gaa` decimal(63,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_player_games`
-- (See below for the actual view)
--
CREATE TABLE `v_player_games` (
`player_game_id` int(11)
,`game_id` int(11)
,`player_id` int(11)
,`team_id` int(11)
,`position_id` int(11)
,`started` tinyint(1)
,`game_status` enum('goalkeeper','starter','dressed','not_dressed','injured','suspended','unavailable')
,`is_guest` tinyint(1)
,`first_name` varchar(25)
,`last_name` varchar(25)
,`full_name` varchar(51)
,`nickname` varchar(25)
,`player_team_id` int(11)
,`jersey_number` int(11)
,`primary_position` varchar(50)
,`team_season_id` int(11)
,`captain` tinyint(1)
,`grade` varchar(10)
,`team_name` varchar(100)
,`team_gender` enum('Men','Women','Mixed')
,`club_name` varchar(100)
,`club_abbreviation` varchar(20)
,`club_logo_url` varchar(255)
,`start_date` date
,`start_time` time
,`game_status_overall` enum('scheduled','in_progress','completed','postponed','cancelled')
,`home_team_season_id` int(11)
,`away_team_season_id` int(11)
,`season_id` int(11)
,`home_away` varchar(4)
,`season_name` varchar(50)
,`is_current_season` int(1)
,`age_group_id` int(11)
,`age_group_name` varchar(50)
,`created_at` datetime
,`modified_at` datetime
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_player_game_stats_enhanced`
-- (See below for the actual view)
--
CREATE TABLE `v_player_game_stats_enhanced` (
`player_game_id` int(11)
,`game_id` int(11)
,`player_id` int(11)
,`team_id` int(11)
,`first_name` varchar(25)
,`last_name` varchar(25)
,`full_name` varchar(51)
,`jersey_number` int(11)
,`position` varchar(50)
,`game_status` enum('goalkeeper','starter','dressed','not_dressed','injured','suspended','unavailable')
,`started` int(1)
,`team_season_id` int(11)
,`goals` bigint(21)
,`penalty_goals` bigint(21)
,`assists` bigint(21)
,`shots` bigint(21)
,`shots_on_target` bigint(21)
,`saves` bigint(21)
,`goals_against` bigint(21)
,`penalties_faced` bigint(21)
,`penalty_saves` bigint(21)
,`yellow_cards` bigint(21)
,`red_cards` bigint(21)
,`clean_sheet` int(1)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_player_period_stats`
-- (See below for the actual view)
--
CREATE TABLE `v_player_period_stats` (
`player_game_id` int(11)
,`game_id` int(11)
,`player_id` int(11)
,`full_name` varchar(51)
,`period_number` int(11)
,`period_goals` bigint(21)
,`period_assists` bigint(21)
,`period_shots` bigint(21)
,`period_shots_on_target` bigint(21)
,`period_saves` bigint(21)
,`period_goals_against` bigint(21)
,`period_yellow_cards` bigint(21)
,`period_fouls` int(1)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_player_season_stats_calculated`
-- (See below for the actual view)
--
CREATE TABLE `v_player_season_stats_calculated` (
`player_id` int(11)
,`full_name` varchar(51)
,`first_name` varchar(25)
,`last_name` varchar(25)
,`team_season_id` int(11)
,`team_id` int(11)
,`team_name` varchar(100)
,`club_name` varchar(100)
,`season_id` int(11)
,`season_name` varchar(50)
,`games_played` bigint(21)
,`games_started` decimal(22,0)
,`total_goals` decimal(42,0)
,`total_penalty_goals` decimal(42,0)
,`total_assists` decimal(42,0)
,`total_shots` decimal(42,0)
,`total_shots_on_target` decimal(42,0)
,`total_saves` decimal(42,0)
,`total_goals_against` decimal(42,0)
,`total_penalties_faced` decimal(42,0)
,`total_penalty_saves` decimal(42,0)
,`clean_sheets` decimal(32,0)
,`total_yellow_cards` decimal(42,0)
,`total_red_cards` decimal(42,0)
,`goals_per_game` decimal(46,2)
,`shooting_percentage` decimal(47,1)
,`shot_accuracy` decimal(47,1)
,`save_percentage` decimal(47,1)
,`goals_against_average` decimal(46,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_player_stats_combined`
-- (See below for the actual view)
--
CREATE TABLE `v_player_stats_combined` (
`player_id` int(11)
,`first_name` varchar(25)
,`last_name` varchar(25)
,`team_season_id` int(11)
,`team_name` varchar(100)
,`club_name` varchar(100)
,`season_name` varchar(50)
,`calculated_goals` decimal(42,0)
,`calculated_assists` decimal(42,0)
,`calculated_yellow_cards` decimal(42,0)
,`calculated_red_cards` decimal(42,0)
,`calculated_shots` decimal(42,0)
,`calculated_shots_on_target` decimal(42,0)
,`calculated_saves` decimal(42,0)
,`calculated_games_played` bigint(21)
,`calculated_games_started` decimal(22,0)
,`manual_goals` int(11)
,`manual_assists` int(11)
,`manual_yellow_cards` int(11)
,`manual_red_cards` int(11)
,`manual_games_played` int(11)
,`manual_games_started` int(11)
,`manual_shots` int(11)
,`manual_shots_on_target` int(11)
,`manual_saves` int(11)
,`manual_clean_sheets` int(11)
,`stats_source` enum('manual','calculated','hybrid')
,`total_goals` decimal(42,0)
,`total_assists` decimal(42,0)
,`total_yellow_cards` decimal(42,0)
,`total_red_cards` decimal(42,0)
,`total_games_played` bigint(21)
,`total_shots` decimal(42,0)
,`total_saves` decimal(42,0)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_standings`
-- (See below for the actual view)
--
CREATE TABLE `v_standings` (
`team_season_id` int(11)
,`team_id` int(11)
,`team_name` varchar(100)
,`team_gender` enum('Men','Women','Mixed')
,`club_id` int(11)
,`club_name` varchar(100)
,`club_abbreviation` varchar(20)
,`club_logo_url` varchar(255)
,`club_type` enum('high_school','club')
,`club_location` varchar(100)
,`season_id` int(11)
,`season_name` varchar(50)
,`season_start` date
,`season_end` date
,`is_current_season` int(1)
,`age_group_id` int(11)
,`age_group_name` varchar(50)
,`league_id` int(11)
,`league_name` varchar(255)
,`league_node_season_id` int(11)
,`league_node_id` int(11)
,`league_node_name` varchar(255)
,`league_node_type` enum('league','conference','division','group','region','district','classification','age_group','gender','custom','tournament')
,`league_level` int(11)
,`wins` decimal(22,0)
,`losses` decimal(22,0)
,`draws` decimal(22,0)
,`games_played` bigint(21)
,`goals_for` bigint(22)
,`goals_against` bigint(22)
,`goal_difference` bigint(12)
,`points` decimal(22,0)
,`home_wins` decimal(22,0)
,`home_losses` decimal(22,0)
,`home_draws` decimal(22,0)
,`away_wins` decimal(22,0)
,`away_losses` decimal(22,0)
,`away_draws` decimal(22,0)
,`current_streak` binary(0)
,`last_5_form` binary(0)
,`points_per_game` decimal(26,2)
,`win_percentage` decimal(28,2)
,`goals_per_game` decimal(14,2)
,`goals_against_per_game` decimal(14,2)
,`record_source` varchar(10)
,`enrollment_is_active` tinyint(1)
,`team_season_is_active` tinyint(1)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_stat_leaders`
-- (See below for the actual view)
--
CREATE TABLE `v_stat_leaders` (
`player_id` int(11)
,`team_id` int(11)
,`team_season_id` int(11)
,`season_id` int(11)
,`first_name` varchar(25)
,`last_name` varchar(25)
,`full_name` varchar(51)
,`jersey_number` int(11)
,`position` varchar(50)
,`team_name` varchar(100)
,`club_name` varchar(100)
,`season_name` varchar(50)
,`total_goals` decimal(42,0)
,`total_assists` decimal(42,0)
,`total_shots` decimal(42,0)
,`total_shots_on_target` decimal(42,0)
,`total_saves` decimal(42,0)
,`total_yellow_cards` decimal(42,0)
,`total_red_cards` decimal(42,0)
,`games_played` bigint(21)
,`games_started` decimal(22,0)
,`goals_per_game` decimal(46,2)
,`shooting_percentage` decimal(47,1)
,`save_percentage` decimal(47,1)
,`goals_against_average` decimal(46,2)
,`clean_sheets` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_teams_all`
-- (See below for the actual view)
--
CREATE TABLE `v_teams_all` (
`id` int(11)
,`team_id` int(11)
,`season_id` int(11)
,`team_season_is_active` tinyint(1)
,`team_name` varchar(100)
,`club_id` int(11)
,`team_is_active` tinyint(1)
,`gender` enum('Men','Women','Mixed')
,`age_group` int(11)
,`club_name` varchar(100)
,`type` enum('high_school','club')
,`location` varchar(100)
,`logo_url` varchar(255)
,`founded_year` int(4)
,`club_is_active` tinyint(1)
,`abbreviation` varchar(20)
,`season_name` varchar(50)
,`season_start` date
,`season_end` date
,`is_current` int(1)
,`age_group_name` varchar(50)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_team_form`
-- (See below for the actual view)
--
CREATE TABLE `v_team_form` (
`team_season_id` int(11)
,`team_name` varchar(100)
,`club_name` varchar(100)
,`season_name` varchar(50)
,`recent_games` bigint(21)
,`recent_wins` decimal(22,0)
,`recent_losses` decimal(22,0)
,`recent_draws` decimal(22,0)
,`recent_goals_for` decimal(32,0)
,`recent_goals_against` decimal(32,0)
,`recent_points` decimal(22,0)
,`last_game_date` date
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_team_games`
-- (See below for the actual view)
--
CREATE TABLE `v_team_games` (
`id` int(11)
,`season_id` int(11)
,`timezone_label` varchar(10)
,`home_team_season_id` int(11)
,`away_team_season_id` int(11)
,`status` varchar(11)
,`notes` mediumtext
,`created_at` datetime /* mariadb-5.3 */
,`modified_at` datetime /* mariadb-5.3 */
,`default_reg_periods` tinyint(4)
,`video_link` varchar(500)
,`location_id` int(11)
,`google_cal_id` varchar(255)
,`sublocation_id` int(11)
,`start_date` date
,`start_time` time /* mariadb-5.3 */
,`end_date` date
,`end_time` time /* mariadb-5.3 */
,`team_season_id` int(11)
);

-- --------------------------------------------------------

--
-- Table structure for table `v_team_game_stats`
--

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_team_game_stats`  AS SELECT `g`.`id` AS `game_id`, `g`.`season_id` AS `season_id`, `ts`.`id` AS `team_season_id`, `ts`.`team_id` AS `team_id`, `t`.`team_name` AS `team_name`, `c`.`name` AS `club_name`, `g`.`start_date` AS `start_date`, `g`.`status` AS `status`, CASE WHEN `g`.`home_team_season_id` = `ts`.`id` THEN 'home' WHEN `g`.`away_team_season_id` = `ts`.`id` THEN 'away' END AS `home_away`, CASE `opponent_team_season_id` ELSE `g`.`home_team_season_id` AS `end` END FROM (((((((((`games` `g` join `team_seasons` `ts` on(`ts`.`id` = `g`.`home_team_season_id` or `ts`.`id` = `g`.`away_team_season_id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) left join `game_events_goals` `geg` on(`geg`.`major_event_id` in (select `u676616277_stats_app`.`game_events_major`.`id` from `game_events_major` where `u676616277_stats_app`.`game_events_major`.`game_id` = `g`.`id`))) left join `game_events_penalties` `gep` on(`gep`.`major_event_id` in (select `u676616277_stats_app`.`game_events_major`.`id` from `game_events_major` where `u676616277_stats_app`.`game_events_major`.`game_id` = `g`.`id`) or `gep`.`game_id` = `g`.`id`)) left join `player_games` `pg` on(`pg`.`game_id` = `g`.`id`)) left join `game_events_player_actions` `gepa` on(`gepa`.`player_game_id` = `pg`.`id`)) left join `game_events_team` `get` on(`get`.`game_id` = `g`.`id`)) left join `game_events_discipline` `ged` on(`ged`.`major_event_id` in (select `u676616277_stats_app`.`game_events_major`.`id` from `game_events_major` where `u676616277_stats_app`.`game_events_major`.`game_id` = `g`.`id`))) GROUP BY `g`.`id`, `g`.`season_id`, `ts`.`id`, `ts`.`team_id`, `t`.`team_name`, `c`.`name`, `g`.`start_date`, `g`.`status`, `g`.`home_team_season_id`, `g`.`away_team_season_id` ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_team_standings_detailed`
-- (See below for the actual view)
--
CREATE TABLE `v_team_standings_detailed` (
`team_season_id` int(11)
,`team_name` varchar(100)
,`club_name` varchar(100)
,`season_name` varchar(50)
,`league_node_season_id` int(11)
,`league_node_name` varchar(255)
,`league_name` varchar(255)
,`home_wins` decimal(22,0)
,`home_losses` decimal(22,0)
,`home_draws` decimal(22,0)
,`away_wins` decimal(22,0)
,`away_losses` decimal(22,0)
,`away_draws` decimal(22,0)
,`calculated_wins` decimal(22,0)
,`calculated_losses` decimal(22,0)
,`calculated_draws` decimal(22,0)
,`calculated_goals_for` decimal(33,0)
,`calculated_goals_against` decimal(33,0)
,`manual_wins` int(11)
,`manual_losses` int(11)
,`manual_draws` int(11)
,`manual_goals_for` int(11)
,`manual_goals_against` int(11)
,`manual_points` int(11)
,`record_source` enum('manual','calculated','hybrid')
,`total_wins` decimal(22,0)
,`total_losses` decimal(22,0)
,`total_draws` decimal(22,0)
,`total_goals_for` decimal(33,0)
,`total_goals_against` decimal(33,0)
,`total_points` decimal(22,0)
,`goal_difference` decimal(34,0)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_users`
-- (See below for the actual view)
--
CREATE TABLE `v_users` (
`person_id` int(11)
,`first_name` varchar(25)
,`last_name` varchar(25)
,`nickname` varchar(25)
,`email` varchar(100)
,`phone` varchar(20)
,`gender` varchar(1)
,`birth_date` date
,`title` varchar(50)
,`other_last_name` longtext
,`entry_year` year(4)
,`credits_needed` int(11)
,`system_admin` tinyint(1)
,`is_active` tinyint(1)
,`person_created_at` datetime
,`person_modified_at` datetime
,`user_id` int(11)
,`last_login_at` datetime
,`preferences_id` int(11)
,`theme` varchar(50)
,`last_team_season_id` int(11)
,`last_team_id` int(11)
,`last_team_name` varchar(100)
,`last_team_gender` enum('Men','Women','Mixed')
,`last_season_id` int(11)
,`last_season_name` varchar(50)
,`last_season_is_current` int(1)
,`team_season_count` bigint(21)
,`roles_json` longtext
,`has_team_access` int(1)
,`favorite_count` bigint(21)
,`favorite_team_season_ids` longtext
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_user_teams`
-- (See below for the actual view)
--
CREATE TABLE `v_user_teams` (
`person_id` int(11)
,`team_season_id` int(11)
,`team_id` int(11)
,`season_id` int(11)
,`team_name` varchar(100)
,`gender` varchar(5)
,`club_id` int(11)
,`club_name` varchar(100)
,`club_abbreviation` varchar(20)
,`club_location` varchar(100)
,`club_logo_url` varchar(255)
,`club_type` varchar(11)
,`season_name` varchar(50)
,`season_start` date
,`season_end` date
,`is_current_season` int(1)
,`age_group` int(11)
,`age_group_name` varchar(50)
,`team_season_is_active` tinyint(4)
,`user_role` varchar(61)
,`jersey_number` int(11)
,`role_joined_date` date
,`role_left_date` date
,`role_is_active` int(4)
,`is_favorite` int(1)
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `age_groups`
--
ALTER TABLE `age_groups`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `clubs`
--
ALTER TABLE `clubs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_clubs_location` (`location_id`);

--
-- Indexes for table `club_staff`
--
ALTER TABLE `club_staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_person_club_role` (`person_id`,`club_id`,`role`),
  ADD KEY `idx_club_staff_person` (`person_id`),
  ADD KEY `idx_club_staff_club` (`club_id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_type_id` (`event_type_id`),
  ADD KEY `location_id` (`location_id`),
  ADD KEY `fk_events_team_season` (`team_season_id`);

--
-- Indexes for table `event_types`
--
ALTER TABLE `event_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `games`
--
ALTER TABLE `games`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_games_season` (`season_id`),
  ADD KEY `fk_games_home_team_season` (`home_team_season_id`),
  ADD KEY `fk_games_away_team_season` (`away_team_season_id`),
  ADD KEY `fk_games_location` (`location_id`),
  ADD KEY `fk_games_sublocation` (`sublocation_id`);

--
-- Indexes for table `games_overtimes`
--
ALTER TABLE `games_overtimes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_games_overtimes_game` (`game_id`);

--
-- Indexes for table `game_events_discipline`
--
ALTER TABLE `game_events_discipline`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_discipline_major` (`major_event_id`),
  ADD KEY `idx_discipline_team` (`team_season_id`),
  ADD KEY `idx_discipline_player` (`player_game_id`),
  ADD KEY `idx_discipline_card_type` (`card_type`);

--
-- Indexes for table `game_events_goals`
--
ALTER TABLE `game_events_goals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_goals_major` (`major_event_id`),
  ADD KEY `idx_goals_team` (`team_season_id`),
  ADD KEY `idx_goals_scorer` (`scorer_player_game_id`),
  ADD KEY `idx_goals_assist` (`assist_player_game_id`),
  ADD KEY `idx_goals_gk` (`defending_gk_player_game_id`);

--
-- Indexes for table `game_events_major`
--
ALTER TABLE `game_events_major`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_major_game` (`game_id`),
  ADD KEY `idx_major_type` (`event_type`),
  ADD KEY `idx_major_time` (`game_id`,`period`,`game_time`);

--
-- Indexes for table `game_events_penalties`
--
ALTER TABLE `game_events_penalties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_penalties_major` (`major_event_id`),
  ADD KEY `idx_penalties_game` (`game_id`),
  ADD KEY `idx_penalties_team` (`team_season_id`),
  ADD KEY `idx_penalties_shooter` (`shooter_player_game_id`),
  ADD KEY `idx_penalties_gk` (`gk_player_game_id`),
  ADD KEY `idx_penalties_goal` (`goal_id`),
  ADD KEY `idx_penalties_shootout` (`is_shootout`,`shootout_round`);

--
-- Indexes for table `game_events_player_actions`
--
ALTER TABLE `game_events_player_actions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_player_action_game` (`game_id`),
  ADD KEY `idx_player_action_player` (`player_game_id`),
  ADD KEY `idx_player_action_type` (`event_type`),
  ADD KEY `idx_player_action_time` (`game_id`,`period`,`game_time`);

--
-- Indexes for table `game_events_team`
--
ALTER TABLE `game_events_team`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_events_team_game` (`game_id`),
  ADD KEY `idx_events_team_season` (`team_season_id`),
  ADD KEY `idx_events_team_type` (`event_type`),
  ADD KEY `idx_events_team_time` (`game_id`,`period`,`game_time`);

--
-- Indexes for table `game_league_nodes`
--
ALTER TABLE `game_league_nodes`
  ADD PRIMARY KEY (`game_id`,`league_node_id`),
  ADD KEY `fk_game_league_nodes_season` (`league_node_id`);

--
-- Indexes for table `game_periods`
--
ALTER TABLE `game_periods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `game_id` (`game_id`,`period_number`);

--
-- Indexes for table `game_scores`
--
ALTER TABLE `game_scores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_game_score` (`game_id`),
  ADD KEY `idx_game_scores_game` (`game_id`);

--
-- Indexes for table `game_standings_inclusions`
--
ALTER TABLE `game_standings_inclusions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_game_league` (`game_id`,`league_node_id`),
  ADD KEY `league_node_id` (`league_node_id`);

--
-- Indexes for table `game_subs`
--
ALTER TABLE `game_subs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_game_subs_in` (`in_player_id`),
  ADD KEY `fk_game_subs_out` (`out_player_id`),
  ADD KEY `game_subs_ibfk_1` (`game_id`);

--
-- Indexes for table `governing_bodies`
--
ALTER TABLE `governing_bodies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leagues`
--
ALTER TABLE `leagues`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_leagues_governing_body` (`governing_body_id`);

--
-- Indexes for table `league_nodes`
--
ALTER TABLE `league_nodes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`),
  ADD KEY `fk_league_nodes_league` (`league_id`);

--
-- Indexes for table `league_node_seasons`
--
ALTER TABLE `league_node_seasons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_node_season` (`league_node_id`,`season_id`),
  ADD KEY `fk_ln_season_season` (`season_id`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `address_id` (`address_id`);

--
-- Indexes for table `locations_sublocations`
--
ALTER TABLE `locations_sublocations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_location_sublocation` (`location_id`,`name`),
  ADD KEY `fk_locations_sublocations_location` (`location_id`);

--
-- Indexes for table `people`
--
ALTER TABLE `people`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `player_games`
--
ALTER TABLE `player_games`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `game_id` (`game_id`,`player_id`),
  ADD KEY `position_id` (`position_id`),
  ADD KEY `idx_player_games_game` (`game_id`),
  ADD KEY `idx_player_games_player` (`player_id`),
  ADD KEY `idx_player_games_team_season` (`team_season_id`);

--
-- Indexes for table `player_relationships`
--
ALTER TABLE `player_relationships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `player_id` (`player_id`,`related_person_id`),
  ADD KEY `fk_parent_person` (`related_person_id`);

--
-- Indexes for table `player_season_stats`
--
ALTER TABLE `player_season_stats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_player_team_season` (`player_id`,`team_season_id`),
  ADD KEY `idx_player_season_stats_player` (`player_id`),
  ADD KEY `idx_player_season_stats_team_season` (`team_season_id`),
  ADD KEY `idx_player_season_stats_composite` (`player_id`,`team_season_id`);

--
-- Indexes for table `player_teams`
--
ALTER TABLE `player_teams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_player_teams_player` (`player_id`),
  ADD KEY `idx_player_teams_team_season` (`team_season_id`);

--
-- Indexes for table `seasons`
--
ALTER TABLE `seasons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `teams`
--
ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `club_id` (`club_id`);

--
-- Indexes for table `team_league_enrollments`
--
ALTER TABLE `team_league_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_enrollment` (`team_season_id`,`league_node_season_id`),
  ADD KEY `idx_team_league_enrollments_team_season` (`team_season_id`),
  ADD KEY `fk_tls_node_season` (`league_node_season_id`);

--
-- Indexes for table `team_seasons`
--
ALTER TABLE `team_seasons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `team_id` (`team_id`,`season_id`),
  ADD KEY `season_id` (`season_id`),
  ADD KEY `fk_team_seasons_age_group` (`age_group`);

--
-- Indexes for table `team_season_records`
--
ALTER TABLE `team_season_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_team_league_record` (`team_season_id`,`league_node_season_id`),
  ADD KEY `idx_team_records_team_season` (`team_season_id`),
  ADD KEY `idx_team_records_league` (`league_node_season_id`),
  ADD KEY `idx_team_season_records_composite` (`team_season_id`,`league_node_season_id`);

--
-- Indexes for table `team_staff`
--
ALTER TABLE `team_staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_person_team_season_role` (`person_id`,`team_season_id`,`role`),
  ADD KEY `idx_team_staff_person` (`person_id`),
  ADD KEY `idx_team_staff_team_season` (`team_season_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_person` (`person_id`);

--
-- Indexes for table `user_favorites`
--
ALTER TABLE `user_favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_person_team_season_favorite` (`person_id`,`team_season_id`),
  ADD KEY `idx_favorites_person` (`person_id`),
  ADD KEY `idx_favorites_team_season` (`team_season_id`);

--
-- Indexes for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_person_prefs` (`person_id`),
  ADD KEY `idx_last_team_season` (`last_team_season_id`);

--
-- Indexes for table `user_team_seasons`
--
ALTER TABLE `user_team_seasons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_person` (`person_id`),
  ADD KEY `fk_team_season` (`team_season_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `age_groups`
--
ALTER TABLE `age_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clubs`
--
ALTER TABLE `clubs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `club_staff`
--
ALTER TABLE `club_staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_types`
--
ALTER TABLE `event_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `games`
--
ALTER TABLE `games`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `games_overtimes`
--
ALTER TABLE `games_overtimes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_events_discipline`
--
ALTER TABLE `game_events_discipline`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_events_goals`
--
ALTER TABLE `game_events_goals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_events_major`
--
ALTER TABLE `game_events_major`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_events_penalties`
--
ALTER TABLE `game_events_penalties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_events_player_actions`
--
ALTER TABLE `game_events_player_actions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_events_team`
--
ALTER TABLE `game_events_team`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_periods`
--
ALTER TABLE `game_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_scores`
--
ALTER TABLE `game_scores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_standings_inclusions`
--
ALTER TABLE `game_standings_inclusions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_subs`
--
ALTER TABLE `game_subs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `governing_bodies`
--
ALTER TABLE `governing_bodies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leagues`
--
ALTER TABLE `leagues`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `league_nodes`
--
ALTER TABLE `league_nodes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `league_node_seasons`
--
ALTER TABLE `league_node_seasons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `locations_sublocations`
--
ALTER TABLE `locations_sublocations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `people`
--
ALTER TABLE `people`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `player_games`
--
ALTER TABLE `player_games`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `player_relationships`
--
ALTER TABLE `player_relationships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `player_season_stats`
--
ALTER TABLE `player_season_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `player_teams`
--
ALTER TABLE `player_teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seasons`
--
ALTER TABLE `seasons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teams`
--
ALTER TABLE `teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `team_league_enrollments`
--
ALTER TABLE `team_league_enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `team_seasons`
--
ALTER TABLE `team_seasons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `team_season_records`
--
ALTER TABLE `team_season_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `team_staff`
--
ALTER TABLE `team_staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_favorites`
--
ALTER TABLE `user_favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_preferences`
--
ALTER TABLE `user_preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_team_seasons`
--
ALTER TABLE `user_team_seasons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Structure for view `v_age_groups`
--
DROP TABLE IF EXISTS `v_age_groups`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_age_groups`  AS SELECT `ag`.`id` AS `age_group_id`, `ag`.`name` AS `age_group_code`, `ag`.`begin_date` AS `begin_date`, `ag`.`end_date` AS `end_date`, CASE WHEN month(`ag`.`begin_date`) = 1 THEN 'legacy' ELSE 'current' END AS `era`, `s`.`id` AS `season_id`, `s`.`season_name` AS `season_name`, `s`.`start_date` AS `season_start`, `s`.`end_date` AS `season_end`, `s`.`status`= 'active' AS `is_current`, year(`s`.`start_date`) - year(`ag`.`begin_date`) AS `u_label`, concat('U',year(`s`.`start_date`) - year(`ag`.`begin_date`)) AS `age_group_name` FROM (`age_groups` `ag` join `seasons` `s`) WHERE year(`s`.`start_date`) - year(`ag`.`begin_date`) between 9 and 19 ;

-- --------------------------------------------------------

--
-- Structure for view `v_calendar_all`
--
DROP TABLE IF EXISTS `v_calendar_all`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_calendar_all`  AS SELECT `e`.`id` AS `source_id`, 'event' AS `source_type`, `e`.`title` AS `title`, `e`.`description` AS `description`, `e`.`start_datetime` AS `start_datetime`, `e`.`end_datetime` AS `end_datetime`, `e`.`location_id` AS `location_id`, `e`.`video_link` AS `video_link`, `e`.`google_cal_id` AS `google_cal_id`, `e`.`created_at` AS `created_at`, `e`.`modified_at` AS `modified_at` FROM `events` AS `e`union all select `g`.`id` AS `source_id`,'game' AS `source_type`,concat(group_concat(distinct `l`.`name` order by `l`.`name` ASC separator ', '),' Game') AS `title`,concat(`t_home`.`team_name`,' vs ',`t_away`.`team_name`) AS `description`,cast(concat(`g`.`start_date`,' ',coalesce(`g`.`start_time`,'00:00:00')) as datetime) AS `start_datetime`,cast(concat(`g`.`end_date`,' ',coalesce(`g`.`end_time`,'00:00:00')) as datetime) AS `end_datetime`,`g`.`location_id` AS `location_id`,`g`.`video_link` AS `video_link`,`g`.`google_cal_id` AS `google_cal_id`,`g`.`created_at` AS `created_at`,`g`.`modified_at` AS `modified_at` from ((((((((`games` `g` join `team_seasons` `ts_home` on(`g`.`home_team_season_id` = `ts_home`.`id`)) join `teams` `t_home` on(`ts_home`.`team_id` = `t_home`.`id`)) join `team_seasons` `ts_away` on(`g`.`away_team_season_id` = `ts_away`.`id`)) join `teams` `t_away` on(`ts_away`.`team_id` = `t_away`.`id`)) left join `game_league_nodes` `gln` on(`g`.`id` = `gln`.`game_id`)) left join `league_node_seasons` `lns` on(`gln`.`league_node_id` = `lns`.`id`)) left join `league_nodes` `ln` on(`lns`.`league_node_id` = `ln`.`id`)) left join `leagues` `l` on(`ln`.`league_id` = `l`.`id`)) group by `g`.`id`,`t_home`.`team_name`,`t_away`.`team_name`,`g`.`start_date`,`g`.`start_time`,`g`.`end_date`,`g`.`end_time`,`g`.`location_id`,`g`.`video_link`,`g`.`google_cal_id`,`g`.`created_at`,`g`.`modified_at` order by `start_datetime` desc  ;

-- --------------------------------------------------------

--
-- Structure for view `v_games`
--
DROP TABLE IF EXISTS `v_games`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_games`  AS SELECT `g`.`id` AS `game_id`, `g`.`status` AS `status`, `g`.`game_type` AS `game_type`, `g`.`start_date` AS `start_date`, `g`.`start_time` AS `start_time`, `g`.`end_date` AS `end_date`, `g`.`end_time` AS `end_time`, `g`.`timezone_label` AS `timezone_label`, `s`.`season_name` AS `season_name`, `g`.`location_id` AS `location_id`, `l`.`name` AS `location_name`, `g`.`sublocation_id` AS `sublocation_id`, `ls`.`name` AS `sublocation_name`, `g`.`home_team_season_id` AS `home_team_season_id`, `ht`.`team_name` AS `home_team_name`, `hc`.`name` AS `home_club_name`, `ht`.`gender` AS `home_gender`, `g`.`away_team_season_id` AS `away_team_season_id`, `at`.`team_name` AS `away_team_name`, `ac`.`name` AS `away_club_name`, `at`.`gender` AS `away_gender` FROM (((((((((`games` `g` join `seasons` `s` on(`g`.`season_id` = `s`.`id`)) left join `locations` `l` on(`g`.`location_id` = `l`.`id`)) left join `locations_sublocations` `ls` on(`g`.`sublocation_id` = `ls`.`id`)) join `team_seasons` `hts` on(`g`.`home_team_season_id` = `hts`.`id`)) join `teams` `ht` on(`hts`.`team_id` = `ht`.`id`)) join `clubs` `hc` on(`ht`.`club_id` = `hc`.`id`)) join `team_seasons` `ats` on(`g`.`away_team_season_id` = `ats`.`id`)) join `teams` `at` on(`ats`.`team_id` = `at`.`id`)) join `clubs` `ac` on(`at`.`club_id` = `ac`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_games_leagues`
--
DROP TABLE IF EXISTS `v_games_leagues`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_games_leagues`  AS SELECT `g`.`id` AS `game_id`, `g`.`status` AS `status`, `g`.`start_date` AS `start_date`, `g`.`start_time` AS `start_time`, `g`.`end_date` AS `end_date`, `g`.`end_time` AS `end_time`, `g`.`timezone_label` AS `timezone_label`, `s`.`season_name` AS `season_name`, `g`.`location_id` AS `location_id`, `l`.`name` AS `location_name`, `g`.`sublocation_id` AS `sublocation_id`, `ls`.`name` AS `sublocation_name`, `g`.`home_team_season_id` AS `home_team_season_id`, `ht`.`team_name` AS `home_team_name`, `hc`.`name` AS `home_club_name`, `ht`.`gender` AS `home_gender`, `g`.`away_team_season_id` AS `away_team_season_id`, `at`.`team_name` AS `away_team_name`, `ac`.`name` AS `away_club_name`, `at`.`gender` AS `away_gender`, `lns`.`id` AS `league_node_season_id`, `ln`.`id` AS `league_node_id`, `ln`.`name` AS `league_node_name`, `ln`.`node_type` AS `league_node_type`, `l_league`.`id` AS `league_id`, `l_league`.`name` AS `league_name`, `gln`.`is_primary` AS `is_primary_league`, `gs`.`home_score` AS `home_score`, `gs`.`away_score` AS `away_score`, `gs`.`final_status` AS `final_status` FROM ((((((((((((((`games` `g` join `seasons` `s` on(`g`.`season_id` = `s`.`id`)) left join `locations` `l` on(`g`.`location_id` = `l`.`id`)) left join `locations_sublocations` `ls` on(`g`.`sublocation_id` = `ls`.`id`)) join `team_seasons` `hts` on(`g`.`home_team_season_id` = `hts`.`id`)) join `teams` `ht` on(`hts`.`team_id` = `ht`.`id`)) join `clubs` `hc` on(`ht`.`club_id` = `hc`.`id`)) join `team_seasons` `ats` on(`g`.`away_team_season_id` = `ats`.`id`)) join `teams` `at` on(`ats`.`team_id` = `at`.`id`)) join `clubs` `ac` on(`at`.`club_id` = `ac`.`id`)) join `game_league_nodes` `gln` on(`g`.`id` = `gln`.`game_id`)) join `league_node_seasons` `lns` on(`gln`.`league_node_id` = `lns`.`id`)) join `league_nodes` `ln` on(`lns`.`league_node_id` = `ln`.`id`)) join `leagues` `l_league` on(`ln`.`league_id` = `l_league`.`id`)) left join `game_scores` `gs` on(`g`.`id` = `gs`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_games_summary`
--
DROP TABLE IF EXISTS `v_games_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_games_summary`  AS SELECT `g`.`id` AS `game_id`, `g`.`status` AS `status`, `g`.`game_type` AS `game_type`, `g`.`start_date` AS `start_date`, `g`.`start_time` AS `start_time`, `g`.`end_date` AS `end_date`, `g`.`end_time` AS `end_time`, `g`.`timezone_label` AS `timezone_label`, `s`.`season_name` AS `season_name`, `g`.`location_id` AS `location_id`, `l`.`name` AS `location_name`, `g`.`sublocation_id` AS `sublocation_id`, `ls`.`name` AS `sublocation_name`, `g`.`home_team_season_id` AS `home_team_season_id`, `ht`.`team_name` AS `home_team_name`, `hc`.`name` AS `home_club_name`, `ht`.`gender` AS `home_gender`, `g`.`away_team_season_id` AS `away_team_season_id`, `at`.`team_name` AS `away_team_name`, `ac`.`name` AS `away_club_name`, `at`.`gender` AS `away_gender`, group_concat(distinct coalesce(`l_league`.`abbreviation`,`l_league`.`name`) order by `gln`.`is_primary` DESC,`l_league`.`name` ASC separator ', ') AS `league_names`, group_concat(distinct `ln`.`name` order by `gln`.`is_primary` DESC,`ln`.`name` ASC separator ', ') AS `league_node_names`, json_arrayagg(json_object('league_id',`l_league`.`id`,'league_name',`l_league`.`name`,'league_abbreviation',`l_league`.`abbreviation`,'league_node_id',`ln`.`id`,'league_node_name',`ln`.`name`,'league_node_type',`ln`.`node_type`,'league_node_season_id',`lns`.`id`,'is_primary',`gln`.`is_primary`,'is_tournament',`l_league`.`is_tournament`)) AS `leagues_array`, coalesce(`gs`.`home_score`,(select count(0) from (`game_events_goals` `geg` join `game_events_major` `gem` on(`geg`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `g`.`id` and `geg`.`team_season_id` = `g`.`home_team_season_id` and coalesce(`geg`.`is_own_goal`,0) = 0) + (select count(0) from (`game_events_goals` `geg` join `game_events_major` `gem` on(`geg`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `g`.`id` and `geg`.`team_season_id` = `g`.`away_team_season_id` and `geg`.`is_own_goal` = 1)) AS `home_score`, coalesce(`gs`.`away_score`,(select count(0) from (`game_events_goals` `geg` join `game_events_major` `gem` on(`geg`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `g`.`id` and `geg`.`team_season_id` = `g`.`away_team_season_id` and coalesce(`geg`.`is_own_goal`,0) = 0) + (select count(0) from (`game_events_goals` `geg` join `game_events_major` `gem` on(`geg`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `g`.`id` and `geg`.`team_season_id` = `g`.`home_team_season_id` and `geg`.`is_own_goal` = 1)) AS `away_score`, `gs`.`final_status` AS `final_status`, CASE WHEN `gs`.`home_score` is not null THEN 'manual' WHEN exists(select 1 from (`game_events_goals` `geg` join `game_events_major` `gem` on(`geg`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `g`.`id` limit 1) THEN 'calculated' ELSE NULL END AS `score_source` FROM ((((((((((((((`games` `g` join `seasons` `s` on(`g`.`season_id` = `s`.`id`)) left join `locations` `l` on(`g`.`location_id` = `l`.`id`)) left join `locations_sublocations` `ls` on(`g`.`sublocation_id` = `ls`.`id`)) join `team_seasons` `hts` on(`g`.`home_team_season_id` = `hts`.`id`)) join `teams` `ht` on(`hts`.`team_id` = `ht`.`id`)) join `clubs` `hc` on(`ht`.`club_id` = `hc`.`id`)) join `team_seasons` `ats` on(`g`.`away_team_season_id` = `ats`.`id`)) join `teams` `at` on(`ats`.`team_id` = `at`.`id`)) join `clubs` `ac` on(`at`.`club_id` = `ac`.`id`)) left join `game_league_nodes` `gln` on(`g`.`id` = `gln`.`game_id`)) left join `league_node_seasons` `lns` on(`gln`.`league_node_id` = `lns`.`id`)) left join `league_nodes` `ln` on(`lns`.`league_node_id` = `ln`.`id`)) left join `leagues` `l_league` on(`ln`.`league_id` = `l_league`.`id`)) left join `game_scores` `gs` on(`g`.`id` = `gs`.`game_id`)) GROUP BY `g`.`id`, `g`.`status`, `g`.`game_type`, `g`.`start_date`, `g`.`start_time`, `g`.`end_date`, `g`.`end_time`, `g`.`timezone_label`, `s`.`season_name`, `g`.`location_id`, `l`.`name`, `g`.`sublocation_id`, `ls`.`name`, `g`.`home_team_season_id`, `ht`.`team_name`, `hc`.`name`, `ht`.`gender`, `g`.`away_team_season_id`, `at`.`team_name`, `ac`.`name`, `at`.`gender`, `gs`.`home_score`, `gs`.`away_score`, `gs`.`final_status` ;

-- --------------------------------------------------------

--
-- Structure for view `v_game_events_discipline_complete`
--
DROP TABLE IF EXISTS `v_game_events_discipline_complete`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_game_events_discipline_complete`  AS SELECT `ged`.`id` AS `discipline_id`, `ged`.`major_event_id` AS `major_event_id`, `gem`.`game_id` AS `game_id`, `gem`.`event_type` AS `stoppage_type`, `gem`.`game_time` AS `game_time`, `gem`.`end_time` AS `stoppage_end_time`, `gem`.`period` AS `period`, `gem`.`clock_should_run` AS `clock_should_run`, `gem`.`details` AS `stoppage_details`, `ged`.`team_season_id` AS `team_season_id`, `ts`.`team_id` AS `team_id`, `t`.`team_name` AS `team_name`, `c`.`name` AS `club_name`, `ged`.`player_game_id` AS `player_game_id`, `ged`.`opponent_jersey_number` AS `opponent_jersey_number`, CASE WHEN `ged`.`player_game_id` is not null THEN concat(`p`.`first_name`,' ',`p`.`last_name`) ELSE concat('Opponent #',`ged`.`opponent_jersey_number`) END AS `player_name`, `pt`.`jersey_number` AS `jersey_number`, `ged`.`card_type` AS `card_type`, `ged`.`card_reason` AS `card_reason`, `g`.`season_id` AS `season_id`, `s`.`season_name` AS `season_name`, `g`.`home_team_season_id` AS `home_team_season_id`, `g`.`away_team_season_id` AS `away_team_season_id`, CASE WHEN `ged`.`team_season_id` = `g`.`home_team_season_id` THEN 'home' ELSE 'away' END AS `home_away`, `ged`.`created_at` AS `created_at`, `ged`.`modified_at` AS `modified_at` FROM (((((((((`game_events_discipline` `ged` join `game_events_major` `gem` on(`ged`.`major_event_id` = `gem`.`id`)) join `team_seasons` `ts` on(`ged`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `games` `g` on(`gem`.`game_id` = `g`.`id`)) join `seasons` `s` on(`g`.`season_id` = `s`.`id`)) left join `player_games` `pg` on(`ged`.`player_game_id` = `pg`.`id`)) left join `people` `p` on(`pg`.`player_id` = `p`.`id`)) left join `player_teams` `pt` on(`pg`.`player_id` = `pt`.`player_id` and `pt`.`team_season_id` = `ged`.`team_season_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_game_events_goals_complete`
--
DROP TABLE IF EXISTS `v_game_events_goals_complete`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_game_events_goals_complete`  AS SELECT `geg`.`id` AS `goal_id`, `geg`.`major_event_id` AS `major_event_id`, `gem`.`game_id` AS `game_id`, `gem`.`event_type` AS `stoppage_type`, `gem`.`game_time` AS `game_time`, `gem`.`end_time` AS `stoppage_end_time`, `gem`.`period` AS `period`, `gem`.`clock_should_run` AS `clock_should_run`, `gem`.`details` AS `stoppage_details`, `geg`.`team_season_id` AS `team_season_id`, `ts`.`team_id` AS `team_id`, `t`.`team_name` AS `team_name`, `c`.`name` AS `club_name`, `geg`.`scorer_player_game_id` AS `scorer_player_game_id`, `geg`.`opponent_jersey_number` AS `scorer_opponent_jersey`, CASE WHEN `geg`.`scorer_player_game_id` is not null THEN concat(`p_scorer`.`first_name`,' ',`p_scorer`.`last_name`) ELSE concat('Opponent #',`geg`.`opponent_jersey_number`) END AS `scorer_name`, `pt_scorer`.`jersey_number` AS `scorer_jersey_number`, `geg`.`assist_player_game_id` AS `assist_player_game_id`, CASE WHEN `geg`.`assist_player_game_id` is not null THEN concat(`p_assist`.`first_name`,' ',`p_assist`.`last_name`) ELSE NULL END AS `assist_name`, `pt_assist`.`jersey_number` AS `assist_jersey_number`, `geg`.`defending_gk_player_game_id` AS `defending_gk_player_game_id`, CASE WHEN `geg`.`defending_gk_player_game_id` is not null THEN concat(`p_gk`.`first_name`,' ',`p_gk`.`last_name`) ELSE NULL END AS `gk_name`, `geg`.`is_own_goal` AS `is_own_goal`, `geg`.`goal_types` AS `goal_types`, `g`.`season_id` AS `season_id`, `s`.`season_name` AS `season_name`, `g`.`home_team_season_id` AS `home_team_season_id`, `g`.`away_team_season_id` AS `away_team_season_id`, CASE WHEN `geg`.`team_season_id` = `g`.`home_team_season_id` THEN 'home' ELSE 'away' END AS `home_away`, `geg`.`created_at` AS `created_at`, `geg`.`modified_at` AS `modified_at` FROM ((((((((((((((`game_events_goals` `geg` join `game_events_major` `gem` on(`geg`.`major_event_id` = `gem`.`id`)) join `team_seasons` `ts` on(`geg`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `games` `g` on(`gem`.`game_id` = `g`.`id`)) join `seasons` `s` on(`g`.`season_id` = `s`.`id`)) left join `player_games` `pg_scorer` on(`geg`.`scorer_player_game_id` = `pg_scorer`.`id`)) left join `people` `p_scorer` on(`pg_scorer`.`player_id` = `p_scorer`.`id`)) left join `player_teams` `pt_scorer` on(`pg_scorer`.`player_id` = `pt_scorer`.`player_id` and `pt_scorer`.`team_season_id` = `geg`.`team_season_id`)) left join `player_games` `pg_assist` on(`geg`.`assist_player_game_id` = `pg_assist`.`id`)) left join `people` `p_assist` on(`pg_assist`.`player_id` = `p_assist`.`id`)) left join `player_teams` `pt_assist` on(`pg_assist`.`player_id` = `pt_assist`.`player_id` and `pt_assist`.`team_season_id` = `geg`.`team_season_id`)) left join `player_games` `pg_gk` on(`geg`.`defending_gk_player_game_id` = `pg_gk`.`id`)) left join `people` `p_gk` on(`pg_gk`.`player_id` = `p_gk`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_game_events_penalties_complete`
--
DROP TABLE IF EXISTS `v_game_events_penalties_complete`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_game_events_penalties_complete`  AS SELECT `gep`.`id` AS `penalty_id`, `gep`.`major_event_id` AS `major_event_id`, CASE `game_id` ELSE `gep`.`game_id` AS `end` END FROM (((((((((((`game_events_penalties` `gep` left join `game_events_major` `gem` on(`gep`.`major_event_id` = `gem`.`id`)) join `team_seasons` `ts` on(`gep`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) left join `games` `g` on(coalesce(`gem`.`game_id`,`gep`.`game_id`) = `g`.`id`)) left join `seasons` `s` on(`g`.`season_id` = `s`.`id`)) left join `player_games` `pg_shooter` on(`gep`.`shooter_player_game_id` = `pg_shooter`.`id`)) left join `people` `p_shooter` on(`pg_shooter`.`player_id` = `p_shooter`.`id`)) left join `player_teams` `pt_shooter` on(`pg_shooter`.`player_id` = `pt_shooter`.`player_id` and `pt_shooter`.`team_season_id` = `gep`.`team_season_id`)) left join `player_games` `pg_gk` on(`gep`.`gk_player_game_id` = `pg_gk`.`id`)) left join `people` `p_gk` on(`pg_gk`.`player_id` = `p_gk`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_game_events_team_complete`
--
DROP TABLE IF EXISTS `v_game_events_team_complete`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_game_events_team_complete`  AS SELECT `get`.`id` AS `team_event_id`, `get`.`game_id` AS `game_id`, `get`.`team_season_id` AS `team_season_id`, `ts`.`team_id` AS `team_id`, `get`.`event_type` AS `event_type`, `get`.`game_time` AS `game_time`, `get`.`period` AS `period`, `t`.`team_name` AS `team_name`, `c`.`name` AS `club_name`, `g`.`season_id` AS `season_id`, `s`.`season_name` AS `season_name`, `g`.`home_team_season_id` AS `home_team_season_id`, `g`.`away_team_season_id` AS `away_team_season_id`, CASE WHEN `get`.`team_season_id` = `g`.`home_team_season_id` THEN 'home' ELSE 'away' END AS `home_away`, `get`.`created_at` AS `created_at`, `get`.`modified_at` AS `modified_at` FROM (((((`game_events_team` `get` join `team_seasons` `ts` on(`get`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `games` `g` on(`get`.`game_id` = `g`.`id`)) join `seasons` `s` on(`g`.`season_id` = `s`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_game_timeline`
--
DROP TABLE IF EXISTS `v_game_timeline`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_game_timeline`  AS SELECT `gem`.`game_id` AS `game_id`, `gem`.`id` AS `event_id`, `gem`.`event_type` AS `major_event_type`, `gem`.`game_time` AS `game_time`, `gem`.`end_time` AS `end_time`, `gem`.`period` AS `period`, `gem`.`clock_should_run` AS `clock_should_run`, `geg`.`id` AS `goal_id`, CASE WHEN `geg`.`scorer_player_game_id` is not null THEN concat(`p_scorer`.`first_name`,' ',`p_scorer`.`last_name`) ELSE concat('Opponent #',`geg`.`opponent_jersey_number`) END AS `scorer_name`, `geg`.`team_season_id` AS `scoring_team_season_id`, `t_scorer`.`team_name` AS `scoring_team_name`, `geg`.`is_own_goal` AS `is_own_goal`, `geg`.`goal_types` AS `goal_types`, CASE WHEN `geg`.`assist_player_game_id` is not null THEN concat(`p_assist`.`first_name`,' ',`p_assist`.`last_name`) ELSE NULL END AS `assist_name`, `gep`.`id` AS `penalty_id`, `gep`.`outcome` AS `penalty_outcome`, `gep`.`is_shootout` AS `is_shootout`, `gep`.`shootout_round` AS `shootout_round`, CASE WHEN `gep`.`shooter_player_game_id` is not null THEN concat(`p_pen_shooter`.`first_name`,' ',`p_pen_shooter`.`last_name`) ELSE concat('Opponent #',`gep`.`opponent_jersey_number`) END AS `penalty_shooter_name`, `ged`.`id` AS `discipline_id`, `ged`.`card_type` AS `card_type`, `ged`.`card_reason` AS `card_reason`, CASE WHEN `ged`.`player_game_id` is not null THEN concat(`p_card`.`first_name`,' ',`p_card`.`last_name`) ELSE concat('Opponent #',`ged`.`opponent_jersey_number`) END AS `card_recipient_name`, `ged`.`team_season_id` AS `card_team_season_id`, `t_card`.`team_name` AS `card_team_name`, `gem`.`details` AS `details`, `gem`.`created_at` AS `created_at`, `gem`.`modified_at` AS `modified_at` FROM (((((((((((((((`game_events_major` `gem` left join `game_events_goals` `geg` on(`geg`.`major_event_id` = `gem`.`id`)) left join `player_games` `pg_scorer` on(`geg`.`scorer_player_game_id` = `pg_scorer`.`id`)) left join `people` `p_scorer` on(`pg_scorer`.`player_id` = `p_scorer`.`id`)) left join `player_games` `pg_assist` on(`geg`.`assist_player_game_id` = `pg_assist`.`id`)) left join `people` `p_assist` on(`pg_assist`.`player_id` = `p_assist`.`id`)) left join `team_seasons` `ts_scorer` on(`geg`.`team_season_id` = `ts_scorer`.`id`)) left join `teams` `t_scorer` on(`ts_scorer`.`team_id` = `t_scorer`.`id`)) left join `game_events_penalties` `gep` on(`gep`.`major_event_id` = `gem`.`id`)) left join `player_games` `pg_pen_shooter` on(`gep`.`shooter_player_game_id` = `pg_pen_shooter`.`id`)) left join `people` `p_pen_shooter` on(`pg_pen_shooter`.`player_id` = `p_pen_shooter`.`id`)) left join `game_events_discipline` `ged` on(`ged`.`major_event_id` = `gem`.`id`)) left join `player_games` `pg_card` on(`ged`.`player_game_id` = `pg_card`.`id`)) left join `people` `p_card` on(`pg_card`.`player_id` = `p_card`.`id`)) left join `team_seasons` `ts_card` on(`ged`.`team_season_id` = `ts_card`.`id`)) left join `teams` `t_card` on(`ts_card`.`team_id` = `t_card`.`id`)) ORDER BY `gem`.`game_id` ASC, `gem`.`period` ASC, `gem`.`game_time` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_head_to_head`
--
DROP TABLE IF EXISTS `v_head_to_head`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_head_to_head`  AS SELECT `g`.`id` AS `game_id`, `g`.`start_date` AS `start_date`, `g`.`status` AS `status`, `s`.`season_name` AS `season_name`, `g`.`home_team_season_id` AS `home_team_season_id`, `ht`.`team_name` AS `home_team_name`, `hc`.`name` AS `home_club_name`, `g`.`away_team_season_id` AS `away_team_season_id`, `at`.`team_name` AS `away_team_name`, `ac`.`name` AS `away_club_name`, `gs`.`home_score` AS `home_score`, `gs`.`away_score` AS `away_score`, `gs`.`final_status` AS `final_status`, CASE WHEN `gs`.`home_score` > `gs`.`away_score` THEN 'home' WHEN `gs`.`away_score` > `gs`.`home_score` THEN 'away' ELSE 'draw' END AS `winner`, group_concat(distinct `ln`.`name` order by `ln`.`name` ASC separator ', ') AS `league_names` FROM (((((((((((`games` `g` join `seasons` `s` on(`g`.`season_id` = `s`.`id`)) join `team_seasons` `hts` on(`g`.`home_team_season_id` = `hts`.`id`)) join `teams` `ht` on(`hts`.`team_id` = `ht`.`id`)) join `clubs` `hc` on(`ht`.`club_id` = `hc`.`id`)) join `team_seasons` `ats` on(`g`.`away_team_season_id` = `ats`.`id`)) join `teams` `at` on(`ats`.`team_id` = `at`.`id`)) join `clubs` `ac` on(`at`.`club_id` = `ac`.`id`)) left join `game_scores` `gs` on(`g`.`id` = `gs`.`game_id`)) left join `game_league_nodes` `gln` on(`g`.`id` = `gln`.`game_id`)) left join `league_node_seasons` `lns` on(`gln`.`league_node_id` = `lns`.`id`)) left join `league_nodes` `ln` on(`lns`.`league_node_id` = `ln`.`id`)) WHERE `g`.`status` = 'completed' GROUP BY `g`.`id`, `g`.`start_date`, `g`.`status`, `s`.`season_name`, `g`.`home_team_season_id`, `ht`.`team_name`, `hc`.`name`, `g`.`away_team_season_id`, `at`.`team_name`, `ac`.`name`, `gs`.`home_score`, `gs`.`away_score`, `gs`.`final_status` ORDER BY `g`.`start_date` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `v_leagues`
--
DROP TABLE IF EXISTS `v_leagues`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_leagues`  AS SELECT `l`.`id` AS `league_id`, `l`.`name` AS `league_name`, `l`.`abbreviation` AS `league_abbreviation`, `l`.`description` AS `league_description`, `l`.`is_active` AS `league_is_active`, `l`.`is_tournament` AS `is_tournament`, `gb`.`id` AS `governing_body_id`, `gb`.`name` AS `governing_body_name`, `gb`.`abbreviation` AS `governing_body_abbreviation`, `gb`.`website` AS `governing_body_website`, count(distinct `ln`.`id`) AS `total_nodes`, count(distinct case when `ln`.`parent_id` is null then `ln`.`id` end) AS `root_nodes`, count(distinct case when `ln`.`node_type` = 'league' then `ln`.`id` end) AS `league_nodes`, count(distinct case when `ln`.`node_type` = 'conference' then `ln`.`id` end) AS `conference_nodes`, count(distinct case when `ln`.`node_type` = 'division' then `ln`.`id` end) AS `division_nodes`, count(distinct case when `ln`.`node_type` = 'group' then `ln`.`id` end) AS `group_nodes`, count(distinct `lns`.`season_id`) AS `seasons_count`, count(distinct case when `s`.`status` = 'active' then `lns`.`id` end) AS `current_season_nodes`, count(distinct case when `s`.`status` = 'active' and `tle`.`is_active` = 1 then `tle`.`team_season_id` end) AS `current_teams_count`, `l`.`created_at` AS `created_at`, `l`.`modified_at` AS `modified_at` FROM (((((`leagues` `l` left join `governing_bodies` `gb` on(`l`.`governing_body_id` = `gb`.`id`)) left join `league_nodes` `ln` on(`l`.`id` = `ln`.`league_id`)) left join `league_node_seasons` `lns` on(`ln`.`id` = `lns`.`league_node_id`)) left join `seasons` `s` on(`lns`.`season_id` = `s`.`id`)) left join `team_league_enrollments` `tle` on(`lns`.`id` = `tle`.`league_node_season_id`)) GROUP BY `l`.`id`, `l`.`name`, `l`.`abbreviation`, `l`.`description`, `l`.`is_active`, `l`.`is_tournament`, `gb`.`id`, `gb`.`name`, `gb`.`abbreviation`, `gb`.`website`, `l`.`created_at`, `l`.`modified_at` ORDER BY `l`.`is_active` DESC, `l`.`name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_leagues_detailed`
--
DROP TABLE IF EXISTS `v_leagues_detailed`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_leagues_detailed`  AS SELECT `l`.`id` AS `league_id`, `l`.`name` AS `league_name`, `l`.`description` AS `league_description`, `l`.`is_active` AS `league_is_active`, `l`.`is_tournament` AS `is_tournament`, `gb`.`id` AS `governing_body_id`, `gb`.`name` AS `governing_body_name`, `ln`.`id` AS `node_id`, `ln`.`parent_id` AS `node_parent_id`, `ln`.`name` AS `node_name`, `ln`.`node_type` AS `node_type`, `ln`.`level` AS `node_level`, `ln`.`display_order` AS `display_order`, `lns`.`id` AS `league_node_season_id`, `s`.`id` AS `season_id`, `s`.`season_name` AS `season_name`, `s`.`start_date` AS `season_start`, `s`.`end_date` AS `season_end`, `s`.`status`= 'active' AS `is_current_season`, `lns`.`is_active` AS `node_season_is_active`, count(distinct `tle`.`team_season_id`) AS `enrolled_teams_count`, count(distinct case when `tle`.`is_active` = 1 then `tle`.`team_season_id` end) AS `active_teams_count`, `l`.`created_at` AS `league_created_at`, `ln`.`created_at` AS `node_created_at`, `lns`.`created_at` AS `node_season_created_at` FROM (((((`leagues` `l` left join `governing_bodies` `gb` on(`l`.`governing_body_id` = `gb`.`id`)) left join `league_nodes` `ln` on(`l`.`id` = `ln`.`league_id`)) left join `league_node_seasons` `lns` on(`ln`.`id` = `lns`.`league_node_id`)) left join `seasons` `s` on(`lns`.`season_id` = `s`.`id`)) left join `team_league_enrollments` `tle` on(`lns`.`id` = `tle`.`league_node_season_id`)) GROUP BY `l`.`id`, `l`.`name`, `l`.`description`, `l`.`is_active`, `l`.`is_tournament`, `gb`.`id`, `gb`.`name`, `ln`.`id`, `ln`.`parent_id`, `ln`.`name`, `ln`.`node_type`, `ln`.`level`, `ln`.`display_order`, `lns`.`id`, `s`.`id`, `s`.`season_name`, `s`.`start_date`, `s`.`end_date`, `s`.`status`, `lns`.`is_active`, `l`.`created_at`, `ln`.`created_at`, `lns`.`created_at` ORDER BY `l`.`name` ASC, `s`.`status`= 'active' DESC, `s`.`start_date` DESC, `ln`.`level` ASC, `ln`.`display_order` ASC, `ln`.`name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_league_hierarchy`
--
DROP TABLE IF EXISTS `v_league_hierarchy`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_league_hierarchy`  AS WITH RECURSIVE league_hierarchy AS (SELECT `ln`.`id` AS `league_node_id`, `ln`.`parent_id` AS `parent_id`, `ln`.`name` AS `node_name`, `ln`.`node_type` AS `node_type`, `ln`.`league_id` AS `league_id`, cast(`ln`.`name` as char(1000) charset utf8mb4) AS `full_path` FROM `league_nodes` AS `ln` UNION ALL SELECT `child`.`id` AS `id`, `child`.`parent_id` AS `parent_id`, `child`.`name` AS `name`, `child`.`node_type` AS `node_type`, `child`.`league_id` AS `league_id`, concat(`parent`.`full_path`,' > ',`child`.`name`) AS `full_path` FROM (`league_nodes` `child` join `league_hierarchy` `parent` on(`child`.`parent_id` = `parent`.`league_node_id`)))  SELECT `c`.`id` AS `club_id`, `c`.`name` AS `club_name`, `c`.`abbreviation` AS `club_abbreviation`, `c`.`location` AS `club_location`, `t`.`id` AS `team_id`, `t`.`team_name` AS `team_name`, `t`.`gender` AS `gender`, `ts`.`id` AS `team_season_id`, `s`.`season_name` AS `season_name`, `l`.`id` AS `league_id`, `l`.`name` AS `league_name`, `lh`.`full_path` AS `league_hierarchy`, `ln`.`node_type` AS `node_type`, `tle`.`enrollment_date` AS `enrollment_date`, `tle`.`is_active` AS `is_active` FROM ((((((((`team_league_enrollments` `tle` join `team_seasons` `ts` on(`tle`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) join `league_node_seasons` `lns` on(`tle`.`league_node_season_id` = `lns`.`id`)) join `league_nodes` `ln` on(`lns`.`league_node_id` = `ln`.`id`)) join `leagues` `l` on(`ln`.`league_id` = `l`.`id`)) join `league_hierarchy` `lh` on(`ln`.`id` = `lh`.`league_node_id`)) ORDER BY `l`.`name` ASC, `lh`.`full_path` ASC, `c`.`name` ASC, `t`.`team_name` ASC, `t`.`team_name` ASC`team_name`  ;

-- --------------------------------------------------------

--
-- Structure for view `v_league_teams`
--
DROP TABLE IF EXISTS `v_league_teams`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_league_teams`  AS WITH RECURSIVE node_path AS (SELECT `lns`.`id` AS `league_node_season_id`, `ln`.`id` AS `league_node_id`, `ln`.`parent_id` AS `parent_id`, `ln`.`name` AS `node_name`, `ln`.`node_type` AS `node_type`, `ln`.`league_id` AS `league_id`, cast(`ln`.`id` as char(200) charset utf8mb4) AS `node_ids`, cast(`ln`.`name` as char(1000) charset utf8mb4) AS `full_path` FROM (`league_node_seasons` `lns` join `league_nodes` `ln` on(`lns`.`league_node_id` = `ln`.`id`)) UNION ALL SELECT `np`.`league_node_season_id` AS `league_node_season_id`, `parent`.`id` AS `id`, `parent`.`parent_id` AS `parent_id`, `parent`.`name` AS `name`, `parent`.`node_type` AS `node_type`, `parent`.`league_id` AS `league_id`, concat(`np`.`node_ids`,' > ',`parent`.`id`) AS `CONCAT(np.node_ids, ' > ', parent.id)`, concat(`np`.`full_path`,' > ',`parent`.`name`) AS `CONCAT(np.full_path, ' > ', parent.name)` FROM (`league_nodes` `parent` join `node_path` `np` on(`np`.`parent_id` = `parent`.`id`)))  SELECT `c`.`id` AS `club_id`, `c`.`name` AS `club_name`, `t`.`id` AS `team_id`, `t`.`team_name` AS `team_name`, `ts`.`id` AS `team_season_id`, `s`.`season_name` AS `season_name`, `l`.`id` AS `league_id`, `l`.`name` AS `league_name`, `np`.`league_node_season_id` AS `league_node_season_id`, `np`.`node_ids` AS `hierarchy_ids`, `np`.`full_path` AS `hierarchy_names`, `tle`.`enrollment_date` AS `enrollment_date`, `tle`.`is_active` AS `is_active` FROM ((((((`team_league_enrollments` `tle` join `team_seasons` `ts` on(`tle`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) join `node_path` `np` on(`tle`.`league_node_season_id` = `np`.`league_node_season_id`)) join `leagues` `l` on(`np`.`league_id` = `l`.`id`)) WHERE `np`.`parent_id` is null ORDER BY `l`.`name` ASC, `np`.`full_path` ASC, `c`.`name` ASC, `t`.`team_name` ASC, `t`.`team_name` ASC`team_name`  ;

-- --------------------------------------------------------

--
-- Structure for view `v_locations`
--
DROP TABLE IF EXISTS `v_locations`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_locations`  AS SELECT `l`.`id` AS `location_id`, `l`.`name` AS `location_name`, `l`.`address_id` AS `address_id`, `a`.`address_line1` AS `address_line1`, `a`.`address_line2` AS `address_line2`, `a`.`city` AS `city`, `a`.`state` AS `state`, `a`.`postal_code` AS `postal_code`, `a`.`country` AS `country`, concat_ws(', ',`a`.`address_line1`,nullif(`a`.`address_line2`,''),`a`.`city`,concat(`a`.`state`,' ',`a`.`postal_code`),`a`.`country`) AS `full_address`, count(distinct `ls`.`id`) AS `sublocation_count`, count(distinct case when `ls`.`is_active` = 1 then `ls`.`id` end) AS `active_sublocation_count`, `l`.`created_at` AS `created_at`, `l`.`modified_at` AS `modified_at` FROM ((`locations` `l` left join `addresses` `a` on(`l`.`address_id` = `a`.`id`)) left join `locations_sublocations` `ls` on(`l`.`id` = `ls`.`location_id`)) GROUP BY `l`.`id`, `l`.`name`, `l`.`address_id`, `a`.`address_line1`, `a`.`address_line2`, `a`.`city`, `a`.`state`, `a`.`postal_code`, `a`.`country`, `l`.`created_at`, `l`.`modified_at` ORDER BY `l`.`name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_locations_detailed`
--
DROP TABLE IF EXISTS `v_locations_detailed`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_locations_detailed`  AS SELECT `l`.`id` AS `location_id`, `l`.`name` AS `location_name`, `l`.`address_id` AS `address_id`, `a`.`address_line1` AS `address_line1`, `a`.`address_line2` AS `address_line2`, `a`.`city` AS `city`, `a`.`state` AS `state`, `a`.`postal_code` AS `postal_code`, `a`.`country` AS `country`, concat_ws(', ',`a`.`address_line1`,nullif(`a`.`address_line2`,''),`a`.`city`,concat(`a`.`state`,' ',`a`.`postal_code`),`a`.`country`) AS `full_address`, `ls`.`id` AS `sublocation_id`, `ls`.`name` AS `sublocation_name`, `ls`.`description` AS `sublocation_description`, `ls`.`capacity` AS `sublocation_capacity`, `ls`.`surface_type` AS `sublocation_surface_type`, `ls`.`is_active` AS `sublocation_is_active`, `l`.`created_at` AS `location_created_at`, `l`.`modified_at` AS `location_modified_at`, `ls`.`created_at` AS `sublocation_created_at`, `ls`.`modified_at` AS `sublocation_modified_at` FROM ((`locations` `l` left join `addresses` `a` on(`l`.`address_id` = `a`.`id`)) left join `locations_sublocations` `ls` on(`l`.`id` = `ls`.`location_id`)) ORDER BY `l`.`name` ASC, `ls`.`name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_players`
--
DROP TABLE IF EXISTS `v_players`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_players`  AS SELECT `p`.`id` AS `player_id`, `p`.`first_name` AS `first_name`, `p`.`last_name` AS `last_name`, `p`.`nickname` AS `nickname`, `p`.`email` AS `email`, `p`.`phone` AS `phone`, `p`.`gender` AS `gender`, `p`.`birth_date` AS `birth_date`, `p`.`entry_year` AS `entry_year`, `p`.`is_active` AS `player_is_active`, `pt`.`id` AS `player_team_id`, `pt`.`team_season_id` AS `team_season_id`, `pt`.`jersey_number` AS `jersey_number`, `pt`.`position` AS `position`, `pt`.`is_active` AS `roster_is_active`, `pt`.`joined_date` AS `joined_date`, `pt`.`left_date` AS `left_date`, `t`.`id` AS `team_id`, `t`.`team_name` AS `team_name`, `t`.`gender` AS `team_gender`, `t`.`is_active` AS `team_is_active`, `s`.`id` AS `season_id`, `ag`.`id` AS `age_group_id`, `ag`.`name` AS `age_group_name`, `c`.`id` AS `club_id`, `c`.`name` AS `club_name`, `c`.`abbreviation` AS `club_abbreviation`, `c`.`location` AS `club_location`, `c`.`type` AS `club_type`, `c`.`logo_url` AS `club_logo_url`, `c`.`is_active` AS `club_is_active`, `s`.`season_name` AS `season_name`, `s`.`start_date` AS `season_start`, `s`.`end_date` AS `season_end`, `s`.`status`= 'active' AS `is_current`, timestampdiff(YEAR,`p`.`birth_date`,curdate()) AS `current_age`, concat(`p`.`first_name`,' ',`p`.`last_name`) AS `full_name`, concat(`p`.`first_name`,' ',`p`.`last_name`,' (',`t`.`team_name`,')') AS `display_name`, `p`.`created_at` AS `player_created_at`, `p`.`modified_at` AS `player_modified_at`, `pt`.`created_at` AS `roster_created_at`, `pt`.`modified_at` AS `roster_modified_at` FROM ((((((`people` `p` join `player_teams` `pt` on(`p`.`id` = `pt`.`player_id`)) join `team_seasons` `ts` on(`pt`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `age_groups` `ag` on(`ts`.`age_group` = `ag`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_player_availability`
--
DROP TABLE IF EXISTS `v_player_availability`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_player_availability`  AS SELECT `p`.`id` AS `player_id`, concat(`p`.`first_name`,' ',`p`.`last_name`) AS `full_name`, `pt`.`team_season_id` AS `team_season_id`, `t`.`team_name` AS `team_name`, `c`.`name` AS `club_name`, `pt`.`jersey_number` AS `jersey_number`, `pt`.`position` AS `position`, `pt`.`is_active` AS `roster_active`, (select count(0) from (`v_player_game_stats_enhanced` `pgs` join `games` `g` on(`pgs`.`game_id` = `g`.`id`)) where `pgs`.`player_id` = `p`.`id` and `pgs`.`team_season_id` = `pt`.`team_season_id` and `g`.`status` = 'completed' and `pgs`.`red_cards` > 0 and `g`.`start_date` >= curdate() - interval 30 day) AS `recent_red_cards`, (select sum(`pgs`.`yellow_cards`) from (`v_player_game_stats_enhanced` `pgs` join `games` `g` on(`pgs`.`game_id` = `g`.`id`)) where `pgs`.`player_id` = `p`.`id` and `pgs`.`team_season_id` = `pt`.`team_season_id` and `g`.`status` = 'completed') AS `season_yellow_cards`, CASE WHEN `pt`.`is_active` = 0 THEN 'Inactive' WHEN (select count(0) from (`v_player_game_stats_enhanced` `pgs` join `games` `g` on(`pgs`.`game_id` = `g`.`id`)) where `pgs`.`player_id` = `p`.`id` AND `pgs`.`team_season_id` = `pt`.`team_season_id` AND `g`.`status` = 'completed' AND `pgs`.`red_cards` > 0 AND `g`.`start_date` >= curdate() - interval 30 day) > 0 THEN 'Suspended' ELSE 'Available' END AS `availability_status` FROM ((((`people` `p` join `player_teams` `pt` on(`p`.`id` = `pt`.`player_id`)) join `team_seasons` `ts` on(`pt`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) WHERE `ts`.`is_active` = 1 ORDER BY `c`.`name` ASC, `t`.`team_name` ASC, `pt`.`jersey_number` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_player_career_stats`
--
DROP TABLE IF EXISTS `v_player_career_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_player_career_stats`  AS SELECT `v_player_season_stats_calculated`.`player_id` AS `player_id`, `v_player_season_stats_calculated`.`full_name` AS `full_name`, `v_player_season_stats_calculated`.`first_name` AS `first_name`, `v_player_season_stats_calculated`.`last_name` AS `last_name`, count(distinct `v_player_season_stats_calculated`.`team_season_id`) AS `teams_played_for`, count(distinct `v_player_season_stats_calculated`.`season_id`) AS `seasons_played`, sum(`v_player_season_stats_calculated`.`games_played`) AS `career_games`, sum(`v_player_season_stats_calculated`.`games_started`) AS `career_starts`, sum(`v_player_season_stats_calculated`.`total_goals`) AS `career_goals`, sum(`v_player_season_stats_calculated`.`total_penalty_goals`) AS `career_penalty_goals`, sum(`v_player_season_stats_calculated`.`total_assists`) AS `career_assists`, sum(`v_player_season_stats_calculated`.`total_shots`) AS `career_shots`, sum(`v_player_season_stats_calculated`.`total_shots_on_target`) AS `career_shots_on_target`, sum(`v_player_season_stats_calculated`.`total_saves`) AS `career_saves`, sum(`v_player_season_stats_calculated`.`total_goals_against`) AS `career_goals_against`, sum(`v_player_season_stats_calculated`.`total_penalties_faced`) AS `career_penalties_faced`, sum(`v_player_season_stats_calculated`.`total_penalty_saves`) AS `career_penalty_saves`, sum(`v_player_season_stats_calculated`.`clean_sheets`) AS `career_clean_sheets`, sum(`v_player_season_stats_calculated`.`total_yellow_cards`) AS `career_yellow_cards`, sum(`v_player_season_stats_calculated`.`total_red_cards`) AS `career_red_cards`, CASE WHEN sum(`v_player_season_stats_calculated`.`games_played`) > 0 THEN round(sum(`v_player_season_stats_calculated`.`total_goals`) * 1.0 / sum(`v_player_season_stats_calculated`.`games_played`),2) ELSE 0 END AS `career_goals_per_game`, CASE WHEN sum(`v_player_season_stats_calculated`.`total_shots`) > 0 THEN round(sum(`v_player_season_stats_calculated`.`total_goals`) * 100.0 / sum(`v_player_season_stats_calculated`.`total_shots`),1) ELSE 0 END AS `career_shooting_percentage`, CASE WHEN sum(`v_player_season_stats_calculated`.`total_saves`) + sum(`v_player_season_stats_calculated`.`total_goals_against`) > 0 THEN round(sum(`v_player_season_stats_calculated`.`total_saves`) * 100.0 / (sum(`v_player_season_stats_calculated`.`total_saves`) + sum(`v_player_season_stats_calculated`.`total_goals_against`)),1) ELSE NULL END AS `career_save_percentage`, CASE WHEN sum(`v_player_season_stats_calculated`.`games_played`) > 0 THEN round(sum(`v_player_season_stats_calculated`.`total_goals_against`) * 1.0 / sum(`v_player_season_stats_calculated`.`games_played`),2) ELSE NULL END AS `career_gaa` FROM `v_player_season_stats_calculated` GROUP BY `v_player_season_stats_calculated`.`player_id`, `v_player_season_stats_calculated`.`full_name`, `v_player_season_stats_calculated`.`first_name`, `v_player_season_stats_calculated`.`last_name` ;

-- --------------------------------------------------------

--
-- Structure for view `v_player_games`
--
DROP TABLE IF EXISTS `v_player_games`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_player_games`  AS SELECT `pg`.`id` AS `player_game_id`, `pg`.`game_id` AS `game_id`, `pg`.`player_id` AS `player_id`, `pg`.`team_season_id` AS `team_id`, `pg`.`position_id` AS `position_id`, `pg`.`started` AS `started`, `pg`.`game_status` AS `game_status`, `pg`.`is_guest` AS `is_guest`, `p`.`first_name` AS `first_name`, `p`.`last_name` AS `last_name`, concat(`p`.`first_name`,' ',`p`.`last_name`) AS `full_name`, `p`.`nickname` AS `nickname`, `pt`.`id` AS `player_team_id`, `pt`.`jersey_number` AS `jersey_number`, `pt`.`position` AS `primary_position`, `pt`.`team_season_id` AS `team_season_id`, `pt`.`captain` AS `captain`, `pt`.`grade` AS `grade`, `t`.`team_name` AS `team_name`, `t`.`gender` AS `team_gender`, `c`.`name` AS `club_name`, `c`.`abbreviation` AS `club_abbreviation`, `c`.`logo_url` AS `club_logo_url`, `g`.`start_date` AS `start_date`, `g`.`start_time` AS `start_time`, `g`.`status` AS `game_status_overall`, `g`.`home_team_season_id` AS `home_team_season_id`, `g`.`away_team_season_id` AS `away_team_season_id`, `g`.`season_id` AS `season_id`, CASE WHEN `pg`.`team_season_id` = `g`.`home_team_season_id` THEN 'home' WHEN `pg`.`team_season_id` = `g`.`away_team_season_id` THEN 'away' ELSE NULL END AS `home_away`, `s`.`season_name` AS `season_name`, `s`.`status`= 'active' AS `is_current_season`, `ag`.`id` AS `age_group_id`, `ag`.`name` AS `age_group_name`, `pg`.`created_at` AS `created_at`, `pg`.`modified_at` AS `modified_at` FROM ((((((((`player_games` `pg` join `people` `p` on(`pg`.`player_id` = `p`.`id`)) join `team_seasons` `ts` on(`pg`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `games` `g` on(`pg`.`game_id` = `g`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `player_teams` `pt` on(`pt`.`player_id` = `pg`.`player_id` and `pt`.`team_season_id` = `ts`.`id` and `pt`.`is_active` = 1)) left join `age_groups` `ag` on(`ts`.`age_group` = `ag`.`id`)) ORDER BY `g`.`start_date` DESC, `g`.`start_time` DESC, `pg`.`started` DESC, `p`.`last_name` ASC, `p`.`first_name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_player_game_stats_enhanced`
--
DROP TABLE IF EXISTS `v_player_game_stats_enhanced`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_player_game_stats_enhanced`  AS SELECT `pg`.`id` AS `player_game_id`, `pg`.`game_id` AS `game_id`, `pg`.`player_id` AS `player_id`, `pg`.`team_season_id` AS `team_id`, `p`.`first_name` AS `first_name`, `p`.`last_name` AS `last_name`, concat(`p`.`first_name`,' ',`p`.`last_name`) AS `full_name`, `pt`.`jersey_number` AS `jersey_number`, `pt`.`position` AS `position`, `pg`.`game_status` AS `game_status`, CASE WHEN `pg`.`game_status` in ('goalkeeper','starter') THEN 1 ELSE 0 END AS `started`, `pt`.`team_season_id` AS `team_season_id`, (select count(0) from (`game_events_goals` `geg` join `game_events_major` `gem` on(`geg`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `pg`.`game_id` and `geg`.`scorer_player_game_id` = `pg`.`id` and coalesce(`geg`.`is_own_goal`,0) = 0) AS `goals`, (select count(0) from ((`game_events_goals` `geg` join `game_events_major` `gem` on(`geg`.`major_event_id` = `gem`.`id`)) join `game_events_penalties` `gep` on(`gep`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `pg`.`game_id` and `geg`.`scorer_player_game_id` = `pg`.`id` and coalesce(`geg`.`is_own_goal`,0) = 0 and `gep`.`outcome` = 'goal' and `gep`.`shooter_player_game_id` = `pg`.`id`) AS `penalty_goals`, (select count(0) from (`game_events_goals` `geg` join `game_events_major` `gem` on(`geg`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `pg`.`game_id` and `geg`.`assist_player_game_id` = `pg`.`id`) AS `assists`, (select count(0) from `game_events_player_actions` `gepa` where `gepa`.`game_id` = `pg`.`game_id` and `gepa`.`player_game_id` = `pg`.`id` and `gepa`.`event_type` in ('shot','shot_on_target')) AS `shots`, (select count(0) from `game_events_player_actions` `gepa` where `gepa`.`game_id` = `pg`.`game_id` and `gepa`.`player_game_id` = `pg`.`id` and `gepa`.`event_type` = 'shot_on_target') AS `shots_on_target`, (select count(0) from `game_events_player_actions` `gepa` where `gepa`.`game_id` = `pg`.`game_id` and `gepa`.`player_game_id` = `pg`.`id` and `gepa`.`event_type` = 'save') AS `saves`, (select count(0) from (`game_events_goals` `geg` join `game_events_major` `gem` on(`geg`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `pg`.`game_id` and `geg`.`defending_gk_player_game_id` = `pg`.`id`) AS `goals_against`, (select count(0) from `game_events_penalties` `gep` where (`gep`.`major_event_id` in (select `game_events_major`.`id` from `game_events_major` where `game_events_major`.`game_id` = `pg`.`game_id`) or `gep`.`game_id` = `pg`.`game_id`) and `gep`.`gk_player_game_id` = `pg`.`id`) AS `penalties_faced`, (select count(0) from `game_events_penalties` `gep` where (`gep`.`major_event_id` in (select `game_events_major`.`id` from `game_events_major` where `game_events_major`.`game_id` = `pg`.`game_id`) or `gep`.`game_id` = `pg`.`game_id`) and `gep`.`gk_player_game_id` = `pg`.`id` and `gep`.`outcome` = 'saved') AS `penalty_saves`, (select count(0) from (`game_events_discipline` `ged` join `game_events_major` `gem` on(`ged`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `pg`.`game_id` and `ged`.`player_game_id` = `pg`.`id` and `ged`.`card_type` in ('yellow','yellow_red')) AS `yellow_cards`, (select count(0) from (`game_events_discipline` `ged` join `game_events_major` `gem` on(`ged`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `pg`.`game_id` and `ged`.`player_game_id` = `pg`.`id` and `ged`.`card_type` in ('red','yellow_red')) AS `red_cards`, CASE WHEN (select count(0) from (`game_events_goals` `geg` join `game_events_major` `gem` on(`geg`.`major_event_id` = `gem`.`id`)) where `gem`.`game_id` = `pg`.`game_id` AND `geg`.`defending_gk_player_game_id` = `pg`.`id`) = 0 AND (`pg`.`game_status` = 'goalkeeper' OR exists(select 1 from `game_subs` `gs` where `gs`.`game_id` = `pg`.`game_id` AND `gs`.`in_player_id` = `pg`.`id` AND `gs`.`gk_sub` = 1 limit 1)) AND !exists(select 1 from `game_subs` `gs` where `gs`.`game_id` = `pg`.`game_id` AND `gs`.`out_player_id` = `pg`.`id` AND `gs`.`gk_sub` = 1 limit 1) THEN 1 ELSE 0 END AS `clean_sheet` FROM ((((`player_games` `pg` join `games` `g` on(`pg`.`game_id` = `g`.`id`)) left join `people` `p` on(`pg`.`player_id` = `p`.`id`)) left join `team_seasons` `ts` on(`pg`.`team_season_id` = `ts`.`id`)) left join `player_teams` `pt` on(`pg`.`player_id` = `pt`.`player_id` and `pt`.`team_season_id` = `pg`.`team_season_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_player_period_stats`
--
DROP TABLE IF EXISTS `v_player_period_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_player_period_stats`  AS SELECT `pg`.`id` AS `player_game_id`, `pg`.`game_id` AS `game_id`, `pg`.`player_id` AS `player_id`, concat(`p`.`first_name`,' ',`p`.`last_name`) AS `full_name`, `gem`.`period` AS `period_number`, count(distinct case when `geg`.`scorer_player_game_id` = `pg`.`id` and coalesce(`geg`.`is_own_goal`,0) = 0 then `geg`.`id` end) AS `period_goals`, count(distinct case when `geg`.`assist_player_game_id` = `pg`.`id` then `geg`.`id` end) AS `period_assists`, count(distinct case when `gepa`.`event_type` in ('shot','shot_on_target') and `gepa`.`player_game_id` = `pg`.`id` and `gepa`.`period` = `gem`.`period` then `gepa`.`id` end) AS `period_shots`, count(distinct case when `gepa`.`event_type` = 'shot_on_target' and `gepa`.`player_game_id` = `pg`.`id` and `gepa`.`period` = `gem`.`period` then `gepa`.`id` end) AS `period_shots_on_target`, count(distinct case when `gepa`.`event_type` = 'save' and `gepa`.`player_game_id` = `pg`.`id` and `gepa`.`period` = `gem`.`period` then `gepa`.`id` end) AS `period_saves`, count(distinct case when `geg`.`defending_gk_player_game_id` = `pg`.`id` then `geg`.`id` end) AS `period_goals_against`, count(distinct case when `ged`.`player_game_id` = `pg`.`id` and `ged`.`card_type` in ('yellow','yellow_red') then `ged`.`id` end) AS `period_yellow_cards`, 0 AS `period_fouls` FROM ((((((`player_games` `pg` join `people` `p` on(`pg`.`player_id` = `p`.`id`)) left join `games` `g` on(`pg`.`game_id` = `g`.`id`)) left join `game_events_major` `gem` on(`gem`.`game_id` = `pg`.`game_id`)) left join `game_events_goals` `geg` on(`geg`.`major_event_id` = `gem`.`id` and (`geg`.`scorer_player_game_id` = `pg`.`id` or `geg`.`assist_player_game_id` = `pg`.`id` or `geg`.`defending_gk_player_game_id` = `pg`.`id`))) left join `game_events_player_actions` `gepa` on(`gepa`.`game_id` = `pg`.`game_id` and `gepa`.`player_game_id` = `pg`.`id`)) left join `game_events_discipline` `ged` on(`ged`.`major_event_id` = `gem`.`id` and `ged`.`player_game_id` = `pg`.`id`)) WHERE `gem`.`period` is not null GROUP BY `pg`.`id`, `pg`.`game_id`, `pg`.`player_id`, `p`.`first_name`, `p`.`last_name`, `gem`.`period` ORDER BY `pg`.`game_id` ASC, `pg`.`player_id` ASC, `gem`.`period` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_player_season_stats_calculated`
--
DROP TABLE IF EXISTS `v_player_season_stats_calculated`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_player_season_stats_calculated`  AS SELECT `p`.`id` AS `player_id`, concat(`p`.`first_name`,' ',`p`.`last_name`) AS `full_name`, `p`.`first_name` AS `first_name`, `p`.`last_name` AS `last_name`, `ts`.`id` AS `team_season_id`, `ts`.`team_id` AS `team_id`, `t`.`team_name` AS `team_name`, `c`.`name` AS `club_name`, `s`.`id` AS `season_id`, `s`.`season_name` AS `season_name`, count(distinct `pg`.`game_id`) AS `games_played`, coalesce(sum(case when `pgs`.`started` = 1 then 1 else 0 end),0) AS `games_started`, coalesce(sum(`pgs`.`goals`),0) AS `total_goals`, coalesce(sum(`pgs`.`penalty_goals`),0) AS `total_penalty_goals`, coalesce(sum(`pgs`.`assists`),0) AS `total_assists`, coalesce(sum(`pgs`.`shots`),0) AS `total_shots`, coalesce(sum(`pgs`.`shots_on_target`),0) AS `total_shots_on_target`, coalesce(sum(`pgs`.`saves`),0) AS `total_saves`, coalesce(sum(`pgs`.`goals_against`),0) AS `total_goals_against`, coalesce(sum(`pgs`.`penalties_faced`),0) AS `total_penalties_faced`, coalesce(sum(`pgs`.`penalty_saves`),0) AS `total_penalty_saves`, coalesce(sum(`pgs`.`clean_sheet`),0) AS `clean_sheets`, coalesce(sum(`pgs`.`yellow_cards`),0) AS `total_yellow_cards`, coalesce(sum(`pgs`.`red_cards`),0) AS `total_red_cards`, CASE WHEN count(distinct `pg`.`game_id`) > 0 THEN round(coalesce(sum(`pgs`.`goals`),0) * 1.0 / count(distinct `pg`.`game_id`),2) ELSE 0 END AS `goals_per_game`, CASE WHEN coalesce(sum(`pgs`.`shots`),0) > 0 THEN round(coalesce(sum(`pgs`.`goals`),0) * 100.0 / sum(`pgs`.`shots`),1) ELSE 0 END AS `shooting_percentage`, CASE WHEN coalesce(sum(`pgs`.`shots`),0) > 0 THEN round(coalesce(sum(`pgs`.`shots_on_target`),0) * 100.0 / sum(`pgs`.`shots`),1) ELSE 0 END AS `shot_accuracy`, CASE WHEN coalesce(sum(`pgs`.`saves`),0) + coalesce(sum(`pgs`.`goals_against`),0) > 0 THEN round(coalesce(sum(`pgs`.`saves`),0) * 100.0 / (coalesce(sum(`pgs`.`saves`),0) + coalesce(sum(`pgs`.`goals_against`),0)),1) ELSE NULL END AS `save_percentage`, CASE WHEN count(distinct `pg`.`game_id`) > 0 THEN round(coalesce(sum(`pgs`.`goals_against`),0) * 1.0 / count(distinct `pg`.`game_id`),2) ELSE NULL END AS `goals_against_average` FROM ((((((((`people` `p` join `player_teams` `pt` on(`p`.`id` = `pt`.`player_id` and `pt`.`is_active` = 1)) join `team_seasons` `ts` on(`pt`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `player_games` `pg` on(`p`.`id` = `pg`.`player_id` and `pg`.`team_season_id` = `ts`.`id`)) left join `games` `g` on(`pg`.`game_id` = `g`.`id` and `g`.`status` = 'completed' and `g`.`season_id` = `s`.`id`)) left join `v_player_game_stats_enhanced` `pgs` on(`pg`.`id` = `pgs`.`player_game_id`)) GROUP BY `p`.`id`, `p`.`first_name`, `p`.`last_name`, `ts`.`id`, `ts`.`team_id`, `t`.`team_name`, `c`.`name`, `s`.`id`, `s`.`season_name` ;

-- --------------------------------------------------------

--
-- Structure for view `v_player_stats_combined`
--
DROP TABLE IF EXISTS `v_player_stats_combined`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_player_stats_combined`  AS SELECT `p`.`id` AS `player_id`, `p`.`first_name` AS `first_name`, `p`.`last_name` AS `last_name`, `ts`.`id` AS `team_season_id`, `t`.`team_name` AS `team_name`, `c`.`name` AS `club_name`, `s`.`season_name` AS `season_name`, coalesce(`psc`.`total_goals`,0) AS `calculated_goals`, coalesce(`psc`.`total_assists`,0) AS `calculated_assists`, coalesce(`psc`.`total_yellow_cards`,0) AS `calculated_yellow_cards`, coalesce(`psc`.`total_red_cards`,0) AS `calculated_red_cards`, coalesce(`psc`.`total_shots`,0) AS `calculated_shots`, coalesce(`psc`.`total_shots_on_target`,0) AS `calculated_shots_on_target`, coalesce(`psc`.`total_saves`,0) AS `calculated_saves`, coalesce(`psc`.`games_played`,0) AS `calculated_games_played`, coalesce(`psc`.`games_started`,0) AS `calculated_games_started`, `pss`.`goals` AS `manual_goals`, `pss`.`assists` AS `manual_assists`, `pss`.`yellow_cards` AS `manual_yellow_cards`, `pss`.`red_cards` AS `manual_red_cards`, `pss`.`games_played` AS `manual_games_played`, `pss`.`games_started` AS `manual_games_started`, `pss`.`shots` AS `manual_shots`, `pss`.`shots_on_target` AS `manual_shots_on_target`, `pss`.`saves` AS `manual_saves`, `pss`.`clean_sheets` AS `manual_clean_sheets`, `pss`.`stats_source` AS `stats_source`, coalesce(`pss`.`goals`,`psc`.`total_goals`,0) AS `total_goals`, coalesce(`pss`.`assists`,`psc`.`total_assists`,0) AS `total_assists`, coalesce(`pss`.`yellow_cards`,`psc`.`total_yellow_cards`,0) AS `total_yellow_cards`, coalesce(`pss`.`red_cards`,`psc`.`total_red_cards`,0) AS `total_red_cards`, coalesce(`pss`.`games_played`,`psc`.`games_played`,0) AS `total_games_played`, coalesce(`pss`.`shots`,`psc`.`total_shots`,0) AS `total_shots`, coalesce(`pss`.`saves`,`psc`.`total_saves`,0) AS `total_saves` FROM (((((((`people` `p` join `player_teams` `pt` on(`p`.`id` = `pt`.`player_id` and `pt`.`is_active` = 1)) join `team_seasons` `ts` on(`pt`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `v_player_season_stats_calculated` `psc` on(`p`.`id` = `psc`.`player_id` and `ts`.`id` = `psc`.`team_season_id`)) left join `player_season_stats` `pss` on(`p`.`id` = `pss`.`player_id` and `ts`.`id` = `pss`.`team_season_id`)) ORDER BY `c`.`name` ASC, `t`.`team_name` ASC, `p`.`last_name` ASC, `p`.`first_name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_standings`
--
DROP TABLE IF EXISTS `v_standings`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_standings`  AS SELECT `ts`.`id` AS `team_season_id`, `t`.`id` AS `team_id`, `t`.`team_name` AS `team_name`, `t`.`gender` AS `team_gender`, `c`.`id` AS `club_id`, `c`.`name` AS `club_name`, `c`.`abbreviation` AS `club_abbreviation`, `c`.`logo_url` AS `club_logo_url`, `c`.`type` AS `club_type`, `c`.`location` AS `club_location`, `s`.`id` AS `season_id`, `s`.`season_name` AS `season_name`, `s`.`start_date` AS `season_start`, `s`.`end_date` AS `season_end`, `s`.`status`= 'active' AS `is_current_season`, `ag`.`id` AS `age_group_id`, `ag`.`name` AS `age_group_name`, `l`.`id` AS `league_id`, `l`.`name` AS `league_name`, `lns`.`id` AS `league_node_season_id`, `ln`.`id` AS `league_node_id`, `ln`.`name` AS `league_node_name`, `ln`.`node_type` AS `league_node_type`, `ln`.`level` AS `league_level`, coalesce(`tsr`.`wins`,sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 1 else 0 end)) AS `wins`, coalesce(`tsr`.`losses`,sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` < `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` < `gs`.`home_score` then 1 else 0 end)) AS `losses`, coalesce(`tsr`.`draws`,sum(case when (`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `gs`.`home_score` = `gs`.`away_score` and `gs`.`home_score` is not null then 1 else 0 end)) AS `draws`, coalesce(`tsr`.`games_played`,count(distinct case when `gs`.`game_id` is not null then `g`.`id` end)) AS `games_played`, coalesce(`tsr`.`goals_for`,(select count(0) from ((`game_events_goals` `geg2` join `game_events_major` `gem2` on(`geg2`.`major_event_id` = `gem2`.`id`)) join `games` `g2` on(`gem2`.`game_id` = `g2`.`id`)) where (`g2`.`home_team_season_id` = `ts`.`id` or `g2`.`away_team_season_id` = `ts`.`id`) and `g2`.`status` = 'completed' and `geg2`.`team_season_id` = `ts`.`id` and coalesce(`geg2`.`is_own_goal`,0) = 0) + (select count(0) from ((`game_events_goals` `geg3` join `game_events_major` `gem3` on(`geg3`.`major_event_id` = `gem3`.`id`)) join `games` `g3` on(`gem3`.`game_id` = `g3`.`id`)) where (`g3`.`home_team_season_id` = `ts`.`id` or `g3`.`away_team_season_id` = `ts`.`id`) and `g3`.`status` = 'completed' and `geg3`.`team_season_id` <> `ts`.`id` and `geg3`.`is_own_goal` = 1)) AS `goals_for`, coalesce(`tsr`.`goals_against`,(select count(0) from ((`game_events_goals` `geg4` join `game_events_major` `gem4` on(`geg4`.`major_event_id` = `gem4`.`id`)) join `games` `g4` on(`gem4`.`game_id` = `g4`.`id`)) where (`g4`.`home_team_season_id` = `ts`.`id` or `g4`.`away_team_season_id` = `ts`.`id`) and `g4`.`status` = 'completed' and `geg4`.`team_season_id` <> `ts`.`id` and coalesce(`geg4`.`is_own_goal`,0) = 0) + (select count(0) from ((`game_events_goals` `geg5` join `game_events_major` `gem5` on(`geg5`.`major_event_id` = `gem5`.`id`)) join `games` `g5` on(`gem5`.`game_id` = `g5`.`id`)) where (`g5`.`home_team_season_id` = `ts`.`id` or `g5`.`away_team_season_id` = `ts`.`id`) and `g5`.`status` = 'completed' and `geg5`.`team_season_id` = `ts`.`id` and `geg5`.`is_own_goal` = 1)) AS `goals_against`, coalesce(`tsr`.`goals_for`,0) - coalesce(`tsr`.`goals_against`,0) AS `goal_difference`, coalesce(`tsr`.`points`,sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 3 when (`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `gs`.`home_score` = `gs`.`away_score` and `gs`.`home_score` is not null then 1 else 0 end)) AS `points`, sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` then 1 else 0 end) AS `home_wins`, sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` < `gs`.`away_score` then 1 else 0 end) AS `home_losses`, sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` = `gs`.`away_score` and `gs`.`home_score` is not null then 1 else 0 end) AS `home_draws`, sum(case when `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 1 else 0 end) AS `away_wins`, sum(case when `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` < `gs`.`home_score` then 1 else 0 end) AS `away_losses`, sum(case when `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` = `gs`.`home_score` and `gs`.`away_score` is not null then 1 else 0 end) AS `away_draws`, NULL AS `current_streak`, NULL AS `last_5_form`, CASE WHEN coalesce(`tsr`.`games_played`,count(distinct case when `gs`.`game_id` is not null then `g`.`id` end)) > 0 THEN round(coalesce(`tsr`.`points`,sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 3 when (`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `gs`.`home_score` = `gs`.`away_score` and `gs`.`home_score` is not null then 1 else 0 end)) * 1.0 / coalesce(`tsr`.`games_played`,count(distinct case when `gs`.`game_id` is not null then `g`.`id` end)),2) ELSE 0 END AS `points_per_game`, CASE WHEN coalesce(`tsr`.`games_played`,count(distinct case when `gs`.`game_id` is not null then `g`.`id` end)) > 0 THEN round(coalesce(`tsr`.`wins`,sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 1 else 0 end)) * 100.0 / coalesce(`tsr`.`games_played`,count(distinct case when `gs`.`game_id` is not null then `g`.`id` end)),2) ELSE 0 END AS `win_percentage`, CASE WHEN coalesce(`tsr`.`games_played`,count(distinct case when `gs`.`game_id` is not null then `g`.`id` end)) > 0 THEN round(coalesce(`tsr`.`goals_for`,0) * 1.0 / coalesce(`tsr`.`games_played`,count(distinct case when `gs`.`game_id` is not null then `g`.`id` end)),2) ELSE 0 END AS `goals_per_game`, CASE WHEN coalesce(`tsr`.`games_played`,count(distinct case when `gs`.`game_id` is not null then `g`.`id` end)) > 0 THEN round(coalesce(`tsr`.`goals_against`,0) * 1.0 / coalesce(`tsr`.`games_played`,count(distinct case when `gs`.`game_id` is not null then `g`.`id` end)),2) ELSE 0 END AS `goals_against_per_game`, coalesce(`tsr`.`record_source`,'calculated') AS `record_source`, `tle`.`is_active` AS `enrollment_is_active`, `ts`.`is_active` AS `team_season_is_active` FROM ((((((((((((`team_seasons` `ts` join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `age_groups` `ag` on(`ts`.`age_group` = `ag`.`id`)) join `team_league_enrollments` `tle` on(`ts`.`id` = `tle`.`team_season_id`)) join `league_node_seasons` `lns` on(`tle`.`league_node_season_id` = `lns`.`id`)) join `league_nodes` `ln` on(`lns`.`league_node_id` = `ln`.`id`)) join `leagues` `l` on(`ln`.`league_id` = `l`.`id`)) left join `team_season_records` `tsr` on(`ts`.`id` = `tsr`.`team_season_id` and `lns`.`id` = `tsr`.`league_node_season_id`)) left join `games` `g` on((`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `g`.`status` = 'completed')) left join `game_league_nodes` `gln` on(`g`.`id` = `gln`.`game_id` and `gln`.`league_node_id` = `lns`.`id`)) left join (select `v_games_summary`.`game_id` AS `game_id`,`v_games_summary`.`home_score` AS `home_score`,`v_games_summary`.`away_score` AS `away_score` from `v_games_summary`) `gs` on(`g`.`id` = `gs`.`game_id`)) WHERE `ts`.`is_active` = 1 AND `t`.`is_active` = 1 AND `c`.`is_active` = 1 AND `tle`.`is_active` = 1 GROUP BY `ts`.`id`, `t`.`id`, `t`.`team_name`, `t`.`gender`, `c`.`id`, `c`.`name`, `c`.`abbreviation`, `c`.`logo_url`, `c`.`type`, `c`.`location`, `s`.`id`, `s`.`season_name`, `s`.`start_date`, `s`.`end_date`, `s`.`status`, `ag`.`id`, `ag`.`name`, `l`.`id`, `l`.`name`, `lns`.`id`, `ln`.`id`, `ln`.`name`, `ln`.`node_type`, `ln`.`level`, `tsr`.`wins`, `tsr`.`losses`, `tsr`.`draws`, `tsr`.`goals_for`, `tsr`.`goals_against`, `tsr`.`games_played`, `tsr`.`points`, `tsr`.`record_source`, `tle`.`is_active`, `ts`.`is_active` ORDER BY `s`.`status`= 'active' DESC, `l`.`name` ASC, `ln`.`level` ASC, `ln`.`name` ASC, coalesce(`tsr`.`points`,0) DESC, coalesce(`tsr`.`goals_for`,0) - coalesce(`tsr`.`goals_against`,0) DESC, coalesce(`tsr`.`goals_for`,0) DESC, `c`.`name` ASC, `t`.`team_name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `v_stat_leaders`
--
DROP TABLE IF EXISTS `v_stat_leaders`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_stat_leaders`  AS SELECT `psc`.`player_id` AS `player_id`, `psc`.`team_id` AS `team_id`, `psc`.`team_season_id` AS `team_season_id`, `psc`.`season_id` AS `season_id`, `psc`.`first_name` AS `first_name`, `psc`.`last_name` AS `last_name`, `psc`.`full_name` AS `full_name`, `pt`.`jersey_number` AS `jersey_number`, `pt`.`position` AS `position`, `psc`.`team_name` AS `team_name`, `psc`.`club_name` AS `club_name`, `psc`.`season_name` AS `season_name`, `psc`.`total_goals` AS `total_goals`, `psc`.`total_assists` AS `total_assists`, `psc`.`total_shots` AS `total_shots`, `psc`.`total_shots_on_target` AS `total_shots_on_target`, `psc`.`total_saves` AS `total_saves`, `psc`.`total_yellow_cards` AS `total_yellow_cards`, `psc`.`total_red_cards` AS `total_red_cards`, `psc`.`games_played` AS `games_played`, `psc`.`games_started` AS `games_started`, `psc`.`goals_per_game` AS `goals_per_game`, `psc`.`shooting_percentage` AS `shooting_percentage`, `psc`.`save_percentage` AS `save_percentage`, `psc`.`goals_against_average` AS `goals_against_average`, `psc`.`clean_sheets` AS `clean_sheets` FROM (`v_player_season_stats_calculated` `psc` left join `player_teams` `pt` on(`psc`.`player_id` = `pt`.`player_id` and `psc`.`team_season_id` = `pt`.`team_season_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_teams_all`
--
DROP TABLE IF EXISTS `v_teams_all`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_teams_all`  AS SELECT `ts`.`id` AS `id`, `ts`.`team_id` AS `team_id`, `ts`.`season_id` AS `season_id`, `ts`.`is_active` AS `team_season_is_active`, `t`.`team_name` AS `team_name`, `t`.`club_id` AS `club_id`, `t`.`is_active` AS `team_is_active`, `t`.`gender` AS `gender`, `ts`.`age_group` AS `age_group`, `c`.`name` AS `club_name`, `c`.`type` AS `type`, `c`.`location` AS `location`, `c`.`logo_url` AS `logo_url`, `c`.`founded_year` AS `founded_year`, `c`.`is_active` AS `club_is_active`, `c`.`abbreviation` AS `abbreviation`, `s`.`season_name` AS `season_name`, `s`.`start_date` AS `season_start`, `s`.`end_date` AS `season_end`, `s`.`status`= 'active' AS `is_current`, `ag`.`name` AS `age_group_name` FROM ((((`team_seasons` `ts` join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `age_groups` `ag` on(`ts`.`age_group` = `ag`.`id`)) ORDER BY `c`.`name` ASC, `t`.`team_name` ASC, `s`.`start_date` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `v_team_form`
--
DROP TABLE IF EXISTS `v_team_form`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_team_form`  AS SELECT `ts`.`id` AS `team_season_id`, `t`.`team_name` AS `team_name`, `c`.`name` AS `club_name`, `s`.`season_name` AS `season_name`, count(distinct `g`.`id`) AS `recent_games`, sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 1 else 0 end) AS `recent_wins`, sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` < `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` < `gs`.`home_score` then 1 else 0 end) AS `recent_losses`, sum(case when (`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `gs`.`home_score` = `gs`.`away_score` then 1 else 0 end) AS `recent_draws`, sum(case when `g`.`home_team_season_id` = `ts`.`id` then `gs`.`home_score` when `g`.`away_team_season_id` = `ts`.`id` then `gs`.`away_score` else 0 end) AS `recent_goals_for`, sum(case when `g`.`home_team_season_id` = `ts`.`id` then `gs`.`away_score` when `g`.`away_team_season_id` = `ts`.`id` then `gs`.`home_score` else 0 end) AS `recent_goals_against`, sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 3 when (`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `gs`.`home_score` = `gs`.`away_score` then 1 else 0 end) AS `recent_points`, max(`g`.`start_date`) AS `last_game_date` FROM (((((`team_seasons` `ts` join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) join `games` `g` on((`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `g`.`status` = 'completed' and `g`.`start_date` >= curdate() - interval 60 day)) left join `game_scores` `gs` on(`g`.`id` = `gs`.`game_id`)) GROUP BY `ts`.`id`, `t`.`team_name`, `c`.`name`, `s`.`season_name` ;

-- --------------------------------------------------------

--
-- Structure for view `v_team_games`
--
DROP TABLE IF EXISTS `v_team_games`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_team_games`  AS SELECT `games`.`id` AS `id`, `games`.`season_id` AS `season_id`, `games`.`timezone_label` AS `timezone_label`, `games`.`home_team_season_id` AS `home_team_season_id`, `games`.`away_team_season_id` AS `away_team_season_id`, `games`.`status` AS `status`, `games`.`notes` AS `notes`, `games`.`created_at` AS `created_at`, `games`.`modified_at` AS `modified_at`, `games`.`default_reg_periods` AS `default_reg_periods`, `games`.`video_link` AS `video_link`, `games`.`location_id` AS `location_id`, `games`.`google_cal_id` AS `google_cal_id`, `games`.`sublocation_id` AS `sublocation_id`, `games`.`start_date` AS `start_date`, `games`.`start_time` AS `start_time`, `games`.`end_date` AS `end_date`, `games`.`end_time` AS `end_time`, `games`.`home_team_season_id` AS `team_season_id` FROM `games`union all select `games`.`id` AS `id`,`games`.`season_id` AS `season_id`,`games`.`timezone_label` AS `timezone_label`,`games`.`home_team_season_id` AS `home_team_season_id`,`games`.`away_team_season_id` AS `away_team_season_id`,`games`.`status` AS `status`,`games`.`notes` AS `notes`,`games`.`created_at` AS `created_at`,`games`.`modified_at` AS `modified_at`,`games`.`default_reg_periods` AS `default_reg_periods`,`games`.`video_link` AS `video_link`,`games`.`location_id` AS `location_id`,`games`.`google_cal_id` AS `google_cal_id`,`games`.`sublocation_id` AS `sublocation_id`,`games`.`start_date` AS `start_date`,`games`.`start_time` AS `start_time`,`games`.`end_date` AS `end_date`,`games`.`end_time` AS `end_time`,`games`.`away_team_season_id` AS `team_season_id` from `games`  ;

-- --------------------------------------------------------

--
-- Structure for view `v_team_standings_detailed`
--
DROP TABLE IF EXISTS `v_team_standings_detailed`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_team_standings_detailed`  AS SELECT `ts`.`id` AS `team_season_id`, `t`.`team_name` AS `team_name`, `c`.`name` AS `club_name`, `s`.`season_name` AS `season_name`, `lns`.`id` AS `league_node_season_id`, `ln`.`name` AS `league_node_name`, `l`.`name` AS `league_name`, coalesce(sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` then 1 else 0 end),0) AS `home_wins`, coalesce(sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` < `gs`.`away_score` then 1 else 0 end),0) AS `home_losses`, coalesce(sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` = `gs`.`away_score` then 1 else 0 end),0) AS `home_draws`, coalesce(sum(case when `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 1 else 0 end),0) AS `away_wins`, coalesce(sum(case when `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` < `gs`.`home_score` then 1 else 0 end),0) AS `away_losses`, coalesce(sum(case when `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` = `gs`.`home_score` then 1 else 0 end),0) AS `away_draws`, coalesce(sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 1 else 0 end),0) AS `calculated_wins`, coalesce(sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` < `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` < `gs`.`home_score` then 1 else 0 end),0) AS `calculated_losses`, coalesce(sum(case when (`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `gs`.`home_score` = `gs`.`away_score` then 1 else 0 end),0) AS `calculated_draws`, coalesce(sum(case when `g`.`home_team_season_id` = `ts`.`id` then `gs`.`home_score` else 0 end),0) + coalesce(sum(case when `g`.`away_team_season_id` = `ts`.`id` then `gs`.`away_score` else 0 end),0) AS `calculated_goals_for`, coalesce(sum(case when `g`.`home_team_season_id` = `ts`.`id` then `gs`.`away_score` else 0 end),0) + coalesce(sum(case when `g`.`away_team_season_id` = `ts`.`id` then `gs`.`home_score` else 0 end),0) AS `calculated_goals_against`, `tsr`.`wins` AS `manual_wins`, `tsr`.`losses` AS `manual_losses`, `tsr`.`draws` AS `manual_draws`, `tsr`.`goals_for` AS `manual_goals_for`, `tsr`.`goals_against` AS `manual_goals_against`, `tsr`.`points` AS `manual_points`, `tsr`.`record_source` AS `record_source`, coalesce(`tsr`.`wins`,sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 1 else 0 end),0) AS `total_wins`, coalesce(`tsr`.`losses`,sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` < `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` < `gs`.`home_score` then 1 else 0 end),0) AS `total_losses`, coalesce(`tsr`.`draws`,sum(case when (`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `gs`.`home_score` = `gs`.`away_score` then 1 else 0 end),0) AS `total_draws`, coalesce(`tsr`.`goals_for`,sum(case when `g`.`home_team_season_id` = `ts`.`id` then `gs`.`home_score` else 0 end) + sum(case when `g`.`away_team_season_id` = `ts`.`id` then `gs`.`away_score` else 0 end),0) AS `total_goals_for`, coalesce(`tsr`.`goals_against`,sum(case when `g`.`home_team_season_id` = `ts`.`id` then `gs`.`away_score` else 0 end) + sum(case when `g`.`away_team_season_id` = `ts`.`id` then `gs`.`home_score` else 0 end),0) AS `total_goals_against`, coalesce(`tsr`.`points`,sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 3 when (`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `gs`.`home_score` = `gs`.`away_score` then 1 else 0 end),0) AS `total_points`, coalesce(`tsr`.`goals_for`,sum(case when `g`.`home_team_season_id` = `ts`.`id` then `gs`.`home_score` else 0 end) + sum(case when `g`.`away_team_season_id` = `ts`.`id` then `gs`.`away_score` else 0 end),0) - coalesce(`tsr`.`goals_against`,sum(case when `g`.`home_team_season_id` = `ts`.`id` then `gs`.`away_score` else 0 end) + sum(case when `g`.`away_team_season_id` = `ts`.`id` then `gs`.`home_score` else 0 end),0) AS `goal_difference` FROM ((((((((((`team_seasons` `ts` join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `team_league_enrollments` `tle` on(`ts`.`id` = `tle`.`team_season_id`)) left join `league_node_seasons` `lns` on(`tle`.`league_node_season_id` = `lns`.`id`)) left join `league_nodes` `ln` on(`lns`.`league_node_id` = `ln`.`id`)) left join `leagues` `l` on(`ln`.`league_id` = `l`.`id`)) left join `team_season_records` `tsr` on(`ts`.`id` = `tsr`.`team_season_id` and `lns`.`id` = `tsr`.`league_node_season_id`)) left join `games` `g` on((`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `g`.`status` = 'completed')) left join `game_scores` `gs` on(`g`.`id` = `gs`.`game_id`)) WHERE `ts`.`is_active` = 1 GROUP BY `ts`.`id`, `t`.`team_name`, `c`.`name`, `s`.`season_name`, `lns`.`id`, `ln`.`name`, `l`.`name`, `tsr`.`wins`, `tsr`.`losses`, `tsr`.`draws`, `tsr`.`goals_for`, `tsr`.`goals_against`, `tsr`.`points`, `tsr`.`record_source` ORDER BY coalesce(`tsr`.`points`,sum(case when `g`.`home_team_season_id` = `ts`.`id` and `gs`.`home_score` > `gs`.`away_score` or `g`.`away_team_season_id` = `ts`.`id` and `gs`.`away_score` > `gs`.`home_score` then 3 when (`g`.`home_team_season_id` = `ts`.`id` or `g`.`away_team_season_id` = `ts`.`id`) and `gs`.`home_score` = `gs`.`away_score` then 1 else 0 end),0) DESC, coalesce(`tsr`.`goals_for`,sum(case when `g`.`home_team_season_id` = `ts`.`id` then `gs`.`home_score` else 0 end) + sum(case when `g`.`away_team_season_id` = `ts`.`id` then `gs`.`away_score` else 0 end),0) - coalesce(`tsr`.`goals_against`,sum(case when `g`.`home_team_season_id` = `ts`.`id` then `gs`.`away_score` else 0 end) + sum(case when `g`.`away_team_season_id` = `ts`.`id` then `gs`.`home_score` else 0 end),0) DESC, coalesce(`tsr`.`goals_for`,sum(case when `g`.`home_team_season_id` = `ts`.`id` then `gs`.`home_score` else 0 end) + sum(case when `g`.`away_team_season_id` = `ts`.`id` then `gs`.`away_score` else 0 end),0) DESC ;

-- --------------------------------------------------------

--
-- Structure for view `v_users`
--
DROP TABLE IF EXISTS `v_users`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_users`  AS SELECT `p`.`id` AS `person_id`, `p`.`first_name` AS `first_name`, `p`.`last_name` AS `last_name`, `p`.`nickname` AS `nickname`, `p`.`email` AS `email`, `p`.`phone` AS `phone`, `p`.`gender` AS `gender`, `p`.`birth_date` AS `birth_date`, `p`.`title` AS `title`, `p`.`other_last_name` AS `other_last_name`, `p`.`entry_year` AS `entry_year`, `p`.`credits_needed` AS `credits_needed`, `u`.`system_admin` AS `system_admin`, `p`.`is_active` AS `is_active`, `p`.`created_at` AS `person_created_at`, `p`.`modified_at` AS `person_modified_at`, `u`.`id` AS `user_id`, `u`.`last_login_at` AS `last_login_at`, `up`.`id` AS `preferences_id`, `up`.`theme` AS `theme`, `up`.`last_team_season_id` AS `last_team_season_id`, `ts_last`.`team_id` AS `last_team_id`, `t_last`.`team_name` AS `last_team_name`, `t_last`.`gender` AS `last_team_gender`, `s_last`.`id` AS `last_season_id`, `s_last`.`season_name` AS `last_season_name`, `s_last`.`status`= 'active' AS `last_season_is_current`, `uts_agg`.`team_season_count` AS `team_season_count`, `uts_agg`.`roles_json` AS `roles_json`, `uts_agg`.`team_season_count`> 0 AS `has_team_access`, `uf_agg`.`favorite_count` AS `favorite_count`, `uf_agg`.`favorite_team_season_ids` AS `favorite_team_season_ids` FROM (((((((`people` `p` join `users` `u` on(`u`.`person_id` = `p`.`id`)) left join `user_preferences` `up` on(`up`.`person_id` = `p`.`id`)) left join `team_seasons` `ts_last` on(`ts_last`.`id` = `up`.`last_team_season_id`)) left join `teams` `t_last` on(`t_last`.`id` = `ts_last`.`team_id`)) left join `seasons` `s_last` on(`s_last`.`id` = `ts_last`.`season_id`)) left join (select `user_team_seasons`.`person_id` AS `person_id`,count(0) AS `team_season_count`,concat('[',group_concat(distinct concat('"',`user_team_seasons`.`role`,'"') order by `user_team_seasons`.`role` ASC separator ','),']') AS `roles_json` from `user_team_seasons` group by `user_team_seasons`.`person_id`) `uts_agg` on(`uts_agg`.`person_id` = `p`.`id`)) left join (select `user_favorites`.`person_id` AS `person_id`,count(0) AS `favorite_count`,concat('[',group_concat(`user_favorites`.`team_season_id` order by `user_favorites`.`team_season_id` ASC separator ','),']') AS `favorite_team_season_ids` from `user_favorites` group by `user_favorites`.`person_id`) `uf_agg` on(`uf_agg`.`person_id` = `p`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_user_teams`
--
DROP TABLE IF EXISTS `v_user_teams`;

CREATE ALGORITHM=UNDEFINED DEFINER=`u676616277_u676616277_dec`@`127.0.0.1` SQL SECURITY DEFINER VIEW `v_user_teams`  AS SELECT DISTINCT `p`.`id` AS `person_id`, `ts`.`id` AS `team_season_id`, `ts`.`team_id` AS `team_id`, `ts`.`season_id` AS `season_id`, `t`.`team_name` AS `team_name`, `t`.`gender` AS `gender`, `t`.`club_id` AS `club_id`, `c`.`name` AS `club_name`, `c`.`abbreviation` AS `club_abbreviation`, `c`.`location` AS `club_location`, `c`.`logo_url` AS `club_logo_url`, `c`.`type` AS `club_type`, `s`.`season_name` AS `season_name`, `s`.`start_date` AS `season_start`, `s`.`end_date` AS `season_end`, `s`.`status`= 'active' AS `is_current_season`, `ts`.`age_group` AS `age_group`, `ag`.`name` AS `age_group_name`, `ts`.`is_active` AS `team_season_is_active`, 'Player' AS `user_role`, `pt`.`jersey_number` AS `jersey_number`, `pt`.`joined_date` AS `role_joined_date`, `pt`.`left_date` AS `role_left_date`, `pt`.`is_active` AS `role_is_active`, NULL AS `is_favorite` FROM ((((((`people` `p` join `player_teams` `pt` on(`p`.`id` = `pt`.`player_id`)) join `team_seasons` `ts` on(`pt`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `age_groups` `ag` on(`ts`.`age_group` = `ag`.`id`)) WHERE `pt`.`is_active` = 1 AND `ts`.`is_active` = 1 AND `t`.`is_active` = 1 AND `c`.`is_active` = 1unionselect distinct `pr`.`related_person_id` AS `user_id`,`ts`.`id` AS `team_season_id`,`ts`.`team_id` AS `team_id`,`ts`.`season_id` AS `season_id`,`t`.`team_name` AS `team_name`,`t`.`gender` AS `gender`,`t`.`club_id` AS `club_id`,`c`.`name` AS `club_name`,`c`.`abbreviation` AS `club_abbreviation`,`c`.`location` AS `club_location`,`c`.`logo_url` AS `club_logo_url`,`c`.`type` AS `club_type`,`s`.`season_name` AS `season_name`,`s`.`start_date` AS `season_start`,`s`.`end_date` AS `season_end`,`s`.`status` = 'active' AS `is_current_season`,`ts`.`age_group` AS `age_group`,`ag`.`name` AS `age_group_name`,`ts`.`is_active` AS `team_season_is_active`,concat('Parent of ',`p`.`first_name`,' ',`p`.`last_name`) AS `user_role`,NULL AS `jersey_number`,NULL AS `role_joined_date`,NULL AS `role_left_date`,`pt`.`is_active` AS `role_is_active`,NULL AS `is_favorite` from (((((((`player_relationships` `pr` join `people` `p` on(`pr`.`player_id` = `p`.`id`)) join `player_teams` `pt` on(`pr`.`player_id` = `pt`.`player_id`)) join `team_seasons` `ts` on(`pt`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `age_groups` `ag` on(`ts`.`age_group` = `ag`.`id`)) where `pr`.`relationship` in ('Parent','Guardian') and `pt`.`is_active` = 1 and `ts`.`is_active` = 1 and `t`.`is_active` = 1 and `c`.`is_active` = 1 union select distinct `team_staff`.`person_id` AS `person_id`,`ts`.`id` AS `team_season_id`,`ts`.`team_id` AS `team_id`,`ts`.`season_id` AS `season_id`,`t`.`team_name` AS `team_name`,`t`.`gender` AS `gender`,`t`.`club_id` AS `club_id`,`c`.`name` AS `club_name`,`c`.`abbreviation` AS `club_abbreviation`,`c`.`location` AS `club_location`,`c`.`logo_url` AS `club_logo_url`,`c`.`type` AS `club_type`,`s`.`season_name` AS `season_name`,`s`.`start_date` AS `season_start`,`s`.`end_date` AS `season_end`,`s`.`status` = 'active' AS `is_current_season`,`ts`.`age_group` AS `age_group`,`ag`.`name` AS `age_group_name`,`ts`.`is_active` AS `team_season_is_active`,case `team_staff`.`role` when 'head_coach' then 'Head Coach' when 'assistant_coach' then 'Assistant Coach' when 'team_admin' then 'Team Admin' when 'stats_keeper' then 'Stats Keeper' else `team_staff`.`role` end AS `user_role`,NULL AS `jersey_number`,`team_staff`.`joined_date` AS `role_joined_date`,`team_staff`.`left_date` AS `role_left_date`,`team_staff`.`is_active` AS `role_is_active`,NULL AS `is_favorite` from (((((`team_staff` join `team_seasons` `ts` on(`team_staff`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `age_groups` `ag` on(`ts`.`age_group` = `ag`.`id`)) where `team_staff`.`is_active` = 1 and `ts`.`is_active` = 1 and `t`.`is_active` = 1 and `c`.`is_active` = 1 union select distinct `cs`.`person_id` AS `person_id`,`ts`.`id` AS `team_season_id`,`ts`.`team_id` AS `team_id`,`ts`.`season_id` AS `season_id`,`t`.`team_name` AS `team_name`,`t`.`gender` AS `gender`,`t`.`club_id` AS `club_id`,`c`.`name` AS `club_name`,`c`.`abbreviation` AS `club_abbreviation`,`c`.`location` AS `club_location`,`c`.`logo_url` AS `club_logo_url`,`c`.`type` AS `club_type`,`s`.`season_name` AS `season_name`,`s`.`start_date` AS `season_start`,`s`.`end_date` AS `season_end`,`s`.`status` = 'active' AS `is_current_season`,`ts`.`age_group` AS `age_group`,`ag`.`name` AS `age_group_name`,`ts`.`is_active` AS `team_season_is_active`,case `cs`.`role` when 'club_admin' then 'Club Admin' when 'director' then 'Club Director' when 'registrar' then 'Club Registrar' else `cs`.`role` end AS `user_role`,NULL AS `jersey_number`,`cs`.`joined_date` AS `role_joined_date`,`cs`.`left_date` AS `role_left_date`,`cs`.`is_active` AS `role_is_active`,NULL AS `is_favorite` from (((((`club_staff` `cs` join `clubs` `c` on(`cs`.`club_id` = `c`.`id`)) join `teams` `t` on(`t`.`club_id` = `c`.`id`)) join `team_seasons` `ts` on(`ts`.`team_id` = `t`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `age_groups` `ag` on(`ts`.`age_group` = `ag`.`id`)) where `cs`.`is_active` = 1 and `ts`.`is_active` = 1 and `t`.`is_active` = 1 and `c`.`is_active` = 1 union select distinct `uf`.`person_id` AS `person_id`,`ts`.`id` AS `team_season_id`,`ts`.`team_id` AS `team_id`,`ts`.`season_id` AS `season_id`,`t`.`team_name` AS `team_name`,`t`.`gender` AS `gender`,`t`.`club_id` AS `club_id`,`c`.`name` AS `club_name`,`c`.`abbreviation` AS `club_abbreviation`,`c`.`location` AS `club_location`,`c`.`logo_url` AS `club_logo_url`,`c`.`type` AS `club_type`,`s`.`season_name` AS `season_name`,`s`.`start_date` AS `season_start`,`s`.`end_date` AS `season_end`,`s`.`status` = 'active' AS `is_current_season`,`ts`.`age_group` AS `age_group`,`ag`.`name` AS `age_group_name`,`ts`.`is_active` AS `team_season_is_active`,'Favorite' AS `user_role`,NULL AS `jersey_number`,NULL AS `role_joined_date`,NULL AS `role_left_date`,1 AS `role_is_active`,1 AS `is_favorite` from (((((`user_favorites` `uf` join `team_seasons` `ts` on(`uf`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `age_groups` `ag` on(`ts`.`age_group` = `ag`.`id`)) where `ts`.`is_active` = 1 and `t`.`is_active` = 1 and `c`.`is_active` = 1 union select distinct `uts`.`person_id` AS `person_id`,`ts`.`id` AS `team_season_id`,`ts`.`team_id` AS `team_id`,`ts`.`season_id` AS `season_id`,`t`.`team_name` AS `team_name`,`t`.`gender` AS `gender`,`t`.`club_id` AS `club_id`,`c`.`name` AS `club_name`,`c`.`abbreviation` AS `club_abbreviation`,`c`.`location` AS `club_location`,`c`.`logo_url` AS `club_logo_url`,`c`.`type` AS `club_type`,`s`.`season_name` AS `season_name`,`s`.`start_date` AS `season_start`,`s`.`end_date` AS `season_end`,`s`.`status` = 'active' AS `is_current_season`,`ts`.`age_group` AS `age_group`,`ag`.`name` AS `age_group_name`,`ts`.`is_active` AS `team_season_is_active`,`uts`.`role` AS `user_role`,NULL AS `jersey_number`,NULL AS `role_joined_date`,NULL AS `role_left_date`,1 AS `role_is_active`,NULL AS `is_favorite` from (((((`user_team_seasons` `uts` join `team_seasons` `ts` on(`uts`.`team_season_id` = `ts`.`id`)) join `teams` `t` on(`ts`.`team_id` = `t`.`id`)) join `clubs` `c` on(`t`.`club_id` = `c`.`id`)) join `seasons` `s` on(`ts`.`season_id` = `s`.`id`)) left join `age_groups` `ag` on(`ts`.`age_group` = `ag`.`id`)) where `ts`.`is_active` = 1 and `t`.`is_active` = 1 and `c`.`is_active` = 1 order by `person_id`,`is_current_season` desc,`season_start` desc,`club_name`,`team_name`  ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `clubs`
--
ALTER TABLE `clubs`
  ADD CONSTRAINT `fk_clubs_location` FOREIGN KEY (`location_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `club_staff`
--
ALTER TABLE `club_staff`
  ADD CONSTRAINT `club_staff_ibfk_1` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`),
  ADD CONSTRAINT `club_staff_ibfk_2` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`);

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_ibfk_2` FOREIGN KEY (`event_type_id`) REFERENCES `event_types` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `events_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_events_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `games`
--
ALTER TABLE `games`
  ADD CONSTRAINT `fk_games_away_team_season` FOREIGN KEY (`away_team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_games_home_team_season` FOREIGN KEY (`home_team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_games_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_games_season` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_games_sublocation` FOREIGN KEY (`sublocation_id`) REFERENCES `locations_sublocations` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `games_overtimes`
--
ALTER TABLE `games_overtimes`
  ADD CONSTRAINT `fk_games_overtimes_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_events_discipline`
--
ALTER TABLE `game_events_discipline`
  ADD CONSTRAINT `fk_discipline_major` FOREIGN KEY (`major_event_id`) REFERENCES `game_events_major` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_discipline_player` FOREIGN KEY (`player_game_id`) REFERENCES `player_games` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_discipline_team` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_events_goals`
--
ALTER TABLE `game_events_goals`
  ADD CONSTRAINT `fk_goals_assist` FOREIGN KEY (`assist_player_game_id`) REFERENCES `player_games` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_goals_gk` FOREIGN KEY (`defending_gk_player_game_id`) REFERENCES `player_games` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_goals_major` FOREIGN KEY (`major_event_id`) REFERENCES `game_events_major` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_goals_scorer` FOREIGN KEY (`scorer_player_game_id`) REFERENCES `player_games` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_goals_team` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_events_major`
--
ALTER TABLE `game_events_major`
  ADD CONSTRAINT `fk_major_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_events_penalties`
--
ALTER TABLE `game_events_penalties`
  ADD CONSTRAINT `fk_penalties_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_penalties_gk` FOREIGN KEY (`gk_player_game_id`) REFERENCES `player_games` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_penalties_goal` FOREIGN KEY (`goal_id`) REFERENCES `game_events_goals` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_penalties_major` FOREIGN KEY (`major_event_id`) REFERENCES `game_events_major` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_penalties_shooter` FOREIGN KEY (`shooter_player_game_id`) REFERENCES `player_games` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_penalties_team` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_events_player_actions`
--
ALTER TABLE `game_events_player_actions`
  ADD CONSTRAINT `fk_player_action_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_player_action_player` FOREIGN KEY (`player_game_id`) REFERENCES `player_games` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_events_team`
--
ALTER TABLE `game_events_team`
  ADD CONSTRAINT `fk_events_team_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_events_team_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_league_nodes`
--
ALTER TABLE `game_league_nodes`
  ADD CONSTRAINT `fk_game_league_nodes_season` FOREIGN KEY (`league_node_id`) REFERENCES `league_node_seasons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `game_league_nodes_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_periods`
--
ALTER TABLE `game_periods`
  ADD CONSTRAINT `game_periods_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_scores`
--
ALTER TABLE `game_scores`
  ADD CONSTRAINT `fk_game_scores_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_standings_inclusions`
--
ALTER TABLE `game_standings_inclusions`
  ADD CONSTRAINT `game_standings_inclusions_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `game_standings_inclusions_ibfk_2` FOREIGN KEY (`league_node_id`) REFERENCES `league_nodes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `game_subs`
--
ALTER TABLE `game_subs`
  ADD CONSTRAINT `fk_game_subs_in` FOREIGN KEY (`in_player_id`) REFERENCES `player_games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_game_subs_out` FOREIGN KEY (`out_player_id`) REFERENCES `player_games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `game_subs_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leagues`
--
ALTER TABLE `leagues`
  ADD CONSTRAINT `fk_leagues_governing_body` FOREIGN KEY (`governing_body_id`) REFERENCES `governing_bodies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `league_nodes`
--
ALTER TABLE `league_nodes`
  ADD CONSTRAINT `fk_league_nodes_league` FOREIGN KEY (`league_id`) REFERENCES `leagues` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `league_nodes_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `league_nodes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `league_node_seasons`
--
ALTER TABLE `league_node_seasons`
  ADD CONSTRAINT `fk_ln_season_node` FOREIGN KEY (`league_node_id`) REFERENCES `league_nodes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ln_season_season` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `locations`
--
ALTER TABLE `locations`
  ADD CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `locations_sublocations`
--
ALTER TABLE `locations_sublocations`
  ADD CONSTRAINT `fk_locations_sublocations_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `player_games`
--
ALTER TABLE `player_games`
  ADD CONSTRAINT `fk_player_games_person` FOREIGN KEY (`player_id`) REFERENCES `people` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_player_games_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`),
  ADD CONSTRAINT `player_games_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `player_relationships`
--
ALTER TABLE `player_relationships`
  ADD CONSTRAINT `fk_parent_person` FOREIGN KEY (`related_person_id`) REFERENCES `people` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_player_person` FOREIGN KEY (`player_id`) REFERENCES `people` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `player_season_stats`
--
ALTER TABLE `player_season_stats`
  ADD CONSTRAINT `fk_player_season_stats_player` FOREIGN KEY (`player_id`) REFERENCES `people` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_player_season_stats_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `player_teams`
--
ALTER TABLE `player_teams`
  ADD CONSTRAINT `fk_player_teams_person` FOREIGN KEY (`player_id`) REFERENCES `people` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_player_teams_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teams`
--
ALTER TABLE `teams`
  ADD CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`);

--
-- Constraints for table `team_league_enrollments`
--
ALTER TABLE `team_league_enrollments`
  ADD CONSTRAINT `fk_team_league_enrollments_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tls_node_season` FOREIGN KEY (`league_node_season_id`) REFERENCES `league_node_seasons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `team_seasons`
--
ALTER TABLE `team_seasons`
  ADD CONSTRAINT `fk_team_seasons_age_group` FOREIGN KEY (`age_group`) REFERENCES `age_groups` (`id`),
  ADD CONSTRAINT `team_seasons_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`),
  ADD CONSTRAINT `team_seasons_ibfk_2` FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`);

--
-- Constraints for table `team_season_records`
--
ALTER TABLE `team_season_records`
  ADD CONSTRAINT `fk_team_records_league` FOREIGN KEY (`league_node_season_id`) REFERENCES `league_node_seasons` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_team_records_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `team_staff`
--
ALTER TABLE `team_staff`
  ADD CONSTRAINT `team_staff_ibfk_1` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`),
  ADD CONSTRAINT `team_staff_ibfk_2` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_person` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_favorites`
--
ALTER TABLE `user_favorites`
  ADD CONSTRAINT `user_favorites_fk_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`),
  ADD CONSTRAINT `user_favorites_ibfk_1` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`);

--
-- Constraints for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD CONSTRAINT `user_preferences_fk_team_season` FOREIGN KEY (`last_team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_team_seasons`
--
ALTER TABLE `user_team_seasons`
  ADD CONSTRAINT `fk_person` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
