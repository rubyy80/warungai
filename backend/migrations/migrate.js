const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, '001_init_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running database migration...');
    await db.query(sql);
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

