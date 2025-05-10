'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '../auth/ProtectedRoute';

interface AuthProviderProps {
  children: ReactNode;
}

// Este é um componente cliente que envolve o ProtectedRoute
export default function AuthProvider({ children }: AuthProviderProps) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
