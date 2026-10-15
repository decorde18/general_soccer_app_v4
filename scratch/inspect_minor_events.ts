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

const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const me = parseSqlTuplesRobust(sql, 'minorEvents');
console.log('Minor events count:', me.length);
const types: Record<string, number> = {};
me.forEach(r => {
  const t = r[1] || 'unknown';
  types[t] = (types[t] || 0) + 1;
});
console.log('Minor event types:', types);
console.log('First 5 rows:');
console.log(me.slice(0, 5));
