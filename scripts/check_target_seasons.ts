import prisma from '../src/lib/prisma';

async function main() {
  const seasons = await prisma.seasons.findMany({ orderBy: { start_date: 'asc' } });
  console.log('Target DB Seasons count:', seasons.length);
  console.log(seasons.map(s => ({ id: s.id, name: s.season_name, start: s.start_date, end: s.end_date, status: s.status })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
