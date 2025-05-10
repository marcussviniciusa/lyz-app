import { Request, Response } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
/**
 * Upload a file to MinIO
 */
export declare const uploadFile: (req: Request, res: Response) => Promise<void>;
/**
 * Get file by ID (object name)
 */
export declare const getFile: (req: Request, res: Response) => Promise<void>;
/**
 * Delete file
 */
export declare const deleteFile: (req: Request, res: Response) => Promise<void>;
/**
 * List files by category or plan
 */
export declare const listFiles: (req: Request, res: Response) => Promise<void>;
