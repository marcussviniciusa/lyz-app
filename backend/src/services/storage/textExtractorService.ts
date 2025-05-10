import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import minioService from './minioService';

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
 * Classe base para extratores de texto
 */
abstract class TextExtractor {
  abstract supportedTypes: string[];
  abstract extract(filePath: string): Promise<ExtractedTextResult>;
  
  canHandle(fileType: string): boolean {
    return this.supportedTypes.includes(fileType.toLowerCase());
  }
}

/**
 * Extrator para arquivos de texto simples
 */
class TextFileExtractor extends TextExtractor {
  supportedTypes = ['.txt', '.md', '.csv'];
  
  async extract(filePath: string): Promise<ExtractedTextResult> {
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      return {
        textContent: text,
        metadata: {
          lineCount: text.split('\n').length,
          fileType: path.extname(filePath)
        }
      };
    } catch (error) {
      console.error('Erro ao extrair texto de arquivo texto:', error);
      return {
        textContent: '',
        metadata: {},
        error: 'Falha ao extrair texto do arquivo'
      };
    }
  }
}

/**
 * Extrator para arquivos PDF (requer pdftotext instalado)
 */
class PdfExtractor extends TextExtractor {
  supportedTypes = ['.pdf'];
  
  async extract(filePath: string): Promise<ExtractedTextResult> {
    try {
      // Criar arquivo temporário para saída
      const outputPath = path.join(os.tmpdir(), `${uuidv4()}.txt`);
      
      // Executar pdftotext (parte do pacote poppler-utils)
      execSync(`pdftotext -layout "${filePath}" "${outputPath}"`);
      
      // Ler texto extraído
      const text = fs.readFileSync(outputPath, 'utf8');
      
      // Limpar arquivo temporário
      fs.unlinkSync(outputPath);
      
      return {
        textContent: text,
        pageCount: this.getPageCount(filePath),
        metadata: {
          extractorUsed: 'pdftotext',
          fileType: '.pdf'
        }
      };
    } catch (error) {
      console.error('Erro ao extrair texto de PDF:', error);
      return {
        textContent: '',
        metadata: {},
        error: 'Falha ao extrair texto do arquivo PDF'
      };
    }
  }
  
  private getPageCount(filePath: string): number {
    try {
      // Comando para contar páginas no PDF (requer pdftk ou pdfinfo)
      const output = execSync(`pdfinfo "${filePath}" | grep Pages:`).toString();
      const pageCount = parseInt(output.split(':')[1].trim());
      return isNaN(pageCount) ? 0 : pageCount;
    } catch (error) {
      console.error('Erro ao obter contagem de páginas do PDF:', error);
      return 0;
    }
  }
}

/**
 * Extrator para documentos Office usando LibreOffice
 */
class OfficeExtractor extends TextExtractor {
  supportedTypes = ['.doc', '.docx', '.rtf', '.odt', '.ppt', '.pptx', '.odp', '.xls', '.xlsx', '.ods'];
  
  async extract(filePath: string): Promise<ExtractedTextResult> {
    try {
      // Criar diretório temporário para saída
      const tempDir = path.join(os.tmpdir(), uuidv4());
      fs.mkdirSync(tempDir, { recursive: true });
      
      // Converter para TXT usando LibreOffice
      execSync(`libreoffice --headless --convert-to txt --outdir "${tempDir}" "${filePath}"`);
      
      // Encontrar o arquivo convertido
      const fileName = path.basename(filePath, path.extname(filePath));
      const outputPath = path.join(tempDir, `${fileName}.txt`);
      
      // Ler texto extraído
      const text = fs.readFileSync(outputPath, 'utf8');
      
      // Limpar arquivos temporários
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      return {
        textContent: text,
        metadata: {
          extractorUsed: 'libreoffice',
          fileType: path.extname(filePath)
        }
      };
    } catch (error) {
      console.error('Erro ao extrair texto de documento Office:', error);
      return {
        textContent: '',
        metadata: {},
        error: 'Falha ao extrair texto do arquivo Office'
      };
    }
  }
}

/**
 * Gerenciador de extratores que escolhe o extrator apropriado
 */
class TextExtractorManager {
  private extractors: TextExtractor[] = [
    new TextFileExtractor(),
    new PdfExtractor(),
    new OfficeExtractor()
  ];
  
  /**
   * Extrai texto de um arquivo baseado no tipo
   */
  async extractText(filePath: string): Promise<ExtractedTextResult> {
    const fileType = path.extname(filePath).toLowerCase();
    
    for (const extractor of this.extractors) {
      if (extractor.canHandle(fileType)) {
        return await extractor.extract(filePath);
      }
    }
    
    return {
      textContent: '',
      metadata: {},
      error: `Tipo de arquivo não suportado: ${fileType}`
    };
  }
  
  /**
   * Extrai texto de um arquivo do MinIO
   */
  async extractTextFromMinioObject(
    objectName: string,
    fileType: string
  ): Promise<ExtractedTextResult> {
    // Criar arquivo temporário
    const tempFilePath = path.join(os.tmpdir(), `${uuidv4()}${fileType}`);
    
    try {
      // Download do arquivo do MinIO
      await minioService.downloadFile(objectName, tempFilePath);
      
      // Extrair texto
      const result = await this.extractText(tempFilePath);
      
      return result;
    } catch (error) {
      console.error('Erro ao extrair texto de objeto do MinIO:', error);
      return {
        textContent: '',
        metadata: {},
        error: 'Falha ao extrair texto do objeto MinIO'
      };
    } finally {
      // Limpar arquivo temporário
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }
}

export const textExtractorManager = new TextExtractorManager();

export default textExtractorManager;
