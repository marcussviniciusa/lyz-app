import { IMaterial } from '../../models/Material';
import mongoose from 'mongoose';
/**
 * Interface para representar um chunk de documento indexado
 */
export interface IndexedChunk {
    id: string;
    text: string;
    metadata: {
        materialId: string;
        materialTitle: string;
        materialCategory: string;
        chunkIndex: number;
        author: string;
        tags: string[];
        pageNumber?: number;
    };
}
/**
 * Interface para resultado da indexação
 */
export interface IndexingResult {
    materialId: string;
    chunks: IndexedChunk[];
    totalChunks: number;
    success: boolean;
    error?: string;
}
/**
 * Serviço para indexação de materiais educativos
 */
declare class IndexingService {
    private readonly chunkSize;
    private readonly chunkOverlap;
    /**
     * Processa um material recém-enviado para indexação
     */
    processMaterial(materialId: string): Promise<IndexingResult>;
    /**
     * Busca materiais educativos com base em uma consulta
     */
    searchMaterials(query: string, filters?: {
        categories?: string[];
        tags?: string[];
        companyId?: string | mongoose.Types.ObjectId;
    }): Promise<IMaterial[]>;
    /**
     * Recupera todos os chunks (ou um subconjunto) de um material específico
     */
    getMaterialChunks(materialId: string): Promise<IndexedChunk[]>;
    /**
     * Reprocessa todos os materiais com status FAILED ou PENDING
     */
    reprocessFailedMaterials(): Promise<{
        success: number;
        failures: number;
    }>;
    /**
     * Estima o número da página com base no índice do chunk
     * Útil para recuperar a informação aproximada de onde o chunk está no documento
     */
    private estimatePageNumber;
}
export declare const indexingService: IndexingService;
export default indexingService;
