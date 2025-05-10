'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isAuthenticated, user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isValidatingToken, setIsValidatingToken] = useState(false);

  // Verifica se a rota atual é pública
  const isPublicRoute = publicRoutes.includes(pathname || '');

  // Usando um ref para evitar loops infinitos
  const validationCounter = useRef(0);
  
  useEffect(() => {
    // Não tente validar token se já estivermos em uma rota pública
    if (isPublicRoute) {
      setIsLoading(false);
      return;
    }

    // Limite a quantidade de tentativas de validação para evitar loops infinitos
    if (validationCounter.current > 2) {
      console.log('Excesso de validações, limitando para evitar loop');
      setIsLoading(false);
      return;
    }

    // Função para validar o token atual
    const validateToken = async () => {
      if (!token) {
        setIsLoading(false);
        if (!isPublicRoute) {
          router.push('/auth/login');
        }
        return;
      }

      try {
        // Incrementa o contador de validações
        validationCounter.current += 1;
        
        setIsValidatingToken(true);
        // Faça uma solicitação para um endpoint protegido para validar o token
        // Verificando se o token é válido usando uma rota protegida simples
        await api.get('/api/auth/validate-token');
        setIsValidatingToken(false);
        setIsLoading(false);
      } catch (error) {
        console.error('Token inválido ou expirado', error);
        // Se houver um erro de autenticação, faça logout e redirecione
        logout();
        setIsValidatingToken(false);
        setIsLoading(false);
        if (!isPublicRoute) {
          router.push('/auth/login');
        }
      }
    };

    // Use um identificador único para a validação atual
    const validationId = Date.now();
    const currentPathname = pathname;
    
    // Somente valide o token se a rota for protegida e não estiver já validando
    if (!isPublicRoute && !isValidatingToken) {
      // Implemente um atraso mínimo para evitar múltiplas tentativas em sequência
      const timeout = setTimeout(() => {
        // Verifica se ainda é a mesma página e validação
        if (currentPathname === pathname && !isValidatingToken) {
          validateToken();
        }
      }, 1000);
      
      return () => clearTimeout(timeout);
    } else {
      setIsLoading(false);
    }
  // Remover router das dependências porque ele muda frequentemente e causa re-execuções
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, pathname, isPublicRoute, isValidatingToken, logout]);

  // Efeito para lidar com redirecionamentos após a renderização
  useEffect(() => {
    if (!isLoading) {
      // Redirecionar usuários autenticados para o dashboard se tentarem acessar páginas de autenticação
      if (isAuthenticated && isPublicRoute) {
        router.push('/dashboard');
      }
      
      // Redirecionar usuários não autenticados para login se tentarem acessar páginas protegidas
      if (!isAuthenticated && !isPublicRoute) {
        router.push('/auth/login');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, isPublicRoute]);
  
  // Se estiver carregando, mostre um spinner ou nada
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se estiver fazendo redirecionamento, não mostre nada
  if ((isAuthenticated && isPublicRoute) || (!isAuthenticated && !isPublicRoute)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
