import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  usageLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    usageLimit: {
      type: Number,
      default: 1000 // Default token limit
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

export default mongoose.model<ICompany>('Company', CompanySchema);
