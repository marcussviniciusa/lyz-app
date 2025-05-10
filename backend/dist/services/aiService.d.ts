import { UsageType } from '../models/TokenUsage';
import { PromptType } from '../models/Prompt';
import mongoose from 'mongoose';
/**
 * Tracks token usage for AI operations
 */
export declare const trackTokenUsage: (userId: string | mongoose.Types.ObjectId, companyId: string | mongoose.Types.ObjectId, planId: string | mongoose.Types.ObjectId | null, type: UsageType, inputTokens: number, outputTokens: number) => Promise<void>;
/**
 * Gets a prompt template from the database and formats it
 */
export declare const getPrompt: (type: PromptType) => Promise<string>;
/**
 * Analyzes lab exams using LangChain and OpenAI
 */
export declare const analyzeExams: (examResults: string, patientInfo: string, userId: string | mongoose.Types.ObjectId, companyId: string | mongoose.Types.ObjectId, planId: string | mongoose.Types.ObjectId) => Promise<string>;
/**
 * Analyzes TCM observations
 */
export declare const analyzeTCMObservations: (tcmObservations: string, patientInfo: string, userId: string | mongoose.Types.ObjectId, companyId: string | mongoose.Types.ObjectId, planId: string | mongoose.Types.ObjectId) => Promise<string>;
/**
 * Analyzes patient data using the IFM Matrix
 */
export declare const analyzeIFMMatrix: (patientInfo: string, labResults: string, timeline: string, userId: string | mongoose.Types.ObjectId, companyId: string | mongoose.Types.ObjectId, planId: string | mongoose.Types.ObjectId) => Promise<string>;
/**
 * Generates a complete health plan
 */
export declare const generatePlan: (patientInfo: string, analysisSummary: string, professionalType: string, userId: string | mongoose.Types.ObjectId, companyId: string | mongoose.Types.ObjectId, planId: string | mongoose.Types.ObjectId) => Promise<string>;
