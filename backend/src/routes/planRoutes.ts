import express, { Router } from 'express';
import { asyncHandler } from '../utils/routeTypes';
import {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  archivePlan,
  generateSharingLink,
  viewSharedPlan
} from '../controllers/planController';
import {
  getPlanVersions,
  getPlanVersionById,
  comparePlanVersions,
  restorePlanVersion
} from '../controllers/planVersionController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// Public route for shared plans
router.get('/shared/:token', asyncHandler(viewSharedPlan));

// All other routes require authentication
router.use(authenticateToken);

// GET all plans with pagination and filters
router.get('/', asyncHandler(getAllPlans));

// GET plan by ID
router.get('/:id', asyncHandler(getPlanById));

// POST create new plan
router.post('/', asyncHandler(createPlan));

// PUT update plan
router.put('/:id', asyncHandler(updatePlan));

// DELETE plan
router.delete('/:id', asyncHandler(deletePlan));

// PUT archive plan
router.put('/:id/archive', asyncHandler(archivePlan));

// POST generate sharing link
router.post('/:id/share', asyncHandler(generateSharingLink));

// Rotas para histórico de versões
// GET obter todas as versões de um plano
router.get('/:planId/versions', asyncHandler(getPlanVersions));

// GET obter uma versão específica de um plano
router.get('/:planId/versions/:versionId', asyncHandler(getPlanVersionById));

// POST comparar duas versões de um plano
router.post('/:planId/versions/compare', asyncHandler(comparePlanVersions));

// POST restaurar uma versão anterior
router.post('/:planId/versions/:versionId/restore', asyncHandler(restorePlanVersion));

export default router;
