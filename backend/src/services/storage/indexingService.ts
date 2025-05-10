import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import Material, { MaterialProcessingStatus, IMaterial } from '../../models/Material';
import textExtractorManager from './textExtractorService';
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
class IndexingService {
  private readonly chunkSize = 1000; // Tamanho alvo para cada chunk
  private readonly chunkOverlap = 200; // Sobreposição entre chunks
  
  /**
   * Processa um material recém-enviado para indexação
   */
  async processMaterial(materialId: string): Promise<IndexingResult> {
    try {
      // Buscar material no banco de dados
      const material = await Material.findById(materialId) as IMaterial | null;
      
      if (!material) {
        throw new Error(`Material com ID ${materialId} não encontrado`);
      }
      
      // Atualizar status para processando
      material.processingStatus = MaterialProcessingStatus.PROCESSING;
      await material.save();
      
      // Extrair texto do arquivo
      const objectName = `${material.company}/${material.fileName}`;
      const extractionResult = await textExtractorManager.extractTextFromMinioObject(
        objectName,
        material.fileType
      );
      
      if (extractionResult.error || !extractionResult.textContent) {
        material.processingStatus = MaterialProcessingStatus.FAILED;
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
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: this.chunkSize,
        chunkOverlap: this.chunkOverlap
      });
      
      const splitText = await textSplitter.splitText(extractionResult.textContent);
      
      // Obter o ID do documento para usar nos chunks
      const docId = material.id;
      
      // Criar chunks indexados
      const chunks: IndexedChunk[] = splitText.map((text, index) => ({
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
      material.processingStatus = MaterialProcessingStatus.INDEXED;
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
    } catch (error) {
      console.error('Erro ao processar material:', error);
      
      // Em caso de erro, atualizar status do material
      try {
        await Material.findByIdAndUpdate(materialId, {
          processingStatus: MaterialProcessingStatus.FAILED,
          'metadata.processingError': (error as Error).message || 'Erro desconhecido'
        });
      } catch (updateError) {
        console.error('Erro ao atualizar status do material após falha:', updateError);
      }
      
      return {
        materialId,
        chunks: [],
        totalChunks: 0,
        success: false,
        error: (error as Error).message || 'Erro desconhecido ao processar material'
      };
    }
  }
  
  /**
   * Busca materiais educativos com base em uma consulta
   */
  async searchMaterials(query: string, filters: {
    categories?: string[],
    tags?: string[],
    companyId?: string | mongoose.Types.ObjectId
  } = {}): Promise<IMaterial[]> {
    const searchQuery: any = {};
    
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
    searchQuery.processingStatus = MaterialProcessingStatus.INDEXED;
    
    const materials = await Material.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .limit(50);
    
    return materials;
  }
  
  /**
   * Recupera todos os chunks (ou um subconjunto) de um material específico
   */
  async getMaterialChunks(materialId: string): Promise<IndexedChunk[]> {
    const material = await Material.findById(materialId);
    
    if (!material || !material.textContent || material.processingStatus !== MaterialProcessingStatus.INDEXED) {
      return [];
    }
    
    // Reindexar o material para obter os chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
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
  async reprocessFailedMaterials(): Promise<{ success: number; failures: number }> {
    const materialsToProcess = await Material.find({
      processingStatus: { $in: [MaterialProcessingStatus.FAILED, MaterialProcessingStatus.PENDING] }
    }) as IMaterial[];
    
    let success = 0;
    let failures = 0;
    
    for (const material of materialsToProcess) {
      const result = await this.processMaterial(material.id);
      
      if (result.success) {
        success++;
      } else {
        failures++;
      }
    }
    
    return { success, failures };
  }
  
  /**
   * Estima o número da página com base no índice do chunk
   * Útil para recuperar a informação aproximada de onde o chunk está no documento
   */
  private estimatePageNumber(chunkIndex: number, totalPages: number, totalChunks: number): number | undefined {
    if (totalPages <= 1 || totalChunks <= 1) return undefined;
    
    // Estima página proporcional ao índice do chunk
    const estimatedPage = Math.floor((chunkIndex / totalChunks) * totalPages) + 1;
    return Math.min(estimatedPage, totalPages);
  }
}

export const indexingService = new IndexingService();

export default indexingService;
