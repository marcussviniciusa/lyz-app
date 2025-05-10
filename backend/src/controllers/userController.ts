import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { UserRole, IUser } from '../models/User';
import Company from '../models/Company';

// Get all users with pagination and filters
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const companyId = req.query.company as string;
    const role = req.query.role as string;
    const isActive = req.query.isActive as string;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    
    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      query.company = companyId;
    }
    
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .populate('company', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching users'
    });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format'
      });
      return;
    }
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('company', 'name');
    
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching user details'
    });
  }
};

// Create new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, company, isActive } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !company) {
      res.status(400).json({
        status: 'error',
        message: 'Name, email, password, and company are required fields'
      });
      return;
    }
    
    // Validate company ID
    if (!mongoose.Types.ObjectId.isValid(company)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid company ID format'
      });
      return;
    }
    
    // Check if company exists
    const companyExists = await Company.findById(company);
    
    if (!companyExists) {
      res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
      return;
    }
    
    // Check if company is active
    if (!companyExists.isActive) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot create user for inactive company'
      });
      return;
    }
    
    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
      return;
    }
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role: role || UserRole.USER,
      company,
      isActive: isActive === undefined ? true : isActive
    });
    
    await newUser.save();
    
    // Remove password from response
    const userResponse = newUser.toObject();
    const userResponseWithoutPassword = { ...userResponse };
    if ('password' in userResponseWithoutPassword) {
      delete (userResponseWithoutPassword as any).password;
    }
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating user'
    });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const { name, email, role, company, isActive } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format'
      });
      return;
    }
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }
    
    // If email is being updated, check if it's unique
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        res.status(400).json({
          status: 'error',
          message: 'User with this email already exists'
        });
        return;
      }
    }
    
    // If company is being updated, validate it
    if (company && company !== user.company.toString()) {
      if (!mongoose.Types.ObjectId.isValid(company)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid company ID format'
        });
        return;
      }
      
      const companyExists = await Company.findById(company);
      
      if (!companyExists) {
        res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
        return;
      }
      
      if (!companyExists.isActive) {
        res.status(400).json({
          status: 'error',
          message: 'Cannot assign user to inactive company'
        });
        return;
      }
    }
    
    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && Object.values(UserRole).includes(role as UserRole)) user.role = role as UserRole;
    if (company) user.company = new mongoose.Types.ObjectId(company);
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    const userResponseWithoutPassword = { ...userResponse };
    if ('password' in userResponseWithoutPassword) {
      delete (userResponseWithoutPassword as any).password;
    }
    
    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating user'
    });
  }
};

// Delete user (soft delete by setting isActive to false)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format'
      });
      return;
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }
    
    // Prevent deletion of last superadmin
    if (user.role === UserRole.SUPERADMIN) {
      const superadminCount = await User.countDocuments({ 
        role: UserRole.SUPERADMIN,
        isActive: true
      });
      
      if (superadminCount <= 1) {
        res.status(400).json({
          status: 'error',
          message: 'Cannot delete the last active superadmin user'
        });
        return;
      }
    }
    
    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deactivating user'
    });
  }
};
