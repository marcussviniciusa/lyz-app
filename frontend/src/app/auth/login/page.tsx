'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn, CheckCircle } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import Image from 'next/image';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error, isLoading, clearError } = useAuthStore();
  
  useEffect(() => {
    // Verificar se o usuário acabou de se registrar
    if (searchParams?.get('registered') === 'true') {
      setRegistrationSuccess(true);
      
      // Remover a mensagem após 5 segundos
      const timer = setTimeout(() => {
        setRegistrationSuccess(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                {/* Aqui poderia ser inserido um logo real */}
                <span className="text-3xl font-bold text-emerald-700">L</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-emerald-700">Lyz.ai</h1>
            <p className="text-gray-600 mt-2">Saúde feminina personalizada</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {registrationSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm mb-4 flex items-start">
                <CheckCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                <span>Conta criada com sucesso! Faça login para continuar.</span>
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="********"
                  autoComplete="current-password"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded transition duration-150 ease-in-out"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Lembrar-me
                </label>
              </div>
              <div className="text-sm">
                <Link href="/auth/forgot-password" className="text-emerald-600 hover:text-emerald-500 transition duration-150 ease-in-out font-medium">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out mt-6 shadow-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <LogIn size={18} className="mr-2" />
              )}
              <span className="font-medium">Entrar</span>
            </button>
          </form>

          <div className="text-center mt-8 border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link href="/auth/register" className="text-emerald-600 hover:text-emerald-500 font-medium transition duration-150 ease-in-out">
                Registrar-se agora
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Ao entrar, você concorda com nossos{' '}
              <Link href="/terms" className="text-emerald-600 hover:underline">
                Termos de Serviço
              </Link>{' '}
              e{' '}
              <Link href="/privacy" className="text-emerald-600 hover:underline">
                Política de Privacidade
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
