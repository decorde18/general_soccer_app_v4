const { getTeamSeasonRecords } = require("./src/lib/data/queries");

async function main() {
  console.log("=== TESTING QUERIES.TS GETTEAMSEASONRECORDS FOR TOPHAT ===");

  const nodeSeasons = [
    { id: 22, name: "Navy Division Overall" },
    { id: 23, name: "Group A" },
    { id: 24, name: "Group B" }
  ];

  for (const ns of nodeSeasons) {
    const records = await getTeamSeasonRecords(ns.id);
    console.log(`\n--- STANDINGS FOR NODE SEASON ${ns.id} (${ns.name}) ---`);
    console.log(`Total Teams with Records: ${records.length}`);
    records.forEach(r => {
      console.log(`Team: ${r.teamName} (TS #${r.teamSeasonId}) | GP: ${r.gamesPlayed} | W: ${r.wins} | L: ${r.losses} | D: ${r.draws} | GF: ${r.goalsFor} | GA: ${r.goalsAgainst} | Pts: ${r.points}`);
    });
  }
}

main().catch(console.error);
