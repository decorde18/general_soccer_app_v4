import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== GAME RECORD 899 ===');
  const game: any[] = await prisma.$queryRaw`SELECT id, status, start_date, start_time, period_duration, default_reg_periods FROM games WHERE id = 899`;
  console.log(game);

  console.log('\n=== GAME PERIODS 899 ===');
  const periods: any[] = await prisma.$queryRaw`SELECT * FROM game_periods WHERE game_id = 899 ORDER BY period_number ASC`;
  console.log(periods);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
