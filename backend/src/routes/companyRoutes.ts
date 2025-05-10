import express, { Router, RequestHandler } from 'express';
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
} from '../controllers/companyController';
import { authenticateToken, isSuperAdmin } from '../middleware/auth';

const router: Router = express.Router();

// Cast controllers to RequestHandler type for TypeScript compatibility
const getAllCompaniesHandler: RequestHandler = getAllCompanies;
const getCompanyByIdHandler: RequestHandler = getCompanyById;
const createCompanyHandler: RequestHandler = createCompany;
const updateCompanyHandler: RequestHandler = updateCompany;
const deleteCompanyHandler: RequestHandler = deleteCompany;

// Cast middleware to RequestHandler type
const authMiddleware: RequestHandler = authenticateToken;
const superAdminMiddleware: RequestHandler = isSuperAdmin;

// Apply authentication middleware to all routes
router.use(authMiddleware, superAdminMiddleware);

// GET all companies
router.get('/', getAllCompaniesHandler);

// GET company by ID
router.get('/:id', getCompanyByIdHandler);

// POST create new company
router.post('/', createCompanyHandler);

// PUT update company
router.put('/:id', updateCompanyHandler);

// DELETE (soft delete) company
router.delete('/:id', deleteCompanyHandler);

export default router;
