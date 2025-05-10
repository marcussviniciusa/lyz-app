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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuperAdmin = exports.authenticateToken = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = __importStar(require("../models/User"));
// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
        if (!token) {
            res.status(401).json({ status: 'error', message: 'Authentication required' });
            return;
        }
        const decodedToken = (0, jwt_1.verifyToken)(token);
        if (!decodedToken) {
            res.status(403).json({ status: 'error', message: 'Invalid or expired token' });
            return;
        }
        // Find user in database
        const user = await User_1.default.findById(decodedToken.userId).select('-password');
        if (!user) {
            res.status(403).json({ status: 'error', message: 'User not found' });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({ status: 'error', message: 'User account is inactive' });
            return;
        }
        // Attach user to request object
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ status: 'error', message: 'Authentication error' });
    }
};
exports.authenticateToken = authenticateToken;
// Middleware to check if user is a superadmin
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === User_1.UserRole.SUPERADMIN) {
        next();
        return;
    }
    res.status(403).json({ status: 'error', message: 'Superadmin privileges required' });
};
exports.isSuperAdmin = isSuperAdmin;
