import { Request, Response } from 'express';
export declare const analyzeExamResults: (req: Request, res: Response) => Promise<void>;
export declare const analyzeTCM: (req: Request, res: Response) => Promise<void>;
export declare const analyzeIFM: (req: Request, res: Response) => Promise<void>;
export declare const createFinalPlan: (req: Request, res: Response) => Promise<void>;
export declare const refinePlan: (req: Request, res: Response) => Promise<void>;
export declare const getAgentContext: (req: Request, res: Response) => Promise<void>;
