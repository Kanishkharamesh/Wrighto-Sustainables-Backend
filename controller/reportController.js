const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const { getAllOrders } = require('../controller/orderController');
const Product = require("../models/productModel"); // adjust the path if needed
const User = require('../models/userModel');


// const getSalesReport = asyncHandler(async (req, res) => {
//     const now = new Date();

//     const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfYear = new Date(now.getFullYear(), 0, 1);

//     const calculateRevenue = async (startDate) => {
//         const result = await Order.aggregate([
//             {
//                 $match: {
//                     createdAt: { $gte: startDate },
//                     status: 'Delivered', // Only count delivered orders
//                 },
//             },
//             {
//                 $group: {
//                     _id: null,
//                     total: { $sum: "$grandTotal" },
//                 },
//             },
//         ]);
//         return result[0]?.total || 0;
//     };

//     const [dailyRevenue, monthlyRevenue, yearlyRevenue] = await Promise.all([
//         calculateRevenue(startOfDay),
//         calculateRevenue(startOfMonth),
//         calculateRevenue(startOfYear),
//     ]);

//     res.json({ dailyRevenue, monthlyRevenue, yearlyRevenue });
// });

const getSalesReport = asyncHandler(async (req, res) => {
    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const calculateRevenue = async (startDate) => {
        const result = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: 'Delivered',
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$grandTotal" },
                },
            },
        ]);
        return result[0]?.total || 0;
    };

    const calculateOrderCount = async (startDate) => {
        return await Order.countDocuments({
            createdAt: { $gte: startDate },
            status: 'Delivered',
        });
    };

    const calculateNewUsers = async (startDate) => {
        return await User.countDocuments({
            createdAt: { $gte: startDate },
        });
    };

    const [
        dailyRevenue, monthlyRevenue, yearlyRevenue,
        dailyOrders, monthlyOrders, yearlyOrders,
        dailyUsers, monthlyUsers, yearlyUsers
    ] = await Promise.all([
        calculateRevenue(startOfDay),
        calculateRevenue(startOfMonth),
        calculateRevenue(startOfYear),

        calculateOrderCount(startOfDay),
        calculateOrderCount(startOfMonth),
        calculateOrderCount(startOfYear),

        calculateNewUsers(startOfDay),
        calculateNewUsers(startOfMonth),
        calculateNewUsers(startOfYear),
    ]);

    res.json({
        dailyRevenue, monthlyRevenue, yearlyRevenue,
        dailyOrders, monthlyOrders, yearlyOrders,
        dailyUsers, monthlyUsers, yearlyUsers
    });
});



const getPopularProductsReport = async (req, res) => {
    try {
        const orders = await Order.find().populate("items.product");

        if (!orders.length) {
            return res.status(404).json({ message: "No orders found" });
        }

        const productSalesMap = {};

        orders.forEach(order => {
            if (!Array.isArray(order.items)) {
                console.warn("Order has no items:", order._id);
                return;
            }

            order.items.forEach(item => {
                const product = item.product;
                if (!product || !product._id) {
                    console.warn("Item has no valid product:", item);
                    return;
                }

                const productId = product._id.toString();
                productSalesMap[productId] = (productSalesMap[productId] || 0) + item.quantity;
            });
        });

        const sortedProductIds = Object.entries(productSalesMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([productId]) => productId);

        if (!sortedProductIds.length) {
            return res.status(404).json({ message: "No popular products found" });
        }

        const bestsellers = await Product.find({ _id: { $in: sortedProductIds } });

        const bestsellersWithSales = bestsellers.map(product => ({
            _id: product._id,
            name: product.name,
            totalSold: productSalesMap[product._id.toString()] || 0,
            quantityInStock: product.quantityInStock,
            image: product.images?.[0] || null
        }));

        const lowStockProducts = await Product.find({ quantityInStock: { $lt: 10 } })
            .select("name quantityInStock images");

        res.json({
            bestsellers: bestsellersWithSales,
            lowStockProducts
        });

    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ message: "Failed to generate report", error: error.message });
    }
};

module.exports = {
    getSalesReport,
    getPopularProductsReport,
};
