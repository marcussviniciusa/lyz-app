// Tipos relacionados à autenticação e usuários do sistema

export type UserRole = 'admin' | 'user' | 'manager';

export type UserStatus = 'active' | 'inactive' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  company: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface CompanyStatus {
  status: 'active' | 'inactive' | 'trial' | 'suspended';
  subscriptionStatus?: 'active' | 'trial' | 'expired' | 'canceled';
  subscriptionEnd?: string;
}

export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  usersCount: number;
  plansCount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  subscriptionStatus?: string;
  subscriptionEnd?: string;
}
