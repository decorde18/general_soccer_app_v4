import { PrismaClient } from "../generated/client";
import {
  calculateActivePlayerTimeOnField,
  getPlayerOnFieldIntervals,
  PeriodInterval,
  StoppageInterval,
} from "../lib/utils/dateTimeUtils";

const prisma = new PrismaClient();

interface GoalEvent {
  game_time: number;
  team_season_id: number;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      console.warn(`[Attempt ${attempt}/${retries}] Operation failed: ${err.message || err}. Retrying in ${delayMs}ms...`);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delayMs));
        delayMs *= 2;
      }
    }
  }
  throw lastError;
}

async function finalizeGamesForSeason(seasonId: number, seasonName: string) {
  console.log(`\n============================================================`);
  console.log(`Finalizing completed games for Season #${seasonId} (${seasonName})...`);
  console.log(`============================================================`);

  const gameIds = await withRetry(() =>
    prisma.games.findMany({
      where: {
        season_id: seasonId,
        status: "completed",
      },
      select: { id: true },
      orderBy: { id: "asc" },
    })
  );

  console.log(`Found ${gameIds.length} completed games in Season #${seasonId}.`);

  let totalUpdatedPlayers = 0;
  let totalGamesProcessed = 0;

  for (const { id: gameId } of gameIds) {
    const game = await withRetry(() =>
      prisma.games.findUnique({
        where: { id: gameId },
        include: {
          game_periods: { orderBy: { period_number: "asc" } },
          game_subs: true,
          game_events_major: {
            include: {
              game_events_goals: true,
            },
            orderBy: { game_time: "asc" },
          },
          player_games: {
            include: {
              people: true,
            },
          },
        },
      })
    );

    if (!game) continue;

    if (game.player_games.length === 0) {
      console.log(`Game #${game.id}: Skipped (0 player_games recorded).`);
      continue;
    }

    // 1. Resolve period intervals
    const periodData = game.game_periods;
    const p1Start = periodData[0]?.start_time ? Number(periodData[0].start_time) : null;
    const periodIntervals: PeriodInterval[] = [];
    const periodOffsets = new Map<number, number>();
    const regSecs = game.period_duration || 2400;

    if (p1Start && periodData.length > 0) {
      periodData.forEach((p, idx) => {
        const pStartMs = p.start_time ? Number(p.start_time) : null;
        const pEndMs = p.end_time ? Number(p.end_time) : null;
        if (pStartMs) {
          const startSec = Math.max(0, Math.floor((pStartMs - p1Start) / 1000));
          let endSec = startSec + regSecs;
          if (pEndMs) {
            endSec = Math.max(startSec, Math.floor((pEndMs - p1Start) / 1000));
          }
          periodIntervals.push({ start: startSec, end: endSec });
          periodOffsets.set(p.period_number || idx + 1, startSec);
        } else {
          const startSec = idx * regSecs;
          periodIntervals.push({ start: startSec, end: startSec + regSecs });
          periodOffsets.set(p.period_number || idx + 1, startSec);
        }
      });
    } else {
      const totalReg = regSecs * (game.default_reg_periods || 2);
      periodIntervals.push({ start: 0, end: totalReg });
      periodOffsets.set(1, 0);
      periodOffsets.set(2, regSecs);
    }

    // 2. Resolve stoppage intervals
    const stoppageIntervals: StoppageInterval[] = [];
    game.game_events_major.forEach((e, idx) => {
      if (e.clock_should_run === false || (e.clock_should_run as any) === 0) {
        const pOffset = periodOffsets.get(Number(e.period || 1)) || 0;
        const startCumSecs = pOffset + Number(e.game_time || 0);
        let endCumSecs: number | null = null;
        if (e.end_time !== null && e.end_time !== undefined) {
          endCumSecs = pOffset + Number(e.end_time);
        } else {
          const nextEvent = game.game_events_major.slice(idx + 1).find((ne) => ne.period === e.period);
          if (nextEvent) {
            endCumSecs = pOffset + Number(nextEvent.game_time || 0);
          } else {
            const pIdx = Number(e.period || 1) - 1;
            const pEnd = periodIntervals[pIdx] ? periodIntervals[pIdx].end : null;
            endCumSecs = pEnd;
          }
        }
        stoppageIntervals.push({ startTime: startCumSecs, endTime: endCumSecs });
      }
    });

    // 3. Resolve all goals in game
    const allGoals: GoalEvent[] = [];
    game.game_events_major.forEach((m) => {
      (m.game_events_goals || []).forEach((g) => {
        allGoals.push({
          game_time: Number(m.game_time || 0),
          team_season_id: Number(g.team_season_id),
        });
      });
    });

    // 4. Calculate for each player_game
    const updateData = game.player_games.map((pg) => {
      const statusInPg = pg.game_status;
      const isStarter = Boolean(pg.started || statusInPg === "starter" || statusInPg === "goalkeeper");
      const subsIn = game.game_subs.filter((s) => s.in_player_id === pg.id || s.in_player_id === pg.player_id);
      const subsOut = game.game_subs.filter((s) => s.out_player_id === pg.id || s.out_player_id === pg.player_id);

      const activeSeconds = calculateActivePlayerTimeOnField(
        isStarter,
        subsIn,
        subsOut,
        periodIntervals,
        stoppageIntervals,
        0
      );

      const shiftIntervals = getPlayerOnFieldIntervals(
        isStarter,
        subsIn,
        subsOut,
        periodIntervals,
        0
      );

      let plusMinus = 0;
      allGoals.forEach((goal) => {
        const wasOnField = shiftIntervals.some(
          (inv) => goal.game_time >= inv.start && goal.game_time <= inv.end
        );
        if (wasOnField) {
          if (goal.team_season_id === pg.team_season_id) {
            plusMinus += 1;
          } else {
            plusMinus -= 1;
          }
        }
      });

      return {
        id: Number(pg.id),
        playing_time_seconds: Math.round(activeSeconds || 0),
        plus_minus: Math.round(plusMinus || 0),
      };
    });

    // 5. Batch update player_games via single raw SQL CASE statement
    if (updateData.length > 0) {
      const ids = updateData.map((u) => u.id).join(",");
      const timeCases = updateData.map((u) => `WHEN id = ${u.id} THEN ${u.playing_time_seconds}`).join(" ");
      const pmCases = updateData.map((u) => `WHEN id = ${u.id} THEN ${u.plus_minus}`).join(" ");
      const sql = `UPDATE player_games SET playing_time_seconds = CASE ${timeCases} ELSE playing_time_seconds END, plus_minus = CASE ${pmCases} ELSE plus_minus END WHERE id IN (${ids})`;

      await withRetry(() => prisma.$executeRawUnsafe(sql));
    }

    totalGamesProcessed++;
    totalUpdatedPlayers += game.player_games.length;
    console.log(`Game #${game.id}: Finalized ${game.player_games.length} players (${allGoals.length} goals, ${game.game_subs.length} subs, ${periodIntervals.length} periods).`);
  }

  console.log(`\nSeason #${seasonId} Complete: Processed ${totalGamesProcessed} games, finalized ${totalUpdatedPlayers} player_games records.`);
}

async function main() {
  const activeSeasons = await withRetry(() =>
    prisma.seasons.findMany({
      where: { status: "active" },
      orderBy: { start_date: "desc" },
    })
  );

  console.log("Found active seasons:", activeSeasons.map((s) => ({ id: s.id, name: s.season_name })));

  for (const s of activeSeasons) {
    await finalizeGamesForSeason(s.id, s.season_name);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error during game finalization:", err);
  process.exit(1);
});
