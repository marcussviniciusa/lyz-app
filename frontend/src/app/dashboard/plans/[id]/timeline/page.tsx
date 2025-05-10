'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Loader, 
  Save, 
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { planAPI } from '@/lib/api';

// Tipos para os eventos da linha do tempo
interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: 'medical' | 'symptom' | 'lifestyle' | 'medication' | 'procedure' | 'other';
  impact: 'positive' | 'negative' | 'neutral';
}

// Interface para os dados da linha do tempo
interface TimelineData {
  events: TimelineEvent[];
  lastUpdated: string;
  notes: string;
}

export default function TimelinePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Estado para o formulário de novo evento
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  
  // Dados da linha do tempo
  const [timeline, setTimeline] = useState<TimelineData>({
    events: [],
    lastUpdated: new Date().toISOString(),
    notes: ''
  });
  
  // Form para novo evento
  const [newEvent, setNewEvent] = useState<Omit<TimelineEvent, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    category: 'medical',
    impact: 'neutral'
  });
  
  // Carrega dados da linha do tempo
  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await planAPI.getPlanById(id);
        const planData = response.data ? response.data : response;
        
        if (planData && planData.timeline) {
          setTimeline(planData.timeline);
        }
      } catch (error) {
        console.error('Erro ao carregar linha do tempo:', error);
        setError('Não foi possível carregar os dados da linha do tempo. Por favor, tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchTimelineData();
    }
  }, [id]);
  
  // Handler para adicionar novo evento
  const handleAddEvent = () => {
    setEditingEvent(null);
    setNewEvent({
      date: new Date().toISOString().split('T')[0],
      title: '',
      description: '',
      category: 'medical',
      impact: 'neutral'
    });
    setShowEventForm(true);
  };
  
  // Handler para editar evento existente
  const handleEditEvent = (event: TimelineEvent) => {
    setEditingEvent(event);
    setNewEvent({
      date: event.date,
      title: event.title,
      description: event.description,
      category: event.category,
      impact: event.impact
    });
    setShowEventForm(true);
  };
  
  // Handler para remover evento
  const handleRemoveEvent = (eventId: string) => {
    const updatedEvents = timeline.events.filter(event => event.id !== eventId);
    setTimeline({
      ...timeline,
      events: updatedEvents,
      lastUpdated: new Date().toISOString()
    });
    setSuccessMessage('Evento removido com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  // Handler para salvar novo evento ou atualizar existente
  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      setError('Título e data são obrigatórios.');
      return;
    }
    
    let updatedEvents: TimelineEvent[];
    
    if (editingEvent) {
      // Atualizando evento existente
      updatedEvents = timeline.events.map(event => 
        event.id === editingEvent.id 
          ? { ...newEvent, id: event.id }
          : event
      );
    } else {
      // Adicionando novo evento
      const newEventWithId: TimelineEvent = {
        ...newEvent,
        id: `event_${Date.now()}`
      };
      updatedEvents = [...timeline.events, newEventWithId];
    }
    
    // Ordena eventos por data (mais recentes primeiro)
    updatedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setTimeline({
      ...timeline,
      events: updatedEvents,
      lastUpdated: new Date().toISOString()
    });
    
    setSuccessMessage(editingEvent ? 'Evento atualizado com sucesso!' : 'Novo evento adicionado com sucesso!');
    setShowEventForm(false);
    setEditingEvent(null);
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  // Handler para atualização de notas gerais
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTimeline({
      ...timeline,
      notes: e.target.value,
      lastUpdated: new Date().toISOString()
    });
  };
  
  // Handler para salvar toda a linha do tempo
  const handleSaveTimeline = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Salvando no backend
      await planAPI.updatePlan(id, { timeline });
      
      setSuccessMessage('Linha do tempo salva com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar linha do tempo:', error);
      setError('Não foi possível salvar a linha do tempo. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Obtém o nome da categoria para exibição
  const getCategoryName = (category: string) => {
    const categories = {
      medical: 'Evento Médico',
      symptom: 'Sintoma',
      lifestyle: 'Estilo de Vida',
      medication: 'Medicação',
      procedure: 'Procedimento',
      other: 'Outro'
    };
    return categories[category as keyof typeof categories] || category;
  };
  
  // Obtém classes CSS baseadas na categoria e impacto
  const getEventClasses = (category: string, impact: string) => {
    // Classes base
    let classes = 'border-l-4 px-4 py-3 mb-4 rounded shadow-sm ';
    
    // Classes por categoria
    const categoryClasses = {
      medical: 'bg-blue-50 ',
      symptom: 'bg-yellow-50 ',
      lifestyle: 'bg-green-50 ',
      medication: 'bg-purple-50 ',
      procedure: 'bg-indigo-50 ',
      other: 'bg-gray-50 '
    };
    
    // Classes por impacto
    const impactClasses = {
      positive: 'border-green-500',
      negative: 'border-red-500',
      neutral: 'border-gray-400'
    };
    
    return classes + 
      (categoryClasses[category as keyof typeof categoryClasses] || 'bg-gray-50 ') + 
      (impactClasses[impact as keyof typeof impactClasses] || 'border-gray-400');
  };
  
  // Formata data para visualização
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <div className="py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/dashboard/plans/${id}`} className="mr-4 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Linha do Tempo Funcional</h1>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleAddEvent}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <Plus size={16} className="mr-2" />
            Adicionar Evento
          </button>
          
          <button
            onClick={handleSaveTimeline}
            disabled={isSubmitting}
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
                Salvar Linha do Tempo
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
        <div className="space-y-8">
          {/* Formulário para adicionar/editar evento */}
          {showEventForm && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {editingEvent ? 'Editar Evento' : 'Adicionar Novo Evento'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">Data do Evento *</label>
                  <input
                    type="date"
                    id="eventDate"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700">Título *</label>
                  <input
                    type="text"
                    id="eventTitle"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Ex.: Diagnóstico, Início de tratamento, etc."
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="eventCategory" className="block text-sm font-medium text-gray-700">Categoria</label>
                  <select
                    id="eventCategory"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as TimelineEvent['category'] })}
                  >
                    <option value="medical">Evento Médico</option>
                    <option value="symptom">Sintoma</option>
                    <option value="lifestyle">Estilo de Vida</option>
                    <option value="medication">Medicação</option>
                    <option value="procedure">Procedimento</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="eventImpact" className="block text-sm font-medium text-gray-700">Impacto</label>
                  <select
                    id="eventImpact"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    value={newEvent.impact}
                    onChange={(e) => setNewEvent({ ...newEvent, impact: e.target.value as TimelineEvent['impact'] })}
                  >
                    <option value="positive">Positivo</option>
                    <option value="negative">Negativo</option>
                    <option value="neutral">Neutro</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  id="eventDescription"
                  rows={4}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Detalhes do evento..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  onClick={() => {
                    setShowEventForm(false);
                    setEditingEvent(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  onClick={handleSaveEvent}
                >
                  {editingEvent ? 'Atualizar Evento' : 'Adicionar Evento'}
                </button>
              </div>
            </div>
          )}
          
          {/* Linha do tempo */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Eventos</h2>
            
            {timeline.events.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sem eventos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comece adicionando eventos importantes na linha do tempo do paciente.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleAddEvent}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Adicionar Primeiro Evento
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-0 relative before:absolute before:inset-0 before:left-5 before:h-full before:border-l-2 before:border-gray-200 ml-5 pl-8">
                {timeline.events.map((event) => (
                  <div 
                    key={event.id} 
                    className={getEventClasses(event.category, event.impact)}
                  >
                    <div className="absolute -left-4 mt-1 rounded-full w-8 h-8 bg-white shadow flex items-center justify-center">
                      <span className="text-xs font-semibold">{new Date(event.date).getFullYear()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs font-medium bg-gray-100 rounded px-2 py-1">
                          {getCategoryName(event.category)}
                        </span>
                        <h3 className="text-md font-semibold mt-1">{event.title}</h3>
                        <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => handleEditEvent(event)}
                          className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveEvent(event.id)}
                          className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="mt-2 text-sm text-gray-600">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Notas gerais */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notas Adicionais</h2>
            <textarea
              rows={6}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              value={timeline.notes}
              onChange={handleNotesChange}
              placeholder="Adicione observações gerais sobre a linha do tempo..."
            ></textarea>
          </div>
          
          {/* Ações finais */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveTimeline}
              disabled={isSubmitting}
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
                  Salvar Linha do Tempo
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
