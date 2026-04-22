# 🧋 DỰ ÁN: WEB ORDER QUÁN NƯỚC & ĐỒ ĂN

## TỔNG QUAN
Build một hệ thống order đồ uống + đồ ăn cho quán nước (kiểu quán trà sữa/cà phê có bán thêm đồ ăn vặt). Khách hàng quét QR theo bàn để tự order, nhân viên nhận đơn realtime, admin quản lý toàn bộ.

---

## TECH STACK
- **Frontend**: ReactJS (Vite)
- **Backend**: Node.js + Express + Socket.io (realtime)
- **Database**: MySQL (chạy trên XAMPP localhost)
- **Auth**: JWT

---

## DATABASE (ĐÃ THIẾT KẾ XONG)

Có 9 bảng:

```
users           → tài khoản admin & nhân viên (role: admin | staff)
tables          → bàn trong quán, mỗi bàn có QR code
categories      → danh mục món (Cà Phê, Trà, Nước Ép, Sinh Tố, Đồ Ăn Vặt, Bánh Mì, Tráng Miệng)
menu_items      → món ăn / thức uống (tên, mô tả, giá, ảnh, is_available, is_featured)
item_options    → tuỳ chọn theo món (Size M/L/XL, Đường 30-100%, Đá, Topping...)
orders          → đơn hàng (status: pending → confirmed → preparing → ready → completed | cancelled)
order_items     → chi tiết từng món trong đơn (có snapshot giá, options dạng JSON)
payments        → lịch sử thanh toán (cash, transfer, momo, vnpay)
daily_reports   → cache báo cáo doanh thu ngày
```

Seed data có sẵn: 3 user, 8 bàn, 7 danh mục, 26 món, options size/đường/đá/topping.
Password mặc định tất cả user: `admin123` (đã bcrypt hash).

---

## CÁC ROLE & CHỨC NĂNG

### 🪑 KHÁCH HÀNG (không cần đăng nhập)
- Quét QR trên bàn → mở trang menu theo bàn đó
- Xem menu theo danh mục, lọc món, xem chi tiết
- Chọn tuỳ chọn (size, đường, đá, topping)
- Thêm vào giỏ hàng, chỉnh số lượng, ghi chú từng món
- Đặt hàng → nhận mã đơn → theo dõi trạng thái đơn realtime

### 👨‍🍳 NHÂN VIÊN (đăng nhập)
- Xem danh sách đơn mới realtime (Socket.io)
- Xác nhận đơn → bắt đầu pha chế → báo xong
- Cập nhật trạng thái từng món hoặc cả đơn
- Xem đơn theo bàn
- Thu tiền + chọn phương thức thanh toán

### 🔧 ADMIN (đăng nhập)
- Quản lý menu: thêm/sửa/xoá món, bật/tắt món, sắp xếp thứ tự
- Quản lý danh mục
- Quản lý bàn + sinh QR code
- Quản lý nhân viên (thêm/sửa/xoá tài khoản)
- Báo cáo doanh thu: theo ngày, tuần, tháng
- Xem lịch sử đơn hàng, lọc theo trạng thái/ngày/bàn

---

## API CẦN BUILD (Backend)

### Auth
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Menu (public)
```
GET /api/categories
GET /api/menu-items
GET /api/menu-items/:id
```

### Menu (admin)
```
POST   /api/admin/menu-items
PUT    /api/admin/menu-items/:id
DELETE /api/admin/menu-items/:id
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

### Bàn
```
GET  /api/tables
GET  /api/tables/:id
POST /api/admin/tables
PUT  /api/admin/tables/:id
GET  /api/tables/:id/qr          → trả về QR image
```

### Order (khách)
```
POST /api/orders                  → tạo đơn mới
GET  /api/orders/:orderCode       → theo dõi đơn theo mã
```

### Order (nhân viên/admin)
```
GET  /api/orders                  → danh sách đơn (filter status, date, table)
GET  /api/orders/:id
PUT  /api/orders/:id/status       → cập nhật trạng thái
PUT  /api/orders/:id/payment      → thu tiền
```

### Báo cáo (admin)
```
GET /api/reports/daily?date=
GET /api/reports/range?from=&to=
GET /api/reports/top-items?period=
```

### Socket.io Events
```
// Server emit
order:new           → có đơn mới (gửi tới nhân viên)
order:updated       → cập nhật trạng thái đơn
order:status_change → khách theo dõi đơn của mình

