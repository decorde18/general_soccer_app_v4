const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'u676616277_hs_original.sql');
const content = fs.readFileSync(sqlPath, 'utf8');

const tableRegex = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\) ENGINE=/g;
let match;

console.log("=== ORIGINAL DATABASE TABLES AND COLUMNS ===");

while ((match = tableRegex.exec(content)) !== null) {
  const tableName = match[1];
  const tableBody = match[2];
  
  const columns = [];
  const lines = tableBody.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('`')) {
      const colMatch = trimmed.match(/^`([^`]+)`\s+([^\s,]+)/);
      if (colMatch) {
        columns.push(`${colMatch[1]} (${colMatch[2]})`);
      }
    }
  }
  
  console.log(`\nTable: [${tableName}] (${columns.length} columns)`);
  columns.forEach(col => console.log(`  - ${col}`));
}
