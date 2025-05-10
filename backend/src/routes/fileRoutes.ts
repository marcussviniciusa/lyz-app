import express, { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/routeTypes';
import { upload, uploadFile, uploadMultipleFiles, getFile, deleteFile, listFiles } from '../controllers/fileController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// All file routes require authentication
router.use(authenticateToken);

// Helpers para combinar multer e asyncHandler
const handleSingleFileUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    uploadFile(req, res);
  } catch (error) {
    next(error);
  }
};

const handleMultipleFileUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    uploadMultipleFiles(req, res);
  } catch (error) {
    next(error);
  }
};

// Upload file - uses multer middleware for file handling
router.post('/upload', upload.single('file'), handleSingleFileUpload);

// Upload multiple files
router.post('/upload-multiple', upload.array('files', 10), handleMultipleFileUpload);

// Get file by ID
router.get('/:fileId', asyncHandler(getFile));

// Delete file
router.delete('/:fileId', asyncHandler(deleteFile));

// List files with optional filtering
router.get('/', asyncHandler(listFiles));

export default router;
