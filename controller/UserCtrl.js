const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
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
            maxAge: 72 * 60 * 60 * 1000,
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
            token: generateToken(findUser._id),
            user: {
                _id: findUser._id,
                firstname: findUser.firstname,
                lastname: findUser.lastname,
                email: findUser.email,
                mobile: findUser.mobile,
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
const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh token in cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
        });
        return res.sendStatus(204); //forbidden
    }
    await User.findOneAndUpdate({ refreshToken }, {
        refreshToken: "",
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
    });
    res.sendStatus(204); //forbidden
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
};