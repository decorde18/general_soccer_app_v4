import prisma from '../src/lib/prisma';

async function checkStatusCol() {
  const colInfo: any = await prisma.$queryRawUnsafe(
    "SHOW COLUMNS FROM player_teams LIKE 'status'"
  );
  console.log('Column info for player_teams.status:', colInfo);
}

checkStatusCol();
