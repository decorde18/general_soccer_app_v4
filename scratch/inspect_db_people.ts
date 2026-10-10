import prisma from '../src/lib/prisma';

async function inspectPeople() {
  const people = await prisma.people.findMany({
    take: 20,
    orderBy: { id: 'desc' }
  });

  console.log('=== SAMPLE IMPORTED PEOPLE RECORDS IN DATABASE ===');
  for (const p of people) {
    console.log({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      nickname: p.nickname,
      email: p.email,
      phone: p.phone,
      gender: p.gender,
      title: p.title
    });
  }

  await prisma.$disconnect();
}

inspectPeople().catch(console.error);
