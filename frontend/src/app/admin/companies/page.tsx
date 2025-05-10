'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings,
  LogOut,
  Search,
  Plus,
  Edit,
  Trash2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Globe,
  Users as UsersIcon,
  Calendar
} from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { adminAPI } from '@/lib/api';
import { UserRole, Company as CompanyType } from '@/types/auth';

// Usando o tipo definido em types/auth.ts

export default function CompaniesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Verificar se o usuário é um admin
    if (!user || user.role !== 'admin' as UserRole) {
      router.push('/dashboard');
      return;
    }

    fetchCompanies();
  }, [user, router, page, searchTerm, selectedStatus]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getCompanies({
        page,
        search: searchTerm,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      });
      
      const data = response.data || response;
      setCompanies(data.companies || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setError('Não foi possível carregar as empresas. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset para a primeira página quando fizer uma nova busca
  };

  const confirmDelete = (companyId: string) => {
    setCompanyToDelete(companyId);
    setShowDeleteModal(true);
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    try {
      setIsDeleting(true);
      await adminAPI.deleteCompany(companyToDelete);
      // Atualiza a lista de empresas após a exclusão
      fetchCompanies();
      setShowDeleteModal(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      setError('Não foi possível excluir a empresa. Por favor, tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCompanyToDelete(null);
  };

  const getSubscriptionStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Ativa</span>;
      case 'trial':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Trial</span>;
      case 'expired':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Expirada</span>;
      case 'canceled':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Cancelada</span>;
      default:
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">-</span>;
    }
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
            <Link href="/admin" className="flex items-center px-4 py-3 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition duration-150 ease-in-out">
              <BarChart3 size={20} className="mr-3" />
              <span>Dashboard</span>
            </Link>
            
            <Link href="/admin/users" className="flex items-center px-4 py-3 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition duration-150 ease-in-out">
              <Users size={20} className="mr-3" />
              <span>Usuários</span>
            </Link>
            
            <Link href="/admin/companies" className="flex items-center px-4 py-3 text-white bg-emerald-900 rounded-lg">
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
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Empresas</h1>
            <div className="flex space-x-2">
              <Link 
                href="/admin/companies/new" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition duration-150 ease-in-out"
              >
                <Plus size={16} className="mr-2" />
                Nova Empresa
              </Link>
            </div>
          </header>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar empresas por nome"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </form>

              <div className="flex space-x-2">
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa</option>
                    <option value="trial">Trial</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Filter size={18} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company List */}
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
          ) : companies.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-gray-500">Tente ajustar seus filtros ou adicione uma nova empresa.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localização
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuários
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Planos
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assinatura
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {companies.map((company) => (
                      <tr key={company.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                              {company.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{company.name}</div>
                              <div className="text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Globe size={14} className="mr-1" />
                                  {company.email}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {company.city}, {company.state}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <UsersIcon size={14} className="mr-1 text-gray-500" />
                            {company.usersCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {company.plansCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div>
                              {getSubscriptionStatusBadge(company.subscriptionStatus)}
                            </div>
                            {company.subscriptionEnd && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <Calendar size={12} className="mr-1" />
                                Até {new Date(company.subscriptionEnd).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Link 
                            href={`/admin/companies/${company.id}`}
                            className="text-blue-600 hover:text-blue-900 inline-block"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <Link 
                            href={`/admin/companies/${company.id}/edit`}
                            className="text-emerald-600 hover:text-emerald-900 inline-block"
                          >
                            <Edit size={18} />
                          </Link>
                          <button 
                            onClick={() => confirmDelete(company.id)} 
                            className="text-red-600 hover:text-red-900 inline-block"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{companies.length}</span> empresas
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Anterior</span>
                        <ChevronLeft size={18} />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === page
                              ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Próximo</span>
                        <ChevronRight size={18} />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full">
            <div className="bg-red-50 px-4 py-3 border-b border-red-100">
              <h3 className="text-lg font-medium text-red-800 flex items-center">
                <XCircle size={20} className="mr-2" />
                Confirmar exclusão
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e afetará todos os usuários associados.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteCompany}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    'Excluir'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
