const { PrismaClient } = require("./src/generated/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== INSPECTING ALL PERIOD 2 EVENTS FOR GAME 886 ===");

  const gameId = 886;

  const majors = await prisma.game_events_major.findMany({
    where: { game_id: gameId, period: 2 }
  });

  const actions = await prisma.game_events_player_actions.findMany({
    where: { game_id: gameId, period: 2 },
    include: { player_games: { include: { people: true } } }
  });

  const subs = await prisma.game_subs.findMany({
    where: { game_id: gameId, period: 2 },
    include: {
      player_games_game_subs_in_player_idToplayer_games: { include: { people: true } },
      player_games_game_subs_out_player_idToplayer_games: { include: { people: true } }
    }
  });

  const teamEvents = await prisma.game_events_team.findMany({
    where: { game_id: gameId, period: 2 }
  });

  console.log("\n--- MAJOR EVENTS ---");
  majors.forEach(m => console.log(`[Major ID ${m.id}] type=${m.event_type}, game_time=${m.game_time}s (${Math.floor(m.game_time/60)}'), created_at=${m.created_at}, details=${m.details}`));

  console.log("\n--- PLAYER ACTIONS (Shots/Saves) ---");
  actions.forEach(a => console.log(`[Action ID ${a.id}] type=${a.event_type}, game_time=${a.game_time}s (${Math.floor(a.game_time/60)}'), created_at=${a.created_at}, player=${a.player_games?.people?.first_name} ${a.player_games?.people?.last_name}`));

  console.log("\n--- SUBS ---");
  subs.forEach(s => console.log(`[Sub ID ${s.id}] sub_time=${s.sub_time}s (${Math.floor((s.sub_time||0)/60)}'), created_at=${s.created_at}, in=${s.player_games_game_subs_in_player_idToplayer_games?.people?.first_name}, out=${s.player_games_game_subs_out_player_idToplayer_games?.people?.first_name}`));

  console.log("\n--- TEAM EVENTS (Corners/Fouls/Offsides) ---");
  teamEvents.forEach(t => console.log(`[TeamEvent ID ${t.id}] type=${t.event_type}, game_time=${t.game_time}s (${Math.floor(t.game_time/60)}'), created_at=${t.created_at}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
