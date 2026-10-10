import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';

export async function updatePersonEmails() {
  console.log('=== UPDATING PERSON ID 17 EMAILS & PARSING MULTI-EMAILS ===\n');

  // 1. Update Person ID 17 (David Cordero de Jesus)
  const p17 = await prisma.people.update({
    where: { id: 17 },
    data: {
      email: 'decorde@yahoo.com',
      alternate_emails: ['davidc3@wcs.edu', 'decordecoach@gmail.com']
    }
  });

  console.log(`Updated Person ID 17 (${p17.first_name} ${p17.last_name}):`);
  console.log(`  - Primary Email: ${p17.email}`);
  console.log(`  - Alternate Emails: ${JSON.stringify(p17.alternate_emails)}`);

  // 2. Parse legacy people dump for any entries with comma/semicolon separated emails
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  function parseSqlTuples(sql: string, tableName: string): (string | null)[][] {
    const regex = new RegExp(`INSERT INTO [\\\`"']?${tableName}[\\\`"']?\\s*(\\(.*?\\))?\\s*VALUES\\s*([\\s\\S]*?);`, 'gi');
    const matches = [...sql.matchAll(regex)];
    const tuples: (string | null)[][] = [];

    for (const match of matches) {
      const rawStr = match[2];
      let current = '';
      let inString = false;
      let escape = false;
      let depth = 0;

      for (let i = 0; i < rawStr.length; i++) {
        const char = rawStr[i];
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
          current += char;
          continue;
        }
        if (!inString) {
          if (char === '(') {
            depth++;
            if (depth === 1) {
              current = '';
              continue;
            }
          } else if (char === ')') {
            depth--;
            if (depth === 0) {
              tuples.push(parseTupleFields(current));
              current = '';
              continue;
            }
          }
        }
        if (depth > 0) {
          current += char;
        }
      }
    }

    return tuples;
  }

  function parseTupleFields(tupleStr: string): (string | null)[] {
    const fields: string[] = [];
    let field = '';
    let inStr = false;
    let esc = false;

    for (let i = 0; i < tupleStr.length; i++) {
      const c = tupleStr[i];
      if (esc) {
        field += c;
        esc = false;
        continue;
      }
      if (c === '\\') {
        esc = true;
        continue;
      }
      if (c === "'") {
        inStr = !inStr;
        continue;
      }
      if (c === ',' && !inStr) {
        fields.push(field.trim());
        field = '';
        continue;
      }
      field += c;
    }
    fields.push(field.trim());

    return fields.map(f => {
      if (f === 'NULL' || f === 'null') return null;
      return f;
    });
  }

  const legacyPeopleTuples = parseSqlTuples(sql, 'people');
  console.log(`\nScanning ${legacyPeopleTuples.length} legacy people entries for multi-email fields...`);

  let multiEmailCount = 0;
  for (const tuple of legacyPeopleTuples) {
    const firstName = (tuple[3] || '').trim();
    const lastName = (tuple[4] || '').trim();
    const rawEmailStr = (tuple[5] || '').trim();

    if (!firstName || !lastName || !rawEmailStr) continue;

    // Check for comma, semicolon, or space separated emails
    const emails = rawEmailStr.split(/[,;\s]+/).map(e => e.trim()).filter(e => e.includes('@'));
    if (emails.length > 1) {
      const primaryEmail = emails[0];
      const alternateEmails = emails.slice(1);

      const existingPerson = await prisma.people.findFirst({
        where: {
          first_name: { equals: firstName },
          last_name: { equals: lastName }
        }
      });

      if (existingPerson && existingPerson.id !== 17) {
        await prisma.people.update({
          where: { id: existingPerson.id },
          data: {
            email: primaryEmail,
            alternate_emails: alternateEmails
          }
        });
        multiEmailCount++;
        console.log(`- Updated ${firstName} ${lastName} (ID ${existingPerson.id}): primary="${primaryEmail}", alternates=${JSON.stringify(alternateEmails)}`);
      }
    }
  }

  console.log(`\nMulti-email migration finished. Processed ${multiEmailCount} records with alternate emails.`);
  await prisma.$disconnect();
}

updatePersonEmails().catch(console.error);
