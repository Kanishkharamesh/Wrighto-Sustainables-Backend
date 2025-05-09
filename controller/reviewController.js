const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");

// GET reviews for a specific product
const getReviewsByProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId }).populate("user", "firstname lastname");
    res.status(200).json(reviews);
});

// POST a new review
const createReview = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.create({
        user: req.user._id,
        product: productId,
        rating,
        comment,
    });

    res.status(201).json(review);
});

module.exports = {
    getReviewsByProduct,
    createReview,
};
