import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Migrating database gender columns and values to MALE / FEMALE / MIXED...");

  // 1. Modify people.gender column to VARCHAR(10)
  console.log("Modifying people.gender column length...");
  await prisma.$executeRawUnsafe(`ALTER TABLE people MODIFY COLUMN gender VARCHAR(10) NULL;`);

  // 2. Update people.gender values
  console.log("Updating people.gender records...");
  await prisma.$executeRawUnsafe(`UPDATE people SET gender = 'FEMALE' WHERE gender IN ('F', 'f', 'Girls', 'girls', 'Women', 'women');`);
  await prisma.$executeRawUnsafe(`UPDATE people SET gender = 'MALE' WHERE gender IN ('M', 'm', 'Boys', 'boys', 'Men', 'men');`);
  await prisma.$executeRawUnsafe(`UPDATE people SET gender = 'MIXED' WHERE gender IN ('Coed', 'coed', 'Mixed', 'mixed');`);

  // 3. Temporarily expand teams.gender enum to include new values
  console.log("Expanding teams.gender enum values...");
  await prisma.$executeRawUnsafe(`ALTER TABLE teams MODIFY COLUMN gender ENUM('Men', 'Women', 'Mixed', 'MALE', 'FEMALE', 'MIXED') NOT NULL;`);

  // 4. Update teams.gender values
  console.log("Updating teams.gender records...");
  await prisma.$executeRawUnsafe(`UPDATE teams SET gender = 'MALE' WHERE gender = 'Men';`);
  await prisma.$executeRawUnsafe(`UPDATE teams SET gender = 'FEMALE' WHERE gender = 'Women';`);
  await prisma.$executeRawUnsafe(`UPDATE teams SET gender = 'MIXED' WHERE gender = 'Mixed';`);

  // 5. Restrict teams.gender enum to MALE, FEMALE, MIXED
  console.log("Restricting teams.gender enum to MALE, FEMALE, MIXED...");
  await prisma.$executeRawUnsafe(`ALTER TABLE teams MODIFY COLUMN gender ENUM('MALE', 'FEMALE', 'MIXED') NOT NULL;`);

  // 6. Update league_nodes where node_type = 'gender'
  console.log("Updating league_nodes gender node names...");
  await prisma.$executeRawUnsafe(`UPDATE league_nodes SET name = 'FEMALE' WHERE node_type = 'gender' AND LOWER(name) IN ('girls', 'female', 'women');`);
  await prisma.$executeRawUnsafe(`UPDATE league_nodes SET name = 'MALE' WHERE node_type = 'gender' AND LOWER(name) IN ('boys', 'male', 'men');`);
  await prisma.$executeRawUnsafe(`UPDATE league_nodes SET name = 'MIXED' WHERE node_type = 'gender' AND LOWER(name) IN ('coed', 'mixed');`);

  console.log("Migration finished successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
