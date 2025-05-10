import express, { Router, RequestHandler } from 'express';
import { login, registerUser, getCurrentUser, changePassword, resetUserPassword, validateToken } from '../controllers/authController';
import { authenticateToken, isSuperAdmin } from '../middleware/auth';

const router: Router = express.Router();

// Properly type cast for Express 4.x compatibility
const loginHandler: RequestHandler = login;
const getCurrentUserHandler: RequestHandler = getCurrentUser;
const changePasswordHandler: RequestHandler = changePassword;
const registerUserHandler: RequestHandler = registerUser;
const resetUserPasswordHandler: RequestHandler = resetUserPassword;
const validateTokenHandler: RequestHandler = validateToken;

// Public routes
router.post('/login', loginHandler);

// Protected routes
router.get('/me', authenticateToken, getCurrentUserHandler);
router.get('/validate-token', authenticateToken, validateTokenHandler);
router.post('/change-password', authenticateToken, changePasswordHandler);

// Superadmin routes
router.post('/register', authenticateToken, isSuperAdmin, registerUserHandler);
router.post('/reset-password', authenticateToken, isSuperAdmin, resetUserPasswordHandler);

export default router;
