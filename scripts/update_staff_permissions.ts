import prisma from '../src/lib/prisma';

export async function updateStaffPermissions() {
  console.log('=== UPDATING STAFF PERMISSIONS & ACTIVATION STATES ===\n');

  // 1. Deactivate all imported legacy club staff for Independence High School
  const deactivated = await prisma.club_staff.updateMany({
    where: {
      club_id: 25,
      person_id: { not: 17 }
    },
    data: {
      is_active: false
    }
  });
  console.log(`Deactivated ${deactivated.count} legacy club_staff entries for Independence High School (Club 25).`);

  // 2. Ensure David Cordero de Jesus (person_id 17) is active
  await prisma.people.update({
    where: { id: 17 },
    data: { is_active: true }
  });

  // 3. Upsert Club Staff Admin assignment for Independence High School (Club ID 25)
  const ihsStaff = await prisma.club_staff.upsert({
    where: {
      person_id_club_id_role: {
        person_id: 17,
        club_id: 25,
        role: 'club_admin'
      }
    },
    update: {
      title: 'Head Coach / Program Director',
      access_level: 'club_admin',
      is_active: true
    },
    create: {
      person_id: 17,
      club_id: 25,
      role: 'club_admin',
      title: 'Head Coach / Program Director',
      access_level: 'club_admin',
      is_active: true
    }
  });
  console.log(`- Active Club Staff Admin created/updated for Independence High School (CS ID ${ihsStaff.id})`);

  // 4. Upsert Club Staff Admin assignment for Tennessee Soccer Club (Club ID 1)
  const tscStaff = await prisma.club_staff.upsert({
    where: {
      person_id_club_id_role: {
        person_id: 17,
        club_id: 1,
        role: 'club_admin'
      }
    },
    update: {
      title: 'Staff Admin / Coach',
      access_level: 'club_admin',
      is_active: true
    },
    create: {
      person_id: 17,
      club_id: 1,
      role: 'club_admin',
      title: 'Staff Admin / Coach',
      access_level: 'club_admin',
      is_active: true
    }
  });
  console.log(`- Active Club Staff Admin created/updated for Tennessee Soccer Club (CS ID ${tscStaff.id})`);

  // 5. Ensure System Admin flag on users table for person_id 17
  const user = await prisma.users.findFirst({
    where: { person_id: 17 }
  });

  if (user) {
    await prisma.users.update({
      where: { id: user.id },
      data: { system_admin: true }
    });
    console.log(`- System Admin verified on User ID ${user.id} for Person ID 17.`);
  } else {
    console.log('- Warning: No user account currently linked to Person ID 17.');
  }

  console.log('\n=== STAFF PERMISSIONS UPDATE COMPLETE ===');
  await prisma.$disconnect();
}

updateStaffPermissions().catch(console.error);
