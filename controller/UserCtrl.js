const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
const Order = require('../models/Order');
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generaterefreshToken } = require("../config/refreshToken");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");
const { json } = require("body-parser");

const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const findUser = await User.findOne({ email: email });
    if (!findUser) {
        // Create a new user
        const newUser = await User.create(req.body);
        res.json(newUser);
    }
    else {
        throw new Error("User Already Exists");
    }
});

const loginUserCtrl = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // check if the user exists or not
    const findUser = await User.findOne({ email });
    if (findUser && await findUser.isPasswordMatched(password)) {
        const refreshToken = await generaterefreshToken(findUser?._id);
        const updateuser = await User.findByIdAndUpdate(
            findUser.id,
            {
                refreshToken: refreshToken,
            },
            {
                new: true
            });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 72 * 60 * 60 * 1000, // 3 days
        });

        const accessToken = generateToken(findUser._id);

        res.cookie("token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "Lax",
            maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
        });

        res.json({
            success: true,
            user: {
                _id: findUser._id,
                firstname: findUser.firstname,
                lastname: findUser.lastname,
                email: findUser.email,
                mobile: findUser.mobile,
                role: findUser.role
            }
        });

    } else {
        throw new Error("Invalid Credentials");
    }
});

//handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh token in cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) throw new Error("No Refresh present in db or not matched");
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err || user.id !== decoded.id) {
            throw new Error("There is something wrong with refresh token");
        }
        const accessToken = generateToken(user?._id)
        res.json({ accessToken });
    });
});

//logoout functionality
// const logout = asyncHandler(async (req, res) => {
//     const cookie = req.cookies;
//     if (!cookie?.refreshToken) throw new Error("No Refresh token in cookies");
//     const refreshToken = cookie.refreshToken;
//     const user = await User.findOne({ refreshToken });
//     if (!user) {
//         res.clearCookie("refreshToken", {
//             httpOnly: true,
//             secure: true,
//         });
//         return res.sendStatus(204); //forbidden
//     }
//     await User.findOneAndUpdate({ refreshToken }, {
//         refreshToken: "",
//     });
//     res.clearCookie('refreshToken', {
//         httpOnly: true,
//         secure: true,
//     });
//     res.sendStatus(204); //forbidden
// });

// const logout = asyncHandler(async (req, res) => {
//         const refreshToken = req.cookies?.refreshToken;

//         if (!refreshToken) {
//             // Even if token is missing, clear cookie just in case and return 204
//             res.clearCookie("refreshToken", {
//                 httpOnly: true,
//                 secure: true,
//                 sameSite: "strict",
//             });
//             return res.sendStatus(204);
//         }

//         const user = await User.findOne({ refreshToken });
//         if (!user) {
//             res.clearCookie("refreshToken", {
//                 httpOnly: true,
//                 secure: true,
//                 sameSite: "strict",
//             });
//             return res.sendStatus(204);
//         }

//         await User.findOneAndUpdate({ refreshToken }, {
//             refreshToken: "",
//         });

//         res.clearCookie('refreshToken', {
//             httpOnly: true,
//             secure: true,
//             sameSite: "strict",
//         });
//         return res.sendStatus(204);
//     });

const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    // Always clear both cookies regardless of whether refreshToken exists or user is found
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    });

    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    });

    if (!refreshToken) {
        return res.sendStatus(204);
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
        return res.sendStatus(204);
    }

    await User.findOneAndUpdate({ refreshToken }, {
        refreshToken: "",
    });

    return res.sendStatus(204);
});


//update a user
const updatedUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        const updatedUser = await User.findByIdAndUpdate(
            _id,
            {
                firstname: req?.body?.firstname,
                lastname: req?.body?.lastname,
                email: req?.body?.email,
                mobile: req?.body?.mobile,
            },
            {
                new: true,
            }
        );
        res.json(updatedUser);
    } catch (error) {
        throw new Error(error);
    }
});

//Get all the users
const getallUser = asyncHandler(async (req, res) => {
    try {
        const getUsers = await User.find();
        res.json(getUsers);
    }
    catch (error) {
        throw new Error(error);
    }
});

//Get a single user
const getaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const getaUser = await User.findById(id);
        res.json({
            getaUser,
        })
    } catch (error) {
        throw new Error(error);
    }
});

//delete a user
const deleteaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const deleteaUser = await User.findByIdAndDelete(id);
        res.json({
            deleteaUser,
        })
    } catch (error) {
        throw new Error(error);
    }
});

