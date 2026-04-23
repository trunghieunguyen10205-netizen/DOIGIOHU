const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quan_nuoc',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Thêm SSL để chạy được trên Aiven/Cloud
  ssl: process.env.DB_HOST !== 'localhost' ? {
    rejectUnauthorized: false
  } : undefined
});

// Kiểm tra kết nối và tự động cập nhật schema (nếu thiếu cột)
pool.getConnection()
  .then(async (connection) => {
    console.log(`Đã kết nối thành công tới database MySQL tại: ${process.env.DB_HOST || 'localhost'}`);
    try {
      // Tự động thêm cột icon nếu chưa có
      const [cols] = await connection.query('SHOW COLUMNS FROM categories LIKE "icon"');
      if (cols.length === 0) {
        await connection.query('ALTER TABLE categories ADD COLUMN icon VARCHAR(50) DEFAULT "🧋"');
        console.log('✅ Đã thêm cột "icon" vào bảng categories.');
      }
    } catch (e) {
      console.log('Lưu ý khi tự động cập nhật schema:', e.message);
    }
    connection.release();
  })
  .catch(err => {
    console.error('Lỗi kết nối database:', err.message);
  });

module.exports = pool;
