import express, { Router, RequestHandler } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController';
import { authenticateToken, isSuperAdmin } from '../middleware/auth';

const router: Router = express.Router();

// Cast controllers to RequestHandler type for TypeScript compatibility
const getAllUsersHandler: RequestHandler = getAllUsers;
const getUserByIdHandler: RequestHandler = getUserById;
const createUserHandler: RequestHandler = createUser;
const updateUserHandler: RequestHandler = updateUser;
const deleteUserHandler: RequestHandler = deleteUser;

// Cast middleware to RequestHandler type
const authMiddleware: RequestHandler = authenticateToken;
const superAdminMiddleware: RequestHandler = isSuperAdmin;

// Apply authentication middleware to all routes
router.use(authMiddleware, superAdminMiddleware);

// GET all users with pagination and filters
router.get('/', getAllUsersHandler);

// GET user by ID
router.get('/:id', getUserByIdHandler);

// POST create new user
router.post('/', createUserHandler);

// PUT update user
router.put('/:id', updateUserHandler);

// DELETE (soft delete) user
router.delete('/:id', deleteUserHandler);

export default router;
