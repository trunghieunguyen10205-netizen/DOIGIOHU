const express = require('express');
const { getDailyReport, getRangeReport, getTopItems, getSummaryReport } = require('../controllers/reportController');
const verifyToken = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

const router = express.Router();

router.get('/reports/daily', verifyToken, requireAdmin, getDailyReport);
router.get('/reports/range', verifyToken, requireAdmin, getRangeReport);
router.get('/reports/top-items', verifyToken, requireAdmin, getTopItems);
router.get('/reports/summary', verifyToken, requireAdmin, getSummaryReport);

module.exports = router;
