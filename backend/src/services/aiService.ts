import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import TokenUsage, { UsageType } from '../models/TokenUsage';
import Prompt, { PromptType } from '../models/Prompt';
import mongoose from 'mongoose';

// Initialize ChatOpenAI model with API key
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4',
  temperature: 0.2
});

/**
 * Tracks token usage for AI operations
 */
export const trackTokenUsage = async (
  userId: string | mongoose.Types.ObjectId,
  companyId: string | mongoose.Types.ObjectId,
  planId: string | mongoose.Types.ObjectId | null,
  type: UsageType,
  inputTokens: number,
  outputTokens: number
): Promise<void> => {
  try {
    const usage = new TokenUsage({
      user: userId,
      company: companyId,
      plan: planId,
      type,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    });

    await usage.save();
  } catch (error) {
    console.error('Error tracking token usage:', error);
  }
};

/**
 * Gets a prompt template from the database and formats it
 */
export const getPrompt = async (type: PromptType): Promise<string> => {
  try {
    const prompt = await Prompt.findOne({ type, isActive: true });
    
    if (!prompt) {
      // Return default prompt if none found in database
      return getDefaultPrompt(type);
    }
    
    return prompt.content;
  } catch (error) {
    console.error(`Error fetching ${type} prompt:`, error);
    return getDefaultPrompt(type);
  }
};

/**
 * Returns default prompts for each type if none found in DB
 */
const getDefaultPrompt = (type: PromptType): string => {
  switch (type) {
    case PromptType.EXAM_ANALYSIS:
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
      
    case PromptType.TCM_ANALYSIS:
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
      
    case PromptType.IFM_MATRIX:
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
      
    case PromptType.PLAN_GENERATION:
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
export const analyzeExams = async (
  examResults: string,
  patientInfo: string,
  userId: string | mongoose.Types.ObjectId,
  companyId: string | mongoose.Types.ObjectId,
  planId: string | mongoose.Types.ObjectId
): Promise<string> => {
  try {
    // Get the exam analysis prompt template
    const promptTemplate = await getPrompt(PromptType.EXAM_ANALYSIS);
    
    // Create LangChain prompt
    const prompt = PromptTemplate.fromTemplate(promptTemplate);
    
    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
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
    await trackTokenUsage(
      userId,
      companyId,
      planId,
      UsageType.EXAM_ANALYSIS,
      estimatedInputTokens,
      estimatedOutputTokens
    );
    
    return response;
  } catch (error) {
    console.error('Error analyzing exams:', error);
    throw new Error('Failed to analyze exam results');
  }
};

/**
 * Analyzes TCM observations
 */
export const analyzeTCMObservations = async (
  tcmObservations: string,
  patientInfo: string,
  userId: string | mongoose.Types.ObjectId,
  companyId: string | mongoose.Types.ObjectId,
  planId: string | mongoose.Types.ObjectId
): Promise<string> => {
  try {
    // Get the TCM analysis prompt template
    const promptTemplate = await getPrompt(PromptType.TCM_ANALYSIS);
    
    // Create LangChain prompt
    const prompt = PromptTemplate.fromTemplate(promptTemplate);
    
    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
    // Run the chain
    const response = await chain.invoke({
      tcmObservations,
      patientInfo
    });
    
    // Placeholder for token tracking
    const estimatedInputTokens = (tcmObservations.length + patientInfo.length) / 4;
    const estimatedOutputTokens = response.length / 4;
    
    // Track token usage
    await trackTokenUsage(
      userId,
      companyId,
      planId,
      UsageType.TCM_ANALYSIS,
      estimatedInputTokens,
      estimatedOutputTokens
    );
    
    return response;
  } catch (error) {
    console.error('Error analyzing TCM observations:', error);
    throw new Error('Failed to analyze TCM observations');
  }
};

/**
 * Analyzes patient data using the IFM Matrix
 */
export const analyzeIFMMatrix = async (
  patientInfo: string,
  labResults: string,
  timeline: string,
  userId: string | mongoose.Types.ObjectId,
  companyId: string | mongoose.Types.ObjectId,
  planId: string | mongoose.Types.ObjectId
): Promise<string> => {
  try {
    // Get the IFM Matrix analysis prompt template
    const promptTemplate = await getPrompt(PromptType.IFM_MATRIX);
    
    // Create LangChain prompt
    const prompt = PromptTemplate.fromTemplate(promptTemplate);
    
    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
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
    await trackTokenUsage(
      userId,
      companyId,
      planId,
      UsageType.IFM_MATRIX,
      estimatedInputTokens,
      estimatedOutputTokens
    );
    
    return response;
  } catch (error) {
    console.error('Error analyzing IFM Matrix:', error);
    throw new Error('Failed to analyze using IFM Matrix');
  }
};

/**
 * Generates a complete health plan
 */
export const generatePlan = async (
  patientInfo: string,
  analysisSummary: string,
  professionalType: string,
  userId: string | mongoose.Types.ObjectId,
  companyId: string | mongoose.Types.ObjectId,
  planId: string | mongoose.Types.ObjectId
): Promise<string> => {
  try {
    // Get the plan generation prompt template
    const promptTemplate = await getPrompt(PromptType.PLAN_GENERATION);
    
    // Create LangChain prompt
    const prompt = PromptTemplate.fromTemplate(promptTemplate);
    
    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    
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
    await trackTokenUsage(
      userId,
      companyId,
      planId,
      UsageType.PLAN_GENERATION,
      estimatedInputTokens,
      estimatedOutputTokens
    );
    
    return response;
  } catch (error) {
    console.error('Error generating plan:', error);
    throw new Error('Failed to generate health plan');
  }
};
