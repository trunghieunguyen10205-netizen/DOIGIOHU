const pool = require('../config/db');

// ─── Lấy tất cả danh mục ───────────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY id');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ─── Tạo danh mục mới ──────────────────────────────────────────────
const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Thiếu tên danh mục' });
    // Thử INSERT với cột icon trước, fallback nếu cột chưa tồn tại
    let result;
    try {
      [result] = await pool.query(
        'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)',
        [name, description || null, icon || null]
      );
    } catch {
      [result] = await pool.query(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [name, description || null]
      );
    }
    const [newCat] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(newCat[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ─── Sửa danh mục ────────────────────────────────────────────────
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;
    // Thử UPDATE với icon trước, fallback nếu cột chưa tồn tại
    try {
      await pool.query('UPDATE categories SET name=?, description=?, icon=? WHERE id=?', [name, description || null, icon || null, id]);
    } catch {
      await pool.query('UPDATE categories SET name=?, description=? WHERE id=?', [name, description || null, id]);
    }
    const [updated] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (updated.length === 0) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.status(200).json(updated[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ─── Xóa danh mục ────────────────────────────────────────────────
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Kiểm tra có món thuộc danh mục này không
    const [items] = await pool.query('SELECT id FROM menu_items WHERE category_id = ?', [id]);
    if (items.length > 0) {
      return res.status(400).json({ message: `Không thể xóa: danh mục đang có ${items.length} món. Hãy chuyển hoặc xóa các món trước.` });
    }
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.status(200).json({ message: 'Đã xóa danh mục' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ─── Lấy món (public: chỉ available; admin: tất cả) ───────────────────────
const getMenuItems = async (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    const sql = showAll
      ? 'SELECT * FROM menu_items ORDER BY category_id, id'
      : 'SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category_id, id';
    const [rows] = await pool.query(sql);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ─── Lấy 1 món theo ID ─────────────────────────────────────────────────────
const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy món' });
    const [options] = await pool.query('SELECT * FROM item_options WHERE menu_item_id = ?', [id]);
    const menuItem = rows[0];
    menuItem.options = options;
    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ─── Tạo món mới ───────────────────────────────────────────────────────────
const createMenuItem = async (req, res) => {
  try {
    const { name, price, category_id, description, image } = req.body;
    if (!name || !price || !category_id) {
      return res.status(400).json({ message: 'Thiếu tên, giá, hoặc danh mục' });
    }
    const [result] = await pool.query(
      'INSERT INTO menu_items (name, price, category_id, description, image, is_available) VALUES (?, ?, ?, ?, ?, 1)',
      [name, price, category_id, description || null, image || null]
    );
    const [newItem] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
    res.status(201).json(newItem[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ─── Cập nhật món ──────────────────────────────────────────────────────────
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category_id, description, image } = req.body;
    await pool.query(
      'UPDATE menu_items SET name=?, price=?, category_id=?, description=?, image=? WHERE id=?',
      [name, price, category_id, description || null, image || null, id]
    );
    const [updated] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (updated.length === 0) return res.status(404).json({ message: 'Không tìm thấy món' });
    res.status(200).json(updated[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ─── Xóa món ───────────────────────────────────────────────────────────────
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM menu_items WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Không tìm thấy món' });
    await pool.query('DELETE FROM menu_items WHERE id = ?', [id]);
    res.status(200).json({ message: 'Đã xóa món thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ─── Toggle hết hàng / còn hàng ────────────────────────────────────────────
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id, is_available FROM menu_items WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Không tìm thấy món' });
    const newVal = existing[0].is_available ? 0 : 1;
    await pool.query('UPDATE menu_items SET is_available = ? WHERE id = ?', [newVal, id]);
    const [updated] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    res.status(200).json(updated[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
};
