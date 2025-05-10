'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Loader, 
  Save,
  AlertTriangle,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { planAPI, aiAPI } from '@/lib/api';

// Estrutura para um sistema da matriz IFM
interface IFMSystem {
  id: string;
  name: string;
  description: string;
  findings: string;
  interventions: string;
  priority: 'high' | 'medium' | 'low';
}

// Estrutura para antecedentes, gatilhos e mediadores
interface AntecedentsTriggersMediator {
  antecedents: string;
  triggers: string;
  mediators: string;
}

// Estrutura completa da matriz IFM
interface IFMMatrixData {
  systems: IFMSystem[];
  atm: AntecedentsTriggersMediator;
  notes: string;
  lastUpdated: string;
}

export default function IFMMatrixPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Estado para controlar quais seções estão expandidas
  const [expandedSystems, setExpandedSystems] = useState<{[key: string]: boolean}>({});
  const [expandedATM, setExpandedATM] = useState(true);
  
  // Informações do plano e paciente para análise automática
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [labResults, setLabResults] = useState<string>('');
  const [timeline, setTimeline] = useState<any>(null);
  
  // Dados da matriz IFM
  const initialIFMSystems: IFMSystem[] = [
    { 
      id: 'assimilation', 
      name: 'Assimilação', 
      description: 'Digestão, absorção, microbioma, sistema GI',
      findings: '',
      interventions: '',
      priority: 'medium'
    },
    { 
      id: 'defense', 
      name: 'Defesa e Reparo', 
      description: 'Sistema imunológico, inflamação, infecção',
      findings: '',
      interventions: '',
      priority: 'medium'
    },
    { 
      id: 'energy', 
      name: 'Energia', 
      description: 'Produção de energia, função mitocondrial',
      findings: '',
      interventions: '',
      priority: 'medium'
    },
    { 
      id: 'biotransformation', 
      name: 'Biotransformação e Eliminação', 
      description: 'Desintoxicação, excreção',
      findings: '',
      interventions: '',
      priority: 'medium'
    },
    { 
      id: 'transport', 
      name: 'Transporte', 
      description: 'Sistema cardiovascular e linfático',
      findings: '',
      interventions: '',
      priority: 'medium'
    },
    { 
      id: 'communication', 
      name: 'Comunicação', 
      description: 'Hormônios, neurotransmissores, sistema imunológico',
      findings: '',
      interventions: '',
      priority: 'medium'
    },
    { 
      id: 'structural', 
      name: 'Integridade Estrutural', 
      description: 'Membranas celulares até estrutura musculoesquelética',
      findings: '',
      interventions: '',
      priority: 'medium'
    }
  ];
  
  const [ifmMatrix, setIfmMatrix] = useState<IFMMatrixData>({
    systems: initialIFMSystems,
    atm: {
      antecedents: '',
      triggers: '',
      mediators: ''
    },
    notes: '',
    lastUpdated: new Date().toISOString()
  });
  
  // Inicializa sistemas expandidos
  useEffect(() => {
    const expanded: {[key: string]: boolean} = {};
    initialIFMSystems.forEach(system => {
      expanded[system.id] = true;
    });
    setExpandedSystems(expanded);
  }, []);
  
  // Carrega dados da matriz IFM e informações relacionadas
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await planAPI.getPlanById(id);
        const planData = response.data ? response.data : response;
        
        // Carrega informações do paciente para análise de IA
        if (planData) {
          setPatientInfo({
            name: planData.patientName || 'Não informado',
            birthdate: planData.patientBirthdate ? new Date(planData.patientBirthdate).toLocaleDateString('pt-BR') : 'Não informada',
            observations: planData.initialObservations || ''
          });
          
          // Carrega matriz IFM existente, se houver
          if (planData.ifmMatrix) {
            setIfmMatrix(planData.ifmMatrix);
          }
          
          // Carrega resumo de exames laboratoriais para análise
          if (planData.examAnalysis) {
            setLabResults(planData.examAnalysis.summary || '');
          }
          
          // Carrega timeline para análise
          if (planData.timeline) {
            setTimeline(planData.timeline);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar matriz IFM:', error);
        setError('Não foi possível carregar os dados da matriz IFM. Por favor, tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);
  
  // Toggle para expandir/colapsar sistema
  const toggleSystem = (systemId: string) => {
    setExpandedSystems(prev => ({
      ...prev,
      [systemId]: !prev[systemId]
    }));
  };
  
  // Toggle para expandir/colapsar seção ATM
  const toggleATM = () => {
    setExpandedATM(!expandedATM);
  };
  
  // Handler para atualizar dados de um sistema
  const handleSystemChange = (systemId: string, field: keyof IFMSystem, value: string | IFMSystem['priority']) => {
    setIfmMatrix(prev => ({
      ...prev,
      systems: prev.systems.map(system => 
        system.id === systemId 
          ? { ...system, [field]: value } 
          : system
      ),
      lastUpdated: new Date().toISOString()
    }));
  };
  
  // Handler para atualizar ATM
  const handleATMChange = (field: keyof AntecedentsTriggersMediator, value: string) => {
    setIfmMatrix(prev => ({
      ...prev,
      atm: {
        ...prev.atm,
        [field]: value
      },
      lastUpdated: new Date().toISOString()
    }));
  };
  
  // Handler para atualizar notas gerais
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIfmMatrix(prev => ({
      ...prev,
      notes: e.target.value,
      lastUpdated: new Date().toISOString()
    }));
  };
  
  // Salvar matriz IFM
  const handleSaveMatrix = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await planAPI.updatePlan(id, { ifmMatrix });
      
      setSuccessMessage('Matriz IFM salva com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar matriz IFM:', error);
      setError('Não foi possível salvar a matriz IFM. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Analisar dados com IA
  const handleAnalyzeWithAI = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Primeiro salvar o estado atual
      await planAPI.updatePlan(id, { ifmMatrix });
      
      // Preparar strings de contexto para a IA
      const patientInfoString = JSON.stringify(patientInfo);
      const timelineString = timeline ? JSON.stringify(timeline) : '';
      
      // Chamar a API para analisar com IA
      const analysisResponse = await aiAPI.analyzeIFM(
        id, 
        patientInfoString,
        labResults || '',
        timelineString
      );
      
      const analysisData = analysisResponse.data ? analysisResponse.data : analysisResponse;
      
      if (analysisData && typeof analysisData === 'string') {
        try {
          // Tentar fazer parse da resposta (caso seja um JSON)
          const parsedAnalysis = JSON.parse(analysisData);
          setIfmMatrix(prev => ({
            ...prev,
            ...parsedAnalysis
          }));
        } catch {
          // Se não for JSON, assumir que é texto e adicionar como notas
          setIfmMatrix(prev => ({
            ...prev,
            notes: prev.notes + '\n\n--- ANÁLISE DA IA ---\n' + analysisData
          }));
        }
      }
      
      setSuccessMessage('Análise da matriz IFM com IA concluída com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao analisar matriz IFM com IA:', error);
      setError('Não foi possível realizar a análise com IA. Por favor, tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Classes CSS baseadas na prioridade
  const getPriorityClasses = (priority: IFMSystem['priority']) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium inline-block';
    
    switch (priority) {
      case 'high':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'low':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/dashboard/plans/${id}`} className="mr-4 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Matriz IFM</h1>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleAnalyzeWithAI}
            disabled={isAnalyzing || isSubmitting}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <span className="mr-2">🤖</span>
                Analisar com IA
              </>
            )}
          </button>
          
          <button
            onClick={handleSaveMatrix}
            disabled={isSubmitting || isAnalyzing}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Salvar Matriz
              </>
            )}
          </button>
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
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader size={32} className="animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sistemas da Matriz IFM */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              <div className="px-6 py-4 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Sistemas da Matriz IFM</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Preencha as informações para cada um dos sete sistemas da matriz.
                </p>
              </div>
              
              {ifmMatrix.systems.map((system) => (
                <div key={system.id} className="px-6 py-4">
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => toggleSystem(system.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <h3 className="text-md font-medium text-gray-900">{system.name}</h3>
                      <span className="text-sm text-gray-500">{system.description}</span>
                      <span className={getPriorityClasses(system.priority)}>
                        {system.priority === 'high' ? 'Alta Prioridade' : 
                         system.priority === 'medium' ? 'Média Prioridade' : 
                         'Baixa Prioridade'}
                      </span>
                    </div>
                    <div>
                      {expandedSystems[system.id] ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                  
                  {expandedSystems[system.id] && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor={`${system.id}-priority`} className="block text-sm font-medium text-gray-700">
                          Prioridade
                        </label>
                        <select
                          id={`${system.id}-priority`}
                          value={system.priority}
                          onChange={(e) => handleSystemChange(system.id, 'priority', e.target.value as IFMSystem['priority'])}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                        >
                          <option value="high">Alta Prioridade</option>
                          <option value="medium">Média Prioridade</option>
                          <option value="low">Baixa Prioridade</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor={`${system.id}-findings`} className="block text-sm font-medium text-gray-700">
                          Achados Clínicos
                        </label>
                        <textarea
                          id={`${system.id}-findings`}
                          rows={4}
                          value={system.findings}
                          onChange={(e) => handleSystemChange(system.id, 'findings', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                          placeholder={`Descreva os achados clínicos relacionados ao sistema ${system.name.toLowerCase()}...`}
                        ></textarea>
                      </div>
                      
                      <div>
                        <label htmlFor={`${system.id}-interventions`} className="block text-sm font-medium text-gray-700">
                          Intervenções Recomendadas
                        </label>
                        <textarea
                          id={`${system.id}-interventions`}
                          rows={4}
                          value={system.interventions}
                          onChange={(e) => handleSystemChange(system.id, 'interventions', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                          placeholder={`Descreva as intervenções recomendadas para o sistema ${system.name.toLowerCase()}...`}
                        ></textarea>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Antecedentes, Gatilhos e Mediadores */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center cursor-pointer" onClick={toggleATM}>
              <h2 className="text-lg font-medium text-gray-900">Antecedentes, Gatilhos e Mediadores</h2>
              <div>
                {expandedATM ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
            
            {expandedATM && (
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="antecedents" className="block text-sm font-medium text-gray-700">
                    Antecedentes
                  </label>
                  <p className="text-xs text-gray-500 mb-1">
                    Fatores genéticos, congênitos ou de desenvolvimento que predispõem a pessoa a vulnerabilidades.
                  </p>
                  <textarea
                    id="antecedents"
                    rows={4}
                    value={ifmMatrix.atm.antecedents}
                    onChange={(e) => handleATMChange('antecedents', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Descreva os antecedentes..."
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="triggers" className="block text-sm font-medium text-gray-700">
                    Gatilhos
                  </label>
                  <p className="text-xs text-gray-500 mb-1">
                    Eventos que provocam sintomas ou contribuem para o início da doença.
                  </p>
                  <textarea
                    id="triggers"
                    rows={4}
                    value={ifmMatrix.atm.triggers}
                    onChange={(e) => handleATMChange('triggers', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Descreva os gatilhos..."
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="mediators" className="block text-sm font-medium text-gray-700">
                    Mediadores
                  </label>
                  <p className="text-xs text-gray-500 mb-1">
                    Fatores que continuam contribuindo para a doença, mesmo após o gatilho inicial.
                  </p>
                  <textarea
                    id="mediators"
                    rows={4}
                    value={ifmMatrix.atm.mediators}
                    onChange={(e) => handleATMChange('mediators', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Descreva os mediadores..."
                  ></textarea>
                </div>
              </div>
            )}
          </div>
          
          {/* Notas Gerais */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">Notas Gerais</h2>
            </div>
            <div className="px-6 py-4">
              <textarea
                rows={6}
                value={ifmMatrix.notes}
                onChange={handleNotesChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Adicione observações gerais sobre a matriz IFM..."
              ></textarea>
            </div>
          </div>
          
          {/* Ações finais */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveMatrix}
              disabled={isSubmitting || isAnalyzing}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Salvar Matriz
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
