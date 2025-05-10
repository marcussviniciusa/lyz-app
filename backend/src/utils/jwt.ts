import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  company: string;
}

// Generate a JWT token
export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  };
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, options);
};

// Verify and decode a JWT token
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET as jwt.Secret) as TokenPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

export { JWT_SECRET };
