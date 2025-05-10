'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  Eye, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Loader,
  Search,
  AlertTriangle
} from 'lucide-react';
import { planAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils/formatters';

// Interfaces para os dados
interface PlanVersion {
  _id: string;
  versionNumber: number;
  createdAt: string;
  creator: {
    _id: string;
    name: string;
    email: string;
  };
  changeDescription: string;
  changedSections: string[];
}

interface VersionDifference {
  path: string;
  oldValue: any;
  newValue: any;
}

interface ComparisonResult {
  version1: {
    id: string;
    number: number;
    createdAt: string;
    changeDescription: string;
  };
  version2: {
    id: string;
    number: number;
    createdAt: string;
    changeDescription: string;
  };
  differences: VersionDifference[];
}

export default function PlanVersionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id: planId } = params;
  
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVersions, setFilteredVersions] = useState<PlanVersion[]>([]);

  // Buscar todas as versões do plano
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await planAPI.getPlanVersions(planId);
        const versionsData = response.data ? response.data.data.versions : [];
        
        setVersions(versionsData);
        setFilteredVersions(versionsData);
      } catch (error) {
        console.error('Erro ao buscar versões do plano:', error);
        setError('Não foi possível carregar o histórico de versões. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (planId) {
      fetchVersions();
    }
  }, [planId]);

  // Filtrar versões com base no termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVersions(versions);
      return;
    }
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = versions.filter(version => 
      version.changeDescription.toLowerCase().includes(lowerCaseSearch) ||
      version.versionNumber.toString().includes(lowerCaseSearch) ||
      version.creator.name.toLowerCase().includes(lowerCaseSearch) ||
      version.changedSections.some(section => 
        section.toLowerCase().includes(lowerCaseSearch)
      )
    );
    
    setFilteredVersions(filtered);
  }, [searchTerm, versions]);

  // Selecionar/deselecionar versão para comparação
  const toggleVersionSelection = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(prev => prev.filter(id => id !== versionId));
    } else {
      // Manter no máximo duas versões selecionadas
      if (selectedVersions.length < 2) {
        setSelectedVersions(prev => [...prev, versionId]);
      } else {
        // Se já tiver 2, substituir a primeira selecionada
        setSelectedVersions(prev => [prev[1], versionId]);
      }
    }
    
    // Limpar comparação quando mudar a seleção
    setComparison(null);
  };

  // Expandir/contrair detalhes da versão
  const toggleVersionExpansion = (versionId: string) => {
    if (expandedVersion === versionId) {
      setExpandedVersion(null);
    } else {
      setExpandedVersion(versionId);
    }
  };

  // Comparar versões selecionadas
  const compareVersions = async () => {
    if (selectedVersions.length !== 2) {
      setError('Selecione exatamente duas versões para comparar.');
      return;
    }
    
    try {
      setIsComparing(true);
      setError(null);
      
      const response = await planAPI.comparePlanVersions(
        planId, 
        selectedVersions[0], 
        selectedVersions[1]
      );
      
      const comparisonData = response.data ? response.data.data : null;
      setComparison(comparisonData);
    } catch (error) {
      console.error('Erro ao comparar versões:', error);
      setError('Não foi possível comparar as versões selecionadas. Por favor, tente novamente.');
    } finally {
      setIsComparing(false);
    }
  };

  // Restaurar versão
  const restoreVersion = async (versionId: string) => {
    const confirmRestore = window.confirm(
      'Tem certeza que deseja restaurar esta versão? As alterações atuais serão preservadas como uma nova versão, mas o plano será revertido para o estado da versão selecionada.'
    );
    
    if (!confirmRestore) return;
    
    try {
      setIsRestoring(true);
      setError(null);
      
      await planAPI.restorePlanVersion(planId, versionId);
      
      setSuccessMessage('Versão restaurada com sucesso!');
      
      // Atualizar a lista de versões após restauração
      const response = await planAPI.getPlanVersions(planId);
      const versionsData = response.data ? response.data.data.versions : [];
      setVersions(versionsData);
      setFilteredVersions(versionsData);
      
      // Limpar seleção e comparação
      setSelectedVersions([]);
      setComparison(null);
      
      // Esconder mensagem de sucesso após alguns segundos
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Erro ao restaurar versão:', error);
      setError('Não foi possível restaurar a versão selecionada. Por favor, tente novamente.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Formatar nome da seção para exibição
  const formatSectionName = (section: string): string => {
    if (section === '*') return 'Todas as seções';
    
    const sectionMap: Record<string, string> = {
      'patientData': 'Dados do Paciente',
      'menstrualHistory': 'Histórico Menstrual',
      'gestationalHistory': 'Histórico Gestacional',
      'healthHistory': 'Histórico de Saúde',
      'familyHistory': 'Histórico Familiar',
      'lifestyleHabits': 'Hábitos de Vida',
      'exams': 'Exames',
      'tcmObservations': 'Observações de MTC',
      'timeline': 'Linha do Tempo',
      'ifmMatrix': 'Matriz IFM',
      'planContent': 'Conteúdo do Plano',
      'status': 'Status'
    };
    
    return sectionMap[section] || section;
  };

  // Formatar caminho da diferença para exibição
  const formatDifferencePath = (path: string): string => {
    if (path === 'root') return 'Objeto inteiro';
    
    // Substituir nomes de campos por versões mais amigáveis
    return path
      .replace(/^patientData\./, 'Dados do Paciente → ')
      .replace(/^menstrualHistory\./, 'Histórico Menstrual → ')
      .replace(/^gestationalHistory\./, 'Histórico Gestacional → ')
      .replace(/^healthHistory\./, 'Histórico de Saúde → ')
      .replace(/^familyHistory\./, 'Histórico Familiar → ')
      .replace(/^lifestyleHabits\./, 'Hábitos de Vida → ')
      .replace(/^exams\./, 'Exames → ')
      .replace(/^tcmObservations\./, 'Observações de MTC → ')
      .replace(/^timeline\./, 'Linha do Tempo → ')
      .replace(/^ifmMatrix\./, 'Matriz IFM → ')
      .replace(/^planContent\./, 'Conteúdo do Plano → ')
      .replace('status', 'Status');
  };

  // Formatar valor para exibição
  const formatValue = (value: any): string => {
    if (value === undefined) return 'Não definido';
    if (value === null) return 'Nulo';
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  return (
    <div className="py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/dashboard/plans/${planId}`} className="mr-4 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Histórico de Versões</h1>
        </div>
      </div>
      
      {/* Mensagens de erro e sucesso */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="h-5 w-5 text-green-400">✓</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Barra de pesquisa e controles */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Buscar versões..."
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={compareVersions}
            disabled={selectedVersions.length !== 2 || isComparing}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isComparing ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Comparando...
              </>
            ) : (
              <>
                <Eye size={16} className="mr-2" />
                Comparar Selecionadas
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Lista de versões */}
      <div className="bg-white shadow overflow-hidden rounded-md">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader size={32} className="animate-spin text-emerald-600" />
          </div>
        ) : filteredVersions.length === 0 ? (
          <div className="p-6 text-center">
            <Clock size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma versão encontrada</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Nenhuma versão corresponde aos critérios de busca.' : 'Este plano ainda não possui versões registradas.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredVersions.map((version) => (
              <li key={version._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedVersions.includes(version._id)}
                      onChange={() => toggleVersionSelection(version._id)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <div className="ml-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-emerald-600">Versão {version.versionNumber}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{version.changeDescription}</p>
                      <p className="text-xs text-gray-500">
                        Criada por: {version.creator.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => restoreVersion(version._id)}
                      disabled={isRestoring}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      <RefreshCw size={12} className="mr-1" />
                      Restaurar
                    </button>
                    <button
                      onClick={() => toggleVersionExpansion(version._id)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {expandedVersion === version._id ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Detalhes expandidos da versão */}
                {expandedVersion === version._id && (
                  <div className="mt-4 ml-8 pl-4 border-l-2 border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Seções Alteradas:</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {version.changedSections.length > 0 ? (
                        version.changedSections.map((section, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {formatSectionName(section)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">Nenhuma seção específica registrada</span>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Resultados da comparação */}
      {comparison && (
        <div className="mt-6">
          <div className="bg-white shadow overflow-hidden rounded-md">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Comparação de Versões</h2>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <div className="mr-4">
                  <span className="font-medium">Versão {comparison.version1.number}</span>
                  <span className="ml-2">({formatDate(comparison.version1.createdAt)})</span>
                </div>
                <span className="mx-2">vs</span>
                <div>
                  <span className="font-medium">Versão {comparison.version2.number}</span>
                  <span className="ml-2">({formatDate(comparison.version2.createdAt)})</span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4">
              {comparison.differences.length === 0 ? (
                <p className="text-sm text-gray-500">Não foram encontradas diferenças entre estas versões.</p>
              ) : (
                <div>
                  <p className="text-sm text-gray-700 mb-4">
                    {comparison.differences.length} {comparison.differences.length === 1 ? 'diferença encontrada' : 'diferenças encontradas'}.
                  </p>
                  
                  <div className="space-y-6">
                    {comparison.differences.map((diff, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          {formatDifferencePath(diff.path)}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-1">Valor na Versão {comparison.version1.number}:</h4>
                            <div className="p-2 bg-red-50 rounded text-sm font-mono whitespace-pre-wrap overflow-auto max-h-48">
                              {formatValue(diff.oldValue)}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-1">Valor na Versão {comparison.version2.number}:</h4>
                            <div className="p-2 bg-green-50 rounded text-sm font-mono whitespace-pre-wrap overflow-auto max-h-48">
                              {formatValue(diff.newValue)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
