import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRaw<any[]>`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND (COLUMN_NAME LIKE '%gender%' OR COLUMN_NAME LIKE '%sex%');
  `;
  console.log("All tables/columns with gender or sex:", columns);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
