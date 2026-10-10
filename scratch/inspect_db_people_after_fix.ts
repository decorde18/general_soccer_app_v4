import prisma from '../src/lib/prisma';

async function verifyPeopleFix() {
  const people = await prisma.people.findMany({
    take: 25,
    orderBy: { id: 'desc' }
  });

  console.log('=== VERIFYING FIXED PEOPLE RECORDS IN DATABASE ===');
  for (const p of people) {
    console.log(`[ID ${p.id}] ${p.first_name} ${p.last_name}:`);
    console.log(`  - Title: ${p.title}`);
    console.log(`  - Nickname: ${p.nickname}`);
    console.log(`  - Email: ${p.email}`);
    console.log(`  - Phone: ${p.phone}`);
    console.log(`  - Gender: ${p.gender}`);
    console.log(`  - DOB: ${p.birth_date ? p.birth_date.toISOString().split('T')[0] : null}`);
  }

  await prisma.$disconnect();
}

verifyPeopleFix().catch(console.error);
