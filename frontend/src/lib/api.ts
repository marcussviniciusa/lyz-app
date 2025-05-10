import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with defaults
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status } = error.response || {};
    
    // Handle token expiration
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/api/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string, company: string) => 
    api.post('/api/auth/register', { name, email, password, company }),
  
  forgotPassword: (email: string) => 
    api.post('/api/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) => 
    api.post('/api/auth/reset-password', { token, password }),
  
  changePassword: (currentPassword: string, newPassword: string) => 
    api.post('/api/auth/change-password', { currentPassword, newPassword }),
};

// User API
export const userAPI = {
  getUsers: (page = 1, limit = 10, search = '') => 
    api.get(`/api/users?page=${page}&limit=${limit}&search=${search}`),
  
  getUserById: (id: string) => 
    api.get(`/api/users/${id}`),
  
  createUser: (userData: any) => 
    api.post('/api/users', userData),
  
  updateUser: (id: string, userData: any) => 
    api.put(`/api/users/${id}`, userData),
  
  deleteUser: (id: string) => 
    api.delete(`/api/users/${id}`),
  
  activateUser: (id: string) => 
    api.put(`/api/users/${id}/activate`),
  
  deactivateUser: (id: string) => 
    api.put(`/api/users/${id}/deactivate`),
};

// Company API
export const companyAPI = {
  getCompanies: (page = 1, limit = 10, search = '') => 
    api.get(`/api/companies?page=${page}&limit=${limit}&search=${search}`),
  
  getCompanyById: (id: string) => 
    api.get(`/api/companies/${id}`),
  
  createCompany: (companyData: any) => 
    api.post('/api/companies', companyData),
  
  updateCompany: (id: string, companyData: any) => 
    api.put(`/api/companies/${id}`, companyData),
  
  deleteCompany: (id: string) => 
    api.delete(`/api/companies/${id}`),
  
  activateCompany: (id: string) => 
    api.put(`/api/companies/${id}/activate`),
  
  deactivateCompany: (id: string) => 
    api.put(`/api/companies/${id}/deactivate`),
};

// Plan API
export const planAPI = {
  getPlans: (page = 1, limit = 10, status = '', patientName = '', startDate = '', endDate = '') => 
    api.get(`/api/plans?page=${page}&limit=${limit}&status=${status}&patientName=${patientName}&startDate=${startDate}&endDate=${endDate}`),
  
  getPlanById: (id: string) => 
    api.get(`/api/plans/${id}`),
  
  createPlan: (planData: any) => 
    api.post('/api/plans', planData),
  
  updatePlan: (id: string, planData: any) => 
    api.put(`/api/plans/${id}`, planData),
  
  deletePlan: (id: string) => 
    api.delete(`/api/plans/${id}`),
  
  archivePlan: (id: string) => 
    api.put(`/api/plans/${id}/archive`),
  
  generateSharingLink: (id: string, expiresInDays = 30) => 
    api.post(`/api/plans/${id}/share`, { expiresInDays }),
  
  getSharedPlan: (token: string) => 
    api.get(`/api/plans/shared/${token}`),
    
  // Version history endpoints
  getPlanVersions: (planId: string) => 
    api.get(`/api/plans/${planId}/versions`),
    
  getPlanVersionById: (planId: string, versionId: string) => 
    api.get(`/api/plans/${planId}/versions/${versionId}`),
    
  comparePlanVersions: (planId: string, version1Id: string, version2Id: string) => 
    api.post(`/api/plans/${planId}/versions/compare`, { version1Id, version2Id }),
    
  restorePlanVersion: (planId: string, versionId: string) => 
    api.post(`/api/plans/${planId}/versions/${versionId}/restore`),
};

// AI API
export const aiAPI = {
  // Análise básica com abordagem tradicional
  analyzeExams: (planId: string, examResults: string, patientInfo: string) => 
    api.post(`/api/ai/analyze-exams`, { planId, examResults, patientInfo }),
    
  analyzeTCM: (planId: string, tcmObservations: string, patientInfo: string) => 
    api.post(`/api/ai/analyze-tcm`, { planId, tcmObservations, patientInfo }),
    
  analyzeIFM: (planId: string, patientInfo: string, labResults: string, timeline: string) => 
    api.post(`/api/ai/analyze-ifm`, { planId, patientInfo, labResults, timeline }),
    
  generatePlan: (planId: string, patientInfo: string, analysisSummary: string, professionalType: string) => 
    api.post(`/api/ai/generate-plan`, { planId, patientInfo, analysisSummary, professionalType }),
    
  // Novos endpoints baseados em agentes com contexto e memória
  analyzeExamsWithQuery: (planId: string, examResults: string, patientInfo: string, query?: string) => 
    api.post(`/api/ai/analyze-exams-with-query`, { planId, examResults, patientInfo, query }),
    
  analyzeTCMWithQuery: (planId: string, tcmObservations: string, patientInfo: string, query?: string) => 
    api.post(`/api/ai/analyze-tcm-with-query`, { planId, tcmObservations, patientInfo, query }),
    
  analyzeIFMWithQuery: (planId: string, patientInfo: string, labResults: string, timeline: string, query?: string) => 
    api.post(`/api/ai/analyze-ifm-with-query`, { planId, patientInfo, labResults, timeline, query }),
    
  generatePlanWithInstructions: (planId: string, patientInfo: string, analysisSummary: string, professionalType: string, specialInstructions?: string) => 
    api.post(`/api/ai/generate-plan-with-instructions`, { planId, patientInfo, analysisSummary, professionalType, specialInstructions }),
    
  refinePlan: (planId: string, existingPlanContent: string, feedback: string) => 
    api.post(`/api/ai/refine-plan`, { planId, existingPlanContent, feedback }),
    
  getAgentContext: (planId: string, agentType: string) => 
    api.get(`/api/ai/context/${planId}/${agentType}`),
};

