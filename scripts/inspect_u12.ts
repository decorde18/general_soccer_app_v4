import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const teams: any[] = await prisma.$queryRawUnsafe(`
    SELECT t.id as team_id, t.team_name, c.name as club_name, ts.id as team_season_id
    FROM teams t
    JOIN team_seasons ts ON ts.team_id = t.id
    LEFT JOIN clubs c ON c.id = t.club_id
  `);

  console.log('Searching for rosters...');
  for (const t of teams) {
    const roster: any[] = await prisma.$queryRawUnsafe(`
      SELECT pt.id, pt.player_id, pt.jersey_number, p.first_name, p.last_name
      FROM player_teams pt
      JOIN people p ON p.id = pt.player_id
      WHERE pt.team_season_id = ${t.team_season_id}
    `);
    
    if (roster.length > 0 || t.team_name.toLowerCase().includes('u12') || t.team_name.toLowerCase().includes('williamson') || t.team_name.toLowerCase().includes('elite')) {
      console.log(`\n=== Team: "${t.team_name}" (${t.club_name}) | TeamID: ${t.team_id} | TeamSeasonID: ${t.team_season_id} | Roster Count: ${roster.length} ===`);
      for (const r of roster) {
        console.log(`  RosterID: ${r.id} | PersonID: ${r.player_id} | ${r.first_name} ${r.last_name} | Jersey: #${r.jersey_number ?? 'NONE'}`);
      }
    }
  }

  // Also search people for DC and LM or player names from attached CSV
  console.log('\n=== Searching People for DC / LM or player names ===');
  const csvNames = [
    ['Hadley Kate', 'Cole'],
    ['Stella', 'Pruitt'],
    ['Avery', 'Weaver'],
    ['Harper', 'Dean'],
    ['Maklary', 'Wilkinson'],
    ['Layla', 'Doyle'],
    ['Misha', 'Patel'],
    ['Annie', 'Lafferty'],
    ['Lillian', 'Trinitapoli'],
    ['Ella', 'West'],
    ['Cora', 'Cowden'],
    ['Margaret', 'Dillmann'],
    ['Elizabeth', 'Gil'],
    ['Katherine', 'Gil'],
    ['Avery', 'Harring'],
    ['Emma Kate', 'Chapman'],
    ['Cameron', 'Hurley'],
    ['Leighton', 'Hurley'],
    ['Avery', 'Long'],
    ['Genevieve', 'Jensen'],
    ['Adelyne', 'Wooten'],
    ['Elle', 'Conrad'],
    ['Sandy', 'Guerrero'],
    ['Mia', 'Williams'],
    ['Kenzie', 'Beatty'],
    ['Riley', 'Sole'],
    ['mila', 'saleh'],
    ['Avery', 'Colkmire'],
    ['Parker', 'Tate']
  ];

  for (const [first, last] of csvNames) {
    const found: any[] = await prisma.$queryRawUnsafe(`
      SELECT p.id, p.first_name, p.last_name, pt.id as pt_id, pt.team_season_id, pt.jersey_number, t.team_name
      FROM people p
      LEFT JOIN player_teams pt ON pt.player_id = p.id
      LEFT JOIN team_seasons ts ON ts.id = pt.team_season_id
      LEFT JOIN teams t ON t.id = ts.team_id
      WHERE LOWER(p.first_name) LIKE '%${first.toLowerCase()}%' AND LOWER(p.last_name) LIKE '%${last.toLowerCase()}%'
    `);
    console.log(`Searching ${first} ${last}: found ${found.length}`);
    for (const f of found) {
      console.log(`  Person ID: ${f.id} | Name: ${f.first_name} ${f.last_name} | TeamSeason: ${f.team_season_id} (${f.team_name}) | Current Jersey: #${f.jersey_number}`);
    }
  }

  // Search people with initials DC or LM
  const dcLm: any[] = await prisma.$queryRawUnsafe(`
    SELECT p.id, p.first_name, p.last_name, pt.id as pt_id, pt.team_season_id, pt.jersey_number, t.team_name
    FROM people p
    LEFT JOIN player_teams pt ON pt.player_id = p.id
    LEFT JOIN team_seasons ts ON ts.id = pt.team_season_id
    LEFT JOIN teams t ON t.id = ts.team_id
    WHERE (LOWER(p.first_name) LIKE 'd%' AND LOWER(p.last_name) LIKE 'c%')
       OR (LOWER(p.first_name) LIKE 'l%' AND LOWER(p.last_name) LIKE 'm%')
  `);
  console.log(`\n=== People matching initials DC or LM (${dcLm.length}): ===`);
  for (const f of dcLm) {
    console.log(`  Person ID: ${f.id} | Name: ${f.first_name} ${f.last_name} | TeamSeason: ${f.team_season_id} (${f.team_name}) | Jersey: #${f.jersey_number}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
