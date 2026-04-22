const express = require('express');
const {
  getCategories,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} = require('../controllers/menuController');

const router = express.Router();

// ─── Public / Staff routes ──────────────────────────────────────────────────
router.get('/categories', getCategories);
router.get('/menu-items', getMenuItems);           // ?all=true để lấy cả món hết hàng
router.get('/menu-items/:id', getMenuItemById);

// ─── Manager/Admin CRUD routes ─────────────────────────────────────────────
router.post('/menu-items', createMenuItem);
router.put('/menu-items/:id', updateMenuItem);
router.delete('/menu-items/:id', deleteMenuItem);
router.patch('/menu-items/:id/toggle', toggleAvailability);

module.exports = router;
