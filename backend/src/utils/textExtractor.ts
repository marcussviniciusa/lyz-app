import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';

/**
 * Extrai texto de um arquivo PDF
 * @param filePath Caminho do arquivo PDF
 * @returns Texto extraído do PDF
 */
export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  try {
    console.log(`Iniciando extração de texto do PDF: ${filePath}`);
    const dataBuffer = fs.readFileSync(filePath);
    console.log(`PDF carregado em buffer, tamanho: ${dataBuffer.length} bytes`);
    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text || '';
    console.log(`Texto extraído do PDF, tamanho: ${extractedText.length} caracteres. Amostra: ${extractedText.substring(0, 100)}`);
    return extractedText;
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    console.error('Detalhes do erro:', (error as Error).stack || (error as Error).message || JSON.stringify(error));
    return `[Erro ao processar PDF: ${(error as Error).message || 'Erro desconhecido'}]`;
  }
};

/**
 * Extrai texto de uma imagem usando OCR
 * @param filePath Caminho do arquivo de imagem
 * @returns Texto extraído da imagem
 */
export const extractTextFromImage = async (filePath: string): Promise<string> => {
  try {
    console.log(`Iniciando OCR da imagem: ${filePath}`);
    const { data } = await Tesseract.recognize(filePath, 'por+eng', {
      logger: m => console.log(`Tesseract OCR (${filePath}):`, m)
    });
    const extractedText = data.text || '';
    console.log(`Texto extraído da imagem, tamanho: ${extractedText.length} caracteres. Amostra: ${extractedText.substring(0, 100)}`);
    return extractedText;
  } catch (error) {
    console.error('Erro ao extrair texto da imagem:', error);
    console.error('Detalhes do erro:', (error as Error).stack || (error as Error).message || JSON.stringify(error));
    return `[Erro ao processar imagem: ${(error as Error).message || 'Erro desconhecido'}]`;
  }
};

/**
 * Extrai texto de um arquivo baseado em seu tipo MIME
 * @param filePath Caminho do arquivo
 * @param mimeType Tipo MIME do arquivo
 * @returns Texto extraído do arquivo
 */
export const extractTextFromFile = async (filePath: string, mimeType: string): Promise<string> => {
  console.log(`Extraindo texto do arquivo: ${filePath}, tipo MIME: ${mimeType}`);
  
  if (mimeType.startsWith('application/pdf')) {
    console.log(`Processando como PDF: ${filePath}`);
    return extractTextFromPDF(filePath);
  } else if (mimeType.startsWith('image/')) {
    console.log(`Processando como imagem: ${filePath}`);
    return extractTextFromImage(filePath);
  } else {
    console.log(`Tipo de arquivo não suportado: ${mimeType} para ${filePath}`);
    return `[Tipo de arquivo não suportado para extração de texto: ${mimeType}]`;
  }
};

/**
 * Extrai texto de múltiplos arquivos
 * @param files Lista de arquivos com caminhos e tipos MIME
 * @returns Objeto com textos extraídos por nome de arquivo
 */
export const extractTextFromFiles = async (files: Array<{ path: string; mimetype: string; originalname: string }>): Promise<{[filename: string]: string}> => {
  console.log(`Iniciando extração de texto de ${files.length} arquivo(s):`, 
    files.map(f => `${f.originalname} (${f.mimetype})`).join(', '));
  
  const results: {[filename: string]: string} = {};
  
  for (const file of files) {
    console.log(`Processando arquivo: ${file.originalname} (${file.mimetype})`);
    try {
      const text = await extractTextFromFile(file.path, file.mimetype);
      results[file.originalname] = text;
      console.log(`Arquivo processado com sucesso: ${file.originalname}. Tamanho do texto: ${text.length} caracteres`);
    } catch (error) {
      console.error(`Erro ao processar arquivo ${file.originalname}:`, error);
      results[file.originalname] = `[Erro ao processar arquivo: ${(error as Error).message || 'Erro desconhecido'}]`;
    }
  }
  
  console.log(`Extração de texto concluída para ${Object.keys(results).length} arquivo(s)`);
  return results;
};
