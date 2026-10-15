import fs from 'fs';
import path from 'path';
import { parseSqlTuplesRobust } from './migrate_parents_and_relationships';

function escapeSql(str: string | null): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

async function main() {
  console.log('=== MIGRATING CALENDAR EVENTS ===\n');

  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const legacyCalendarEvents = parseSqlTuplesRobust(sql, 'calendarEvents');
  const legacyLocations = parseSqlTuplesRobust(sql, 'locations');

  console.log(`Parsed ${legacyCalendarEvents.length} legacy calendarEvents.`);

  const eventsToCreate: {
    title: string;
    startDatetime: string;
    endDatetime: string;
    isAllDay: boolean;
    description: string | null;
    googleCalId: string | null;
    locationId: number | null;
    createdAt: string;
    modifiedAt: string;
  }[] = [];

  for (const ce of legacyCalendarEvents) {
    const [
      id,
      createdAt,
      summary,
      startDateTime,
      endDateTime,
      seasonId,
      updatedAt,
      calId,
      calType,
      allDay,
      seasonPhase,
      locId,
      desc
    ] = ce;

    if (!summary || !startDateTime || !endDateTime) continue;

    eventsToCreate.push({
      title: summary.trim(),
      startDatetime: startDateTime.trim(),
      endDatetime: endDateTime.trim(),
      isAllDay: allDay === '1',
      description: desc && desc.trim().length > 0 ? desc.trim() : null,
      googleCalId: calId && calId.trim().length > 0 ? calId.trim() : null,
      locationId: locId && Number(locId) > 0 ? Number(locId) : null,
      createdAt: createdAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
      modifiedAt: updatedAt || createdAt || new Date().toISOString().slice(0, 19).replace('T', ' ')
    });
  }

  console.log(`Prepared ${eventsToCreate.length} events records.`);

  // Write SQL script for direct execution
  const sqlOutPath = path.resolve(process.cwd(), 'scripts', 'import_calendar_events.sql');
  let sqlContent = `-- Auto-generated migration script for events\n`;
  sqlContent += `-- Source: u676616277_hs_original.sql (calendarEvents)\n`;
  sqlContent += `-- Total records: ${eventsToCreate.length}\n\n`;
  sqlContent += `INSERT INTO events (title, start_datetime, end_datetime, is_all_day, description, google_cal_id, location_id, created_at, modified_at)\nVALUES\n`;

  const valuesClauses = eventsToCreate.map(e => {
    return `  (${escapeSql(e.title)}, ${escapeSql(e.startDatetime)}, ${escapeSql(e.endDatetime)}, ${e.isAllDay ? 1 : 0}, ${escapeSql(e.description)}, ${escapeSql(e.googleCalId)}, ${e.locationId ?? 'NULL'}, ${escapeSql(e.createdAt)}, ${escapeSql(e.modifiedAt)})`;
  });

  sqlContent += valuesClauses.join(',\n');
  sqlContent += `;\n`;

  fs.writeFileSync(sqlOutPath, sqlContent, 'utf8');
  console.log(`Saved SQL migration file to: ${sqlOutPath}`);

  // Try Prisma insertion if DB reachable
  try {
    const prismaModule = await import('../src/lib/prisma');
    const prisma = prismaModule.default;
    console.log('Testing Prisma connection for direct insertion...');
    const count = await Promise.race([
      prisma.events.count(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2000))
    ]);
    console.log(`Current events in DB: ${count}. Inserting ${eventsToCreate.length} records...`);

    const data = eventsToCreate.map(e => ({
      title: e.title,
      start_datetime: new Date(e.startDatetime),
      end_datetime: new Date(e.endDatetime),
      is_all_day: e.isAllDay,
      description: e.description,
      google_cal_id: e.googleCalId,
      location_id: e.locationId,
      created_at: new Date(e.createdAt),
      modified_at: new Date(e.modifiedAt)
    }));

    await prisma.events.createMany({
      data,
      skipDuplicates: true
    });
    console.log('Successfully inserted events via Prisma!');
    await prisma.$disconnect();
  } catch (err: any) {
    console.log(`Prisma direct execution skipped (${err.message}). SQL script is ready at ${sqlOutPath}`);
  }
}

if (process.argv[1] && process.argv[1].includes('migrate_calendar_events')) {
  main().catch(console.error);
}
