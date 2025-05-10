/**
 * Interface para resultado da extração de texto
 */
export interface ExtractedTextResult {
    textContent: string;
    pageCount?: number;
    metadata: Record<string, any>;
    error?: string;
}
/**
 * Gerenciador de extratores que escolhe o extrator apropriado
 */
declare class TextExtractorManager {
    private extractors;
    /**
     * Extrai texto de um arquivo baseado no tipo
     */
    extractText(filePath: string): Promise<ExtractedTextResult>;
    /**
     * Extrai texto de um arquivo do MinIO
     */
    extractTextFromMinioObject(objectName: string, fileType: string): Promise<ExtractedTextResult>;
}
export declare const textExtractorManager: TextExtractorManager;
export default textExtractorManager;
