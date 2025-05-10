'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  Archive, 
  Download, 
  Trash, 
  FileText,
  ClipboardList,
  Upload,
  ChevronDown,
  Clock
} from 'lucide-react';
import { planAPI } from '@/lib/api';

// Tipos para planos e seções - alinhados com o modelo do backend
interface PatientData {
  fullName: string;
  birthDate: Date;
  profession: string;
  mainReason: string;
  initialObservations?: string;
}

interface IPlanContent {
  caseSummary?: string;
  symptomCorrelations?: string;
  generalNutritionalPlan?: string;
  recommendedSupplements?: string;
  lifestyleGuidelines?: string;
}

interface IIFMSystem {
  systems?: Array<{
    id: string;
    name: string;
    priority: 'high' | 'medium' | 'low';
    findings?: string;
    interventions?: string;
  }>;
  lastUpdated?: Date;
  assimilation?: {
    antecedents?: string;
    triggers?: string;
    mediators?: string;
  };
  defense?: {
    antecedents?: string;
    triggers?: string;
    mediators?: string;
  };
  energy?: {
    antecedents?: string;
    triggers?: string;
    mediators?: string;
  };
}

interface Plan {
  _id: string;
  creator: any;
  company: any;
  professionType: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  patientData: PatientData;
  createdAt: string;
  updatedAt: string;
  sharedLink?: string;
  sharingLink?: string;
  sharedLinkExpiry?: Date;
  examAnalysis?: {
    findings?: string;
    recommendations?: string;
  };
  exams?: Array<any>;
  tcmObservations?: any;
  ifmMatrix?: IIFMSystem;
  planContent?: IPlanContent;
}

type SectionNames = 'patientInfo' | 'examResults' | 'tcmObservations' | 'ifmMatrix' | 'ifmAnalysis' | 'recommendations';

