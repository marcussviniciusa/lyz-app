import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface para o modelo de contexto do agente
 */
export interface IAgentContext extends Document {
  agent: string;
  plan: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  context: Record<string, any>;
  lastUpdated: Date;
  createdAt: Date;
}

/**
 * Schema para o modelo de contexto do agente
 */
const AgentContextSchema = new Schema<IAgentContext>(
  {
    agent: {
      type: String,
      required: true,
      enum: ['exam_analysis', 'tcm_analysis', 'ifm_analysis', 'plan_generation'],
      index: true
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
      index: true
    },
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
    context: {
      type: Schema.Types.Mixed,
      default: {}
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Índice composto para buscar pelo agente e plano juntos
AgentContextSchema.index({ agent: 1, plan: 1 }, { unique: true });

// Modelo para contexto do agente
// Verificar se o modelo já existe para evitar OverwriteModelError
const AgentContext = mongoose.models.AgentContext || mongoose.model<IAgentContext>('AgentContext', AgentContextSchema);

export default AgentContext;
