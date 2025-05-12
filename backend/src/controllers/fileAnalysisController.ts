import { Request, Response } from 'express';
import * as fs from 'fs';
import { extractTextFromFiles } from '../utils/textExtractor';

/**
 * Controlador para análise de arquivos
 * Extrai texto de arquivos enviados e retorna o conteúdo extraído
 */
export const extractTextFromUploadedFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar se há arquivos enviados
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.log('Erro: Nenhum arquivo recebido na requisição');
      console.log('Corpo da requisição:', req.body);
      console.log('Headers da requisição:', req.headers);
      res.status(400).json({
        status: 'error',
        message: 'Nenhum arquivo enviado'
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    
    console.log(`Iniciando extração de texto de ${files.length} arquivo(s)...`);
    console.log('Detalhes dos arquivos recebidos:');
    
    for (const file of files) {
      console.log(`- ${file.originalname} (${file.mimetype}): ${file.size} bytes, caminho temporário: ${file.path}`);
      // Verificar se o arquivo existe no disco
      if (!fs.existsSync(file.path)) {
        console.error(`ERRO: Arquivo temporário não encontrado no caminho: ${file.path}`);
      } else {
        const stats = fs.statSync(file.path);
        console.log(`  Arquivo confirmado no disco: ${stats.size} bytes, última modificação: ${stats.mtime}`);
      }
    }
    
    // Extrair texto dos arquivos
    const extractedTexts = await extractTextFromFiles(files);
    console.log('Extração concluída. Resumo dos textos extraídos:');
    
    for (const [filename, text] of Object.entries(extractedTexts)) {
      console.log(`- ${filename}: ${typeof text === 'string' ? text.length : 0} caracteres`);
      if (typeof text === 'string' && text.startsWith('[Erro')) {
        console.log(`  ALERTA: Erro na extração de ${filename}: ${text}`);
      }
    }
    
    // Limpar arquivos temporários
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log(`Arquivo temporário removido: ${file.path}`);
        } catch (err) {
          console.error(`Erro ao remover arquivo temporário ${file.path}:`, err);
        }
      }
    }
    
    console.log('Enviando resposta com textos extraídos...');
    res.status(200).json({
      status: 'success',
      data: {
        extractedTexts
      }
    });
  } catch (error) {
    console.error('Erro ao analisar arquivos:', error);
    console.error('Detalhes do erro:', (error as Error).stack || JSON.stringify(error));
    
    // Limpar arquivos temporários em caso de erro
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
            console.log(`Arquivo temporário removido após erro: ${file.path}`);
          } catch (err) {
            console.error(`Erro ao remover arquivo temporário ${file.path} após erro:`, err);
          }
        }
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Falha ao analisar os arquivos',
      error: (error as Error).message || 'Erro desconhecido',
      details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
};
