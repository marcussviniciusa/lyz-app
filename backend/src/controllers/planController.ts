import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Plan, { PlanStatus, ProfessionType, IPlan } from '../models/Plan';
import { v4 as uuidv4 } from 'uuid';
import { createPlanVersion } from './planVersionController';
import { getUserId, getUserCompany } from '../utils/requestTypes';

// Get all plans with pagination and filtering
export const getAllPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const patientName = req.query.patientName as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Determine user and company ID from authenticated user
    const userId = getUserId(req);
    const companyId = getUserCompany(req);
    const userRole = req.user.role;

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by company for all users, and by creator for regular users
    query.company = companyId;
    if (userRole !== 'superadmin') {
      query.creator = userId;
    }

    // Apply filters
    if (status && Object.values(PlanStatus).includes(status as PlanStatus)) {
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
    const plans = await Plan.find(query)
      .populate('creator', 'name email')
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Plan.countDocuments(query);

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
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching plans'
    });
  }
};

// Get a single plan by ID
export const getPlanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const planId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid plan ID format'
      });
      return;
    }

    const plan = await Plan.findById(planId)
      .populate('creator', 'name email')
      .populate('company', 'name');

    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plan not found'
      });
      return;
    }

    // Check if user has permission to access this plan
    try {
      const userId = getUserId(req);
      const userCompany = getUserCompany(req);
      const userRole = req.user?.role;
      
      // Tratando casos onde creator ou company podem ser null ou undefined
      const planCreator = plan.creator?._id?.toString() || '';
      const planCompany = plan.company?._id?.toString() || '';
      
      // Verificação mais robusta de permissões
      const isSuperAdmin = userRole === 'superadmin';
      const isCreator = userId === planCreator;
      const isSameCompany = userCompany === planCompany;
      
      if (!isCreator && !isSameCompany && !isSuperAdmin) {
        console.log(`Access denied: User ${userId} from company ${userCompany} tried to access plan ${planId} created by ${planCreator} from company ${planCompany}`);
        res.status(403).json({
          status: 'error',
          message: 'You do not have permission to access this plan'
        });
        return;
      }
    } catch (permissionError) {
      console.error('Error checking permissions:', permissionError);
      res.status(500).json({
        status: 'error',
        message: 'Failed to validate permissions'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching plan details'
    });
  }
};

// Create a new plan
export const createPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Create Plan Request Body:', JSON.stringify(req.body));
    console.log('User information:', req.user ? `ID: ${getUserId(req)}, Company: ${getUserCompany(req)}` : 'No user data');
    
    // Compatibilidade com o novo formato enviado pelo frontend
    const { 
      professionalType, patientName, patientBirthdate, patientEmail, patientPhone, 
      initialObservations, profession, mainReason, 
      professionType, patientData 
    } = req.body;

    // Verifica se os dados estão no formato novo ou antigo
    let finalProfessionType = professionType;
    let finalPatientData;

    // Se os dados estiverem no novo formato (campos separados)
    if (professionalType && patientName) {
      console.log('Using new data format from frontend');
      
      // Mapeia o tipo profissional para o enum correto
      if (professionalType === 'nutritionist') {
        finalProfessionType = ProfessionType.MEDICAL;
      } else {
        finalProfessionType = ProfessionType.OTHER;
      }
      
      // Valida e converte a data de nascimento
      let birthDate = null;
      if (patientBirthdate) {
        try {
          birthDate = new Date(patientBirthdate);
          // Verifica se a data é válida
          if (isNaN(birthDate.getTime())) {
            console.warn(`Invalid birthdate received: ${patientBirthdate}`); 
            birthDate = null;
          }
        } catch (e) {
          console.warn(`Error converting birthdate: ${patientBirthdate}`, e);
          birthDate = null;
        }
      }

      // Constrói o objeto patientData a partir dos campos individuais
      finalPatientData = {
        fullName: patientName,
        birthDate: birthDate,
        profession: profession || (patientEmail && patientEmail.trim() !== '' ? patientEmail : 'Não informado'),
        mainReason: mainReason || (patientPhone && patientPhone.trim() !== '' ? patientPhone : 'Análise inicial'),
        initialObservations: initialObservations || ''
      };
    } else {
      // Formato original (campos aninhados)
      console.log('Using original data format');
      finalPatientData = patientData;
    }

    // Validate basic required fields
    if (!finalProfessionType || !finalPatientData) {
      console.log('Validation failed: Missing professionType or patientData');
      res.status(400).json({
        status: 'error',
        message: 'Profession type and patient data are required'
      });
      return;
    }

    // Validate patient data
    if (!finalPatientData.fullName) {
      console.log('Validation failed: Missing required patientData fields');
      res.status(400).json({
        status: 'error',
        message: 'Patient name is required'
      });
      return;
    }

    // Create new plan
    console.log('Creating new plan with values:', {
      professionType: finalProfessionType,
      patientData: {
        fullName: finalPatientData.fullName,
        birthDate: finalPatientData.birthDate,
        profession: finalPatientData.profession,
        mainReason: finalPatientData.mainReason,
        initialObservations: finalPatientData.initialObservations
      }
    });
    
    const newPlan = new Plan({
      creator: getUserId(req),
      company: getUserCompany(req),
      professionType: finalProfessionType,
      status: PlanStatus.DRAFT,
      patientData: finalPatientData
    });

    await newPlan.save();

    res.status(201).json({
      status: 'success',
      message: 'Plan created successfully',
      data: {
        plan: newPlan
      }
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    
    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    if (error instanceof mongoose.Error.ValidationError) {
      console.error('Mongoose validation error:', error.errors);
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {} as Record<string, string>)
      });
      return;
    }
    
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating the plan'
    });
  }
};