// File API
export const fileAPI = {
  uploadFile: (file: File, planId?: string, examId?: string, category = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    if (planId) formData.append('planId', planId);
    if (examId) formData.append('examId', examId);
    formData.append('category', category);
    
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  uploadFiles: (formData: FormData) => {
    // formData deve já conter os arquivos e outros parâmetros como planId e category
    return api.post('/api/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getFile: (fileId: string) => 
    api.get(`/api/files/${fileId}`),
  
  deleteFile: (fileId: string) => 
    api.delete(`/api/files/${fileId}`),
  
  listFiles: (category?: string, planId?: string) => {
    let url = '/api/files?';
    if (category) url += `category=${category}&`;
    if (planId) url += `planId=${planId}`;
    return api.get(url);
  },
};

// Prompt API
export const promptAPI = {
  getPrompts: () => 
    api.get('/api/prompts'),
  
  getPromptById: (id: string) => 
    api.get(`/api/prompts/${id}`),
  
  createPrompt: (promptData: any) => 
    api.post('/api/prompts', promptData),
  
  updatePrompt: (id: string, promptData: any) => 
    api.put(`/api/prompts/${id}`, promptData),
  
  deletePrompt: (id: string) => 
    api.delete(`/api/prompts/${id}`),
  
  setPromptActive: (id: string) => 
    api.patch(`/api/prompts/${id}/activate`),
};

// Material educativo API
export const materialAPI = {
  getMaterials: (page = 1, limit = 10, category = '', search = '', tags = '', status = '') => 
    api.get(`/api/materials?page=${page}&limit=${limit}&category=${category}&search=${search}&tags=${tags}&status=${status}`),
  
  getMaterialById: (id: string) => 
    api.get(`/api/materials/${id}`),
  
  uploadMaterial: (formData: FormData) => 
    api.post('/api/materials/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  updateMaterial: (id: string, materialData: any) => 
    api.patch(`/api/materials/${id}`, materialData),
  
  deleteMaterial: (id: string) => 
    api.delete(`/api/materials/${id}`),
  
  searchMaterials: (query: string, categories?: string[], tags?: string[]) => 
    api.post('/api/materials/search', {
      query,
      categories: categories && categories.length > 0 ? categories.join(',') : undefined,
      tags: tags && tags.length > 0 ? tags.join(',') : undefined
    }),
  
  getMaterialChunks: (id: string) => 
    api.get(`/api/materials/${id}/chunks`),
  
  reprocessMaterial: (id: string) => 
    api.post(`/api/materials/${id}/reprocess`),
};

// Admin API
export const adminAPI = {
  // Estatísticas do dashboard
  getStats: () => 
    api.get('/api/admin/stats'),
    
  // Gerenciamento de usuários
  getUsers: (params: { page?: number, search?: string, role?: string, status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.status) queryParams.append('status', params.status);
    
    return api.get(`/api/admin/users?${queryParams.toString()}`);
  },
  
  createUser: (userData: any) => 
    api.post('/api/admin/users', userData),
    
  updateUser: (id: string, userData: any) => 
    api.put(`/api/admin/users/${id}`, userData),
    
  deleteUser: (id: string) => 
    api.delete(`/api/admin/users/${id}`),
    
  // Gerenciamento de empresas
  getCompanies: (params: { page?: number, search?: string, status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    
    return api.get(`/api/admin/companies?${queryParams.toString()}`);
  },
  
  createCompany: (companyData: any) => 
    api.post('/api/admin/companies', companyData),
    
  updateCompany: (id: string, companyData: any) => 
    api.put(`/api/admin/companies/${id}`, companyData),
    
  deleteCompany: (id: string) => 
    api.delete(`/api/admin/companies/${id}`),
  
  // Gerenciamento de planos
  getPlansStats: () => 
    api.get('/api/admin/plans/stats'),
    
  // Logs e atividade
  getActivityLogs: (page = 1, limit = 10) => 
    api.get(`/api/admin/logs?page=${page}&limit=${limit}`),
    
  // Configurações do sistema
  getSystemSettings: () => 
    api.get('/api/admin/settings'),
    
  updateSystemSettings: (settingsData: any) => 
    api.put('/api/admin/settings', settingsData),
};

export default api;