export default function PlanDetailPage() {
  const router = useRouter();
  const [planId, setPlanId] = useState<string>('');
  
  // Usamos useEffect para extrair o ID apenas do lado do cliente
  useEffect(() => {
    const extractPlanIdFromUrl = () => {
      const pathParts = window.location.pathname.split('/');
      // O último segmento deve ser o ID
      const idFromPath = pathParts[pathParts.length - 1];
      if (idFromPath && idFromPath !== 'plans') {
        return idFromPath;
      }
      return '';
    };
    
    const extractedId = extractPlanIdFromUrl();
    setPlanId(extractedId);
  }, []);
  
  // useEffect para buscar os dados do plano quando o ID estiver disponível
  useEffect(() => {
    if (planId) {
      console.log('Buscando plano com ID:', planId);
      fetchPlan();
    }
  }, [planId]);
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSharingLoading, setIsSharingLoading] = useState(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSections, setShowSections] = useState({
    patientInfo: true,
    examResults: false,
    tcmObservations: false,
    ifmMatrix: false,
    ifmAnalysis: false,
    recommendations: false
  });

  const fetchPlan = async () => {
    // Verifica se temos um ID válido antes de fazer a requisição
    if (!planId || planId.trim() === '') {
      setError('ID do plano inválido ou não encontrado');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Inclui tratamento para requisição com timeout
      const response = await Promise.race([
        planAPI.getPlanById(planId),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao buscar detalhes do plano')), 10000)
        )
      ]);
      
      // Verifica se temos dados válidos na resposta
      if (response && response.data) {
        // A API pode retornar dados em diferentes formatos, vamos garantir que processamos corretamente
        if (response.data.data && response.data.data.plan) {
          console.log('Dados do plano recebidos (formato 1):', response.data.data.plan);
          setPlan(response.data.data.plan);
        } else if (response.data.data) {
          console.log('Dados do plano recebidos (formato 2):', response.data.data);
          setPlan(response.data.data);
        } else {
          console.log('Dados do plano recebidos (formato 3):', response.data);
          setPlan(response.data);
        }
      } else {
        throw new Error('Dados do plano não encontrados na resposta');
      }
    } catch (error: any) {
      console.error('Failed to fetch plan:', error);
      // Mensagens de erro mais específicas baseadas no tipo de erro
      if (error.response && error.response.status === 400) {
        setError('ID do plano inválido. Verifique se a URL está correta.');
      } else if (error.response && error.response.status === 404) {
        setError('Plano não encontrado.');
      } else if (error.response && error.response.status === 403) {
        setError('Você não tem permissão para acessar este plano.');
      } else if (error.message === 'Timeout ao buscar detalhes do plano') {
        setError('A operação excedeu o tempo limite. Tente novamente.');
      } else {
        setError('Erro ao carregar detalhes do plano. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (planId) {
      fetchPlan();
    }
  }, [planId]);

  const handleSharePlan = async () => {
    try {
      setIsSharingLoading(true);
      const response = await planAPI.generateSharingLink(planId);
      const shareUrl = `${window.location.origin}/shared-plan/${response.data.data.token}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert('Link copiado para a área de transferência!');
          fetchPlan(); // Refresh to show link status
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
          alert('Link gerado, mas não foi possível copiá-lo automaticamente.');
          fetchPlan(); // Refresh to show link status
        });
    } catch (error) {
      console.error('Failed to generate sharing link:', error);
      alert('Falha ao gerar link de compartilhamento.');
    } finally {
      setIsSharingLoading(false);
    }
  };

  const handleArchivePlan = async () => {
    if (!confirm('Tem certeza que deseja arquivar este plano? Essa ação não pode ser desfeita diretamente.')) {
      return;
    }
    
    try {
      setIsArchiveLoading(true);
      await planAPI.archivePlan(planId);
      alert('Plano arquivado com sucesso!');
      fetchPlan(); // Refresh to show updated status
    } catch (error) {
      console.error('Failed to archive plan:', error);
      alert('Erro ao arquivar o plano. Tente novamente.');
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    try {
      setIsDeleteLoading(true);
      await planAPI.deletePlan(planId);
      alert('Plano excluído com sucesso!');
      router.push('/dashboard/plans'); // Redirecionar para a lista de planos
    } catch (error: any) {
      console.error('Erro ao excluir plano:', error);
      alert(error.response?.data?.message || 'Erro ao excluir o plano. Tente novamente.');
    } finally {
      setIsDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const toggleSection = (section: SectionNames) => {
    setShowSections({
      ...showSections,
      [section]: !showSections[section]
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/dashboard/plans" className="mr-4">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div className="w-1/3 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="w-1/3 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/dashboard/plans" className="mr-4">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Erro</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Empty state (no plan found)
  if (!plan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/dashboard/plans" className="mr-4">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Plano não encontrado</h1>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center py-12">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-700 mb-2">Plano não encontrado</h2>
          <p className="text-gray-500 mb-6">O plano que você está procurando não foi encontrado ou pode ter sido excluído.</p>
          <Link
            href="/dashboard/plans"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Voltar para Planos
          </Link>
        </div>
      </div>
    );
  }

  // Status label and color mapping
  const statusLabels = {
    draft: 'Rascunho',
    in_progress: 'Em Progresso',
    completed: 'Concluído',
    archived: 'Arquivado'
  };

  const statusClasses = {
    draft: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  };

  const isArchived = plan.status === 'archived';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center">
          <Link href="/dashboard/plans" className="mr-4">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{plan.patientData?.fullName || 'Sem nome'}</h1>
            <div className="flex items-center mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusClasses[plan.status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
                {statusLabels[plan.status as keyof typeof statusLabels] || 'Desconhecido'}
              </span>
              {plan.sharingLink && (
                <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  Compartilhado
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {!isArchived && (
            <Link
              href={`/dashboard/plans/${planId}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Edit size={16} className="mr-2" />
              Editar
            </Link>
          )}
          
          <button
            onClick={handleSharePlan}
            disabled={isSharingLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <Share2 size={16} className="mr-2" />
            {isSharingLoading ? 'Compartilhando...' : 'Compartilhar'}
          </button>
          
          {(plan.status === 'draft' || plan.status === 'in_progress') && (
            <button
              onClick={handleArchivePlan}
              disabled={isArchiveLoading}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${isArchiveLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Archive size={16} className="mr-2" />
              {isArchiveLoading ? 'Arquivando...' : 'Arquivar'}
            </button>
          )}
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash size={16} className="mr-2" />
            Excluir
          </button>
          
          <Link
            href={`/dashboard/plans/${planId}/pdf`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <Download size={16} className="mr-2" />
            Exportar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient information section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('patientInfo')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-medium text-gray-900">Informações do Paciente</h2>
              <ChevronDown
                size={20}
                className={`text-gray-500 transform transition-transform ${
                  showSections.patientInfo ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {showSections.patientInfo && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome</p>
                    <p className="mt-1">{plan.patientData?.fullName || 'Não informado'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Nascimento</p>
                    <p className="mt-1">
                      <span className="text-gray-600">
                        {plan.patientData?.birthDate && !isNaN(new Date(plan.patientData.birthDate).getTime()) ? 
                          new Date(plan.patientData.birthDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 
                          'Desconhecido'}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Profissão</label>
                    <p className="mt-1">{plan.patientData?.profession || 'Não informado'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Motivo Principal</label>
                    <p className="mt-1">{plan.patientData?.mainReason || 'Não informado'}</p>
                  </div>
                </div>
                
                {plan.patientData?.initialObservations && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Observações Iniciais</p>
                    <p className="mt-1 whitespace-pre-line">{plan.patientData.initialObservations}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Exam Results Analysis section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('examResults')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-medium text-gray-900">Análise de Exames</h2>
              <ChevronDown
                size={20}
                className={`text-gray-500 transform transition-transform ${
                  showSections.examResults ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {showSections.examResults && (
              <div className="mt-4">
                {(plan.examAnalysis || plan.tcmObservations) ? (
                  <div className="space-y-6">
                    {plan.tcmObservations && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Observações Gerais</p>
                          <p className="mt-1 whitespace-pre-line">{plan.tcmObservations.general || 'Nenhuma observação registrada'}</p>
                        </div>
                      </div>
                    )}
                    {plan.examAnalysis && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Achados</p>
                          <p className="mt-1 whitespace-pre-line">{plan.examAnalysis.findings || 'Nenhum achado registrado.'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Recomendações</p>
                          <p className="mt-1 whitespace-pre-line">{plan.examAnalysis.recommendations || 'Nenhuma recomendação registrada.'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Nenhuma análise de exames disponível</p>
                    {!isArchived && (
                      <Link 
                        href={`/dashboard/plans/${planId}/exam-analysis`}
                        className="text-blue-600 hover:text-blue-800 mt-2 inline-block font-medium"
                      >
                        Adicionar análise
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* IFM Matrix section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('ifmMatrix')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-medium text-gray-900">Matriz do Instituto de Medicina Funcional</h2>
              <ChevronDown
                size={20}
                className={`text-gray-500 transform transition-transform ${
                  showSections.ifmMatrix ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {showSections.ifmMatrix && (
              <div className="mt-4">
                {plan.ifmMatrix ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status da Matriz</p>
                      <p className="mt-1 text-gray-700">Última atualização: {plan.ifmMatrix.lastUpdated ? new Date(plan.ifmMatrix.lastUpdated).toLocaleDateString('pt-BR') : 'Nunca'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Sistemas Prioritários</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {plan.ifmMatrix.systems && plan.ifmMatrix.systems
                          .filter(system => system.priority === 'high')
                          .map(system => (
                            <span key={system.id} className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {system.name}
                            </span>
                          ))}
                        {(!plan.ifmMatrix.systems || plan.ifmMatrix.systems.filter(system => system.priority === 'high').length === 0) && (
                          <span className="text-gray-500">Nenhum sistema com alta prioridade</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Link
                        href={`/dashboard/plans/${planId}/ifm-matrix`}
                        className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        <FileText size={16} className="mr-2" />
                        Ver Matriz Completa
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Matriz IFM não preenchida</h3>
                    <p className="text-gray-500 mb-6">Preencha a matriz do Instituto de Medicina Funcional para identificar prioridades terapêuticas.</p>
                    {!isArchived && (
                      <Link
                        href={`/dashboard/plans/${planId}/ifm-matrix`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        <FileText size={16} className="mr-2" />
                        Preencher Matriz IFM
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plan Recommendations section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('recommendations')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-medium text-gray-900">Recomendações e Plano</h2>
              <ChevronDown
                size={20}
                className={`text-gray-500 transform transition-transform ${
                  showSections.recommendations ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {showSections.recommendations && (
              <div className="mt-4">
                {plan.planContent ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Plano Terapêutico</p>
                      <div className="mt-4 prose">
                        {plan.planContent.caseSummary && (
                          <div dangerouslySetInnerHTML={{ __html: plan.planContent.caseSummary }} />
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Correlações de Sintomas</p>
                      <div className="mt-1 prose prose-emerald prose-sm max-w-none">
                        {plan.planContent.symptomCorrelations && (
                          <div dangerouslySetInnerHTML={{ __html: plan.planContent.symptomCorrelations }} />
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Orientações de Estilo de Vida</p>
                      <div className="mt-1 prose prose-emerald prose-sm max-w-none">
                        {plan.planContent.lifestyleGuidelines && (
                          <div dangerouslySetInnerHTML={{ __html: plan.planContent.lifestyleGuidelines }} />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma recomendação disponível</h3>
                    <p className="text-gray-500 mb-6">Gere recomendações personalizadas baseadas nas análises.</p>
                    {!isArchived && (
                      <Link
                        href={`/dashboard/plans/${planId}/generate`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        <FileText size={16} className="mr-2" />
                        Gerar Recomendações
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Plan details card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Detalhes do Plano</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">ID do Plano</p>
                <p className="mt-1 text-sm text-gray-900">{plan._id}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Data de Criação</p>
                <p className="mt-1 text-sm text-gray-900">
                  {plan.createdAt ? 
                    new Date(plan.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 
                    'Desconhecido'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Última Atualização</p>
                <p className="mt-1 text-sm text-gray-900">
                  {plan.updatedAt ? 
                    new Date(plan.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 
                    'Desconhecido'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de Profissional</p>
                <p className="mt-1 text-sm text-gray-900">
                  {(() => {
                    // Mapeamento de tipos de profissionais para nomes amigáveis
                    switch(plan.professionType) {
                      case 'medical_nutritionist': return 'Nutricionista';
                      case 'medical_doctor': return 'Médico';
                      case 'functional_medicine': return 'Medicina Funcional';
                      case 'complementary_medicine': return 'Medicina Complementar';
                      default: return plan.professionType || 'Não especificado';
                    }
                  })()}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Status de Compartilhamento</p>
                <p className="mt-1 text-sm text-gray-900">
                  {plan.sharedLink ? (
                    <>
                      <span className="text-green-600">Ativo</span>
                      {plan.sharedLinkExpiry && (
                        <span className="block text-xs text-gray-500 mt-1">
                          Expira em: {new Date(plan.sharedLinkExpiry).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </>
                  ) : (
                    'Não compartilhado'
                  )}
                </p>
              </div>
              
              <div className="pt-2 mt-2 border-t border-gray-100">
                <Link
                  href={`/dashboard/plans/${planId}/versions`}
                  className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-800"
                >
                  <Clock size={16} className="mr-1" />
                  Ver histórico de versões
                </Link>
              </div>
            </div>
          </div>

          {/* Documents card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Documentos</h2>
            
            <Link
              href={`/dashboard/plans/${planId}/documents`}
              className="inline-flex w-full items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <FileText size={16} className="mr-2" />
              Gerenciar Documentos
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar exclusão</h2>
            <p className="text-gray-700 mb-6">
              Tem certeza que deseja excluir permanentemente este plano? Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePlan}
                disabled={isDeleteLoading}
                className={`px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 ${isDeleteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isDeleteLoading ? 'Excluindo...' : 'Sim, excluir plano'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
