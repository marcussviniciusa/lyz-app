import { Request, Response } from 'express';
/**
 * Get all prompts
 */
export declare const getAllPrompts: (req: Request, res: Response) => Promise<void>;
/**
 * Get prompt by ID
 */
export declare const getPromptById: (req: Request, res: Response) => Promise<void>;
/**
 * Create a new prompt
 */
export declare const createPrompt: (req: Request, res: Response) => Promise<void>;
/**
 * Update an existing prompt
 */
export declare const updatePrompt: (req: Request, res: Response) => Promise<void>;
/**
 * Delete a prompt
 */
export declare const deletePrompt: (req: Request, res: Response) => Promise<void>;
/**
 * Set a prompt as active and all others of the same type as inactive
 */
export declare const setPromptActive: (req: Request, res: Response) => Promise<void>;
