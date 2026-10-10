import prisma from '../src/lib/prisma';

async function verifyPerson17() {
  const p17 = await prisma.people.findUnique({
    where: { id: 17 }
  });

  console.log('=== VERIFYING PERSON ID 17 IN DATABASE ===');
  console.log(`Name: ${p17?.first_name} ${p17?.last_name}`);
  console.log(`Primary Email: ${p17?.email}`);
  console.log(`Alternate Emails: ${JSON.stringify(p17?.alternate_emails)}`);

  await prisma.$disconnect();
}

verifyPerson17().catch(console.error);
