const express = require("express");
const {
    createUser,
    loginUserCtrl,
    getallUser,
    getaUser,
    deleteaUser,
    updatedUser,
    blockUser,
    unblockUser,
    handleRefreshToken,
    logout,
    updatePassword,
    forgotPasswordToken,
    resetPassword,
    getUser,
    updateProfile,
    addToCart,
    getCart,
    removeFromCart,
    clearCart,
    placeOrder, 
    getUserOrders,
    getInvoiceUser,
} = require("../controller/UserCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const UserCtrl = require('../controller/UserCtrl'); // Adjust the path as needed
const router = express.Router();

router.post("/register", createUser);
router.post("/forgot-password-token",forgotPasswordToken);
router.put("/reset-password/:token",resetPassword);

router.put("/password",authMiddleware, updatePassword);
router.post("/login", loginUserCtrl);
router.post("/cart", authMiddleware, addToCart);
router.get("/cart", authMiddleware, getCart);
router.get('/orders/my', authMiddleware, getInvoiceUser); 
router.delete("/cart/remove/:productId", authMiddleware, removeFromCart);
router.delete("/cart/clear", authMiddleware, clearCart);
// router.post('/order', authMiddleware, placeOrder);
// router.get('/orders', authMiddleware, getUserOrders);
// In userRoutes.js
router.post('/order', authMiddleware, UserCtrl.placeOrder);
router.get('/orders', authMiddleware, UserCtrl.getUserOrders);


router.get('/admin/all-users', getallUser);
router.get('/refresh', handleRefreshToken);
router.get('/me', authMiddleware, getUser);
router.put('/update-profile', authMiddleware, updateProfile);
router.post('/logout', logout);
router.get('/:id', authMiddleware, isAdmin, getaUser);
router.delete('/:id', deleteaUser);

router.put('/edit-user', authMiddleware, updatedUser);
router.put('/block-user/:id', authMiddleware, isAdmin, blockUser);
router.put('/unblock-user/:id', authMiddleware, isAdmin, unblockUser);



module.exports = router;