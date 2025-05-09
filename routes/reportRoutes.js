const express = require('express');
const router = express.Router();
const {
    getSalesReport,
    getPopularProductsReport,
} = require('../controller/reportController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

router.get('/sales', authMiddleware, isAdmin, getSalesReport);
router.get('/popular', authMiddleware, isAdmin, getPopularProductsReport);

module.exports = router;
