"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routeTypes_1 = require("../utils/routeTypes");
const promptController_1 = require("../controllers/promptController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All prompt routes require authentication and superadmin privilege
router.use(auth_1.authenticateToken);
router.use(auth_1.isSuperAdmin);
// GET all prompts
router.get('/', (0, routeTypes_1.asyncHandler)(promptController_1.getAllPrompts));
// GET prompt by ID
router.get('/:id', (0, routeTypes_1.asyncHandler)(promptController_1.getPromptById));
// POST create new prompt
router.post('/', (0, routeTypes_1.asyncHandler)(promptController_1.createPrompt));
// PUT update prompt
router.put('/:id', (0, routeTypes_1.asyncHandler)(promptController_1.updatePrompt));
// DELETE prompt
router.delete('/:id', (0, routeTypes_1.asyncHandler)(promptController_1.deletePrompt));
// PATCH set prompt as active
router.patch('/:id/activate', (0, routeTypes_1.asyncHandler)(promptController_1.setPromptActive));
exports.default = router;
