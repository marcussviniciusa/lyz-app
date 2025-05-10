'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Loader, 
  Save, 
  ChevronDown, 
  AlertCircle,
  AlertTriangle,
  Brain,
  Award 
} from 'lucide-react';
import { planAPI, aiAPI } from '@/lib/api';

// Utility function for deep merging objects
const deepMerge = <T extends Record<string, any>>(target: T, source: Record<string, any>): T => {
  const output = { ...target } as T;
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        typeof source[key] === 'object' && 
        source[key] !== null &&
        key in target && 
        typeof target[key as keyof T] === 'object' &&
        target[key as keyof T] !== null
      ) {
        output[key as keyof T] = deepMerge(
          target[key as keyof T] as Record<string, any>, 
          source[key]
        ) as any;
      } else {
        output[key as keyof T] = source[key] as any;
      }
    }
  }
  
  return output;
};

interface TCMObservations {
  facialObservations: {
    faceColor: string;
    skinTexture: string;
    specificAreas: {
      forehead: string; // Bladder and Intestines
      cheeks: string;   // Lungs
      nose: string;     // Heart
      chin: string;     // Kidneys
      jawline: string   // Stomach and Digestion
    };
    additionalNotes: string;
  };
  tongueObservations: {
    tongueColor: string;
    tongueShape: string;
    tongueSize: string;
    tongueCoating: {
      color: string;
      thickness: string;
    };
    tongueBody: {
      cracks: boolean;
      teethMarks: boolean;
      tremor: boolean;
    };
    specificAreas: {
      tip: string;       // Heart and Lungs
      center: string;    // Spleen and Stomach
      sides: string;     // Liver and Gallbladder
      root: string       // Kidneys
    };
    additionalNotes: string;
  };
  pulseObservations: {
    leftWrist: {
      cun: string; // Heart and Small Intestine
      guan: string; // Liver and Gallbladder
      chi: string  // Kidney Yin and Urinary Bladder
    };
    rightWrist: {
      cun: string; // Lungs and Large Intestine
      guan: string; // Spleen and Stomach
      chi: string  // Kidney Yang and Triple Warmer
    };
    pulseRate: string;
    pulseStrength: string;
    pulseRhythm: string;
    additionalNotes: string;
  };
  energeticObservations: {
    fiveElements: {
      wood: string;
      fire: string;
      earth: string;
      metal: string;
      water: string;
    };
    yinYang: string;
    qi: string;
    xue: string;
    jinYe: string;
    shen: string;
    additionalNotes: string;
  };
}

const initialTCMObservations: TCMObservations = {
  facialObservations: {
    faceColor: '',
    skinTexture: '',
    specificAreas: {
      forehead: '',
      cheeks: '',
      nose: '',
      chin: '',
      jawline: ''
    },
    additionalNotes: ''
  },
  tongueObservations: {
    tongueColor: '',
    tongueShape: '',
    tongueSize: '',
    tongueCoating: {
      color: '',
      thickness: ''
    },
    tongueBody: {
      cracks: false,
      teethMarks: false,
      tremor: false
    },
    specificAreas: {
      tip: '',
      center: '',
      sides: '',
      root: ''
    },
    additionalNotes: ''
  },
  pulseObservations: {
    leftWrist: { cun: '', guan: '', chi: '' },
    rightWrist: { cun: '', guan: '', chi: '' },
    pulseRate: '',
    pulseStrength: '',
    pulseRhythm: '',
    additionalNotes: ''
  },
  energeticObservations: {
    fiveElements: {
      wood: '',
      fire: '',
      earth: '',
      metal: '',
      water: ''
    },
    yinYang: '',
    qi: '',
    xue: '',
    jinYe: '',
    shen: '',
    additionalNotes: ''
  },
};

// Helper type for keys of TCMObservations
type TCMSectionKeys = keyof TCMObservations;

// Define expanded sections state type
type ExpandedSectionsState = {
  [key in 'facialObservations' | 'tongueObservations' | 'pulseObservations' | 'energeticObservations']: boolean;
};

interface TCMPageParams {
  id: string;
  [key: string]: string;
}

