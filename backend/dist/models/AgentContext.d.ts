import mongoose, { Document } from 'mongoose';
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
declare const AgentContext: mongoose.Model<any, {}, {}, {}, any, any>;
export default AgentContext;
