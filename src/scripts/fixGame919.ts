import prisma from "@/lib/prisma";

async function fixGame919() {
  console.log("=== FIXING GAME 919 SUB RECORDS ===");

  // 1. Delete workaround subs 1327 and 1330
  const deleteResult = await prisma.game_subs.deleteMany({
    where: {
      id: { in: [1327, 1330] },
      game_id: 919,
    },
  });
  console.log(`Deleted ${deleteResult.count} workaround sub records (1327, 1330)`);

  // 2. Insert correct Halftime GK Swap record for Game 919
  // Elle Conrad (1501) becomes GK, Ella West (1500) ceases to be GK
  const newGkSwap = await prisma.game_subs.create({
    data: {
      game_id: 919,
      in_player_id: 1501, // Elle Conrad
      out_player_id: 1500, // Ella West
      sub_time: 2400, // Halftime (start of period 2)
      period: 2,
      gk_sub: true,
      is_swap: true,
    },
  });
  console.log("Created correct Halftime GK Swap record:", newGkSwap);

  // 3. Inspect updated subs for Game 919
  const updatedGame = await prisma.games.findUnique({
    where: { id: 919 },
    include: {
      game_subs: true,
      player_games: {
        include: {
          people: true,
        },
      },
    },
  });

  console.log("\n=== UPDATED SUBS FOR GAME 919 ===");
  updatedGame?.game_subs.forEach((sub) => {
    const inPg = updatedGame.player_games.find((pg) => pg.id === sub.in_player_id);
    const outPg = updatedGame.player_games.find((pg) => pg.id === sub.out_player_id);
    const inName = inPg?.people ? `${inPg.people.first_name} ${inPg.people.last_name}` : sub.in_player_id;
    const outName = outPg?.people ? `${outPg.people.first_name} ${outPg.people.last_name}` : sub.out_player_id;
    console.log(
      `Sub ID: ${sub.id} | IN: ${inName} (${sub.in_player_id}) | OUT: ${outName} (${sub.out_player_id}) | Time: ${sub.sub_time}s | Period: ${sub.period} | GK_Sub: ${sub.gk_sub} | Is_Swap: ${sub.is_swap}`
    );
  });
}

fixGame919()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
