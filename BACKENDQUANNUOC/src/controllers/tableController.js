const pool = require('../config/db');

const getTables = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tables');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM tables WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getTableQr = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM tables WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    // Đơn giản trả về link Frontend cần quét
    const targetUrl = `${clientUrl}/menu?table=${id}`;
    
    // Ở một hệ thống pro, ta sẽ dùng thư viện generate QR ra ảnh buffer (vd: QRCode.toDataURL)
    // Tạm thời mình trả về chuỗi text
    res.status(200).json({ qrUrl: targetUrl });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  getTables,
  getTableById,
  getTableQr
};
