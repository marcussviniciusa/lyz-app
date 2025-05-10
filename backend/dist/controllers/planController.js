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
exports.viewSharedPlan = exports.generateSharingLink = exports.archivePlan = exports.deletePlan = exports.updatePlan = exports.createPlan = exports.getPlanById = exports.getAllPlans = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Plan_1 = __importStar(require("../models/Plan"));
const uuid_1 = require("uuid");
const planVersionController_1 = require("./planVersionController");
// Get all plans with pagination and filtering
const getAllPlans = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const patientName = req.query.patientName;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        // Determine user and company ID from authenticated user
        const userId = req.user._id;
        const companyId = req.user.company;
        const userRole = req.user.role;
        const skip = (page - 1) * limit;
        // Build query
        const query = {};
        // Filter by company for all users, and by creator for regular users
        query.company = companyId;
        if (userRole !== 'superadmin') {
            query.creator = userId;
        }
        // Apply filters
        if (status && Object.values(Plan_1.PlanStatus).includes(status)) {
            query.status = status;
        }
        if (patientName) {
            query['patientData.fullName'] = { $regex: patientName, $options: 'i' };
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        // Execute query with pagination
        const plans = await Plan_1.default.find(query)
            .populate('creator', 'name email')
            .populate('company', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        // Get total count for pagination
        const total = await Plan_1.default.countDocuments(query);
        res.status(200).json({
            status: 'success',
            results: plans.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            },
            data: {
                plans
            }
        });
    }
    catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching plans'
        });
    }
};
exports.getAllPlans = getAllPlans;
// Get a single plan by ID
const getPlanById = async (req, res) => {
    try {
        const planId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid plan ID format'
            });
            return;
        }
        const plan = await Plan_1.default.findById(planId)
            .populate('creator', 'name email')
            .populate('company', 'name');
        if (!plan) {
            res.status(404).json({
                status: 'error',
                message: 'Plan not found'
            });
            return;
        }
        // Ensure user has access to this plan (either creator or same company + superadmin)
        const userId = req.user._id.toString();
        const userCompany = req.user.company.toString();
        const userRole = req.user.role;
        const planCreator = plan.creator._id.toString();
        const planCompany = plan.company._id.toString();
        if (userId !== planCreator && (userRole !== 'superadmin' || userCompany !== planCompany)) {
            res.status(403).json({
                status: 'error',
                message: 'You do not have permission to access this plan'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                plan
            }
        });
    }
    catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching plan details'
        });
    }
};
exports.getPlanById = getPlanById;
// Create a new plan
const createPlan = async (req, res) => {
    try {
        const { professionType, patientData } = req.body;
        // Validate basic required fields
        if (!professionType || !patientData) {
            res.status(400).json({
                status: 'error',
                message: 'Profession type and patient data are required'
            });
            return;
        }
        // Validate patient data
        if (!patientData.fullName || !patientData.birthDate || !patientData.profession || !patientData.mainReason) {
            res.status(400).json({
                status: 'error',
                message: 'Patient data must include fullName, birthDate, profession, and mainReason'
            });
            return;
        }
        // Create new plan
        const newPlan = new Plan_1.default({
            creator: req.user._id,
            company: req.user.company,
            professionType,
            status: Plan_1.PlanStatus.DRAFT,
            patientData
        });
        await newPlan.save();
        res.status(201).json({
            status: 'success',
            message: 'Plan created successfully',
            data: {
                plan: newPlan
            }
        });
    }
    catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while creating the plan'
        });
    }
};
exports.createPlan = createPlan;
// Update plan - This handles all update types: basic info, questionnaire, exams, etc.
const updatePlan = async (req, res) => {
    try {
        const planId = req.params.id;
        const updateData = req.body;
        const { changeDescription, changedSections } = updateData;
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid plan ID format'
            });
            return;
        }
        // Find the plan
        const plan = await Plan_1.default.findById(planId);
        if (!plan) {
            res.status(404).json({
                status: 'error',
                message: 'Plan not found'
            });
            return;
        }
        // Ensure user has permission to update this plan
        const userId = req.user._id.toString();
        const userCompanyId = req.user.company.toString();
        const planCreator = plan.creator.toString();
        if (userId !== planCreator) {
            res.status(403).json({
                status: 'error',
                message: 'You do not have permission to update this plan'
            });
            return;
        }
        // Check if plan is archived
        if (plan.status === Plan_1.PlanStatus.ARCHIVED) {
            res.status(400).json({
                status: 'error',
                message: 'Cannot update an archived plan'
            });
            return;
        }
        // Antes de atualizar, criar uma versão do estado atual do plano
        // Criar um snapshot dos dados atuais
        const planSnapshot = plan.toObject();
        // Remover campos que não queremos no snapshot
        const { _id, __v, updatedAt, ...cleanSnapshot } = planSnapshot;
        // Determinar descrição da mudança
        const versionDescription = changeDescription || 'Atualização do plano';
        // Determinar seções alteradas
        const sectionsChanged = changedSections || [];
        // Criar nova versão do plano
        await (0, planVersionController_1.createPlanVersion)(planId, userId, userCompanyId, cleanSnapshot, versionDescription, sectionsChanged);
        // Update plan fields based on updateData
        // We're selective about what can be updated
        const allowedFields = [
            'patientData',
            'menstrualHistory',
            'gestationalHistory',
            'healthHistory',
            'familyHistory',
            'lifestyleHabits',
            'exams',
            'tcmObservations',
            'timeline',
            'ifmMatrix',
            'planContent',
            'status'
        ];
        // Remover campos de metadados que não devem ser atualizados diretamente no plano
        const dataToUpdate = { ...updateData };
        delete dataToUpdate.changeDescription;
        delete dataToUpdate.changedSections;
        // Update the plan with the filtered data
        for (const field of allowedFields) {
            if (field in dataToUpdate) {
                switch (field) {
                    case 'exams':
                        if (Array.isArray(dataToUpdate.exams)) {
                            plan.exams = dataToUpdate.exams;
                        }
                        break;
                    case 'timeline':
                        if (Array.isArray(dataToUpdate.timeline)) {
                            plan.timeline = dataToUpdate.timeline;
                        }
                        break;
                    case 'patientData':
                        plan.patientData = { ...plan.patientData, ...dataToUpdate.patientData };
                        break;
                    case 'menstrualHistory':
                        plan.menstrualHistory = { ...plan.menstrualHistory, ...dataToUpdate.menstrualHistory };
                        break;
                    case 'gestationalHistory':
                        plan.gestationalHistory = { ...plan.gestationalHistory, ...dataToUpdate.gestationalHistory };
                        break;
                    case 'healthHistory':
                        plan.healthHistory = { ...plan.healthHistory, ...dataToUpdate.healthHistory };
                        break;
                    case 'familyHistory':
                        plan.familyHistory = { ...plan.familyHistory, ...dataToUpdate.familyHistory };
                        break;
                    case 'lifestyleHabits':
                        plan.lifestyleHabits = { ...plan.lifestyleHabits, ...dataToUpdate.lifestyleHabits };
                        break;
                    case 'tcmObservations':
                        plan.tcmObservations = { ...plan.tcmObservations, ...dataToUpdate.tcmObservations };
                        break;
                    case 'ifmMatrix':
                        plan.ifmMatrix = { ...plan.ifmMatrix, ...dataToUpdate.ifmMatrix };
                        break;
                    case 'planContent':
                        plan.planContent = { ...plan.planContent, ...dataToUpdate.planContent };
                        break;
                    case 'status':
                        if (Object.values(Plan_1.PlanStatus).includes(dataToUpdate.status)) {
                            plan.status = dataToUpdate.status;
                        }
                        break;
                }
            }
        }
        // If status is being updated to COMPLETED, set the completion date
        if (dataToUpdate.status === Plan_1.PlanStatus.COMPLETED) {
            // Adicionamos temporariamente a propriedade ao plano
            plan.completedAt = new Date();
        }
        await plan.save();
        res.status(200).json({
            status: 'success',
            message: 'Plan updated successfully',
            data: {
                plan
            }
        });
    }
    catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating the plan'
        });
    }
};
exports.updatePlan = updatePlan;
// Delete a plan
const deletePlan = async (req, res) => {
    try {
        const planId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid plan ID format'
            });
            return;
        }
        // Find the plan
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
                message: 'You do not have permission to delete this plan'
            });
            return;
        }
        // Perform the deletion
        await Plan_1.default.findByIdAndDelete(planId);
        res.status(200).json({
            status: 'success',
            message: 'Plan deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting the plan'
        });
    }
};
exports.deletePlan = deletePlan;
// Archive a plan (change status to ARCHIVED)
const archivePlan = async (req, res) => {
    try {
        const planId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid plan ID format'
            });
            return;
        }
        // Find the plan
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
                message: 'You do not have permission to archive this plan'
            });
            return;
        }
        // Update status to ARCHIVED
        plan.status = Plan_1.PlanStatus.ARCHIVED;
        await plan.save();
        res.status(200).json({
            status: 'success',
            message: 'Plan archived successfully',
            data: {
                plan
            }
        });
    }
    catch (error) {
        console.error('Error archiving plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while archiving the plan'
        });
    }
};
exports.archivePlan = archivePlan;
// Generate and update sharing link
const generateSharingLink = async (req, res) => {
    try {
        const planId = req.params.id;
        const { expiresInDays } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid plan ID format'
            });
            return;
        }
        // Find the plan
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
                message: 'You do not have permission to share this plan'
            });
            return;
        }
        // Generate a unique sharing link
        const sharingToken = (0, uuid_1.v4)();
        plan.sharedLink = sharingToken;
        // Set expiry date if provided
        if (expiresInDays) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + expiresInDays);
            plan.sharedLinkExpiry = expiryDate;
        }
        else {
            // Default expiry of 30 days
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            plan.sharedLinkExpiry = expiryDate;
        }
        await plan.save();
        res.status(200).json({
            status: 'success',
            message: 'Sharing link generated successfully',
            data: {
                sharingLink: `${process.env.FRONTEND_URL}/shared-plan/${sharingToken}`,
                expiryDate: plan.sharedLinkExpiry
            }
        });
    }
    catch (error) {
        console.error('Error generating sharing link:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while generating the sharing link'
        });
    }
};
exports.generateSharingLink = generateSharingLink;
// View a shared plan (public route, no authentication needed)
const viewSharedPlan = async (req, res) => {
    try {
        const sharingToken = req.params.token;
        if (!sharingToken) {
            res.status(400).json({
                status: 'error',
                message: 'Sharing token is required'
            });
            return;
        }
        // Find the plan by sharing token
        const plan = await Plan_1.default.findOne({
            sharedLink: sharingToken,
            sharedLinkExpiry: { $gt: new Date() } // Ensure link hasn't expired
        });
        if (!plan) {
            res.status(404).json({
                status: 'error',
                message: 'Shared plan not found or link has expired'
            });
            return;
        }
        // Increment view count
        plan.viewCount = (plan.viewCount || 0) + 1;
        await plan.save();
        // Return the plan data (might want to limit what fields are returned for shared views)
        res.status(200).json({
            status: 'success',
            data: {
                plan: {
                    patientData: {
                        fullName: plan.patientData.fullName,
                        // Include only necessary patient data fields
                    },
                    planContent: plan.planContent,
                    // Include any other fields needed for shared view
                }
            }
        });
    }
    catch (error) {
        console.error('Error viewing shared plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while retrieving the shared plan'
        });
    }
};
exports.viewSharedPlan = viewSharedPlan;
