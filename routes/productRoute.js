const express = require('express');
const { createProduct, getaProduct, getAllProduct, updateProduct, deleteProduct, getProductImage  } = require('../controller/productCtrl');
const { isAdmin, authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, isAdmin, createProduct);
router.get('/:id', getaProduct);
router.get('/product-image/:id', getProductImage);
router.get('/', getAllProduct);
router.put('/:id', authMiddleware, isAdmin, updateProduct);
router.delete('/:id', authMiddleware, isAdmin, deleteProduct);



module.exports = router;