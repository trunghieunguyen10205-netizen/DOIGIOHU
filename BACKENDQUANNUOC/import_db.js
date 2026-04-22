const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function importDatabase() {
    console.log('🚀 Bắt đầu quá trình nhập dữ liệu vào Aiven...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true, // Quan trọng để chạy file SQL
        ssl: { rejectUnauthorized: false }
    });

    try {
        const sqlPath = path.join(__dirname, '..', 'quan_nuoc.sql');
        console.log('--- Đang đọc file:', sqlPath);
        
        if (!fs.existsSync(sqlPath)) {
            console.error('❌ Lỗi: Không tìm thấy file quan_nuoc.sql ở thư mục gốc!');
            return;
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('--- Đang thực thi các câu lệnh SQL (Vui lòng đợi)...');
        await connection.query(sql);

        console.log('✅ THÀNH CÔNG! Dữ liệu đã được nhập đầy đủ vào Aiven.');
        console.log('Bây giờ bạn có thể truy cập website và đăng nhập bình thường.');

    } catch (error) {
        console.error('❌ Lỗi trong quá trình nhập dữ liệu:', error.message);
    } finally {
        await connection.end();
    }
}

importDatabase();
