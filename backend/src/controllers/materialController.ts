import { Request, Response } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import Material, { MaterialCategory, MaterialProcessingStatus } from '../models/Material';
import minioService from '../services/storage/minioService';
import indexingService from '../services/storage/indexingService';
import mongoose from 'mongoose';

// Configuração do Multer para upload temporário
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(os.tmpdir(), 'lyz-uploads');
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const originalExt = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${originalExt}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Verificar tipos de arquivo permitidos
  const allowedTypes = [
    // Documentos de texto
    'text/plain', 'text/markdown', 'text/csv',
    // PDFs
    'application/pdf', 
    // Documentos Office
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Documentos OpenOffice/LibreOffice
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // Limite de 50MB
});

/**
 * Upload de material educativo
 */
export const uploadMaterial = async (req: Request, res: Response): Promise<void> => {
  const uploadMiddleware = upload.single('file');
  
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      res.status(400).json({
        status: 'error',
        message: err.message
      });
      return;
    }
    
    try {
      const file = req.file;
      
      if (!file) {
        res.status(400).json({
          status: 'error',
          message: 'Nenhum arquivo enviado'
        });
        return;
      }
      
      const { 
        title, 
        description, 
        category, 
        author, 
        tags, 
        publicationDate,
        isPublic
      } = req.body;
      
      // Validações
      if (!title || !description || !category || !author) {
        res.status(400).json({
          status: 'error',
          message: 'Todos os campos obrigatórios devem ser fornecidos'
        });
        return;
      }
      
      // Verificar se a categoria é válida
      if (!Object.values(MaterialCategory).includes(category)) {
        res.status(400).json({
          status: 'error',
          message: 'Categoria inválida'
        });
        return;
      }
      
      // Upload do arquivo para o MinIO
      const uploadedFile = await minioService.uploadFile(
        file.path,
        file.originalname,
        file.mimetype,
        req.user.company
      );
      
      // Criar documento no banco de dados
      const parsedTags = tags ? JSON.parse(tags) : [];
      
      const material = new Material({
        title,
        description,
        category,
        tags: parsedTags,
        author,
        publicationDate: publicationDate || undefined,
        fileUrl: uploadedFile.fileUrl,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        fileType: uploadedFile.fileType,
        contentType: uploadedFile.contentType,
        processingStatus: MaterialProcessingStatus.PENDING,
        uploadedBy: req.user._id,
        company: req.user.company,
        isPublic: isPublic === 'true'
      });
      
      await material.save();
      
      // Iniciar processamento assíncrono
      indexingService.processMaterial(material.id)
        .catch(error => console.error(`Erro ao processar material ${material.id}:`, error));
      
      // Limpar arquivo temporário
      fs.unlinkSync(file.path);
      
      res.status(201).json({
        status: 'success',
        data: {
          material: {
            id: material._id,
            title: material.title,
            description: material.description,
            category: material.category,
            fileName: material.fileName,
            fileUrl: material.fileUrl,
            processingStatus: material.processingStatus
          }
        }
      });
    } catch (error) {
      console.error('Erro no upload de material:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erro ao processar upload do material'
      });
      
      // Limpar arquivo temporário em caso de erro
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  });
};

/**
 * Listar materiais educativos
 */
export const listMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      category,
      search, 
      page = '1', 
      limit = '10',
      tags,
      status
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Construir query
    const query: any = {
      company: req.user.company
    };
    
    if (category) {
      query.category = category;
    }
    
    if (tags) {
      const tagList = (tags as string).split(',');
      query.tags = { $in: tagList };
    }
    
    if (status) {
      query.processingStatus = status;
    }
    
    // Busca por texto
    if (search) {
      query.$text = { $search: search as string };
    }
    
    // Executar query
    const materials = await Material.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Material.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      data: {
        materials,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar materiais:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao listar materiais'
    });
  }
};

/**
 * Obter detalhes de um material educativo
 */
export const getMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        status: 'error',
        message: 'ID de material inválido'
      });
      return;
    }
    
    const material = await Material.findById(id);
    
    if (!material) {
      res.status(404).json({
        status: 'error',
        message: 'Material não encontrado'
      });
      return;
    }
    
    // Verificar se o usuário tem acesso ao material
    if (material.company.toString() !== req.user.company.toString() && !material.isPublic) {
      res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para acessar este material'
      });
      return;
    }
    
    // Gerar URL atualizada para acesso ao arquivo
    const objectName = `${material.company}/${material.fileName}`;
    const fileUrl = await minioService.getPresignedUrl(objectName, 3600); // URL válida por 1 hora
    
    res.status(200).json({
      status: 'success',
      data: {
        material: {
          ...material.toObject(),
          fileUrl
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter material:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao obter detalhes do material'
    });
  }
};

