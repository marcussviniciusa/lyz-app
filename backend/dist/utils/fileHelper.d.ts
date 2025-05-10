/**
 * Get a pre-signed URL for accessing a file from MinIO
 *
 * @param bucketName MinIO bucket name
 * @param objectName Object name / path in the bucket
 * @param expirySeconds URL expiration time in seconds (default: 24 hours)
 * @returns Pre-signed URL to access the object
 */
export declare const getFileUrl: (bucketName: string, objectName: string, expirySeconds?: number) => Promise<string>;
/**
 * Get a pre-signed URL for uploading a file to MinIO
 *
 * @param bucketName MinIO bucket name
 * @param objectName Object name / path in the bucket
 * @param expirySeconds URL expiration time in seconds (default: 1 hour)
 * @returns Pre-signed URL to upload to the specified location
 */
export declare const getUploadUrl: (bucketName: string, objectName: string, expirySeconds?: number) => Promise<string>;
/**
 * Get metadata for a file
 *
 * @param bucketName MinIO bucket name
 * @param objectName Object name / path in the bucket
 * @returns Object with file metadata
 */
export declare const getFileMetadata: (bucketName: string, objectName: string) => Promise<any>;
