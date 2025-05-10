"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routeTypes_1 = require("../utils/routeTypes");
const fileController_1 = require("../controllers/fileController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All file routes require authentication
router.use(auth_1.authenticateToken);
// Upload file - uses multer middleware for file handling
router.post('/upload', [fileController_1.upload.single('file')], (0, routeTypes_1.asyncHandler)(fileController_1.uploadFile));
// Get file by ID
router.get('/:fileId', (0, routeTypes_1.asyncHandler)(fileController_1.getFile));
// Delete file
router.delete('/:fileId', (0, routeTypes_1.asyncHandler)(fileController_1.deleteFile));
// List files with optional filtering
router.get('/', (0, routeTypes_1.asyncHandler)(fileController_1.listFiles));
exports.default = router;