const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const block = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: true,
            },
            {
                new: true,
            });
        res.json({
            message: "User Blocked",
        });
    } catch (error) {
        throw new Error(error);
    }
});
const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const unblock = await User.findByIdAndUpdate(id, {
            isBlocked: false,
        },
            {
                new: true,
            });
        res.json({
            message: "User Unblocked",
        });
    } catch (error) {
        throw new Error(error);
    }
});

const updatePassword = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { password } = req.body;
    validateMongoDbId(_id);
    const user = await User.findById(_id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    if (password) {
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword);
    } else {
        res.json(user);
    }
})

const forgotPasswordToken = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new Error("User Not found with this email");
    try {
        const token = await user.createPasswordResetToken();
        await user.save();
        const resetURL = `Hi, Please follow this link to reset your password. This is valid for 10 minutes from now. <a href = 'http://localhost:5000/api/user/reset-password/${token}' > Click Here </a>`
        const data = {
            to: email,
            text: "Hey User",
            subject: "Forgot Password Link",
            html: resetURL,
        };
        sendEmail(data);
        res.json(token);
    } catch (error) {
        throw new Error(error);
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) throw new Error("Token expired, please again later");
    user.password = password;
    user.passwordResetToken = undefined,
        user.passwordResetExpires = undefined;
    await user.save();
    res.json(user);
});

const getUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        const user = await User.findById(_id);
        res.json(user);
    } catch (error) {
        throw new Error(error);
    }
});

const updateProfile = async (req, res) => {
    try {
        const { firstname, lastname, mobile } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                firstname,
                lastname,
                mobile
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error });
    }
};

// // Add to Cart
// const addToCart = asyncHandler(async (req, res) => {
//     const userId = req.user._id;
//     const cartItems = req.body.cart; // should be an array of products from frontend

//     if (!Array.isArray(cartItems)) {
//         return res.status(400).json({ message: "Cart must be an array of products" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//         return res.status(404).json({ message: "User not found" });
//     }

//     user.cart = cartItems;
//     await user.save();

//     res.status(200).json({ message: "Cart updated successfully", cart: user.cart });
// });

const addToCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Check if product already in cart
    const existingItem = user.cart.find(
        (item) => item.product.toString() === productId
    );

    if (existingItem) {
        existingItem.quantity += quantity || 1;
    } else {
        user.cart.push({ product: productId, quantity: quantity || 1 });
    }

    await user.save();
    res.status(200).json({ message: "Cart updated", cart: user.cart });
});


// const getCart = asyncHandler(async (req, res) => {
//     const userId = req.user._id;
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({ cart: user.cart });
//   });

const getCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        // Get user with populated cart
        const user = await User.findById(userId).populate("cart.product");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Ensure cart is not undefined or contains null products
        const cart = (user.cart || [])
            .filter(item => item.product) // filter out null product refs
            .map(item => ({
                ...item.product.toObject(),
                quantity: item.quantity,
            }));

        return res.status(200).json({ cart });
    } catch (error) {
        console.error("Error in getCart:", error);
        return res.status(500).json({ message: "Failed to fetch cart", error: error.message });
    }
});


const removeFromCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params; // Get the product ID from the route params

    try {
        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the product in the cart and remove it
        const productIndex = user.cart.findIndex(item => item.product.toString() === productId);

        if (productIndex === -1) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        // Remove the product from the cart
        user.cart.splice(productIndex, 1);

        // Save the updated cart
        await user.save();

        return res.status(200).json({ message: "Product removed from cart", cart: user.cart });
    } catch (error) {
        console.error("Error in removeFromCart:", error);
        return res.status(500).json({ message: "Failed to remove product from cart", error: error.message });
    }
});

const clearCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Clear the user's cart
        user.cart = [];

        // Save the updated cart (which is now empty)
        await user.save();

        return res.status(200).json({ message: "Cart cleared", cart: user.cart });
    } catch (error) {
        console.error("Error in clearCart:", error);
        return res.status(500).json({ message: "Failed to clear cart", error: error.message });
    }
});

// const placeOrder = asyncHandler(async (req, res) => {
//     const userId = req.user._id; // Get user from authMiddleware

//     const { items, shippingAddress, totalAmount, paymentMethod } = req.body;

//     if (!items || items.length === 0) {
//         return res.status(400).json({ message: 'No items in the order' });
//     }

//     if (!shippingAddress) {
//         return res.status(400).json({ message: 'Shipping address is required' });
//     }

//     try {
//         // Create the order
//         const newOrder = new Order({
//             user: userId,
//             items: items,
//             shippingAddress: shippingAddress,
//             totalAmount: totalAmount,
//             paymentMethod: paymentMethod || 'COD', // Default to COD if not provided
//         });

//         // Save the order to the database
//         const savedOrder = await newOrder.save();

