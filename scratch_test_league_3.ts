import { getLeagueById, getLeagueNodeSeasons, getTeamSeasonRecords, getGames } from "./src/lib/data/queries";

async function testLeague3() {
  try {
    console.log("Fetching league 3...");
    const league = await getLeagueById(3);
    console.log("League:", league);

    console.log("Fetching node seasons for league 3...");
    const nodeSeasons = await getLeagueNodeSeasons(3);
    console.log("Node seasons count:", nodeSeasons.length, nodeSeasons);

    console.log("Fetching games for league 3...");
    const allGames = await getGames({ leagueId: 3 });
    console.log("Games count:", allGames.length);

    console.log("Fetching standings for node seasons...");
    const allDivisionsData = await Promise.all(
      nodeSeasons.map(async (ns) => {
        const standings = await getTeamSeasonRecords(ns.id);
        console.log(`NodeSeason ${ns.id} (${ns.leagueNodeName}): ${standings.length} teams`);
        return {
          id: ns.id,
          leagueNodeName: ns.leagueNodeName,
          standingsCount: standings.length
        };
      })
    );
    console.log("Done allDivisionsData:", allDivisionsData);
  } catch (err: any) {
    console.error("ERROR testing league 3:", err);
  }
}

testLeague3();
