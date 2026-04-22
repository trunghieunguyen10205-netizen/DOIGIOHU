const pool = require('../config/db');

const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query; // format: YYYY-MM-DD
    if (!date) return res.status(400).json({ message: 'Thiếu tham số date' });

    const [rows] = await pool.query(`
      SELECT COUNT(id) as total_orders, SUM(total_amount) as total_revenue
      FROM orders 
      WHERE DATE(created_at) = ? AND status = 'completed'
    `, [date]);

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getRangeReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: 'Thiếu tham số date range' });

    const [rows] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(id) as total_orders, SUM(total_amount) as total_revenue
      FROM orders 
      WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `, [from, to]);

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getTopItems = async (req, res) => {
  try {
    const { period } = req.query; // maybe not strictly used right now, simplified
    const [rows] = await pool.query(`
      SELECT m.name, SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      GROUP BY m.id
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getSummaryReport = async (req, res) => {
  try {
    const [[day]] = await pool.query(`SELECT SUM(total_amount) as revenue FROM orders WHERE DATE(created_at) = CURDATE() AND status = 'completed'`);
    const [[month]] = await pool.query(`SELECT SUM(total_amount) as revenue FROM orders WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND status = 'completed'`);
    const [[year]] = await pool.query(`SELECT SUM(total_amount) as revenue FROM orders WHERE YEAR(created_at) = YEAR(CURDATE()) AND status = 'completed'`);

    res.status(200).json({
      day: day.revenue || 0,
      month: month.revenue || 0,
      year: year.revenue || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  getDailyReport,
  getRangeReport,
  getTopItems,
  getSummaryReport
};
