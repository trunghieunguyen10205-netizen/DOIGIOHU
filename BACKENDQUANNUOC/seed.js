const pool = require('./src/config/db');

async function seed() {
  try {
    console.log('Bắt đầu chèn dữ liệu mẫu...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');

    await pool.query(`
      INSERT IGNORE INTO categories (id, name, icon) VALUES 
      (1, 'Cà Phê', '☕'),
      (2, 'Trà Trái Cây', '🍹'),
      (3, 'Đồ Ăn Vặt', '🍟'),
      (4, 'Bánh Mì', '🥪')
    `);

    await pool.query(`
      INSERT IGNORE INTO menu_items (id, category_id, name, description, price, is_available) VALUES 
      (1, 1, 'Cà Phê Sữa Đá', 'Truyền thống đậm đà', 25000, 1),
      (2, 1, 'Bạc Xỉu Sài Gòn', 'Nhiều sữa ngọt ngào', 30000, 1),
      (3, 2, 'Trà Đào Cam Sả', 'Mát lạnh sảng khoái', 35000, 1),
      (4, 2, 'Trà Vải Vỏ Mộc', 'Thơm nồng nàn', 35000, 1),
      (5, 3, 'Khô Gà Lá Chanh', 'Cay xé lưỡi', 30000, 1),
      (6, 3, 'Khoai Tây Chiên', 'Giòn tan kèm tương ớt', 25000, 1),
      (7, 4, 'Bánh Mì Thịt Nướng', 'Sốt chanh dây ngon tuyệt', 20000, 1),
      (8, 4, 'Bánh Mì Opla', 'Nóng giòn, cay cay', 15000, 1)
    `);

    await pool.query(`
      INSERT IGNORE INTO tables (id, table_name, qr_code, status) VALUES 
      (1, 'Bàn 1 (Sân Vườn)', 'QR_1', 'available'),
      (2, 'Bàn 2 (Phòng Máy Lạnh)', 'QR_2', 'available'),
      (3, 'Bàn 3 (Tầng 2)', 'QR_3', 'available')
    `);

    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Chèn dữ liệu siêu chuẩn thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi seed:', error);
    process.exit(1);
  }
}

seed();
