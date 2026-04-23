const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Cấu hình Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép tất cả để dễ dàng deploy, bạn có thể siết lại sau
    methods: ["GET", "POST", "PUT", "DELETE"],
  }
});

// Middleware
app.use(cors({
  origin: true, // Tự động chấp nhận origin của request (CORS linh hoạt)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Inject io vào request (để các controller có thể sử dụng)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Import cơ sở dữ liệu để test kết nối (tùy chọn)
const pool = require('./src/config/db');

const authRoutes = require('./src/routes/auth');
const menuRoutes = require('./src/routes/menu');
const tableRoutes = require('./src/routes/tables');
const userRoutes = require('./src/routes/users');
const orderRoutes = require('./src/routes/orders');
const reportRoutes = require('./src/routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api', menuRoutes);
app.use('/api', tableRoutes);
app.use('/api/users', userRoutes);
app.use('/api', orderRoutes);
app.use('/api', reportRoutes);

// API cơ bản
app.get('/', (req, res) => {
  res.send('API Quán Nước Server Đang Chạy!');
});

// Setup socket io
const socketHandler = require('./src/socket');
socketHandler(io);

// Seed Admin User if none exists
const bcrypt = require('bcrypt');
async function seedAdmin() {
  try {
    const usersToSeed = [
      { u: 'admin', p: '123', f: 'Quản Trị Viên', r: 'admin' },
      { u: 'nhanvien', p: '123', f: 'Nhân Viên Mẫu', r: 'staff' },
      { u: 'quanly', p: 'admin', f: 'Quản Lý Mẫu', r: 'admin' }
    ];

    for (const user of usersToSeed) {
      const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [user.u]);
      const hashed = await bcrypt.hash(user.p, 10);
      
      if (exists.length === 0) {
        await pool.query(
          'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
          [user.u, hashed, user.f, user.r]
        );
        console.log(`>>> Đã khởi tạo tài khoản: ${user.u} / ${user.p}`);
      } else {
        // Force reset password for these default accounts to ensure user can login
        await pool.query('UPDATE users SET password = ?, role = ? WHERE username = ?', [hashed, user.r, user.u]);
        console.log(`>>> Đã cập nhật lại mật khẩu cho: ${user.u} / ${user.p}`);
      }
    }
  } catch (e) {
    console.error('Lỗi seed admin:', e.message);
  }
}
seedAdmin();

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server chạy tại: http://localhost:${PORT}`);

  // Keep-alive: Tự ping mỗi 4 phút để Render không 'ngủ'
  const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  setInterval(() => {
    const https = SELF_URL.startsWith('https') ? require('https') : require('http');
    https.get(SELF_URL, (res) => {
      console.log(`[Keep-alive] Ping ✅ - Status: ${res.statusCode}`);
    }).on('error', (e) => {
      console.log(`[Keep-alive] Ping lỗi: ${e.message}`);
    });
  }, 4 * 60 * 1000); // Mỗi 4 phút
});
