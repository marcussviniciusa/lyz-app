import mongoose, { Schema, Document } from 'mongoose';

export enum UsageType {
  EXAM_ANALYSIS = 'exam_analysis',
  TCM_ANALYSIS = 'tcm_analysis',
  IFM_MATRIX = 'ifm_matrix',
  PLAN_GENERATION = 'plan_generation',
  PLAN_REFINEMENT = 'plan_refinement',
  OTHER = 'other'
}

export interface ITokenUsage extends Document {
  user: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  plan?: mongoose.Types.ObjectId;
  type: UsageType;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  createdAt: Date;
}

const TokenUsageSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan'
    },
    type: {
      type: String,
      enum: Object.values(UsageType),
      required: true
    },
    inputTokens: {
      type: Number,
      required: true,
      default: 0
    },
    outputTokens: {
      type: Number,
      required: true,
      default: 0
    },
    totalTokens: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ITokenUsage>('TokenUsage', TokenUsageSchema);
