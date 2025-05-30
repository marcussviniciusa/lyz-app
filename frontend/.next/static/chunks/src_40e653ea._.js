(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/lib/api.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "adminAPI": (()=>adminAPI),
    "aiAPI": (()=>aiAPI),
    "authAPI": (()=>authAPI),
    "companyAPI": (()=>companyAPI),
    "default": (()=>__TURBOPACK__default__export__),
    "fileAPI": (()=>fileAPI),
    "materialAPI": (()=>materialAPI),
    "planAPI": (()=>planAPI),
    "promptAPI": (()=>promptAPI),
    "userAPI": (()=>userAPI)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
;
const BASE_URL = ("TURBOPACK compile-time value", "http://localhost:5000") || 'http://localhost:5000';
// Create axios instance with defaults
const api = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});
// Request interceptor to add auth token
api.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error)=>Promise.reject(error));
// Response interceptor to handle common errors
api.interceptors.response.use((response)=>response, (error)=>{
    const { status } = error.response || {};
    // Handle token expiration
    if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
    }
    return Promise.reject(error);
});
const authAPI = {
    login: (email, password)=>api.post('/api/auth/login', {
            email,
            password
        }),
    register: (name, email, password, company)=>api.post('/api/auth/register', {
            name,
            email,
            password,
            company
        }),
    forgotPassword: (email)=>api.post('/api/auth/forgot-password', {
            email
        }),
    resetPassword: (token, password)=>api.post('/api/auth/reset-password', {
            token,
            password
        }),
    changePassword: (currentPassword, newPassword)=>api.post('/api/auth/change-password', {
            currentPassword,
            newPassword
        })
};
const userAPI = {
    getUsers: (page = 1, limit = 10, search = '')=>api.get(`/api/users?page=${page}&limit=${limit}&search=${search}`),
    getUserById: (id)=>api.get(`/api/users/${id}`),
    createUser: (userData)=>api.post('/api/users', userData),
    updateUser: (id, userData)=>api.put(`/api/users/${id}`, userData),
    deleteUser: (id)=>api.delete(`/api/users/${id}`),
    activateUser: (id)=>api.put(`/api/users/${id}/activate`),
    deactivateUser: (id)=>api.put(`/api/users/${id}/deactivate`)
};
const companyAPI = {
    getCompanies: (page = 1, limit = 10, search = '')=>api.get(`/api/companies?page=${page}&limit=${limit}&search=${search}`),
    getCompanyById: (id)=>api.get(`/api/companies/${id}`),
    createCompany: (companyData)=>api.post('/api/companies', companyData),
    updateCompany: (id, companyData)=>api.put(`/api/companies/${id}`, companyData),
    deleteCompany: (id)=>api.delete(`/api/companies/${id}`),
    activateCompany: (id)=>api.put(`/api/companies/${id}/activate`),
    deactivateCompany: (id)=>api.put(`/api/companies/${id}/deactivate`)
};
const planAPI = {
    getPlans: (page = 1, limit = 10, status = '', patientName = '', startDate = '', endDate = '')=>api.get(`/api/plans?page=${page}&limit=${limit}&status=${status}&patientName=${patientName}&startDate=${startDate}&endDate=${endDate}`),
    getPlanById: (id)=>api.get(`/api/plans/${id}`),
    createPlan: (planData)=>api.post('/api/plans', planData),
    updatePlan: (id, planData)=>api.put(`/api/plans/${id}`, planData),
    deletePlan: (id)=>api.delete(`/api/plans/${id}`),
    archivePlan: (id)=>api.put(`/api/plans/${id}/archive`),
    generateSharingLink: (id, expiresInDays = 30)=>api.post(`/api/plans/${id}/share`, {
            expiresInDays
        }),
    getSharedPlan: (token)=>api.get(`/api/plans/shared/${token}`),
    // Version history endpoints
    getPlanVersions: (planId)=>api.get(`/api/plans/${planId}/versions`),
    getPlanVersionById: (planId, versionId)=>api.get(`/api/plans/${planId}/versions/${versionId}`),
    comparePlanVersions: (planId, version1Id, version2Id)=>api.post(`/api/plans/${planId}/versions/compare`, {
            version1Id,
            version2Id
        }),
    restorePlanVersion: (planId, versionId)=>api.post(`/api/plans/${planId}/versions/${versionId}/restore`)
};
const aiAPI = {
    // Análise básica com abordagem tradicional
    analyzeExams: (planId, examResults, patientInfo)=>api.post(`/api/ai/analyze-exams`, {
            planId,
            examResults,
            patientInfo
        }),
    analyzeTCM: (planId, tcmObservations, patientInfo)=>api.post(`/api/ai/analyze-tcm`, {
            planId,
            tcmObservations,
            patientInfo
        }),
    analyzeIFM: (planId, patientInfo, labResults, timeline)=>api.post(`/api/ai/analyze-ifm`, {
            planId,
            patientInfo,
            labResults,
            timeline
        }),
    generatePlan: (planId, patientInfo, analysisSummary, professionalType)=>api.post(`/api/ai/generate-plan`, {
            planId,
            patientInfo,
            analysisSummary,
            professionalType
        }),
    // Novos endpoints baseados em agentes com contexto e memória
    analyzeExamsWithQuery: (planId, examResults, patientInfo, query)=>api.post(`/api/ai/analyze-exams-with-query`, {
            planId,
            examResults,
            patientInfo,
            query
        }),
    analyzeTCMWithQuery: (planId, tcmObservations, patientInfo, query)=>api.post(`/api/ai/analyze-tcm-with-query`, {
            planId,
            tcmObservations,
            patientInfo,
            query
        }),
    analyzeIFMWithQuery: (planId, patientInfo, labResults, timeline, query)=>api.post(`/api/ai/analyze-ifm-with-query`, {
            planId,
            patientInfo,
            labResults,
            timeline,
            query
        }),
    generatePlanWithInstructions: (planId, patientInfo, analysisSummary, professionalType, specialInstructions)=>api.post(`/api/ai/generate-plan-with-instructions`, {
            planId,
            patientInfo,
            analysisSummary,
            professionalType,
            specialInstructions
        }),
    refinePlan: (planId, existingPlanContent, feedback)=>api.post(`/api/ai/refine-plan`, {
            planId,
            existingPlanContent,
            feedback
        }),
    getAgentContext: (planId, agentType)=>api.get(`/api/ai/context/${planId}/${agentType}`)
};
const fileAPI = {
    uploadFile: (file, planId, examId, category = 'general')=>{
        const formData = new FormData();
        formData.append('file', file);
        if (planId) formData.append('planId', planId);
        if (examId) formData.append('examId', examId);
        formData.append('category', category);
        return api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    uploadFiles: (formData)=>{
        // formData deve já conter os arquivos e outros parâmetros como planId e category
        return api.post('/api/files/upload-multiple', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    extractTextFromFiles: (files)=>{
        // Criar um FormData com os arquivos para análise
        const formData = new FormData();
        files.forEach((file)=>{
            formData.append('files', file);
        });
        console.log('FormData criado com', files.length, 'arquivo(s).');
        return api.post('/api/file-analysis/extract-text', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    testFileUpload: (files)=>{
        // Verificação de diagnóstico para upload de arquivos
        console.log('Testando upload de', files.length, 'arquivo(s):');
        files.forEach((file, index)=>{
            console.log(`Arquivo ${index + 1}: ${file.name}, tipo: ${file.type}, tamanho: ${file.size} bytes`);
        });
        const formData = new FormData();
        files.forEach((file)=>{
            formData.append('files', file);
        });
        console.log('FormData criado para teste, enviando para o endpoint de teste...');
        return api.post('/api/file-analysis/test-upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    getFile: (fileId)=>api.get(`/api/files/${fileId}`),
    deleteFile: (fileId)=>api.delete(`/api/files/${fileId}`),
    listFiles: (category, planId)=>{
        let url = '/api/files?';
        if (category) url += `category=${category}&`;
        if (planId) url += `planId=${planId}`;
        return api.get(url);
    }
};
const promptAPI = {
    getPrompts: ()=>api.get('/api/prompts'),
    getPromptById: (id)=>api.get(`/api/prompts/${id}`),
    createPrompt: (promptData)=>api.post('/api/prompts', promptData),
    updatePrompt: (id, promptData)=>api.put(`/api/prompts/${id}`, promptData),
    deletePrompt: (id)=>api.delete(`/api/prompts/${id}`),
    setPromptActive: (id)=>api.patch(`/api/prompts/${id}/activate`)
};
const materialAPI = {
    getMaterials: (page = 1, limit = 10, category = '', search = '', tags = '', status = '')=>api.get(`/api/materials?page=${page}&limit=${limit}&category=${category}&search=${search}&tags=${tags}&status=${status}`),
    getMaterialById: (id)=>api.get(`/api/materials/${id}`),
    uploadMaterial: (formData)=>api.post('/api/materials/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }),
    updateMaterial: (id, materialData)=>api.patch(`/api/materials/${id}`, materialData),
    deleteMaterial: (id)=>api.delete(`/api/materials/${id}`),
    searchMaterials: (query, categories, tags)=>api.post('/api/materials/search', {
            query,
            categories: categories && categories.length > 0 ? categories.join(',') : undefined,
            tags: tags && tags.length > 0 ? tags.join(',') : undefined
        }),
    getMaterialChunks: (id)=>api.get(`/api/materials/${id}/chunks`),
    reprocessMaterial: (id)=>api.post(`/api/materials/${id}/reprocess`)
};
const adminAPI = {
    // Estatísticas do dashboard
    getStats: ()=>api.get('/api/admin/stats'),
    // Gerenciamento de usuários
    getUsers: (params)=>{
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.role) queryParams.append('role', params.role);
        if (params.status) queryParams.append('status', params.status);
        return api.get(`/api/admin/users?${queryParams.toString()}`);
    },
    createUser: (userData)=>api.post('/api/admin/users', userData),
    updateUser: (id, userData)=>api.put(`/api/admin/users/${id}`, userData),
    deleteUser: (id)=>api.delete(`/api/admin/users/${id}`),
    // Gerenciamento de empresas
    getCompanies: (params)=>{
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.status) queryParams.append('status', params.status);
        return api.get(`/api/admin/companies?${queryParams.toString()}`);
    },
    createCompany: (companyData)=>api.post('/api/admin/companies', companyData),
    updateCompany: (id, companyData)=>api.put(`/api/admin/companies/${id}`, companyData),
    deleteCompany: (id)=>api.delete(`/api/admin/companies/${id}`),
    // Gerenciamento de planos
    getPlansStats: ()=>api.get('/api/admin/plans/stats'),
    // Logs e atividade
    getActivityLogs: (page = 1, limit = 10)=>api.get(`/api/admin/logs?page=${page}&limit=${limit}`),
    // Configurações do sistema
    getSystemSettings: ()=>api.get('/api/admin/settings'),
    updateSystemSettings: (settingsData)=>api.put('/api/admin/settings', settingsData)
};
const __TURBOPACK__default__export__ = api;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/store/authStore.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__),
    "useAuthStore": (()=>useAuthStore)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
;
;
const useAuthStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        // Inicialize o token a partir do localStorage para garantir que o API interceptor tenha acesso imediato
        token: ("TURBOPACK compile-time truthy", 1) ? localStorage.getItem('token') : ("TURBOPACK unreachable", undefined),
        user: null,
        isAuthenticated: ("TURBOPACK compile-time truthy", 1) ? !!localStorage.getItem('token') : ("TURBOPACK unreachable", undefined),
        isLoading: false,
        error: null,
        login: async (email, password)=>{
            try {
                set({
                    isLoading: true,
                    error: null
                });
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authAPI"].login(email, password);
                const { token, user } = response.data.data;
                // Save token to localStorage for API interceptor
                localStorage.setItem('token', token);
                set({
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false
                });
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Failed to login';
                set({
                    error: errorMessage,
                    isLoading: false
                });
                throw new Error(errorMessage);
            }
        },
        register: async (name, email, password, company)=>{
            try {
                set({
                    isLoading: true,
                    error: null
                });
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authAPI"].register(name, email, password, company);
                set({
                    isLoading: false
                });
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Failed to register';
                set({
                    error: errorMessage,
                    isLoading: false
                });
                throw new Error(errorMessage);
            }
        },
        logout: ()=>{
            localStorage.removeItem('token');
            set({
                token: null,
                user: null,
                isAuthenticated: false
            });
        },
        forgotPassword: async (email)=>{
            try {
                set({
                    isLoading: true,
                    error: null
                });
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authAPI"].forgotPassword(email);
                set({
                    isLoading: false
                });
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Failed to send reset password email';
                set({
                    error: errorMessage,
                    isLoading: false
                });
                throw new Error(errorMessage);
            }
        },
        resetPassword: async (token, password)=>{
            try {
                set({
                    isLoading: true,
                    error: null
                });
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authAPI"].resetPassword(token, password);
                set({
                    isLoading: false
                });
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Failed to reset password';
                set({
                    error: errorMessage,
                    isLoading: false
                });
                throw new Error(errorMessage);
            }
        },
        changePassword: async (currentPassword, newPassword)=>{
            try {
                set({
                    isLoading: true,
                    error: null
                });
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authAPI"].changePassword(currentPassword, newPassword);
                set({
                    isLoading: false
                });
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Failed to change password';
                set({
                    error: errorMessage,
                    isLoading: false
                });
                throw new Error(errorMessage);
            }
        },
        clearError: ()=>set({
                error: null
            })
    }), {
    name: 'auth-storage',
    partialize: (state)=>({
            token: state.token,
            user: state.user,
            isAuthenticated: state.isAuthenticated
        })
}));
const __TURBOPACK__default__export__ = useAuthStore;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/auth/ProtectedRoute.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>ProtectedRoute)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$authStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/authStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password'
];
function ProtectedRoute({ children }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const { token, isAuthenticated, user, logout } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$authStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])();
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isValidatingToken, setIsValidatingToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Verifica se a rota atual é pública
    const isPublicRoute = publicRoutes.includes(pathname || '');
    // Usando um ref para evitar loops infinitos
    const validationCounter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProtectedRoute.useEffect": ()=>{
            // Não tente validar token se já estivermos em uma rota pública
            if (isPublicRoute) {
                setIsLoading(false);
                return;
            }
            // Limite a quantidade de tentativas de validação para evitar loops infinitos
            if (validationCounter.current > 2) {
                console.log('Excesso de validações, limitando para evitar loop');
                setIsLoading(false);
                return;
            }
            // Função para validar o token atual
            const validateToken = {
                "ProtectedRoute.useEffect.validateToken": async ()=>{
                    if (!token) {
                        setIsLoading(false);
                        if (!isPublicRoute) {
                            router.push('/auth/login');
                        }
                        return;
                    }
                    try {
                        // Incrementa o contador de validações
                        validationCounter.current += 1;
                        setIsValidatingToken(true);
                        // Faça uma solicitação para um endpoint protegido para validar o token
                        // Verificando se o token é válido usando uma rota protegida simples
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get('/api/auth/validate-token');
                        setIsValidatingToken(false);
                        setIsLoading(false);
                    } catch (error) {
                        console.error('Token inválido ou expirado', error);
                        // Se houver um erro de autenticação, faça logout e redirecione
                        logout();
                        setIsValidatingToken(false);
                        setIsLoading(false);
                        if (!isPublicRoute) {
                            router.push('/auth/login');
                        }
                    }
                }
            }["ProtectedRoute.useEffect.validateToken"];
            // Use um identificador único para a validação atual
            const validationId = Date.now();
            const currentPathname = pathname;
            // Somente valide o token se a rota for protegida e não estiver já validando
            if (!isPublicRoute && !isValidatingToken) {
                // Implemente um atraso mínimo para evitar múltiplas tentativas em sequência
                const timeout = setTimeout({
                    "ProtectedRoute.useEffect.timeout": ()=>{
                        // Verifica se ainda é a mesma página e validação
                        if (currentPathname === pathname && !isValidatingToken) {
                            validateToken();
                        }
                    }
                }["ProtectedRoute.useEffect.timeout"], 1000);
                return ({
                    "ProtectedRoute.useEffect": ()=>clearTimeout(timeout)
                })["ProtectedRoute.useEffect"];
            } else {
                setIsLoading(false);
            }
        // Remover router das dependências porque ele muda frequentemente e causa re-execuções
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["ProtectedRoute.useEffect"], [
        token,
        isAuthenticated,
        pathname,
        isPublicRoute,
        isValidatingToken,
        logout
    ]);
    // Efeito para lidar com redirecionamentos após a renderização
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProtectedRoute.useEffect": ()=>{
            if (!isLoading) {
                // Redirecionar usuários autenticados para o dashboard se tentarem acessar páginas de autenticação
                if (isAuthenticated && isPublicRoute) {
                    router.push('/dashboard');
                }
                // Redirecionar usuários não autenticados para login se tentarem acessar páginas protegidas
                if (!isAuthenticated && !isPublicRoute) {
                    router.push('/auth/login');
                }
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["ProtectedRoute.useEffect"], [
        isLoading,
        isAuthenticated,
        isPublicRoute
    ]);
    // Se estiver carregando, mostre um spinner ou nada
    if (isLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center min-h-screen",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"
            }, void 0, false, {
                fileName: "[project]/src/components/auth/ProtectedRoute.tsx",
                lineNumber: 115,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/auth/ProtectedRoute.tsx",
            lineNumber: 114,
            columnNumber: 7
        }, this);
    }
    // Se estiver fazendo redirecionamento, não mostre nada
    if (isAuthenticated && isPublicRoute || !isAuthenticated && !isPublicRoute) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center min-h-screen",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"
            }, void 0, false, {
                fileName: "[project]/src/components/auth/ProtectedRoute.tsx",
                lineNumber: 124,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/auth/ProtectedRoute.tsx",
            lineNumber: 123,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(ProtectedRoute, "eJjqUc0k3eRMJuxnOKM9x6SGfvo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$authStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
    ];
});
_c = ProtectedRoute;
var _c;
__turbopack_context__.k.register(_c, "ProtectedRoute");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/providers/AuthProvider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>AuthProvider)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$ProtectedRoute$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/auth/ProtectedRoute.tsx [app-client] (ecmascript)");
'use client';
;
;
function AuthProvider({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$auth$2f$ProtectedRoute$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/providers/AuthProvider.tsx",
        lineNumber: 12,
        columnNumber: 10
    }, this);
}
_c = AuthProvider;
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_40e653ea._.js.map