'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Loader,
  ExternalLink,
  Save,
  Printer,
  AlertTriangle
} from 'lucide-react';
import { planAPI, aiAPI } from '@/lib/api';

interface TCMPageParams {
  id: string;
  [key: string]: string;
}

interface TCMAnalysis {
  summary: string;
  patterns: {
    name: string;
    description: string;
    confidence: number;
    evidences: string[];
  }[];
  energeticImbalances: {
    element: string;
    state: string;
    description: string;
    relatedOrgans: string[];
  }[];
  yinYangAnalysis: {
    overall: string;
    description: string;
  };
  recommendations: {
    category: string;
    items: {
      title: string;
      description: string;
      priority: 'alta' | 'média' | 'baixa';
    }[];
  }[];
  explanations: {
    title: string;
    content: string;
  }[];
}

export default function TCMAnalysisPage({ params }: { params: TCMPageParams }) {
  const router = useRouter();
  const { id } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TCMAnalysis | null>(null);
  const [observations, setObservations] = useState<any>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setError(null);
        
        // Primeiro buscar o plano para obter observações TCM e info do paciente
        const planResponse = await planAPI.getPlanById(id);
        const planData = planResponse.data ? planResponse.data : planResponse;
        
        if (!planData || !planData.tcmObservations) {
          setError('Observações de MTC não encontradas. Por favor, registre as observações antes de gerar uma análise.');
          setIsLoading(false);
          return;
        }
        
        setObservations(planData.tcmObservations);
        setPatientInfo({
          name: planData.patientName || 'Não informado',
          birthdate: planData.patientBirthdate ? new Date(planData.patientBirthdate).toLocaleDateString('pt-BR') : 'Não informada',
          observations: planData.initialObservations || 'Nenhuma observação'
        });
        
        // Gerar uma nova análise com os dados das observações
        try {
          // Criar string simplificada com informações do paciente para o contexto da IA
          const patientInfoString = JSON.stringify({
            name: planData.patientName || 'Não informado',
            birthdate: planData.patientBirthdate ? new Date(planData.patientBirthdate).toLocaleDateString('pt-BR') : 'Não informada',
            observations: planData.initialObservations || ''
          });
          
          // Chamar a API para analisar as observações TCM
          const newAnalysisResponse = await aiAPI.analyzeTCM(id, planData.tcmObservations, patientInfoString);
          setAnalysis(newAnalysisResponse.data ? newAnalysisResponse.data : newAnalysisResponse);
        } catch (analysisError) {
          console.error('Erro ao gerar análise:', analysisError);
          setError('Não foi possível gerar a análise das observações. Por favor, tente novamente mais tarde.');
        }
      } catch (error) {
        console.error('Falha ao carregar análise TCM:', error);
        setError('Não foi possível carregar a análise. Por favor, tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  // Função para salvar a análise no PDF
  const handleSavePDF = async () => {
    try {
      // Implementar lógica para exportar como PDF
      window.print();
    } catch (error) {
      console.error('Falha ao exportar PDF:', error);
      setError('Não foi possível exportar o PDF. Por favor, tente novamente.');
    }
  };

  // Renderizar o nível de confiança como barras coloridas
  const renderConfidenceBar = (confidence: number) => {
    const colorClass = confidence > 0.7 
      ? 'bg-green-500' 
      : confidence > 0.4 
        ? 'bg-yellow-500' 
        : 'bg-red-500';
    
    return (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass}`} 
          style={{ width: `${confidence * 100}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center">
          <Link href={`/dashboard/plans/${id}/tcm`} className="mr-4 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Análise das Observações MTC</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSavePDF}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir / PDF
          </button>
        </div>
      </div>
      
      {/* Título para impressão */}
      <div className="hidden print:block print:mb-6">
        <h1 className="text-2xl font-bold text-center">Análise de Medicina Tradicional Chinesa</h1>
        {patientInfo && (
          <div className="text-center text-gray-600 mt-2">
            <p>Paciente: {patientInfo.name} | Data: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader size={32} className="animate-spin text-emerald-600" />
        </div>
      ) : error ? (
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
      ) : analysis ? (
        <div className="space-y-8 print:space-y-6">
          {/* Sumário da Análise */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-0 print:shadow-none">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Sumário da Análise</h2>
            <p className="text-gray-700 whitespace-pre-line">{analysis.summary}</p>
          </section>
          
          {/* Padrões identificados */}
          {analysis.patterns && analysis.patterns.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-0 print:shadow-none">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Padrões Identificados</h2>
              <div className="space-y-6">
                {analysis.patterns.map((pattern, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-md font-medium text-gray-800">{pattern.name}</h3>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">
                          Confiança: {Math.round(pattern.confidence * 100)}%
                        </span>
                        <div className="w-24">
                          {renderConfidenceBar(pattern.confidence)}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{pattern.description}</p>
                    {pattern.evidences && pattern.evidences.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Evidências:</h4>
                        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                          {pattern.evidences.map((evidence, idx) => (
                            <li key={idx}>{evidence}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Desequilíbrios Energéticos */}
          {analysis.energeticImbalances && analysis.energeticImbalances.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-0 print:shadow-none">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Desequilíbrios Energéticos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.energeticImbalances.map((imbalance, index) => (
                  <div key={index} className="border rounded-md p-4 bg-gray-50">
                    <div className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        imbalance.element === 'Madeira' ? 'bg-green-500' : 
                        imbalance.element === 'Fogo' ? 'bg-red-500' : 
                        imbalance.element === 'Terra' ? 'bg-yellow-500' : 
                        imbalance.element === 'Metal' ? 'bg-gray-400' : 
                        imbalance.element === 'Água' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}></div>
                      <h3 className="text-md font-medium text-gray-800">
                        {imbalance.element}: {imbalance.state}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{imbalance.description}</p>
                    {imbalance.relatedOrgans && (
                      <div className="mt-1">
                        <span className="text-xs font-medium text-gray-500">Órgãos afetados:</span>
                        <span className="text-xs text-gray-600 ml-1">{imbalance.relatedOrgans.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Análise Yin/Yang */}
          {analysis.yinYangAnalysis && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-0 print:shadow-none">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Análise Yin/Yang</h2>
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-r from-black via-gray-400 to-white"></div>
                    </div>
                  </div>
                  <h3 className="text-center text-md font-medium text-gray-800 mb-2">{analysis.yinYangAnalysis.overall}</h3>
                  <p className="text-sm text-gray-700">{analysis.yinYangAnalysis.description}</p>
                </div>
              </div>
            </section>
          )}
          
          {/* Recomendações */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-0 print:shadow-none">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recomendações</h2>
              <div className="space-y-6">
                {analysis.recommendations.map((category, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <h3 className="text-md font-medium text-gray-800 mb-3">{category.category}</h3>
                    <div className="space-y-4">
                      {category.items.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-md">
                          <div className="flex items-center mb-1">
                            <h4 className="text-sm font-medium text-gray-800">{item.title}</h4>
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              item.priority === 'alta' ? 'bg-red-100 text-red-800' : 
                              item.priority === 'média' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              Prioridade {item.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Explicações Adicionais */}
          {analysis.explanations && analysis.explanations.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-0 print:shadow-none">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Explicações Adicionais</h2>
              <div className="space-y-4">
                {analysis.explanations.map((explanation, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <h3 className="text-md font-medium text-gray-800 mb-2">{explanation.title}</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{explanation.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Nota de rodapé */}
          <div className="text-xs text-gray-500 text-center mt-8 print:mt-4">
            <p>Esta análise foi gerada com base nas observações registradas e deve ser interpretada por um profissional qualificado.</p>
            <p>Data da análise: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-700">Nenhuma análise disponível. Por favor, registre as observações de MTC e clique em "Analisar com IA".</p>
        </div>
      )}
    </div>
  );
}
