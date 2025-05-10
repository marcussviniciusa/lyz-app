'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Share2, 
  Archive, 
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { planAPI } from '@/lib/api';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState('');

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await planAPI.getPlans(
        page, 
        10, 
        status, 
        search, 
        startDate, 
        endDate
      );
      const plans = response.data?.data?.plans || [];
      const total = response.data?.data?.total || 0;
      
      setPlans(plans);
      setTotalPages(Math.max(1, Math.ceil(total / 10)));
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [page, status, startDate, endDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPlans();
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleArchivePlan = async (planId) => {
    try {
      await planAPI.archivePlan(planId);
      fetchPlans();
    } catch (error) {
      console.error('Failed to archive plan:', error);
    }
    setActiveDropdown('');
  };

  const handleSharePlan = async (planId) => {
    try {
      const response = await planAPI.generateSharingLink(planId);
      const shareUrl = `${window.location.origin}/shared-plan/${response.data.data.token}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert('Link copiado para a área de transferência!');
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
          alert('Link gerado, mas não foi possível copiá-lo automaticamente.');
        });
    } catch (error) {
      console.error('Failed to generate sharing link:', error);
    }
    setActiveDropdown('');
  };

  const statusLabels = {
    'active': 'Ativo',
    'archived': 'Arquivado',
    'draft': 'Rascunho'
  };

  const statusClasses = {
    'active': 'bg-green-100 text-green-800',
    'archived': 'bg-gray-100 text-gray-800',
    'draft': 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Planos de Saúde</h1>
        <Link
          href="/dashboard/plans/new"
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <Plus size={16} className="mr-2" />
          Novo Plano
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex-1 sm:max-w-xs">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por paciente..."
                className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </form>
          
          <div className="mt-3 flex sm:mt-0 sm:ml-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Filter size={16} className="mr-2" />
              Filtros
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="py-4 space-y-4 sm:flex sm:items-end sm:space-y-0 sm:space-x-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
              >
                <option value="">Todos</option>
                <option value="active">Ativos</option>
                <option value="archived">Arquivados</option>
                <option value="draft">Rascunhos</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Data Inicial
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Data Final
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
              />
            </div>
            
            <div className="sm:flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStatus('');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:w-auto"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4 my-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="w-1/3 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : plans.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de criação
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compartilhado
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/plans/${plan._id}`}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        {plan.patientName || 'Sem nome'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusClasses[plan.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[plan.status] || 'Desconhecido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.sharingLink ? 'Sim' : 'Não'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === plan._id ? '' : plan._id)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {activeDropdown === plan._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <Link
                              href={`/dashboard/plans/${plan._id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Visualizar
                            </Link>
                            <Link
                              href={`/dashboard/plans/${plan._id}/edit`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Editar
                            </Link>
                            <button
                              onClick={() => handleSharePlan(plan._id)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Compartilhar
                            </button>
                            {plan.status !== 'archived' && (
                              <button
                                onClick={() => handleArchivePlan(plan._id)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Arquivar
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-gray-500 mb-4">Nenhum plano encontrado</p>
            <Link
              href="/dashboard/plans/new"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Plus size={16} className="mr-2" />
              Criar plano
            </Link>
          </div>
        )}

        {plans.length > 0 && (
          <div className="py-3 flex items-center justify-between border-t border-gray-200 mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(page > 1 ? page - 1 : 1)}
                disabled={page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                disabled={page === totalPages}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {plans.length > 0 ? (
                    <>
                      Mostrando <span className="font-medium">{(page - 1) * 10 + 1}</span> a{' '}
                      <span className="font-medium">{Math.min(page * 10, plans.length)}</span> de{' '}
                      <span className="font-medium">{plans.length}</span> resultados
                    </>
                  ) : (
                    'Nenhum resultado encontrado'
                  )}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(page > 1 ? page - 1 : 1)}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                      page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {Array.from({ length: Math.min(totalPages, 10) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setPage(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                        page === index + 1
                          ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                    disabled={page === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                      page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
