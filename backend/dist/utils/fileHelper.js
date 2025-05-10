"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileMetadata = exports.getUploadUrl = exports.getFileUrl = void 0;
const minio_1 = require("../config/minio");
/**
 * Get a pre-signed URL for accessing a file from MinIO
 *
 * @param bucketName MinIO bucket name
 * @param objectName Object name / path in the bucket
 * @param expirySeconds URL expiration time in seconds (default: 24 hours)
 * @returns Pre-signed URL to access the object
 */
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
exports.getFileUrl = getFileUrl;
/**
 * Get a pre-signed URL for uploading a file to MinIO
 *
 * @param bucketName MinIO bucket name
 * @param objectName Object name / path in the bucket
 * @param expirySeconds URL expiration time in seconds (default: 1 hour)
 * @returns Pre-signed URL to upload to the specified location
 */
const getUploadUrl = async (bucketName, objectName, expirySeconds = 60 * 60) => {
    try {
        // Generate a presigned URL for putting an object
        const url = await minio_1.minioClient.presignedPutObject(bucketName, objectName, expirySeconds);
        return url;
    }
    catch (error) {
        console.error('Error generating upload URL:', error);
        throw error;
    }
};
exports.getUploadUrl = getUploadUrl;
/**
 * Get metadata for a file
 *
 * @param bucketName MinIO bucket name
 * @param objectName Object name / path in the bucket
 * @returns Object with file metadata
 */
const getFileMetadata = async (bucketName, objectName) => {
    try {
        const stat = await minio_1.minioClient.statObject(bucketName, objectName);
        return stat.metaData;
    }
    catch (error) {
        console.error('Error getting file metadata:', error);
        throw error;
    }
};
exports.getFileMetadata = getFileMetadata;
