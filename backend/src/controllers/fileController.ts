import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { minioClient } from '../config/minio';
import { ItemBucketMetadata } from 'minio';
import { extractTextFromFiles } from '../utils/textExtractor';

// File helper functions (inlined to resolve import issues)
const getFileUrl = async (
  bucketName: string,
  objectName: string,
  expirySeconds = 24 * 60 * 60
): Promise<string> => {
  try {
    // Generate a presigned URL for retrieving the object
    const url = await minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
    return url;
  } catch (error) {
    console.error('Error generating file URL:', error);
    throw error;
  }
};

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../temp');
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter to validate file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images, PDFs, and common document formats
  const allowedFileTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and common document formats are allowed.'));
  }
};

// Initialize multer with our configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB size limit
  }
});

/**
 * Upload a file to MinIO
 */
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
      return;
    }

    const { planId, examId, category = 'general' } = req.body;
    
    // MinIO bucket and object information
    const bucketName = process.env.MINIO_BUCKET || 'lyz-documents';
    const objectName = `${req.user._id}/${category}/${path.basename(req.file.path)}`;
    const filePath = req.file.path;
    const fileType = req.file.mimetype;

    // Upload the file to MinIO
    await minioClient.fPutObject(bucketName, objectName, filePath, {
      'Content-Type': fileType,
      'X-Amz-Meta-User-Id': req.user._id.toString(),
      'X-Amz-Meta-Plan-Id': planId || '',
      'X-Amz-Meta-Exam-Id': examId || '',
      'X-Amz-Meta-Category': category
    });

    // Generate a URL to access the file
    const fileUrl = await getFileUrl(bucketName, objectName);

    // Clean up temporary file
    fs.unlinkSync(filePath);

    res.status(200).json({
      status: 'success',
      data: {
        fileId: objectName,
        fileUrl,
        fileName: path.basename(req.file.originalname),
        fileType,
        uploadDate: new Date()
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload file'
    });
  }
};

/**
 * Get file by ID (object name)
 */
export const getFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const bucketName = process.env.MINIO_BUCKET || 'lyz-documents';

    // Check if the file exists
    const stat = await minioClient.statObject(bucketName, fileId);
    
    // Verify user has access to this file
    const fileUserId = stat.metaData['x-amz-meta-user-id'];
    
    if (fileUserId !== req.user._id.toString() && req.user.role !== 'superadmin') {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this file'
      });
      return;
    }

    // Generate a temporary URL to access the file
    const fileUrl = await getFileUrl(bucketName, fileId);

    res.status(200).json({
      status: 'success',
      data: {
        fileId,
        fileUrl,
        fileName: path.basename(fileId),
        fileType: stat.metaData['content-type'],
        category: stat.metaData['x-amz-meta-category'] || 'general',
        planId: stat.metaData['x-amz-meta-plan-id'] || null,
        examId: stat.metaData['x-amz-meta-exam-id'] || null
      }
    });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve file'
    });
  }
};

/**
 * Delete file
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const bucketName = process.env.MINIO_BUCKET || 'lyz-documents';

    // Check if the file exists
    const stat = await minioClient.statObject(bucketName, fileId);
    
    // Verify user has access to this file
    const fileUserId = stat.metaData['x-amz-meta-user-id'];
    
    if (fileUserId !== req.user._id.toString() && req.user.role !== 'superadmin') {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this file'
      });
      return;
    }

    // Delete the file
    await minioClient.removeObject(bucketName, fileId);

    res.status(200).json({
      status: 'success',
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete file'
    });
  }
};

/**
 * List files by category or plan
 */
/**
 * Upload multiple files to MinIO
 */
