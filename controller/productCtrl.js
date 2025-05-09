const Product = require('../models/productModel');
const asyncHandler = require('express-async-handler');
const slugify = require('slugify');

const createProduct = asyncHandler(async (req, res) => {
    try {
        if (req.body.name) {
            req.body.slug = slugify(req.body.name);
        }
        const newProduct = await Product.create(req.body);
        res.json(newProduct);
    }
    catch (error) {
        throw new Error(error);
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        if (req.body.name) {
            req.body.slug = slugify(req.body.name);
        }
        const updatedProduct = await Product.findOneAndUpdate({ _id: id }, req.body, {
            new: true
        });
        res.json(updatedProduct);
    } catch (error) {
        throw new Error(error);
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const deletedProduct = await Product.findOneAndDelete({ _id: id }, req.body, {
            new: true
        });
        res.json(deletedProduct);
    } catch (error) {
        throw new Error(error);
    }
});

// const getaProduct = asyncHandler( async(req, res) => {
//     const {id} = req.params;
//     try{
//         const findProduct = await Product.findById(id);
//         res.json(findProduct);
//     }catch(error){
//         throw new Error(error);
//     }
// });

const getaProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const findProduct = await Product.findById(id);
        if (!findProduct) {
            res.status(404);
            throw new Error("Product not found");
        }
        res.json(findProduct);
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
});

const getProductImage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        // Find the product by its ID
        const findProduct = await Product.findById(id);

        // If the product is not found, throw an error
        if (!findProduct) {
            res.status(404);
            throw new Error("Product not found");
        }

        // Assuming the product has an 'images' field that stores an array of image URLs
        const imageUrl = findProduct.images[0]; // You can modify this to fetch any image index you prefer

        // If the image field is not set or doesn't exist
        if (!imageUrl) {
            res.status(404);
            throw new Error("Image not found for this product");
        }

        // Return the image URL
        res.json({ image: imageUrl });
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
});


const getAllProduct = asyncHandler(async (req, res) => {
    try {
        const queryObj = {};
        const sortOption = {};

        // 1. Price Range Filter
        if (req.query.minPrice || req.query.maxPrice) {
            queryObj.pricePerPiece = {};
            if (req.query.minPrice) queryObj.pricePerPiece.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) queryObj.pricePerPiece.$lte = Number(req.query.maxPrice);
        }

        // 2. Boolean Filters
        if (req.query.hasLid !== undefined) {
            queryObj.hasLid = req.query.hasLid === "true";
        }

        if (req.query.isMicrowaveable !== undefined) {
            queryObj.isMicrowaveable = req.query.isMicrowaveable === "true";
        }

        if (req.query.isDishwasherSafe !== undefined) {
            queryObj.isDishwasherSafe = req.query.isDishwasherSafe === "true";
        }

        // 3. Exact Match Fields
        const fieldsToMatch = [
            "capacity", "plasticType", "shape", "itemForm", "packSize", "slug", "size"
        ];
        fieldsToMatch.forEach(field => {
            if (req.query[field]) {
                queryObj[field] = req.query[field];
            }
        });

        // 4. Array Field Filters
        const arrayFields = ["color", "usage", "features"];
        arrayFields.forEach(field => {
            if (req.query[field]) {
                queryObj[field] = { $in: [req.query[field]] };
            }
        });

        // 5. Keyword Search in name or description
        if (req.query.keyword) {
            const keywordRegex = new RegExp(req.query.keyword, "i");
            queryObj.$or = [
                { name: { $regex: keywordRegex } },
                { description: { $regex: keywordRegex } }
            ];
        }

        // 6. Sorting
        if (req.query.sortBy) {
            const [field, order] = req.query.sortBy.split(":");
            sortOption[field] = order === "desc" ? -1 : 1;
        }

        // 7. Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // 8. Query execution
        const products = await Product.find(queryObj)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = {
    createProduct,
    getaProduct,
    getAllProduct,
    updateProduct,
    deleteProduct,
    getProductImage,
};