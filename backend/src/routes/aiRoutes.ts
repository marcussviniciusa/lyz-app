import express, { Router } from 'express';
import { asyncHandler } from '../utils/routeTypes';
import {
  analyzeExamResults,
  analyzeTCM,
  analyzeIFM,
  createFinalPlan,
  refinePlan,
  getAgentContext
} from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Analyze lab exams
router.post('/analyze-exams', asyncHandler(analyzeExamResults));

// Analyze TCM observations
router.post('/analyze-tcm', asyncHandler(analyzeTCM));

// Analyze using IFM Matrix
router.post('/analyze-ifm', asyncHandler(analyzeIFM));

// Generate final plan
router.post('/generate-plan', asyncHandler(createFinalPlan));

// Refine existing plan
router.post('/refine-plan', asyncHandler(refinePlan));

// Get agent context
router.get('/context/:planId/:agentType', asyncHandler(getAgentContext));

export default router;
