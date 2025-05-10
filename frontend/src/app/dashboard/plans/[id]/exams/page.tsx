'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Upload, 
  File, 
  FileText, 
  Trash, 
  Search,
  Loader,
  AlertCircle,
  ChevronRight,
  Award
} from 'lucide-react';
import { fileAPI, aiAPI, planAPI } from '@/lib/api';

export default function ExamUploadPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const fileInputRef = useRef(null);
  
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('file'); // 'file' or 'manual'

  // Fetch plan details
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setIsLoading(true);
        const response = await planAPI.getPlanById(id);
        setPlan(response.data.data);
        
        // Also fetch any existing files for this plan
        fetchExistingFiles();
      } catch (error) {
        console.error('Failed to fetch plan:', error);
        setError('Failed to load plan details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchExistingFiles = async () => {
      try {
        const response = await fileAPI.listFiles('exam', id);
        setUploadedFiles(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch existing files:', error);
      }
    };

    if (id) {
      fetchPlan();
    }
  }, [id]);

  // Handle file selection via button click
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    
    // Reset the input value so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Remove a file from the list
  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Remove an uploaded file
  const handleRemoveUploadedFile = async (fileId) => {
    try {
      await fileAPI.deleteFile(fileId);
      setUploadedFiles(prevFiles => prevFiles.filter(file => file._id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
      setError('Failed to delete file. Please try again.');
    }
  };

  // Upload files
  const handleUploadFiles = async () => {
    if (files.length === 0) {
      setError('Por favor, selecione pelo menos um arquivo para upload.');
      return;
    }

    setError('');
    setSuccessMessage('');
    
    const totalFiles = files.length;
    let uploadedCount = 0;
    
    for (const file of files) {
      try {
        await fileAPI.uploadFile(file, id, null, 'exam');
        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        setError(`Falha ao enviar o arquivo ${file.name}. Por favor, tente novamente.`);
        return;
      }
    }
    
    // Reset state and fetch updated files
    setFiles([]);
    setUploadProgress(0);
    setSuccessMessage(`${totalFiles} arquivo(s) enviado(s) com sucesso.`);
    
    // Refresh the list of uploaded files
    try {
      const response = await fileAPI.listFiles('exam', id);
      setUploadedFiles(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch updated files:', error);
    }
  };

  // Analyze exams
  const handleAnalyzeExams = async () => {
    try {
      setIsAnalyzing(true);
      setError('');
      setSuccessMessage('');
      
      if (analysisMode === 'file' && uploadedFiles.length === 0) {
        setError('Você precisa fazer upload de pelo menos um arquivo de exame para análise.');
        setIsAnalyzing(false);
        return;
      }
      
      if (analysisMode === 'manual' && !manualInput.trim()) {
        setError('Por favor, insira os resultados do exame para análise.');
        setIsAnalyzing(false);
        return;
      }
      
      // Prepare a simple patient info string for context
      const patientInfo = `
        Nome: ${plan?.patientName || 'Não informado'}
        Data de Nascimento: ${plan?.patientBirthdate ? new Date(plan.patientBirthdate).toLocaleDateString('pt-BR') : 'Não informada'}
        Observações: ${plan?.initialObservations || 'Nenhuma observação'}
      `;
      
      // Use file content or manual input
      let examResults = '';
      
      if (analysisMode === 'manual') {
        examResults = manualInput;
      } else {
        // For file mode, we indicate that files need to be processed by the backend
        examResults = 'PROCESS_UPLOADED_FILES';
      }
      
      // Call the AI service to analyze exams
      await aiAPI.analyzeExams(id, examResults, patientInfo);
      
      setSuccessMessage('Exames analisados com sucesso!');
      
      // Redirect back to the plan page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/plans/${id}`);
      }, 2000);
    } catch (error) {
      console.error('Failed to analyze exams:', error);
      setError(error.response?.data?.message || 'Falha ao analisar os exames. Por favor, tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href={`/dashboard/plans/${id}`} className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Análise de Exames {plan?.patientName ? `- ${plan.patientName}` : ''}
        </h1>
      </div>

      {isLoading ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-center items-center py-12">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Mode Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <button
                className={`flex-1 py-3 px-4 rounded-md border ${
                  analysisMode === 'file' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                } transition-colors duration-200`}
                onClick={() => setAnalysisMode('file')}
              >
                <div className="flex justify-center items-center">
                  <Upload size={20} className="mr-2" />
                  <span className="font-medium">Upload de Arquivos</span>
                </div>
                <p className="text-sm mt-1 text-center">
                  Envie PDFs de exames para análise automática
                </p>
              </button>
              
              <button
                className={`flex-1 py-3 px-4 rounded-md border ${
                  analysisMode === 'manual' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                } transition-colors duration-200`}
                onClick={() => setAnalysisMode('manual')}
              >
                <div className="flex justify-center items-center">
                  <FileText size={20} className="mr-2" />
                  <span className="font-medium">Entrada Manual</span>
                </div>
                <p className="text-sm mt-1 text-center">
                  Digite os resultados dos exames diretamente
                </p>
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          {analysisMode === 'file' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload de Exames</h2>
              
              {/* Error and success messages */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                  <AlertCircle size={20} className="text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
                  <Award size={20} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}
              
              {/* Drag and drop area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                <div className="flex flex-col items-center">
                  <Upload size={36} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-1">
                    <span className="font-medium text-emerald-600">Clique para upload</span> ou arraste e solte
                  </p>
                  <p className="text-xs text-gray-400">
                    PDFs, JPG, JPEG, PNG (máx. 10MB)
                  </p>
                </div>
              </div>
              
              {/* Selected files list */}
              {files.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Arquivos selecionados</h3>
                  <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between py-3 px-4">
                        <div className="flex items-center">
                          <File size={18} className="text-gray-400 mr-3" />
                          <span className="text-sm text-gray-700 truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                        >
                          <Trash size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-emerald-600 h-2.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {uploadProgress}% concluído
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <button
                      onClick={handleUploadFiles}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      <Upload size={16} className="mr-2" />
                      Enviar Arquivos
                    </button>
                  </div>
                </div>
              )}
              
              {/* Uploaded files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Exames enviados</h3>
                  <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                    {uploadedFiles.map((file) => (
                      <li key={file._id} className="flex items-center justify-between py-3 px-4">
                        <div className="flex items-center">
                          <File size={18} className="text-gray-400 mr-3" />
                          <span className="text-sm text-gray-700 truncate" title={file.filename}>
                            {file.filename}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {new Date(file.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={`/api/files/${file._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-500 hover:text-emerald-700 focus:outline-none"
                          >
                            <Search size={16} />
                          </a>
                          <button
                            onClick={() => handleRemoveUploadedFile(file._id)}
                            className="text-red-500 hover:text-red-700 focus:outline-none"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* Manual Input Section */}
          {analysisMode === 'manual' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Entrada Manual de Resultados</h2>
              
              {/* Error and success messages */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                  <AlertCircle size={20} className="text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
                  <Award size={20} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="examResults" className="block text-sm font-medium text-gray-700 mb-1">
                    Resultados dos Exames
                  </label>
                  <textarea
                    id="examResults"
                    rows={10}
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Cole ou digite os resultados dos exames aqui. Inclua nome do exame, valores de referência e valores encontrados para melhor análise."
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  ></textarea>
                  <p className="mt-1 text-xs text-gray-500">
                    Por favor, insira as informações no formato mais detalhado possível para uma análise mais precisa.
                  </p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Exemplo de Formato</h3>
                  <pre className="text-xs text-yellow-700 whitespace-pre-wrap">
                    {`Hemograma:
Hemácias: 4.5 milhões/mm³ (Referência: 4.0-5.5)
Hemoglobina: 13.5 g/dL (Referência: 12.0-16.0)
Hematócrito: 42% (Referência: 36-48%)
Leucócitos: 7,000/mm³ (Referência: 4,000-11,000)

Bioquímica:
Glicose: 95 mg/dL (Referência: 70-99)
Colesterol total: 185 mg/dL (Referência: <200)
HDL: 60 mg/dL (Referência: >40)
LDL: 110 mg/dL (Referência: <130)`}
                  </pre>
                </div>
              </div>
            </div>
          )}
          
          {/* Analysis Action */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleAnalyzeExams}
              disabled={isAnalyzing}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isAnalyzing ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
            >
              {isAnalyzing ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Search size={16} className="mr-2" />
                  Analisar Exames
                </>
              )}
            </button>
          </div>
          
          {/* Next Steps */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-100">
            <h2 className="text-lg font-medium text-emerald-800 mb-2">Próximos Passos</h2>
            <p className="text-sm text-emerald-700 mb-4">
              Após a análise dos exames, você poderá:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start">
                <ChevronRight size={16} className="text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-emerald-700">
                  Revisar os achados e recomendações geradas pela IA
                </p>
              </li>
              <li className="flex items-start">
                <ChevronRight size={16} className="text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-emerald-700">
                  Adicionar observações de Medicina Tradicional Chinesa para uma análise mais completa
                </p>
              </li>
              <li className="flex items-start">
                <ChevronRight size={16} className="text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-emerald-700">
                  Gerar um plano de saúde personalizado com base em todas as análises
                </p>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
