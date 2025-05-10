import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Prompt, { PromptType } from '../models/Prompt';

/**
 * Get all prompts
 */
export const getAllPrompts = async (req: Request, res: Response): Promise<void> => {
  try {
    const prompts = await Prompt.find();

    res.status(200).json({
      status: 'success',
      results: prompts.length,
      data: {
        prompts
      }
    });
  } catch (error) {
    console.error('Error getting prompts:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching prompts'
    });
  }
};

/**
 * Get prompt by ID
 */
export const getPromptById = async (req: Request, res: Response): Promise<void> => {
  try {
    const promptId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(promptId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid prompt ID format'
      });
      return;
    }

    const prompt = await Prompt.findById(promptId);

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
  } catch (error) {
    console.error('Error getting prompt:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching the prompt'
    });
  }
};

/**
 * Create a new prompt
 */
export const createPrompt = async (req: Request, res: Response): Promise<void> => {
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
    if (!Object.values(PromptType).includes(type as PromptType)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid prompt type'
      });
      return;
    }

    // Create prompt
    const newPrompt = new Prompt({
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
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating the prompt'
    });
  }
};

/**
 * Update an existing prompt
 */
export const updatePrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const promptId = req.params.id;
    const { type, name, content, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(promptId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid prompt ID format'
      });
      return;
    }

    // Find the prompt
    const prompt = await Prompt.findById(promptId);

    if (!prompt) {
      res.status(404).json({
        status: 'error',
        message: 'Prompt not found'
      });
      return;
    }

    // Validate prompt type if provided
    if (type && !Object.values(PromptType).includes(type as PromptType)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid prompt type'
      });
      return;
    }

    // Update fields
    if (type) prompt.type = type as PromptType;
    if (name) prompt.name = name;
    if (content) prompt.content = content;
    if (isActive !== undefined) prompt.isActive = isActive;

    await prompt.save();

    res.status(200).json({
      status: 'success',
      data: {
        prompt
      }
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the prompt'
    });
  }
};

/**
 * Delete a prompt
 */
export const deletePrompt = async (req: Request, res: Response): Promise<void> => {
  try {
    const promptId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(promptId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid prompt ID format'
      });
      return;
    }

    const result = await Prompt.findByIdAndDelete(promptId);

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
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting the prompt'
    });
  }
};

/**
 * Set a prompt as active and all others of the same type as inactive
 */
export const setPromptActive = async (req: Request, res: Response): Promise<void> => {
  try {
    const promptId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(promptId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid prompt ID format'
      });
      return;
    }

    // Find the prompt
    const prompt = await Prompt.findById(promptId);

    if (!prompt) {
      res.status(404).json({
        status: 'error',
        message: 'Prompt not found'
      });
      return;
    }

    // Deactivate all prompts of the same type
    await Prompt.updateMany(
      { type: prompt.type, _id: { $ne: promptId } },
      { isActive: false }
    );

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
  } catch (error) {
    console.error('Error setting prompt as active:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while setting the prompt as active'
    });
  }
};
