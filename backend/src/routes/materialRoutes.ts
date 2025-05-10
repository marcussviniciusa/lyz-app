import express, { Router } from 'express';
import { 
  uploadMaterial,
  listMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial,
  searchMaterials,
  getMaterialChunks,
  reprocessMaterial
} from '../controllers/materialController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../utils/routeTypes';

const router: Router = express.Router();

// Proteger todas as rotas com autenticação
router.use(authenticateToken);

// Rotas para materiais educativos
router.post('/upload', uploadMaterial); // Não usa asyncHandler pois multer já gerencia as promessas
router.get('/', asyncHandler(listMaterials));
router.get('/:id', asyncHandler(getMaterial));
router.patch('/:id', asyncHandler(updateMaterial));
router.delete('/:id', asyncHandler(deleteMaterial));
router.post('/search', asyncHandler(searchMaterials));
router.get('/:id/chunks', asyncHandler(getMaterialChunks));
router.post('/:id/reprocess', asyncHandler(reprocessMaterial));

export default router;
