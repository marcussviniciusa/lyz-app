'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, File, X, Image, FileText } from 'lucide-react';
import { planAPI, fileAPI } from '@/lib/api';

export default function ExamAnalysisEditPage() {
  const router = useRouter();
  const [planId, setPlanId] = useState<string>('');
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Dados do formulário
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  
  // Estado para controlar a opção selecionada
  const [analysisType, setAnalysisType] = useState<'text' | 'files'>('text');
  
  // Estado para arquivos
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  
  // Referência para o input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Extrair o ID do plano da URL
  useEffect(() => {
    const extractPlanIdFromUrl = () => {
      const pathParts = window.location.pathname.split('/');
      // O ID do plano é o antepenúltimo segmento da URL
      // /dashboard/plans/{id}/exam-analysis
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] === 'plans' && i + 1 < pathParts.length) {
          return pathParts[i + 1];
        }
      }
      return '';
    };
    
    const extractedId = extractPlanIdFromUrl();
    setPlanId(extractedId);
  }, []);
  
  // Buscar dados do plano quando o ID estiver disponível
  useEffect(() => {
    if (planId) {
      fetchPlan();
    }
  }, [planId]);
  
  const fetchPlan = async () => {
    if (!planId) {
      setError('ID do plano inválido');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await planAPI.getPlanById(planId);
      
      // Processar a resposta
      let planData;
      if (response.data.data && response.data.data.plan) {
        planData = response.data.data.plan;
      } else if (response.data.data) {
        planData = response.data.data;
      } else {
        planData = response.data;
      }
      
      setPlan(planData);
      
      // Inicializar campos do formulário com dados existentes
      if (planData.examAnalysis) {
        setFindings(planData.examAnalysis.findings || '');
        setRecommendations(planData.examAnalysis.recommendations || '');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do plano:', error);
      setError('Erro ao carregar os dados do plano. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      
      // Limpar o input para permitir selecionar os mesmos arquivos novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleFileUpload = async () => {
    if (files.length === 0) {
      setUploadError('Selecione pelo menos um arquivo para upload');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    
    try {
      // Criar FormData com os arquivos
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('planId', planId);
      formData.append('category', 'exam');
      
      // Simular progresso (em uma implementação real, usar XMLHttpRequest ou fetch com Progress)
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);
      
      // Enviar arquivos
      await fileAPI.uploadFiles(formData);
      
      // Finalizar progresso
      clearInterval(interval);
      setUploadProgress(100);
      
      // Atualizar exame
      const updateData = {
        examAnalysis: {
          findings: `Arquivos anexados em ${new Date().toLocaleDateString()}`,
          recommendations: recommendations || 'Revisar os arquivos anexados para recomendações'
        },
        hasAttachments: true,
        changeDescription: 'Upload de arquivos de exames'
      };
      
      await planAPI.updatePlan(planId, updateData);
      
      // Mostrar mensagem de sucesso e redirecionar
      alert('Arquivos de exames enviados com sucesso!');
      router.push(`/dashboard/plans/${planId}`);
    } catch (error) {
      console.error('Erro ao fazer upload dos arquivos:', error);
      setUploadError('Ocorreu um erro ao enviar os arquivos. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!planId) {
      setError('ID do plano inválido');
      return;
    }
    
    if (analysisType === 'files') {
      await handleFileUpload();
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Preparar os dados para atualização
      const updateData = {
        examAnalysis: {
          findings,
          recommendations
        },
        changeDescription: 'Atualização da análise de exames'
      };
      
      // Enviar atualização para a API
      await planAPI.updatePlan(planId, updateData);
      
      // Mostrar mensagem de sucesso e redirecionar
      alert('Análise de exames atualizada com sucesso!');
      router.push(`/dashboard/plans/${planId}`);
    } catch (error) {
      console.error('Erro ao atualizar análise de exames:', error);
      setError('Ocorreu um erro ao salvar os dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando dados do plano...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="bg-red-100 p-4 rounded-md text-red-600 mb-4">
            {error}
          </div>
          <Link href={`/dashboard/plans/${planId}`} className="text-emerald-600 hover:text-emerald-800">
            Voltar para detalhes do plano
          </Link>
        </div>
      </div>
    );
  }
  
  if (!plan) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="bg-amber-100 p-4 rounded-md text-amber-600 mb-4">
            Plano não encontrado
          </div>
          <Link href="/dashboard/plans" className="text-emerald-600 hover:text-emerald-800">
            Voltar para lista de planos
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/dashboard/plans/${planId}`} className="inline-flex items-center text-emerald-600 hover:text-emerald-800">
          <ArrowLeft size={16} className="mr-1" />
          Voltar
        </Link>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Análise de Exames</h1>
        
        {/* Informações básicas do paciente */}
        <div className="mb-6 bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-500 mb-1">Paciente</p>
          <p className="font-medium">{plan.patientData?.fullName || 'Não informado'}</p>
        </div>
        
        {/* Selector para tipo de análise */}
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 mb-2">Escolha o tipo de análise:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${analysisType === 'text' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-300'}`}
              onClick={() => setAnalysisType('text')}
            >
              <FileText size={32} className={`mb-2 ${analysisType === 'text' ? 'text-emerald-500' : 'text-gray-400'}`} />
              <h3 className="font-medium">Resumo em Texto</h3>
              <p className="text-xs text-center text-gray-500 mt-1">Descreva os achados e recomendações em formato de texto</p>
            </div>
            
            <div
              className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${analysisType === 'files' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-300'}`}
              onClick={() => setAnalysisType('files')}
            >
              <Image size={32} className={`mb-2 ${analysisType === 'files' ? 'text-emerald-500' : 'text-gray-400'}`} />
              <h3 className="font-medium">Arquivos de Exames</h3>
              <p className="text-xs text-center text-gray-500 mt-1">Faça upload de PDFs e imagens dos resultados de exames</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {analysisType === 'text' ? (
              <>
                {/* Campo de Achados */}
                <div>
                  <label htmlFor="findings" className="block text-sm font-medium text-gray-700 mb-1">
                    Achados
                  </label>
                  <textarea
                    id="findings"
                    name="findings"
                    rows={6}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="Descreva os achados significativos dos exames..."
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Registre os principais achados, anomalias ou pontos relevantes identificados nos exames.
                  </p>
                </div>
                
                {/* Campo de Recomendações */}
                <div>
                  <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700 mb-1">
                    Recomendações
                  </label>
                  <textarea
                    id="recommendations"
                    name="recommendations"
                    rows={6}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="Insira recomendações baseadas nos exames..."
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Inclua recomendações específicas para o paciente com base nos resultados dos exames.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Upload de arquivos */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  
                  <div className="space-y-2">
                    <Upload size={32} className="mx-auto text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-900">Arraste e solte arquivos ou</h3>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Selecionar arquivos
                    </button>
                    <p className="text-xs text-gray-500">PDF, JPG ou PNG (máx. 10MB por arquivo)</p>
                  </div>
                  
                  {uploadError && (
                    <div className="mt-3 text-sm text-red-600">
                      {uploadError}
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="mt-4">
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-emerald-600 rounded-full transition-all" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{uploadProgress}% concluído</p>
                    </div>
                  )}
                </div>
                
                {/* Lista de arquivos selecionados */}
                {files.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-medium text-sm mb-2">Arquivos selecionados ({files.length})</h3>
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
                          <div className="flex items-center">
                            <File size={16} className="text-gray-500 mr-2" />
                            <span className="text-sm truncate max-w-xs">{file.name}</span>
                            <span className="ml-2 text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Campo de Recomendações opcional para uploads */}
                <div>
                  <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700 mb-1">
                    Recomendações (opcional)
                  </label>
                  <textarea
                    id="recommendations"
                    name="recommendations"
                    rows={4}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="Inclua recomendações baseadas nos exames (opcional)..."
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Opcionalmente, adicione algumas recomendações junto com os arquivos.
                  </p>
                </div>
              </>
            )}
            
            {/* Botões de ação */}
            <div className="flex justify-end space-x-3 pt-4">
              <Link
                href={`/dashboard/plans/${planId}`}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSaving || isUploading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    {isUploading ? 'Enviando arquivos...' : 'Salvando...'}
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {analysisType === 'files' ? 'Enviar Arquivos' : 'Salvar Análise'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
