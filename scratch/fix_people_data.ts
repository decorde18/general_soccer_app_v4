import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { normalizeGender } from '../src/lib/utils/gender';

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

export async function fixPeopleData() {
  console.log('=== FAST BULK FIXING PEOPLE DATA WITH CORRECT COLUMNS ===');
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const legacyPeopleTuples = parseSqlTuples(sql, 'people');
  console.log(`Parsed ${legacyPeopleTuples.length} legacy people tuples.`);

  const existingPeople = await prisma.people.findMany();
  const peopleLookup = new Map<string, typeof existingPeople[0]>();

  existingPeople.forEach(p => {
    const key = `${p.first_name.trim().toLowerCase()}|${p.last_name.trim().toLowerCase()}`;
    peopleLookup.set(key, p);
  });

  const updateOps: any[] = [];
  const peopleToCreate: any[] = [];

  for (const tuple of legacyPeopleTuples) {
    const legacyId = Number(tuple[0]) || 0;
    const title = (tuple[2] || '').trim() || null;
    const firstName = (tuple[3] || '').trim();
    const lastName = (tuple[4] || '').trim();
    const email = (tuple[5] || '').trim() || null;
    const cellNumber = (tuple[6] || '').trim() || null;
    const otherLastName = (tuple[7] || '').trim() || null;
    const nickName = (tuple[8] || '').trim() || null;
    const rawDob = (tuple[10] || '').trim() || null;
    const rawGender = (tuple[11] || '').trim() || null;

    if (!legacyId || !firstName || !lastName) continue;

    let dob: Date | null = null;
    if (rawDob && rawDob !== '0000-00-00' && rawDob !== '0000-00-00 00:00:00') {
      const parsed = new Date(rawDob);
      if (!isNaN(parsed.getTime())) {
        dob = parsed;
      }
    }

    const gender = rawGender ? normalizeGender(rawGender) : null;
    const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}`;

    if (peopleLookup.has(key)) {
      const existing = peopleLookup.get(key)!;
      updateOps.push(
        prisma.people.update({
          where: { id: existing.id },
          data: {
            title: title,
            nickname: nickName,
            email: email,
            phone: cellNumber,
            other_last_name: otherLastName,
            birth_date: dob,
            gender: gender
          }
        })
      );
    } else {
      peopleToCreate.push({
        first_name: firstName,
        last_name: lastName,
        title: title,
        nickname: nickName,
        email: email,
        phone: cellNumber,
        other_last_name: otherLastName,
        birth_date: dob,
        gender: gender,
        is_active: true
      });
    }
  }

  if (peopleToCreate.length > 0) {
    console.log(`Creating ${peopleToCreate.length} missing people...`);
    await prisma.people.createMany({ data: peopleToCreate });
  }

  console.log(`Executing ${updateOps.length} update operations in chunks...`);
  const chunkSize = 50;
  for (let i = 0; i < updateOps.length; i += chunkSize) {
    const chunk = updateOps.slice(i, i + chunkSize);
    await prisma.$transaction(chunk);
    console.log(`Updated ${Math.min(i + chunkSize, updateOps.length)} / ${updateOps.length}`);
  }

  console.log('People cleanup finished successfully!');
  await prisma.$disconnect();
}

fixPeopleData().catch(console.error);
