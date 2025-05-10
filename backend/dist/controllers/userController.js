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
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importStar(require("../models/User"));
const Company_1 = __importDefault(require("../models/Company"));
// Get all users with pagination and filters
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const companyId = req.query.company;
        const role = req.query.role;
        const isActive = req.query.isActive;
        const skip = (page - 1) * limit;
        // Build query
        const query = {};
        if (companyId && mongoose_1.default.Types.ObjectId.isValid(companyId)) {
            query.company = companyId;
        }
        if (role && Object.values(User_1.UserRole).includes(role)) {
            query.role = role;
        }
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        // Execute query with pagination
        const users = await User_1.default.find(query)
            .select('-password')
            .populate('company', 'name')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);
        // Get total count for pagination
        const total = await User_1.default.countDocuments(query);
        res.status(200).json({
            status: 'success',
            results: users.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            },
            data: {
                users
            }
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching users'
        });
    }
};
exports.getAllUsers = getAllUsers;
// Get user by ID
const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid user ID format'
            });
            return;
        }
        const user = await User_1.default.findById(userId)
            .select('-password')
            .populate('company', 'name');
        if (!user) {
            res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching user details'
        });
    }
};
exports.getUserById = getUserById;
// Create new user
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, company, isActive } = req.body;
        // Validate required fields
        if (!name || !email || !password || !company) {
            res.status(400).json({
                status: 'error',
                message: 'Name, email, password, and company are required fields'
            });
            return;
        }
        // Validate company ID
        if (!mongoose_1.default.Types.ObjectId.isValid(company)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid company ID format'
            });
            return;
        }
        // Check if company exists
        const companyExists = await Company_1.default.findById(company);
        if (!companyExists) {
            res.status(404).json({
                status: 'error',
                message: 'Company not found'
            });
            return;
        }
        // Check if company is active
        if (!companyExists.isActive) {
            res.status(400).json({
                status: 'error',
                message: 'Cannot create user for inactive company'
            });
            return;
        }
        // Check if user with email already exists
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
        // Remove password from response
        const userResponse = newUser.toObject();
        const userResponseWithoutPassword = { ...userResponse };
        if ('password' in userResponseWithoutPassword) {
            delete userResponseWithoutPassword.password;
        }
        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            data: {
                user: userResponse
            }
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while creating user'
        });
    }
};
exports.createUser = createUser;
// Update user
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, role, company, isActive } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid user ID format'
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
        // If email is being updated, check if it's unique
        if (email && email !== user.email) {
            const existingUser = await User_1.default.findOne({ email });
            if (existingUser) {
                res.status(400).json({
                    status: 'error',
                    message: 'User with this email already exists'
                });
                return;
            }
        }
        // If company is being updated, validate it
        if (company && company !== user.company.toString()) {
            if (!mongoose_1.default.Types.ObjectId.isValid(company)) {
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid company ID format'
                });
                return;
            }
            const companyExists = await Company_1.default.findById(company);
            if (!companyExists) {
                res.status(404).json({
                    status: 'error',
                    message: 'Company not found'
                });
                return;
            }
            if (!companyExists.isActive) {
                res.status(400).json({
                    status: 'error',
                    message: 'Cannot assign user to inactive company'
                });
                return;
            }
        }
        // Update user fields
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        if (role && Object.values(User_1.UserRole).includes(role))
            user.role = role;
        if (company)
            user.company = new mongoose_1.default.Types.ObjectId(company);
        if (isActive !== undefined)
            user.isActive = isActive;
        await user.save();
        // Remove password from response
        const userResponse = user.toObject();
        const userResponseWithoutPassword = { ...userResponse };
        if ('password' in userResponseWithoutPassword) {
            delete userResponseWithoutPassword.password;
        }
        res.status(200).json({
            status: 'success',
            message: 'User updated successfully',
            data: {
                user: userResponse
            }
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating user'
        });
    }
};
exports.updateUser = updateUser;
// Delete user (soft delete by setting isActive to false)
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid user ID format'
            });
            return;
        }
        // Check if user exists
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
            return;
        }
        // Prevent deletion of last superadmin
        if (user.role === User_1.UserRole.SUPERADMIN) {
            const superadminCount = await User_1.default.countDocuments({
                role: User_1.UserRole.SUPERADMIN,
                isActive: true
            });
            if (superadminCount <= 1) {
                res.status(400).json({
                    status: 'error',
                    message: 'Cannot delete the last active superadmin user'
                });
                return;
            }
        }
        // Soft delete by setting isActive to false
        user.isActive = false;
        await user.save();
        res.status(200).json({
            status: 'success',
            message: 'User deactivated successfully'
        });
    }
    catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deactivating user'
        });
    }
};
exports.deleteUser = deleteUser;
