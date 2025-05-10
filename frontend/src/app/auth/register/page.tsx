'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus, Building, User, Lock, ArrowLeft } from 'lucide-react';
import useAuthStore from '@/store/authStore';

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  company: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  terms: z.boolean().refine(val => val === true, {
    message: 'Você deve aceitar os termos para continuar',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formStep, setFormStep] = useState(0); // Para navegação em etapas
  const router = useRouter();
  const { register: registerUser, error, isLoading, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      terms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError();
      await registerUser(data.name, data.email, data.password, data.company);
      router.push('/auth/login?registered=true');
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          {/* Cabeçalho */}
          <div className="flex items-center mb-6">
            <Link href="/auth/login" className="flex items-center text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out mr-auto">
              <ArrowLeft size={18} className="mr-1" />
              <span className="text-sm">Voltar</span>
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-emerald-700">L</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-emerald-700">Lyz.ai</h1>
            <p className="text-gray-600 mt-2">Criar uma nova conta</p>
            
            {/* Indicador de progresso para formulário em etapas */}
            <div className="flex justify-center mt-4 space-x-2">
              <div className={`h-2 w-2 rounded-full ${formStep === 0 ? 'bg-emerald-600' : 'bg-emerald-200'}`}></div>
              <div className={`h-2 w-2 rounded-full ${formStep === 1 ? 'bg-emerald-600' : 'bg-emerald-200'}`}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start">
                <span className="text-red-500 mr-2 flex-shrink-0">!</span>
                <span>{error}</span>
              </div>
            )}

            {formStep === 0 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nome completo</label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Seu nome completo"
                      autoComplete="name"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                  </div>
                  {errors.name && (
                    <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
                  )}
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
                      autoComplete="new-password"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Confirmar senha</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="********"
                      autoComplete="new-password"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={showConfirmPassword ? 'Esconder senha' : 'Mostrar senha'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-xs mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
                
                <div className="pt-4">
                  <button 
                    type="button" 
                    onClick={() => setFormStep(1)}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 ease-in-out shadow-sm"
                  >
                    <span className="font-medium">Próximo</span>
                  </button>
                </div>
              </>
            )}
            
            {formStep === 1 && (
              <>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nome da empresa</label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register('company')}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Nome da sua empresa"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building size={18} className="text-gray-400" />
                    </div>
                  </div>
                  {errors.company && (
                    <p className="text-red-600 text-xs mt-1">{errors.company.message}</p>
                  )}
                </div>

                <div className="flex items-start mt-4">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      {...register('terms')}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded transition duration-150 ease-in-out"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-gray-700">
                      Eu concordo com os{' '}
                      <Link href="/terms" className="text-emerald-600 hover:text-emerald-500 transition duration-150 ease-in-out">
                        Termos de serviço
                      </Link>{' '}
                      e{' '}
                      <Link href="/privacy" className="text-emerald-600 hover:text-emerald-500 transition duration-150 ease-in-out">
                        Política de privacidade
                      </Link>
                    </label>
                    {errors.terms && (
                      <p className="text-red-600 text-xs mt-1">{errors.terms.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setFormStep(0)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 ease-in-out shadow-sm"
                  >
                    <span className="font-medium">Voltar</span>
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out shadow-sm"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <UserPlus size={18} className="mr-2" />
                    )}
                    <span className="font-medium">Criar conta</span>
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="text-center mt-8 border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-500 font-medium transition duration-150 ease-in-out">
                Entrar agora
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-4">
              A Lyz.ai está comprometida com a proteção dos seus dados pessoais conforme a LGPD (Lei Geral de Proteção de Dados).            
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
