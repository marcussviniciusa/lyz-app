'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Filter } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { planAPI } from '@/lib/api';

export default function DashboardPage() {
  const [recentPlans, setRecentPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchRecentPlans = async () => {
      try {
        setIsLoading(true);
        const response = await planAPI.getPlans(1, 5);
        setRecentPlans(response.data.data.plans || []);
      } catch (error) {
        console.error('Failed to fetch recent plans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentPlans();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/dashboard/plans/new"
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <Plus size={16} className="mr-2" />
          Novo Plano
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
              <FileText size={24} />
            </div>
            <div className="ml-5">
              <h2 className="text-lg font-medium text-gray-900">Planos Ativos</h2>
              <p className="text-3xl font-semibold text-gray-700">
                {isLoading ? (
                  <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span>
                ) : (
                  recentPlans.filter(plan => plan.status === 'active').length
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FileText size={24} />
            </div>
            <div className="ml-5">
              <h2 className="text-lg font-medium text-gray-900">Planos Compartilhados</h2>
              <p className="text-3xl font-semibold text-gray-700">
                {isLoading ? (
                  <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span>
                ) : (
                  recentPlans.filter(plan => plan.sharingLink).length
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FileText size={24} />
            </div>
            <div className="ml-5">
              <h2 className="text-lg font-medium text-gray-900">Planos Arquivados</h2>
              <p className="text-3xl font-semibold text-gray-700">
                {isLoading ? (
                  <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span>
                ) : (
                  recentPlans.filter(plan => plan.status === 'archived').length
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Planos Recentes</h2>
          <Link
            href="/dashboard/plans"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Ver todos
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="w-1/3 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : recentPlans.length > 0 ? (
          <div className="overflow-x-auto">
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPlans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/plans/${plan._id}`}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        {plan.patientName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full 
                        ${plan.status === 'active' ? 'bg-green-100 text-green-800' : 
                          plan.status === 'archived' ? 'bg-gray-100 text-gray-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {plan.status === 'active' ? 'Ativo' : 
                         plan.status === 'archived' ? 'Arquivado' : 
                         'Rascunho'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.sharingLink ? 'Sim' : 'Não'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-gray-500 mb-4">Você ainda não criou nenhum plano</p>
            <Link
              href="/dashboard/plans/new"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Plus size={16} className="mr-2" />
              Criar primeiro plano
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
