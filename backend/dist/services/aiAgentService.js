"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgent = exports.PlanGenerationAgent = exports.IFMAgent = exports.TCMAgent = exports.ExamAnalysisAgent = void 0;
const openai_1 = require("@langchain/openai");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const TokenUsage_1 = require("../models/TokenUsage");
const Prompt_1 = require("../models/Prompt");
const mongoose_1 = __importStar(require("mongoose"));
const aiService_1 = require("./aiService");
const AgentContextSchema = new mongoose_1.Schema({
    agent: {
        type: String,
        required: true,
        enum: ['exam_analysis', 'tcm_analysis', 'ifm_analysis', 'plan_generation'],
        index: true
    },
    plan: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true,
        index: true
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    context: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
// Índice composto para buscar pelo agente e plano juntos
AgentContextSchema.index({ agent: 1, plan: 1 }, { unique: true });
// Modelo para contexto do agente
const AgentContext = mongoose_1.default.model('AgentContext', AgentContextSchema);
// Modelos especializados para diferentes tarefas
const generalModel = new openai_1.ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4',
    temperature: 0.2
});
const analysisModel = new openai_1.ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4',
    temperature: 0.1 // Menor temperatura para análises mais consistentes
});
const creativeModel = new openai_1.ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4',
    temperature: 0.7 // Maior temperatura para recomendações mais criativas
});
/**
 * Classe base para agentes especializados
 */
class BaseSpecializedAgent {
    constructor(config) {
        this.userId = config.userId;
        this.companyId = config.companyId;
        this.planId = config.planId;
        this.agentType = config.agentType;
        this.model = generalModel;
        this.context = {};
        // Se houver um resumo histórico, adicionar ao contexto
        if (config.historySummary) {
            this.context.conversationHistory = config.historySummary;
        }
    }
    /**
     * Define o contexto do agente
     */
    setContext(context) {
        this.context = { ...this.context, ...context };
    }
    /**
     * Salva o contexto do agente no banco de dados
     */
    async saveContext() {
        try {
            // Cria ou atualiza o contexto no banco de dados
            const result = await AgentContext.findOneAndUpdate({
                agent: this.agentType,
                plan: this.planId
            }, {
                agent: this.agentType,
                plan: this.planId,
                user: this.userId,
                company: this.companyId,
                context: this.context,
                lastUpdated: new Date()
            }, { upsert: true, new: true });
            if (!result) {
                throw new Error('Failed to create or update agent context');
            }
            // Usar uma forma segura de acessar o _id
            const contextId = result._id ? result._id.toString() : result.id?.toString();
            if (!contextId) {
                throw new Error('Invalid context ID returned from database');
            }
            return contextId;
        }
        catch (error) {
            console.error('Error saving agent context:', error);
            throw new Error('Failed to save agent context');
        }
    }
    /**
     * Carrega o contexto do agente do banco de dados
     */
    async loadContext() {
        try {
            const contextDoc = await AgentContext.findOne({
                agent: this.agentType,
                plan: this.planId
            });
            if (contextDoc && contextDoc.context) {
                this.context = contextDoc.context;
            }
        }
        catch (error) {
            console.error('Error loading agent context:', error);
            throw new Error('Failed to load agent context');
        }
    }
    /**
     * Gera um prompt completo com o contexto do agente
     */
    generateContextualPrompt(basePrompt) {
        let fullPrompt = basePrompt;
        // Adicionar cada parte do contexto relevante ao prompt
        if (this.context.patientInfo) {
            fullPrompt += `\n\nPatient Information:\n${this.context.patientInfo}`;
        }
        if (this.context.examResults) {
            fullPrompt += `\n\nExam Results:\n${this.context.examResults}`;
        }
        if (this.context.tcmObservations) {
            fullPrompt += `\n\nTCM Observations:\n${this.context.tcmObservations}`;
        }
        if (this.context.timelineData) {
            fullPrompt += `\n\nTimeline Data:\n${this.context.timelineData}`;
        }
        if (this.context.ifmMatrix) {
            fullPrompt += `\n\nIFM Matrix Analysis:\n${this.context.ifmMatrix}`;
        }
        if (this.context.previousAnalyses) {
            fullPrompt += `\n\nPrevious Analyses:\n${this.context.previousAnalyses}`;
        }
        if (this.context.specialInstructions) {
            fullPrompt += `\n\nSpecial Instructions:\n${this.context.specialInstructions}`;
        }
        if (this.context.conversationHistory) {
            fullPrompt += `\n\nConversation History:\n${this.context.conversationHistory}`;
        }
        return fullPrompt;
    }
    /**
     * Rastreia o uso de tokens para esta interação
     */
    async trackUsage(inputLength, outputLength, type) {
        // Estimativa aproximada de tokens (4 caracteres ≈ 1 token)
        const estimatedInputTokens = Math.ceil(inputLength / 4);
        const estimatedOutputTokens = Math.ceil(outputLength / 4);
        await (0, aiService_1.trackTokenUsage)(this.userId, this.companyId, this.planId, type, estimatedInputTokens, estimatedOutputTokens);
    }
}
/**
 * Agente especializado em análise de exames laboratoriais
 */
