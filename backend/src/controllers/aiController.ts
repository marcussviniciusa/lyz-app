import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  analyzeExams,
  analyzeTCMObservations,
  analyzeIFMMatrix,
  generatePlan
} from '../services/aiService';
import {
  createAgent,
  ExamAnalysisAgent,
  TCMAgent,
  IFMAgent,
  PlanGenerationAgent
} from '../services/aiAgentService';
import AgentContext from '../models/AgentContext';
import Plan, { PlanStatus } from '../models/Plan';

// Analyze laboratory exams
export const analyzeExamResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, examResults, patientInfo, query } = req.body;

    if (!planId || !examResults) {
      res.status(400).json({
        status: 'error',
        message: 'Plan ID and exam results are required'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid plan ID format'
      });
      return;
    }

    // Check if plan exists and user has access
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plan not found'
      });
      return;
    }

    // Ensure user is the creator of the plan
    const userId = req.user._id.toString();
    const planCreator = plan.creator.toString();

    if (userId !== planCreator) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this plan'
      });
      return;
    }

    // Create an exam analysis agent
    const examAgent = createAgent(
      'exam_analysis',
      userId, 
      req.user.company, 
      planId,
      true // Use summary memory
    );
    
    // Try to load existing context for continuity
    await examAgent.loadContext();
    
    // Call the agent to analyze the exam results
    const analysis = await (examAgent as ExamAnalysisAgent).analyzeExams(
      examResults,
      patientInfo || '',
      query
    );

    res.status(200).json({
      status: 'success',
      data: {
        analysis
      }
    });
  } catch (error) {
    console.error('Error analyzing exam results:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while analyzing exam results'
    });
  }
};

// Analyze Traditional Chinese Medicine observations
export const analyzeTCM = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, tcmObservations, patientInfo, query } = req.body;

    if (!planId || !tcmObservations) {
      res.status(400).json({
        status: 'error',
        message: 'Plan ID and TCM observations are required'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid plan ID format'
      });
      return;
    }

    // Check if plan exists and user has access
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plan not found'
      });
      return;
    }

    // Ensure user is the creator of the plan
    const userId = req.user._id.toString();
    const planCreator = plan.creator.toString();

    if (userId !== planCreator) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this plan'
      });
      return;
    }

    // Create a TCM analysis agent
    const tcmAgent = createAgent(
      'tcm_analysis',
      userId, 
      req.user.company, 
      planId,
      true // Use summary memory
    );
    
    // Try to load existing context for continuity
    await tcmAgent.loadContext();
    
    // Call the agent to analyze TCM observations
    const analysis = await (tcmAgent as TCMAgent).analyzeTCMObservations(
      tcmObservations,
      patientInfo || '',
      query
    );

    res.status(200).json({
      status: 'success',
      data: {
        analysis
      }
    });
  } catch (error) {
    console.error('Error analyzing TCM observations:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while analyzing TCM observations'
    });
  }
};

// Analyze using IFM Matrix
export const analyzeIFM = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, patientInfo, labResults, timeline, query } = req.body;

    if (!planId || !patientInfo) {
      res.status(400).json({
        status: 'error',
        message: 'Plan ID and patient information are required'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid plan ID format'
      });
      return;
    }

    // Check if plan exists and user has access
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plan not found'
      });
      return;
    }

    // Ensure user is the creator of the plan
    const userId = req.user._id.toString();
    const planCreator = plan.creator.toString();

    if (userId !== planCreator) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this plan'
      });
      return;
    }

    // Create an IFM analysis agent
    const ifmAgent = createAgent(
      'ifm_analysis',
      userId, 
      req.user.company, 
      planId,
      true // Use summary memory
    );
    
    // Try to load existing context for continuity
    await ifmAgent.loadContext();
    
    // Call the agent to analyze IFM Matrix
    const analysis = await (ifmAgent as IFMAgent).analyzeIFMMatrix(
      patientInfo,
      labResults || '',
      timeline || '',
      query
    );

    res.status(200).json({
      status: 'success',
      data: {
        analysis
      }
    });
  } catch (error) {
    console.error('Error analyzing IFM Matrix:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while analyzing using IFM Matrix'
    });
  }
};

