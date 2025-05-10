import { Request, Response } from 'express';
import { IPlanVersion } from '../models/PlanVersion';
export declare const getPlanVersions: (req: Request, res: Response) => Promise<void>;
export declare const getPlanVersionById: (req: Request, res: Response) => Promise<void>;
export declare const comparePlanVersions: (req: Request, res: Response) => Promise<void>;
export declare const restorePlanVersion: (req: Request, res: Response) => Promise<void>;
export declare const createPlanVersion: (planId: string, userId: string, companyId: string, snapshot: any, changeDescription: string, changedSections?: string[]) => Promise<IPlanVersion | null>;
