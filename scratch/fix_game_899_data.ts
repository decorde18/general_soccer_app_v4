import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIXING GAME 899 SUB TIMES ===');

  const updatedSubs = await prisma.$executeRaw`
    UPDATE game_subs
    SET sub_time = 1800
    WHERE game_id = 899 AND period = 1 AND sub_time > 1800
  `;

  console.log(`Updated ${updatedSubs} subs for Game 899 Period 1 to 1800s.`);

  const rawGames: any[] = await prisma.$queryRaw`SELECT * FROM games WHERE id = 899`;
  const game = rawGames[0];

  const periodData: any[] = await prisma.$queryRaw`SELECT * FROM game_periods WHERE game_id = 899 ORDER BY period_number ASC`;
  const subsData: any[] = await prisma.$queryRaw`SELECT * FROM game_subs WHERE game_id = 899`;
  const pgsData: any[] = await prisma.$queryRaw`
    SELECT pg.*, p.first_name, p.last_name
    FROM player_games pg
    JOIN people p ON pg.player_id = p.id
    WHERE pg.game_id = 899
  `;

  const p1Start = periodData[0]?.start_time ? Number(periodData[0].start_time) : null;
  const periodIntervals: { start: number; end: number }[] = [];
  const regSecs = game?.period_duration || 1800;

  periodData.forEach((p: any, idx: number) => {
    const pStartMs = p.start_time ? Number(p.start_time) : null;
    const pEndMs = p.end_time ? Number(p.end_time) : null;
    if (pStartMs && p1Start) {
      const startSec = Math.max(0, Math.floor((pStartMs - p1Start) / 1000));
      let endSec = startSec + regSecs;
      if (pEndMs) {
        endSec = Math.max(startSec, Math.floor((pEndMs - p1Start) / 1000));
      }
      periodIntervals.push({ start: startSec, end: endSec });
    }
  });

  console.log('\nPeriod Intervals (absolute seconds from game start):');
  console.log(periodIntervals);

  console.log('\nCalculated Minutes Played for Game 899 Players:');
  for (const pg of pgsData) {
    const isStarted = pg.started || pg.game_status === 'starter' || pg.game_status === 'goalkeeper';
    const subsIn = subsData.filter((s: any) => s.in_player_id === pg.id);
    const subsOut = subsData.filter((s: any) => s.out_player_id === pg.id);

    const normIn = subsIn.map((s: any) => Number(s.sub_time || 0));
    const normOut = subsOut.map((s: any) => Number(s.sub_time || 0));

    let totalSecs = 0;
    const events: { type: "IN" | "OUT"; time: number }[] = [];
    normIn.forEach((t: number) => events.push({ type: "IN", time: t }));
    normOut.forEach((t: number) => events.push({ type: "OUT", time: t }));
    events.sort((a, b) => a.time - b.time);

    let onField = isStarted;
    let shiftStart: number | null = isStarted ? 0 : null;
    const intervals: { start: number; end: number }[] = [];

    events.forEach((evt) => {
      if (evt.type === "IN") {
        if (!onField) { onField = true; shiftStart = evt.time; }
      } else if (evt.type === "OUT") {
        if (onField && shiftStart !== null) {
          if (evt.time > shiftStart) intervals.push({ start: shiftStart, end: evt.time });
          onField = false; shiftStart = null;
        }
      }
    });

    const maxTimeline = periodIntervals[periodIntervals.length - 1]?.end || 3600;
    if (onField && shiftStart !== null && maxTimeline > shiftStart) {
      intervals.push({ start: shiftStart, end: maxTimeline });
    }

    for (const inv of intervals) {
      for (const p of periodIntervals) {
        const overlapStart = Math.max(inv.start, p.start);
        const overlapEnd = Math.min(inv.end, p.end);
        if (overlapEnd > overlapStart) {
          totalSecs += (overlapEnd - overlapStart);
        }
      }
    }

    const mins = Math.round(totalSecs / 60);
    const name = pg.first_name + ' ' + pg.last_name;
    console.log(`- ${name.padEnd(25)} | Role: ${pg.game_status.padEnd(10)} | Active Mins: ${mins}m (${totalSecs}s)`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
