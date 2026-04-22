const express = require('express');
const { 
  createOrder, 
  getOrderByCode, 
  getOrders, 
  getOrderById, 
  updateOrderStatus, 
  processPayment 
} = require('../controllers/orderController');
const verifyToken = require('../middleware/auth');
const { requireStaffOrAdmin } = require('../middleware/role');

const router = express.Router();

// Khách hàng đặt món, theo dõi trạng thái
router.post('/orders', createOrder);
router.get('/orders/track/:orderCode', getOrderByCode);

// Dành cho nhân viên, admin (Tạm thời bỏ check Token để test cục bộ)
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/payment', processPayment);

module.exports = router;
