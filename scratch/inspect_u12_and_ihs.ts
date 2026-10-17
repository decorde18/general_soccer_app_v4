import prisma from '../src/lib/prisma';

async function main() {
  console.log("Using DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
  const teams: any[] = await prisma.$queryRawUnsafe(`
    SELECT 
      t.id as team_id,
      t.team_name,
      t.gender,
      c.id as club_id,
      c.name as club_name,
      c.type as club_type,
      ts.id as team_season_id,
      s.season_name,
      (SELECT COUNT(*) FROM player_teams pt WHERE pt.team_season_id = ts.id) as roster_count,
      (SELECT COUNT(*) FROM games g WHERE g.home_team_season_id = ts.id OR g.away_team_season_id = ts.id) as games_count
    FROM teams t
    JOIN clubs c ON c.id = t.club_id
    JOIN team_seasons ts ON ts.team_id = t.id
    JOIN seasons s ON s.id = ts.season_id
    WHERE 
      c.name LIKE '%Independence%' 
      OR c.name LIKE '%Williamson%' 
      OR c.name LIKE '%TSC%'
      OR t.team_name LIKE '%U12%' 
      OR t.team_name LIKE '%Elite%' 
      OR t.team_name LIKE '%DC%' 
      OR t.team_name LIKE '%LM%'
      OR t.team_name LIKE '%Varsity%'
      OR t.team_name LIKE '%JV%'
    ORDER BY c.name, t.team_name, s.start_date DESC
  `);

  console.log(`Found ${teams.length} matching team seasons:`);
  let currentClub = '';
  for (const t of teams) {
    if (t.club_name !== currentClub) {
      console.log(`\n======================================================`);
      console.log(`Club [${t.club_id}] "${t.club_name}" (${t.club_type})`);
      console.log(`======================================================`);
      currentClub = t.club_name;
    }
    console.log(`  Team [${t.team_id}] "${t.team_name}" (${t.gender}) | TS [${t.team_season_id}] Season: "${t.season_name}" | Roster: ${t.roster_count} | Games: ${t.games_count}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
