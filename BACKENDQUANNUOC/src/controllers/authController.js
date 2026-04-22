const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp cả username và password' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    const user = users[0];
    
    // So sánh mật khẩu
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (e) {
      // Nếu user.password không phải là hash, so sánh trực tiếp (hỗ trợ dữ liệu cũ)
      isMatch = (password === user.password);
      
      // Nếu khớp mật khẩu cũ, tự động nâng cấp lên Bcrypt cho lần sau
      if (isMatch) {
        const hashed = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
      }
    }

    if (!isMatch) {
      // Một lần kiểm tra cuối cùng cho trường hợp bcrypt không ném lỗi nhưng không khớp và dữ liệu là plain text
      if (password === user.password) {
        isMatch = true;
        const hashed = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    console.log('>>> User found in DB:', user.username, 'Role:', user.role);

    // Tạo token
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role || 'staff', // Backup nếu DB trống role
      full_name: user.full_name
    };
    
    console.log('>>> Sending Payload:', payload);

    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'quan_nuoc_secret_2024',
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: payload
    });

  } catch (error) {
    console.error('Lỗi login:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const logout = (req, res) => {
  // Với JWT ở client-side, logout thực chất chỉ là xóa token ở client.
  // Nhưng ta cứ tạo API này cho chuẩn format yêu cầu.
  res.status(200).json({ message: 'Đăng xuất thành công' });
};

const me = async (req, res) => {
  try {
    // req.user được gán từ verifyToken middleware
    const [users] = await pool.query(
      'SELECT id, username, role, full_name, created_at FROM users WHERE id = ?', 
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    res.status(200).json({ user: users[0] });

  } catch (error) {
    console.error('Lỗi lấy thông tin cá nhân:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  login,
  logout,
  me
};
