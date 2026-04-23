const express = require('express');
const {
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
} = require('../controllers/menuController');

const router = express.Router();

// ─── Category CRUD routes ──────────────────────────────────────────────────
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// ─── Menu Items routes ─────────────────────────────────────────────────────
router.get('/menu-items', getMenuItems);
router.get('/menu-items/:id', getMenuItemById);
router.post('/menu-items', createMenuItem);
router.put('/menu-items/:id', updateMenuItem);
router.delete('/menu-items/:id', deleteMenuItem);
router.patch('/menu-items/:id/toggle', toggleAvailability);

module.exports = router;
