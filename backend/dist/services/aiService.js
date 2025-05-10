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
exports.generatePlan = exports.analyzeIFMMatrix = exports.analyzeTCMObservations = exports.analyzeExams = exports.getPrompt = exports.trackTokenUsage = void 0;
const openai_1 = require("@langchain/openai");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const TokenUsage_1 = __importStar(require("../models/TokenUsage"));
const Prompt_1 = __importStar(require("../models/Prompt"));
// Initialize ChatOpenAI model with API key
const model = new openai_1.ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4',
    temperature: 0.2
});
/**
 * Tracks token usage for AI operations
 */
const trackTokenUsage = async (userId, companyId, planId, type, inputTokens, outputTokens) => {
    try {
        const usage = new TokenUsage_1.default({
            user: userId,
            company: companyId,
            plan: planId,
            type,
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens
        });
        await usage.save();
    }
    catch (error) {
        console.error('Error tracking token usage:', error);
    }
};
exports.trackTokenUsage = trackTokenUsage;
/**
 * Gets a prompt template from the database and formats it
 */
const getPrompt = async (type) => {
    try {
        const prompt = await Prompt_1.default.findOne({ type, isActive: true });
        if (!prompt) {
            // Return default prompt if none found in database
            return getDefaultPrompt(type);
        }
        return prompt.content;
    }
    catch (error) {
        console.error(`Error fetching ${type} prompt:`, error);
        return getDefaultPrompt(type);
    }
};
exports.getPrompt = getPrompt;
/**
 * Returns default prompts for each type if none found in DB
 */
const getDefaultPrompt = (type) => {
    switch (type) {
        case Prompt_1.PromptType.EXAM_ANALYSIS:
            return `You are a specialized healthcare AI assistant analyzing laboratory exams.
      
      Analyze the following laboratory exam results carefully and provide:
      
      1. An overview of any abnormal findings
      2. Potential underlying patterns or imbalances 
      3. Correlations between different markers
      4. How these findings might relate to hormonal health and menstrual cycle
      5. Recommendations for further investigation if needed
      
      Laboratory Results:
      {examResults}
      
      Patient Context:
      {patientInfo}
      
      Please format your response in markdown. Keep your analysis factual, evidence-based, and avoid alarmist language.`;
        case Prompt_1.PromptType.TCM_ANALYSIS:
            return `You are a specialized Traditional Chinese Medicine (TCM) practitioner AI assistant.
      
      Analyze the following TCM observations and provide:
      
      1. An assessment of the patient's energetic patterns according to TCM principles
      2. Identification of potential imbalances in the Five Elements
      3. Analysis of Yin/Yang balance
      4. Identification of relevant organ systems affected
      5. How these patterns may relate to the patient's menstrual cycle and fertility
      
      TCM Observations:
      {tcmObservations}
      
      Patient Context:
      {patientInfo}
      
      Please format your response in markdown. Use traditional TCM terminology but explain concepts clearly.`;
        case Prompt_1.PromptType.IFM_MATRIX:
            return `You are a specialized Functional Medicine AI assistant analyzing a patient case using the Institute for Functional Medicine (IFM) Matrix.
      
      Based on the information provided, analyze the patient's case through the lens of the IFM Matrix:
      
      1. Analyze each of the seven core biological systems:
         - Assimilation (digestion, absorption, microbiome)
         - Defense & Repair (immune system, inflammation)
         - Energy (energy production and management)
         - Biotransformation & Elimination (detoxification)
         - Transport (cardiovascular and lymphatic systems)
         - Communication (hormones and neurotransmitters)
         - Structural Integrity (from cellular membranes to musculoskeletal structure)
      
      2. For each system, consider:
         - Antecedents (genetic and environmental factors)
         - Triggers (what might be activating the symptoms)
         - Mediators (what perpetuates the dysfunction)
      
      Patient Information:
      {patientInfo}
      
      Laboratory Results:
      {labResults}
      
      Timeline:
      {timeline}
      
      Please format your response in markdown. Highlight priority areas that need addressing and potential root causes.`;
        case Prompt_1.PromptType.PLAN_GENERATION:
            return `You are a specialized women's health AI assistant creating a personalized health plan.
      
      Based on all the information provided, create a comprehensive health plan that:
      
      1. Summarizes the patient's case and main findings
      2. Provides a general nutritional approach 
      3. Includes a cyclical nutritional plan with specific recommendations for:
         - Follicular phase
         - Ovulatory phase
         - Luteal phase
         - Menstrual phase
      4. Recommends appropriate supplements with dosages
      5. Suggests lifestyle modifications
      6. Proposes a follow-up schedule
      
      Patient Information:
      {patientInfo}
      
      Analysis Summary:
      {analysisSummary}
      
      Professional Type: {professionalType}
      
      Please format your response in markdown, with clear sections and bullet points where appropriate. Tailor the language and recommendations based on the professional type (medical/nutritionist or other professional).`;
        default:
            return `Analyze the following information and provide your expert insights:
      
      {input}`;
    }
};
/**
 * Analyzes lab exams using LangChain and OpenAI
 */
