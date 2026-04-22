-- ============================================================
--  QUÁN NƯỚC & ĐỒ ĂN - DATABASE SCHEMA
--  Tương thích MySQL 5.7+ / 8.0 (XAMPP)
--  Import: phpMyAdmin > Import > chọn file này
-- ============================================================

CREATE DATABASE IF NOT EXISTS quan_nuoc
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quan_nuoc;

-- ------------------------------------------------------------
-- 1. USERS - Tài khoản hệ thống (admin, nhân viên)
-- ------------------------------------------------------------
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(100)  NOT NULL,
  username    VARCHAR(50)   NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,              -- bcrypt hash
  role        ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  avatar      VARCHAR(255)  DEFAULT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. TABLES - Bàn trong quán (dùng để sinh QR)
-- ------------------------------------------------------------
CREATE TABLE tables (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  table_name  VARCHAR(50)   NOT NULL,              -- VD: "Bàn 1", "Bàn VIP 2"
  qr_code     VARCHAR(255)  DEFAULT NULL,          -- đường dẫn ảnh QR
  status      ENUM('available','occupied','reserved') NOT NULL DEFAULT 'available',
  capacity    INT           NOT NULL DEFAULT 4,    -- số chỗ ngồi
  note        VARCHAR(255)  DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. CATEGORIES - Danh mục món (Đồ uống, Đồ ăn, Tráng miệng…)
-- ------------------------------------------------------------
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  icon        VARCHAR(10)   DEFAULT '🍽️',          -- emoji icon
  sort_order  INT           NOT NULL DEFAULT 0,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. MENU_ITEMS - Món ăn / Thức uống
-- ------------------------------------------------------------
CREATE TABLE menu_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  category_id   INT           NOT NULL,
  name          VARCHAR(150)  NOT NULL,
  description   TEXT          DEFAULT NULL,
  price         DECIMAL(10,0) NOT NULL,             -- VND, không lẻ
  image         VARCHAR(255)  DEFAULT NULL,
  is_available  TINYINT(1)    NOT NULL DEFAULT 1,   -- còn bán không
  is_featured   TINYINT(1)    NOT NULL DEFAULT 0,   -- nổi bật / hot
  sort_order    INT           NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_item_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. ITEM_OPTIONS - Tuỳ chọn cho món (size, topping, đường, đá…)
-- ------------------------------------------------------------
CREATE TABLE item_options (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id  INT           NOT NULL,
  option_group  VARCHAR(100)  NOT NULL,             -- VD: "Size", "Đường", "Đá"
  option_name   VARCHAR(100)  NOT NULL,             -- VD: "M", "L", "XL", "Ít đường"
  extra_price   DECIMAL(10,0) NOT NULL DEFAULT 0,   -- giá cộng thêm
  is_default    TINYINT(1)    NOT NULL DEFAULT 0,
  CONSTRAINT fk_option_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. ORDERS - Đơn hàng
-- ------------------------------------------------------------
CREATE TABLE orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_code      VARCHAR(20)   NOT NULL UNIQUE,    -- VD: "ORD-20240421-0001"
  table_id        INT           DEFAULT NULL,        -- NULL nếu mang về
  customer_name   VARCHAR(100)  DEFAULT 'Khách',
  customer_note   TEXT          DEFAULT NULL,        -- ghi chú chung của đơn
  subtotal        DECIMAL(12,0) NOT NULL DEFAULT 0,
  discount        DECIMAL(12,0) NOT NULL DEFAULT 0,
  total           DECIMAL(12,0) NOT NULL DEFAULT 0,
  status          ENUM(
                    'pending',    -- vừa đặt, chờ nhân viên duyệt
                    'confirmed',  -- nhân viên đã nhận
                    'preparing',  -- đang pha chế / nấu
                    'ready',      -- xong, chờ mang ra
                    'completed',  -- đã phục vụ, đã thanh toán
                    'cancelled'   -- huỷ
                  ) NOT NULL DEFAULT 'pending',
  payment_method  ENUM('cash','transfer','momo','vnpay') DEFAULT NULL,
  payment_status  ENUM('unpaid','paid')  NOT NULL DEFAULT 'unpaid',
  served_by       INT           DEFAULT NULL,        -- user_id nhân viên phục vụ
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_table  FOREIGN KEY (table_id)  REFERENCES tables(id) ON DELETE SET NULL,
  CONSTRAINT fk_order_staff  FOREIGN KEY (served_by) REFERENCES users(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. ORDER_ITEMS - Chi tiết từng món trong đơn
-- ------------------------------------------------------------
CREATE TABLE order_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_id        INT           NOT NULL,
  menu_item_id    INT           NOT NULL,
  item_name       VARCHAR(150)  NOT NULL,            -- snapshot tên lúc đặt
  item_price      DECIMAL(10,0) NOT NULL,            -- snapshot giá lúc đặt
  quantity        INT           NOT NULL DEFAULT 1,
  options_detail  JSON          DEFAULT NULL,        -- {"Size":"L","Đường":"Ít","Đá":"Nhiều"}
  extra_price     DECIMAL(10,0) NOT NULL DEFAULT 0,  -- tổng giá option cộng thêm
  line_total      DECIMAL(12,0) NOT NULL DEFAULT 0,  -- (item_price + extra_price) * quantity
  note            VARCHAR(255)  DEFAULT NULL,        -- ghi chú riêng từng món
  status          ENUM('pending','preparing','done','cancelled') NOT NULL DEFAULT 'pending',
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
  CONSTRAINT fk_oi_item  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. PAYMENTS - Lịch sử thanh toán
-- ------------------------------------------------------------
CREATE TABLE payments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_id        INT           NOT NULL UNIQUE,
  amount          DECIMAL(12,0) NOT NULL,
  method          ENUM('cash','transfer','momo','vnpay') NOT NULL,
  transaction_ref VARCHAR(100)  DEFAULT NULL,        -- mã giao dịch ngân hàng / ví
  note            VARCHAR(255)  DEFAULT NULL,
  paid_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_by     INT           DEFAULT NULL,        -- nhân viên thu tiền
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id)    REFERENCES orders(id)  ON DELETE CASCADE,
  CONSTRAINT fk_pay_staff FOREIGN KEY (received_by) REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 9. DAILY_REPORTS - Báo cáo nhanh cuối ngày (cache)
-- ------------------------------------------------------------
CREATE TABLE daily_reports (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  report_date     DATE          NOT NULL UNIQUE,
  total_orders    INT           NOT NULL DEFAULT 0,
  completed_orders INT          NOT NULL DEFAULT 0,
  cancelled_orders INT          NOT NULL DEFAULT 0,
  gross_revenue   DECIMAL(14,0) NOT NULL DEFAULT 0,
  discount_total  DECIMAL(14,0) NOT NULL DEFAULT 0,
  net_revenue     DECIMAL(14,0) NOT NULL DEFAULT 0,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
--  SEED DATA - Dữ liệu mẫu
-- ============================================================

-- Admin mặc định  (password: admin123)
INSERT INTO users (full_name, username, password, role) VALUES
('Quản Lý', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'admin'),
('Nhân Viên A', 'nhanvien1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'staff'),
('Nhân Viên B', 'nhanvien2', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'staff');

-- Bàn
INSERT INTO tables (table_name, capacity, status) VALUES
('Bàn 1', 4, 'available'),
('Bàn 2', 4, 'available'),
('Bàn 3', 2, 'available'),
('Bàn 4', 6, 'available'),
('Bàn 5', 4, 'available'),
('Bàn VIP 1', 8, 'available'),
('Bàn VIP 2', 8, 'available'),
('Mang về', 1, 'available');

-- Danh mục
INSERT INTO categories (name, icon, sort_order) VALUES
('Cà Phê',      '☕', 1),
('Trà & Matcha','🍵', 2),
('Nước Ép',     '🥤', 3),
('Sinh Tố',     '🥭', 4),
('Đồ Ăn Vặt',  '🍟', 5),
('Bánh Mì',     '🥖', 6),
('Tráng Miệng', '🍮', 7);

-- Menu Items
INSERT INTO menu_items (category_id, name, description, price, is_featured) VALUES
-- Cà phê (cat 1)
(1, 'Bạc Xỉu',          'Cà phê sữa tươi đặc trưng',              35000, 1),
(1, 'Cà Phê Đen',       'Cà phê phin truyền thống',               25000, 0),
(1, 'Cà Phê Sữa',       'Cà phê phin + sữa đặc',                  30000, 1),
(1, 'Cappuccino',       'Espresso + foam sữa béo',                 55000, 0),
(1, 'Latte',            'Espresso + sữa tươi mịn',                 55000, 0),
(1, 'Cold Brew',        'Ủ lạnh 12h, vị đậm mượt',                 45000, 1),
-- Trà (cat 2)
(2, 'Trà Đào Cam Sả',  'Trà xanh + đào + cam + sả tươi',          45000, 1),
(2, 'Matcha Latte',    'Bột matcha Nhật + sữa tươi',              55000, 1),
(2, 'Trà Sữa Truyền Thống', 'Trà đen + sữa đặc + trân châu',      40000, 0),
(2, 'Hồng Trà Sữa',   'Hồng trà + sữa tươi kem',                 45000, 0),
-- Nước ép (cat 3)
(3, 'Nước Ép Cam',      'Cam tươi ép lạnh',                        35000, 0),
(3, 'Nước Ép Dưa Hấu', 'Dưa hấu tươi không đường',               30000, 0),
(3, 'Nước Ép Táo Gừng','Táo xanh + gừng tươi',                   40000, 1),
-- Sinh tố (cat 4)
(4, 'Sinh Tố Xoài',    'Xoài cát + sữa tươi',                     45000, 1),
(4, 'Sinh Tố Bơ',      'Bơ chín + sữa đặc + đá',                  50000, 1),
(4, 'Sinh Tố Dâu',     'Dâu tươi + yogurt',                       50000, 0),
-- Đồ ăn vặt (cat 5)
(5, 'Khoai Tây Chiên', 'Khoai tây vàng giòn + tương ớt',          35000, 1),
(5, 'Gà Chiên Giòn',   '3 miếng gà không xương chiên giòn',       55000, 1),
(5, 'Xúc Xích Nướng',  '3 cây xúc xích + mù tạt',                 40000, 0),
(5, 'Phô Mai Que',     '6 que phô mai chiên xù',                  40000, 1),
-- Bánh mì (cat 6)
(6, 'Bánh Mì Thịt Nguội','Bánh mì giòn + pate + chả lụa',         25000, 0),
(6, 'Bánh Mì Gà Sốt', 'Bánh mì + gà xé + sốt mayo',              35000, 1),
(6, 'Bánh Mì Bơ Tỏi',  'Bánh mì nướng bơ tỏi + phô mai',         30000, 0),
-- Tráng miệng (cat 7)
(7, 'Bánh Flan',        'Flan mềm + caramel',                      30000, 0),
(7, 'Chè Thái',         'Thập cẩm dừa + nước cốt dừa',            35000, 1),
(7, 'Sương Sáo Đen',    'Sương sáo + đường thốt nốt + đá',        25000, 0);

-- Tuỳ chọn cho Đồ uống (size)
INSERT INTO item_options (menu_item_id, option_group, option_name, extra_price, is_default) VALUES
-- Bạc Xỉu (id=1)
(1,'Size','M - 350ml', 0, 1),(1,'Size','L - 500ml', 5000, 0),(1,'Size','XL - 700ml', 10000, 0),
(1,'Đường','Ít đường', 0, 0),(1,'Đường','Bình thường', 0, 1),(1,'Đường','Nhiều đường', 0, 0),
(1,'Đá','Ít đá', 0, 0),(1,'Đá','Bình thường', 0, 1),(1,'Đá','Nhiều đá', 0, 0),
-- Cà Phê Sữa (id=3)
(3,'Size','M', 0, 1),(3,'Size','L', 5000, 0),
(3,'Đường','Ít đường', 0, 0),(3,'Đường','Bình thường', 0, 1),
(3,'Đá','Không đá', 0, 0),(3,'Đá','Ít đá', 0, 0),(3,'Đá','Bình thường', 0, 1),
-- Trà Đào (id=7)
(7,'Size','M', 0, 1),(7,'Size','L', 5000, 0),(7,'Size','XL', 10000, 0),
(7,'Đường','30%', 0, 0),(7,'Đường','50%', 0, 0),(7,'Đường','70%', 0, 1),(7,'Đường','100%', 0, 0),
(7,'Đá','Không đá', 0, 0),(7,'Đá','Ít đá', 0, 0),(7,'Đá','Bình thường', 0, 1),
(7,'Topping','Thêm trân châu đen', 10000, 0),(7,'Topping','Thêm thạch lá dứa', 10000, 0),
-- Matcha Latte (id=8)
(8,'Size','M', 0, 1),(8,'Size','L', 5000, 0),
(8,'Đường','Không đường', 0, 0),(8,'Đường','Ít đường', 0, 1),(8,'Đường','Bình thường', 0, 0),
(8,'Đá','Không đá', 0, 0),(8,'Đá','Bình thường', 0, 1),
-- Sinh Tố Bơ (id=15)
(15,'Đường','Ít đường', 0, 0),(15,'Đường','Bình thường', 0, 1),(15,'Đường','Nhiều đường', 0, 0),
-- Khoai Tây Chiên (id=17)
(17,'Size','Nhỏ', 0, 1),(17,'Size','Vừa', 10000, 0),(17,'Size','Lớn', 20000, 0),
(17,'Sốt','Tương ớt', 0, 1),(17,'Sốt','Mayonnaise', 0, 0),(17,'Sốt','Cả hai', 0, 0);

-- ============================================================
--  INDEXES - Tối ưu truy vấn
-- ============================================================
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_table       ON orders(table_id);
CREATE INDEX idx_orders_created     ON orders(created_at);
CREATE INDEX idx_order_items_order  ON order_items(order_id);
CREATE INDEX idx_menu_category      ON menu_items(category_id);
CREATE INDEX idx_menu_available     ON menu_items(is_available);

-- ============================================================
--  VIEW - Tổng quan đơn hàng (tiện báo cáo)
-- ============================================================
CREATE VIEW v_order_summary AS
SELECT
  o.id,
  o.order_code,
  t.table_name,
  o.customer_name,
  o.status,
  o.payment_status,
  o.total,
  o.created_at,
  COUNT(oi.id)  AS item_count,
  u.full_name   AS staff_name
FROM orders o
LEFT JOIN tables      t  ON o.table_id  = t.id
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN users       u  ON o.served_by = u.id
GROUP BY o.id;
