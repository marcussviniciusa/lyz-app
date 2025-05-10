import mongoose, { Document } from 'mongoose';
export interface IPlanVersion extends Document {
    planId: mongoose.Types.ObjectId;
    versionNumber: number;
    creator: mongoose.Types.ObjectId;
    company: mongoose.Types.ObjectId;
    createdAt: Date;
    snapshot: any;
    changeDescription: string;
    changedSections: string[];
}
declare const _default: mongoose.Model<IPlanVersion, {}, {}, {}, mongoose.Document<unknown, {}, IPlanVersion, {}> & IPlanVersion & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
