import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Company, { ICompany } from '../models/Company';

// Get all companies
export const getAllCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    
    res.status(200).json({
      status: 'success',
      results: companies.length,
      data: {
        companies
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching companies'
    });
  }
};

// Get company by ID
export const getCompanyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid company ID format'
      });
      return;
    }
    
    const company = await Company.findById(companyId);
    
    if (!company) {
      res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
      return;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        company
      }
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching company details'
    });
  }
};

// Create new company
export const createCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, usageLimit } = req.body;
    
    if (!name) {
      res.status(400).json({
        status: 'error',
        message: 'Company name is required'
      });
      return;
    }
    
    // Check if company already exists
    const existingCompany = await Company.findOne({ name });
    
    if (existingCompany) {
      res.status(400).json({
        status: 'error',
        message: 'A company with this name already exists'
      });
      return;
    }
    
    // Create new company
    const newCompany = new Company({
      name,
      usageLimit: usageLimit || 1000,
      isActive: true
    });
    
    await newCompany.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Company created successfully',
      data: {
        company: newCompany
      }
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating company'
    });
  }
};

// Update company
export const updateCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.params.id;
    const { name, usageLimit, isActive } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid company ID format'
      });
      return;
    }
    
    // Check if company exists
    const company = await Company.findById(companyId);
    
    if (!company) {
      res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
      return;
    }
    
    // If name is being updated, check if it's unique
    if (name && name !== company.name) {
      const existingCompany = await Company.findOne({ name });
      
      if (existingCompany) {
        res.status(400).json({
          status: 'error',
          message: 'A company with this name already exists'
        });
        return;
      }
    }
    
    // Update company fields
    if (name) company.name = name;
    if (usageLimit !== undefined) company.usageLimit = usageLimit;
    if (isActive !== undefined) company.isActive = isActive;
    
    await company.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Company updated successfully',
      data: {
        company
      }
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating company'
    });
  }
};

// Delete company (soft delete by setting isActive to false)
export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid company ID format'
      });
      return;
    }
    
    // Check if company exists
    const company = await Company.findById(companyId);
    
    if (!company) {
      res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
      return;
    }
    
    // Soft delete by setting isActive to false
    company.isActive = false;
    await company.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Company deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating company:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deactivating company'
    });
  }
};
