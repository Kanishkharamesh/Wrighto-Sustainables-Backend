const express = require('express');
const router = express.Router();
const { createReview, getReviewsByProduct } = require("../controller/reviewController.js");
const { authMiddleware } = require("../middlewares/authMiddleware.js");

router.get("/:productId", getReviewsByProduct);         // GET reviews for a product
router.post("/:productId", authMiddleware, createReview); // POST a review (auth required)

module.exports = router;
