const mysql = require('mysql2/promise');

async function checkSchema() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'quan_nuoc'
    });
    const [columns] = await db.query('DESCRIBE users');
    console.log('Users table schema:', JSON.stringify(columns, null, 2));
    await db.end();
  } catch (err) {
    console.error('Database error:', err.message);
  }
}

checkSchema();