const analyzeExams = async (examResults, patientInfo, userId, companyId, planId) => {
    try {
        // Get the exam analysis prompt template
        const promptTemplate = await (0, exports.getPrompt)(Prompt_1.PromptType.EXAM_ANALYSIS);
        // Create LangChain prompt
        const prompt = prompts_1.PromptTemplate.fromTemplate(promptTemplate);
        // Create the chain
        const chain = prompt.pipe(model).pipe(new output_parsers_1.StringOutputParser());
        // Run the chain
        const response = await chain.invoke({
            examResults,
            patientInfo
        });
        // For a real implementation, we would track actual token usage
        // This is a placeholder for demonstration purposes
        const estimatedInputTokens = (examResults.length + patientInfo.length) / 4;
        const estimatedOutputTokens = response.length / 4;
        // Track token usage
        await (0, exports.trackTokenUsage)(userId, companyId, planId, TokenUsage_1.UsageType.EXAM_ANALYSIS, estimatedInputTokens, estimatedOutputTokens);
        return response;
    }
    catch (error) {
        console.error('Error analyzing exams:', error);
        throw new Error('Failed to analyze exam results');
    }
};
exports.analyzeExams = analyzeExams;
/**
 * Analyzes TCM observations
 */
const analyzeTCMObservations = async (tcmObservations, patientInfo, userId, companyId, planId) => {
    try {
        // Get the TCM analysis prompt template
        const promptTemplate = await (0, exports.getPrompt)(Prompt_1.PromptType.TCM_ANALYSIS);
        // Create LangChain prompt
        const prompt = prompts_1.PromptTemplate.fromTemplate(promptTemplate);
        // Create the chain
        const chain = prompt.pipe(model).pipe(new output_parsers_1.StringOutputParser());
        // Run the chain
        const response = await chain.invoke({
            tcmObservations,
            patientInfo
        });
        // Placeholder for token tracking
        const estimatedInputTokens = (tcmObservations.length + patientInfo.length) / 4;
        const estimatedOutputTokens = response.length / 4;
        // Track token usage
        await (0, exports.trackTokenUsage)(userId, companyId, planId, TokenUsage_1.UsageType.TCM_ANALYSIS, estimatedInputTokens, estimatedOutputTokens);
        return response;
    }
    catch (error) {
        console.error('Error analyzing TCM observations:', error);
        throw new Error('Failed to analyze TCM observations');
    }
};
exports.analyzeTCMObservations = analyzeTCMObservations;
/**
 * Analyzes patient data using the IFM Matrix
 */
const analyzeIFMMatrix = async (patientInfo, labResults, timeline, userId, companyId, planId) => {
    try {
        // Get the IFM Matrix analysis prompt template
        const promptTemplate = await (0, exports.getPrompt)(Prompt_1.PromptType.IFM_MATRIX);
        // Create LangChain prompt
        const prompt = prompts_1.PromptTemplate.fromTemplate(promptTemplate);
        // Create the chain
        const chain = prompt.pipe(model).pipe(new output_parsers_1.StringOutputParser());
        // Run the chain
        const response = await chain.invoke({
            patientInfo,
            labResults,
            timeline
        });
        // Placeholder for token tracking
        const estimatedInputTokens = (patientInfo.length + labResults.length + timeline.length) / 4;
        const estimatedOutputTokens = response.length / 4;
        // Track token usage
        await (0, exports.trackTokenUsage)(userId, companyId, planId, TokenUsage_1.UsageType.IFM_MATRIX, estimatedInputTokens, estimatedOutputTokens);
        return response;
    }
    catch (error) {
        console.error('Error analyzing IFM Matrix:', error);
        throw new Error('Failed to analyze using IFM Matrix');
    }
};
exports.analyzeIFMMatrix = analyzeIFMMatrix;
/**
 * Generates a complete health plan
 */
const generatePlan = async (patientInfo, analysisSummary, professionalType, userId, companyId, planId) => {
    try {
        // Get the plan generation prompt template
        const promptTemplate = await (0, exports.getPrompt)(Prompt_1.PromptType.PLAN_GENERATION);
        // Create LangChain prompt
        const prompt = prompts_1.PromptTemplate.fromTemplate(promptTemplate);
        // Create the chain
        const chain = prompt.pipe(model).pipe(new output_parsers_1.StringOutputParser());
        // Run the chain
        const response = await chain.invoke({
            patientInfo,
            analysisSummary,
            professionalType
        });
        // Placeholder for token tracking
        const estimatedInputTokens = (patientInfo.length + analysisSummary.length + professionalType.length) / 4;
        const estimatedOutputTokens = response.length / 4;
        // Track token usage
        await (0, exports.trackTokenUsage)(userId, companyId, planId, TokenUsage_1.UsageType.PLAN_GENERATION, estimatedInputTokens, estimatedOutputTokens);
        return response;
    }
    catch (error) {
        console.error('Error generating plan:', error);
        throw new Error('Failed to generate health plan');
    }
};
exports.generatePlan = generatePlan;
