export enum UserRole {
  SUPERADMIN = 'superadmin',
  USER = 'user'
}

export enum PlanStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum ProfessionType {
  MEDICAL = 'medical_nutritionist',
  OTHER = 'other_professional'
}

export enum PromptType {
  EXAM_ANALYSIS = 'exam_analysis',
  TCM_ANALYSIS = 'tcm_analysis',
  IFM_MATRIX = 'ifm_matrix',
  PLAN_GENERATION = 'plan_generation'
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  company: Company | string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  _id: string;
  name: string;
  usageLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientData {
  fullName: string;
  birthDate: Date;
  profession: string;
  mainReason: string;
  initialObservations?: string;
}

export interface MenstrualHistory {
  symptoms: string[];
  notes?: string;
}

export interface GestationalHistory {
  details: string;
}

export interface HealthHistory {
  details: string;
}

export interface FamilyHistory {
  details: string;
}

export interface LifestyleHabits {
  details: string;
}

export interface Exam {
  name: string;
  date: Date;
  results: Record<string, any>;
  observations?: string;
  fileIds?: string[];
}

export interface TCMObservation {
  facial: {
    faceColor?: string;
    skinGlow?: string;
    spots?: string;
    eyeCharacteristics?: string;
    lipsAndMouth?: string;
  };
  tongue: {
    bodyColor?: string;
    coatingThickness?: string;
    coatingColor?: string;
    shape?: string;
    marksOrCracks?: string;
    moistureLevel?: string;
  };
  pulse: {
    quality?: string;
    strength?: string;
    rhythm?: string;
    positions?: Record<string, string>;
  };
  energetic: {
    deficiencyExcess?: string;
    elementImbalances?: string;
    otherSigns?: string;
  };
}

export interface TimelineEvent {
  date: Date;
  type: string;
  description: string;
  duration?: string;
  impact?: number;
  menstrualRelation?: string;
}

export interface IFMSystem {
  assimilation?: {
    antecedents?: string;
    triggers?: string;
    mediators?: string;
  };
  defense?: {
    antecedents?: string;
    triggers?: string;
    mediators?: string;
  };
  energy?: {
    antecedents?: string;
    triggers?: string;
    mediators?: string;
  };
  biotransformation?: {
    antecedents?: string;
    triggers?: string;
    mediators?: string;
  };
  transport?: {
    antecedents?: string;
    triggers?: string;
    mediators?: string;
  };
  communication?: {
    antecedents?: string;
    triggers?: string;
    mediators?: string;
  };
  structure?: {
    antecedents?: string;
    triggers?: string;
    mediators?: string;
  };
}

export interface PlanContent {
  caseSummary?: string;
  symptomCorrelations?: string;
  generalNutritionalPlan?: string;
  cyclicalNutritionalPlan?: {
    follicular?: string;
    ovulatory?: string;
    luteal?: string;
    menstrual?: string;
  };
  recommendedSupplements?: string;
  additionalExams?: string;
  lifestyleGuidelines?: string;
  followUpSchedule?: string;
}

export interface Plan {
  _id: string;
  creator: User | string;
  company: Company | string;
  professionType: ProfessionType;
  status: PlanStatus;
  patientData: PatientData;
  menstrualHistory?: MenstrualHistory;
  gestationalHistory?: GestationalHistory;
  healthHistory?: HealthHistory;
  familyHistory?: FamilyHistory;
  lifestyleHabits?: LifestyleHabits;
  exams?: Exam[];
  tcmObservations?: TCMObservation;
  timeline?: TimelineEvent[];
  ifmMatrix?: IFMSystem;
  planContent?: PlanContent;
  sharedLink?: string;
  sharedLinkExpiry?: Date;
  viewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prompt {
  _id: string;
  type: PromptType;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileMetadata {
  fileId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  category: string;
  planId?: string;
  examId?: string;
  uploadDate: Date;
}

export interface TokenUsage {
  _id: string;
  user: User | string;
  company: Company | string;
  plan?: Plan | string;
  type: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  status: string;
  results: number;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
  data: {
    [key: string]: T[];
  };
}

export interface ApiError {
  status: string;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  company: string;
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    token: string;
  };
}

export interface SharedPlanResponse {
  status: string;
  data: {
    plan: Partial<Plan>;
  };
}

export interface FileUploadResponse {
  status: string;
  data: FileMetadata;
}

export interface AIAnalysisResponse {
  status: string;
  data: {
    analysis: string;
  };
}

export interface GenerateSharingLinkResponse {
  status: string;
  message: string;
  data: {
    sharingLink: string;
    expiryDate: Date;
  };
}
