import mongoose, { Schema, Document } from 'mongoose';
import { IPlan, PlanStatus, ProfessionType } from './Plan';

export interface IPlanVersion extends Document {
  planId: mongoose.Types.ObjectId;
  versionNumber: number;
  creator: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  createdAt: Date;
  snapshot: any; // Contém um snapshot completo do plano naquela versão
  changeDescription: string; // Descrição da mudança
  changedSections: string[]; // Seções que foram alteradas
}

const PlanVersionSchema: Schema = new Schema(
  {
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
      index: true
    },
    versionNumber: {
      type: Number,
      required: true
    },
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
    snapshot: {
      type: Schema.Types.Mixed,
      required: true
    },
    changeDescription: {
      type: String,
      required: true
    },
    changedSections: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Índice composto para planId e versionNumber
PlanVersionSchema.index({ planId: 1, versionNumber: 1 }, { unique: true });

export default mongoose.model<IPlanVersion>('PlanVersion', PlanVersionSchema);
