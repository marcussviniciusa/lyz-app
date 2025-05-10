'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { planAPI } from '@/lib/api';

export default function EditPlanPage() {
  const router = useRouter();
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
  });

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
          return date.toISOString().split('T')[0];
        };
        
        setFormData({
          patientName: plan.patientName || '',
          patientBirthdate: formatDate(plan.patientBirthdate),
          patientEmail: plan.patientEmail || '',
          patientPhone: plan.patientPhone || '',
          initialObservations: plan.initialObservations || '',
          professionalType: plan.professionalType || 'nutritionist',
        });
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
    setFormData({
      ...formData,
      [name]: value,
    });
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
      
      await planAPI.updatePlan(planId, formData);
      
      // Redirect back to plan details page
      router.push(`/dashboard/plans/${planId}`);
    } catch (error: any) {
      console.error('Failed to update plan:', error);
      setError(error.response?.data?.message || 'Falha ao atualizar o plano. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href={`/dashboard/plans/${planId}`} className="mr-4">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Plano</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="w-1/3 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Form error display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    isSaving ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                >
                  <Save size={16} className="mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
