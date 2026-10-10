import prisma from '../src/lib/prisma';

async function checkPerson17AndCordero() {
  const p17 = await prisma.people.findUnique({
    where: { id: 17 },
    include: { users: true, club_staff: true, team_staff: true }
  });
  console.log('Person ID 17:', p17);

  const corderos = await prisma.people.findMany({
    where: {
      OR: [
        { last_name: { contains: 'Cordero' } },
        { first_name: { contains: 'Cordero' } }
      ]
    },
    include: { users: true, club_staff: true, team_staff: true }
  });
  console.log('All Cordero records in people:', corderos);

  await prisma.$disconnect();
}

checkPerson17AndCordero().catch(console.error);
