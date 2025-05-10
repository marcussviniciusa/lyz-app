'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import useAuthStore from '@/store/authStore';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword, error, isLoading, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      clearError();
      await forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (error) {
      // Error is handled by the store
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-emerald-700">L</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-emerald-700">Lyz.ai</h1>
              <p className="text-gray-600 mt-2">Recuperação de senha</p>
            </div>

            <div className="text-center p-6 bg-emerald-50 rounded-lg mb-6">
              <Mail size={40} className="mx-auto text-emerald-600 mb-4" />
              <h2 className="text-xl font-semibold text-emerald-700 mb-2">Email enviado!</h2>
              <p className="text-gray-600 mb-4">
                Enviamos instruções para redefinir sua senha para o seu email. Por favor, verifique sua caixa de entrada e siga as instruções.
              </p>
              <p className="text-gray-500 text-sm">
                Se você não receber o email em alguns minutos, verifique sua pasta de spam ou lixo eletrônico.
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
              >
                <ArrowLeft size={16} className="mr-1" />
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          {/* Cabeçalho */}
          <div className="flex items-center mb-6">
            <Link href="/auth/login" className="flex items-center text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out mr-auto">
              <ArrowLeft size={18} className="mr-1" />
              <span className="text-sm">Voltar para o login</span>
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-emerald-700">L</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-emerald-700">Lyz.ai</h1>
            <p className="text-gray-600 mt-2">Recuperação de senha</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start">
                <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Digite seu endereço de email e enviaremos instruções para redefinir sua senha.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  autoFocus
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out mt-6 shadow-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Mail size={18} className="mr-2" />
              )}
              <span className="font-medium">Enviar instruções</span>
            </button>
          </form>

          <div className="text-center mt-8 border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-600">
              Lembrou sua senha?{' '}
              <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-500 font-medium transition duration-150 ease-in-out">
                Voltar para o login
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Se você continuar tendo problemas para acessar sua conta, entre em contato com o suporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
