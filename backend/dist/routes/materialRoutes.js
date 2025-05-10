"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const materialController_1 = require("../controllers/materialController");
const auth_1 = require("../middleware/auth");
const routeTypes_1 = require("../utils/routeTypes");
const router = express_1.default.Router();
// Proteger todas as rotas com autenticação
router.use(auth_1.authenticateToken);
// Rotas para materiais educativos
router.post('/upload', materialController_1.uploadMaterial); // Não usa asyncHandler pois multer já gerencia as promessas
router.get('/', (0, routeTypes_1.asyncHandler)(materialController_1.listMaterials));
router.get('/:id', (0, routeTypes_1.asyncHandler)(materialController_1.getMaterial));
router.patch('/:id', (0, routeTypes_1.asyncHandler)(materialController_1.updateMaterial));
router.delete('/:id', (0, routeTypes_1.asyncHandler)(materialController_1.deleteMaterial));
router.post('/search', (0, routeTypes_1.asyncHandler)(materialController_1.searchMaterials));
router.get('/:id/chunks', (0, routeTypes_1.asyncHandler)(materialController_1.getMaterialChunks));
router.post('/:id/reprocess', (0, routeTypes_1.asyncHandler)(materialController_1.reprocessMaterial));
exports.default = router;
