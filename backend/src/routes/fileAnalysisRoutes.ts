import { Router, Request, Response, NextFunction } from 'express';
import { extractTextFromUploadedFiles } from '../controllers/fileAnalysisController';
import { upload } from '../controllers/fileController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Middleware de autenticação
router.use(authenticateToken);

/**
 * Middleware para tratar upload de múltiplos arquivos para análise de texto
 */
const handleFilesForTextExtraction = (req: Request, res: Response, next: NextFunction) => {
  try {
    extractTextFromUploadedFiles(req, res);
  } catch (error) {
    next(error);
  }
};

// Rota para extrair texto dos arquivos enviados
router.post('/extract-text', upload.array('files', 10), handleFilesForTextExtraction);

// Rota de teste simplificada para diagnosticar problemas
router.post('/test-upload', upload.array('files', 10), (req, res) => {
  console.log('=============== TESTE DE UPLOAD ===============');
  console.log('Requisição recebida na rota de teste');
  
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    console.log('Nenhum arquivo recebido na rota de teste');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    res.status(400).json({ status: 'error', message: 'Nenhum arquivo enviado no teste' });
    return;
  }
  
  const files = req.files as Express.Multer.File[];
  console.log(`Recebidos ${files.length} arquivos no teste:`);
  
  const fileDetails = files.map(file => ({
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path
  }));
  
  console.log('Detalhes dos arquivos:', JSON.stringify(fileDetails, null, 2));
  console.log('=============== FIM DO TESTE ===============');
  
  res.status(200).json({
    status: 'success',
    message: 'Teste de upload concluído',
    files: fileDetails
  });
});

export default router;
