import mongoose, { Document } from 'mongoose';
export declare enum UsageType {
    EXAM_ANALYSIS = "exam_analysis",
    TCM_ANALYSIS = "tcm_analysis",
    IFM_MATRIX = "ifm_matrix",
    PLAN_GENERATION = "plan_generation",
    PLAN_REFINEMENT = "plan_refinement",
    OTHER = "other"
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
declare const _default: mongoose.Model<ITokenUsage, {}, {}, {}, mongoose.Document<unknown, {}, ITokenUsage, {}> & ITokenUsage & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
