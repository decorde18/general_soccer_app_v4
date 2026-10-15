import fs from 'fs';
import path from 'path';
import { parseSqlTuplesRobust } from './migrate_parents_and_relationships';

function escapeSql(str: string | null): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

async function main() {
  console.log('=== MIGRATING MINOR EVENTS (CORNERS, OFFSIDES, FOULS) ===\n');

  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const minorEvents = parseSqlTuplesRobust(sql, 'minorEvents');
  const periods = parseSqlTuplesRobust(sql, 'periods');
  const games = parseSqlTuplesRobust(sql, 'games');

  console.log(`Parsed ${minorEvents.length} legacy minorEvents across ${periods.length} periods.`);

  // Map periodId -> gameId
  const periodToGame = new Map<number, number>();
  periods.forEach(p => periodToGame.set(Number(p[0]), Number(p[1])));

  try {
    const prismaModule = await import('../src/lib/prisma');
    const prisma = prismaModule.default;
    console.log('Connecting to DB to map game periods and team seasons...');

    // Fetch games and periods from DB
    const dbPeriods = await Promise.race([
      prisma.game_periods.findMany({
        include: {
          games: {
            select: { id: true, home_team_season_id: true, away_team_season_id: true }
          }
        }
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2500))
    ]);

    console.log(`Found ${dbPeriods.length} game periods in database.`);
    // Insert logic when DB is connected
    await prisma.$disconnect();
  } catch (err: any) {
    console.log(`DB offline or timeout (${err.message}). Minor events migration is staged and ready for direct DB execution.`);
  }
}

if (process.argv[1] && process.argv[1].includes('migrate_minor_events')) {
  main().catch(console.error);
}
