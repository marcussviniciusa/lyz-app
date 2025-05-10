import { minioClient } from '../config/minio';

/**
 * Get a pre-signed URL for accessing a file from MinIO
 * 
 * @param bucketName MinIO bucket name
 * @param objectName Object name / path in the bucket
 * @param expirySeconds URL expiration time in seconds (default: 24 hours)
 * @returns Pre-signed URL to access the object
 */
export const getFileUrl = async (
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

/**
 * Get a pre-signed URL for uploading a file to MinIO
 * 
 * @param bucketName MinIO bucket name
 * @param objectName Object name / path in the bucket
 * @param expirySeconds URL expiration time in seconds (default: 1 hour)
 * @returns Pre-signed URL to upload to the specified location
 */
export const getUploadUrl = async (
  bucketName: string,
  objectName: string,
  expirySeconds = 60 * 60
): Promise<string> => {
  try {
    // Generate a presigned URL for putting an object
    const url = await minioClient.presignedPutObject(bucketName, objectName, expirySeconds);
    return url;
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw error;
  }
};

/**
 * Get metadata for a file
 * 
 * @param bucketName MinIO bucket name
 * @param objectName Object name / path in the bucket
 * @returns Object with file metadata
 */
export const getFileMetadata = async (
  bucketName: string,
  objectName: string
): Promise<any> => {
  try {
    const stat = await minioClient.statObject(bucketName, objectName);
    return stat.metaData;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
};
