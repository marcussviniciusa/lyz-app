"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routeTypes_1 = require("../utils/routeTypes");
const planController_1 = require("../controllers/planController");
const planVersionController_1 = require("../controllers/planVersionController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public route for shared plans
router.get('/shared/:token', (0, routeTypes_1.asyncHandler)(planController_1.viewSharedPlan));
// All other routes require authentication
router.use(auth_1.authenticateToken);
// GET all plans with pagination and filters
router.get('/', (0, routeTypes_1.asyncHandler)(planController_1.getAllPlans));
// GET plan by ID
router.get('/:id', (0, routeTypes_1.asyncHandler)(planController_1.getPlanById));
// POST create new plan
router.post('/', (0, routeTypes_1.asyncHandler)(planController_1.createPlan));
// PUT update plan
router.put('/:id', (0, routeTypes_1.asyncHandler)(planController_1.updatePlan));
// DELETE plan
router.delete('/:id', (0, routeTypes_1.asyncHandler)(planController_1.deletePlan));
// PUT archive plan
router.put('/:id/archive', (0, routeTypes_1.asyncHandler)(planController_1.archivePlan));
// POST generate sharing link
router.post('/:id/share', (0, routeTypes_1.asyncHandler)(planController_1.generateSharingLink));
// Rotas para histórico de versões
// GET obter todas as versões de um plano
router.get('/:planId/versions', (0, routeTypes_1.asyncHandler)(planVersionController_1.getPlanVersions));
// GET obter uma versão específica de um plano
router.get('/:planId/versions/:versionId', (0, routeTypes_1.asyncHandler)(planVersionController_1.getPlanVersionById));
// POST comparar duas versões de um plano
router.post('/:planId/versions/compare', (0, routeTypes_1.asyncHandler)(planVersionController_1.comparePlanVersions));
// POST restaurar uma versão anterior
router.post('/:planId/versions/:versionId/restore', (0, routeTypes_1.asyncHandler)(planVersionController_1.restorePlanVersion));
exports.default = router;
