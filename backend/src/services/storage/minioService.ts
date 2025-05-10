import * as Minio from 'minio';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
export const initializeBucket = async (): Promise<void> => {
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
            Principal: {'AWS': ['*']},
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${MATERIALS_BUCKET}/*`],
            Condition: {
              StringLike: {'aws:username': '*@lyz.ai'}
            }
          }
        ]
      };
      
      await minioClient.setBucketPolicy(MATERIALS_BUCKET, JSON.stringify(policy));
    }
  } catch (error) {
    console.error('Erro ao inicializar bucket no MinIO:', error);
    throw new Error('Falha ao inicializar sistema de armazenamento');
  }
};

/**
 * Gera um nome de arquivo único para armazenamento
 */
export const generateUniqueFileName = (originalFileName: string): string => {
  const fileExtension = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, fileExtension);
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  
  return `${baseName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}-${uuid}${fileExtension}`;
};

/**
 * Interface para objeto de metadados de upload
 */
export interface UploadedFile {
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  contentType: string;
}

/**
 * Faz upload de um arquivo para o MinIO
 */
export const uploadFile = async (
  filePath: string,
  originalFileName: string,
  contentType: string,
  companyId: string
): Promise<UploadedFile> => {
  try {
    // Verificar se o bucket existe
    await initializeBucket();
    
    // Gerar nome de arquivo único
    const uniqueFileName = generateUniqueFileName(originalFileName);
    
    // Caminho virtual do arquivo no MinIO
    const objectName = `${companyId}/${uniqueFileName}`;
    
    // Obter tamanho do arquivo
    const fileStats = fs.statSync(filePath);
    
    // Fazer upload do arquivo
    await minioClient.fPutObject(
      MATERIALS_BUCKET,
      objectName,
      filePath,
      {
        'Content-Type': contentType,
        'X-Amz-Meta-Original-Filename': originalFileName,
        'X-Amz-Meta-Company-Id': companyId
      }
    );
    
    // Gerar URL presigned para acesso ao arquivo (expira em 7 dias por padrão)
    const fileUrl = await minioClient.presignedGetObject(
      MATERIALS_BUCKET,
      objectName,
      60 * 60 * 24 * 7
    );
    
    return {
      fileName: uniqueFileName,
      originalName: originalFileName,
      fileSize: fileStats.size,
      fileType: path.extname(originalFileName),
      fileUrl,
      contentType
    };
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo para o MinIO:', error);
    throw new Error('Falha ao fazer upload do arquivo');
  }
};

/**
 * Obtém URL de acesso temporário a um arquivo
 */
export const getPresignedUrl = async (
  objectName: string,
  expiryInSeconds: number = 3600
): Promise<string> => {
  try {
    return await minioClient.presignedGetObject(
      MATERIALS_BUCKET,
      objectName,
      expiryInSeconds
    );
  } catch (error) {
    console.error('Erro ao gerar URL presigned:', error);
    throw new Error('Falha ao gerar URL de acesso ao arquivo');
  }
};

/**
 * Remove um arquivo do MinIO
 */
export const deleteFile = async (objectName: string): Promise<void> => {
  try {
    await minioClient.removeObject(MATERIALS_BUCKET, objectName);
  } catch (error) {
    console.error('Erro ao remover arquivo do MinIO:', error);
    throw new Error('Falha ao remover arquivo');
  }
};

/**
 * Faz download de um arquivo do MinIO para o sistema de arquivos local
 */
export const downloadFile = async (
  objectName: string,
  destinationPath: string
): Promise<void> => {
  try {
    await minioClient.fGetObject(MATERIALS_BUCKET, objectName, destinationPath);
  } catch (error) {
    console.error('Erro ao fazer download do arquivo do MinIO:', error);
    throw new Error('Falha ao fazer download do arquivo');
  }
};

export default {
  initializeBucket,
  uploadFile,
  getPresignedUrl,
  deleteFile,
  downloadFile,
  generateUniqueFileName
};