// Client emit
join:staff_room     → nhân viên join room
join:order_room     → khách join room theo orderCode
```

---

## CẤU TRÚC THƯ MỤC GỢI Ý

```
quan-nuoc/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            (mysql2 pool)
│   │   ├── middleware/
│   │   │   ├── auth.js          (verify JWT)
│   │   │   └── role.js          (admin only)
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── menu.js
│   │   │   ├── tables.js
│   │   │   ├── orders.js
│   │   │   └── reports.js
│   │   ├── controllers/         (logic xử lý)
│   │   ├── socket/
│   │   │   └── index.js         (socket.io handlers)
│   │   └── utils/
│   │       └── orderCode.js     (sinh mã ORD-YYYYMMDD-XXXX)
│   ├── uploads/                 (ảnh món ăn upload lên)
│   ├── .env
│   └── server.js
│
└── frontend/
    ├── customer/                (app cho khách - React)
    │   ├── src/
    │   │   ├── pages/
    │   │   │   ├── MenuPage.jsx
    │   │   │   ├── CartPage.jsx
    │   │   │   └── OrderTrackingPage.jsx
    │   │   └── components/
    └── staff/                   (app cho nhân viên & admin - React)
        ├── src/
        │   ├── pages/
        │   │   ├── LoginPage.jsx
        │   │   ├── OrdersPage.jsx   (nhân viên)
        │   │   ├── MenuManage.jsx   (admin)
        │   │   ├── TablesManage.jsx (admin)
        │   │   ├── Reports.jsx      (admin)
        │   │   └── StaffManage.jsx  (admin)
        │   └── components/
```

---

## ENV MẪU (backend/.env)

```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=quan_nuoc
JWT_SECRET=quan_nuoc_secret_2024
JWT_EXPIRES=8h
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
```

---

## YÊU CẦU QUAN TRỌNG

1. **Realtime**: Khi khách đặt đơn → nhân viên thấy ngay qua Socket.io (không cần refresh)
2. **QR theo bàn**: Link dạng `http://localhost:5173/menu?table=1` → khách không cần nhập gì
3. **Snapshot giá**: Khi lưu order_items phải lưu giá tại thời điểm đặt (tránh thay đổi giá ảnh hưởng đơn cũ)
4. **Tiền VND**: Không dùng float, dùng INT hoặc DECIMAL(10,0)
5. **Upload ảnh**: Multer, lưu vào thư mục `uploads/`, trả về URL
6. **CORS**: Cho phép từ localhost:5173 (React dev) và localhost:3000

---

## GHI CHÚ THÊM
- Quán chạy offline trên máy tính cá nhân (XAMPP localhost), không cần deploy cloud
- Khách dùng điện thoại quét QR → mở trình duyệt → order (không cần cài app)
- Nhân viên dùng máy tính bảng hoặc laptop tại quầy
- Admin dùng laptop

---

## YÊU CẦU BUILD

Hãy build **từng phần theo thứ tự**:
1. ✅ Database SQL (đã xong)
2. ⬜ Backend Node.js + Express (API + Socket.io)
3. ⬜ Frontend React - Giao diện khách đặt món (Customer App)
4. ⬜ Frontend React - Màn hình nhân viên nhận đơn (Staff App)
5. ⬜ Frontend React - Trang Admin quản lý

Bắt đầu từ **Backend** nhé.
