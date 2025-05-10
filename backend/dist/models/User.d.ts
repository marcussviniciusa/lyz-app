import mongoose, { Document } from 'mongoose';
export declare enum UserRole {
    SUPERADMIN = "superadmin",
    USER = "user"
}
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    company: mongoose.Types.ObjectId;
    isActive: boolean;
    lastLogin: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
