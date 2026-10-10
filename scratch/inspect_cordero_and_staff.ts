import prisma from '../src/lib/prisma';

async function inspectCorderoAndStaff() {
  console.log('=== PERSON ID 17 ===');
  const person17 = await prisma.people.findUnique({
    where: { id: 17 },
    include: {
      users: true,
      club_staff: { include: { clubs: true } },
      team_staff: { include: { team_seasons: { include: { teams: true, seasons: true } } } }
    }
  });
  console.log(JSON.stringify(person17, null, 2));

  console.log('\n=== ALL PEOPLE MATCHING CORDERO OR DAVID ===');
  const corderos = await prisma.people.findMany({
    where: {
      OR: [
        { last_name: { contains: 'Cordero' } },
        { first_name: { contains: 'David' } }
      ]
    },
    include: {
      users: true,
      club_staff: { include: { clubs: true } },
      team_staff: true
    }
  });
  console.log(JSON.stringify(corderos, null, 2));

  console.log('\n=== CLUBS MATCHING TENNESSEE SOCCER CLUB OR INDEPENDENCE ===');
  const targetClubs = await prisma.clubs.findMany({
    where: {
      OR: [
        { name: { contains: 'Independence' } },
        { name: { contains: 'Tennessee Soccer' } },
        { name: { contains: 'TSC' } }
      ]
    }
  });
  console.log(JSON.stringify(targetClubs, null, 2));

  console.log('\n=== CURRENT CLUB STAFF SUMMARY ===');
  const allClubStaff = await prisma.club_staff.findMany({
    include: {
      people: true,
      clubs: true
    }
  });
  console.log(`Total club_staff entries: ${allClubStaff.length}`);
  for (const cs of allClubStaff) {
    console.log(`- [CS ID ${cs.id}] ${cs.people.first_name} ${cs.people.last_name} at ${cs.clubs.name}: role=${cs.role}, title=${cs.title}, access_level=${cs.access_level}, active=${cs.is_active}`);
  }

  await prisma.$disconnect();
}

inspectCorderoAndStaff().catch(console.error);
