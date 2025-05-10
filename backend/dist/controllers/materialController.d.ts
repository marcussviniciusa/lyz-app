import { Request, Response } from 'express';
/**
 * Upload de material educativo
 */
export declare const uploadMaterial: (req: Request, res: Response) => Promise<void>;
/**
 * Listar materiais educativos
 */
export declare const listMaterials: (req: Request, res: Response) => Promise<void>;
/**
 * Obter detalhes de um material educativo
 */
export declare const getMaterial: (req: Request, res: Response) => Promise<void>;
/**
 * Atualizar detalhes de um material educativo
 */
export declare const updateMaterial: (req: Request, res: Response) => Promise<void>;
/**
 * Excluir um material educativo
 */
export declare const deleteMaterial: (req: Request, res: Response) => Promise<void>;
/**
 * Buscar materiais por termo de pesquisa
 */
export declare const searchMaterials: (req: Request, res: Response) => Promise<void>;
/**
 * Obter chunks de texto de um material específico para uso com IA
 */
export declare const getMaterialChunks: (req: Request, res: Response) => Promise<void>;
/**
 * Reprocessar um material com falha
 */
export declare const reprocessMaterial: (req: Request, res: Response) => Promise<void>;
