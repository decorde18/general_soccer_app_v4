import prisma from '../src/lib/prisma';

async function updateStatusEnum() {
  console.log('Modifying player_teams.status enum column in MySQL...');
  await prisma.$executeRawUnsafe(
    "ALTER TABLE player_teams MODIFY COLUMN status ENUM('interested','rostered','trying out','not playing','quit','cut') DEFAULT 'interested'"
  );
  console.log('Enum column modified successfully.');
}

updateStatusEnum();
