"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetUserPassword = exports.changePassword = exports.getCurrentUser = exports.registerUser = exports.login = void 0;
const User_1 = __importStar(require("../models/User"));
const jwt_1 = require("../utils/jwt");
const mongoose_1 = __importDefault(require("mongoose"));
// Login controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if email and password are provided
        if (!email || !password) {
            res.status(400).json({
                status: 'error',
                message: 'Email and password are required'
            });
            return;
        }
        // Find user by email
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
            return;
        }
        // Check if user is active
        if (!user.isActive) {
            res.status(403).json({
                status: 'error',
                message: 'Account is inactive. Please contact your administrator'
            });
            return;
        }
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
            return;
        }
        // Update last login time
        user.lastLogin = new Date();
        await user.save();
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            userId: user._id instanceof mongoose_1.default.Types.ObjectId ? user._id.toString() : String(user._id),
            email: user.email,
            role: user.role,
            company: user.company instanceof mongoose_1.default.Types.ObjectId ? user.company.toString() : String(user.company)
        });
        // Return user data and token (exclude password)
        const userData = {
            id: user._id instanceof mongoose_1.default.Types.ObjectId ? user._id.toString() : String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            company: user.company instanceof mongoose_1.default.Types.ObjectId ? user.company.toString() : String(user.company)
        };
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: userData,
                token
            }
        });
        return;
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred during login'
        });
        return;
    }
};
exports.login = login;
// Register new user (superadmin only)
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, company, isActive } = req.body;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                status: 'error',
                message: 'User with this email already exists'
            });
            return;
        }
        // Create new user
        const newUser = new User_1.default({
            name,
            email,
            password,
            role: role || User_1.UserRole.USER,
            company,
            isActive: isActive === undefined ? true : isActive
        });
        await newUser.save();
        // Return created user (exclude password)
        const userData = {
            id: newUser._id instanceof mongoose_1.default.Types.ObjectId ? newUser._id.toString() : String(newUser._id),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            company: newUser.company instanceof mongoose_1.default.Types.ObjectId ? newUser.company.toString() : String(newUser.company),
            isActive: newUser.isActive
        };
        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            data: {
                user: userData
            }
        });
        return;
    }
    catch (error) {
        console.error('User registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred during user registration'
        });
        return;
    }
};
exports.registerUser = registerUser;
// Get current user info
const getCurrentUser = async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id instanceof mongoose_1.default.Types.ObjectId ? user._id.toString() : String(user._id),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    company: user.company instanceof mongoose_1.default.Types.ObjectId ? user.company.toString() : String(user.company),
                    isActive: user.isActive,
                    lastLogin: user.lastLogin
                }
            }
        });
        return;
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching user data'
        });
        return;
    }
};
exports.getCurrentUser = getCurrentUser;
// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;
        const userId = user._id instanceof mongoose_1.default.Types.ObjectId ? user._id : new mongoose_1.default.Types.ObjectId(String(user._id));
        if (!currentPassword || !newPassword) {
            res.status(400).json({
                status: 'error',
                message: 'Current password and new password are required'
            });
            return;
        }
        // Find user with password field
        const foundUser = await User_1.default.findById(userId).select('+password');
        if (!foundUser) {
            res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
            return;
        }
        // Verify current password
        const isPasswordValid = await foundUser.comparePassword(currentPassword);
        if (!isPasswordValid) {
            res.status(401).json({
                status: 'error',
                message: 'Current password is incorrect'
            });
            return;
        }
        // Update password
        foundUser.password = newPassword;
        await foundUser.save();
        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully'
        });
        return;
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while changing password'
        });
        return;
    }
};
exports.changePassword = changePassword;
// Reset user password (superadmin only)
const resetUserPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        if (!userId || !newPassword) {
            res.status(400).json({
                status: 'error',
                message: 'User ID and new password are required'
            });
            return;
        }
        // Find user
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
            return;
        }
        // Update password
        user.password = newPassword;
        await user.save();
        res.status(200).json({
            status: 'success',
            message: 'User password reset successfully'
        });
        return;
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while resetting password'
        });
        return;
    }
};
exports.resetUserPassword = resetUserPassword;
