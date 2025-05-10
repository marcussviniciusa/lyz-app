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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPromptActive = exports.deletePrompt = exports.updatePrompt = exports.createPrompt = exports.getPromptById = exports.getAllPrompts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Prompt_1 = __importStar(require("../models/Prompt"));
/**
 * Get all prompts
 */
const getAllPrompts = async (req, res) => {
    try {
        const prompts = await Prompt_1.default.find();
        res.status(200).json({
            status: 'success',
            results: prompts.length,
            data: {
                prompts
            }
        });
    }
    catch (error) {
        console.error('Error getting prompts:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching prompts'
        });
    }
};
exports.getAllPrompts = getAllPrompts;
/**
 * Get prompt by ID
 */
const getPromptById = async (req, res) => {
    try {
        const promptId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(promptId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid prompt ID format'
            });
            return;
        }
        const prompt = await Prompt_1.default.findById(promptId);
        if (!prompt) {
            res.status(404).json({
                status: 'error',
                message: 'Prompt not found'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                prompt
            }
        });
    }
    catch (error) {
        console.error('Error getting prompt:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching the prompt'
        });
    }
};
exports.getPromptById = getPromptById;
/**
 * Create a new prompt
 */
const createPrompt = async (req, res) => {
    try {
        const { type, name, content } = req.body;
        // Validate required fields
        if (!type || !name || !content) {
            res.status(400).json({
                status: 'error',
                message: 'Type, name, and content are required fields'
            });
            return;
        }
        // Validate prompt type
        if (!Object.values(Prompt_1.PromptType).includes(type)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid prompt type'
            });
            return;
        }
        // Create prompt
        const newPrompt = new Prompt_1.default({
            type,
            name,
            content,
            isActive: true
        });
        await newPrompt.save();
        res.status(201).json({
            status: 'success',
            data: {
                prompt: newPrompt
            }
        });
    }
    catch (error) {
        console.error('Error creating prompt:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while creating the prompt'
        });
    }
};
exports.createPrompt = createPrompt;
/**
 * Update an existing prompt
 */
const updatePrompt = async (req, res) => {
    try {
        const promptId = req.params.id;
        const { type, name, content, isActive } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(promptId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid prompt ID format'
            });
            return;
        }
        // Find the prompt
        const prompt = await Prompt_1.default.findById(promptId);
        if (!prompt) {
            res.status(404).json({
                status: 'error',
                message: 'Prompt not found'
            });
            return;
        }
        // Validate prompt type if provided
        if (type && !Object.values(Prompt_1.PromptType).includes(type)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid prompt type'
            });
            return;
        }
        // Update fields
        if (type)
            prompt.type = type;
        if (name)
            prompt.name = name;
        if (content)
            prompt.content = content;
        if (isActive !== undefined)
            prompt.isActive = isActive;
        await prompt.save();
        res.status(200).json({
            status: 'success',
            data: {
                prompt
            }
        });
    }
    catch (error) {
        console.error('Error updating prompt:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating the prompt'
        });
    }
};
exports.updatePrompt = updatePrompt;
/**
 * Delete a prompt
 */
const deletePrompt = async (req, res) => {
    try {
        const promptId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(promptId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid prompt ID format'
            });
            return;
        }
        const result = await Prompt_1.default.findByIdAndDelete(promptId);
        if (!result) {
            res.status(404).json({
                status: 'error',
                message: 'Prompt not found'
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Prompt deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting prompt:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting the prompt'
        });
    }
};
exports.deletePrompt = deletePrompt;
/**
 * Set a prompt as active and all others of the same type as inactive
 */
const setPromptActive = async (req, res) => {
    try {
        const promptId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(promptId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid prompt ID format'
            });
            return;
        }
        // Find the prompt
        const prompt = await Prompt_1.default.findById(promptId);
        if (!prompt) {
            res.status(404).json({
                status: 'error',
                message: 'Prompt not found'
            });
            return;
        }
        // Deactivate all prompts of the same type
        await Prompt_1.default.updateMany({ type: prompt.type, _id: { $ne: promptId } }, { isActive: false });
        // Activate the selected prompt
        prompt.isActive = true;
        await prompt.save();
        res.status(200).json({
            status: 'success',
            message: 'Prompt set as active successfully',
            data: {
                prompt
            }
        });
    }
    catch (error) {
        console.error('Error setting prompt as active:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while setting the prompt as active'
        });
    }
};
exports.setPromptActive = setPromptActive;
