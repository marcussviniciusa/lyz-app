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
exports.downloadFile = exports.deleteFile = exports.getPresignedUrl = exports.uploadFile = exports.generateUniqueFileName = exports.initializeBucket = void 0;
const Minio = __importStar(require("minio"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
// Configuração do cliente MinIO
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});
// Nome do bucket para materiais educativos
const MATERIALS_BUCKET = process.env.MINIO_MATERIALS_BUCKET || 'lyz-materials';
/**
 * Inicializa o bucket se não existir
 */
const initializeBucket = async () => {
    try {
        const bucketExists = await minioClient.bucketExists(MATERIALS_BUCKET);
        if (!bucketExists) {
            await minioClient.makeBucket(MATERIALS_BUCKET, process.env.MINIO_REGION || 'us-east-1');
            console.log(`Bucket '${MATERIALS_BUCKET}' criado com sucesso.`);
            // Definir política de bucket como necessário
            // Exemplo: tornar o bucket privado por padrão
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { 'AWS': ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${MATERIALS_BUCKET}/*`],
                        Condition: {
                            StringLike: { 'aws:username': '*@lyz.ai' }
                        }
                    }
                ]
            };
            await minioClient.setBucketPolicy(MATERIALS_BUCKET, JSON.stringify(policy));
        }
    }
    catch (error) {
        console.error('Erro ao inicializar bucket no MinIO:', error);
        throw new Error('Falha ao inicializar sistema de armazenamento');
    }
};
exports.initializeBucket = initializeBucket;
/**
 * Gera um nome de arquivo único para armazenamento
 */
const generateUniqueFileName = (originalFileName) => {
    const fileExtension = path_1.default.extname(originalFileName);
    const baseName = path_1.default.basename(originalFileName, fileExtension);
    const timestamp = Date.now();
    const uuid = (0, uuid_1.v4)().substring(0, 8);
    return `${baseName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}-${uuid}${fileExtension}`;
};
exports.generateUniqueFileName = generateUniqueFileName;
/**
 * Faz upload de um arquivo para o MinIO
 */
const uploadFile = async (filePath, originalFileName, contentType, companyId) => {
    try {
        // Verificar se o bucket existe
        await (0, exports.initializeBucket)();
        // Gerar nome de arquivo único
        const uniqueFileName = (0, exports.generateUniqueFileName)(originalFileName);
        // Caminho virtual do arquivo no MinIO
        const objectName = `${companyId}/${uniqueFileName}`;
        // Obter tamanho do arquivo
        const fileStats = fs_1.default.statSync(filePath);
        // Fazer upload do arquivo
        await minioClient.fPutObject(MATERIALS_BUCKET, objectName, filePath, {
            'Content-Type': contentType,
            'X-Amz-Meta-Original-Filename': originalFileName,
            'X-Amz-Meta-Company-Id': companyId
        });
        // Gerar URL presigned para acesso ao arquivo (expira em 7 dias por padrão)
        const fileUrl = await minioClient.presignedGetObject(MATERIALS_BUCKET, objectName, 60 * 60 * 24 * 7);
        return {
            fileName: uniqueFileName,
            originalName: originalFileName,
            fileSize: fileStats.size,
            fileType: path_1.default.extname(originalFileName),
            fileUrl,
            contentType
        };
    }
    catch (error) {
        console.error('Erro ao fazer upload do arquivo para o MinIO:', error);
        throw new Error('Falha ao fazer upload do arquivo');
    }
};
exports.uploadFile = uploadFile;
/**
 * Obtém URL de acesso temporário a um arquivo
 */
const getPresignedUrl = async (objectName, expiryInSeconds = 3600) => {
    try {
        return await minioClient.presignedGetObject(MATERIALS_BUCKET, objectName, expiryInSeconds);
    }
    catch (error) {
        console.error('Erro ao gerar URL presigned:', error);
        throw new Error('Falha ao gerar URL de acesso ao arquivo');
    }
};
exports.getPresignedUrl = getPresignedUrl;
/**
 * Remove um arquivo do MinIO
 */
const deleteFile = async (objectName) => {
    try {
        await minioClient.removeObject(MATERIALS_BUCKET, objectName);
    }
    catch (error) {
        console.error('Erro ao remover arquivo do MinIO:', error);
        throw new Error('Falha ao remover arquivo');
    }
};
exports.deleteFile = deleteFile;
/**
 * Faz download de um arquivo do MinIO para o sistema de arquivos local
 */
const downloadFile = async (objectName, destinationPath) => {
    try {
        await minioClient.fGetObject(MATERIALS_BUCKET, objectName, destinationPath);
    }
    catch (error) {
        console.error('Erro ao fazer download do arquivo do MinIO:', error);
        throw new Error('Falha ao fazer download do arquivo');
    }
};
exports.downloadFile = downloadFile;
exports.default = {
    initializeBucket: exports.initializeBucket,
    uploadFile: exports.uploadFile,
    getPresignedUrl: exports.getPresignedUrl,
    deleteFile: exports.deleteFile,
    downloadFile: exports.downloadFile,
    generateUniqueFileName: exports.generateUniqueFileName
};
