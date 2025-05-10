/**
 * Inicializa o bucket se não existir
 */
export declare const initializeBucket: () => Promise<void>;
/**
 * Gera um nome de arquivo único para armazenamento
 */
export declare const generateUniqueFileName: (originalFileName: string) => string;
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
export declare const uploadFile: (filePath: string, originalFileName: string, contentType: string, companyId: string) => Promise<UploadedFile>;
/**
 * Obtém URL de acesso temporário a um arquivo
 */
export declare const getPresignedUrl: (objectName: string, expiryInSeconds?: number) => Promise<string>;
/**
 * Remove um arquivo do MinIO
 */
export declare const deleteFile: (objectName: string) => Promise<void>;
/**
 * Faz download de um arquivo do MinIO para o sistema de arquivos local
 */
export declare const downloadFile: (objectName: string, destinationPath: string) => Promise<void>;
declare const _default: {
    initializeBucket: () => Promise<void>;
    uploadFile: (filePath: string, originalFileName: string, contentType: string, companyId: string) => Promise<UploadedFile>;
    getPresignedUrl: (objectName: string, expiryInSeconds?: number) => Promise<string>;
    deleteFile: (objectName: string) => Promise<void>;
    downloadFile: (objectName: string, destinationPath: string) => Promise<void>;
    generateUniqueFileName: (originalFileName: string) => string;
};
export default _default;
