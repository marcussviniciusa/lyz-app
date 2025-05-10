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
exports.initBucket = exports.materialsBucket = exports.defaultBucket = exports.minioClient = void 0;
const Minio = __importStar(require("minio"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// MinIO client instance
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});
exports.minioClient = minioClient;
// Bucket names
const defaultBucket = process.env.MINIO_BUCKET || 'lyz-documents';
exports.defaultBucket = defaultBucket;
const materialsBucket = process.env.MINIO_MATERIALS_BUCKET || 'lyz-materials';
exports.materialsBucket = materialsBucket;
// Initialize buckets if they don't exist
const initBucket = async () => {
    try {
        // Inicializar bucket de documentos padrão
        const defaultBucketExists = await minioClient.bucketExists(defaultBucket);
        if (!defaultBucketExists) {
            await minioClient.makeBucket(defaultBucket, 'us-east-1');
            console.log(`Bucket '${defaultBucket}' created successfully`);
            // Set bucket policy to allow public read access
            const defaultPolicy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${defaultBucket}/*`]
                    }
                ]
            };
            await minioClient.setBucketPolicy(defaultBucket, JSON.stringify(defaultPolicy));
        }
        else {
            console.log(`Bucket '${defaultBucket}' already exists`);
        }
        // Inicializar bucket de materiais educativos
        const materialsBucketExists = await minioClient.bucketExists(materialsBucket);
        if (!materialsBucketExists) {
            await minioClient.makeBucket(materialsBucket, 'us-east-1');
            console.log(`Bucket '${materialsBucket}' created successfully`);
            // Set bucket policy para materiais - acesso privado
            const materialsPolicy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { 'AWS': ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${materialsBucket}/*`],
                        Condition: {
                            StringLike: { 'aws:username': '*@lyz.ai' }
                        }
                    }
                ]
            };
            await minioClient.setBucketPolicy(materialsBucket, JSON.stringify(materialsPolicy));
        }
        else {
            console.log(`Bucket '${materialsBucket}' already exists`);
        }
    }
    catch (error) {
        console.error('Error initializing MinIO buckets:', error);
    }
};
exports.initBucket = initBucket;
