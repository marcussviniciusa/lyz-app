import mongoose, { Document } from 'mongoose';
export declare enum PromptType {
    EXAM_ANALYSIS = "exam_analysis",
    TCM_ANALYSIS = "tcm_analysis",
    IFM_MATRIX = "ifm_matrix",
    PLAN_GENERATION = "plan_generation"
}
export interface IPrompt extends Document {
    type: PromptType;
    name: string;
    content: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPrompt, {}, {}, {}, mongoose.Document<unknown, {}, IPrompt, {}> & IPrompt & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
