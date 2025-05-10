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
exports.ProfessionType = exports.PlanStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var PlanStatus;
(function (PlanStatus) {
    PlanStatus["DRAFT"] = "draft";
    PlanStatus["IN_PROGRESS"] = "in_progress";
    PlanStatus["COMPLETED"] = "completed";
    PlanStatus["ARCHIVED"] = "archived";
})(PlanStatus || (exports.PlanStatus = PlanStatus = {}));
var ProfessionType;
(function (ProfessionType) {
    ProfessionType["MEDICAL"] = "medical_nutritionist";
    ProfessionType["OTHER"] = "other_professional";
})(ProfessionType || (exports.ProfessionType = ProfessionType = {}));
const PlanSchema = new mongoose_1.Schema({
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    professionType: {
        type: String,
        enum: Object.values(ProfessionType),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(PlanStatus),
        default: PlanStatus.DRAFT
    },
    patientData: {
        fullName: { type: String, required: true },
        birthDate: { type: Date, required: true },
        profession: { type: String, required: true },
        mainReason: { type: String, required: true },
        initialObservations: { type: String }
    },
    menstrualHistory: {
        symptoms: { type: [String] },
        notes: { type: String }
    },
    gestationalHistory: {
        details: { type: String }
    },
    healthHistory: {
        details: { type: String }
    },
    familyHistory: {
        details: { type: String }
    },
    lifestyleHabits: {
        details: { type: String }
    },
    exams: [{
            name: { type: String, required: true },
            date: { type: Date, required: true },
            results: { type: mongoose_1.Schema.Types.Mixed, required: true },
            observations: { type: String },
            fileIds: { type: [String] }
        }],
    tcmObservations: {
        facial: {
            faceColor: { type: String },
            skinGlow: { type: String },
            spots: { type: String },
            eyeCharacteristics: { type: String },
            lipsAndMouth: { type: String }
        },
        tongue: {
            bodyColor: { type: String },
            coatingThickness: { type: String },
            coatingColor: { type: String },
            shape: { type: String },
            marksOrCracks: { type: String },
            moistureLevel: { type: String }
        },
        pulse: {
            quality: { type: String },
            strength: { type: String },
            rhythm: { type: String },
            positions: { type: mongoose_1.Schema.Types.Mixed }
        },
        energetic: {
            deficiencyExcess: { type: String },
            elementImbalances: { type: String },
            otherSigns: { type: String }
        }
    },
    timeline: [{
            date: { type: Date, required: true },
            type: { type: String, required: true },
            description: { type: String, required: true },
            duration: { type: String },
            impact: { type: Number, min: 1, max: 10 },
            menstrualRelation: { type: String }
        }],
    ifmMatrix: {
        assimilation: {
            antecedents: { type: String },
            triggers: { type: String },
            mediators: { type: String }
        },
        defense: {
            antecedents: { type: String },
            triggers: { type: String },
            mediators: { type: String }
        },
        energy: {
            antecedents: { type: String },
            triggers: { type: String },
            mediators: { type: String }
        },
        biotransformation: {
            antecedents: { type: String },
            triggers: { type: String },
            mediators: { type: String }
        },
        transport: {
            antecedents: { type: String },
            triggers: { type: String },
            mediators: { type: String }
        },
        communication: {
            antecedents: { type: String },
            triggers: { type: String },
            mediators: { type: String }
        },
        structure: {
            antecedents: { type: String },
            triggers: { type: String },
            mediators: { type: String }
        }
    },
    planContent: {
        caseSummary: { type: String },
        symptomCorrelations: { type: String },
        generalNutritionalPlan: { type: String },
        cyclicalNutritionalPlan: {
            follicular: { type: String },
            ovulatory: { type: String },
            luteal: { type: String },
            menstrual: { type: String }
        },
        recommendedSupplements: { type: String },
        additionalExams: { type: String },
        lifestyleGuidelines: { type: String },
        followUpSchedule: { type: String }
    },
    sharedLink: { type: String },
    sharedLinkExpiry: { type: Date },
    viewCount: { type: Number, default: 0 }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('Plan', PlanSchema);
