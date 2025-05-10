"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialProcessingStatus = exports.MaterialCategory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Enumeração para categorias de materiais educativos
 */
var MaterialCategory;
(function (MaterialCategory) {
    MaterialCategory["GENERAL_HEALTH"] = "general_health";
    MaterialCategory["NUTRITION"] = "nutrition";
    MaterialCategory["ENDOCRINOLOGY"] = "endocrinology";
    MaterialCategory["GYNECOLOGY"] = "gynecology";
    MaterialCategory["FERTILITY"] = "fertility";
    MaterialCategory["TRADITIONAL_MEDICINE"] = "traditional_medicine";
    MaterialCategory["FUNCTIONAL_MEDICINE"] = "functional_medicine";
    MaterialCategory["NATUROPATHY"] = "naturopathy";
    MaterialCategory["ACADEMIC_PAPER"] = "academic_paper";
    MaterialCategory["CLINICAL_GUIDELINE"] = "clinical_guideline";
    MaterialCategory["BOOK_EXCERPT"] = "book_excerpt";
    MaterialCategory["OTHER"] = "other";
})(MaterialCategory || (exports.MaterialCategory = MaterialCategory = {}));
/**
 * Enumeração para status de processamento de materiais
 */
var MaterialProcessingStatus;
(function (MaterialProcessingStatus) {
    MaterialProcessingStatus["PENDING"] = "pending";
    MaterialProcessingStatus["PROCESSING"] = "processing";
    MaterialProcessingStatus["INDEXED"] = "indexed";
    MaterialProcessingStatus["FAILED"] = "failed";
})(MaterialProcessingStatus || (exports.MaterialProcessingStatus = MaterialProcessingStatus = {}));
/**
 * Schema para o modelo de Material
 */
const MaterialSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    lastIndexed: {
        type: Date
    }
}, {
    timestamps: true
});
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
const Material = mongoose_1.default.models.Material || mongoose_1.default.model('Material', MaterialSchema);
exports.default = Material;
