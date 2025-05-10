"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexingService = void 0;
const text_splitter_1 = require("langchain/text_splitter");
const Material_1 = __importStar(require("../../models/Material"));
const textExtractorService_1 = __importDefault(require("./textExtractorService"));
/**
 * Serviço para indexação de materiais educativos
 */
class IndexingService {
    constructor() {
        this.chunkSize = 1000; // Tamanho alvo para cada chunk
        this.chunkOverlap = 200; // Sobreposição entre chunks
    }
    /**
     * Processa um material recém-enviado para indexação
     */
    async processMaterial(materialId) {
        try {
            // Buscar material no banco de dados
            const material = await Material_1.default.findById(materialId);
            if (!material) {
                throw new Error(`Material com ID ${materialId} não encontrado`);
            }
            // Atualizar status para processando
            material.processingStatus = Material_1.MaterialProcessingStatus.PROCESSING;
            await material.save();
            // Extrair texto do arquivo
            const objectName = `${material.company}/${material.fileName}`;
            const extractionResult = await textExtractorService_1.default.extractTextFromMinioObject(objectName, material.fileType);
            if (extractionResult.error || !extractionResult.textContent) {
                material.processingStatus = Material_1.MaterialProcessingStatus.FAILED;
                material.metadata = {
                    ...material.metadata,
                    processingError: extractionResult.error || 'Texto extraído vazio'
                };
                await material.save();
                return {
                    materialId: material.id,
                    chunks: [],
                    totalChunks: 0,
                    success: false,
                    error: extractionResult.error || 'Falha ao extrair texto do material'
                };
            }
            // Dividir o texto em chunks para indexação
            const textSplitter = new text_splitter_1.RecursiveCharacterTextSplitter({
                chunkSize: this.chunkSize,
                chunkOverlap: this.chunkOverlap
            });
            const splitText = await textSplitter.splitText(extractionResult.textContent);
            // Obter o ID do documento para usar nos chunks
            const docId = material.id;
            // Criar chunks indexados
            const chunks = splitText.map((text, index) => ({
                id: `${docId}-chunk-${index}`,
                text,
                metadata: {
                    materialId: docId,
                    materialTitle: material.title,
                    materialCategory: material.category,
                    chunkIndex: index,
                    author: material.author,
                    tags: material.tags,
                    pageNumber: this.estimatePageNumber(index, extractionResult.pageCount || 0, splitText.length)
                }
            }));
            // Atualizar material com o texto extraído e metadados
            material.textContent = extractionResult.textContent;
            material.processingStatus = Material_1.MaterialProcessingStatus.INDEXED;
            material.lastIndexed = new Date();
            material.metadata = {
                ...material.metadata,
                ...extractionResult.metadata,
                chunkCount: chunks.length,
                processedAt: new Date()
            };
            await material.save();
            return {
                materialId: materialId,
                chunks,
                totalChunks: chunks.length,
                success: true
            };
        }
        catch (error) {
            console.error('Erro ao processar material:', error);
            // Em caso de erro, atualizar status do material
            try {
                await Material_1.default.findByIdAndUpdate(materialId, {
                    processingStatus: Material_1.MaterialProcessingStatus.FAILED,
                    'metadata.processingError': error.message || 'Erro desconhecido'
                });
            }
            catch (updateError) {
                console.error('Erro ao atualizar status do material após falha:', updateError);
            }
            return {
                materialId,
                chunks: [],
                totalChunks: 0,
                success: false,
                error: error.message || 'Erro desconhecido ao processar material'
            };
        }
    }
    /**
     * Busca materiais educativos com base em uma consulta
     */
    async searchMaterials(query, filters = {}) {
        const searchQuery = {};
        // Adicionar consulta de texto
        if (query) {
            searchQuery.$text = { $search: query };
        }
        // Adicionar filtros
        if (filters.categories && filters.categories.length > 0) {
            searchQuery.category = { $in: filters.categories };
        }
        if (filters.tags && filters.tags.length > 0) {
            searchQuery.tags = { $in: filters.tags };
        }
        if (filters.companyId) {
            searchQuery.company = filters.companyId;
        }
        // Somente materiais indexados
        searchQuery.processingStatus = Material_1.MaterialProcessingStatus.INDEXED;
        const materials = await Material_1.default.find(searchQuery)
            .sort({ score: { $meta: 'textScore' } })
            .limit(50);
        return materials;
    }
    /**
     * Recupera todos os chunks (ou um subconjunto) de um material específico
     */
    async getMaterialChunks(materialId) {
        const material = await Material_1.default.findById(materialId);
        if (!material || !material.textContent || material.processingStatus !== Material_1.MaterialProcessingStatus.INDEXED) {
            return [];
        }
        // Reindexar o material para obter os chunks
        const textSplitter = new text_splitter_1.RecursiveCharacterTextSplitter({
            chunkSize: this.chunkSize,
            chunkOverlap: this.chunkOverlap
        });
        const splitText = await textSplitter.splitText(material.textContent);
        // Criar chunks indexados
        const docId = material.id;
        return splitText.map((text, index) => ({
            id: `${docId}-chunk-${index}`,
            text,
            metadata: {
                materialId: docId,
                materialTitle: material.title,
                materialCategory: material.category,
                chunkIndex: index,
                author: material.author,
                tags: material.tags,
                pageNumber: this.estimatePageNumber(index, material.metadata?.pageCount || 0, splitText.length)
            }
        }));
    }
    /**
     * Reprocessa todos os materiais com status FAILED ou PENDING
     */
    async reprocessFailedMaterials() {
        const materialsToProcess = await Material_1.default.find({
            processingStatus: { $in: [Material_1.MaterialProcessingStatus.FAILED, Material_1.MaterialProcessingStatus.PENDING] }
        });
        let success = 0;
        let failures = 0;
        for (const material of materialsToProcess) {
            const result = await this.processMaterial(material.id);
            if (result.success) {
                success++;
            }
            else {
                failures++;
            }
        }
        return { success, failures };
    }
    /**
     * Estima o número da página com base no índice do chunk
     * Útil para recuperar a informação aproximada de onde o chunk está no documento
     */
    estimatePageNumber(chunkIndex, totalPages, totalChunks) {
        if (totalPages <= 1 || totalChunks <= 1)
            return undefined;
        // Estima página proporcional ao índice do chunk
        const estimatedPage = Math.floor((chunkIndex / totalChunks) * totalPages) + 1;
        return Math.min(estimatedPage, totalPages);
    }
}
exports.indexingService = new IndexingService();
exports.default = exports.indexingService;
