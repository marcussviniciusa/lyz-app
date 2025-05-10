import mongoose, { Document } from 'mongoose';
/**
 * Enumeração para categorias de materiais educativos
 */
export declare enum MaterialCategory {
    GENERAL_HEALTH = "general_health",
    NUTRITION = "nutrition",
    ENDOCRINOLOGY = "endocrinology",
    GYNECOLOGY = "gynecology",
    FERTILITY = "fertility",
    TRADITIONAL_MEDICINE = "traditional_medicine",
    FUNCTIONAL_MEDICINE = "functional_medicine",
    NATUROPATHY = "naturopathy",
    ACADEMIC_PAPER = "academic_paper",
    CLINICAL_GUIDELINE = "clinical_guideline",
    BOOK_EXCERPT = "book_excerpt",
    OTHER = "other"
}
/**
 * Enumeração para status de processamento de materiais
 */
export declare enum MaterialProcessingStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    INDEXED = "indexed",
    FAILED = "failed"
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
declare const Material: mongoose.Model<any, {}, {}, {}, any, any>;
export default Material;
