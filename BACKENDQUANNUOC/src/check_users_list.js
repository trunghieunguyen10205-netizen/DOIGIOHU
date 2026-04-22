const mysql = require('mysql2/promise');

async function checkUsers() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'quan_nuoc'
    });
    const [users] = await db.query('SELECT id, username, role, full_name FROM users');
    console.log('Current users in database:', JSON.stringify(users, null, 2));
    await db.end();
  } catch (err) {
    console.error('Database error:', err.message);
  }
}

checkUsers();
