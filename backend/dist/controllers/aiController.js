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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentContext = exports.refinePlan = exports.createFinalPlan = exports.analyzeIFM = exports.analyzeTCM = exports.analyzeExamResults = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const aiAgentService_1 = require("../services/aiAgentService");
const AgentContext_1 = __importDefault(require("../models/AgentContext"));
const Plan_1 = __importStar(require("../models/Plan"));
// Analyze laboratory exams
const analyzeExamResults = async (req, res) => {
    try {
        const { planId, examResults, patientInfo, query } = req.body;
        if (!planId || !examResults) {
            res.status(400).json({
                status: 'error',
                message: 'Plan ID and exam results are required'
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid plan ID format'
            });
            return;
        }
        // Check if plan exists and user has access
        const plan = await Plan_1.default.findById(planId);
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
        const examAgent = (0, aiAgentService_1.createAgent)('exam_analysis', userId, req.user.company, planId, true // Use summary memory
        );
        // Try to load existing context for continuity
        await examAgent.loadContext();
        // Call the agent to analyze the exam results
        const analysis = await examAgent.analyzeExams(examResults, patientInfo || '', query);
        res.status(200).json({
            status: 'success',
            data: {
                analysis
            }
        });
    }
    catch (error) {
        console.error('Error analyzing exam results:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while analyzing exam results'
        });
    }
};
exports.analyzeExamResults = analyzeExamResults;
// Analyze Traditional Chinese Medicine observations
const analyzeTCM = async (req, res) => {
    try {
        const { planId, tcmObservations, patientInfo, query } = req.body;
        if (!planId || !tcmObservations) {
            res.status(400).json({
                status: 'error',
                message: 'Plan ID and TCM observations are required'
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid plan ID format'
            });
            return;
        }
        // Check if plan exists and user has access
        const plan = await Plan_1.default.findById(planId);
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
        const tcmAgent = (0, aiAgentService_1.createAgent)('tcm_analysis', userId, req.user.company, planId, true // Use summary memory
        );
        // Try to load existing context for continuity
        await tcmAgent.loadContext();
        // Call the agent to analyze TCM observations
        const analysis = await tcmAgent.analyzeTCMObservations(tcmObservations, patientInfo || '', query);
        res.status(200).json({
            status: 'success',
            data: {
                analysis
            }
        });
    }
    catch (error) {
        console.error('Error analyzing TCM observations:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while analyzing TCM observations'
        });
    }
};
exports.analyzeTCM = analyzeTCM;
// Analyze using IFM Matrix
const analyzeIFM = async (req, res) => {
    try {
        const { planId, patientInfo, labResults, timeline, query } = req.body;
        if (!planId || !patientInfo) {
            res.status(400).json({
                status: 'error',
                message: 'Plan ID and patient information are required'
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid plan ID format'
            });
            return;
        }
        // Check if plan exists and user has access
        const plan = await Plan_1.default.findById(planId);
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
        const ifmAgent = (0, aiAgentService_1.createAgent)('ifm_analysis', userId, req.user.company, planId, true // Use summary memory
        );
        // Try to load existing context for continuity
        await ifmAgent.loadContext();
        // Call the agent to analyze IFM Matrix
        const analysis = await ifmAgent.analyzeIFMMatrix(patientInfo, labResults || '', timeline || '', query);
        res.status(200).json({
            status: 'success',
            data: {
                analysis
            }
        });
    }
    catch (error) {
        console.error('Error analyzing IFM Matrix:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while analyzing using IFM Matrix'
        });
    }
};
exports.analyzeIFM = analyzeIFM;
// Generate final plan
const createFinalPlan = async (req, res) => {
    try {
        const { planId, patientInfo, analysisSummary, professionalType, specialInstructions } = req.body;
        if (!planId || !patientInfo || !analysisSummary || !professionalType) {
            res.status(400).json({
                status: 'error',
                message: 'Plan ID, patient information, analysis summary, and professional type are required'
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid plan ID format'
            });
            return;
        }
        // Check if plan exists and user has access
        const plan = await Plan_1.default.findById(planId);
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
        const planAgent = (0, aiAgentService_1.createAgent)('plan_generation', userId, req.user.company, planId, true // Use summary memory
        );
        // Try to load existing context for continuity
        await planAgent.loadContext();
        // Call the agent to generate the final plan
        const generatedPlan = await planAgent.generatePlan(patientInfo, analysisSummary, professionalType, specialInstructions);
        // Update the plan with the generated content
        if (!plan.planContent) {
            plan.planContent = {};
        }
        // Store the generated plan in the case summary field
        plan.planContent.caseSummary = generatedPlan;
        // Change status to completed
        plan.status = Plan_1.PlanStatus.COMPLETED;
        await plan.save();
        res.status(200).json({
            status: 'success',
            data: {
                plan: generatedPlan
            }
        });
    }
    catch (error) {
        console.error('Error generating final plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while generating the final plan'
        });
    }
};
exports.createFinalPlan = createFinalPlan;
// Refine existing plan with feedback
const refinePlan = async (req, res) => {
    try {
        const { planId, existingPlanContent, feedback } = req.body;
        if (!planId || !existingPlanContent || !feedback) {
            res.status(400).json({
                status: 'error',
                message: 'Plan ID, existing plan content, and feedback are required'
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid plan ID format'
            });
            return;
        }
        // Check if plan exists and user has access
        const plan = await Plan_1.default.findById(planId);
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
        const planAgent = (0, aiAgentService_1.createAgent)('plan_generation', userId, req.user.company, planId, true // Use summary memory
        );
        // Try to load existing context for continuity
        await planAgent.loadContext();
        // Call the agent to refine the existing plan
        const refinedPlan = await planAgent.refinePlan(existingPlanContent, feedback);
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
    }
    catch (error) {
        console.error('Error refining plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while refining the plan'
        });
    }
};
exports.refinePlan = refinePlan;
// Get agent context
const getAgentContext = async (req, res) => {
    try {
        const { planId, agentType } = req.params;
        if (!planId || !agentType) {
            res.status(400).json({
                status: 'error',
                message: 'Plan ID and agent type are required'
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid plan ID format'
            });
            return;
        }
        // Check if plan exists and user has access
        const plan = await Plan_1.default.findById(planId);
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
        const context = await AgentContext_1.default.findOne({
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
    }
    catch (error) {
        console.error('Error fetching agent context:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching agent context'
        });
    }
};
exports.getAgentContext = getAgentContext;
