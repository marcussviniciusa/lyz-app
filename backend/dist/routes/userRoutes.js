"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Cast controllers to RequestHandler type for TypeScript compatibility
const getAllUsersHandler = userController_1.getAllUsers;
const getUserByIdHandler = userController_1.getUserById;
const createUserHandler = userController_1.createUser;
const updateUserHandler = userController_1.updateUser;
const deleteUserHandler = userController_1.deleteUser;
// Cast middleware to RequestHandler type
const authMiddleware = auth_1.authenticateToken;
const superAdminMiddleware = auth_1.isSuperAdmin;
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
exports.default = router;
