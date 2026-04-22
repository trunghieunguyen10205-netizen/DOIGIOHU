const pool = require('../config/db');
const bcrypt = require('bcrypt');

const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, role, full_name, created_at FROM users ORDER BY created_at DESC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Lỗi lấy danh sách nhân viên:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;
    
    if (!username || !password || !full_name) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Kiểm tra trùng username
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, full_name, role || 'staff']
    );

    res.status(201).json({ id: result.insertId, message: 'Thêm nhân viên thành công' });
  } catch (error) {
    console.error('Lỗi tạo nhân viên:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, password } = req.body;

    let query = 'UPDATE users SET full_name = ?, role = ?';
    let params = [full_name, role];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);
    res.status(200).json({ message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật nhân viên:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ngăn chặn việc tự xóa chính mình nếu cần, nhưng tạm thời cứ để admin xóa
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ message: 'Xóa thành công' });
  } catch (error) {
    console.error('Lỗi xóa nhân viên:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
