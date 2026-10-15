import fs from 'fs';
import path from 'path';

function parseTupleFields(rawTuple: string): (string | null)[] {
  const fields: (string | null)[] = [];
  let current = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < rawTuple.length; i++) {
    const char = rawTuple[i];
    if (escape) {
      current += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      current += char;
      escape = true;
      continue;
    }
    if (char === "'" || char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString && char === ',') {
      const val = current.trim();
      fields.push(val.toUpperCase() === 'NULL' ? null : val);
      current = '';
      continue;
    }
    current += char;
  }
  const lastVal = current.trim();
  fields.push(lastVal.toUpperCase() === 'NULL' ? null : lastVal);
  return fields;
}

export function parseSqlTuplesRobust(sql: string, tableName: string): (string | null)[][] {
  const insertRegex = new RegExp(`INSERT INTO [\`"']?${tableName}[\`"']?\\s*(\\(.*?\\))?\\s*VALUES`, 'gi');
  const tuples: (string | null)[][] = [];

  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    const startIdx = match.index + match[0].length;
    let inString = false;
    let escape = false;
    let endIdx = -1;

    for (let i = startIdx; i < sql.length; i++) {
      const c = sql[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === "'" || c === '"') { inString = !inString; continue; }
      if (!inString && c === ';') {
        endIdx = i;
        break;
      }
    }

    if (endIdx === -1) endIdx = sql.length;

    const valuesBlock = sql.substring(startIdx, endIdx).trim();

    let parenDepth = 0;
    let tupleStart = -1;
    inString = false;
    escape = false;

    for (let i = 0; i < valuesBlock.length; i++) {
      const c = valuesBlock[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === "'" || c === '"') { inString = !inString; continue; }

      if (!inString) {
        if (c === '(') {
          if (parenDepth === 0) tupleStart = i + 1;
          parenDepth++;
        } else if (c === ')') {
          parenDepth--;
          if (parenDepth === 0 && tupleStart !== -1) {
            const rawTuple = valuesBlock.substring(tupleStart, i);
            tuples.push(parseTupleFields(rawTuple));
            tupleStart = -1;
          }
        }
      }
    }
  }

  return tuples;
}

function escapeSql(str: string | null): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

async function main() {
  console.log('=== MIGRATING PARENTS & PLAYER RELATIONSHIPS ===\n');

  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const legacyParents = parseSqlTuplesRobust(sql, 'parents');
  const legacyPlayerParents = parseSqlTuplesRobust(sql, 'playerParents');
  const legacyPlayers = parseSqlTuplesRobust(sql, 'players');
  const legacyPeople = parseSqlTuplesRobust(sql, 'people');

  console.log(`Parsed ${legacyParents.length} legacy parents, ${legacyPlayerParents.length} playerParents, ${legacyPlayers.length} players.`);

  // Map legacy player ID -> legacy person ID
  const playerToPerson = new Map<number, number>();
  legacyPlayers.forEach(p => {
    playerToPerson.set(Number(p[0]), Number(p[2]));
  });

  // Map legacy parent ID -> legacy person ID
  const parentToPerson = new Map<number, number>();
  legacyParents.forEach(p => {
    parentToPerson.set(Number(p[0]), Number(p[2]));
  });

  // People map for display
  const peopleMap = new Map<number, string>();
  legacyPeople.forEach(p => {
    peopleMap.set(Number(p[0]), `${p[3]} ${p[4]}`.trim());
  });

  const relationships: {
    playerId: number;
    relatedPersonId: number;
    relationship: string;
    createdAt: string;
    modifiedAt: string;
  }[] = [];

  const seen = new Set<string>();

  for (const pp of legacyPlayerParents) {
    const parentId = Number(pp[0]);
    const playerId = Number(pp[1]);
    const createdAt = pp[2] || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const modifiedAt = pp[3] || createdAt;

    const parentPersonId = parentToPerson.get(parentId);
    const playerPersonId = playerToPerson.get(playerId);

    if (!parentPersonId || !playerPersonId) continue;

    const key = `${playerPersonId}|${parentPersonId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    relationships.push({
      playerId: playerPersonId,
      relatedPersonId: parentPersonId,
      relationship: 'Parent',
      createdAt,
      modifiedAt
    });
  }

  console.log(`Prepared ${relationships.length} unique player_relationships records.`);

  // Write SQL script for direct execution
  const sqlOutPath = path.resolve(process.cwd(), 'scripts', 'import_player_relationships.sql');
  let sqlContent = `-- Auto-generated migration script for player_relationships\n`;
  sqlContent += `-- Source: u676616277_hs_original.sql (parents & playerParents)\n`;
  sqlContent += `-- Total records: ${relationships.length}\n\n`;
  sqlContent += `INSERT INTO player_relationships (player_id, related_person_id, relationship, created_at, modified_at)\nVALUES\n`;

  const valuesClauses = relationships.map(r => {
    return `  (${r.playerId}, ${r.relatedPersonId}, ${escapeSql(r.relationship)}, ${escapeSql(r.createdAt)}, ${escapeSql(r.modifiedAt)})`;
  });

  sqlContent += valuesClauses.join(',\n');
  sqlContent += `\nON DUPLICATE KEY UPDATE relationship = VALUES(relationship), modified_at = VALUES(modified_at);\n`;

  fs.writeFileSync(sqlOutPath, sqlContent, 'utf8');
  console.log(`Saved SQL migration file to: ${sqlOutPath}`);

  // Try Prisma insertion if DB reachable
  try {
    const prismaModule = await import('../src/lib/prisma');
    const prisma = prismaModule.default;
    console.log('Testing Prisma connection for direct insertion...');
    const count = await Promise.race([
      prisma.player_relationships.count(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2000))
    ]);
    console.log(`Current player_relationships in DB: ${count}. Inserting ${relationships.length} records...`);

    const data = relationships.map(r => ({
      player_id: r.playerId,
      related_person_id: r.relatedPersonId,
      relationship: 'Parent' as const,
      created_at: new Date(r.createdAt),
      modified_at: new Date(r.modifiedAt)
    }));

    for (let i = 0; i < data.length; i += 500) {
      await prisma.player_relationships.createMany({
        data: data.slice(i, i + 500),
        skipDuplicates: true
      });
    }
    console.log('Successfully inserted player_relationships via Prisma!');
    await prisma.$disconnect();
  } catch (err: any) {
    console.log(`Prisma direct execution skipped (${err.message}). SQL script is ready at ${sqlOutPath}`);
  }
}

if (process.argv[1] && process.argv[1].includes('migrate_parents_and_relationships')) {
  main().catch(console.error);
}