export const uploadMultipleFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar se há arquivos enviados
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'No files uploaded'
      });
      return;
    }

    const { planId, category = 'general' } = req.body;
    const bucketName = process.env.MINIO_BUCKET || 'lyz-documents';
    const uploadedFiles: any[] = [];
    
    // multer.array() sempre retorna um array de arquivos
    const files = req.files as Express.Multer.File[];
    
    console.log(`Extraindo texto de ${files.length} arquivo(s) durante upload...`);
    
    // Extrair texto de todos os arquivos antes do upload
    let extractedTexts = {};
    try {
      extractedTexts = await extractTextFromFiles(files);
      console.log('Textos extraídos com sucesso:', Object.keys(extractedTexts));
    } catch (extractionError) {
      console.error('Erro ao extrair texto dos arquivos:', extractionError);
      // Continuar com o upload mesmo se a extração falhar
    }
    
    // Upload de cada arquivo
    for (const file of files) {
      const objectName = `${req.user._id}/${category}/${path.basename(file.path)}`;
      const filePath = file.path;
      const fileType = file.mimetype;
      
      // Texto extraído deste arquivo (se disponível)
      const extractedText = extractedTexts[file.originalname] || '';

      // Upload do arquivo para o MinIO - NÃO incluir o texto extraído como metadado
      // devido a restrições de caracteres em cabeçalhos HTTP
      await minioClient.fPutObject(bucketName, objectName, filePath, {
        'Content-Type': fileType,
        'X-Amz-Meta-User-Id': req.user._id.toString(),
        'X-Amz-Meta-Plan-Id': planId || '',
        'X-Amz-Meta-Category': category,
        'X-Amz-Meta-Has-Extracted-Text': extractedText ? 'true' : 'false' // Apenas indicar se há texto
      });

      // Gerar URL para acesso ao arquivo
      const fileUrl = await getFileUrl(bucketName, objectName);
      
      // Armazenar o texto extraído apenas no objeto de resposta, não nos metadados do MinIO
      uploadedFiles.push({
        fileId: objectName,
        fileUrl,
        fileName: path.basename(file.originalname),
        fileType,
        uploadDate: new Date(),
        extractedText: extractedText // Incluir o texto completo na resposta
      });

      // Limpar arquivo temporário
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Retornar o sucesso dos uploads incluindo os textos extraídos
    res.status(200).json({
      status: 'success',
      data: {
        files: uploadedFiles,
        message: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso, conteúdo de texto extraído.`
      }
    });
    
    console.log(`Upload completo: ${uploadedFiles.length} arquivo(s) processado(s) com texto extraído`);
    // Log para debug
    uploadedFiles.forEach(file => {
      if (file.extractedText) {
        const textPreview = file.extractedText.substring(0, 100);
        console.log(`Arquivo ${file.fileName}: Extraiu ${file.extractedText.length} caracteres. Amostra: ${textPreview}...`);
      } else {
        console.log(`Arquivo ${file.fileName}: Sem texto extraído.`);
      }
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    
    // Limpar arquivos temporários se existirem
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload files'
    });
  }
};

/**
 * List files by category or plan
 */
export const listFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, planId } = req.query;
    const userId = req.user._id.toString();
    const bucketName = process.env.MINIO_BUCKET || 'lyz-documents';
    
    // List all objects for this user
    const prefix = `${userId}/`;
    
    // Create a stream for listing objects
    const objectsStream = minioClient.listObjects(bucketName, prefix, true);
    
    const files: any[] = [];
    
    // Wait for the 'data' and 'end' events on the stream
    await new Promise<void>((resolve, reject) => {
      objectsStream.on('data', async (obj: ItemBucketMetadata) => {
        try {
          if (!obj.name) return;
          
          // Get object metadata
          const stat = await minioClient.statObject(bucketName, obj.name);
          
          // Filter by category or plan if specified
          if (
            (category && stat.metaData['x-amz-meta-category'] !== category) ||
            (planId && stat.metaData['x-amz-meta-plan-id'] !== planId)
          ) {
            return;
          }
          
          // Get a URL for the file
          const fileUrl = await getFileUrl(bucketName, obj.name);
          
          files.push({
            fileId: obj.name,
            fileUrl,
            fileName: path.basename(obj.name),
            fileType: stat.metaData['content-type'],
            category: stat.metaData['x-amz-meta-category'] || 'general',
            planId: stat.metaData['x-amz-meta-plan-id'] || null,
            examId: stat.metaData['x-amz-meta-exam-id'] || null,
            uploadDate: obj.lastModified ? new Date(obj.lastModified) : new Date()
          });
        } catch (err) {
          console.error('Error processing object:', err);
        }
      });
      
      objectsStream.on('error', (err: Error) => {
        reject(err);
      });
      
      objectsStream.on('end', () => {
        resolve();
      });
    });
    
    res.status(200).json({
      status: 'success',
      results: files.length,
      data: {
        files
      }
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to list files'
    });
  }
};
