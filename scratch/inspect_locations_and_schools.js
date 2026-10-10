const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'u676616277_hs_original.sql');
const content = fs.readFileSync(sqlPath, 'utf8');

function extractInsertData(tableName) {
  const regex = new RegExp(`INSERT INTO \`${tableName}\` \\(([^)]+)\\) VALUES\\s*([\\s\\S]*?);`, 'g');
  let match;
  const records = [];

  while ((match = regex.exec(content)) !== null) {
    const columns = match[1].split(',').map(c => c.trim().replace(/`/g, ''));
    const rawValues = match[2];

    // Simple tuple parser
    const tupleRegex = /\(([\s\S]*?)\)(?:,|\s*$)/g;
    let tupleMatch;
    while ((tupleMatch = tupleRegex.exec(rawValues)) !== null) {
      const valStr = tupleMatch[1];
      // Split by comma ignoring inside quotes
      const values = [];
      let current = '';
      let inQuote = false;
      let quoteChar = '';

      for (let i = 0; i < valStr.length; i++) {
        const char = valStr[i];
        if ((char === "'" || char === '"') && (i === 0 || valStr[i - 1] !== '\\')) {
          if (!inQuote) {
            inQuote = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuote = false;
          } else {
            current += char;
          }
        } else if (char === ',' && !inQuote) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const obj = {};
      columns.forEach((col, idx) => {
        let val = values[idx] || null;
        if (val === 'NULL' || val === undefined) val = null;
        else if (val && val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        obj[col] = val;
      });
      records.push(obj);
    }
  }
  return records;
}

const addresses = extractInsertData('addresses');
const locations = extractInsertData('locations');
const schools = extractInsertData('schools');

console.log(`Extracted Addresses: ${addresses.length}`);
console.log(`Extracted Locations: ${locations.length}`);
console.log(`Extracted Schools: ${schools.length}`);

console.log('\nSample Addresses:', addresses.slice(0, 5));
console.log('\nSample Locations:', locations.slice(0, 5));
console.log('\nSample Schools:', schools.slice(0, 5));
