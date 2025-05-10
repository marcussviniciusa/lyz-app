"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routeTypes_1 = require("../utils/routeTypes");
const aiController_1 = require("../controllers/aiController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Analyze lab exams
router.post('/analyze-exams', (0, routeTypes_1.asyncHandler)(aiController_1.analyzeExamResults));
// Analyze TCM observations
router.post('/analyze-tcm', (0, routeTypes_1.asyncHandler)(aiController_1.analyzeTCM));
// Analyze using IFM Matrix
router.post('/analyze-ifm', (0, routeTypes_1.asyncHandler)(aiController_1.analyzeIFM));
// Generate final plan
router.post('/generate-plan', (0, routeTypes_1.asyncHandler)(aiController_1.createFinalPlan));
// Refine existing plan
router.post('/refine-plan', (0, routeTypes_1.asyncHandler)(aiController_1.refinePlan));
// Get agent context
router.get('/context/:planId/:agentType', (0, routeTypes_1.asyncHandler)(aiController_1.getAgentContext));
exports.default = router;
