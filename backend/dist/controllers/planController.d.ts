import { Request, Response } from 'express';
export declare const getAllPlans: (req: Request, res: Response) => Promise<void>;
export declare const getPlanById: (req: Request, res: Response) => Promise<void>;
export declare const createPlan: (req: Request, res: Response) => Promise<void>;
export declare const updatePlan: (req: Request, res: Response) => Promise<void>;
export declare const deletePlan: (req: Request, res: Response) => Promise<void>;
export declare const archivePlan: (req: Request, res: Response) => Promise<void>;
export declare const generateSharingLink: (req: Request, res: Response) => Promise<void>;
export declare const viewSharedPlan: (req: Request, res: Response) => Promise<void>;