// Generate final plan
export const createFinalPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, patientInfo, analysisSummary, professionalType, specialInstructions } = req.body;

    if (!planId || !patientInfo || !analysisSummary || !professionalType) {
      res.status(400).json({
        status: 'error',
        message: 'Plan ID, patient information, analysis summary, and professional type are required'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid plan ID format'
      });
      return;
    }

    // Check if plan exists and user has access
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plan not found'
      });
      return;
    }

    // Ensure user is the creator of the plan
    const userId = req.user._id.toString();
    const planCreator = plan.creator.toString();

    if (userId !== planCreator) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this plan'
      });
      return;
    }

    // Create a plan generation agent
    const planAgent = createAgent(
      'plan_generation',
      userId, 
      req.user.company, 
      planId,
      true // Use summary memory
    );
    
    // Try to load existing context for continuity
    await planAgent.loadContext();
    
    // Call the agent to generate the final plan
    const generatedPlan = await (planAgent as PlanGenerationAgent).generatePlan(
      patientInfo,
      analysisSummary,
      professionalType,
      specialInstructions
    );

    // Update the plan with the generated content
    if (!plan.planContent) {
      plan.planContent = {};
    }
    
    // Store the generated plan in the case summary field
    plan.planContent.caseSummary = generatedPlan;
    
    // Change status to completed
    plan.status = PlanStatus.COMPLETED;
    await plan.save();

    res.status(200).json({
      status: 'success',
      data: {
        plan: generatedPlan
      }
    });
  } catch (error) {
    console.error('Error generating final plan:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while generating the final plan'
    });
  }
};

// Refine existing plan with feedback
export const refinePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, existingPlanContent, feedback } = req.body;

    if (!planId || !existingPlanContent || !feedback) {
      res.status(400).json({
        status: 'error',
        message: 'Plan ID, existing plan content, and feedback are required'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid plan ID format'
      });
      return;
    }

    // Check if plan exists and user has access
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plan not found'
      });
      return;
    }

    // Ensure user is the creator of the plan
    const userId = req.user._id.toString();
    const planCreator = plan.creator.toString();

    if (userId !== planCreator) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this plan'
      });
      return;
    }

    // Create a plan generation agent
    const planAgent = createAgent(
      'plan_generation',
      userId, 
      req.user.company, 
      planId,
      true // Use summary memory
    );
    
    // Try to load existing context for continuity
    await planAgent.loadContext();
    
    // Call the agent to refine the existing plan
    const refinedPlan = await (planAgent as PlanGenerationAgent).refinePlan(
      existingPlanContent,
      feedback
    );

    // Update the plan with the refined content
    if (!plan.planContent) {
      plan.planContent = {};
    }
    
    // Store the refined plan in the case summary field
    plan.planContent.caseSummary = refinedPlan;
    
    // Save the updated plan
    await plan.save();

    res.status(200).json({
      status: 'success',
      data: {
        plan: refinedPlan
      }
    });
  } catch (error) {
    console.error('Error refining plan:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while refining the plan'
    });
  }
};

// Get agent context
export const getAgentContext = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, agentType } = req.params;

    if (!planId || !agentType) {
      res.status(400).json({
        status: 'error',
        message: 'Plan ID and agent type are required'
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid plan ID format'
      });
      return;
    }

    // Check if plan exists and user has access
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plan not found'
      });
      return;
    }

    // Ensure user is the creator of the plan
    const userId = req.user._id.toString();
    const planCreator = plan.creator.toString();

    if (userId !== planCreator) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this plan'
      });
      return;
    }

    // Find the agent context
    const context = await AgentContext.findOne({
      plan: planId,
      agent: agentType
    });

    if (!context) {
      res.status(404).json({
        status: 'error',
        message: 'Agent context not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        context: context.context,
        lastUpdated: context.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error fetching agent context:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching agent context'
    });
  }
};