export default function TCMObservationsPage({ params }: { params: TCMPageParams }) {
  const router = useRouter();
  const { id } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [patientInfo, setPatientInfo] = useState<any>(null); // Consider typing this if structure is known
  const [plan, setPlan] = useState<any>(null); // Plan data
  const [expandedSections, setExpandedSections] = useState<ExpandedSectionsState>({
    facialObservations: true,
    tongueObservations: false,
    pulseObservations: false,
    energeticObservations: false,
  });
  
  // Form data state for TCM observations
  const [formData, setFormData] = useState<TCMObservations>(initialTCMObservations);

  // Fetch plan details
  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        setError(null);
        const response = await planAPI.getPlanById(id);
        
        // Assuming the API returns data in a standard format like { data: { ... } }
        const planData = response.data ? response.data : response;
        
        // Set the plan data
        setPlan(planData);
        
        // If the plan already has TCM observations, merge them with initial state
        if (planData && planData.tcmObservations) {
          const mergedObservations = deepMerge(initialTCMObservations, planData.tcmObservations);
          setFormData(mergedObservations);
        }
        
        // Set patient info if available
        if (planData) {
          // For now, create a simple patient info object from plan data
          setPatientInfo({
            name: planData.patientName || 'Não informado',
            birthdate: planData.patientBirthdate ? new Date(planData.patientBirthdate).toLocaleDateString('pt-BR') : 'Não informada',
            observations: planData.initialObservations || 'Nenhuma observação'
          });
        }
      } catch (error) {
        console.error('Failed to fetch plan details:', error);
        setError('Não foi possível carregar os dados do plano. Por favor, tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPlanDetails();
    }
  }, [id]);

  // Generic input handler for top-level fields of a section
  const handleInputChange = <
    S extends TCMSectionKeys,
    F extends keyof TCMObservations[S]
  >(
    section: S,
    field: F,
    value: TCMObservations[S][F]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Generic input handler for nested fields (one level deep)
  const handleNestedInputChange = <
    S extends TCMSectionKeys,
    N extends keyof TCMObservations[S],
    K extends keyof TCMObservations[S][N]
  >(
    section: S,
    nestedKey: N,
    field: K,
    value: TCMObservations[S][N][K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedKey]: {
          ...(prev[section][nestedKey] as object), // Assert that nestedKey maps to an object
          [field]: value,
        },
      },
    }));
  };

  // Toggle section expansion
  const toggleSection = (sectionName: keyof ExpandedSectionsState) => {
    setExpandedSections({
      ...expandedSections,
      [sectionName]: !expandedSections[sectionName]
    });
  };

  // Save TCM observations
  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage('');
      
      await planAPI.updatePlan(id, { tcmObservations: formData });
      
      setSuccessMessage('Observações de MTC salvas com sucesso!');
    } catch (error) {
      console.error('Failed to save TCM observations:', error);
      setError('Não foi possível salvar as observações. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Analyze TCM observations using AI
  const handleAnalyze = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage('');
      
      // Save observations first
      await planAPI.updatePlan(id, { tcmObservations: formData });
      
      // Send observations for AI analysis
      // Converter objeto TCMObservations para string
      await aiAPI.analyzeTCM(id, JSON.stringify(formData), patientInfo);
      
      // Redirect to analysis results
      router.push(`/dashboard/plans/${id}/tcm/analysis`);
    } catch (error) {
      console.error('Failed to analyze TCM observations:', error);
      setError('Não foi possível analisar as observações. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href={`/dashboard/plans/${id}`} className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Observações de MTC {plan?.patientName ? `- ${plan.patientName}` : ''}
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
          {/* Error and success messages */}
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
                  <Award className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Facial Observations Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('facialObservations')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-medium text-gray-900">Observações Faciais</h2>
              <ChevronDown
                size={20}
                className={`text-gray-500 transform transition-transform ${
                  expandedSections.facialObservations ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {expandedSections.facialObservations && (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="faceColor" className="block text-sm font-medium text-gray-700">
                    Coloração Facial
                  </label>
                  <select
                    id="faceColor"
                    value={formData.facialObservations.faceColor}
                    onChange={(e) => handleInputChange('facialObservations', 'faceColor', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  >
                    <option value="">Selecione a coloração predominante</option>
                    <option value="vermelho">Vermelho - Calor</option>
                    <option value="palido">Pálido - Deficiência de Qi/Sangue</option>
                    <option value="amarelo">Amarelo - Umidade/Problema Digestivo</option>
                    <option value="verde">Verde/Azulado - Estagnação</option>
                    <option value="branco">Branco - Frio/Deficiência</option>
                    <option value="escuro">Escuro/Preto - Frio Extremo/Estagnação</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="skinTexture" className="block text-sm font-medium text-gray-700">
                    Textura da Pele
                  </label>
                  <select
                    id="skinTexture"
                    value={formData.facialObservations.skinTexture}
                    onChange={(e) => handleInputChange('facialObservations', 'skinTexture', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  >
                    <option value="">Selecione a textura</option>
                    <option value="seca">Seca - Deficiência de Yin/Fluidos</option>
                    <option value="oleosa">Oleosa - Calor/Umidade</option>
                    <option value="rugosa">Rugosa - Deficiência de Sangue</option>
                    <option value="fina">Fina/Delicada - Deficiência de Qi</option>
                    <option value="grossa">Grossa/Espessa - Estagnação</option>
                    <option value="hidratada">Hidratada/Saudável - Equilíbrio</option>
                  </select>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Áreas Específicas do Rosto
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="forehead" className="block text-sm font-medium text-gray-700">Testa (Bexiga, Intestinos)</label>
                      <textarea
                        id="forehead"
                        rows={2}
                        value={formData.facialObservations.specificAreas.forehead}
                        onChange={(e) => handleNestedInputChange('facialObservations', 'specificAreas', 'forehead', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre a testa..."
                      ></textarea>
                    </div>
                    
                    <div>
                      <label htmlFor="cheeks" className="block text-sm font-medium text-gray-700">Bochechas (Pulmões)</label>
                      <textarea
                        id="cheeks"
                        rows={2}
                        value={formData.facialObservations.specificAreas.cheeks}
                        onChange={(e) => handleNestedInputChange('facialObservations', 'specificAreas', 'cheeks', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre as bochechas..."
                      ></textarea>
                    </div>
                    
                    <div>
                      <label htmlFor="nose" className="block text-sm font-medium text-gray-700">Nariz (Coração)</label>
                      <textarea
                        id="nose"
                        rows={2}
                        value={formData.facialObservations.specificAreas.nose}
                        onChange={(e) => handleNestedInputChange('facialObservations', 'specificAreas', 'nose', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre o nariz..."
                      ></textarea>
                    </div>
                    
                    <div>
                      <label htmlFor="chin" className="block text-sm font-medium text-gray-700">Queixo (Rins)</label>
                      <textarea
                        id="chin"
                        rows={2}
                        value={formData.facialObservations.specificAreas.chin}
                        onChange={(e) => handleNestedInputChange('facialObservations', 'specificAreas', 'chin', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre o queixo..."
                      ></textarea>
                    </div>
                    
                    <div>
                      <label htmlFor="jawline" className="block text-sm font-medium text-gray-700">Linha da Mandíbula (Estômago, Digestão)</label>
                      <textarea
                        id="jawline"
                        rows={2}
                        value={formData.facialObservations.specificAreas.jawline}
                        onChange={(e) => handleNestedInputChange('facialObservations', 'specificAreas', 'jawline', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre a linha da mandíbula..."
                      ></textarea>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="facialAdditionalNotes" className="block text-sm font-medium text-gray-700">
                    Observações Adicionais
                  </label>
                  <textarea
                    id="facialAdditionalNotes"
                    rows={3}
                    value={formData.facialObservations.additionalNotes}
                    onChange={(e) => handleInputChange('facialObservations', 'additionalNotes', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Outras observações relevantes sobre a face..."
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          {/* Tongue Observations Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('tongueObservations')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-medium text-gray-900">Observações da Língua</h2>
              <ChevronDown
                size={20}
                className={`text-gray-500 transform transition-transform ${
                  expandedSections.tongueObservations ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {expandedSections.tongueObservations && (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="tongueColor" className="block text-sm font-medium text-gray-700">
                    Cor da Língua
                  </label>
                  <select
                    id="tongueColor"
                    value={formData.tongueObservations.tongueColor}
                    onChange={(e) => handleInputChange('tongueObservations', 'tongueColor', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  >
                    <option value="">Selecione a cor</option>
                    <option value="palido">Pálido - Deficiência/Frio</option>
                    <option value="vermelho">Vermelho - Calor</option>
                    <option value="vermelhoEscuro">Vermelho Escuro - Calor Extremo</option>
                    <option value="purpura">Púrpura - Estagnação de Sangue</option>
                    <option value="azulado">Azulado - Estagnação/Frio</option>
                    <option value="rosa">Rosa - Normal/Saudável</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="tongueShape" className="block text-sm font-medium text-gray-700">
                    Forma da Língua
                  </label>
                  <select
                    id="tongueShape"
                    value={formData.tongueObservations.tongueShape}
                    onChange={(e) => handleInputChange('tongueObservations', 'tongueShape', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  >
                    <option value="">Selecione a forma</option>
                    <option value="normal">Normal</option>
                    <option value="inchada">Inchada - Deficiência/Umidade</option>
                    <option value="fina">Fina - Deficiência</option>
                    <option value="entalhada">Entalhada/Enrugada - Deficiência de Yin</option>
                    <option value="rigida">Rígida - Frio/Vento Interior</option>
                    <option value="flacida">Flácida - Deficiência de Qi</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="tongueSize" className="block text-sm font-medium text-gray-700">
                    Tamanho da Língua
                  </label>
                  <select
                    id="tongueSize"
                    value={formData.tongueObservations.tongueSize}
                    onChange={(e) => handleInputChange('tongueObservations', 'tongueSize', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  >
                    <option value="">Selecione o tamanho</option>
                    <option value="normal">Normal</option>
                    <option value="grande">Grande - Deficiência/Umidade</option>
                    <option value="pequena">Pequena - Deficiência de Sangue/Fluidos</option>
                    <option value="longa">Longa - Calor no Coração</option>
                    <option value="curta">Curta - Deficiência</option>
                  </select>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Camada Saburral (Coating)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="coatingColor" className="block text-sm font-medium text-gray-700">
                        Cor da Camada
                      </label>
                      <select
                        id="coatingColor"
                        value={formData.tongueObservations.tongueCoating.color}
                        onChange={(e) => handleNestedInputChange('tongueObservations', 'tongueCoating', 'color', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      >
                        <option value="">Selecione a cor</option>
                        <option value="branco">Branco - Frio/Invasão de Patógeno</option>
                        <option value="amarelo">Amarelo - Calor</option>
                        <option value="cinza">Cinza - Umidade/Estagnação</option>
                        <option value="preto">Preto - Calor Extremo/Frio Extremo</option>
                        <option value="verde">Verde - Calor do Fígado</option>
                        <option value="transparente">Transparente/Ausente - Deficiência</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="coatingThickness" className="block text-sm font-medium text-gray-700">
                        Espessura da Camada
                      </label>
                      <select
                        id="coatingThickness"
                        value={formData.tongueObservations.tongueCoating.thickness}
                        onChange={(e) => handleNestedInputChange('tongueObservations', 'tongueCoating', 'thickness', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      >
                        <option value="">Selecione a espessura</option>
                        <option value="normal">Normal</option>
                        <option value="fina">Fina - Início de Patógeno</option>
                        <option value="grossa">Grossa - Umidade/Patógeno Avançado</option>
                        <option value="pegajosa">Pegajosa - Umidade</option>
                        <option value="seca">Seca - Deficiência de Fluidos</option>
                        <option value="ausente">Ausente - Deficiência Severa</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Características do Corpo da Língua
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <input
                        id="cracks"
                        type="checkbox"
                        checked={formData.tongueObservations.tongueBody.cracks}
                        onChange={(e) => handleNestedInputChange('tongueObservations', 'tongueBody', 'cracks', e.target.checked)}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="cracks" className="ml-2 block text-sm text-gray-700">Fissuras (Deficiência de Yin)</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="teethMarks"
                        type="checkbox"
                        checked={formData.tongueObservations.tongueBody.teethMarks}
                        onChange={(e) => handleNestedInputChange('tongueObservations', 'tongueBody', 'teethMarks', e.target.checked)}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="teethMarks" className="ml-2 block text-sm text-gray-700">Marcas de Dentes (Deficiência de Qi)</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="tremor"
                        type="checkbox"
                        checked={formData.tongueObservations.tongueBody.tremor}
                        onChange={(e) => handleNestedInputChange('tongueObservations', 'tongueBody', 'tremor', e.target.checked)}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="tremor" className="ml-2 block text-sm text-gray-700">Tremor (Vento Interior)</label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Áreas Específicas da Língua
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="tongueTip" className="block text-sm font-medium text-gray-700">Ponta (Coração, Pulmões)</label>
                      <textarea
                        id="tongueTip"
                        rows={2}
                        value={formData.tongueObservations.specificAreas.tip}
                        onChange={(e) => handleNestedInputChange('tongueObservations', 'specificAreas', 'tip', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre a ponta da língua..."
                      ></textarea>
                    </div>
                    
                    <div>
                      <label htmlFor="tongueCenter" className="block text-sm font-medium text-gray-700">Centro (Baço, Estômago)</label>
                      <textarea
                        id="tongueCenter"
                        rows={2}
                        value={formData.tongueObservations.specificAreas.center}
                        onChange={(e) => handleNestedInputChange('tongueObservations', 'specificAreas', 'center', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre o centro da língua..."
                      ></textarea>
                    </div>
                    
                    <div>
                      <label htmlFor="tongueSides" className="block text-sm font-medium text-gray-700">Laterais (Fígado, Vesícula Biliar)</label>
                      <textarea
                        id="tongueSides"
                        rows={2}
                        value={formData.tongueObservations.specificAreas.sides}
                        onChange={(e) => handleNestedInputChange('tongueObservations', 'specificAreas', 'sides', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre as laterais da língua..."
                      ></textarea>
                    </div>
                    
                    <div>
                      <label htmlFor="tongueRoot" className="block text-sm font-medium text-gray-700">Raiz (Rins)</label>
                      <textarea
                        id="tongueRoot"
                        rows={2}
                        value={formData.tongueObservations.specificAreas.root}
                        onChange={(e) => handleNestedInputChange('tongueObservations', 'specificAreas', 'root', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre a raiz da língua..."
                      ></textarea>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="tongueAdditionalNotes" className="block text-sm font-medium text-gray-700">
                    Observações Adicionais
                  </label>
                  <textarea
                    id="tongueAdditionalNotes"
                    rows={3}
                    value={formData.tongueObservations.additionalNotes}
                    onChange={(e) => handleInputChange('tongueObservations', 'additionalNotes', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Outras observações relevantes sobre a língua..."
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          {/* Pulse Observations Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('pulseObservations')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-medium text-gray-900">Pulsologia</h2>
              <ChevronDown
                size={20}
                className={`text-gray-500 transform transition-transform ${
                  expandedSections.pulseObservations ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {expandedSections.pulseObservations && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Pulso Esquerdo
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="leftCun" className="block text-sm font-medium text-gray-700">
                        Cun (Coração e Intestino Delgado)
                      </label>
                      <select
                        id="leftCun"
                        value={formData.pulseObservations.leftWrist.cun}
                        onChange={(e) => handleNestedInputChange('pulseObservations', 'leftWrist', 'cun', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      >
                        <option value="">Selecione...</option>
                        <option value="superficial">Superficial (Estagnação/Calor)</option>
                        <option value="profundo">Profundo (Deficiência/Frio)</option>
                        <option value="rapido">Rápido (Calor)</option>
                        <option value="lento">Lento (Frio)</option>
                        <option value="forte">Forte (Excesso)</option>
                        <option value="fraco">Fraco (Deficiência)</option>
                        <option value="fino">Fino (Deficiência de Sangue)</option>
                        <option value="cheio">Cheio (Excesso)</option>
                        <option value="escorregadio">Escorregadio (Umidade/Fleuma)</option>
                        <option value="rugoso">Rugoso (Estagnação)</option>
                        <option value="corda">Em Corda (Estagnação de Qi)</option>
                        <option value="normal">Normal/Equilibrado</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="leftGuan" className="block text-sm font-medium text-gray-700">
                        Guan (Fígado e Vesícula Biliar)
                      </label>
                      <select
                        id="leftGuan"
                        value={formData.pulseObservations.leftWrist.guan}
                        onChange={(e) => handleNestedInputChange('pulseObservations', 'leftWrist', 'guan', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      >
                        <option value="">Selecione...</option>
                        <option value="superficial">Superficial (Estagnação/Calor)</option>
                        <option value="profundo">Profundo (Deficiência/Frio)</option>
                        <option value="rapido">Rápido (Calor)</option>
                        <option value="lento">Lento (Frio)</option>
                        <option value="forte">Forte (Excesso)</option>
                        <option value="fraco">Fraco (Deficiência)</option>
                        <option value="fino">Fino (Deficiência de Sangue)</option>
                        <option value="cheio">Cheio (Excesso)</option>
                        <option value="escorregadio">Escorregadio (Umidade/Fleuma)</option>
                        <option value="rugoso">Rugoso (Estagnação)</option>
                        <option value="corda">Em Corda (Estagnação de Qi)</option>
                        <option value="normal">Normal/Equilibrado</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="leftChi" className="block text-sm font-medium text-gray-700">
                        Chi (Rim Yin e Bexiga)
                      </label>
                      <select
                        id="leftChi"
                        value={formData.pulseObservations.leftWrist.chi}
                        onChange={(e) => handleNestedInputChange('pulseObservations', 'leftWrist', 'chi', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      >
                        <option value="">Selecione...</option>
                        <option value="superficial">Superficial (Estagnação/Calor)</option>
                        <option value="profundo">Profundo (Deficiência/Frio)</option>
                        <option value="rapido">Rápido (Calor)</option>
                        <option value="lento">Lento (Frio)</option>
                        <option value="forte">Forte (Excesso)</option>
                        <option value="fraco">Fraco (Deficiência)</option>
                        <option value="fino">Fino (Deficiência de Sangue)</option>
                        <option value="cheio">Cheio (Excesso)</option>
                        <option value="escorregadio">Escorregadio (Umidade/Fleuma)</option>
                        <option value="rugoso">Rugoso (Estagnação)</option>
                        <option value="corda">Em Corda (Estagnação de Qi)</option>
                        <option value="normal">Normal/Equilibrado</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Pulso Direito
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="rightCun" className="block text-sm font-medium text-gray-700">
                        Cun (Pulmões e Intestino Grosso)
                      </label>
                      <select
                        id="rightCun"
                        value={formData.pulseObservations.rightWrist.cun}
                        onChange={(e) => handleNestedInputChange('pulseObservations', 'rightWrist', 'cun', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      >
                        <option value="">Selecione...</option>
                        <option value="superficial">Superficial (Estagnação/Calor)</option>
                        <option value="profundo">Profundo (Deficiência/Frio)</option>
                        <option value="rapido">Rápido (Calor)</option>
                        <option value="lento">Lento (Frio)</option>
                        <option value="forte">Forte (Excesso)</option>
                        <option value="fraco">Fraco (Deficiência)</option>
                        <option value="fino">Fino (Deficiência de Sangue)</option>
                        <option value="cheio">Cheio (Excesso)</option>
                        <option value="escorregadio">Escorregadio (Umidade/Fleuma)</option>
                        <option value="rugoso">Rugoso (Estagnação)</option>
                        <option value="corda">Em Corda (Estagnação de Qi)</option>
                        <option value="normal">Normal/Equilibrado</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="rightGuan" className="block text-sm font-medium text-gray-700">
                        Guan (Baço e Estômago)
                      </label>
                      <select
                        id="rightGuan"
                        value={formData.pulseObservations.rightWrist.guan}
                        onChange={(e) => handleNestedInputChange('pulseObservations', 'rightWrist', 'guan', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      >
                        <option value="">Selecione...</option>
                        <option value="superficial">Superficial (Estagnação/Calor)</option>
                        <option value="profundo">Profundo (Deficiência/Frio)</option>
                        <option value="rapido">Rápido (Calor)</option>
                        <option value="lento">Lento (Frio)</option>
                        <option value="forte">Forte (Excesso)</option>
                        <option value="fraco">Fraco (Deficiência)</option>
                        <option value="fino">Fino (Deficiência de Sangue)</option>
                        <option value="cheio">Cheio (Excesso)</option>
                        <option value="escorregadio">Escorregadio (Umidade/Fleuma)</option>
                        <option value="rugoso">Rugoso (Estagnação)</option>
                        <option value="corda">Em Corda (Estagnação de Qi)</option>
                        <option value="normal">Normal/Equilibrado</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="rightChi" className="block text-sm font-medium text-gray-700">
                        Chi (Rim Yang e Triplo Aquecedor)
                      </label>
                      <select
                        id="rightChi"
                        value={formData.pulseObservations.rightWrist.chi}
                        onChange={(e) => handleNestedInputChange('pulseObservations', 'rightWrist', 'chi', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      >
                        <option value="">Selecione...</option>
                        <option value="superficial">Superficial (Estagnação/Calor)</option>
                        <option value="profundo">Profundo (Deficiência/Frio)</option>
                        <option value="rapido">Rápido (Calor)</option>
                        <option value="lento">Lento (Frio)</option>
                        <option value="forte">Forte (Excesso)</option>
                        <option value="fraco">Fraco (Deficiência)</option>
                        <option value="fino">Fino (Deficiência de Sangue)</option>
                        <option value="cheio">Cheio (Excesso)</option>
                        <option value="escorregadio">Escorregadio (Umidade/Fleuma)</option>
                        <option value="rugoso">Rugoso (Estagnação)</option>
                        <option value="corda">Em Corda (Estagnação de Qi)</option>
                        <option value="normal">Normal/Equilibrado</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="pulseRate" className="block text-sm font-medium text-gray-700">
                      Frequência do Pulso
                    </label>
                    <select
                      id="pulseRate"
                      value={formData.pulseObservations.pulseRate}
                      onChange={(e) => handleInputChange('pulseObservations', 'pulseRate', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="">Selecione...</option>
                      <option value="lento">Lento (&lt; 60 bpm) - Frio</option>
                      <option value="normal">Normal (60-80 bpm) - Equilibrado</option>
                      <option value="rapido">Rápido (&gt; 80 bpm) - Calor</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="pulseStrength" className="block text-sm font-medium text-gray-700">
                      Força do Pulso
                    </label>
                    <select
                      id="pulseStrength"
                      value={formData.pulseObservations.pulseStrength}
                      onChange={(e) => handleInputChange('pulseObservations', 'pulseStrength', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="">Selecione...</option>
                      <option value="fraco">Fraco - Deficiência</option>
                      <option value="moderado">Moderado - Equilibrado</option>
                      <option value="forte">Forte - Excesso</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="pulseRhythm" className="block text-sm font-medium text-gray-700">
                      Ritmo do Pulso
                    </label>
                    <select
                      id="pulseRhythm"
                      value={formData.pulseObservations.pulseRhythm}
                      onChange={(e) => handleInputChange('pulseObservations', 'pulseRhythm', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="">Selecione...</option>
                      <option value="regular">Regular - Equilíbrio</option>
                      <option value="irregular">Irregular - Desequilíbrio</option>
                      <option value="intermitente">Intermitente - Estagnação</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="pulseAdditionalNotes" className="block text-sm font-medium text-gray-700">
                    Observações Adicionais
                  </label>
                  <textarea
                    id="pulseAdditionalNotes"
                    rows={3}
                    value={formData.pulseObservations.additionalNotes}
                    onChange={(e) => handleInputChange('pulseObservations', 'additionalNotes', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Outras observações relevantes sobre o pulso..."
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          {/* Energetic Observations Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('energeticObservations')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-medium text-gray-900">Observações Energéticas</h2>
              <ChevronDown
                size={20}
                className={`text-gray-500 transform transition-transform ${
                  expandedSections.energeticObservations ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedSections.energeticObservations && (
              <div className="mt-4 space-y-6">
                {/* Five Elements */}
                <div>
                  <h3 className="text-base font-medium text-gray-800 mb-3">Cinco Elementos</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="energeticWood" className="block text-sm font-medium text-gray-700">
                        Madeira (Fígado, Vesícula Biliar)
                      </label>
                      <textarea
                        id="energeticWood"
                        rows={2}
                        value={formData.energeticObservations.fiveElements.wood}
                        onChange={(e) => handleNestedInputChange('energeticObservations', 'fiveElements', 'wood', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre o elemento Madeira (ex: estagnação, calor no Fígado)"
                      />
                    </div>
                    <div>
                      <label htmlFor="energeticFire" className="block text-sm font-medium text-gray-700">
                        Fogo (Coração, Intestino Delgado, Pericárdio, Triplo Aquecedor)
                      </label>
                      <textarea
                        id="energeticFire"
                        rows={2}
                        value={formData.energeticObservations.fiveElements.fire}
                        onChange={(e) => handleNestedInputChange('energeticObservations', 'fiveElements', 'fire', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre o elemento Fogo (ex: fogo no Coração, deficiência de Yin)"
                      />
                    </div>
                    <div>
                      <label htmlFor="energeticEarth" className="block text-sm font-medium text-gray-700">
                        Terra (Baço, Estômago)
                      </label>
                      <textarea
                        id="energeticEarth"
                        rows={2}
                        value={formData.energeticObservations.fiveElements.earth}
                        onChange={(e) => handleNestedInputChange('energeticObservations', 'fiveElements', 'earth', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre o elemento Terra (ex: deficiência de Qi do Baço, umidade)"
                      />
                    </div>
                    <div>
                      <label htmlFor="energeticMetal" className="block text-sm font-medium text-gray-700">
                        Metal (Pulmão, Intestino Grosso)
                      </label>
                      <textarea
                        id="energeticMetal"
                        rows={2}
                        value={formData.energeticObservations.fiveElements.metal}
                        onChange={(e) => handleNestedInputChange('energeticObservations', 'fiveElements', 'metal', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre o elemento Metal (ex: deficiência de Qi do Pulmão, secura)"
                      />
                    </div>
                    <div>
                      <label htmlFor="energeticWater" className="block text-sm font-medium text-gray-700">
                        Água (Rim, Bexiga)
                      </label>
                      <textarea
                        id="energeticWater"
                        rows={2}
                        value={formData.energeticObservations.fiveElements.water}
                        onChange={(e) => handleNestedInputChange('energeticObservations', 'fiveElements', 'water', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="Observações sobre o elemento Água (ex: deficiência de Yang do Rim, deficiência de Essência)"
                      />
                    </div>
                  </div>
                </div>

                {/* Yin/Yang, Qi, Xue, JinYe, Shen */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="yinYang" className="block text-sm font-medium text-gray-700">Yin/Yang</label>
                    <select
                      id="yinYang"
                      value={formData.energeticObservations.yinYang}
                      onChange={(e) => handleInputChange('energeticObservations', 'yinYang', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="">Selecione...</option>
                      <option value="balanced">Equilibrado</option>
                      <option value="yin_deficiency">Deficiência de Yin</option>
                      <option value="yang_deficiency">Deficiência de Yang</option>
                      <option value="yin_excess">Excesso de Yin (Frio Interno)</option>
                      <option value="yang_excess">Excesso de Yang (Calor Interno)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="qi" className="block text-sm font-medium text-gray-700">Qi (Energia Vital)</label>
                    <select
                      id="qi"
                      value={formData.energeticObservations.qi}
                      onChange={(e) => handleInputChange('energeticObservations', 'qi', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="">Selecione...</option>
                      <option value="sufficient">Suficiente/Forte</option>
                      <option value="deficient">Deficiente</option>
                      <option value="stagnant">Estagnado</option>
                      <option value="rebellious">Rebelde</option>
                      <option value="sinking">Afundando</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="xue" className="block text-sm font-medium text-gray-700">Xue (Sangue)</label>
                    <select
                      id="xue"
                      value={formData.energeticObservations.xue}
                      onChange={(e) => handleInputChange('energeticObservations', 'xue', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="">Selecione...</option>
                      <option value="sufficient">Suficiente/Nutrido</option>
                      <option value="deficient">Deficiente</option>
                      <option value="stasis">Estase</option>
                      <option value="heat">Calor no Sangue</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="jinYe" className="block text-sm font-medium text-gray-700">JinYe (Fluidos Corporais)</label>
                    <select
                      id="jinYe"
                      value={formData.energeticObservations.jinYe}
                      onChange={(e) => handleInputChange('energeticObservations', 'jinYe', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="">Selecione...</option>
                      <option value="adequate">Adequados</option>
                      <option value="deficient_dryness">Deficientes (Secura)</option>
                      <option value="excess_dampness">Excesso (Umidade/Fleuma)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="shen" className="block text-sm font-medium text-gray-700">Shen (Espírito/Mente)</label>
                    <select
                      id="shen"
                      value={formData.energeticObservations.shen}
                      onChange={(e) => handleInputChange('energeticObservations', 'shen', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="">Selecione...</option>
                      <option value="calm_clear">Calmo e Claro</option>
                      <option value="disturbed_agitated">Perturbado/Agitado</option>
                      <option value="dull_listless">Apagado/Apático</option>
                      <option value="depressed_sad">Deprimido/Triste</option>
                    </select>
                  </div>
                </div>

                {/* Additional Notes for Energetic Observations */}
                <div>
                  <label htmlFor="energeticAdditionalNotes" className="block text-sm font-medium text-gray-700">
                    Observações Adicionais (Energéticas)
                  </label>
                  <textarea
                    id="energeticAdditionalNotes"
                    rows={3}
                    value={formData.energeticObservations.additionalNotes}
                    onChange={(e) => handleInputChange('energeticObservations', 'additionalNotes', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Outras observações energéticas relevantes..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 inline animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2 inline" />
                  Salvar Observações
                </>
              )}
            </button>
            
            <button
              onClick={handleAnalyze}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 inline animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2 inline" />
                  Analisar com IA
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