/**
 * Atualizar detalhes de um material educativo
 */
export const updateMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      category, 
      author, 
      tags, 
      publicationDate,
      isPublic
    } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        status: 'error',
        message: 'ID de material inválido'
      });
      return;
    }
    
    const material = await Material.findById(id);
    
    if (!material) {
      res.status(404).json({
        status: 'error',
        message: 'Material não encontrado'
      });
      return;
    }
    
    // Verificar se o usuário tem permissão para editar o material
    if (material.company.toString() !== req.user.company.toString()) {
      res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para editar este material'
      });
      return;
    }
    
    // Atualizar campos
    if (title) material.title = title;
    if (description) material.description = description;
    if (category && Object.values(MaterialCategory).includes(category as MaterialCategory)) {
      material.category = category as MaterialCategory;
    }
    if (author) material.author = author;
    if (tags) material.tags = JSON.parse(tags);
    if (publicationDate) material.publicationDate = new Date(publicationDate);
    if (isPublic !== undefined) material.isPublic = isPublic === 'true';
    
    await material.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar material'
    });
  }
};

/**
 * Excluir um material educativo
 */
export const deleteMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        status: 'error',
        message: 'ID de material inválido'
      });
      return;
    }
    
    const material = await Material.findById(id);
    
    if (!material) {
      res.status(404).json({
        status: 'error',
        message: 'Material não encontrado'
      });
      return;
    }
    
    // Verificar se o usuário tem permissão para excluir o material
    if (material.company.toString() !== req.user.company.toString()) {
      res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para excluir este material'
      });
      return;
    }
    
    // Excluir arquivo do MinIO
    const objectName = `${material.company}/${material.fileName}`;
    await minioService.deleteFile(objectName);
    
    // Excluir do banco de dados
    await Material.findByIdAndDelete(id);
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Erro ao excluir material:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao excluir material'
    });
  }
};

/**
 * Buscar materiais por termo de pesquisa
 */
export const searchMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, categories, tags } = req.body;
    
    if (!query) {
      res.status(400).json({
        status: 'error',
        message: 'É necessário fornecer um termo de busca'
      });
      return;
    }
    
    const results = await indexingService.searchMaterials(
      query,
      {
        categories: categories ? categories.split(',') : undefined,
        tags: tags ? tags.split(',') : undefined,
        companyId: req.user.company
      }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        results
      }
    });
  } catch (error) {
    console.error('Erro na busca de materiais:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar materiais'
    });
  }
};

/**
 * Obter chunks de texto de um material específico para uso com IA
 */
export const getMaterialChunks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        status: 'error',
        message: 'ID de material inválido'
      });
      return;
    }
    
    const material = await Material.findById(id);
    
    if (!material) {
      res.status(404).json({
        status: 'error',
        message: 'Material não encontrado'
      });
      return;
    }
    
    // Verificar se o usuário tem acesso ao material
    if (material.company.toString() !== req.user.company.toString() && !material.isPublic) {
      res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para acessar este material'
      });
      return;
    }
    
    // Verificar se o material foi processado
    if (material.processingStatus !== MaterialProcessingStatus.INDEXED) {
      res.status(400).json({
        status: 'error',
        message: 'Este material ainda não foi processado para indexação'
      });
      return;
    }
    
    const chunks = await indexingService.getMaterialChunks(id);
    
    res.status(200).json({
      status: 'success',
      data: {
        material: {
          id: material._id,
          title: material.title,
          category: material.category,
          author: material.author
        },
        chunks
      }
    });
  } catch (error) {
    console.error('Erro ao obter chunks do material:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao obter chunks do material'
    });
  }
};

/**
 * Reprocessar um material com falha
 */
export const reprocessMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        status: 'error',
        message: 'ID de material inválido'
      });
      return;
    }
    
    const material = await Material.findById(id);
    
    if (!material) {
      res.status(404).json({
        status: 'error',
        message: 'Material não encontrado'
      });
      return;
    }
    
    // Verificar se o usuário tem permissão
    if (material.company.toString() !== req.user.company.toString()) {
      res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para reprocessar este material'
      });
      return;
    }
    
    // Atualizar status
    material.processingStatus = MaterialProcessingStatus.PENDING;
    await material.save();
    
    // Iniciar processamento assíncrono
    indexingService.processMaterial(id)
      .catch(error => console.error(`Erro ao reprocessar material ${id}:`, error));
    
    res.status(200).json({
      status: 'success',
      data: {
        message: 'Material enviado para reprocessamento',
        material: {
          id: material._id,
          processingStatus: material.processingStatus
        }
      }
    });
  } catch (error) {
    console.error('Erro ao reprocessar material:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao reprocessar material'
    });
  }
};
