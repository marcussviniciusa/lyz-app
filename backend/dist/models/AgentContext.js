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
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Schema para o modelo de contexto do agente
 */
const AgentContextSchema = new mongoose_1.Schema({
    agent: {
        type: String,
        required: true,
        enum: ['exam_analysis', 'tcm_analysis', 'ifm_analysis', 'plan_generation'],
        index: true
    },
    plan: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true,
        index: true
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    context: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
// Índice composto para buscar pelo agente e plano juntos
AgentContextSchema.index({ agent: 1, plan: 1 }, { unique: true });
// Modelo para contexto do agente
// Verificar se o modelo já existe para evitar OverwriteModelError
const AgentContext = mongoose_1.default.models.AgentContext || mongoose_1.default.model('AgentContext', AgentContextSchema);
exports.default = AgentContext;
