'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, User, Info } from 'lucide-react';
import { planAPI } from '@/lib/api';

export default function NewPlanPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    patientName: '',
    patientBirthdate: '',
    patientEmail: '',
    patientPhone: '',
    initialObservations: '',
    professionalType: 'nutritionist', // Default value
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleNextStep = () => {
    // Form validation for step 1
    if (!formData.patientName.trim()) {
      setError('Nome do paciente é obrigatório');
      return;
    }
    if (!formData.patientBirthdate) {
      setError('Data de nascimento é obrigatória');
      return;
    }
    
    setError('');
    // Agora só temos 2 passos
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      
      // Create a new plan
      const response = await planAPI.createPlan({
        patientName: formData.patientName,
        patientBirthdate: formData.patientBirthdate,
        patientEmail: formData.patientEmail,
        patientPhone: formData.patientPhone,
        initialObservations: formData.initialObservations,
        professionalType: formData.professionalType,
      });
      
      // Extrair o ID do plano da resposta (correção da estrutura)
      console.log('Resposta da criação do plano:', response.data);
      
      // A resposta do backend tem a estrutura: { status, message, data: { plan: { _id, ... } } }
      const planId = response.data.data.plan._id;
      
      if (!planId) {
        console.error('ID do plano não encontrado na resposta:', response.data);
        setError('ID do plano não encontrado na resposta. Contate o suporte.');
        return;
      }
      
      console.log('Redirecionando para o plano:', planId);
      router.push(`/dashboard/plans/${planId}`);
    } catch (error: any) {
      console.error('Failed to create plan:', error);
      setError(error.response?.data?.message || 'Falha ao criar o plano. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-gray-900">Novo Plano de Saúde</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="w-full flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <User size={20} />
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step >= 2 ? 'bg-emerald-600' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <Info size={20} />
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-2 px-12">
            <div className="text-center">
              <p className={`text-sm font-medium ${step >= 1 ? 'text-emerald-600' : 'text-gray-500'}`}>
                Dados do Paciente
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm font-medium ${step >= 2 ? 'text-emerald-600' : 'text-gray-500'}`}>
                Informações Adicionais
              </p>
            </div>
          </div>
        </div>

        {/* Form error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form steps */}
        <form onSubmit={handleSubmit}>
          {/* Step 1: Patient Information */}
          {step === 1 && (
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
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  id="patientBirthdate"
                  name="patientBirthdate"
                  value={formData.patientBirthdate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700">
                  Email do Paciente (opcional)
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
                  Telefone do Paciente (opcional)
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
            </div>
          )}

          {/* Step 2: Final Information */}
          {step === 2 && (
            <div className="space-y-4">
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
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <ChevronLeft size={16} className="mr-2" />
                Anterior
              </button>
            ) : (
              <div></div>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Próximo
                <ChevronRight size={16} className="ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
              >
                {isLoading ? 'Criando...' : 'Criar Plano'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
