import mongoose, { Document } from 'mongoose';
export declare enum PlanStatus {
    DRAFT = "draft",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    ARCHIVED = "archived"
}
export declare enum ProfessionType {
    MEDICAL = "medical_nutritionist",
    OTHER = "other_professional"
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
declare const _default: mongoose.Model<IPlan, {}, {}, {}, mongoose.Document<unknown, {}, IPlan, {}> & IPlan & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
