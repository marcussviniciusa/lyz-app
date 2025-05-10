import mongoose, { Document, Schema } from 'mongoose';

/**
 * Enumeração para categorias de materiais educativos
 */
export enum MaterialCategory {
  GENERAL_HEALTH = 'general_health',
  NUTRITION = 'nutrition',
  ENDOCRINOLOGY = 'endocrinology',
  GYNECOLOGY = 'gynecology',
  FERTILITY = 'fertility',
  TRADITIONAL_MEDICINE = 'traditional_medicine',
  FUNCTIONAL_MEDICINE = 'functional_medicine',
  NATUROPATHY = 'naturopathy',
  ACADEMIC_PAPER = 'academic_paper',
  CLINICAL_GUIDELINE = 'clinical_guideline',
  BOOK_EXCERPT = 'book_excerpt',
  OTHER = 'other'
}

/**
 * Enumeração para status de processamento de materiais
 */
export enum MaterialProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  INDEXED = 'indexed',
  FAILED = 'failed'
}

/**
 * Interface para o modelo de Material
 */
export interface IMaterial extends Document {
  title: string;
  description: string;
  category: MaterialCategory;
  tags: string[];
  author: string;
  publicationDate?: Date;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  contentType: string;
  textContent?: string;
  processingStatus: MaterialProcessingStatus;
  uploadedBy: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  isPublic: boolean;
  metadata: Record<string, any>;
  lastIndexed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema para o modelo de Material
 */
const MaterialSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: Object.values(MaterialCategory),
      required: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    author: {
      type: String,
      required: true
    },
    publicationDate: {
      type: Date
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      required: true
    },
    textContent: {
      type: String
    },
    processingStatus: {
      type: String,
      enum: Object.values(MaterialProcessingStatus),
      default: MaterialProcessingStatus.PENDING
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    lastIndexed: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Índices para melhorar a performance das consultas
MaterialSchema.index({ company: 1, category: 1 });
MaterialSchema.index({ tags: 1 });
MaterialSchema.index({ processingStatus: 1 });
MaterialSchema.index({ 
  title: 'text', 
  description: 'text', 
  author: 'text',
  textContent: 'text'
});

// Verificar se o modelo já existe para evitar OverwriteModelError
const Material = mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);

export default Material;
