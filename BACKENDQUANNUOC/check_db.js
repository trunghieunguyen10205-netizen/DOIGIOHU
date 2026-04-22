const pool = require('./src/config/db');

async function checkSchema() {
  try {
    const [columns] = await pool.query('SHOW COLUMNS FROM menu_items');
    console.log('Columns in menu_items:', columns.map(c => c.Field));
    
    const [catColumns] = await pool.query('SHOW COLUMNS FROM categories');
    console.log('Columns in categories:', catColumns.map(c => c.Field));
    
    process.exit(0);
  } catch (err) {
    console.error('Schema Error Details:', err);
    process.exit(1);
  }
}

checkSchema();
