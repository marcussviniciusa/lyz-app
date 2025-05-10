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
  AlertTriangle,
  Download,
  Share2
} from 'lucide-react';
import { planAPI, aiAPI } from '@/lib/api';

interface IFMPageParams {
  id: string;
  [key: string]: string;
}

interface IFMAnalysis {
  summary: string;
  functionalSystems: {
    name: string;
    status: string;
    description: string;
    findings: string[];
    recommendations: string[];
  }[];
  antecedents: {
    category: string;
    items: string[];
    impact: 'high' | 'medium' | 'low';
  }[];
  triggers: {
    category: string;
    items: string[];
    impact: 'high' | 'medium' | 'low';
  }[];
  mediators: {
    category: string;
    items: string[];
    impact: 'high' | 'medium' | 'low';
  }[];
  recommendations: {
    category: string;
    description: string;
    items: {
      title: string;
      description: string;
      priority: 'alta' | 'média' | 'baixa';
    }[];
  }[];
  references: {
    title: string;
    source: string;
    url?: string;
  }[];
}

export default function IFMAnalysisPage({ params }: { params: IFMPageParams }) {
  const router = useRouter();
  const { id } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<IFMAnalysis | null>(null);
  const [matrixData, setMatrixData] = useState<any>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setError(null);
        
        // Primeiro buscar o plano para obter dados da matriz IFM e info do paciente
        const planResponse = await planAPI.getPlanById(id);
        const planData = planResponse.data ? planResponse.data : planResponse;
        
        if (!planData || !planData.ifmMatrix) {
          setError('Dados da Matriz IFM não encontrados. Por favor, preencha a matriz antes de gerar uma análise.');
          setIsLoading(false);
          return;
        }
        
        setMatrixData(planData.ifmMatrix);
        setPatientInfo({
          name: planData.patientName || 'Não informado',
          birthdate: planData.patientBirthdate ? new Date(planData.patientBirthdate).toLocaleDateString('pt-BR') : 'Não informada',
          observations: planData.initialObservations || 'Nenhuma observação'
        });
        
        // Gerar uma nova análise com os dados da matriz
        try {
          // Extrair informações de exames se disponíveis
          let examResults = '';
          if (planData.examAnalysis && planData.examAnalysis.length > 0) {
            examResults = planData.examAnalysis;
          }
          
          // Criar string simplificada com informações do paciente para o contexto da IA
          const patientInfoString = JSON.stringify({
            name: planData.patientName || 'Não informado',
            birthdate: planData.patientBirthdate ? new Date(planData.patientBirthdate).toLocaleDateString('pt-BR') : 'Não informada',
            observations: planData.initialObservations || '',
            examResults: examResults
          });
          
          // Chamar a API para analisar a matriz IFM
          const matrixDataString = JSON.stringify(planData.ifmMatrix);
          const newAnalysisResponse = await aiAPI.analyzeIFM(id, patientInfoString, matrixDataString, planData.timeline || '');
          setAnalysis(newAnalysisResponse.data ? newAnalysisResponse.data : newAnalysisResponse);
        } catch (analysisError) {
          console.error('Erro ao gerar análise:', analysisError);
          setError('Não foi possível gerar a análise da matriz IFM. Por favor, tente novamente mais tarde.');
        }
      } catch (error) {
        console.error('Falha ao carregar análise IFM:', error);
        setError('Não foi possível carregar a análise. Por favor, tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  // Exportar análise como PDF
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      // Implementar lógica para exportar PDF usando uma biblioteca como jsPDF
      // Por enquanto, usar a função nativa de impressão do navegador
      window.print();
    } catch (error) {
      console.error('Falha ao exportar PDF:', error);
      setError('Não foi possível exportar o PDF. Por favor, tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  // Compartilhar análise
  const handleShare = async () => {
    try {
      // Implementar compartilhamento via email ou link
      const shareResponse = await planAPI.generateSharingLink(id, 30); // 30 dias de expiração
      
      if (shareResponse.data && shareResponse.data.shareUrl) {
        // Copiar link para o clipboard
        navigator.clipboard.writeText(shareResponse.data.shareUrl);
        alert('Link de compartilhamento copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Falha ao compartilhar análise:', error);
      setError('Não foi possível gerar o link de compartilhamento. Por favor, tente novamente.');
    }
  };

  // Renderizar impacto como badges coloridos
  const renderImpactBadge = (impact: 'high' | 'medium' | 'low') => {
    const classes = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    const labels = {
      high: 'Alto Impacto',
      medium: 'Impacto Médio',
      low: 'Baixo Impacto'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${classes[impact]}`}>
        {labels[impact]}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link href={`/dashboard/plans/${id}/ifm-matrix`} className="mr-4">
            <button className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} className="mr-1" />
              <span>Voltar para Matriz</span>
            </button>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Análise de Medicina Funcional</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPDF}
            disabled={exporting || isLoading || !analysis}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {exporting ? <Loader size={16} className="mr-2 animate-spin" /> : <Printer size={16} className="mr-2" />}
            Exportar PDF
          </button>
          
          <button
            onClick={handleShare}
            disabled={isLoading || !analysis}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            <Share2 size={16} className="mr-2" />
            Compartilhar
          </button>
        </div>
      </div>
      
      {/* Carregando */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader size={32} className="animate-spin text-emerald-500" />
          <span className="ml-3 text-lg text-gray-600">Carregando análise...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle size={20} className="text-red-500 mr-3 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      ) : analysis ? (
        <div className="space-y-8 print:space-y-6">
          {/* Informações do Paciente */}
          <div className="print:hidden bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-100">
            <h2 className="text-lg font-medium text-emerald-800 mb-2">Informações do Paciente</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nome</p>
                <p className="text-sm text-gray-900">{patientInfo.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Data de Nascimento</p>
                <p className="text-sm text-gray-900">{patientInfo.birthdate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ID do Plano</p>
                <p className="text-sm text-gray-900">{id}</p>
              </div>
            </div>
          </div>
          
          {/* Sumário */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-0 print:shadow-none">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Resumo da Análise Funcional</h2>
            <div className="prose prose-emerald max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{analysis.summary}</p>
            </div>
          </section>
          
          {/* Sistemas Funcionais */}
          {analysis.functionalSystems && analysis.functionalSystems.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-0 print:shadow-none">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Sistemas Funcionais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.functionalSystems.map((system, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      system.status === 'comprometido' ? 'border-red-200 bg-red-50' :
                      system.status === 'alerta' ? 'border-yellow-200 bg-yellow-50' :
                      'border-green-200 bg-green-50'
                    }`}
                  >
                    <h3 className="text-md font-medium mb-2">{system.name}</h3>
                    <p className="text-sm mb-3">{system.description}</p>
                    
                    {system.findings.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium mb-1">Achados</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {system.findings.map((finding, fidx) => (
                            <li key={fidx}>{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {system.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Recomendações</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {system.recommendations.map((rec, ridx) => (
                            <li key={ridx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Matriz MSF - Antecedentes, Gatilhos e Mediadores */}
          <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-0 print:shadow-none">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Matriz do Instituto de Medicina Funcional</h2>
            
            {/* Antecedentes */}
            {analysis.antecedents && analysis.antecedents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-3">Antecedentes</h3>
                <div className="space-y-4">
                  {analysis.antecedents.map((antecedent, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">{antecedent.category}</h4>
                        {renderImpactBadge(antecedent.impact)}
                      </div>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {antecedent.items.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Gatilhos */}
            {analysis.triggers && analysis.triggers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-3">Gatilhos</h3>
                <div className="space-y-4">
                  {analysis.triggers.map((trigger, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">{trigger.category}</h4>
                        {renderImpactBadge(trigger.impact)}
                      </div>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {trigger.items.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mediadores */}
            {analysis.mediators && analysis.mediators.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Mediadores</h3>
                <div className="space-y-4">
                  {analysis.mediators.map((mediator, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">{mediator.category}</h4>
                        {renderImpactBadge(mediator.impact)}
                      </div>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {mediator.items.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
          
          {/* Recomendações */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-0 print:shadow-none">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Plano de Intervenção Funcional</h2>
              <div className="space-y-6">
                {analysis.recommendations.map((category, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <h3 className="text-md font-medium text-gray-800 mb-2">{category.category}</h3>
                    <p className="text-sm text-gray-700 mb-3">{category.description}</p>
                    <div className="space-y-3">
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
          
          {/* Referências */}
          {analysis.references && analysis.references.length > 0 && (
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:border-0 print:shadow-none">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Referências</h2>
              <ul className="space-y-2">
                {analysis.references.map((reference, index) => (
                  <li key={index} className="text-sm">
                    {reference.url ? (
                      <a 
                        href={reference.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-800 hover:underline flex items-center"
                      >
                        {reference.title} - <span className="text-gray-600">{reference.source}</span>
                        <ExternalLink size={14} className="ml-1" />
                      </a>
                    ) : (
                      <span>
                        {reference.title} - <span className="text-gray-600">{reference.source}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          
          {/* Nota de rodapé */}
          <div className="text-xs text-gray-500 text-center mt-8 print:mt-4">
            <p>Esta análise foi gerada com base na Matriz IFM e deve ser interpretada por um profissional de saúde qualificado.</p>
            <p>Data da análise: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-700">Nenhuma análise disponível. Por favor, preencha a Matriz do Instituto de Medicina Funcional e clique em "Analisar com IA".</p>
        </div>
      )}
    </div>
  );
}
