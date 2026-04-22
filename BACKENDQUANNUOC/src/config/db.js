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

// Kiểm tra kết nối
pool.getConnection()
  .then(connection => {
    console.log(`Đã kết nối thành công tới database MySQL tại: ${process.env.DB_HOST || 'localhost'}`);
    connection.release();
  })
  .catch(err => {
    console.error('Lỗi kết nối database:', err.message);
  });

module.exports = pool;
