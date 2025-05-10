import { ChatOpenAI } from '@langchain/openai';
import { UsageType } from '../models/TokenUsage';
import mongoose, { Document } from 'mongoose';
export interface IAgentContext extends Document {
    agent: string;
    plan: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    company: mongoose.Types.ObjectId;
    context: Record<string, any>;
    lastUpdated: Date;
    createdAt: Date;
}
/**
 * Interface para configuração de agentes
 */
interface AgentConfig {
    userId: string | mongoose.Types.ObjectId;
    companyId: string | mongoose.Types.ObjectId;
    planId: string | mongoose.Types.ObjectId;
    agentType: string;
    historySummary?: string;
}
/**
 * Interface para o contexto de um agente
 */
interface AgentContextData {
    patientInfo?: string;
    examResults?: string;
    tcmObservations?: string;
    timelineData?: string;
    previousAnalyses?: string;
    ifmMatrix?: string;
    professionalType?: string;
    specialInstructions?: string;
    conversationHistory?: string;
}
/**
 * Classe base para agentes especializados
 */
declare class BaseSpecializedAgent {
    protected model: ChatOpenAI;
    protected userId: string | mongoose.Types.ObjectId;
    protected companyId: string | mongoose.Types.ObjectId;
    protected planId: string | mongoose.Types.ObjectId;
    protected agentType: string;
    protected context: AgentContextData;
    constructor(config: AgentConfig);
    /**
     * Define o contexto do agente
     */
    setContext(context: AgentContextData): void;
    /**
     * Salva o contexto do agente no banco de dados
     */
    saveContext(): Promise<string>;
    /**
     * Carrega o contexto do agente do banco de dados
     */
    loadContext(): Promise<void>;
    /**
     * Gera um prompt completo com o contexto do agente
     */
    protected generateContextualPrompt(basePrompt: string): string;
    /**
     * Rastreia o uso de tokens para esta interação
     */
    protected trackUsage(inputLength: number, outputLength: number, type: UsageType): Promise<void>;
}
/**
 * Agente especializado em análise de exames laboratoriais
 */
export declare class ExamAnalysisAgent extends BaseSpecializedAgent {
    constructor(config: AgentConfig);
    /**
     * Analisa exames laboratoriais
     */
    analyzeExams(examResults: string, patientInfo: string, query?: string): Promise<string>;
}
/**
 * Agente especializado em medicina tradicional chinesa
 */
export declare class TCMAgent extends BaseSpecializedAgent {
    constructor(config: AgentConfig);
    /**
     * Analisa observações de medicina tradicional chinesa
     */
    analyzeTCMObservations(tcmObservations: string, patientInfo: string, query?: string): Promise<string>;
}
/**
 * Agente especializado em medicina funcional e matriz IFM
 */
export declare class IFMAgent extends BaseSpecializedAgent {
    constructor(config: AgentConfig);
    /**
     * Analisa dados usando a matriz IFM
     */
    analyzeIFMMatrix(patientInfo: string, labResults: string, timeline: string, query?: string): Promise<string>;
}
/**
 * Agente para geração de planos de saúde
 */
export declare class PlanGenerationAgent extends BaseSpecializedAgent {
    constructor(config: AgentConfig);
    /**
     * Gera um plano de saúde personalizado
     */
    generatePlan(patientInfo: string, analysisSummary: string, professionalType: string, specialInstructions?: string): Promise<string>;
    /**
     * Refina ou ajusta um plano existente
     */
    refinePlan(existingPlan: string, feedback: string): Promise<string>;
}
/**
 * Fábrica para criar agentes especializados
 */
export declare const createAgent: (agentType: string, userId: string | mongoose.Types.ObjectId, companyId: string | mongoose.Types.ObjectId, planId: string | mongoose.Types.ObjectId, useHistorySummary?: boolean, historySummary?: string) => BaseSpecializedAgent;
export {};
