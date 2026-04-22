const express = require('express');
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// Tất cả các route này yêu cầu quyền quản lý (hoặc ít nhất là đăng nhập)
router.get('/', verifyToken, getAllUsers);
router.post('/', verifyToken, createUser);
router.put('/:id', verifyToken, updateUser);
router.delete('/:id', verifyToken, deleteUser);

module.exports = router;
