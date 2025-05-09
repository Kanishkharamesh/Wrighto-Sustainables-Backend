const asyncHandler = require('express-async-handler');
const validateMongoDbId = require('../utils/validateMongodbId.js');
const Order = require('../models/Order.js');
const Product = require("../models/productModel");

// Place Order
// const placeOrder = asyncHandler(async (req, res) => {
//     const { items, shippingAddress, paymentMethod, totalAmount } = req.body;

//     if (!items || items.length === 0) {
//         return res.status(400).json({ message: "No items in the order" });
//     }

//     try {
//         const order = new Order({
//             user: req.user._id,
//             items,
//             shippingAddress,
//             paymentMethod,
//             totalAmount,
//         });
//         const saved = await order.save();
//         res.status(201).json(saved);
//     } catch (err) {
//         res.status(500).json({ message: 'Order failed', error: err.message });
//     }
// });

// Place Order
const placeOrder = asyncHandler(async (req, res) => {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "No items in the order" });
    }

    try {
        // Constants
        const GST_PERCENTAGE = 18; // 18%
        const DELIVERY_CHARGE = 50; // Flat ₹50

        // Subtotal
        const totalAmount = items.reduce((acc, item) => acc + item.quantity * item.price, 0);

        // Calculate GST and grand total
        const gstAmount = (GST_PERCENTAGE / 100) * totalAmount;
        const grandTotal = totalAmount + gstAmount + DELIVERY_CHARGE;

        const order = new Order({
            user: req.user._id,
            items,
            shippingAddress,
            paymentMethod,
            totalAmount,
            gstAmount,
            deliveryCharge: DELIVERY_CHARGE,
            grandTotal,
        });

        const saved = await order.save();
        if (saved.items && saved.items.every(item => item.product)) {
            await updateStockAfterOrder(saved.items);
        }
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: 'Order failed', error: err.message });
    }
});

const getUserOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('user');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Allow if the logged-in user owns the order OR is an admin
        if (
            order.user &&
            order.user._id.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


// Get User Orders
const getUserOrders = asyncHandler(async (req, res) => {
    const { _id } = req.user; // Get the user ID from the authenticated user

    // Validate the user ID
    validateMongoDbId(_id);

    try {
        // Fetch the user's orders from the database
        // const orders = await Order.find({ user: _id }).sort({ createdAt: -1 });
        const orders = await Order.find({ user: _id })
            .populate('items.product', 'name') // Only fetch product name
            .sort({ createdAt: -1 });


        // If no orders found, send a 404 response
        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No orders found for this user" });
        }

        // Send the orders as the response
        res.json(orders);
    } catch (error) {
        // Log the error and send a 500 status with the error message
        console.error("Error fetching user orders:", error);
        res.status(500).json({ message: "Something went wrong while fetching orders", error: error.message });
    }
});

// Get All Orders (Admin)
const getAllOrders = asyncHandler(async (req, res) => {
    try {
        // Admin can see all orders with populated user details
        const orders = await Order.find().populate('user').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Fetching all orders failed', error: err.message });
    }
});

// Cancel Order by Admin
const cancelOrderByAdmin = asyncHandler(async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = 'Cancelled';
        await order.save();

        res.json({ message: 'Order has been cancelled successfully.', order });
    } catch (err) {
        res.status(500).json({ message: 'Failed to cancel order', error: err.message });
    }
});

const updateOrderStatusByAdmin = asyncHandler(async (req, res) => {
    try {
        const orderId = req.params.id;  // Get order ID from the route params
        const { status } = req.body;    // Get the new status from the request body

        // Check if the status is valid
        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Find the order by ID and update the status
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status
        order.status = status;
        await order.save();

        res.json({ message: 'Order status updated successfully.', order });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update order status', error: err.message });
    }
});

const getCancelledOrders = asyncHandler(async (req, res) => {
    try {
        // Admin can see only cancelled orders, with populated user details
        const cancelledOrders = await Order.find({ status: 'Cancelled' }) // Filter for cancelled orders
            .populate('user') // Populate user details
            .sort({ createdAt: -1 }); // Sort by creation date in descending order

        res.json(cancelledOrders); // Return the cancelled orders
    } catch (err) {
        res.status(500).json({ message: 'Fetching cancelled orders failed', error: err.message });
    }
});

const updatePaymentStatusByAdmin = asyncHandler(async (req, res) => {
    try {
        const orderId = req.params.id;
        const { paymentStatus, transactionId, paymentGateway } = req.body;

        // Validate paymentStatus
        const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update payment status and optionally payment details
        order.paymentStatus = paymentStatus;

        if (paymentStatus === 'Paid') {
            order.paymentDetails = {
                transactionId: transactionId || order.paymentDetails?.transactionId,
                paymentGateway: paymentGateway || order.paymentDetails?.paymentGateway,
                paymentTime: new Date()
            };
        }

        await order.save();
        res.json({ message: 'Payment status updated successfully.', order });

    } catch (err) {
        res.status(500).json({ message: 'Failed to update payment status', error: err.message });
    }
});

const updateStockAfterOrder = async (orderItems) => {
    for (const item of orderItems) {
        const productId = item.product;
        console.log('Processing product ID:', productId);

        if (!productId) {
            throw new Error(`Missing product ID in order item`);
        }

        const product = await Product.findById(productId);
        if (!product) {
            throw new Error(`Product not found: ${productId}`);
        }

        console.log(`Before: ${product.name} - Stock: ${product.quantityInStock}`);

        if (product.quantityInStock < item.quantity) {
            throw new Error(`Not enough stock for product: ${product.name}`);
        }

        product.quantityInStock -= item.quantity;

        console.log(`After: ${product.name} - Stock: ${product.quantityInStock}`);

        await product.save();
        console.log(`✅ Saved stock update for ${product.name}`);
    }
};


// Order Controller to fetch a single order
const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params; // Get orderId from the URL params
    const { _id } = req.user; // Get the user ID from the authenticated user

    // Validate MongoDB ID
    validateMongoDbId(orderId);

    try {
        // Fetch the order by ID and ensure it belongs to the authenticated user
        const order = await Order.findOne({ _id: orderId, user: _id })
            .populate('items.product', 'name'); // Populate product name in the items

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "Something went wrong while fetching the order", error: error.message });
    }
});




module.exports = {
    placeOrder,
    getUserOrders,
    getUserOrder,
    getAllOrders,
    cancelOrderByAdmin,
    updateOrderStatusByAdmin,
    getCancelledOrders,
    updatePaymentStatusByAdmin,
    updateStockAfterOrder,
    getOrderById,
};
