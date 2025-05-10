"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Properly type cast for Express 4.x compatibility
const loginHandler = authController_1.login;
const getCurrentUserHandler = authController_1.getCurrentUser;
const changePasswordHandler = authController_1.changePassword;
const registerUserHandler = authController_1.registerUser;
const resetUserPasswordHandler = authController_1.resetUserPassword;
// Public routes
router.post('/login', loginHandler);
// Protected routes
router.get('/me', auth_1.authenticateToken, getCurrentUserHandler);
router.post('/change-password', auth_1.authenticateToken, changePasswordHandler);
// Superadmin routes
router.post('/register', auth_1.authenticateToken, auth_1.isSuperAdmin, registerUserHandler);
router.post('/reset-password', auth_1.authenticateToken, auth_1.isSuperAdmin, resetUserPasswordHandler);
exports.default = router;
