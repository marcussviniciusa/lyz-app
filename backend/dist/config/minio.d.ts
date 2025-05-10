import * as Minio from 'minio';
declare const minioClient: Minio.Client;
declare const defaultBucket: string;
declare const materialsBucket: string;
declare const initBucket: () => Promise<void>;
export { minioClient, defaultBucket, materialsBucket, initBucket };
