import prisma from '../src/lib/prisma';

async function verifyClubStaff() {
  const staff = await prisma.club_staff.findMany({
    include: {
      people: true,
      clubs: true
    },
    orderBy: { id: 'asc' }
  });

  console.log(`=== ALL ${staff.length} CLUB STAFF RECORDS IN DATABASE ===\n`);
  for (const cs of staff) {
    console.log(`[CS ID ${cs.id}] ${cs.people.first_name} ${cs.people.last_name} (Person ID ${cs.person_id}) at "${cs.clubs.name}" (Club ID ${cs.club_id}):`);
    console.log(`  - Role: ${cs.role}`);
    console.log(`  - Title: ${cs.title}`);
    console.log(`  - Access Level: ${cs.access_level}`);
    console.log(`  - Is Active: ${cs.is_active}`);
    console.log('');
  }

  const user17 = await prisma.users.findFirst({ where: { person_id: 17 } });
  console.log('=== USER RECORD FOR PERSON ID 17 ===');
  console.log(user17);

  await prisma.$disconnect();
}

verifyClubStaff().catch(console.error);
