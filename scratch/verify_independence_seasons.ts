import prisma from '../src/lib/prisma';

async function verify() {
  const seasons = await prisma.seasons.findMany({
    orderBy: { start_date: 'asc' }
  });
  console.log(`Total seasons in DB: ${seasons.length}`);
  for (const s of seasons) {
    console.log(`- Season ${s.id}: ${s.season_name} [${s.start_date?.toISOString().split('T')[0]} to ${s.end_date?.toISOString().split('T')[0]}] status=${s.status}`);
  }

  const teamSeasons = await prisma.team_seasons.findMany({
    where: {
      teams: {
        club_id: 25
      }
    },
    include: {
      teams: true,
      seasons: true,
      team_staff: {
        include: {
          people: true
        }
      }
    }
  });

  console.log(`\nTotal team_seasons for Independence High School: ${teamSeasons.length}`);
  
  const staffByRole: Record<string, number> = {};
  let totalStaffAssignments = 0;
  for (const ts of teamSeasons) {
    totalStaffAssignments += ts.team_staff.length;
    for (const staff of ts.team_staff) {
      staffByRole[staff.role] = (staffByRole[staff.role] || 0) + 1;
    }
  }

  console.log(`Total team_staff assignments for Independence: ${totalStaffAssignments}`);
  console.log('Staff assignments breakdown by role:', staffByRole);

  const clubStaff = await prisma.club_staff.findMany({
    where: { club_id: 25 },
    include: { people: true }
  });

  console.log(`\nTotal club_staff assignments for Independence (Club 25): ${clubStaff.length}`);
  for (const cs of clubStaff) {
    console.log(`- ${cs.people.first_name} ${cs.people.last_name}: role=${cs.role}, title=${cs.title}, access_level=${cs.access_level}`);
  }

  await prisma.$disconnect();
}

verify().catch(console.error);
