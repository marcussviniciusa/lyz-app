import express, { Router } from 'express';
import { asyncHandler } from '../utils/routeTypes';
import {
  getAllPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
  setPromptActive
} from '../controllers/promptController';
import { authenticateToken, isSuperAdmin } from '../middleware/auth';

const router: Router = express.Router();

// All prompt routes require authentication and superadmin privilege
router.use(authenticateToken);
router.use(isSuperAdmin);

// GET all prompts
router.get('/', asyncHandler(getAllPrompts));

// GET prompt by ID
router.get('/:id', asyncHandler(getPromptById));

// POST create new prompt
router.post('/', asyncHandler(createPrompt));

// PUT update prompt
router.put('/:id', asyncHandler(updatePrompt));

// DELETE prompt
router.delete('/:id', asyncHandler(deletePrompt));

// PATCH set prompt as active
router.patch('/:id/activate', asyncHandler(setPromptActive));

export default router;
