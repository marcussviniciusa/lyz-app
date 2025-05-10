import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserRole } from '../models/User';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user: {
        _id: mongoose.Types.ObjectId;
        name: string;
        email: string;
        role: UserRole;
        company: mongoose.Types.ObjectId;
        isActive: boolean;
        lastLogin?: Date;
      };
      file?: Express.Multer.File;
    }
  }
}

declare module 'express' {
  interface Router {
    get(path: string, handler: RequestHandler | RequestHandler[]): Router;
    post(path: string, handler: RequestHandler | RequestHandler[]): Router;
    put(path: string, handler: RequestHandler | RequestHandler[]): Router;
    delete(path: string, handler: RequestHandler | RequestHandler[]): Router;
    patch(path: string, handler: RequestHandler | RequestHandler[]): Router;
    use(handler: RequestHandler | RequestHandler[]): Router;
  }

  interface RequestHandler {
    (req: Request, res: Response, next?: NextFunction): void | Promise<void> | Response<any> | Promise<Response<any>>;
  }
}

export {};
