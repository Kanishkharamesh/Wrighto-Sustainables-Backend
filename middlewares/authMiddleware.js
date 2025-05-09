const User = require('../models/userModel');
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// const authMiddleware = asyncHandler(async (req, res, next) => {
//     let token;
//     if (req?.headers?.authorization?.startsWith('Bearer')) {
//         token = req.headers.authorization.split(" ")[1];
//         try {
//             if (token) {
//                 const decoded = jwt.verify(token, process.env.JWT_SECRET);
//                 const user = await User.findById(decoded?.id).select("-password");
//                 if (!user) {
//                     return res.status(401).json({ message: 'User not found' });
//                 }
//                 req.user = user;
//                 next();
//                 console.log("TOKEN RECEIVED:", token);
//                 console.log("DECODED JWT:", decoded);

//             }
//         } catch (error) {
//             throw new Error("Not Authorized token expired, Please Login again")
//         }
//     } else {
//         throw new Error("There is no token attached to the header");
//     }
// });

const authMiddleware = asyncHandler(async (req, res, next) => {
        let token;
    
        // Prefer token from cookies
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // Fallback to Bearer token from headers
        else if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(" ")[1];
        }
    
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
    
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded?.id).select("-password");
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }
            req.user = user;
            next();
        } catch (error) {
            console.error("JWT Verify error:", error.message);
            return res.status(401).json({ message: "Token is invalid or expired" });
        }
    });
    

const isAdmin = asyncHandler(async (req, res, next) => {
    const { email } = req.user;
    const adminUser = await User.findOne({ email });
    if (adminUser.role !== "admin") {
        throw new Error("You are not an admin");
    } else {
        next();
    }
});
module.exports = { authMiddleware, isAdmin };