import mongoose, { Schema, Document } from 'mongoose';

export enum PromptType {
  EXAM_ANALYSIS = 'exam_analysis',
  TCM_ANALYSIS = 'tcm_analysis',
  IFM_MATRIX = 'ifm_matrix',
  PLAN_GENERATION = 'plan_generation'
}

export interface IPrompt extends Document {
  type: PromptType;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromptSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(PromptType),
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IPrompt>('Prompt', PromptSchema);
