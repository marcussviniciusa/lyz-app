import * as Minio from 'minio';
import dotenv from 'dotenv';

dotenv.config();

// MinIO client instance
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

// Bucket names
const defaultBucket = process.env.MINIO_BUCKET || 'lyz-documents';
const materialsBucket = process.env.MINIO_MATERIALS_BUCKET || 'lyz-materials';

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
    } else {
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
            Principal: {'AWS': ['*']},
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${materialsBucket}/*`],
            Condition: {
              StringLike: {'aws:username': '*@lyz.ai'}
            }
          }
        ]
      };
      
      await minioClient.setBucketPolicy(materialsBucket, JSON.stringify(materialsPolicy));
    } else {
      console.log(`Bucket '${materialsBucket}' already exists`);
    }
  } catch (error) {
    console.error('Error initializing MinIO buckets:', error);
  }
};

export { minioClient, defaultBucket, materialsBucket, initBucket };
