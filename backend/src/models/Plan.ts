import mongoose, { Schema, Document } from 'mongoose';

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

export interface IPatientData {
  fullName: string;
  birthDate: Date;
  profession: string;
  mainReason: string;
  initialObservations?: string;
}

export interface IMenstrualHistory {
  symptoms: string[];
  notes?: string;
}

export interface IGestationalHistory {
  details: string;
}

export interface IHealthHistory {
  details: string;
}

export interface IFamilyHistory {
  details: string;
}

export interface ILifestyleHabits {
  details: string;
}

export interface IExam {
  name: string;
  date: Date;
  results: Record<string, any>;
  observations?: string;
  fileIds?: string[];
}

export interface ITCMObservation {
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

export interface ITimelineEvent {
  date: Date;
  type: string;
  description: string;
  duration?: string;
  impact?: number;
  menstrualRelation?: string;
}

export interface IIFMSystem {
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

export interface IPlanContent {
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

export interface IPlan extends Document {
  creator: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  professionType: ProfessionType;
  status: PlanStatus;
  patientData: IPatientData;
  menstrualHistory?: IMenstrualHistory;
  gestationalHistory?: IGestationalHistory;
  healthHistory?: IHealthHistory;
  familyHistory?: IFamilyHistory;
  lifestyleHabits?: ILifestyleHabits;
  exams?: IExam[];
  tcmObservations?: ITCMObservation;
  timeline?: ITimelineEvent[];
  ifmMatrix?: IIFMSystem;
  planContent?: IPlanContent;
  sharedLink?: string;
  sharedLinkExpiry?: Date;
  viewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema: Schema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    professionType: {
      type: String,
      enum: Object.values(ProfessionType),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(PlanStatus),
      default: PlanStatus.DRAFT
    },
    patientData: {
      fullName: { type: String, required: true },
      birthDate: { type: Date, required: true },
      profession: { type: String, required: true },
      mainReason: { type: String, required: true },
      initialObservations: { type: String }
    },
    menstrualHistory: {
      symptoms: { type: [String] },
      notes: { type: String }
    },
    gestationalHistory: {
      details: { type: String }
    },
    healthHistory: {
      details: { type: String }
    },
    familyHistory: {
      details: { type: String }
    },
    lifestyleHabits: {
      details: { type: String }
    },
    exams: [{
      name: { type: String, required: true },
      date: { type: Date, required: true },
      results: { type: Schema.Types.Mixed, required: true },
      observations: { type: String },
      fileIds: { type: [String] }
    }],
    tcmObservations: {
      facial: {
        faceColor: { type: String },
        skinGlow: { type: String },
        spots: { type: String },
        eyeCharacteristics: { type: String },
        lipsAndMouth: { type: String }
      },
      tongue: {
        bodyColor: { type: String },
        coatingThickness: { type: String },
        coatingColor: { type: String },
        shape: { type: String },
        marksOrCracks: { type: String },
        moistureLevel: { type: String }
      },
      pulse: {
        quality: { type: String },
        strength: { type: String },
        rhythm: { type: String },
        positions: { type: Schema.Types.Mixed }
      },
      energetic: {
        deficiencyExcess: { type: String },
        elementImbalances: { type: String },
        otherSigns: { type: String }
      }
    },
    timeline: [{
      date: { type: Date, required: true },
      type: { type: String, required: true },
      description: { type: String, required: true },
      duration: { type: String },
      impact: { type: Number, min: 1, max: 10 },
      menstrualRelation: { type: String }
    }],
    ifmMatrix: {
      assimilation: {
        antecedents: { type: String },
        triggers: { type: String },
        mediators: { type: String }
      },
      defense: {
        antecedents: { type: String },
        triggers: { type: String },
        mediators: { type: String }
      },
      energy: {
        antecedents: { type: String },
        triggers: { type: String },
        mediators: { type: String }
      },
      biotransformation: {
        antecedents: { type: String },
        triggers: { type: String },
        mediators: { type: String }
      },
      transport: {
        antecedents: { type: String },
        triggers: { type: String },
        mediators: { type: String }
      },
      communication: {
        antecedents: { type: String },
        triggers: { type: String },
        mediators: { type: String }
      },
      structure: {
        antecedents: { type: String },
        triggers: { type: String },
        mediators: { type: String }
      }
    },
    planContent: {
      caseSummary: { type: String },
      symptomCorrelations: { type: String },
      generalNutritionalPlan: { type: String },
      cyclicalNutritionalPlan: {
        follicular: { type: String },
        ovulatory: { type: String },
        luteal: { type: String },
        menstrual: { type: String }
      },
      recommendedSupplements: { type: String },
      additionalExams: { type: String },
      lifestyleGuidelines: { type: String },
      followUpSchedule: { type: String }
    },
    sharedLink: { type: String },
    sharedLinkExpiry: { type: Date },
    viewCount: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IPlan>('Plan', PlanSchema);
