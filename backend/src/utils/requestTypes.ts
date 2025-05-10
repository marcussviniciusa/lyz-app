import { Request } from 'express';
import mongoose from 'mongoose';

// Função utilitária para obter o ID do usuário com segurança
export const getUserId = (req: Request): string => {
  // Verificando se o usuário existe e se tem um _id
  if (!req.user || !req.user._id) {
    throw new Error('User not authenticated or missing ID');
  }

  // Convertendo para string de forma segura
  if (req.user._id instanceof mongoose.Types.ObjectId) {
    return req.user._id.toString();
  }
  
  if (typeof req.user._id === 'string') {
    return req.user._id;
  }
  
  // Se for um objeto com toString()
  if (req.user._id && typeof (req.user._id as any).toString === 'function') {
    return (req.user._id as any).toString();
  }
  
  throw new Error('Invalid user ID format');
};

// Função utilitária para obter a empresa do usuário com segurança
export const getUserCompany = (req: Request): string => {
  // Verificando se o usuário existe e se tem uma empresa
  if (!req.user || !req.user.company) {
    throw new Error('User not authenticated or missing company');
  }

  // Convertendo para string de forma segura
  if (req.user.company instanceof mongoose.Types.ObjectId) {
    return req.user.company.toString();
  }
  
  if (typeof req.user.company === 'string') {
    return req.user.company;
  }
  
  // Se for um objeto com toString()
  if (req.user.company && typeof (req.user.company as any).toString === 'function') {
    return (req.user.company as any).toString();
  }
  
  throw new Error('Invalid company ID format');
};
