import fs from 'fs';
import path from 'path';

const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('=== SEARCHING LEGACY SQL FOR EMAIL / ALTERNATE COLUMNS ===');

const insertHeaders = [...sql.matchAll(/INSERT INTO [`"']?(\w+)[`"']?\s*\((.*?)\)\s*VALUES/gi)];

for (const match of insertHeaders) {
  const table = match[1];
  const columns = match[2].split(',').map(c => c.replace(/[`"'\s]/g, ''));
  const emailCols = columns.filter(c => /email|mail/i.test(c));
  if (emailCols.length > 0) {
    console.log(`Table "${table}": found email columns -> ${emailCols.join(', ')}`);
  }
}

console.log('\n=== CHECKING IF ANY EMAIL VALUES CONTAIN MULTIPLE EMAILS (COMMAS/SEMICOLONS/SPACES) ===');
const peopleTuples = [...sql.matchAll(/INSERT INTO [`"']?people[`"']?\s*\((.*?)\)\s*VALUES\s*([\s\S]*?);/gi)];
if (peopleTuples.length > 0) {
  const valuesStr = peopleTuples[0][2];
  // Regex to find strings with multiple @ symbols or commas inside email column
  const multiEmails = valuesStr.match(/['"][^'"]*@[^'"]*[,; ][^'"]*@[^'"]*['"]/g);
  if (multiEmails) {
    console.log('Found legacy tuples with multiple emails:', multiEmails);
  } else {
    console.log('No multi-email values found in legacy people email column.');
  }
}
