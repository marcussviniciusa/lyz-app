"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.textExtractorManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const minioService_1 = __importDefault(require("./minioService"));
/**
 * Classe base para extratores de texto
 */
class TextExtractor {
    canHandle(fileType) {
        return this.supportedTypes.includes(fileType.toLowerCase());
    }
}
/**
 * Extrator para arquivos de texto simples
 */
class TextFileExtractor extends TextExtractor {
    constructor() {
        super(...arguments);
        this.supportedTypes = ['.txt', '.md', '.csv'];
    }
    async extract(filePath) {
        try {
            const text = fs_1.default.readFileSync(filePath, 'utf8');
            return {
                textContent: text,
                metadata: {
                    lineCount: text.split('\n').length,
                    fileType: path_1.default.extname(filePath)
                }
            };
        }
        catch (error) {
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
    constructor() {
        super(...arguments);
        this.supportedTypes = ['.pdf'];
    }
    async extract(filePath) {
        try {
            // Criar arquivo temporário para saída
            const outputPath = path_1.default.join(os_1.default.tmpdir(), `${(0, uuid_1.v4)()}.txt`);
            // Executar pdftotext (parte do pacote poppler-utils)
            (0, child_process_1.execSync)(`pdftotext -layout "${filePath}" "${outputPath}"`);
            // Ler texto extraído
            const text = fs_1.default.readFileSync(outputPath, 'utf8');
            // Limpar arquivo temporário
            fs_1.default.unlinkSync(outputPath);
            return {
                textContent: text,
                pageCount: this.getPageCount(filePath),
                metadata: {
                    extractorUsed: 'pdftotext',
                    fileType: '.pdf'
                }
            };
        }
        catch (error) {
            console.error('Erro ao extrair texto de PDF:', error);
            return {
                textContent: '',
                metadata: {},
                error: 'Falha ao extrair texto do arquivo PDF'
            };
        }
    }
    getPageCount(filePath) {
        try {
            // Comando para contar páginas no PDF (requer pdftk ou pdfinfo)
            const output = (0, child_process_1.execSync)(`pdfinfo "${filePath}" | grep Pages:`).toString();
            const pageCount = parseInt(output.split(':')[1].trim());
            return isNaN(pageCount) ? 0 : pageCount;
        }
        catch (error) {
            console.error('Erro ao obter contagem de páginas do PDF:', error);
            return 0;
        }
    }
}
/**
 * Extrator para documentos Office usando LibreOffice
 */
class OfficeExtractor extends TextExtractor {
    constructor() {
        super(...arguments);
        this.supportedTypes = ['.doc', '.docx', '.rtf', '.odt', '.ppt', '.pptx', '.odp', '.xls', '.xlsx', '.ods'];
    }
    async extract(filePath) {
        try {
            // Criar diretório temporário para saída
            const tempDir = path_1.default.join(os_1.default.tmpdir(), (0, uuid_1.v4)());
            fs_1.default.mkdirSync(tempDir, { recursive: true });
            // Converter para TXT usando LibreOffice
            (0, child_process_1.execSync)(`libreoffice --headless --convert-to txt --outdir "${tempDir}" "${filePath}"`);
            // Encontrar o arquivo convertido
            const fileName = path_1.default.basename(filePath, path_1.default.extname(filePath));
            const outputPath = path_1.default.join(tempDir, `${fileName}.txt`);
            // Ler texto extraído
            const text = fs_1.default.readFileSync(outputPath, 'utf8');
            // Limpar arquivos temporários
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
            return {
                textContent: text,
                metadata: {
                    extractorUsed: 'libreoffice',
                    fileType: path_1.default.extname(filePath)
                }
            };
        }
        catch (error) {
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
    constructor() {
        this.extractors = [
            new TextFileExtractor(),
            new PdfExtractor(),
            new OfficeExtractor()
        ];
    }
    /**
     * Extrai texto de um arquivo baseado no tipo
     */
    async extractText(filePath) {
        const fileType = path_1.default.extname(filePath).toLowerCase();
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
    async extractTextFromMinioObject(objectName, fileType) {
        // Criar arquivo temporário
        const tempFilePath = path_1.default.join(os_1.default.tmpdir(), `${(0, uuid_1.v4)()}${fileType}`);
        try {
            // Download do arquivo do MinIO
            await minioService_1.default.downloadFile(objectName, tempFilePath);
            // Extrair texto
            const result = await this.extractText(tempFilePath);
            return result;
        }
        catch (error) {
            console.error('Erro ao extrair texto de objeto do MinIO:', error);
            return {
                textContent: '',
                metadata: {},
                error: 'Falha ao extrair texto do objeto MinIO'
            };
        }
        finally {
            // Limpar arquivo temporário
            if (fs_1.default.existsSync(tempFilePath)) {
                fs_1.default.unlinkSync(tempFilePath);
            }
        }
    }
}
exports.textExtractorManager = new TextExtractorManager();
exports.default = exports.textExtractorManager;
