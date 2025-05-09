const express = require('express');
const {
    placeOrder,
    getUserOrders,
    getAllOrders,
    getUserOrder,
    cancelOrderByAdmin,
    updateOrderStatusByAdmin,
    getCancelledOrders,
    updatePaymentStatusByAdmin,
    getOrderById,
 } = require('../controller/orderController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/place', authMiddleware, placeOrder);
router.get('/user-orders', authMiddleware, getUserOrders);
router.get('/order/:orderId', authMiddleware, getUserOrder);
router.get('/order/:orderId', authMiddleware, getOrderById);
router.get('/all', authMiddleware, isAdmin, getAllOrders);
router.patch('/cancel/:id', authMiddleware, isAdmin, cancelOrderByAdmin);
router.put('/:id/status', authMiddleware, isAdmin, updateOrderStatusByAdmin);
router.put('/payment-status/:id', authMiddleware, isAdmin, updatePaymentStatusByAdmin);
router.get('/cancel', authMiddleware, isAdmin, getCancelledOrders);

module.exports = router;