// Update plan - This handles all update types: basic info, questionnaire, exams, etc.
export const updatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const planId = req.params.id;
    const updateData = req.body;
    const { changeDescription, changedSections } = updateData;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid plan ID format'
      });
      return;
    }

    // Find the plan
    const plan = await Plan.findById(planId);

    if (!plan) {
      res.status(404).json({
        status: 'error',
        message: 'Plan not found'
      });
      return;
    }

    // Ensure user has permission to update this plan
    const userId = getUserId(req);
    const userCompany = getUserCompany(req);
    const userRole = req.user.role;
    const planCreator = plan.creator.toString();

    if (userId !== planCreator) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this plan'
      });
      return;
    }

    // Check if plan is archived
    if (plan.status === PlanStatus.ARCHIVED) {
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
    await createPlanVersion(
      planId,
      userId,
      userCompany,
      cleanSnapshot,
      versionDescription,
      sectionsChanged
    );

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
            if (Object.values(PlanStatus).includes(dataToUpdate.status as PlanStatus)) {
              plan.status = dataToUpdate.status as PlanStatus;
            }
            break;
        }
      }
    }

    // If status is being updated to COMPLETED, set the completion date
    if (dataToUpdate.status === PlanStatus.COMPLETED) {
      // Adicionamos temporariamente a propriedade ao plano
      (plan as any).completedAt = new Date();
    }

    await plan.save();

    res.status(200).json({
      status: 'success',
      message: 'Plan updated successfully',
      data: {
        plan
      }
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the plan'
    });
  }
};

// Delete a plan
export const deletePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const planId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid plan ID format'
      });
      return;
    }

    // Find the plan
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
        message: 'You do not have permission to delete this plan'
      });
      return;
    }

    // Perform the deletion
    await Plan.findByIdAndDelete(planId);

    res.status(200).json({
      status: 'success',
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting the plan'
    });
  }
};

// Archive a plan (change status to ARCHIVED)
export const archivePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const planId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid plan ID format'
      });
      return;
    }

    // Find the plan
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
        message: 'You do not have permission to archive this plan'
      });
      return;
    }

    // Update status to ARCHIVED
    plan.status = PlanStatus.ARCHIVED;
    await plan.save();

    res.status(200).json({
      status: 'success',
      message: 'Plan archived successfully',
      data: {
        plan
      }
    });
  } catch (error) {
    console.error('Error archiving plan:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while archiving the plan'
    });
  }
};

// Generate and update sharing link
export const generateSharingLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const planId = req.params.id;
    const { expiresInDays } = req.body;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid plan ID format'
      });
      return;
    }

    // Find the plan
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
        message: 'You do not have permission to share this plan'
      });
      return;
    }

    // Generate a unique sharing link
    const sharingToken = uuidv4();
    plan.sharedLink = sharingToken;

    // Set expiry date if provided
    if (expiresInDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiresInDays);
      plan.sharedLinkExpiry = expiryDate;
    } else {
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
  } catch (error) {
    console.error('Error generating sharing link:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while generating the sharing link'
    });
  }
};

// View a shared plan (public route, no authentication needed)
export const viewSharedPlan = async (req: Request, res: Response): Promise<void> => {
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
    const plan = await Plan.findOne({ 
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
  } catch (error) {
    console.error('Error viewing shared plan:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while retrieving the shared plan'
    });
  }
};
