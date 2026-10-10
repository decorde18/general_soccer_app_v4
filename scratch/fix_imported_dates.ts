const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("../src/generated/client");
const { parseGameDatesAndTimesUTC } = require("../src/lib/utils/dateTimeUtils");
const prisma = new PrismaClient();

// Parse CSV lines respecting quotes
function parseCSVLine(text) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

async function main() {
  const csvPath = "C:\\Users\\decor\\.gemini\\antigravity-ide\\brain\\20cc6a9d-facc-471c-b969-7917f443dd2e\\.user_uploaded\\media_1791629175937.csv";
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.trim().split(/\r?\n/).slice(1); // skip header

  console.log(`Read ${lines.length} rows from CSV`);

  const games = await prisma.games.findMany({
    where: { id: { gte: 921, lte: 932 } },
    orderBy: { id: "asc" }
  });

  console.log(`Found ${games.length} games to update (921 to 932).`);

  for (let i = 0; i < lines.length && i < games.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;
    const parts = parseCSVLine(row);
    const dateStr = parts[0];
    const timeStr = parts[1];
    const gameNum = parts[2];
    const game = games[i];

    console.log(`\nRow ${i + 1}: Game #${gameNum} | Date: ${dateStr} | Time: ${timeStr} -> Game ID ${game.id}`);
    const { startDate, startTime, endDate, endTime } = parseGameDatesAndTimesUTC(dateStr, timeStr);

    console.log(`  Updating Game ${game.id} -> start_date: ${startDate.toISOString().slice(0, 10)} | start_time: ${startTime?.toISOString()}`);

    await prisma.games.update({
      where: { id: game.id },
      data: {
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
      }
    });
  }

  console.log("\nVerifying updated games 921 to 932:");
  const updatedGames = await prisma.games.findMany({
    where: { id: { gte: 921, lte: 932 } },
    orderBy: { id: "asc" },
    include: {
      team_seasons_games_home_team_season_idToteam_seasons: { include: { teams: true } },
      team_seasons_games_away_team_season_idToteam_seasons: { include: { teams: true } },
    }
  });

  for (const g of updatedGames) {
    const h = g.team_seasons_games_home_team_season_idToteam_seasons;
    const a = g.team_seasons_games_away_team_season_idToteam_seasons;
    console.log(`Game ${g.id}: Date=${g.start_date.toISOString().slice(0, 10)} Time=${g.start_time?.toISOString()} | ${h?.teams?.team_name} vs ${a?.teams?.team_name}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
