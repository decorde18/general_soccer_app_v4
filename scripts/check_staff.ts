import prisma from '../src/lib/prisma';

async function main() {
  const clubStaffCount = await prisma.club_staff.count();
  const teamStaffCount = await prisma.team_staff.count();
  
  console.log({ clubStaffCount, teamStaffCount });

  const sampleClubStaff = await prisma.club_staff.findMany({ take: 5 });
  const sampleTeamStaff = await prisma.team_staff.findMany({ take: 5 });

  console.log('Sample Club Staff:', sampleClubStaff);
  console.log('Sample Team Staff:', sampleTeamStaff);
}

main().catch(console.error).finally(() => prisma.$disconnect());
