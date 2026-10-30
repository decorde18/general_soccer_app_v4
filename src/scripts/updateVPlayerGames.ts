import prisma from "../lib/prisma";

async function main() {
  const sql = `
CREATE OR REPLACE VIEW \`v_player_games\` AS
SELECT
  \`pg\`.\`id\` AS \`player_game_id\`,
  \`pg\`.\`game_id\` AS \`game_id\`,
  \`pg\`.\`player_id\` AS \`player_id\`,
  \`pg\`.\`team_season_id\` AS \`team_id\`,
  \`pg\`.\`position_id\` AS \`position_id\`,
  \`pg\`.\`started\` AS \`started\`,
  \`pg\`.\`game_status\` AS \`game_status\`,
  \`pg\`.\`is_guest\` AS \`is_guest\`,
  \`pg\`.\`playing_time_seconds\` AS \`playing_time_seconds\`,
  \`pg\`.\`plus_minus\` AS \`plus_minus\`,
  \`p\`.\`first_name\` AS \`first_name\`,
  \`p\`.\`last_name\` AS \`last_name\`,
  CONCAT(\`p\`.\`first_name\`, ' ', \`p\`.\`last_name\`) AS \`full_name\`,
  \`p\`.\`nickname\` AS \`nickname\`,
  COALESCE(\`pt_direct\`.\`id\`, \`pt_prog\`.\`id\`) AS \`player_team_id\`,
  COALESCE(\`pt_direct\`.\`jersey_number\`, \`pt_prog\`.\`jersey_number\`) AS \`jersey_number\`,
  COALESCE(\`pt_direct\`.\`position\`, \`pt_prog\`.\`position\`) AS \`primary_position\`,
  \`pg\`.\`team_season_id\` AS \`team_season_id\`,
  COALESCE(\`pt_direct\`.\`captain\`, \`pt_prog\`.\`captain\`, 0) AS \`captain\`,
  COALESCE(\`pt_direct\`.\`grade\`, \`pt_prog\`.\`grade\`) AS \`grade\`,
  COALESCE(\`pt_direct\`.\`status\`, \`pt_prog\`.\`status\`, 'rostered') AS \`roster_status\`,
  \`t\`.\`team_name\` AS \`team_name\`,
  \`t\`.\`gender\` AS \`team_gender\`,
  \`c\`.\`name\` AS \`club_name\`,
  \`c\`.\`abbreviation\` AS \`club_abbreviation\`,
  \`c\`.\`logo_url\` AS \`club_logo_url\`,
  \`g\`.\`start_date\` AS \`start_date\`,
  \`g\`.\`start_time\` AS \`start_time\`,
  \`g\`.\`status\` AS \`game_status_overall\`,
  \`g\`.\`home_team_season_id\` AS \`home_team_season_id\`,
  \`g\`.\`away_team_season_id\` AS \`away_team_season_id\`,
  \`g\`.\`season_id\` AS \`season_id\`,
  CASE
    WHEN \`pg\`.\`team_season_id\` = \`g\`.\`home_team_season_id\` THEN 'home'
    WHEN \`pg\`.\`team_season_id\` = \`g\`.\`away_team_season_id\` THEN 'away'
    ELSE NULL
  END AS \`home_away\`,
  \`s\`.\`season_name\` AS \`season_name\`,
  \`s\`.\`status\` = 'active' AS \`is_current_season\`,
  \`ag\`.\`id\` AS \`age_group_id\`,
  \`ag\`.\`name\` AS \`age_group_name\`,
  \`pg\`.\`created_at\` AS \`created_at\`,
  \`pg\`.\`modified_at\` AS \`modified_at\`
FROM \`player_games\` \`pg\`
JOIN \`people\` \`p\` ON \`pg\`.\`player_id\` = \`p\`.\`id\`
JOIN \`team_seasons\` \`ts\` ON \`pg\`.\`team_season_id\` = \`ts\`.\`id\`
JOIN \`teams\` \`t\` ON \`ts\`.\`team_id\` = \`t\`.\`id\`
JOIN \`clubs\` \`c\` ON \`t\`.\`club_id\` = \`c\`.\`id\`
JOIN \`games\` \`g\` ON \`pg\`.\`game_id\` = \`g\`.\`id\`
JOIN \`seasons\` \`s\` ON \`ts\`.\`season_id\` = \`s\`.\`id\`
LEFT JOIN \`player_teams\` \`pt_direct\` ON \`pt_direct\`.\`player_id\` = \`pg\`.\`player_id\` AND \`pt_direct\`.\`team_season_id\` = \`ts\`.\`id\` AND \`pt_direct\`.\`is_active\` = 1
LEFT JOIN (
  SELECT
    \`pt2\`.\`player_id\`,
    \`ts2\`.\`season_id\`,
    \`t2\`.\`club_id\`,
    MAX(\`pt2\`.\`id\`) AS \`id\`,
    MAX(\`pt2\`.\`jersey_number\`) AS \`jersey_number\`,
    MAX(\`pt2\`.\`position\`) AS \`position\`,
    MAX(\`pt2\`.\`captain\`) AS \`captain\`,
    MAX(\`pt2\`.\`grade\`) AS \`grade\`,
    MAX(CASE WHEN \`pt2\`.\`status\` = 'rostered' THEN 'rostered' ELSE \`pt2\`.\`status\` END) AS \`status\`
  FROM \`player_teams\` \`pt2\`
  JOIN \`team_seasons\` \`ts2\` ON \`pt2\`.\`team_season_id\` = \`ts2\`.\`id\`
  JOIN \`teams\` \`t2\` ON \`ts2\`.\`team_id\` = \`t2\`.\`id\`
  WHERE \`pt2\`.\`is_active\` = 1
  GROUP BY \`pt2\`.\`player_id\`, \`ts2\`.\`season_id\`, \`t2\`.\`club_id\`
) \`pt_prog\` ON \`pt_prog\`.\`player_id\` = \`pg\`.\`player_id\` AND \`pt_prog\`.\`season_id\` = \`ts\`.\`season_id\` AND \`pt_prog\`.\`club_id\` = \`t\`.\`club_id\`
LEFT JOIN \`age_groups\` \`ag\` ON \`ts\`.\`age_group\` = \`ag\`.\`id\`
WHERE (
  \`pt_direct\`.\`status\` = 'rostered'
  OR \`pt_prog\`.\`status\` = 'rostered'
  OR \`pg\`.\`is_guest\` = 1
  OR (\`pt_direct\`.\`id\` IS NULL AND \`pt_prog\`.\`id\` IS NULL)
)
ORDER BY \`g\`.\`start_date\` DESC, \`g\`.\`start_time\` DESC, \`pg\`.\`started\` DESC, \`p\`.\`last_name\`, \`p\`.\`first_name\`;
  `;

  await prisma.$executeRawUnsafe(sql);
  console.log("Successfully updated v_player_games view in MySQL!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
