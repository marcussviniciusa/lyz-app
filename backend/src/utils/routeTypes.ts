import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Utility to wrap asynchronous route handlers to ensure proper error propagation
 * This will allow Express to properly catch errors in async routes
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * Type to help properly type async request handlers in Express
 */
export type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Type to help properly type synchronous request handlers in Express
 */
export type SyncRequestHandler = (req: Request, res: Response, next: NextFunction) => void;
