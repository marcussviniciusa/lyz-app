declare module 'minio' {
  export interface ItemBucketMetadata {
    name: string;
    prefix: string;
    size: number;
    etag: string;
    lastModified: Date;
  }
  
  export class Client {
    constructor(options: {
      endPoint: string;
      port: number;
      useSSL: boolean;
      accessKey: string;
      secretKey: string;
    });
    
    // Bucket operations
    makeBucket(bucketName: string, region: string): Promise<void>;
    bucketExists(bucketName: string): Promise<boolean>;
    setBucketPolicy(bucketName: string, policy: string): Promise<void>;
    
    // Object operations
    putObject(bucketName: string, objectName: string, stream: any, size: number, metaData?: any): Promise<any>;
    fPutObject(bucketName: string, objectName: string, filePath: string, metaData?: any): Promise<any>;
    getObject(bucketName: string, objectName: string): Promise<any>;
    fGetObject(bucketName: string, objectName: string, filePath: string): Promise<any>;
    statObject(bucketName: string, objectName: string): Promise<any>;
    removeObject(bucketName: string, objectName: string): Promise<void>;
    
    // Presigned operations
    presignedGetObject(bucketName: string, objectName: string, expiry: number): Promise<string>;
    presignedPutObject(bucketName: string, objectName: string, expiry: number): Promise<string>;
    
    // List operations
    listObjects(bucketName: string, prefix?: string, recursive?: boolean): any;
    listObjectsV2(bucketName: string, prefix?: string, recursive?: boolean, startAfter?: string): any;
  }
}
