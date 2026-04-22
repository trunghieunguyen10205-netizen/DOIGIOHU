const pool = require('../config/db');
const generateOrderCode = require('../utils/orderCode');

const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { table_id, total_amount, note, items } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Đơn hàng trống' });
    }

    await connection.beginTransaction();

    const orderCode = generateOrderCode();
    
    // Insert đơn hàng
    const [orderResult] = await connection.query(
      'INSERT INTO orders (order_code, table_id, total_amount, note, status) VALUES (?, ?, ?, ?, ?)',
      [orderCode, table_id || null, total_amount, note || '', 'pending']
    );

    const orderId = orderResult.insertId;

    // Insert chi tiết các món
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price_snapshot, options) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.price_snapshot, JSON.stringify(item.options || {})]
      );
    }

    await connection.commit();

    // Bắn socket tới nhân viên
    if (req.io) {
      req.io.to('staff_room').emit('order:new', {
        id: orderId,
        order_code: orderCode,
        table_id: table_id,
        status: 'pending',
        time: new Date()
      });
    }

    res.status(201).json({ 
      message: 'Đặt hàng thành công', 
      orderCode,
      orderId 
    });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  } finally {
    connection.release();
  }
};

const getOrderByCode = async (req, res) => {
  try {
    const { orderCode } = req.params;
    const [orders] = await pool.query('SELECT * FROM orders WHERE order_code = ?', [orderCode]);
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    const order = orders[0];
    const [items] = await pool.query(`
      SELECT oi.*, m.name, m.image 
      FROM order_items oi 
      JOIN menu_items m ON oi.menu_item_id = m.id 
      WHERE oi.order_id = ?
    `, [order.id]);

    order.items = items;
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    // Lấy các đơn hàng chưa hoàn tất (đang active tại quán)
    const [orders] = await pool.query('SELECT * FROM orders WHERE status != "completed" ORDER BY created_at ASC');
    
    // Trích xuất chi tiết order_items cho từng đơn
    for (let i = 0; i < orders.length; i++) {
      const [items] = await pool.query(`
        SELECT oi.*, m.name 
        FROM order_items oi 
        JOIN menu_items m ON oi.menu_item_id = m.id 
        WHERE oi.order_id = ?
      `, [orders[i].id]);
      
      // Parse cột options thành JSON
      orders[i].items = items.map(it => ({
        ...it,
        options: typeof it.options === 'string' ? JSON.parse(it.options) : it.options
      }));
    }

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chi tiết đơn' });
    }

    const order = orders[0];
    const [items] = await pool.query(`
      SELECT oi.*, m.name, m.image 
      FROM order_items oi 
      JOIN menu_items m ON oi.menu_item_id = m.id 
      WHERE oi.order_id = ?
    `, [id]);

    order.items = items;
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // pending, confirmed, preparing, ready, completed, cancelled

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (orders.length > 0) {
      const updatedOrder = orders[0];
      if (req.io) {
        req.io.to(`order_${updatedOrder.order_code}`).emit('order:status_change', { status });
        req.io.to('staff_room').emit('order:updated', updatedOrder);
        
        // Nếu hoàn tất đơn, báo cho Admin cập nhật doanh thu tức thì
        if (status === 'completed') {
          req.io.emit('revenue:update');
        }
      }
    }

    res.status(200).json({ message: 'Đã cập nhật trạng thái đơn' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const processPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { amount, payment_method } = req.body; // cash, transfer...

    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO payments (order_id, amount, payment_method, payment_status) VALUES (?, ?, ?, ?)',
      [id, amount, payment_method, 'completed']
    );

    // Có thể tự động update state đơn hàng thành completed luôn tuỳ nghiệp vụ
    await connection.query('UPDATE orders SET status = ? WHERE id = ?', ['completed', id]);

    await connection.commit();

    // Socket
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length > 0 && req.io) {
      req.io.to(`order_${orders[0].order_code}`).emit('order:status_change', { status: 'completed' });
      req.io.to('staff_room').emit('order:updated', orders[0]);
    }

    res.status(200).json({ message: 'Đã thanh toán thành công' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  createOrder,
  getOrderByCode,
  getOrders,
  getOrderById,
  updateOrderStatus,
  processPayment
};
