import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Verifying DB gender values and column definitions...");

  const teamsGender = await prisma.$queryRaw<any[]>`
    SELECT DISTINCT gender, COUNT(*) as count FROM teams GROUP BY gender;
  `;
  console.log("teams.gender counts:", teamsGender);

  const peopleGender = await prisma.$queryRaw<any[]>`
    SELECT DISTINCT gender, COUNT(*) as count FROM people GROUP BY gender;
  `;
  console.log("people.gender counts:", peopleGender);

  const nodeTypes = await prisma.$queryRaw<any[]>`
    SELECT DISTINCT name FROM league_nodes WHERE node_type = 'gender';
  `;
  console.log("league_nodes gender names:", nodeTypes);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