class ExamAnalysisAgent extends BaseSpecializedAgent {
    constructor(config) {
        super({ ...config, agentType: 'exam_analysis' });
        this.model = analysisModel; // Usa o modelo otimizado para análises
    }
    /**
     * Analisa exames laboratoriais
     */
    async analyzeExams(examResults, patientInfo, query) {
        try {
            // Atualiza o contexto do agente
            this.setContext({
                examResults,
                patientInfo
            });
            // Obtém o prompt de análise de exames
            const basePrompt = await (0, aiService_1.getPrompt)(Prompt_1.PromptType.EXAM_ANALYSIS);
            const systemPrompt = this.generateContextualPrompt(basePrompt);
            // Prepara o prompt final com a query do usuário (ou um prompt padrão)
            const userQuery = query || "Analyze these exam results and provide insights";
            // Cria a chain simplificada com o LangChain
            const prompt = new prompts_1.PromptTemplate({
                template: `${systemPrompt}\n\nUser Query: {userQuery}`,
                inputVariables: ["userQuery"]
            });
            const chain = prompt.pipe(this.model).pipe(new output_parsers_1.StringOutputParser());
            // Executa a análise
            const response = await chain.invoke({ userQuery });
            // Atualiza o contexto com um resumo da conversação
            const conversation = `User: ${userQuery}\nAI: ${response.substring(0, 200)}...`;
            if (this.context.conversationHistory) {
                this.context.conversationHistory += "\n" + conversation;
            }
            else {
                this.context.conversationHistory = conversation;
            }
            // Salva o contexto no banco de dados
            await this.saveContext();
            // Rastreia uso de tokens
            const totalInputLength = systemPrompt.length + (query?.length || 20);
            await this.trackUsage(totalInputLength, response.length, TokenUsage_1.UsageType.EXAM_ANALYSIS);
            return response;
        }
        catch (error) {
            console.error('Error in exam analysis agent:', error);
            throw new Error('Failed to analyze exam results');
        }
    }
}
exports.ExamAnalysisAgent = ExamAnalysisAgent;
/**
 * Agente especializado em medicina tradicional chinesa
 */
class TCMAgent extends BaseSpecializedAgent {
    constructor(config) {
        super({ ...config, agentType: 'tcm_analysis' });
    }
    /**
     * Analisa observações de medicina tradicional chinesa
     */
    async analyzeTCMObservations(tcmObservations, patientInfo, query) {
        try {
            // Atualiza o contexto do agente
            this.setContext({
                tcmObservations,
                patientInfo
            });
            // Obtém o prompt de análise TCM
            const basePrompt = await (0, aiService_1.getPrompt)(Prompt_1.PromptType.TCM_ANALYSIS);
            const systemPrompt = this.generateContextualPrompt(basePrompt);
            // Prepara o prompt final com a query do usuário (ou um prompt padrão)
            const userQuery = query || "Analyze these TCM observations and provide insights";
            // Cria a chain simplificada com o LangChain
            const prompt = new prompts_1.PromptTemplate({
                template: `${systemPrompt}\n\nUser Query: {userQuery}`,
                inputVariables: ["userQuery"]
            });
            const chain = prompt.pipe(this.model).pipe(new output_parsers_1.StringOutputParser());
            // Executa a análise
            const response = await chain.invoke({ userQuery });
            // Atualiza o contexto com um resumo da conversação
            const conversation = `User: ${userQuery}\nAI: ${response.substring(0, 200)}...`;
            if (this.context.conversationHistory) {
                this.context.conversationHistory += "\n" + conversation;
            }
            else {
                this.context.conversationHistory = conversation;
            }
            // Salva o contexto no banco de dados
            await this.saveContext();
            // Rastreia uso de tokens
            const totalInputLength = systemPrompt.length + (query?.length || 20);
            await this.trackUsage(totalInputLength, response.length, TokenUsage_1.UsageType.TCM_ANALYSIS);
            return response;
        }
        catch (error) {
            console.error('Error in TCM analysis agent:', error);
            throw new Error('Failed to analyze TCM observations');
        }
    }
}
exports.TCMAgent = TCMAgent;
/**
 * Agente especializado em medicina funcional e matriz IFM
 */
