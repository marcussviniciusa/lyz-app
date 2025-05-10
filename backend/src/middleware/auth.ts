import { Request, Response, NextFunction } from 'express';
import User, { UserRole } from '../models/User';
import { verifyToken } from '../utils/jwt';
import mongoose from 'mongoose';

// Middleware to authenticate JWT tokens
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Log detalhado para debugging
    console.log('Auth headers:', req.headers.authorization ? 'Present (not showing token)' : 'Missing');
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    
    if (!token) {
      console.log('Authentication failed: No token provided');
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }
    
    // Tratamento mais robusto para verificação de token
    let decodedToken;
    try {
      decodedToken = verifyToken(token);
      if (!decodedToken) {
        console.log('Authentication failed: Token verification returned null');
        res.status(403).json({ status: 'error', message: 'Invalid or expired token' });
        return;
      }
    } catch (tokenError) {
      console.log('Authentication failed: Token verification error', tokenError);
      res.status(403).json({ status: 'error', message: 'Invalid or expired token' });
      return;
    }
    
    // Log para rastrear o processo de autenticação
    console.log(`Token verified for user ID: ${decodedToken.userId}`);
    
    try {
      // Find user in database with extended timeout
      const user = await Promise.race<any>([
        User.findById(decodedToken.userId).select('-password'),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 30000) // Aumentado para 30 segundos
        )
      ]);
      
      if (!user) {
        console.log(`Authentication failed: User not found for ID ${decodedToken.userId}`);
        res.status(403).json({ status: 'error', message: 'User not found' });
        return;
      }
      
      if (!user.isActive) {
        console.log(`Authentication failed: User ${decodedToken.userId} is inactive`);
        res.status(403).json({ status: 'error', message: 'User account is inactive' });
        return;
      }
      
      // Log de sucesso
      console.log(`User ${user._id} (${user.email}) authenticated successfully`);
      
      // Attach user to request object
      req.user = user;
      
      next();
    } catch (dbError) {
      console.error('Database error during authentication:', dbError);
      res.status(500).json({ 
        status: 'error', 
        message: 'Database error during authentication', 
        details: dbError instanceof Error ? dbError.message : String(dbError) 
      });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Authentication error', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
};

// Middleware to check if user is a superadmin
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === UserRole.SUPERADMIN) {
    next();
    return;
  }
  
  res.status(403).json({ status: 'error', message: 'Superadmin privileges required' });
};
