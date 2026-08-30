const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  const gameId = 886;

  const game = await prisma.games.findUnique({
    where: { id: gameId },
    include: {
      game_periods: true,
      game_subs: {
        include: {
          player_games_game_subs_in_player_idToplayer_games: { include: { people: true } },
          player_games_game_subs_out_player_idToplayer_games: { include: { people: true } }
        }
      },
      player_games: {
        include: { people: true }
      }
    }
  });

  console.log("=== GAME 886 PERIODS ===");
  const p1 = game.game_periods.find(p => p.period_number === 1);
  const p2 = game.game_periods.find(p => p.period_number === 2);
  const p1Sec = p1 && p1.end_time && p1.start_time ? Math.round(Number(p1.end_time - p1.start_time) / 1000) : 2400;
  const p2Sec = p2 && p2.end_time && p2.start_time ? Math.round(Number(p2.end_time - p2.start_time) / 1000) : 2400;
  const totalMatchSec = p1Sec + p2Sec;

  console.log(`P1 Duration: ${p1Sec}s (${(p1Sec/60).toFixed(1)}')`);
  console.log(`P2 Duration: ${p2Sec}s (${(p2Sec/60).toFixed(1)}')`);
  console.log(`Total Match Duration: ${totalMatchSec}s (${(totalMatchSec/60).toFixed(1)}')`);

  console.log("\n=== ALL SUBS IN CHRONOLOGICAL ORDER (SECS FROM KICKOFF) ===");
  const subs = game.game_subs.map(s => {
    let cumSec = Number(s.sub_time || 0);
    if (s.period === 2 && cumSec < 2400) {
      cumSec = p1Sec + cumSec; // cumulative time from kickoff
    }
    return {
      id: s.id,
      period: s.period,
      sub_time: Number(s.sub_time),
      cumSec,
      inPlayer: s.player_games_game_subs_in_player_idToplayer_games?.people?.first_name || "Unknown",
      inId: s.in_player_id,
      outPlayer: s.player_games_game_subs_out_player_idToplayer_games?.people?.first_name || "Unknown",
      outId: s.out_player_id,
    };
  }).sort((a,b) => a.cumSec - b.cumSec);

  subs.forEach(s => {
    console.log(`[P${s.period} @ ${s.cumSec}s (${(s.cumSec/60).toFixed(1)}')] IN: ${s.inPlayer} (#${s.inId}) | OUT: ${s.outPlayer} (#${s.outId})`);
  });

  console.log("\n=== PLAYERS & THEIR SUBS ===");
  game.player_games.forEach(pg => {
    const pName = `${pg.people?.first_name} ${pg.people?.last_name}`;
    const pIns = subs.filter(s => String(s.inId) === String(pg.id));
    const pOuts = subs.filter(s => String(s.outId) === String(pg.id));
    const status = pg.game_status || "dressed";

    console.log(`\nPlayer #${pg.jersey_number || '?'} ${pName} (Status: ${status}, ID: ${pg.id}):`);
    console.log(`  Ins (${pIns.length}):`, pIns.map(i => `P${i.period} @ ${i.cumSec}s (${(i.cumSec/60).toFixed(1)}')`).join(", "));
    console.log(`  Outs (${pOuts.length}):`, pOuts.map(o => `P${o.period} @ ${o.cumSec}s (${(o.cumSec/60).toFixed(1)}')`).join(", "));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
