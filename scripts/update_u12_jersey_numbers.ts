import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const updates = [
  { first: 'Hadley Kate', last: 'Cole', jersey: 62 },
  { first: 'Stella', last: 'Pruitt', jersey: 56 },
  { first: 'Avery', last: 'Weaver', jersey: 8 },
  { first: 'Harper', last: 'Dean', jersey: 30 },
  { first: 'Maklary', last: 'Wilkinson', jersey: 39 },
  { first: 'Layla', last: 'Doyle', jersey: 50 },
  { first: 'Misha', last: 'Patel', jersey: 49 },
  { first: 'Annie', last: 'Lafferty', jersey: 89 },
  { first: 'Lillian', last: 'Trinitapoli', jersey: 36 },
  { first: 'Ella', last: 'West', jersey: 0 },
  { first: 'Cora', last: 'Cowden', jersey: 17 },
  { first: 'Margaret', last: 'Dillmann', jersey: 40 },
  { first: 'Elizabeth', last: 'Gil', jersey: 48 },
  { first: 'Katherine', last: 'Gil', jersey: 64 },
  { first: 'Avery', last: 'Harring', jersey: 52 },
  { first: 'Emma Kate', last: 'Chapman', jersey: 98 },
  { first: 'Cameron', last: 'Hurley', jersey: 38 },
  { first: 'Leighton', last: 'Hurley', jersey: 27 },
  { first: 'Avery', last: 'Long', jersey: 25 },
  { first: 'Genevieve', last: 'Jensen', jersey: 60 },
  { first: 'Adelyne', last: 'Wooten', jersey: 51 },
  { first: 'Elle', last: 'Conrad', jersey: 99 },
  { first: 'Sandy', last: 'Guerrero', jersey: 63 },
  { first: 'Mia', last: 'Williams', jersey: 29 },
  { first: 'Kenzie', last: 'Beatty', jersey: 45 },
  { first: 'Riley', last: 'Sole', jersey: 72 },
  { first: 'mila', last: 'saleh', jersey: 3 },
  { first: 'Avery', last: 'Colkmire', jersey: 86 },
  { first: 'Parker', last: 'Tate', jersey: 46 }
];

async function main() {
  console.log('Beginning jersey number updates for TSC U12 Elite, DC, and LM...');
  
  const targetTeamSeasonIds = [121, 122, 125]; // Parent pool (121), DC (122), LM (125)
  let updatedCount = 0;

  for (const item of updates) {
    // Find person
    const people: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, first_name, last_name FROM people 
      WHERE LOWER(first_name) = '${item.first.toLowerCase()}' AND LOWER(last_name) = '${item.last.toLowerCase()}'
    `);

    if (people.length === 0) {
      console.warn(`Could not find person: ${item.first} ${item.last}`);
      continue;
    }

    const personId = people[0].id;

    for (const tsId of targetTeamSeasonIds) {
      const res: any = await prisma.$executeRawUnsafe(`
        UPDATE player_teams 
        SET jersey_number = ${item.jersey}
        WHERE player_id = ${personId} AND team_season_id = ${tsId}
      `);
      if (res > 0) {
        console.log(`Updated ${item.first} ${item.last} (Person ${personId}) on TeamSeason ${tsId} -> Jersey #${item.jersey}`);
        updatedCount += res;
      }
    }
  }

  console.log(`\nCompleted! Updated a total of ${updatedCount} roster records.`);

  // Print updated rosters
  for (const tsId of targetTeamSeasonIds) {
    const teamInfo: any[] = await prisma.$queryRawUnsafe(`
      SELECT t.team_name, ts.id as team_season_id
      FROM team_seasons ts
      JOIN teams t ON t.id = ts.team_id
      WHERE ts.id = ${tsId}
    `);
    
    const roster: any[] = await prisma.$queryRawUnsafe(`
      SELECT pt.id, pt.player_id, pt.jersey_number, p.first_name, p.last_name
      FROM player_teams pt
      JOIN people p ON p.id = pt.player_id
      WHERE pt.team_season_id = ${tsId}
      ORDER BY pt.jersey_number ASC
    `);

    console.log(`\n=== Verified Roster for ${teamInfo[0]?.team_name} (TS ID: ${tsId}) [Count: ${roster.length}] ===`);
    for (const r of roster) {
      console.log(`  #${String(r.jersey_number).padStart(2, ' ')} | ${r.first_name} ${r.last_name} (Person ID: ${r.player_id})`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
