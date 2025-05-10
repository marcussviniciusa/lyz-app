"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFiles = exports.deleteFile = exports.getFile = exports.uploadFile = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const minio_1 = require("../config/minio");
// File helper functions (inlined to resolve import issues)
const getFileUrl = async (bucketName, objectName, expirySeconds = 24 * 60 * 60) => {
    try {
        // Generate a presigned URL for retrieving the object
        const url = await minio_1.minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
        return url;
    }
    catch (error) {
        console.error('Error generating file URL:', error);
        throw error;
    }
};
// Configure multer for temporary file storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path_1.default.join(__dirname, '../../temp');
        // Ensure temp directory exists
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
// File filter to validate file types
const fileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new Error('Invalid file type. Only images, PDFs, and common document formats are allowed.'));
    }
};
// Initialize multer with our configuration
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB size limit
    }
});
/**
 * Upload a file to MinIO
 */
const uploadFile = async (req, res) => {
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
        const objectName = `${req.user._id}/${category}/${path_1.default.basename(req.file.path)}`;
        const filePath = req.file.path;
        const fileType = req.file.mimetype;
        // Upload the file to MinIO
        await minio_1.minioClient.fPutObject(bucketName, objectName, filePath, {
            'Content-Type': fileType,
            'X-Amz-Meta-User-Id': req.user._id.toString(),
            'X-Amz-Meta-Plan-Id': planId || '',
            'X-Amz-Meta-Exam-Id': examId || '',
            'X-Amz-Meta-Category': category
        });
        // Generate a URL to access the file
        const fileUrl = await getFileUrl(bucketName, objectName);
        // Clean up temporary file
        fs_1.default.unlinkSync(filePath);
        res.status(200).json({
            status: 'success',
            data: {
                fileId: objectName,
                fileUrl,
                fileName: path_1.default.basename(req.file.originalname),
                fileType,
                uploadDate: new Date()
            }
        });
    }
    catch (error) {
        console.error('Error uploading file:', error);
        // Clean up temporary file if it exists
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({
            status: 'error',
            message: 'Failed to upload file'
        });
    }
};
exports.uploadFile = uploadFile;
/**
 * Get file by ID (object name)
 */
const getFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const bucketName = process.env.MINIO_BUCKET || 'lyz-documents';
        // Check if the file exists
        const stat = await minio_1.minioClient.statObject(bucketName, fileId);
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
                fileName: path_1.default.basename(fileId),
                fileType: stat.metaData['content-type'],
                category: stat.metaData['x-amz-meta-category'] || 'general',
                planId: stat.metaData['x-amz-meta-plan-id'] || null,
                examId: stat.metaData['x-amz-meta-exam-id'] || null
            }
        });
    }
    catch (error) {
        console.error('Error getting file:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve file'
        });
    }
};
exports.getFile = getFile;
/**
 * Delete file
 */
const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const bucketName = process.env.MINIO_BUCKET || 'lyz-documents';
        // Check if the file exists
        const stat = await minio_1.minioClient.statObject(bucketName, fileId);
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
        await minio_1.minioClient.removeObject(bucketName, fileId);
        res.status(200).json({
            status: 'success',
            message: 'File deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete file'
        });
    }
};
exports.deleteFile = deleteFile;
/**
 * List files by category or plan
 */
const listFiles = async (req, res) => {
    try {
        const { category, planId } = req.query;
        const userId = req.user._id.toString();
        const bucketName = process.env.MINIO_BUCKET || 'lyz-documents';
        // List all objects for this user
        const prefix = `${userId}/`;
        // Create a stream for listing objects
        const objectsStream = minio_1.minioClient.listObjects(bucketName, prefix, true);
        const files = [];
        // Wait for the 'data' and 'end' events on the stream
        await new Promise((resolve, reject) => {
            objectsStream.on('data', async (obj) => {
                try {
                    if (!obj.name)
                        return;
                    // Get object metadata
                    const stat = await minio_1.minioClient.statObject(bucketName, obj.name);
                    // Filter by category or plan if specified
                    if ((category && stat.metaData['x-amz-meta-category'] !== category) ||
                        (planId && stat.metaData['x-amz-meta-plan-id'] !== planId)) {
                        return;
                    }
                    // Get a URL for the file
                    const fileUrl = await getFileUrl(bucketName, obj.name);
                    files.push({
                        fileId: obj.name,
                        fileUrl,
                        fileName: path_1.default.basename(obj.name),
                        fileType: stat.metaData['content-type'],
                        category: stat.metaData['x-amz-meta-category'] || 'general',
                        planId: stat.metaData['x-amz-meta-plan-id'] || null,
                        examId: stat.metaData['x-amz-meta-exam-id'] || null,
                        uploadDate: obj.lastModified ? new Date(obj.lastModified) : new Date()
                    });
                }
                catch (err) {
                    console.error('Error processing object:', err);
                }
            });
            objectsStream.on('error', (err) => {
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
    }
    catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to list files'
        });
    }
};
exports.listFiles = listFiles;
