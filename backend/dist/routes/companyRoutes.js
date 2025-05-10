"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const companyController_1 = require("../controllers/companyController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Cast controllers to RequestHandler type for TypeScript compatibility
const getAllCompaniesHandler = companyController_1.getAllCompanies;
const getCompanyByIdHandler = companyController_1.getCompanyById;
const createCompanyHandler = companyController_1.createCompany;
const updateCompanyHandler = companyController_1.updateCompany;
const deleteCompanyHandler = companyController_1.deleteCompany;
// Cast middleware to RequestHandler type
const authMiddleware = auth_1.authenticateToken;
const superAdminMiddleware = auth_1.isSuperAdmin;
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
exports.default = router;
