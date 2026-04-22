const express = require('express');
const { 
  getTables, 
  getTableById, 
  getTableQr 
} = require('../controllers/tableController');

const router = express.Router();

// Public routes (cho khách hàng quét QR)
router.get('/tables', getTables);
router.get('/tables/:id', getTableById);
router.get('/tables/:id/qr', getTableQr);

// Các route Admin quản lý bàn sẽ thêm sau...
// router.post('/admin/tables', verifyToken, requireAdmin, createTable);

module.exports = router;
