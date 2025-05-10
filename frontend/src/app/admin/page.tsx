'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Building2, 
  BarChart3, 
  FilePlus,
  FileText,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { adminAPI } from '@/lib/api';
import { UserRole } from '@/types/auth';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalPlans: 0,
    activeUsers: 0,
    pendingPlans: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se o usuário é um admin
    if (!user || user.role !== 'admin' as UserRole) {
      router.push('/dashboard');
      return;
    }

    // Carregar estatísticas
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await adminAPI.getStats();
        const data = response.data || response;
        
        setStats({
          totalUsers: data.totalUsers || 0,
          totalCompanies: data.totalCompanies || 0,
          totalPlans: data.totalPlans || 0,
          activeUsers: data.activeUsers || 0,
          pendingPlans: data.pendingPlans || 0
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setError('Não foi possível carregar as estatísticas. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-emerald-800 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <span className="text-xl font-bold text-emerald-700">L</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Lyz.ai</h1>
              <p className="text-xs text-emerald-200">Painel administrativo</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            <Link href="/admin" className="flex items-center px-4 py-3 text-white bg-emerald-900 rounded-lg">
              <BarChart3 size={20} className="mr-3" />
              <span>Dashboard</span>
            </Link>
            
            <Link href="/admin/users" className="flex items-center px-4 py-3 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition duration-150 ease-in-out">
              <Users size={20} className="mr-3" />
              <span>Usuários</span>
            </Link>
            
            <Link href="/admin/companies" className="flex items-center px-4 py-3 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition duration-150 ease-in-out">
              <Building2 size={20} className="mr-3" />
              <span>Empresas</span>
            </Link>
            
            <Link href="/admin/settings" className="flex items-center px-4 py-3 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition duration-150 ease-in-out">
              <Settings size={20} className="mr-3" />
              <span>Configurações</span>
            </Link>
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition duration-150 ease-in-out"
            >
              <LogOut size={20} className="mr-3" />
              <span>Sair</span>
            </button>
            
            <div className="mt-4 pt-4 border-t border-emerald-700">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-emerald-300">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <div className="p-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <div className="flex space-x-2">
              <Link href="/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition duration-150 ease-in-out">
                Voltar para o dashboard
              </Link>
            </div>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-emerald-100 mr-4">
                      <Users size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total de Usuários</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">
                      <span className="text-emerald-600 font-medium">{stats.activeUsers}</span> usuários ativos
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 mr-4">
                      <Building2 size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total de Empresas</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Link href="/admin/companies" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                      Ver detalhes
                      <ChevronRight size={16} className="ml-1" />
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 mr-4">
                      <FileText size={24} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total de Planos</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalPlans}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">
                      <span className="text-purple-600 font-medium">{stats.pendingPlans}</span> planos pendentes
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Access */}
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Acesso Rápido</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link href="/admin/users" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition duration-150 ease-in-out">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-emerald-100 mr-4">
                      <Users size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Gerenciar Usuários</p>
                      <p className="text-sm text-gray-500">Adicionar, editar ou remover usuários</p>
                    </div>
                  </div>
                </Link>

                <Link href="/admin/companies" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition duration-150 ease-in-out">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 mr-4">
                      <Building2 size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Gerenciar Empresas</p>
                      <p className="text-sm text-gray-500">Adicionar, editar ou remover empresas</p>
                    </div>
                  </div>
                </Link>

                <Link href="/admin/settings" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition duration-150 ease-in-out">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-gray-100 mr-4">
                      <Settings size={24} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Configurações</p>
                      <p className="text-sm text-gray-500">Configurações do sistema</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Recent Activity */}
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Atividade Recente</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="min-w-full divide-y divide-gray-200">
                  <div className="bg-gray-50 px-6 py-3">
                    <h3 className="text-sm font-medium text-gray-700">Logs de Atividade</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    <div className="px-6 py-4">
                      <p className="text-sm text-gray-700">Nenhuma atividade recente para exibir.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
