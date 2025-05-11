'use client';

import { useEffect, useState, useRef, FormEvent, ChangeEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { planAPI, fileAPI } from '@/lib/api';
import { generateExamAnalysis } from '@/services/aiAnalysisService';
// import { Button } from '@/components/ui/button'; // Commented out
// import { Input } from '@/components/ui/input'; // Commented out
// import { Textarea } from '@/components/ui/textarea'; // Commented out
// import { Label } from '@/components/ui/label'; // Commented out
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Commented out
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // Commented out
import { ChevronLeft, Brain, User, FileText, Upload, Trash2, AlertCircle, CheckCircle, Edit3, Loader2, Calendar, Info, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import Link from 'next/link';
import { ArrowLeft, Save, File, X, Image } from 'lucide-react';
import AIAnalysisAnimation from '@/components/AIAnalysisAnimation';
import AIAnalysisResult from '@/components/AIAnalysisResult';

export default function EditPlanPage() {
  const router = useRouter();
  const { id } = useParams();
  const [planId, setPlanId] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Extrair o ID do plano da URL em vez de usar params
  useEffect(() => {
    const extractPlanIdFromUrl = () => {
      const pathParts = window.location.pathname.split('/');
      // O formato da URL é /dashboard/plans/{id}/edit
      // Então o ID está 2 posições antes do final (antes de /edit)
      const idIndex = pathParts.length - 2;
      if (idIndex >= 0 && pathParts[idIndex] !== 'plans') {
        return pathParts[idIndex];
      }
      return '';
    };
    
    const extractedId = extractPlanIdFromUrl();
    setPlanId(extractedId);
  }, []);
  const [formData, setFormData] = useState({
    patientName: '',
    patientBirthdate: '',
    patientEmail: '',
    patientPhone: '',
    initialObservations: '',
    professionalType: 'nutritionist',
    // Seção para análise de exames
    examAnalysis: {
      findings: '',
      recommendations: ''
    }
  });
  
  // Estados para a análise de exames
  const [activeSection, setActiveSection] = useState<string>('exam-analysis');
  const [analysisType, setAnalysisType] = useState<'text' | 'files'>('text');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [canAnalyzeWithAI, setCanAnalyzeWithAI] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAIOption, setShowAIOption] = useState(false);
  
  // Referência para o input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setIsLoading(true);
        const response = await planAPI.getPlanById(planId);
        const plan = response.data.data;
        
        // Format the date to YYYY-MM-DD for the input field
        const formatDate = (dateString: string | undefined): string => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return format(date, 'yyyy-MM-dd');
        };
        
        setFormData({
          patientName: plan.patientName || '',
          patientBirthdate: formatDate(plan.patientBirthdate),
          patientEmail: plan.patientEmail || '',
          patientPhone: plan.patientPhone || '',
          initialObservations: plan.initialObservations || '',
          professionalType: plan.professionalType || 'nutritionist',
          examAnalysis: {
            findings: plan.examAnalysis?.findings || '',
            recommendations: plan.examAnalysis?.recommendations || ''
          }
        });
        
        // Verificar se já existem análises salvas para habilitar a opção de IA
        if (plan.examAnalysis?.findings || plan.hasAttachments) {
          setCanAnalyzeWithAI(true);
        }
        
        // Verificar se há arquivos já enviados
        if (plan.attachments && plan.attachments.length > 0) {
          const examFiles = plan.attachments.filter((file: any) => file.category === 'exam');
          if (examFiles.length > 0) {
            setUploadedFiles(examFiles);
            setAnalysisType('files');
          }
        }
        
        // Verificar se há um parâmetro de seção na URL
        const urlParams = new URLSearchParams(window.location.search);
        const section = urlParams.get('section');
        if (section === 'examResults') {
          setActiveSection('exam-analysis');
        }
      } catch (error) {
        console.error('Failed to fetch plan:', error);
        setError('Failed to load plan. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (planId) {
      fetchPlan();
    }
  }, [planId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Verificar se o nome do campo pertence à análise de exames
    if (name === 'findings' || name === 'recommendations') {
      setFormData({
        ...formData,
        examAnalysis: {
          ...formData.examAnalysis,
          [name]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // Métodos para upload de arquivos
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
      return false;
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
      const response = await fileAPI.uploadFiles(formData);
      
      // Finalizar progresso
      clearInterval(interval);
      setUploadProgress(100);
      
      if (response.data?.files) {
        setUploadedFiles(response.data.files);
      }
      
      // Habilitar a análise com IA
      setCanAnalyzeWithAI(true);
      
      // Limpar lista de arquivos selecionados
      setFiles([]);
      
      // Atualizar o plano para indicar que tem anexos
      await planAPI.updatePlan(planId, {
        hasAttachments: true,
        changeDescription: 'Upload de arquivos de exames'
      });
      
      setIsUploading(false);
      return true;
    } catch (error) {
      console.error('Erro ao fazer upload dos arquivos:', error);
      setUploadError('Ocorreu um erro ao enviar os arquivos. Tente novamente.');
      setIsUploading(false);
      return false;
    }
  };
  
  // Método para análise com IA
  const runAIAnalysis = async () => {
    if (!planId) {
      alert('ID do plano inválido');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Preparar dados para análise
      const analysisData = {
        findings: formData.examAnalysis.findings,
        recommendations: formData.examAnalysis.recommendations,
        fileNames: uploadedFiles.map((f: any) => f.fileName || f.name),
        patientInfo: {
          fullName: formData.patientName,
          age: formData.patientBirthdate ? calculateAge(new Date(formData.patientBirthdate)) : undefined,
          gender: 'not_specified' // Adicionar campo de gênero no futuro
        }
      };
      
      // Executar análise
      const result = await generateExamAnalysis(analysisData, (progress: number) => {
        setAnalysisProgress(progress);
      });
      
      setAnalysisResult(result);
      
      // Atualizar o campo de achados com o resumo se estiver vazio
      if (!formData.examAnalysis.findings || formData.examAnalysis.findings.trim().length === 0) {
        setFormData({
          ...formData,
          examAnalysis: {
            ...formData.examAnalysis,
            findings: result.summary
          }
        });
      }
      
      // Atualizar o campo de recomendações se estiver vazio
      if (!formData.examAnalysis.recommendations || formData.examAnalysis.recommendations.trim().length === 0) {
        setFormData({
          ...formData,
          examAnalysis: {
            ...formData.examAnalysis,
            recommendations: result.recommendations.join('\n\n')
          }
        });
      }
      
    } catch (error) {
      console.error('Erro na análise por IA:', error);
      alert('Não foi possível completar a análise por IA. Tente novamente mais tarde.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Função para calcular idade
  const calculateAge = (birthdate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.patientName.trim()) {
      setError('Nome do paciente é obrigatório');
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      
      // Se estivermos na seção de análise de exames e o tipo for arquivos, fazer upload primeiro
      if (activeSection === 'exam-analysis' && analysisType === 'files' && files.length > 0) {
        const uploadSuccess = await handleFileUpload();
        if (!uploadSuccess) {
          setIsSaving(false);
          return;
        }
      }
      
      // Salvar os dados do formulário
      await planAPI.updatePlan(planId, formData);
      
      // Habilitar a opção de IA após salvar dados de análise
      if (activeSection === 'exam-analysis' && 
          (formData.examAnalysis.findings || formData.examAnalysis.recommendations || uploadedFiles.length > 0)) {
        setCanAnalyzeWithAI(true);
      }
      
      // Mostrar mensagem de sucesso
      alert('Plano atualizado com sucesso!');
      
      // Se a ação veio da tela inicial, voltar para os detalhes do plano
      if (activeSection === 'patient-info') {
        router.push(`/dashboard/plans/${planId}`);
      }
    } catch (error: any) {
      console.error('Failed to update plan:', error);
      setError(error.response?.data?.message || 'Falha ao atualizar o plano. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // Re-lint trigger comment
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header Section */} 
      <div className="flex items-center mb-6">
        <Link href={`/dashboard/plans/${planId}`} className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Plano</h1>
      </div> {/* Closes Header Section div */}

      {/* AI Analysis Animation Section (sibling to header and motion.div) */} 
      <AIAnalysisAnimation
        isAnalyzing={isAnalyzing}
        progress={analysisProgress}
        message="Processando análise de exames com IA..."
      />

      {/* Main Content Card Section with Motion (sibling to header and AIAnalysisAnimation) */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6" // Add margin for spacing after animation
      >
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200"> {/* Card starts here */}
          <div className="flex border-b border-gray-200"> {/* Tabs start here */}
            <button
              type="button"
              onClick={() => setActiveSection('patient-info')}
              className={`flex-1 py-3 px-4 text-center ${activeSection === 'patient-info' 
                ? 'text-emerald-600 font-medium border-b-2 border-emerald-500' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              Informações do Paciente
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('exam-analysis')}
              className={`flex-1 py-3 px-4 text-center ${activeSection === 'exam-analysis' 
                ? 'text-emerald-600 font-medium border-b-2 border-emerald-500' 
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              Análise de Exames
            </button>
          </div> {/* Closes Tabs div */}
          
          <div className="p-6"> {/* Card content area starts here */}
            {(() => {
              if (isLoading) {
                return <p>Carregando...</p>; // Or a more complex skeleton
              }
              if (error) { // This 'error' is from data fetching (e.g., usePlan)
                return (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                );
              }
              if (!plan) { // After loading, if plan is still not available
                return <p>Plano não encontrado.</p>;
              }
              // If we reach here, plan is loaded, and there's no data fetching error
              return (
                <>
                  {/* A separate form submission error could be displayed here if needed */}
                  
                  {/* Seção de informações do paciente - Explicitly commented out for debugging */}
                  {/* {activeSection === 'patient-info' && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">
                          Nome do Paciente *
                        </label>
                        <input
                          type="text"
                          id="patientName"
                          name="patientName"
                          value={formData.patientName}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="patientBirthdate" className="block text-sm font-medium text-gray-700">
                          Data de Nascimento
                        </label>
                        <input
                          type="date"
                          id="patientBirthdate"
                          name="patientBirthdate"
                          value={formData.patientBirthdate}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700">
                          E-mail do Paciente
                        </label>
                        <input
                          type="email"
                          id="patientEmail"
                          name="patientEmail"
                          value={formData.patientEmail}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700">
                          Telefone do Paciente
                        </label>
                        <input
                          type="tel"
                          id="patientPhone"
                          name="patientPhone"
                          value={formData.patientPhone}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="professionalType" className="block text-sm font-medium text-gray-700">
                          Tipo de Profissional
                        </label>
                        <select
                          id="professionalType"
                          name="professionalType"
                          value={formData.professionalType}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        >
                          <option value="nutritionist">Nutricionista</option>
                          <option value="doctor">Médico</option>
                          <option value="chinese_medicine">Medicina Chinesa</option>
                          <option value="naturopath">Naturopata</option>
                          <option value="functional_medicine">Medicina Funcional</option>
                          <option value="other">Outro</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="initialObservations" className="block text-sm font-medium text-gray-700">
                          Observações Iniciais
                        </label>
                        <textarea
                          id="initialObservations"
                          name="initialObservations"
                          value={formData.initialObservations}
                          onChange={handleInputChange}
                          rows={4}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                          placeholder="Adicione observações iniciais ou informações relevantes sobre o paciente..."
                        ></textarea>
                      </div>
                    </div>
                  )} */}

                  {/* Seção de análise de exames - Explicitly commented out for debugging */}
                  {/* {activeSection === 'exam-analysis' && (
                    <div className="space-y-6">
                      <div className="mb-6">
                        <div className="text-sm font-medium text-gray-700 mb-2">Escolha o tipo de análise:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div
                            className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${analysisType === 'text' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-300'}`}
                            onClick={() => setAnalysisType('text')}
                          >
                            <FileText size={32} className={`mb-2 ${analysisType === 'text' ? 'text-emerald-500' : 'text-gray-400'}`} />
                            <h3 className="text-sm font-medium text-gray-900">Resumo em Texto</h3>
                            <p className="text-xs text-center text-gray-500 mt-1">Descreva os achados e recomendações em formato de texto</p>
                          </div>
                          
                          <div
                            className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${analysisType === 'files' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-300'}`}
                            onClick={() => setAnalysisType('files')}
                          >
                            <Image size={32} className={`mb-2 ${analysisType === 'files' ? 'text-emerald-500' : 'text-gray-400'}`} />
                            <h3 className="text-sm font-medium text-gray-900">Arquivos de Exames</h3>
                            <p className="text-xs text-center text-gray-500 mt-1">Faça upload de PDFs e imagens dos resultados de exames</p>
                          </div>
                        </div>
                      </div>

                      {analysisType === 'text' && (
                        <div className="space-y-4">
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
                              value={formData.examAnalysis.findings}
                              onChange={handleInputChange}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                              Registre os principais achados, anomalias ou pontos relevantes identificados nos exames.
                            </p>
                          </div>
                          
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
                              value={formData.examAnalysis.recommendations}
                              onChange={handleInputChange}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                              Inclua recomendações específicas para o paciente com base nos resultados dos exames.
                            </p>
                          </div>
                        </div>
                      )}

                      {analysisType === 'files' && (
                        <div className="space-y-4">
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
                                  />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">{uploadProgress}% concluído</p>
                              </div>
                            )}
                          </div>
                          
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
                          
                          {uploadedFiles.length > 0 && (
                            <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                              <h3 className="font-medium mb-2">Arquivos já enviados</h3>
                              <ul className="space-y-2">
                                {uploadedFiles.map((file: any, index: number) => (
                                  <li key={index} className="flex items-center text-sm">
                                    <File size={16} className="text-gray-500 mr-2" />
                                    <span className="text-gray-700">{file.fileName || file.name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
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
                              value={formData.examAnalysis.recommendations}
                              onChange={handleInputChange}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                              Opcionalmente, adicione algumas recomendações junto com os arquivos.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {canAnalyzeWithAI && (
                        <div className="mt-6 border-t border-gray-100 pt-6">
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100"
                          >
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-100 rounded-full mr-3">
                                <Brain size={20} className="text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-blue-800 text-sm">Assistente de IA disponível</h4>
                                <p className="text-xs text-blue-600">Gerar análise automatizada com base nos dados fornecidos</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowAIOption(!showAIOption)}
                                className="ml-auto bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full transition-colors"
                              >
                                {showAIOption ? 'Ocultar' : 'Mostrar Opções'}
                              </button>
                            </div>

                            {showAIOption && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 bg-white p-3 rounded-md border border-blue-100"
                              >
                                <p className="text-sm text-gray-600 mb-3">
                                  Nosso assistente de IA pode analisar os dados fornecidos e gerar um resumo detalhado 
                                  com achados principais e recomendações baseadas nos dados disponíveis.
                                </p>
                                <button
                                  type="button"
                                  onClick={runAIAnalysis}
                                  disabled={isAnalyzing}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center w-full"
                                >
                                  {isAnalyzing ? 'Analisando...' : 'Gerar Análise com IA'}
                                </button>
                              </motion.div>
                            )}
                          </motion.div>
                          
                          {analysisResult && !isAnalyzing && (
                            <AIAnalysisResult result={analysisResult} />
                          )}
                        </div>
                      )}
                    </div>
                  )} */} 

                  <div className="flex items-center justify-end space-x-3">
                    <Link
                      href={`/dashboard/plans/${planId}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      Cancelar
                    </Link>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSaving ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                    >
                      <Save size={16} className="mr-2" />
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div> {/* Closes <div className="p-6"> (Card content area) */}
        </div>   {/* Closes <div className="bg-white ..."> (The Card itself) */}
      </motion.div> */}
    </div>       {/* Closes <div className="container mx-auto ..."> (the main page container) */}
  );
}