//         // Add the order to the user's orders array
//         await User.findByIdAndUpdate(
//                 userId,
//                 { $push: { orders: savedOrder._id } },
//                 { new: true, useFindAndModify: false }
//             );            

//         // Return the order details to the client
//         res.status(201).json({ message: 'Order placed successfully', order: savedOrder });
//     } catch (error) {
//         console.error('Error in placeOrder:', error);
//         res.status(500).json({ message: 'Failed to place order', error: error.message });
//     }
// });

// const placeOrder = asyncHandler(async (req, res) => {
//     const userId = req.user._id;
//     const { orderItems, shippingInfo, totalAmount } = req.body;

//     // 1. Create new Order
//     const newOrder = await Order.create({
//         user: userId,
//         orderItems,
//         shippingInfo,
//         totalAmount,
//         status: "Pending"
//     });

//     // 2. Push Order into User.orders
//     const user = await User.findById(userId);
//     if (!user) {
//         return res.status(404).json({ message: "User not found" });
//     }

//     user.orders.push(newOrder._id);
//     await user.save();

//     res.status(201).json({ message: "Order placed successfully", order: newOrder });
// });


const placeOrder = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { orderItems, shippingInfo, totalAmount } = req.body;

    // 1. Fetch product details and include image in the order item
    const populatedOrderItems = await Promise.all(
        orderItems.map(async (item) => {
            const product = await Product.findById(item.product);
            return {
                ...item,
                image: product.images[0],  // Assuming the product has an array of images
            };
        })
    );

    // 2. Create new Order with populated order items
    const newOrder = await Order.create({
        user: userId,
        orderItems: populatedOrderItems,
        shippingInfo,
        totalAmount,
        status: "Pending"
    });

    // 3. Push Order into User.orders
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    user.orders.push(newOrder._id);
    await user.save();

    res.status(201).json({ message: "Order placed successfully", order: newOrder });
});


// const getUserOrders = asyncHandler(async (req, res) => {
//     const userId = req.user._id; // Get user from authMiddleware

//     try {
//         // Fetch orders by userId and populate the order details
//         const user = await User.findById(userId).populate({
//             path: 'orders',
//             model: 'Order',
//             populate: {
//                 path: 'items.product', // Populate product details inside the order items
//                 model: 'Product',
//             }
//         });

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const orders = user.orders;
//         return res.status(200).json({ orders });
//     } catch (error) {
//         console.error('Error in getUserOrders:', error);
//         return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
//     }
// });


// In your orders controller
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({ user: userId })
            .populate('items.product') // <-- This populates full product details
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// const getInvoiceUser = asyncHandler(async (req, res) => {
//     const { _id } = req.user;
//     validateMongoDbId(_id);

//     try {
//         const orders = await Order.find({ user: _id })
//         .populate('items.product', 'name')
//         .sort({ createdAt: -1 });

//       const sanitizedOrders = orders.map(order => ({
//         ...order.toObject(),
//         gstAmount: order.gstAmount ?? 0,
//       }));

//       if (!orders || orders.length === 0) {
//         return res.status(404).json({ message: "No orders found for this user" });
//       }

//       res.status(200).json(orders);
//     } catch (error) {
//       console.error("Error fetching user orders:", error);
//       res.status(500).json({ message: "Something went wrong", error: error.message });
//     }
//   });

const getInvoiceUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);

    try {
        const orders = await Order.find({ user: _id })
            .populate('items.product', 'name pricePerPiece')
            .sort({ createdAt: -1 });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No orders found for this user" });
        }

        const sanitizedOrders = orders.map(order => {
            const orderObj = order.toObject();

            const subtotal = orderObj.items.reduce((acc, item) => {
                const price = item.product?.pricePerPiece || 0;
                const qty = item.quantity || 1;
                return acc + price * qty;
            }, 0);

            const gstRate = 0.18;
            const gstAmount = orderObj.gstAmount !== undefined
                ? orderObj.gstAmount
                : +(subtotal * gstRate).toFixed(2);

            const deliveryCharge = orderObj.deliveryCharge !== undefined
                ? orderObj.deliveryCharge
                : 50;

            const grandTotal = orderObj.grandTotal !== undefined
                ? orderObj.grandTotal
                : +(subtotal + gstAmount + deliveryCharge).toFixed(2);

            return {
                ...orderObj,
                subtotal: +subtotal.toFixed(2),
                gstAmount,
                deliveryCharge,
                grandTotal
            };
        });

        res.status(200).json(sanitizedOrders);
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ message: "Something went wrong", error: error.message });
    }
});

module.exports = {
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
};