"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reprocessMaterial = exports.getMaterialChunks = exports.searchMaterials = exports.deleteMaterial = exports.updateMaterial = exports.getMaterial = exports.listMaterials = exports.uploadMaterial = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const Material_1 = __importStar(require("../models/Material"));
const minioService_1 = __importDefault(require("../services/storage/minioService"));
const indexingService_1 = __importDefault(require("../services/storage/indexingService"));
const mongoose_1 = __importDefault(require("mongoose"));
// Configuração do Multer para upload temporário
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path_1.default.join(os_1.default.tmpdir(), 'lyz-uploads');
        fs_1.default.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${(0, uuid_1.v4)()}`;
        const originalExt = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${originalExt}`);
    }
});
const fileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // Limite de 50MB
});
/**
 * Upload de material educativo
 */
const uploadMaterial = async (req, res) => {
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
            const { title, description, category, author, tags, publicationDate, isPublic } = req.body;
            // Validações
            if (!title || !description || !category || !author) {
                res.status(400).json({
                    status: 'error',
                    message: 'Todos os campos obrigatórios devem ser fornecidos'
                });
                return;
            }
            // Verificar se a categoria é válida
            if (!Object.values(Material_1.MaterialCategory).includes(category)) {
                res.status(400).json({
                    status: 'error',
                    message: 'Categoria inválida'
                });
                return;
            }
            // Upload do arquivo para o MinIO
            const uploadedFile = await minioService_1.default.uploadFile(file.path, file.originalname, file.mimetype, req.user.company);
            // Criar documento no banco de dados
            const parsedTags = tags ? JSON.parse(tags) : [];
            const material = new Material_1.default({
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
                processingStatus: Material_1.MaterialProcessingStatus.PENDING,
                uploadedBy: req.user._id,
                company: req.user.company,
                isPublic: isPublic === 'true'
            });
            await material.save();
            // Iniciar processamento assíncrono
            indexingService_1.default.processMaterial(material.id)
                .catch(error => console.error(`Erro ao processar material ${material.id}:`, error));
            // Limpar arquivo temporário
            fs_1.default.unlinkSync(file.path);
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
        }
        catch (error) {
            console.error('Erro no upload de material:', error);
            res.status(500).json({
                status: 'error',
                message: 'Erro ao processar upload do material'
            });
            // Limpar arquivo temporário em caso de erro
            if (req.file && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
        }
    });
};
exports.uploadMaterial = uploadMaterial;
/**
 * Listar materiais educativos
 */
const listMaterials = async (req, res) => {
    try {
        const { category, search, page = '1', limit = '10', tags, status } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Construir query
        const query = {
            company: req.user.company
        };
        if (category) {
            query.category = category;
        }
        if (tags) {
            const tagList = tags.split(',');
            query.tags = { $in: tagList };
        }
        if (status) {
            query.processingStatus = status;
        }
        // Busca por texto
        if (search) {
            query.$text = { $search: search };
        }
        // Executar query
        const materials = await Material_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = await Material_1.default.countDocuments(query);
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
    }
    catch (error) {
        console.error('Erro ao listar materiais:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao listar materiais'
        });
    }
};
exports.listMaterials = listMaterials;
/**
 * Obter detalhes de um material educativo
 */
const getMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                status: 'error',
                message: 'ID de material inválido'
            });
            return;
        }
        const material = await Material_1.default.findById(id);
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
        const fileUrl = await minioService_1.default.getPresignedUrl(objectName, 3600); // URL válida por 1 hora
        res.status(200).json({
            status: 'success',
            data: {
                material: {
                    ...material.toObject(),
                    fileUrl
                }
            }
        });
    }
    catch (error) {
        console.error('Erro ao obter material:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao obter detalhes do material'
        });
    }
};
exports.getMaterial = getMaterial;
/**
 * Atualizar detalhes de um material educativo
 */
const updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, author, tags, publicationDate, isPublic } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                status: 'error',
                message: 'ID de material inválido'
            });
            return;
        }
        const material = await Material_1.default.findById(id);
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
        if (title)
            material.title = title;
        if (description)
            material.description = description;
        if (category && Object.values(Material_1.MaterialCategory).includes(category)) {
            material.category = category;
        }
        if (author)
            material.author = author;
        if (tags)
            material.tags = JSON.parse(tags);
        if (publicationDate)
            material.publicationDate = new Date(publicationDate);
        if (isPublic !== undefined)
            material.isPublic = isPublic === 'true';
        await material.save();
        res.status(200).json({
            status: 'success',
            data: {
                material
            }
        });
    }
    catch (error) {
        console.error('Erro ao atualizar material:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar material'
        });
    }
};
exports.updateMaterial = updateMaterial;
/**
 * Excluir um material educativo
 */
const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                status: 'error',
                message: 'ID de material inválido'
            });
            return;
        }
        const material = await Material_1.default.findById(id);
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
        await minioService_1.default.deleteFile(objectName);
        // Excluir do banco de dados
        await Material_1.default.findByIdAndDelete(id);
        res.status(200).json({
            status: 'success',
            data: null
        });
    }
    catch (error) {
        console.error('Erro ao excluir material:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao excluir material'
        });
    }
};
exports.deleteMaterial = deleteMaterial;
/**
 * Buscar materiais por termo de pesquisa
 */
const searchMaterials = async (req, res) => {
    try {
        const { query, categories, tags } = req.body;
        if (!query) {
            res.status(400).json({
                status: 'error',
                message: 'É necessário fornecer um termo de busca'
            });
            return;
        }
        const results = await indexingService_1.default.searchMaterials(query, {
            categories: categories ? categories.split(',') : undefined,
            tags: tags ? tags.split(',') : undefined,
            companyId: req.user.company
        });
        res.status(200).json({
            status: 'success',
            data: {
                results
            }
        });
    }
    catch (error) {
        console.error('Erro na busca de materiais:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar materiais'
        });
    }
};
exports.searchMaterials = searchMaterials;
/**
 * Obter chunks de texto de um material específico para uso com IA
 */
const getMaterialChunks = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                status: 'error',
                message: 'ID de material inválido'
            });
            return;
        }
        const material = await Material_1.default.findById(id);
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
        if (material.processingStatus !== Material_1.MaterialProcessingStatus.INDEXED) {
            res.status(400).json({
                status: 'error',
                message: 'Este material ainda não foi processado para indexação'
            });
            return;
        }
        const chunks = await indexingService_1.default.getMaterialChunks(id);
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
    }
    catch (error) {
        console.error('Erro ao obter chunks do material:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao obter chunks do material'
        });
    }
};
exports.getMaterialChunks = getMaterialChunks;
/**
 * Reprocessar um material com falha
 */
const reprocessMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                status: 'error',
                message: 'ID de material inválido'
            });
            return;
        }
        const material = await Material_1.default.findById(id);
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
        material.processingStatus = Material_1.MaterialProcessingStatus.PENDING;
        await material.save();
        // Iniciar processamento assíncrono
        indexingService_1.default.processMaterial(id)
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
    }
    catch (error) {
        console.error('Erro ao reprocessar material:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao reprocessar material'
        });
    }
};
exports.reprocessMaterial = reprocessMaterial;