class IFMAgent extends BaseSpecializedAgent {
    constructor(config) {
        super({ ...config, agentType: 'ifm_analysis' });
        this.model = analysisModel; // Usa o modelo otimizado para análises
    }
    /**
     * Analisa dados usando a matriz IFM
     */
    async analyzeIFMMatrix(patientInfo, labResults, timeline, query) {
        try {
            // Atualiza o contexto do agente
            this.setContext({
                patientInfo,
                examResults: labResults,
                timelineData: timeline
            });
            // Obtém o prompt de análise IFM
            const basePrompt = await (0, aiService_1.getPrompt)(Prompt_1.PromptType.IFM_MATRIX);
            const systemPrompt = this.generateContextualPrompt(basePrompt);
            // Prepara o prompt final com a query do usuário (ou um prompt padrão)
            const userQuery = query || "Analyze using the IFM Matrix framework and provide insights";
            // Cria a chain simplificada com o LangChain
            const prompt = new prompts_1.PromptTemplate({
                template: `${systemPrompt}\n\nUser Query: {userQuery}`,
                inputVariables: ["userQuery"]
            });
            const chain = prompt.pipe(this.model).pipe(new output_parsers_1.StringOutputParser());
            // Executa a análise
            const response = await chain.invoke({ userQuery });
            // Atualiza o contexto com um resumo da conversação
            const conversation = `User: ${userQuery}\nAI: ${response.substring(0, 200)}...`;
            if (this.context.conversationHistory) {
                this.context.conversationHistory += "\n" + conversation;
            }
            else {
                this.context.conversationHistory = conversation;
            }
            // Salva o contexto no banco de dados
            await this.saveContext();
            // Rastreia uso de tokens
            const totalInputLength = systemPrompt.length + (query?.length || 20);
            await this.trackUsage(totalInputLength, response.length, TokenUsage_1.UsageType.IFM_MATRIX);
            return response;
        }
        catch (error) {
            console.error('Error in IFM analysis agent:', error);
            throw new Error('Failed to analyze using IFM Matrix');
        }
    }
}
exports.IFMAgent = IFMAgent;
/**
 * Agente para geração de planos de saúde
 */
class PlanGenerationAgent extends BaseSpecializedAgent {
    constructor(config) {
        super({ ...config, agentType: 'plan_generation' });
        this.model = creativeModel; // Usa o modelo otimizado para criatividade
    }
    /**
     * Gera um plano de saúde personalizado
     */
    async generatePlan(patientInfo, analysisSummary, professionalType, specialInstructions) {
        try {
            // Atualiza o contexto do agente
            this.setContext({
                patientInfo,
                previousAnalyses: analysisSummary,
                professionalType,
                specialInstructions
            });
            // Obtém o prompt de geração de plano
            const basePrompt = await (0, aiService_1.getPrompt)(Prompt_1.PromptType.PLAN_GENERATION);
            const systemPrompt = this.generateContextualPrompt(basePrompt);
            // Cria a chain simplificada com o LangChain
            const prompt = new prompts_1.PromptTemplate({
                template: systemPrompt,
                inputVariables: []
            });
            const chain = prompt.pipe(this.model).pipe(new output_parsers_1.StringOutputParser());
            // Executa a geração do plano
            const response = await chain.invoke({});
            // Salva o contexto no banco de dados
            await this.saveContext();
            // Rastreia uso de tokens
            const totalInputLength = systemPrompt.length + 50; // estimativa aproximada
            await this.trackUsage(totalInputLength, response.length, TokenUsage_1.UsageType.PLAN_GENERATION);
            return response;
        }
        catch (error) {
            console.error('Error in plan generation agent:', error);
            throw new Error('Failed to generate health plan');
        }
    }
    /**
     * Refina ou ajusta um plano existente
     */
    async refinePlan(existingPlan, feedback) {
        try {
            // Cria um prompt específico para refinamento
            const systemPrompt = `You are a specialized healthcare AI assistant focused on refining health plans.
      
      Review the existing health plan and make adjustments based on the provided feedback.
      Maintain the overall structure but improve, add, or remove sections as needed.
      Ensure the plan remains medically sound and tailored to the patient's needs.
      
      Existing Plan:
      ${existingPlan}
      
      Feedback to Address:
      ${feedback}`;
            // Cria a chain simplificada com o LangChain
            const prompt = new prompts_1.PromptTemplate({
                template: systemPrompt,
                inputVariables: []
            });
            const chain = prompt.pipe(this.model).pipe(new output_parsers_1.StringOutputParser());
            // Executa o refinamento do plano
            const response = await chain.invoke({});
            // Rastreia uso de tokens
            const totalInputLength = systemPrompt.length + 50; // estimativa aproximada
            await this.trackUsage(totalInputLength, response.length, TokenUsage_1.UsageType.PLAN_REFINEMENT);
            return response;
        }
        catch (error) {
            console.error('Error in plan refinement:', error);
            throw new Error('Failed to refine health plan');
        }
    }
}
exports.PlanGenerationAgent = PlanGenerationAgent;
/**
 * Fábrica para criar agentes especializados
 */
const createAgent = (agentType, userId, companyId, planId, useHistorySummary = false, historySummary) => {
    const config = {
        userId,
        companyId,
        planId,
        agentType,
        historySummary: useHistorySummary ? historySummary : undefined
    };
    switch (agentType) {
        case 'exam_analysis':
            return new ExamAnalysisAgent(config);
        case 'tcm_analysis':
            return new TCMAgent(config);
        case 'ifm_analysis':
            return new IFMAgent(config);
        case 'plan_generation':
            return new PlanGenerationAgent(config);
        default:
            throw new Error(`Unknown agent type: ${agentType}`);
    }
};
exports.createAgent = createAgent;
